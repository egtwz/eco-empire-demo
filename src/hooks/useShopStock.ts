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

function generateStock(): StockItem[] {
  const allSeeds = Object.values(SEEDS);
  const now = Date.now();
  const refreshTime = 60000; // 60 секунд = 1 минута
  
  return allSeeds.map(seed => {
    // Проверяем шанс появления
    const chance = RARITY_CHANCE[seed.rarity];
    const appears = Math.random() * 100 < chance;
    
    // Если появляется, даем случайное количество
    let stock = 0;
    if (appears) {
      const maxStock = RARITY_STOCK[seed.rarity];
      stock = Math.floor(Math.random() * maxStock) + 1;
    }
    
    return {
      ...seed,
      stock,
      nextRefresh: now + refreshTime
    };
  }); // Показываем все, даже с 0 в наличии
}

export function useShopStock() {
  const [stock, setStock] = useState<StockItem[]>(() => generateStock());

  const [currentTime, setCurrentTime] = useState(Date.now());

  // Обновляем время каждую секунду (для таймера)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Больше не сохраняем локально

  // Обновляем каждую минуту по мировому времени
  useEffect(() => {
    const now = Date.now();
    const secondsUntilNextMinute = 60000 - (now % 60000);
    
    const timeout = setTimeout(() => {
      setStock(generateStock());
    }, secondsUntilNextMinute);
    
    // Запускаем интервал для обновления каждую минуту
    const interval = setInterval(() => {
      setStock(generateStock());
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
    setStock(prev => prev.map(item => {
      if (item.id === seedId && item.stock > 0) {
        return { ...item, stock: item.stock - 1 };
      }
      return item;
    }));
  };

  return { stock, timeToRefresh, decreaseStock };
}

