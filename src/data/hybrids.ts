import { SEEDS } from './seeds';
import { FRUITS } from './fruits';

export interface HybridIngredient {
  id: string;
  type: 'seed' | 'fruit';
  count: number;
}

export interface HybridRecipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  ingredients: HybridIngredient[];
  resultSeedId: string; // ID семени гибрида
  resultFruitId: string; // ID фрукта гибрида
  resultName: string;
  resultEmoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Вычисляет стоимость семени гибрида (0.5 от стоимости всех ингредиентов)
export function calculateHybridSeedPrice(ingredients: HybridIngredient[]): number {
  let totalCost = 0;
  
  for (const ingredient of ingredients) {
    if (ingredient.type === 'seed') {
      const seed = SEEDS[ingredient.id as keyof typeof SEEDS];
      if (seed) {
        totalCost += seed.price * ingredient.count;
      }
    } else {
      const fruit = FRUITS[ingredient.id as keyof typeof FRUITS];
      if (fruit) {
        // Находим семя для этого фрукта
        const seedEntry = Object.values(SEEDS).find(s => s.fruitId === ingredient.id);
        if (seedEntry) {
          totalCost += seedEntry.price * ingredient.count;
        }
      }
    }
  }
  
  return Math.floor(totalCost * 0.5);
}

// Вычисляет время роста гибрида (сумма времени роста всех семян)
export function calculateHybridGrowTime(ingredients: HybridIngredient[]): number {
  let totalGrowTime = 0;
  
  for (const ingredient of ingredients) {
    if (ingredient.type === 'seed') {
      const seed = SEEDS[ingredient.id as keyof typeof SEEDS];
      if (seed) {
        totalGrowTime += seed.growSeconds * ingredient.count;
      }
    } else {
      // Для фруктов берем время роста их семени
      const seedEntry = Object.values(SEEDS).find(s => s.fruitId === ingredient.id);
      if (seedEntry) {
        totalGrowTime += seedEntry.growSeconds * ingredient.count;
      }
    }
  }
  
  return totalGrowTime;
}

// Вычисляет стоимость продажи фрукта гибрида (3x от стоимости всех ингредиентов)
export function calculateHybridFruitPrice(ingredients: HybridIngredient[]): number {
  let totalCost = 0;
  
  for (const ingredient of ingredients) {
    if (ingredient.type === 'seed') {
      const seed = SEEDS[ingredient.id as keyof typeof SEEDS];
      if (seed) {
        totalCost += seed.price * ingredient.count;
      }
    } else {
      const fruit = FRUITS[ingredient.id as keyof typeof FRUITS];
      if (fruit) {
        const seedEntry = Object.values(SEEDS).find(s => s.fruitId === ingredient.id);
        if (seedEntry) {
          totalCost += seedEntry.price * ingredient.count;
        }
      }
    }
  }
  
  return Math.floor(totalCost * 3);
}

export const HYBRID_RECIPES: HybridRecipe[] = [
  {
    id: 'golden_apple',
    name: 'Золотое яблоко',
    emoji: '✨',
    description: 'Магическое яблоко с золотым блеском',
    ingredients: [
      { id: 'apple_seed', type: 'seed', count: 2 },
      { id: 'cherry', type: 'fruit', count: 3 },
      { id: 'grape', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'golden_apple_seed',
    resultFruitId: 'golden_apple_fruit',
    resultName: 'Семена золотого яблока',
    resultEmoji: '✨',
    rarity: 'epic'
  },
  {
    id: 'rainbow_rose',
    name: 'Радужная роза',
    emoji: '🌈',
    description: 'Роза, переливающаяся всеми цветами радуги',
    ingredients: [
      { id: 'rose_seed', type: 'seed', count: 1 },
      { id: 'lily', type: 'fruit', count: 2 },
      { id: 'sunflower', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'rainbow_rose_seed',
    resultFruitId: 'rainbow_rose_fruit',
    resultName: 'Семена радужной розы',
    resultEmoji: '🌈',
    rarity: 'rare'
  },
  {
    id: 'crystal_cactus',
    name: 'Кристальный кактус',
    emoji: '💎',
    description: 'Кактус с кристальными иголками',
    ingredients: [
      { id: 'cactus_seed', type: 'seed', count: 1 },
      { id: 'bamboo_shoot', type: 'fruit', count: 2 },
      { id: 'pinecone', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'crystal_cactus_seed',
    resultFruitId: 'crystal_cactus_fruit',
    resultName: 'Семена кристального кактуса',
    resultEmoji: '💎',
    rarity: 'rare'
  },
  {
    id: 'mystic_vine',
    name: 'Мистическая лоза',
    emoji: '🔮',
    description: 'Виноградная лоза с магическими свойствами',
    ingredients: [
      { id: 'grape_seed', type: 'seed', count: 1 },
      { id: 'dragon_fruit', type: 'fruit', count: 1 },
      { id: 'phoenix_feather', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'mystic_vine_seed',
    resultFruitId: 'mystic_vine_fruit',
    resultName: 'Семена мистической лозы',
    resultEmoji: '🔮',
    rarity: 'legendary'
  },
  {
    id: 'forest_guardian',
    name: 'Лесной страж',
    emoji: '🛡️',
    description: 'Древнее дерево-защитник леса',
    ingredients: [
      { id: 'oak_seed', type: 'seed', count: 2 },
      { id: 'fir_seed', type: 'seed', count: 1 },
      { id: 'bamboo_shoot', type: 'fruit', count: 3 }
    ],
    resultSeedId: 'forest_guardian_seed',
    resultFruitId: 'forest_guardian_fruit',
    resultName: 'Семена лесного стража',
    resultEmoji: '🛡️',
    rarity: 'epic'
  },
  {
    id: 'cosmic_flower',
    name: 'Космический цветок',
    emoji: '⭐',
    description: 'Цветок, вобравший в себя энергию звезд',
    ingredients: [
      { id: 'lily_seed', type: 'seed', count: 1 },
      { id: 'sunflower_seed', type: 'seed', count: 1 },
      { id: 'apple', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'cosmic_flower_seed',
    resultFruitId: 'cosmic_flower_fruit',
    resultName: 'Семена космического цветка',
    resultEmoji: '⭐',
    rarity: 'uncommon'
  }
];

export const getHybridById = (id: string) => {
  return HYBRID_RECIPES.find(recipe => recipe.id === id);
};



