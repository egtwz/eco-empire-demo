import { useState, useEffect, useMemo } from 'react';
import { BoosterId, BOOSTERS } from '../data/boosters';

interface BoosterStockItem {
  id: BoosterId;
  stock: number;
  maxStock: number;
  nextRefresh: number; // timestamp в ms
}

// Лимиты бустеров в сутки
const BOOSTER_DAILY_LIMITS: Record<BoosterId, number> = {
  booster_speedup: 2,      // Ускорители роста: 2 в сутки
  booster_watering_can: 5,  // Лейки: 5 в сутки
  booster_fertilizer: 5,    // Удобрения: 5 в сутки
};

// Получаем текущее время в МСК (UTC+3)
function getMoscowTime(): Date {
  const now = new Date();
  const mskOffset = 3 * 60; // МСК = UTC+3 (в минутах)
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const mskTime = new Date(utcTime + (mskOffset * 60000));
  return mskTime;
}

// Получаем ключ для текущего дня по МСК (YYYY-MM-DD)
function getMoscowDateKey(): string {
  const mskTime = getMoscowTime();
  return mskTime.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Получаем timestamp следующей полночи по МСК
function getNextMidnightMoscow(): number {
  const mskTime = getMoscowTime();
  const now = Date.now();
  
  // Вычисляем время до следующей полночи по МСК
  const mskHours = mskTime.getHours();
  const mskMinutes = mskTime.getMinutes();
  const mskSeconds = mskTime.getSeconds();
  const mskMs = mskTime.getMilliseconds();
  
  // Миллисекунды до следующей полночи по МСК
  const msUntilMidnight = (24 - mskHours) * 3600000 - mskMinutes * 60000 - mskSeconds * 1000 - mskMs;
  
  // МСК offset относительно UTC (3 часа = 3*60*60*1000 мс)
  const mskOffsetMs = 3 * 60 * 60 * 1000;
  // Локальное смещение относительно UTC
  const localOffsetMs = new Date().getTimezoneOffset() * 60000;
  
  // Разница между МСК и локальным временем
  const offsetDiff = mskOffsetMs - localOffsetMs;
  
  // Возвращаем локальное время, соответствующее следующей полночи МСК
  return now + msUntilMidnight - offsetDiff;
}

function storageKeyFor(dateKey: string): string {
  return `boosterStock:v1:${dateKey}`;
}

function readFromStorage(dateKey: string): Partial<Record<BoosterId, number>> | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(dateKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as Partial<Record<BoosterId, number>>;
  } catch {
    return null;
  }
}

function writeToStorage(dateKey: string, purchased: Record<BoosterId, number> | Partial<Record<BoosterId, number>>) {
  try {
    localStorage.setItem(storageKeyFor(dateKey), JSON.stringify(purchased));
  } catch {}
}

// Генерируем начальные запасы для дня
function generateStockForDate(dateKey: string): BoosterStockItem[] {
  const purchased = readFromStorage(dateKey) || ({} as Partial<Record<BoosterId, number>>);
  const nextRefresh = getNextMidnightMoscow();
  
  return Object.values(BOOSTERS).map(booster => {
    const purchasedCount = purchased[booster.id] || 0;
    const maxStock = BOOSTER_DAILY_LIMITS[booster.id];
    const stock = Math.max(0, maxStock - purchasedCount);
    
    return {
      id: booster.id,
      stock,
      maxStock,
      nextRefresh,
    };
  });
}

let cachedDateKey: string | null = null;
let cachedStock: BoosterStockItem[] | null = null;

export function useBoosterStock() {
  const initialDateKey = getMoscowDateKey();
  const [stock, setStock] = useState<BoosterStockItem[]>(() => {
    if (cachedDateKey === initialDateKey && cachedStock) return cachedStock;
    const gen = generateStockForDate(initialDateKey);
    cachedDateKey = initialDateKey;
    cachedStock = gen;
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

  // Проверяем обновление дня (полночь по МСК)
  useEffect(() => {
    const checkDateChange = () => {
      const currentDateKey = getMoscowDateKey();
      
      // Если дата изменилась, обновляем запасы
      if (cachedDateKey !== currentDateKey) {
        const gen = generateStockForDate(currentDateKey);
        cachedDateKey = currentDateKey;
        cachedStock = gen;
        setStock(gen);
      } else {
        // Обновляем nextRefresh в текущих запасах
        const nextRefresh = getNextMidnightMoscow();
        setStock(prev => prev.map(item => ({ ...item, nextRefresh })));
      }
    };

    // Проверяем сразу
    checkDateChange();

    // Проверяем каждую минуту
    const interval = setInterval(checkDateChange, 60000);

    return () => clearInterval(interval);
  }, []);

  // Вычисляем время до обновления
  const timeToRefresh = useMemo(() => {
    if (stock.length === 0) return 0;
    const nextRefresh = stock[0].nextRefresh;
    const diff = nextRefresh - currentTime;
    return Math.max(0, Math.floor(diff / 1000)); // в секундах
  }, [stock, currentTime]);

  // Функция уменьшения stock при покупке
  const decreaseStock = (boosterId: BoosterId) => {
    setStock(prev => {
      const next = prev.map(item => {
        if (item.id === boosterId && item.stock > 0) {
          return { ...item, stock: item.stock - 1 };
        }
        return item;
      });
      
      // Сохраняем количество купленных бустеров за день
      const dateKey = getMoscowDateKey();
      const purchased = readFromStorage(dateKey) || ({} as Partial<Record<BoosterId, number>>);
      const updatedPurchased: Record<BoosterId, number> = {
        booster_speedup: purchased.booster_speedup || 0,
        booster_watering_can: purchased.booster_watering_can || 0,
        booster_fertilizer: purchased.booster_fertilizer || 0,
      };
      updatedPurchased[boosterId] = (updatedPurchased[boosterId] || 0) + 1;
      writeToStorage(dateKey, updatedPurchased);
      
      cachedDateKey = dateKey;
      cachedStock = next;
      return next;
    });
  };

  return { stock, timeToRefresh, decreaseStock };
}

