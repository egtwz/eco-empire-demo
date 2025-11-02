import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gameAPI } from '../api/gameApi';
import { SEEDS, SeedId } from '../data/seeds';
import { FRUITS } from '../data/fruits';
import { HYBRID_RECIPES } from '../data/hybrids';
import { SYNTHESIS_PLANTS } from '../data/synthesis';
import { BOOSTERS, BoosterId } from '../data/boosters';
import { getSeedInfo, getFruitInfo } from '../utils/hybridUtils';
import { getQuestById, ALL_DEALER_QUESTS } from '../data/dealerQuests';

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
  // Система квестов скупщика
  dealerLevel?: number; // Уровень скупщика (1-7)
  dealerXP?: number; // Текущий опыт скупщика
  dealerActiveQuest?: string | null; // ID активного квеста
  dealerQuestProgress?: Record<string, number>; // Прогресс по квестам: { questId: progress }
  dealerCompletedQuests?: string[]; // Массив ID выполненных квестов
  dealerQuestPages?: Record<number, string[]>; // Квесты на страницах: { page: [questId1, questId2, ...] }
  dealerQuestNotificationsShown?: string[]; // ID квестов, для которых уже показано уведомление
  dealerQuestStartAmounts?: Record<string, number>; // Начальная сумма продаж для квестов "sell_amount": { questId: startAmount }
  // Счетчики для отслеживания прогресса квестов
  dealerQuestCounters?: {
    plantSeeds?: Record<string, number>; // { seedId: count }
    sellFruits?: Record<string, number>; // { fruitId: count }
    sellAmount?: number; // Общая сумма проданного
    harvestSeeds?: Record<string, number>; // { seedId: count }
    createHybrids?: number;
    doSynthesis?: number;
    useBoosters?: Record<string, number>; // { boosterId: count }
  };
}

export type View = 'field' | 'shop' | 'inventory' | 'exchange' | 'profile';

export interface BoosterNotification {
  boosterId: BoosterId;
  name: string;
  emoji: string;
  message: string;
}

export interface DealerQuestNotification {
  questId: string;
  questName: string;
  questEmoji: string;
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

  // Нормализация квестов скупщика - удаление дубликатов
  const rawDealerQuestPages = saved.dealerQuestPages || {};
  const normalizedDealerQuestPages: Record<number, string[]> = {};
  const allUsedQuestIds = new Set<string>();
  
  // Проходим по всем страницам и удаляем дубликаты
  for (let page = 1; page <= 6; page++) {
    const pageQuests = Array.isArray(rawDealerQuestPages[page]) ? rawDealerQuestPages[page] : [];
    const uniqueQuests: string[] = [];
    const pageQuestIds = new Set<string>();
    
    for (const questId of pageQuests) {
      if (typeof questId === 'string' && !allUsedQuestIds.has(questId) && !pageQuestIds.has(questId)) {
        // Проверяем, что квест существует
        const quest = getQuestById(questId);
        if (quest && quest.page === page) {
          uniqueQuests.push(questId);
          allUsedQuestIds.add(questId);
          pageQuestIds.add(questId);
        }
      }
    }
    
    if (uniqueQuests.length > 0 || page === 1) {
      normalizedDealerQuestPages[page] = uniqueQuests;
    }
  }

  // Нормализуем выполненные квесты - удаляем дубликаты
  const rawCompletedQuests = Array.isArray(saved.dealerCompletedQuests) ? saved.dealerCompletedQuests : [];
  const normalizedCompletedQuests: string[] = Array.from(new Set(rawCompletedQuests.filter((id: any) => typeof id === 'string')));

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
    // Данные квестов скупщика
    dealerLevel: saved.dealerLevel ?? 1,
    dealerXP: saved.dealerXP ?? 0,
    dealerActiveQuest: saved.dealerActiveQuest ?? null,
    dealerQuestProgress: saved.dealerQuestProgress ?? {},
    dealerCompletedQuests: normalizedCompletedQuests,
    dealerQuestPages: normalizedDealerQuestPages,
    dealerQuestNotificationsShown: Array.isArray(saved.dealerQuestNotificationsShown) ? saved.dealerQuestNotificationsShown : [],
    dealerQuestStartAmounts: saved.dealerQuestStartAmounts && typeof saved.dealerQuestStartAmounts === 'object' ? saved.dealerQuestStartAmounts : {},
    dealerQuestCounters: {
      plantSeeds: saved.dealerQuestCounters?.plantSeeds ?? {},
      sellFruits: saved.dealerQuestCounters?.sellFruits ?? {},
      sellAmount: saved.dealerQuestCounters?.sellAmount ?? 0,
      harvestSeeds: saved.dealerQuestCounters?.harvestSeeds ?? {},
      createHybrids: saved.dealerQuestCounters?.createHybrids ?? 0,
      doSynthesis: saved.dealerQuestCounters?.doSynthesis ?? 0,
      useBoosters: saved.dealerQuestCounters?.useBoosters ?? {},
    },
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
    dealerLevel: 1,
    dealerXP: 0,
    dealerActiveQuest: null,
    dealerQuestProgress: {},
    dealerCompletedQuests: [],
    dealerQuestPages: {},
    dealerQuestNotificationsShown: [],
    dealerQuestStartAmounts: {},
    dealerQuestCounters: {
      plantSeeds: {},
      sellFruits: {},
      sellAmount: 0,
      harvestSeeds: {},
      createHybrids: 0,
      doSynthesis: 0,
      useBoosters: {},
    },
  }));

  const [view, setView] = useState<View>('field');
  const [seedSelectForCell, setSeedSelectForCell] = useState<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [boosterNotification, setBoosterNotification] = useState<BoosterNotification | null>(null);
  const [dealerQuestNotification, setDealerQuestNotification] = useState<DealerQuestNotification | null>(null);
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

      // Обновляем счетчик квестов (посадить семена)
      const counters = prev.dealerQuestCounters || {
        plantSeeds: {},
        sellFruits: {},
        sellAmount: 0,
        harvestSeeds: {},
        createHybrids: 0,
        doSynthesis: 0,
        useBoosters: {},
      };
      const newPlantSeeds = { ...counters.plantSeeds };
      newPlantSeeds[seedId] = (newPlantSeeds[seedId] || 0) + 1;

      return { 
        ...prev, 
        field: nextField, 
        inventory: nextInv,
        seedsPlanted: prev.seedsPlanted + 1,
        dealerQuestCounters: {
          ...counters,
          plantSeeds: newPlantSeeds,
        },
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

      // Обновляем счетчик квестов (вырастить семена)
      const counters = prev.dealerQuestCounters || {
        plantSeeds: {},
        sellFruits: {},
        sellAmount: 0,
        harvestSeeds: {},
        createHybrids: 0,
        doSynthesis: 0,
        useBoosters: {},
      };
      const newHarvestSeeds = { ...counters.harvestSeeds };
      newHarvestSeeds[cell.seed] = (newHarvestSeeds[cell.seed] || 0) + 1;

      return { 
        ...prev, 
        field: nextField, 
        inventory: nextInv,
        fruitsHarvested: prev.fruitsHarvested + 1,
        xp: finalXP,
        level: newLevel,
        dealerQuestCounters: {
          ...counters,
          harvestSeeds: newHarvestSeeds,
        },
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
      
      // Применяем множитель скупщика
      const dealerMultiplier = prev.dealerLevel ? (1 + (prev.dealerLevel - 1) * 0.05) : 1;
      const baseIncome = fruit.sellPrice * count;
      const income = roundCurrency(baseIncome * dealerMultiplier);
      
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

      // Обновляем счетчики квестов (продать плоды и сумму)
      const counters = prev.dealerQuestCounters || {
        plantSeeds: {},
        sellFruits: {},
        sellAmount: 0,
        harvestSeeds: {},
        createHybrids: 0,
        doSynthesis: 0,
        useBoosters: {},
      };
      const newSellFruits = { ...counters.sellFruits };
      newSellFruits[fruitId] = (newSellFruits[fruitId] || 0) + count;

      return withRoundedBalances({ 
        ...prev, 
        inventory: nextInv, 
        balance: roundCurrency(prev.balance + income),
        totalEarned: prev.totalEarned + income,
        dealerQuestCounters: {
          ...counters,
          sellFruits: newSellFruits,
          sellAmount: (counters.sellAmount || 0) + income,
        },
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
      
      // Обновляем счетчик квестов (использовать бустер)
      const counters = prev.dealerQuestCounters || {
        plantSeeds: {},
        sellFruits: {},
        sellAmount: 0,
        harvestSeeds: {},
        createHybrids: 0,
        doSynthesis: 0,
        useBoosters: {},
      };
      const newUseBoosters = { ...counters.useBoosters };
      newUseBoosters[boosterId] = (newUseBoosters[boosterId] || 0) + 1;

      return { 
        ...stateAfterEffect, 
        inventory: nextInventory,
        dealerQuestCounters: {
          ...counters,
          useBoosters: newUseBoosters,
        },
      };
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

      // Обновляем счетчик квестов (создать гибрид)
      const counters = prev.dealerQuestCounters || {
        plantSeeds: {},
        sellFruits: {},
        sellAmount: 0,
        harvestSeeds: {},
        createHybrids: 0,
        doSynthesis: 0,
        useBoosters: {},
      };

      return {
        ...prev,
        inventory: newInventory,
        craftDraft: null,
        hybridsCreated: prev.hybridsCreated + 1,
        dealerQuestCounters: {
          ...counters,
          createHybrids: (counters.createHybrids || 0) + 1,
        },
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
    setState(prev => {
      // Обновляем счетчик квестов (выполнить синтез)
      const counters = prev.dealerQuestCounters || {
        plantSeeds: {},
        sellFruits: {},
        sellAmount: 0,
        harvestSeeds: {},
        createHybrids: 0,
        doSynthesis: 0,
        useBoosters: {},
      };

      return {
        ...prev,
        synthesisActive: (prev.synthesisActive || []).filter(s => s.cellId !== cellId),
        dealerQuestCounters: {
          ...counters,
          doSynthesis: (counters.doSynthesis || 0) + 1,
        },
      };
    });
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
      // КРИТИЧНО: Принудительно загружаем данные с сервера, игнорируя локальный кэш
      // Это гарантирует получение актуальных данных после покупки/продажи
      const saved = await gameAPI.getUserData();
      if (saved) {
        // Обновляем как внутренний ref, так и состояние компонента
        const newState = applyServerState(saved);
        stateRef.current = newState;
        // Принудительно обновляем состояние, чтобы UI отобразил новые данные
        setState(newState);
      }
    } catch (error) {
      console.error('Failed to reload state from server', error);
    }
  }, [tgId, applyServerState]);

  // ============ СИСТЕМА КВЕСТОВ СКУПЩИКА ============
  
  // Пороги опыта для уровней скупщика (30/60/90/120/150/180)
  const DEALER_LEVEL_THRESHOLDS = [0, 30, 60, 90, 120, 150, 180];
  const MAX_DEALER_LEVEL = 7;

  // Инициализация страницы квестов (если пустая)
  const initializeDealerQuestPage = useCallback((page: number) => {
    setState(prev => {
      if (prev.dealerQuestPages?.[page] && prev.dealerQuestPages[page].length === 30) {
        return prev; // Страница уже полностью инициализирована
      }

      // Собираем все уже использованные квесты пользователя (из всех страниц)
      const allUsedQuestIds = new Set<string>();
      
      // Добавляем квесты со всех страниц
      Object.values(prev.dealerQuestPages || {}).forEach(questIds => {
        questIds.forEach(id => allUsedQuestIds.add(id));
      });
      
      // Добавляем выполненные квесты
      (prev.dealerCompletedQuests || []).forEach(id => allUsedQuestIds.add(id));

      // Получаем все доступные квесты для этой страницы
      const allPageQuests = ALL_DEALER_QUESTS.filter(q => q.page === page);
      
      // Фильтруем только те, которые еще не использованы
      const availableQuests = allPageQuests.filter(q => !allUsedQuestIds.has(q.id));
      
      // Если доступных квестов недостаточно, используем все квесты страницы (но это не должно произойти при 2000+ квестах)
      const questsToUse = availableQuests.length >= 30 ? availableQuests : allPageQuests;

      // Перемешиваем и берем 30 уникальных
      const shuffled = [...questsToUse].sort(() => Math.random() - 0.5);
      const uniqueQuests: string[] = [];
      const usedInThisPage = new Set<string>();
      
      for (let i = 0; i < shuffled.length && uniqueQuests.length < 30; i++) {
        const questId = shuffled[i].id;
        if (!usedInThisPage.has(questId) && !allUsedQuestIds.has(questId)) {
          uniqueQuests.push(questId);
          usedInThisPage.add(questId);
        }
      }

      // Если не хватило уникальных квестов, добавляем любые уникальные
      if (uniqueQuests.length < 30) {
        for (let i = 0; i < shuffled.length && uniqueQuests.length < 30; i++) {
          const questId = shuffled[i].id;
          if (!usedInThisPage.has(questId)) {
            uniqueQuests.push(questId);
            usedInThisPage.add(questId);
          }
        }
      }

      const newPages = { ...(prev.dealerQuestPages || {}) };
      newPages[page] = uniqueQuests;

      // Если это первая страница и нет активного квеста - устанавливаем первый квест активным
      let newActiveQuest = prev.dealerActiveQuest;
      let newStartAmounts = { ...(prev.dealerQuestStartAmounts || {}) };
      
      if (page === 1 && !newActiveQuest && uniqueQuests.length > 0) {
        newActiveQuest = uniqueQuests[0];
        // Инициализируем начальную сумму для нового активного квеста типа "sell_amount"
        if (newActiveQuest) {
          const firstQuest = getQuestById(newActiveQuest);
          if (firstQuest && firstQuest.type === 'sell_amount') {
            const counters = prev.dealerQuestCounters || {
              plantSeeds: {},
              sellFruits: {},
              sellAmount: 0,
              harvestSeeds: {},
              createHybrids: 0,
              doSynthesis: 0,
              useBoosters: {},
            };
            newStartAmounts[newActiveQuest] = counters.sellAmount || 0;
          }
        }
      }

      return {
        ...prev,
        dealerQuestPages: newPages,
        dealerActiveQuest: newActiveQuest,
        dealerQuestStartAmounts: newStartAmounts,
      };
    });
  }, []);

  // Проверка и обновление прогресса квестов
  const updateQuestProgress = useCallback(() => {
    setState(prev => {
      if (!prev.dealerActiveQuest) return prev;

      const quest = getQuestById(prev.dealerActiveQuest);
      if (!quest) return prev;

      const counters = prev.dealerQuestCounters || {
        plantSeeds: {},
        sellFruits: {},
        sellAmount: 0,
        harvestSeeds: {},
        createHybrids: 0,
        doSynthesis: 0,
        useBoosters: {},
      };

      let currentProgress = 0;

      switch (quest.type) {
        case 'plant_seed':
          if (quest.itemId) {
            currentProgress = counters.plantSeeds?.[quest.itemId] || 0;
          }
          break;
        case 'sell_fruit':
          if (quest.itemId) {
            currentProgress = counters.sellFruits?.[quest.itemId] || 0;
          }
          break;
        case 'sell_amount':
          // Для квестов "продать на сумму" учитываем только деньги, полученные с момента начала квеста
          const startAmount = prev.dealerQuestStartAmounts?.[quest.id];
          if (startAmount !== undefined) {
            currentProgress = Math.max(0, (counters.sellAmount || 0) - startAmount);
          } else {
            // Если квест только активирован, сохраняем текущую сумму
            const newStartAmounts = { ...(prev.dealerQuestStartAmounts || {}), [quest.id]: counters.sellAmount || 0 };
            return {
              ...prev,
              dealerQuestStartAmounts: newStartAmounts,
            };
          }
          break;
        case 'harvest_seed':
          if (quest.itemId) {
            currentProgress = counters.harvestSeeds?.[quest.itemId] || 0;
          }
          break;
        case 'create_hybrid':
          currentProgress = counters.createHybrids || 0;
          break;
        case 'do_synthesis':
          currentProgress = counters.doSynthesis || 0;
          break;
        case 'use_booster':
          if (quest.itemId) {
            currentProgress = counters.useBoosters?.[quest.itemId] || 0;
          }
          break;
      }

      const newProgress = { ...(prev.dealerQuestProgress || {}) };
      newProgress[quest.id] = currentProgress;

      return {
        ...prev,
        dealerQuestProgress: newProgress,
      };
    });
  }, []);

  // Завершение квеста и выдача наград
  const completeDealerQuest = useCallback((questId: string) => {
    setState(prev => {
      const quest = getQuestById(questId);
      if (!quest) return prev;

      // Проверяем выполнение
      const counters = prev.dealerQuestCounters || {
        plantSeeds: {},
        sellFruits: {},
        sellAmount: 0,
        harvestSeeds: {},
        createHybrids: 0,
        doSynthesis: 0,
        useBoosters: {},
      };

      let currentProgress = 0;
      switch (quest.type) {
        case 'plant_seed':
          currentProgress = quest.itemId ? (counters.plantSeeds?.[quest.itemId] || 0) : 0;
          break;
        case 'sell_fruit':
          currentProgress = quest.itemId ? (counters.sellFruits?.[quest.itemId] || 0) : 0;
          break;
        case 'sell_amount':
          // Для квестов "продать на сумму" учитываем только деньги, полученные с момента начала квеста
          const startAmount = prev.dealerQuestStartAmounts?.[questId];
          if (startAmount !== undefined) {
            currentProgress = Math.max(0, (counters.sellAmount || 0) - startAmount);
          } else {
            // Если квест только начали выполнять, сохраняем текущую сумму
            const newStartAmounts = { ...(prev.dealerQuestStartAmounts || {}), [questId]: counters.sellAmount || 0 };
            return {
              ...prev,
              dealerQuestStartAmounts: newStartAmounts,
            };
          }
          break;
        case 'harvest_seed':
          currentProgress = quest.itemId ? (counters.harvestSeeds?.[quest.itemId] || 0) : 0;
          break;
        case 'create_hybrid':
          currentProgress = counters.createHybrids || 0;
          break;
        case 'do_synthesis':
          currentProgress = counters.doSynthesis || 0;
          break;
        case 'use_booster':
          currentProgress = quest.itemId ? (counters.useBoosters?.[quest.itemId] || 0) : 0;
          break;
      }

      if (currentProgress < quest.target) {
        return prev; // Квест еще не выполнен
      }

      // Выдача наград
      let newBalance = prev.balance + quest.rewardEco;
      let newInventory = [...prev.inventory];

      // Награда бустерами
      if (quest.rewardBoosters) {
        quest.rewardBoosters.forEach(({ boosterId, count }) => {
          newInventory = addCount(newInventory, boosterId, count, boosterFallback(boosterId));
        });
      }

      // Награда семенами
      if (quest.rewardSeeds) {
        quest.rewardSeeds.forEach(({ seedId, count }) => {
          const seedDef = SEEDS[seedId];
          if (seedDef) {
            newInventory = addCount(newInventory, seedId, count, {
              id: seedId,
              type: 'seed',
              name: seedDef.name,
              emoji: seedDef.emoji,
              count: 0,
            });
          }
        });
      }

      // Добавляем квест в выполненные
      const newCompleted = [...(prev.dealerCompletedQuests || []), questId];

      // Добавляем опыт скупщика
      const xpGained = quest.page; // Опыт = номер страницы
      let newDealerXP = (prev.dealerXP || 0) + xpGained;
      let newDealerLevel = prev.dealerLevel || 1;

      // Проверяем повышение уровня
      if (newDealerLevel < MAX_DEALER_LEVEL) {
        const requiredXP = DEALER_LEVEL_THRESHOLDS[newDealerLevel];
        if (newDealerXP >= requiredXP) {
          newDealerLevel = Math.min(newDealerLevel + 1, MAX_DEALER_LEVEL);
        }
      }

      // Находим следующий квест
      const questPage = quest.page;
      const pageQuests = prev.dealerQuestPages?.[questPage] || [];
      const currentIndex = pageQuests.indexOf(questId);
      let nextActiveQuest: string | null = null;

      // Обновляем начальные суммы для новых активных квестов типа "sell_amount"
      let newStartAmounts = { ...(prev.dealerQuestStartAmounts || {}) };
      
      if (currentIndex !== -1 && currentIndex < pageQuests.length - 1) {
        // Следующий квест на этой же странице
        nextActiveQuest = pageQuests[currentIndex + 1];
        // Инициализируем начальную сумму для нового активного квеста типа "sell_amount"
        if (nextActiveQuest) {
          const nextQuest = getQuestById(nextActiveQuest);
          if (nextQuest && nextQuest.type === 'sell_amount' && newStartAmounts[nextActiveQuest] === undefined) {
            newStartAmounts[nextActiveQuest] = counters.sellAmount || 0;
          }
        }
      } else {
        // Проверяем, все ли квесты страницы выполнены
        const allPageQuestsCompleted = pageQuests.every(qId => 
          newCompleted.includes(qId)
        );

        if (allPageQuestsCompleted && questPage < 6) {
          // Инициализируем следующую страницу
          const nextPage = questPage + 1;
          const nextPageQuests = prev.dealerQuestPages?.[nextPage] || [];
          if (nextPageQuests.length === 0 || nextPageQuests.length < 30) {
            // Генерируем квесты для следующей страницы с проверкой уникальности
            const allUsedQuestIds = new Set<string>();
            Object.values(prev.dealerQuestPages || {}).forEach(questIds => {
              questIds.forEach(id => allUsedQuestIds.add(id));
            });
            newCompleted.forEach(id => allUsedQuestIds.add(id));
            
            const allPageQuests = ALL_DEALER_QUESTS.filter(q => q.page === nextPage);
            const availableQuests = allPageQuests.filter(q => !allUsedQuestIds.has(q.id));
            const shuffled = [...availableQuests].sort(() => Math.random() - 0.5);
            const newPageQuests: string[] = [];
            const usedInThisPage = new Set<string>();
            
            for (let i = 0; i < shuffled.length && newPageQuests.length < 30; i++) {
              const questId = shuffled[i].id;
              if (!usedInThisPage.has(questId) && !allUsedQuestIds.has(questId)) {
                newPageQuests.push(questId);
                usedInThisPage.add(questId);
              }
            }
            
            const newPages = { ...(prev.dealerQuestPages || {}), [nextPage]: newPageQuests };
            nextActiveQuest = newPageQuests[0] || null;
            // Инициализируем начальную сумму для нового активного квеста типа "sell_amount"
            if (nextActiveQuest) {
              const nextQuest = getQuestById(nextActiveQuest);
              if (nextQuest && nextQuest.type === 'sell_amount' && newStartAmounts[nextActiveQuest] === undefined) {
                newStartAmounts[nextActiveQuest] = counters.sellAmount || 0;
              }
            }
            return {
              ...prev,
              balance: roundCurrency(newBalance),
              inventory: newInventory,
              dealerCompletedQuests: newCompleted,
              dealerXP: newDealerXP,
              dealerLevel: newDealerLevel,
              dealerActiveQuest: nextActiveQuest,
              dealerQuestPages: newPages,
              dealerQuestStartAmounts: newStartAmounts,
            };
          } else {
            nextActiveQuest = nextPageQuests[0];
            // Инициализируем начальную сумму для нового активного квеста типа "sell_amount"
            if (nextActiveQuest) {
              const nextQuest = getQuestById(nextActiveQuest);
              if (nextQuest && nextQuest.type === 'sell_amount' && newStartAmounts[nextActiveQuest] === undefined) {
                newStartAmounts[nextActiveQuest] = counters.sellAmount || 0;
              }
            }
          }
        }
      }

      return {
        ...prev,
        balance: roundCurrency(newBalance),
        inventory: newInventory,
        dealerCompletedQuests: newCompleted,
        dealerXP: newDealerXP,
        dealerLevel: newDealerLevel,
        dealerActiveQuest: nextActiveQuest,
        dealerQuestStartAmounts: newStartAmounts,
      };
    });
  }, []);

  // Получение множителя цены скупщика
  const getDealerPriceMultiplier = useCallback(() => {
    const level = state.dealerLevel || 1;
    // Накопительный множитель: +5% за уровень
    return 1 + (level - 1) * 0.05;
  }, [state.dealerLevel]);

  // Инициализация первой страницы при первой загрузке
  useEffect(() => {
    if (!state.dealerQuestPages?.[1] || state.dealerQuestPages[1].length === 0) {
      initializeDealerQuestPage(1);
    }
  }, [state.dealerQuestPages, initializeDealerQuestPage]);

  // Проверка выполнения квестов каждые 0.5 секунды
  useEffect(() => {
    if (isLoading) return;

    const checkQuests = () => {
      updateQuestProgress();
      
      // Проверяем активный квест на выполнение
      const activeQuestId = stateRef.current.dealerActiveQuest;
      if (activeQuestId) {
        const quest = getQuestById(activeQuestId);
        if (quest) {
          const counters = stateRef.current.dealerQuestCounters || {
            plantSeeds: {},
            sellFruits: {},
            sellAmount: 0,
            harvestSeeds: {},
            createHybrids: 0,
            doSynthesis: 0,
            useBoosters: {},
          };

          let currentProgress = 0;
          switch (quest.type) {
            case 'plant_seed':
              currentProgress = quest.itemId ? (counters.plantSeeds?.[quest.itemId] || 0) : 0;
              break;
            case 'sell_fruit':
              currentProgress = quest.itemId ? (counters.sellFruits?.[quest.itemId] || 0) : 0;
              break;
            case 'sell_amount':
              // Для квестов "продать на сумму" учитываем только деньги, полученные с момента начала квеста
              const startAmount = stateRef.current.dealerQuestStartAmounts?.[quest.id];
              if (startAmount !== undefined) {
                currentProgress = Math.max(0, (counters.sellAmount || 0) - startAmount);
              }
              break;
            case 'harvest_seed':
              currentProgress = quest.itemId ? (counters.harvestSeeds?.[quest.itemId] || 0) : 0;
              break;
            case 'create_hybrid':
              currentProgress = counters.createHybrids || 0;
              break;
            case 'do_synthesis':
              currentProgress = counters.doSynthesis || 0;
              break;
            case 'use_booster':
              currentProgress = quest.itemId ? (counters.useBoosters?.[quest.itemId] || 0) : 0;
              break;
          }

          if (currentProgress >= quest.target) {
            // Проверяем, показывали ли уже уведомление для этого квеста
            const notificationShown = stateRef.current.dealerQuestNotificationsShown?.includes(quest.id);
            if (!notificationShown) {
              // Квест выполнен - показываем уведомление ТОЛЬКО ОДИН РАЗ
              setDealerQuestNotification({
                questId: quest.id,
                questName: quest.description,
                questEmoji: '🎯',
                message: `Квест "${quest.description}" выполнен! Заберите награду во вкладке "Квесты".`,
              });
              
              // Помечаем, что уведомление показано
              setState(prev => ({
                ...prev,
                dealerQuestNotificationsShown: [...(prev.dealerQuestNotificationsShown || []), quest.id],
              }));
            }
            // Не завершаем автоматически - игрок должен сам нажать "Завершить" в модалке
          }
        }
      }
    };

    const interval = window.setInterval(checkQuests, 500);
    return () => window.clearInterval(interval);
  }, [isLoading, updateQuestProgress]);

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
    dealerQuestNotification,
    clearDealerQuestNotification: () => setDealerQuestNotification(null),
    canClaimDaily,
    claimDaily,
    buyEcoWithTon,
    addItemToInventory,
    startSynthesis,
    completeSynthesis,
    getReferrals: gameAPI.getReferrals,
    setReferralCount,
    reloadFromServer,
    telegramId: tgId,
    // Функции квестов скупщика
    initializeDealerQuestPage,
    completeDealerQuest,
    getDealerPriceMultiplier,
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





