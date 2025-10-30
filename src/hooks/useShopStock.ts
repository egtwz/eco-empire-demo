import { useState, useEffect, useMemo } from 'react';
import { SEEDS, SeedDef, Rarity } from '../data/seeds';

interface StockItem extends SeedDef {
  stock: number;
  nextRefresh: number; // timestamp в ms
}

// Шансы появления семян по редкости (в процентах)
const RARITY_CHANCE: Record<Rarity, number> = {
  common: 80,      // 80% шанс появления
  uncommon: 50,    // 50% шанс
  rare: 30,        // 30% шанс
  epic: 15,        // 15% шанс
  legendary: 5     // 5% шанс
};

// Количество семян в наличии по редкости
const RARITY_STOCK: Record<Rarity, number> = {
  common: 20,
  uncommon: 15,
  rare: 10,
  epic: 5,
  legendary: 3
};

// Детеминированный генератор псевдослучайных чисел (mulberry32)
function mulberry32(a: number) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

let cachedMinuteKey: number | null = null;
let cachedStock: StockItem[] | null = null;

function storageKeyFor(minuteKey: number) {
  return `shopStock:v1:${minuteKey}`;
}

function readFromStorage(minuteKey: number): StockItem[] | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(minuteKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as StockItem[];
  } catch {
    return null;
  }
}

function writeToStorage(minuteKey: number, stock: StockItem[]) {
  try {
    localStorage.setItem(storageKeyFor(minuteKey), JSON.stringify(stock));
  } catch {}
}

function generateStockForMinute(minuteKey: number): StockItem[] {
  const allSeeds = Object.values(SEEDS);
  const now = minuteKey * 60000;
  const refreshTime = 60000;

  return allSeeds.map(seed => {
    // Инициализируем RNG на основе мирового времени и id семени
    const seedStr = `${minuteKey}:${seed.id}`;
    const rng = mulberry32(hashStringToSeed(seedStr));
    const chance = RARITY_CHANCE[seed.rarity];
    const appears = rng() * 100 < chance;

    let stock = 0;
    if (appears) {
      const maxStock = RARITY_STOCK[seed.rarity];
      stock = Math.floor(rng() * maxStock) + 1;
    }

    return { ...seed, stock, nextRefresh: now + refreshTime };
  });
}

export function useShopStock() {
  const initialMinute = Math.floor(Date.now() / 60000);
  const [stock, setStock] = useState<StockItem[]>(() => {
    if (cachedMinuteKey === initialMinute && cachedStock) return cachedStock;
    const stored = readFromStorage(initialMinute);
    const gen = stored ?? generateStockForMinute(initialMinute);
    cachedMinuteKey = initialMinute;
    cachedStock = gen;
    writeToStorage(initialMinute, gen);
    return gen;
  });

  const [currentTime, setCurrentTime] = useState(Date.now());

  // Обновляем время каждую секунду (для таймера)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Обновляем каждую минуту по мировому времени, детерминированно
  useEffect(() => {
    const now = Date.now();
    const msUntilNextMinute = 60000 - (now % 60000);
    
    const timeout = setTimeout(() => {
      const minuteKey = Math.floor(Date.now() / 60000);
      const stored = readFromStorage(minuteKey);
      const gen = stored ?? generateStockForMinute(minuteKey);
      cachedMinuteKey = minuteKey;
      cachedStock = gen;
      writeToStorage(minuteKey, gen);
      setStock(gen);
    }, msUntilNextMinute);
    
    // Запускаем интервал для обновления каждую минуту
    const interval = setInterval(() => {
      const minuteKey = Math.floor(Date.now() / 60000);
      const stored = readFromStorage(minuteKey);
      const gen = stored ?? generateStockForMinute(minuteKey);
      cachedMinuteKey = minuteKey;
      cachedStock = gen;
      writeToStorage(minuteKey, gen);
      setStock(gen);
    }, 60000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Вычисляем время до обновления
  const timeToRefresh = useMemo(() => {
    if (stock.length === 0) return 0;
    const nextRefresh = stock[0].nextRefresh;
    const diff = nextRefresh - currentTime;
    return Math.max(0, Math.floor(diff / 1000)); // в секундах
  }, [stock, currentTime]);

  // Функция уменьшения stock при покупке
  const decreaseStock = (seedId: string) => {
    setStock(prev => {
      const next = prev.map(item => {
        if (item.id === seedId && item.stock > 0) {
          return { ...item, stock: item.stock - 1 };
        }
        return item;
      });
      // persist current minute stock
      const minuteKey = Math.floor(Date.now() / 60000);
      cachedMinuteKey = minuteKey;
      cachedStock = next;
      writeToStorage(minuteKey, next);
      return next;
    });
  };

  return { stock, timeToRefresh, decreaseStock };
}

