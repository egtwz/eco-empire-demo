import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gameAPI } from '../api/gameApi';
import { SEEDS, SeedId } from '../data/seeds';
import { FRUITS } from '../data/fruits';

export interface Cell {
  id: number;
  seed?: SeedId;
  plantedAt?: number; // epoch ms
  status: 'empty' | 'growing' | 'ready';
}

export interface InventoryItem {
  id: string; // seedId or fruitId
  name: string;
  type: 'seed' | 'fruit';
  emoji: string;
  count: number;
}

export interface GameState {
  field: Cell[];
  inventory: InventoryItem[];
  balance: number;
  fieldLevel: number; // 0=5x5, 1=6x6, 2=7x7, 3=8x8
  level: number; // 1-10
  xp: number;
  totalEarned: number;
  totalSpent: number;
  seedsPlanted: number;
  fruitsHarvested: number;
  hybridsCreated: number;
  playTime: number; // в секундах
  username: string;
  playerId: string;
  subscription: 'none' | 'plus' | 'premium';
  title: string;
  activeCraft: {
    recipeId: string;
    startTime: number;
    ingredients: { id: string; type: 'seed' | 'fruit'; count: number }[];
  } | null;
}

export type View = 'field' | 'shop' | 'inventory' | 'exchange' | 'profile';

const FIELD_SIZE = 25; // 5x5
const START_BALANCE = 100;

// Система уровней (6 уровней)
const LEVEL_THRESHOLDS = [
  500,      // 1 -> 2
  2000,     // 2 -> 3 (суммарно от 0)
  10000,    // 3 -> 4
  25000,    // 4 -> 5
  100000,   // 5 -> 6
];
const MAX_LEVEL = 6;

const RARITY_XP = {
  common: 1,
  uncommon: 2,
  rare: 4,
  epic: 8,
  legendary: 16
};

function getRequiredXP(level: number): number {
  if (level >= MAX_LEVEL) return Infinity; // на макс уровне XP не требуется
  return LEVEL_THRESHOLDS[level - 1];
}

function getXPForRarity(rarity: string): number {
  return RARITY_XP[rarity as keyof typeof RARITY_XP] || 1;
}

function generatePlayerId(): string {
  return 'ECO' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

const FIELD_UPGRADES = [
  { level: 1, size: 36, cost: 10000 }, // 6x6
  { level: 2, size: 49, cost: 100000 }, // 7x7
  { level: 3, size: 64, cost: 10000000 }, // 8x8
];

function createEmptyField(size: number = FIELD_SIZE): Cell[] {
  return Array.from({ length: size }, (_, i) => ({ id: i, status: 'empty' as const }));
}

function now() {
  return Date.now();
}

function getItem(inventory: InventoryItem[], id: string) {
  return inventory.find((i) => i.id === id);
}

function setItem(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const exists = inventory.some((i) => i.id === item.id);
  if (exists) {
    return inventory.map((i) => (i.id === item.id ? item : i));
  }
  return [...inventory, item];
}

function addCount(inventory: InventoryItem[], id: string, delta: number, fallback: InventoryItem): InventoryItem[] {
  const found = getItem(inventory, id);
  if (!found) {
    if (delta <= 0) return inventory;
    return [...inventory, { ...fallback, count: delta }];
  }
  const next = { ...found, count: Math.max(0, found.count + delta) };
  return setItem(inventory, next).filter((i) => i.count > 0);
}

export function useGameLogic(tgId?: number) {
  const [state, setState] = useState<GameState>(() => { 
    return { 
      field: createEmptyField(), 
      inventory: [], 
      balance: START_BALANCE, 
      fieldLevel: 0,
      level: 1,
      xp: 0,
      totalEarned: 0,
      totalSpent: 0,
      seedsPlanted: 0,
      fruitsHarvested: 0,
      hybridsCreated: 0,
      playTime: 0,
      username: 'Игрок',
      playerId: generatePlayerId(),
      subscription: 'none',
      title: '',
      activeCraft: null
    };
  });

  const [view, setView] = useState<View>('field');
  const [seedSelectForCell, setSeedSelectForCell] = useState<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize API with Telegram ID
  useEffect(() => {
    if (tgId) {
      gameAPI.init(tgId);
      // Load user data from API
      gameAPI.getUserData().then(saved => {
        if (saved) {
          const fieldLevel = saved.fieldLevel ?? 0;
          const restoredField: Cell[] = (saved.field as Cell[]).map((cell) => {
            if (cell.status === 'growing' && cell.seed && cell.plantedAt) {
              const growMs = SEEDS[cell.seed].growSeconds * 1000;
              if (now() - cell.plantedAt >= growMs) {
                return { ...cell, status: 'ready' as const };
              }
            }
            return cell;
          });
          setState({ 
            field: restoredField, 
            inventory: saved.inventory || [], 
            balance: saved.balance ?? START_BALANCE, 
            fieldLevel: fieldLevel,
            level: saved.level ?? 1,
            xp: saved.xp ?? 0,
            totalEarned: saved.totalEarned ?? 0,
            totalSpent: saved.totalSpent ?? 0,
            seedsPlanted: saved.seedsPlanted ?? 0,
            fruitsHarvested: saved.fruitsHarvested ?? 0,
            hybridsCreated: saved.hybridsCreated ?? 0,
            playTime: saved.playTime ?? 0,
            username: saved.username ?? 'Игрок',
            playerId: saved.playerId ?? generatePlayerId(),
            subscription: saved.subscription ?? 'none',
          title: (saved as any).title ?? '',
            activeCraft: saved.activeCraft ?? null
          });
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [tgId]);

  // Persist on changes locally
  useEffect(() => {
    if (!isLoading && tgId) {
      gameAPI.saveUserData(state);
    }
  }, [state, isLoading, tgId]);

  // Timer to progress growing cells to ready and update play time
  useEffect(() => {
    const interval = window.setInterval(() => {
      setState((prev) => {
        let changed = false;
        const nextField = prev.field.map((cell) => {
          if (cell.status === 'growing' && cell.seed && cell.plantedAt) {
            const growMs = SEEDS[cell.seed].growSeconds * 1000;
            if (now() - cell.plantedAt >= growMs) {
              changed = true;
              return { ...cell, status: 'ready' as const };
            }
          }
          return cell;
        });
        return changed ? { ...prev, field: nextField, playTime: prev.playTime + 1 } : { ...prev, playTime: prev.playTime + 1 };
      });
    }, 1000); // Обновляем каждую секунду для игрового времени
    tickRef.current = interval;
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  const seedsInInventory = useMemo(() => state.inventory.filter((i) => i.type === 'seed' && i.count > 0), [state.inventory]);
  const fruitsInInventory = useMemo(() => state.inventory.filter((i) => i.type === 'fruit' && i.count > 0), [state.inventory]);

  const openSeedModal = useCallback((cellId: number) => {
    setSeedSelectForCell(cellId);
  }, []);

  const closeSeedModal = useCallback(() => setSeedSelectForCell(null), []);

  const plantSeed = useCallback((cellId: number, seedId: SeedId) => {
    setState((prev) => {
      const cell = prev.field[cellId];
      if (!cell || cell.status !== 'empty') return prev;
      const invItem = getItem(prev.inventory, seedId);
      if (!invItem || invItem.count <= 0) return prev;
      const plantedAt = now();
      const nextField = prev.field.map((c) => (c.id === cellId ? { id: cellId, seed: seedId, plantedAt, status: 'growing' as const } : c));
      const seedDef = SEEDS[seedId];
      const nextInv = addCount(prev.inventory, seedId, -1, {
        id: seedId,
        type: 'seed',
        name: seedDef.name,
        emoji: seedDef.emoji,
        count: 0,
      });
      return { 
        ...prev, 
        field: nextField, 
        inventory: nextInv,
        seedsPlanted: prev.seedsPlanted + 1
      };
    });
    setSeedSelectForCell(null);
  }, []);

  const harvest = useCallback((cellId: number) => {
    setState((prev) => {
      const cell = prev.field[cellId];
      if (!cell || cell.status !== 'ready' || !cell.seed) return prev;
      const fruitId = SEEDS[cell.seed].fruitId;
      const fruitDef = FRUITS[fruitId as keyof typeof FRUITS];
      const nextInv = addCount(prev.inventory, fruitId, 1, {
        id: fruitId,
        type: 'fruit',
        name: fruitDef.name,
        emoji: fruitDef.emoji,
        count: 0,
      });
      const nextField = prev.field.map((c) => (c.id === cellId ? { id: cellId, status: 'empty' as const } : c));
      
      // Получаем редкость семени для расчета XP
      const seedRarity = SEEDS[cell.seed].rarity;
      const xpGained = getXPForRarity(seedRarity);
      const newXP = prev.xp + xpGained;
      const requiredXP = getRequiredXP(prev.level);
      const newLevel = newXP >= requiredXP && prev.level < MAX_LEVEL ? prev.level + 1 : prev.level;
      const finalXP = newLevel > prev.level ? 0 : newXP; // при повышении уровня XP обнуляем, т.к. пороги абсолютные

      return { 
        ...prev, 
        field: nextField, 
        inventory: nextInv,
        fruitsHarvested: prev.fruitsHarvested + 1,
        xp: finalXP,
        level: newLevel
      };
    });
  }, []);

  const buySeed = useCallback((seedId: SeedId) => {
    setState((prev) => {
      const seed = SEEDS[seedId];
      if (prev.balance < seed.price) return prev;
      const nextBalance = prev.balance - seed.price;
      const nextInv = addCount(prev.inventory, seedId, 1, {
        id: seedId,
        type: 'seed',
        name: seed.name,
        emoji: seed.emoji,
        count: 0,
      });
      return { 
        ...prev, 
        balance: nextBalance, 
        inventory: nextInv,
        totalSpent: prev.totalSpent + seed.price
      };
    });
  }, []);

  const sellFruit = useCallback((fruitId: string, count: number) => {
    setState((prev) => {
      const fruit = FRUITS[fruitId as keyof typeof FRUITS];
      if (!fruit || count <= 0) return prev;
      const invItem = getItem(prev.inventory, fruitId);
      if (!invItem || invItem.count < count) return prev;
      const income = fruit.sellPrice * count;
      const nextInv = addCount(prev.inventory, fruitId, -count, {
        id: fruitId,
        type: 'fruit',
        name: fruit.name,
        emoji: fruit.emoji,
        count: 0,
      });
      return { 
        ...prev, 
        inventory: nextInv, 
        balance: prev.balance + income,
        totalEarned: prev.totalEarned + income
      };
    });
  }, []);

  const sellSeed = useCallback((seedId: string, count: number) => {
    setState((prev) => {
      const seed = SEEDS[seedId as keyof typeof SEEDS];
      if (!seed || count <= 0) return prev;
      const invItem = getItem(prev.inventory, seedId);
      if (!invItem || invItem.count < count) return prev;
      const income = Math.floor(seed.price * 0.5) * count; // 50% от стоимости
      const nextInv = addCount(prev.inventory, seedId, -count, {
        id: seedId,
        type: 'seed',
        name: seed.name,
        emoji: seed.emoji,
        count: 0,
      });
      return { 
        ...prev, 
        inventory: nextInv, 
        balance: prev.balance + income,
        totalEarned: prev.totalEarned + income
      };
    });
  }, []);

  const upgradeField = useCallback(() => {
    setState((prev) => {
      const nextLevel = prev.fieldLevel + 1;
      if (nextLevel > 3) return prev; // Максимальный уровень
      const upgrade = FIELD_UPGRADES[nextLevel - 1];
      if (prev.balance < upgrade.cost) return prev;
      
      const newSize = upgrade.size;
      const newField = createEmptyField(newSize);
      return { 
        ...prev, 
        field: newField, 
        balance: prev.balance - upgrade.cost, 
        fieldLevel: nextLevel 
      };
    });
  }, []);

  const clearProgress = useCallback(() => {
    setState({ 
      field: createEmptyField(), 
      inventory: [], 
      balance: START_BALANCE, 
      fieldLevel: 0,
      level: 1,
      xp: 0,
      totalEarned: 0,
      totalSpent: 0,
      seedsPlanted: 0,
      fruitsHarvested: 0,
      hybridsCreated: 0,
      playTime: 0,
      username: 'Игрок',
      playerId: generatePlayerId(),
      subscription: 'none',
      title: '',
      activeCraft: null
    });
  }, []);

  const updateUsername = useCallback((newUsername: string) => {
    setState(prev => ({ ...prev, username: newUsername }));
  }, []);

  const updateTitle = useCallback((newTitle: string) => {
    setState(prev => ({ ...prev, title: newTitle }));
  }, []);

  const getLevelProgress = useCallback(() => {
    const currentLevel = state.level;
    const currentXP = state.xp;
    const requiredXP = getRequiredXP(currentLevel);
    const progress = currentLevel >= MAX_LEVEL ? 100 : Math.min(100, (currentXP / requiredXP) * 100);
    return { currentLevel, currentXP, requiredXP, progress };
  }, [state.level, state.xp]);

  const startCraft = useCallback((recipeId: string, ingredients: { id: string; type: 'seed' | 'fruit'; count: number }[]) => {
    setState(prev => ({
      ...prev,
      activeCraft: {
        recipeId,
        startTime: now(),
        ingredients
      }
    }));
  }, []);

  const completeCraft = useCallback(() => {
    setState(prev => {
      if (!prev.activeCraft) return prev;
      
      const { HYBRID_RECIPES } = require('../data/hybrids');
      const recipe = HYBRID_RECIPES.find((r: any) => r.id === prev.activeCraft!.recipeId);
      if (!recipe) return prev;

      // Удаляем ингредиенты из инвентаря
      let newInventory = [...prev.inventory];
      prev.activeCraft.ingredients.forEach(ingredient => {
        newInventory = addCount(newInventory, ingredient.id, -ingredient.count, {
          id: ingredient.id,
          type: ingredient.type,
          name: ingredient.type === 'seed' ? SEEDS[ingredient.id as keyof typeof SEEDS]?.name || 'Unknown' : FRUITS[ingredient.id as keyof typeof FRUITS]?.name || 'Unknown',
          emoji: ingredient.type === 'seed' ? SEEDS[ingredient.id as keyof typeof SEEDS]?.emoji || '❓' : FRUITS[ingredient.id as keyof typeof FRUITS]?.emoji || '❓',
          count: 0,
        });
      });

      // Добавляем результат в инвентарь
      newInventory = addCount(newInventory, recipe.resultId, 1, {
        id: recipe.resultId,
        type: 'fruit',
        name: recipe.resultName,
        emoji: recipe.resultEmoji,
        count: 0,
      });

      return {
        ...prev,
        inventory: newInventory,
        activeCraft: null,
        hybridsCreated: prev.hybridsCreated + 1
      };
    });
  }, []);

  const getCraftProgress = useCallback(() => {
    if (!state.activeCraft) return null;
    
    const { HYBRID_RECIPES } = require('../data/hybrids');
    const recipe = HYBRID_RECIPES.find((r: any) => r.id === state.activeCraft!.recipeId);
    if (!recipe) return null;

    const elapsed = now() - state.activeCraft.startTime;
    const progress = Math.min(100, (elapsed / (recipe.craftTime * 1000)) * 100);
    const isComplete = elapsed >= recipe.craftTime * 1000;

    return { recipe, progress, isComplete, timeLeft: Math.max(0, recipe.craftTime - Math.floor(elapsed / 1000)) };
  }, [state.activeCraft]);

  const timeLeftForCell = useCallback((cell: Cell) => {
    if (cell.status !== 'growing' || !cell.seed || !cell.plantedAt) return 0;
    const growMs = SEEDS[cell.seed].growSeconds * 1000;
    return Math.max(0, growMs - (now() - cell.plantedAt));
  }, []);

  const getCurrentFieldSize = useCallback(() => {
    return state.fieldLevel === 0 ? 25 : FIELD_UPGRADES[state.fieldLevel - 1].size;
  }, [state.fieldLevel]);

  const getNextUpgrade = useCallback(() => {
    if (state.fieldLevel >= 3) return null;
    return FIELD_UPGRADES[state.fieldLevel];
  }, [state.fieldLevel]);

  return {
    state,
    view,
    setView,
    seedsInInventory,
    fruitsInInventory,
    openSeedModal,
    closeSeedModal,
    seedSelectForCell,
    plantSeed,
    harvest,
    buySeed,
    sellFruit,
    sellSeed,
    upgradeField,
    clearProgress,
    timeLeftForCell,
    getCurrentFieldSize,
    getNextUpgrade,
    updateUsername,
    updateTitle,
    getLevelProgress,
    startCraft,
    completeCraft,
    getCraftProgress,
  } as const;
}





