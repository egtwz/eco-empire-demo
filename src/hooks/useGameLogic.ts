import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gameAPI } from '../api/gameApi';
import { SEEDS, SeedId } from '../data/seeds';
import { FRUITS } from '../data/fruits';
import { HYBRID_RECIPES } from '../data/hybrids';
import { SYNTHESIS_PLANTS } from '../data/synthesis';
import { getSeedInfo, getFruitInfo } from '../utils/hybridUtils';

export interface Cell {
  id: number;
  seed?: string; // может быть SeedId или гибридное семя
  plantedAt?: number; // epoch ms
  status: 'empty' | 'growing' | 'ready';
  frozenUntil?: number; // epoch ms - заморожено до этого времени (для синтеза)
}

export interface InventoryItem {
  id: string; // seedId or fruitId
  name: string;
  type: 'seed' | 'fruit' | 'booster';
  emoji: string;
  count: number;
}

export interface GameState {
  field: Cell[];
  inventory: InventoryItem[];
  balance: number;
  tonBalance: number;
  fieldLevel: number; // 0=3x3, 1=4x4, 2=5x5, 3=6x6, 4=7x7, 5=8x8 (МАКСИМУМ)
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
  craftDraft?: {
    recipeId: string;
    addedIngredients: { index: number; id: string; type: 'seed' | 'fruit'; count: number }[];
  } | null;
  lastDailyClaim?: number; // epoch day number (UTC days)
  dailyStreak?: number; // consecutive claim days
  synthesisActive?: Array<{ cellId: number; plantId: string; startTime: number; willSucceed: boolean }>; // синтез активен
}

export type View = 'field' | 'shop' | 'inventory' | 'exchange' | 'profile';

const FIELD_SIZE = 9; // 3x3
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
  { level: 1, size: 16, cost: 5000 }, // 4x4
  { level: 2, size: 25, cost: 10000 }, // 5x5
  { level: 3, size: 36, cost: 20000 }, // 6x6
  { level: 4, size: 49, cost: 40000 }, // 7x7
  { level: 5, size: 64, cost: 80000 }, // 8x8 (МАКСИМУМ)
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
      tonBalance: 0,
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
      activeCraft: null,
      craftDraft: null,
      lastDailyClaim: undefined,
      dailyStreak: 0,
      synthesisActive: []
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
          const expectedSize = fieldLevel === 0 ? FIELD_SIZE : FIELD_UPGRADES[fieldLevel - 1].size;
          let restoredField: Cell[] = saved.field as Cell[];
          
          // Если размер поля изменился, пересоздаем поле
          if (restoredField.length !== expectedSize) {
            restoredField = createEmptyField(expectedSize);
          } else {
            restoredField = restoredField.map((cell) => {
              if (cell.status === 'growing' && cell.seed && cell.plantedAt) {
                const seedDef = getSeedInfo(cell.seed);
                if (seedDef) {
                  const growMs = seedDef.growSeconds * 1000;
                  if (now() - cell.plantedAt >= growMs) {
                    return { ...cell, status: 'ready' as const };
                  }
                }
              }
              return cell;
            });
          }
          setState({ 
            field: restoredField, 
            inventory: saved.inventory || [], 
            balance: saved.balance ?? START_BALANCE, 
            tonBalance: (saved as any).tonBalance ?? 0,
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
            activeCraft: saved.activeCraft ?? null,
            craftDraft: (saved as any).craftDraft ?? null,
            lastDailyClaim: (saved as any).lastDailyClaim,
            dailyStreak: (saved as any).dailyStreak ?? 0,
            synthesisActive: (saved as any).synthesisActive ?? []
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
          // Если клетка заморожена - не даем ей созреть
          if (cell.frozenUntil && now() < cell.frozenUntil) {
            return cell;
          }
          
          if (cell.status === 'growing' && cell.seed && cell.plantedAt) {
            const seedDef = getSeedInfo(cell.seed);
            if (seedDef) {
              const growMs = seedDef.growSeconds * 1000;
              if (now() - cell.plantedAt >= growMs) {
                changed = true;
                return { ...cell, status: 'ready' as const };
              }
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
  const boostersInInventory = useMemo(() => state.inventory.filter((i) => i.type === 'booster' && i.count > 0), [state.inventory]);

  const openSeedModal = useCallback((cellId: number) => {
    setSeedSelectForCell(cellId);
  }, []);

  const closeSeedModal = useCallback(() => setSeedSelectForCell(null), []);

  const plantSeed = useCallback((cellId: number, seedId: string) => {
    setState((prev) => {
      const cell = prev.field[cellId];
      if (!cell || cell.status !== 'empty') return prev;
      const invItem = getItem(prev.inventory, seedId);
      if (!invItem || invItem.count <= 0) return prev;
      
      const seedDef = getSeedInfo(seedId);
      if (!seedDef) {
        console.error('Seed not found:', seedId);
        return prev;
      }
      
      const plantedAt = now();
      const nextField = prev.field.map((c) => (c.id === cellId ? { id: cellId, seed: seedId, plantedAt, status: 'growing' as const } : c));
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
      
      const seedDef = getSeedInfo(cell.seed);
      if (!seedDef) {
        console.error('Seed not found during harvest:', cell.seed);
        return prev;
      }
      
      const fruitId = seedDef.fruitId;
      const fruitDef = getFruitInfo(fruitId);
      if (!fruitDef) {
        console.error('Fruit not found during harvest:', fruitId);
        return prev;
      }
      
      const nextInv = addCount(prev.inventory, fruitId, 1, {
        id: fruitId,
        type: 'fruit',
        name: fruitDef.name,
        emoji: fruitDef.emoji,
        count: 0,
      });
      const nextField = prev.field.map((c) => (c.id === cellId ? { id: cellId, status: 'empty' as const } : c));
      
      // Получаем редкость семени для расчета XP
      const seedRarity = seedDef.rarity;
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
      const fruit = getFruitInfo(fruitId);
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
      const seed = getSeedInfo(seedId);
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
      if (nextLevel > 8) return prev; // Максимальный уровень (11x11)
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

  // Boosters
  const addBooster = useCallback((id: 'booster_speedup', count: number) => {
    setState(prev => {
      const fallback: InventoryItem = { id, type: 'booster', name: 'Ускоритель роста', emoji: '⚡', count: 0 };
      const nextInv = addCount(prev.inventory, id, count, fallback);
      return { ...prev, inventory: nextInv };
    });
  }, []);

  const useBoosterSpeedup = useCallback(() => {
    setState(prev => {
      const inv = getItem(prev.inventory, 'booster_speedup');
      if (!inv || inv.count <= 0) return prev;
      // find first growing cell
      const idx = prev.field.findIndex(c => c.status === 'growing');
      if (idx === -1) return prev; // nothing to speed up
      const nextField = prev.field.map(c => c);
      nextField[idx] = { id: nextField[idx].id, seed: nextField[idx].seed, status: 'ready' as const };
      const nextInv = addCount(prev.inventory, 'booster_speedup', -1, { id: 'booster_speedup', type: 'booster', name: 'Ускоритель роста', emoji: '⚡', count: 0 });
      return { ...prev, field: nextField, inventory: nextInv };
    });
  }, []);

  // Daily rewards
  const getTodayDayNumber = () => Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const canClaimDaily = useCallback(() => {
    const today = getTodayDayNumber();
    return state.lastDailyClaim !== today;
  }, [state.lastDailyClaim]);

  const claimDaily = useCallback((plan?: { eco?: number; boosters?: number; seedRarity?: 'common'|'uncommon'|'rare'|'epic'|'legendary' }) => {
    setState(prev => {
      const today = getTodayDayNumber();
      if (prev.lastDailyClaim === today) return prev;
      const yesterday = today - 1;
      const nextStreak = prev.lastDailyClaim === yesterday ? (prev.dailyStreak ?? 0) + 1 : 1;

      const eco = plan?.eco ?? 50;
      const boosters = plan?.boosters ?? 1;
      const rarity = plan?.seedRarity ?? 'common';

      const seedKeys = Object.keys(SEEDS) as (keyof typeof SEEDS)[];
      const seedsByRarity = seedKeys.filter(k => SEEDS[k].rarity === rarity);
      const randomSeed = seedsByRarity[Math.floor(Math.random() * seedsByRarity.length)] ?? seedKeys[0];

      let nextInv = prev.inventory;
      if (boosters > 0) {
        nextInv = addCount(nextInv, 'booster_speedup', boosters, { id: 'booster_speedup', type: 'booster', name: 'Ускоритель роста', emoji: '⚡', count: 0 });
      }
      nextInv = addCount(nextInv, randomSeed, 1, { id: randomSeed, type: 'seed', name: SEEDS[randomSeed].name, emoji: SEEDS[randomSeed].emoji, count: 0 });

      return { ...prev, balance: prev.balance + eco, inventory: nextInv, lastDailyClaim: today, dailyStreak: nextStreak };
    });
  }, []);

  // Fortune Wheel helpers
  const addWheelSpins = useCallback((n: number) => {
    setState(prev => ({ ...prev, wheelSpins: Math.max(0, (prev.wheelSpins ?? 0) + n) }));
  }, []);

  const grantReward = useCallback((reward: { type: 'eco'|'booster'|'seed'; amount?: number; seedId?: string; seedRarity?: 'common'|'uncommon'|'rare'|'epic'|'legendary' }) => {
    setState(prev => {
      if (reward.type === 'eco') {
        const gain = reward.amount ?? 0;
        return { ...prev, balance: prev.balance + gain, totalEarned: prev.totalEarned + gain };
      }
      if (reward.type === 'booster') {
        const amt = reward.amount ?? 1;
        const nextInv = addCount(prev.inventory, 'booster_speedup', amt, { id: 'booster_speedup', type: 'booster', name: 'Ускоритель роста', emoji: '⚡', count: 0 });
        return { ...prev, inventory: nextInv };
      }
      // seed
      const rarity = reward.seedRarity ?? 'common';
      const seedKeys = Object.keys(SEEDS) as (keyof typeof SEEDS)[];
      const candidates = seedKeys.filter(k => SEEDS[k].rarity === rarity);
      const sid = reward.seedId ?? (candidates[Math.floor(Math.random() * Math.max(1, candidates.length))] || seedKeys[0]);
      const def = SEEDS[sid as keyof typeof SEEDS];
      const nextInv = addCount(prev.inventory, sid, reward.amount ?? 1, { id: sid, type: 'seed', name: def.name, emoji: def.emoji, count: 0 });
      return { ...prev, inventory: nextInv };
    });
  }, []);



  const clearProgress = useCallback(() => {
    setState({ 
      field: createEmptyField(), 
      inventory: [], 
      balance: START_BALANCE, 
      tonBalance: 0,
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
      activeCraft: null,
      craftDraft: null,
      lastDailyClaim: undefined,
      dailyStreak: 0
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

  const initCraftDraft = useCallback((recipeId: string) => {
    setState(prev => ({
      ...prev,
      craftDraft: {
        recipeId,
        addedIngredients: []
      }
    }));
  }, []);

  const addIngredientToCraft = useCallback((recipeId: string, index: number, ingredientId: string, ingredientType: 'seed' | 'fruit', count: number) => {
    setState(prev => {
      const existingDraft = prev.craftDraft?.recipeId === recipeId ? prev.craftDraft : { recipeId, addedIngredients: [] };
      const existingIngredient = existingDraft.addedIngredients.find(i => i.index === index);
      
      // Если ингредиент уже был добавлен, суммируем количество
      const totalCount = existingIngredient ? existingIngredient.count + count : count;
      
      // Удаляем из инвентаря только добавляемое количество
      let newInventory = addCount(prev.inventory, ingredientId, -count, {
        id: ingredientId,
        type: ingredientType,
        name: ingredientType === 'seed' ? SEEDS[ingredientId as keyof typeof SEEDS]?.name || 'Unknown' : FRUITS[ingredientId as keyof typeof FRUITS]?.name || 'Unknown',
        emoji: ingredientType === 'seed' ? SEEDS[ingredientId as keyof typeof SEEDS]?.emoji || '❓' : FRUITS[ingredientId as keyof typeof FRUITS]?.emoji || '❓',
        count: 0
      });

      // Добавляем в черновик с обновленным количеством
      const filteredIngredients = existingDraft.addedIngredients.filter(i => i.index !== index);
      
      return {
        ...prev,
        inventory: newInventory,
        craftDraft: {
          recipeId,
          addedIngredients: [...filteredIngredients, { index, id: ingredientId, type: ingredientType, count: totalCount }]
        }
      };
    });
  }, []);

  const cancelCraftDraft = useCallback(() => {
    setState(prev => {
      if (!prev.craftDraft) return prev;

      // Возвращаем все ингредиенты в инвентарь
      let newInventory = [...prev.inventory];
      prev.craftDraft.addedIngredients.forEach(ingredient => {
        newInventory = addCount(newInventory, ingredient.id, ingredient.count, {
          id: ingredient.id,
          type: ingredient.type,
          name: ingredient.type === 'seed' ? SEEDS[ingredient.id as keyof typeof SEEDS]?.name || 'Unknown' : FRUITS[ingredient.id as keyof typeof FRUITS]?.name || 'Unknown',
          emoji: ingredient.type === 'seed' ? SEEDS[ingredient.id as keyof typeof SEEDS]?.emoji || '❓' : FRUITS[ingredient.id as keyof typeof FRUITS]?.emoji || '❓',
          count: 0
        });
      });

      return {
        ...prev,
        inventory: newInventory,
        craftDraft: null
      };
    });
  }, []);

  const startCraft = useCallback((recipeId: string, ingredients: { id: string; type: 'seed' | 'fruit'; count: number }[]) => {
    setState(prev => {
      const recipe = HYBRID_RECIPES.find((r) => r.id === recipeId);
      if (!recipe) {
        console.error('Recipe not found:', recipeId);
        return prev;
      }

      // Мгновенно создаем гибридное семя - добавляем в инвентарь
      const newInventory = addCount(prev.inventory, recipe.resultSeedId, 1, {
        id: recipe.resultSeedId,
        type: 'seed',
        name: recipe.resultName,
        emoji: recipe.resultEmoji,
        count: 0,
      });

      return {
        ...prev,
        inventory: newInventory,
        craftDraft: null,
        hybridsCreated: prev.hybridsCreated + 1
      };
    });
  }, []);

  const completeCraft = useCallback(() => {
    // Эта функция больше не нужна, но оставим для совместимости
    setState(prev => ({ ...prev, activeCraft: null, craftDraft: null }));
  }, []);

  const getCraftProgress = useCallback(() => {
    // Возвращаем null, так как крафт мгновенный
    return null;
  }, []);

  const timeLeftForCell = useCallback((cell: Cell) => {
    if (cell.status !== 'growing' || !cell.seed || !cell.plantedAt) return 0;
    const seedDef = getSeedInfo(cell.seed);
    if (!seedDef) return 0;
    const growMs = seedDef.growSeconds * 1000;
    return Math.max(0, growMs - (now() - cell.plantedAt));
  }, []);

  const getCurrentFieldSize = useCallback(() => {
    return state.fieldLevel === 0 ? FIELD_SIZE : FIELD_UPGRADES[state.fieldLevel - 1].size;
  }, [state.fieldLevel]);
  
  const buyEcoWithTon = useCallback((ecoAmount: number, tonCost: number) => {
    setState(prev => {
      if (prev.tonBalance < tonCost) return prev;
      return { ...prev, tonBalance: prev.tonBalance - tonCost, balance: prev.balance + ecoAmount };
    });
  }, []);

  const addItemToInventory = useCallback((item: { id: string; name: string; type: 'seed' | 'fruit' | 'booster'; emoji: string }, count: number = 1) => {
    setState(prev => {
      const existingItem = prev.inventory.find(i => i.id === item.id);
      let updatedInventory: InventoryItem[];
      if (existingItem) {
        updatedInventory = prev.inventory.map(i => 
          i.id === item.id ? { ...i, count: i.count + count } : i
        );
      } else {
        updatedInventory = [...prev.inventory, { ...item, count }];
      }
      return { ...prev, inventory: updatedInventory };
    });
  }, []);

  const getNextUpgrade = useCallback(() => {
    if (state.fieldLevel >= 8) return null;
    return FIELD_UPGRADES[state.fieldLevel];
  }, [state.fieldLevel]);

  const startSynthesis = useCallback((cellId: number, plantId: string, willSucceed: boolean, gridSize: number) => {
    setState(prev => {
      const plant = SYNTHESIS_PLANTS.find(p => p.id === plantId);
      const synthesisTime = plant ? plant.growSeconds * 1000 : 120000;
      const frozenUntil = Date.now() + synthesisTime;
      
      // Находим соседние клетки и замораживаем их
      const row = Math.floor(cellId / gridSize);
      const col = cellId % gridSize;
      const neighbors = [
        row > 0 ? cellId - gridSize : null, // вверх
        row < gridSize - 1 ? cellId + gridSize : null, // вниз
        col > 0 ? cellId - 1 : null, // влево
        col < gridSize - 1 ? cellId + 1 : null, // вправо
      ].filter((id): id is number => id !== null);
      
      const nextField = prev.field.map(cell => {
        if (neighbors.includes(cell.id)) {
          return { ...cell, frozenUntil };
        }
        return cell;
      });
      
      return {
        ...prev,
        field: nextField,
        synthesisActive: [...(prev.synthesisActive || []), { cellId, plantId, startTime: Date.now(), willSucceed }]
      };
    });
  }, []);

  const completeSynthesis = useCallback((cellId: number) => {
    setState(prev => ({
      ...prev,
      synthesisActive: (prev.synthesisActive || []).filter(s => s.cellId !== cellId)
    }));
  }, []);

  return {
    state,
    isLoading,
    view,
    setView,
    seedsInInventory,
    fruitsInInventory,
    boostersInInventory,
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
    initCraftDraft,
    addIngredientToCraft,
    cancelCraftDraft,
    startCraft,
    completeCraft,
    getCraftProgress,
    addBooster,
    useBoosterSpeedup,
    canClaimDaily,
    claimDaily,
    buyEcoWithTon,
    addItemToInventory,
    startSynthesis,
    completeSynthesis
    
  } as const;
}





