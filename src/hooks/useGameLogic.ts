import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gameAPI } from '../api/gameApi';
import { SEEDS, SeedId } from '../data/seeds';
import { FRUITS } from '../data/fruits';
import { HYBRID_RECIPES } from '../data/hybrids';
import { SYNTHESIS_PLANTS } from '../data/synthesis';
import { BOOSTERS, BoosterId } from '../data/boosters';
import { getSeedInfo, getFruitInfo } from '../utils/hybridUtils';

const DAILY_CYCLE_LENGTH = 15;

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

export interface MarketLockedEntry {
  orderId: number;
  itemId: string;
  itemType: 'seed' | 'fruit' | 'currency';
  quantity: number;
  name?: string;
  emoji?: string;
  rarity?: string;
  currency?: 'eco' | 'ton';
}

function roundCurrency(value: number | null | undefined, precision: number = 3) {
  const factor = Math.pow(10, precision);
  return Number(Math.round(((value ?? 0) + Number.EPSILON) * factor) / factor);
}

function withRoundedBalances<T extends GameState>(state: T): T {
  return {
    ...state,
    balance: roundCurrency(state.balance),
    tonBalance: roundCurrency(state.tonBalance),
  };
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
  dailyStreak?: number; // consecutive claim days within current cycle
  dailyCycleDay?: number; // последний успешно собранный день цикла (0 означает не начинал)
  referrerId?: number | null;
  referralStats?: {
    totalIncome: number;
    salesIncome: number;
    tonIncome: number;
    count?: number;
  };
  marketLocked?: MarketLockedEntry[];
  synthesisActive?: Array<{ cellId: number; plantId: string; startTime: number; willSucceed: boolean }>; // синтез активен
}

export type View = 'field' | 'shop' | 'inventory' | 'exchange' | 'profile';

export interface BoosterNotification {
  boosterId: BoosterId;
  name: string;
  emoji: string;
  message: string;
}

function boosterFallback(id: BoosterId): InventoryItem {
  const def = BOOSTERS[id];
  return {
    id,
    type: 'booster',
    name: def?.name ?? 'Бустер',
    emoji: def?.emoji ?? '✨',
    count: 0,
  };
}

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

function normalizeSaveData(saved: any): GameState {
  const fieldLevel = saved.fieldLevel ?? 0;
  const expectedSize = fieldLevel === 0 ? FIELD_SIZE : FIELD_UPGRADES[fieldLevel - 1]?.size ?? FIELD_SIZE;
  let restoredField: Cell[] = Array.isArray(saved.field) ? saved.field : [];

  if (restoredField.length !== expectedSize) {
    restoredField = createEmptyField(expectedSize);
  } else {
    restoredField = restoredField.map((cell: any) => {
      if (cell && cell.status === 'growing' && cell.seed && cell.plantedAt) {
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

  const normalisedStreak = normaliseDaily(saved?.dailyStreak);
  const normalisedCycle = normaliseDaily(saved?.dailyCycleDay ?? saved?.dailyStreak);
  const savedReferrer = safeNumber(saved?.referrerId);
  const savedRefStats = normalizeReferralStats(saved?.referralStats);

  return {
    field: restoredField,
    inventory: Array.isArray(saved.inventory) ? saved.inventory : [],
    balance: roundCurrency(saved.balance ?? START_BALANCE),
    tonBalance: roundCurrency(saved.tonBalance ?? 0),
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
    title: saved.title ?? '',
    activeCraft: saved.activeCraft ?? null,
    craftDraft: saved.craftDraft ?? null,
    lastDailyClaim: saved.lastDailyClaim,
    dailyStreak: normalisedStreak,
    dailyCycleDay: normalisedCycle,
    referrerId: savedReferrer,
    referralStats: savedRefStats,
    marketLocked: Array.isArray(saved.marketLocked) ? saved.marketLocked : [],
    synthesisActive: Array.isArray(saved.synthesisActive) ? saved.synthesisActive : [],
  };
}

export function useGameLogic(tgId?: number, initData?: string | null, startParam?: string | null) {
  const [state, setState] = useState<GameState>(() => normalizeSaveData({
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
    dailyCycleDay: 0,
    referrerId: null,
    referralStats: { totalIncome: 0, salesIncome: 0, tonIncome: 0, count: 0 },
    marketLocked: [],
    synthesisActive: [],
  }));

  const [view, setView] = useState<View>('field');
  const [seedSelectForCell, setSeedSelectForCell] = useState<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [boosterNotification, setBoosterNotification] = useState<BoosterNotification | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setState(prev => {
      const roundedBalance = roundCurrency(prev.balance);
      const roundedTon = roundCurrency(prev.tonBalance);
      if (roundedBalance === prev.balance && roundedTon === prev.tonBalance) {
        return prev;
      }
      return { ...prev, balance: roundedBalance, tonBalance: roundedTon };
    });
  }, [state.balance, state.tonBalance]);

  const applyServerState = useCallback((saved: any) => {
    const mapped = normalizeSaveData(saved);
    setState(mapped);
    gameAPI.updateCustomStats({
      title: mapped.title,
      daily_streak: mapped.dailyStreak,
      daily_cycle_day: mapped.dailyCycleDay,
      referrer_id: mapped.referrerId ?? undefined,
    });
    return mapped;
  }, []);

  // Initialize API with Telegram ID
  useEffect(() => {
    let cancelled = false;

    if (tgId) {
      gameAPI.init(tgId, initData ?? null);
      gameAPI.getUserData().then(saved => {
        if (cancelled) return;
        let baseState: GameState | null = null;
        if (saved) {
          baseState = applyServerState(saved);
        } else {
          baseState = stateRef.current;
        }
        if (baseState && !baseState.marketLocked) {
          baseState.marketLocked = [];
          setState(baseState);
        }
        stateRef.current = baseState ?? stateRef.current;
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [tgId, initData, applyServerState]);

  useEffect(() => {
    if (!state.referrerId && startParam && tgId) {
      const candidate = parseReferrerFromStart(startParam);
      if (candidate && candidate !== tgId) {
        setState(prev => {
          if (prev.referrerId || candidate === tgId) return prev;
          gameAPI.updateCustomStats({ referrer_id: candidate });
          return { ...prev, referrerId: candidate };
        });
      }
    }
  }, [startParam, tgId, state.referrerId]);

  useEffect(() => {
    if (isLoading || !tgId) return;

    const tick = async () => {
      if (!gameAPI.isSaving()) {
        const latest = await gameAPI.saveUserData(stateRef.current);
        if (latest) {
          applyServerState(latest);
        }
      }
    };

    const interval = window.setInterval(() => {
      void tick();
    }, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [isLoading, tgId, applyServerState]);


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
      const nextBalance = roundCurrency(prev.balance - seed.price);
      const nextInv = addCount(prev.inventory, seedId, 1, {
        id: seedId,
        type: 'seed',
        name: seed.name,
        emoji: seed.emoji,
        count: 0,
      });
      return withRoundedBalances({ 
        ...prev, 
        balance: nextBalance, 
        inventory: nextInv,
        totalSpent: prev.totalSpent + seed.price
      });
    });
  }, []);

  const sellFruit = useCallback((fruitId: string, count: number) => {
    let referralReward: number | null = null;
    setState((prev) => {
      const fruit = getFruitInfo(fruitId);
      if (!fruit || count <= 0) return prev;
      const invItem = getItem(prev.inventory, fruitId);
      if (!invItem || invItem.count < count) return prev;
      const income = fruit.sellPrice * count;
      if (prev.referrerId && income > 0) {
        referralReward = Math.floor(income * 0.05);
        if (referralReward === 0) {
          referralReward = null;
        }
      }
      const nextInv = addCount(prev.inventory, fruitId, -count, {
        id: fruitId,
        type: 'fruit',
        name: fruit.name,
        emoji: fruit.emoji,
        count: 0,
      });
      return withRoundedBalances({ 
        ...prev, 
        inventory: nextInv, 
        balance: roundCurrency(prev.balance + income),
        totalEarned: prev.totalEarned + income
      });
    });

    if (referralReward && referralReward > 0) {
      gameAPI.grantReferralReward('sale', referralReward);
    }
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
      return withRoundedBalances({ 
        ...prev, 
        inventory: nextInv, 
        balance: roundCurrency(prev.balance + income),
        totalEarned: prev.totalEarned + income
      });
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
      return withRoundedBalances({ 
        ...prev, 
        field: newField, 
        balance: roundCurrency(prev.balance - upgrade.cost), 
        fieldLevel: nextLevel 
      });
    });
  }, []);

  // Boosters
  const addBooster = useCallback((id: BoosterId, count: number) => {
    setState(prev => {
      const nextInv = addCount(prev.inventory, id, count, boosterFallback(id));
      return { ...prev, inventory: nextInv };
    });
  }, []);

  const buyBooster = useCallback((boosterId: BoosterId) => {
    const booster = BOOSTERS[boosterId];
    if (!booster) return false;

    let purchased = false;
    setState(prev => {
      if (prev.balance < booster.price) return prev;
      purchased = true;
      const nextInventory = addCount(prev.inventory, boosterId, 1, boosterFallback(boosterId));
      return withRoundedBalances({
        ...prev,
        balance: roundCurrency(prev.balance - booster.price),
        totalSpent: prev.totalSpent + booster.price,
        inventory: nextInventory,
      });
    });
    return purchased;
  }, []);

  const applyBooster = useCallback((boosterId: BoosterId, cellId?: number) => {
    const boosterDef = BOOSTERS[boosterId];
    if (!boosterDef) return false;

    let success = false;
    let notificationMessage: string | null = null;

    setState(prev => {
      const inventoryItem = getItem(prev.inventory, boosterId);
      if (!inventoryItem || inventoryItem.count <= 0) {
        notificationMessage = 'У вас нет такого бустера в инвентаре.';
        return prev;
      }

      const currentTime = now();
      let stateAfterEffect: GameState | null = null;

      switch (boosterId) {
        case 'booster_speedup': {
          let affected = 0;
          const updatedField = prev.field.map(cell => {
            if (cell.status === 'growing' && cell.seed && cell.plantedAt) {
              if (cell.frozenUntil && currentTime < cell.frozenUntil) {
                return cell;
              }
              const seedDef = getSeedInfo(cell.seed);
              if (!seedDef) return cell;
              const growMs = seedDef.growSeconds * 1000;
              const elapsed = currentTime - cell.plantedAt;
              const remaining = Math.max(0, growMs - elapsed);
              if (remaining <= 0) {
                affected += 1;
                return { ...cell, status: 'ready' as const, plantedAt: undefined };
              }
              const newRemaining = Math.floor(remaining / 2);
              if (newRemaining <= 0) {
                affected += 1;
                return { ...cell, status: 'ready' as const, plantedAt: undefined };
              }
              const adjustedPlantedAt = currentTime - (growMs - newRemaining);
              if (adjustedPlantedAt !== cell.plantedAt) {
                affected += 1;
                return { ...cell, plantedAt: adjustedPlantedAt };
              }
            }
            return cell;
          });

          if (affected === 0) {
            notificationMessage = 'Нет растений, которые можно ускорить.';
            return prev;
          }

          success = true;
          notificationMessage = affected > 1
            ? `Ускоритель роста ускорил ${affected} растений.`
            : 'Ускоритель роста сократил время роста растения.';
          stateAfterEffect = { ...prev, field: updatedField };
          break;
        }
        case 'booster_watering_can': {
          if (typeof cellId !== 'number') {
            notificationMessage = 'Выберите клетку с растущим растением, чтобы использовать лейку.';
            return prev;
          }
          const targetCell = prev.field[cellId];
          if (!targetCell || targetCell.status !== 'growing' || !targetCell.seed || !targetCell.plantedAt) {
            notificationMessage = 'Лейка работает только на растущем растении.';
            return prev;
          }

          const seedDef = getSeedInfo(targetCell.seed);
          if (!seedDef) {
            notificationMessage = 'Не удалось определить растение для полива.';
            return prev;
          }

          const growMs = seedDef.growSeconds * 1000;
          const elapsed = currentTime - targetCell.plantedAt;
          const remaining = Math.max(0, growMs - elapsed);
          let updatedCell: Cell;

          if (remaining <= 0) {
            updatedCell = { ...targetCell, status: 'ready' as const, plantedAt: undefined };
          } else {
            const newRemaining = Math.floor(remaining / 2);
            if (newRemaining <= 0) {
              updatedCell = { ...targetCell, status: 'ready' as const, plantedAt: undefined };
            } else {
              const adjustedPlantedAt = currentTime - (growMs - newRemaining);
              updatedCell = { ...targetCell, plantedAt: adjustedPlantedAt };
            }
          }

          success = true;
          const updatedField = prev.field.map((cell, idx) => (idx === cellId ? updatedCell : cell));
          notificationMessage =
            updatedCell.status === 'ready'
              ? 'Растение полностью созрело после полива.'
              : 'Время роста растения заметно сократилось.';
          stateAfterEffect = { ...prev, field: updatedField };
          break;
        }
        case 'booster_fertilizer': {
          if (typeof cellId !== 'number') {
            notificationMessage = 'Выберите клетку с растущим растением, чтобы использовать удобрение.';
            return prev;
          }
          const targetCell = prev.field[cellId];
          if (!targetCell || targetCell.status !== 'growing' || !targetCell.seed) {
            notificationMessage = 'Удобрение работает только на растущем растении.';
            return prev;
          }

          success = true;
          notificationMessage = 'Удобрение мгновенно довело растение до стадии сбора.';
          const updatedField = prev.field.map((cell, idx) =>
            idx === cellId ? { ...cell, status: 'ready' as const, plantedAt: undefined } : cell
          );
          stateAfterEffect = { ...prev, field: updatedField };
          break;
        }
        default: {
          notificationMessage = 'Неизвестный тип бустера.';
          return prev;
        }
      }

      if (!success || !stateAfterEffect) {
        return prev;
      }

      const nextInventory = addCount(prev.inventory, boosterId, -1, boosterFallback(boosterId));
      return { ...stateAfterEffect, inventory: nextInventory };
    });

    if (notificationMessage) {
      setBoosterNotification({
        boosterId,
        name: boosterDef.name,
        emoji: boosterDef.emoji,
        message: notificationMessage,
      });
    }

    return success;
  }, [setBoosterNotification]);

  const clearBoosterNotification = useCallback(() => {
    setBoosterNotification(null);
  }, [setBoosterNotification]);

  // Daily rewards
  const getTodayDayNumber = () => Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const canClaimDaily = useCallback(() => {
    const today = getTodayDayNumber();
    return state.lastDailyClaim !== today;
  }, [state.lastDailyClaim]);

  const claimDaily = useCallback((plan?: { eco?: number; boosters?: number; seedRarity?: 'common'|'uncommon'|'rare'|'epic'|'legendary' }) => {
    let statsUpdate: { daily_cycle_day: number; daily_streak: number } | null = null;
    setState(prev => {
      const today = getTodayDayNumber();
      if (prev.lastDailyClaim === today) return prev;
      const yesterday = today - 1;
      const continued = prev.lastDailyClaim === yesterday;
      const previousCycleDay = prev.dailyCycleDay ?? 0;
      const nextCycleDay = continued ? ((previousCycleDay % DAILY_CYCLE_LENGTH) + 1) : 1;
      const nextStreak = continued ? ((prev.dailyStreak ?? 0) % DAILY_CYCLE_LENGTH) + 1 : 1;

      const eco = plan?.eco ?? 50;
      const boosters = plan?.boosters ?? 1;
      const rarity = plan?.seedRarity ?? 'common';

      const seedKeys = Object.keys(SEEDS) as (keyof typeof SEEDS)[];
      const seedsByRarity = seedKeys.filter(k => SEEDS[k].rarity === rarity);
      const randomSeed = seedsByRarity[Math.floor(Math.random() * seedsByRarity.length)] ?? seedKeys[0];

      let nextInv = prev.inventory;
      if (boosters > 0) {
        nextInv = addCount(nextInv, 'booster_speedup', boosters, boosterFallback('booster_speedup'));
      }
      nextInv = addCount(nextInv, randomSeed, 1, { id: randomSeed, type: 'seed', name: SEEDS[randomSeed].name, emoji: SEEDS[randomSeed].emoji, count: 0 });

      statsUpdate = { daily_cycle_day: nextCycleDay, daily_streak: nextStreak };

      return withRoundedBalances({ ...prev, balance: roundCurrency(prev.balance + eco), inventory: nextInv, lastDailyClaim: today, dailyStreak: nextStreak, dailyCycleDay: nextCycleDay });
    });

    if (statsUpdate) {
      gameAPI.updateCustomStats(statsUpdate);
    }
  }, []);

  const clearProgress = useCallback(() => {
    setState(withRoundedBalances({ 
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
      dailyCycleDay: 0,
      referrerId: null,
      referralStats: { totalIncome: 0, salesIncome: 0, tonIncome: 0, count: 0 },
      marketLocked: [],
      synthesisActive: []
    }));
  }, []);

  const updateUsername = useCallback((newUsername: string) => {
    setState(prev => ({ ...prev, username: newUsername }));
  }, []);

  const updateTitle = useCallback((newTitle: string) => {
    setState(prev => ({ ...prev, title: newTitle }));
    gameAPI.updateCustomStats({ title: newTitle });
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

  const startCraft = useCallback((recipeId: string, _ingredients: { id: string; type: 'seed' | 'fruit'; count: number }[]) => {
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
    let referralReward: number | null = null;
    setState(prev => {
      if (prev.tonBalance < tonCost) return prev;
      if (prev.referrerId && ecoAmount > 0) {
        referralReward = Math.floor(ecoAmount * 0.05);
        if (referralReward === 0) referralReward = null;
      }
      return withRoundedBalances({ ...prev, tonBalance: roundCurrency(prev.tonBalance - tonCost), balance: roundCurrency(prev.balance + ecoAmount) });
    });
    if (referralReward && referralReward > 0) {
      gameAPI.grantReferralReward('ton', referralReward);
    }
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

  const setReferralCount = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      referralStats: {
        totalIncome: prev.referralStats?.totalIncome ?? 0,
        salesIncome: prev.referralStats?.salesIncome ?? 0,
        tonIncome: prev.referralStats?.tonIncome ?? 0,
        count,
      },
    }));
  }, []);

  const reloadFromServer = useCallback(async () => {
    if (!tgId) return;
    try {
      const saved = await gameAPI.getUserData();
      if (saved) {
        stateRef.current = applyServerState(saved);
      }
    } catch (error) {
      console.error('Failed to reload state from server', error);
    }
  }, [tgId, applyServerState]);

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
    buyBooster,
    applyBooster,
    boosterNotification,
    clearBoosterNotification,
    canClaimDaily,
    claimDaily,
    buyEcoWithTon,
    addItemToInventory,
    startSynthesis,
    completeSynthesis,
    getReferrals: gameAPI.getReferrals,
    setReferralCount,
    reloadFromServer,
    listMarketOrders: (params: Parameters<typeof gameAPI.listMarketOrders>[0]) => gameAPI.listMarketOrders(params),
    listMyMarketOrders: () => gameAPI.listMyMarketOrders(),
    createMarketOrder: (payload: Parameters<typeof gameAPI.createMarketOrder>[0]) => gameAPI.createMarketOrder(payload),
    buyMarketOrder: (orderId: number, quantity: number) => gameAPI.buyMarketOrder(orderId, quantity),
    cancelMarketOrder: (orderId: number) => gameAPI.cancelMarketOrder(orderId),
    telegramId: tgId,
     
   } as const;
}

function normaliseDaily(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  const base = Math.floor(value);
  return ((base - 1) % DAILY_CYCLE_LENGTH) + 1;
}

function parseReferrerFromStart(startParam: string | null | undefined): number | null {
  if (!startParam) return null;
  const cleaned = startParam.trim();
  if (!cleaned) return null;
  const match = cleaned.match(/(\d+)/);
  if (!match) return null;
  const numeric = Number(match[1]);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : null;
}

function normalizeReferralStats(value: any) {
  const totalIncome = Number(value?.totalIncome) || 0;
  const salesIncome = Number(value?.salesIncome) || 0;
  const tonIncome = Number(value?.tonIncome) || 0;
  const count = Number(value?.count) || 0;
  return {
    totalIncome,
    salesIncome,
    tonIncome,
    count,
  };
}

function safeNumber(value: any) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.floor(num) : null;
}





