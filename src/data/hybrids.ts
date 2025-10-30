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
  tier: 1 | 2 | 3 | 4 | 5 | 6; // Тир гибрида
  requiredLevel: number; // Минимальный уровень для крафта
}

// Вычисляет стоимость семени гибрида (2x от стоимости всех ингредиентов как семена)
export function calculateHybridSeedPrice(ingredients: HybridIngredient[]): number {
  let totalCost = 0;
  
  for (const ingredient of ingredients) {
    if (ingredient.type === 'seed') {
      // Берем цену СЕМЕНИ
      const seed = SEEDS[ingredient.id as keyof typeof SEEDS];
      if (seed) {
        totalCost += seed.price * ingredient.count;
      } else {
        // Если не обычное семя, проверяем гибридное
        const hybridRecipe = HYBRID_RECIPES.find(r => r.resultSeedId === ingredient.id);
        if (hybridRecipe) {
          const hybridSeedPrice = calculateHybridSeedPrice(hybridRecipe.ingredients);
          totalCost += hybridSeedPrice * ingredient.count;
        }
      }
    } else {
      // Для ПЛОДА берем цену его СЕМЕНИ
      const seedEntry = Object.values(SEEDS).find(s => s.fruitId === ingredient.id);
      if (seedEntry) {
        totalCost += seedEntry.price * ingredient.count;
      } else {
        // Если не обычный плод, проверяем гибридный
        const hybridRecipe = HYBRID_RECIPES.find(r => r.resultFruitId === ingredient.id);
        if (hybridRecipe) {
          const hybridSeedPrice = calculateHybridSeedPrice(hybridRecipe.ingredients);
          totalCost += hybridSeedPrice * ingredient.count;
        }
      }
    }
  }
  
  return Math.floor(totalCost * 2);
}

// Вычисляет время роста гибрида (3x от суммы времени роста семян ингредиентов)
export function calculateHybridGrowTime(ingredients: HybridIngredient[]): number {
  let totalGrowTime = 0;
  
  for (const ingredient of ingredients) {
    if (ingredient.type === 'seed') {
      // Проверяем обычные семена
      const seed = SEEDS[ingredient.id as keyof typeof SEEDS];
      if (seed) {
        totalGrowTime += seed.growSeconds * ingredient.count;
      } else {
        // Если не обычное семя, проверяем гибридное
        const hybridRecipe = HYBRID_RECIPES.find(r => r.resultSeedId === ingredient.id);
        if (hybridRecipe) {
          const hybridGrowTime = calculateHybridGrowTime(hybridRecipe.ingredients);
          totalGrowTime += hybridGrowTime * ingredient.count;
        }
      }
    } else {
      // Проверяем обычные фрукты - берем время роста их семени
      const seedEntry = Object.values(SEEDS).find(s => s.fruitId === ingredient.id);
      if (seedEntry) {
        totalGrowTime += seedEntry.growSeconds * ingredient.count;
      } else {
        // Если не обычный фрукт, проверяем гибридный
        const hybridRecipe = HYBRID_RECIPES.find(r => r.resultFruitId === ingredient.id);
        if (hybridRecipe) {
          const hybridGrowTime = calculateHybridGrowTime(hybridRecipe.ingredients);
          totalGrowTime += hybridGrowTime * ingredient.count;
        }
      }
    }
  }
  
  return Math.floor(totalGrowTime * 3);
}

// Вычисляет стоимость продажи фрукта гибрида (2x от стоимости всех ингредиентов как плоды)
export function calculateHybridFruitPrice(ingredients: HybridIngredient[]): number {
  let totalCost = 0;
  
  for (const ingredient of ingredients) {
    if (ingredient.type === 'fruit') {
      // Берем цену ФРУКТА
      const fruit = FRUITS[ingredient.id as keyof typeof FRUITS];
      if (fruit) {
        totalCost += fruit.sellPrice * ingredient.count;
      } else {
        // Если не обычный фрукт, проверяем гибридный
        const hybridRecipe = HYBRID_RECIPES.find(r => r.resultFruitId === ingredient.id);
        if (hybridRecipe) {
          const hybridFruitPrice = calculateHybridFruitPrice(hybridRecipe.ingredients);
          totalCost += hybridFruitPrice * ingredient.count;
        }
      }
    } else {
      // Для СЕМЕНИ берем цену его ПЛОДА
      const seed = SEEDS[ingredient.id as keyof typeof SEEDS];
      if (seed) {
        const fruit = FRUITS[seed.fruitId as keyof typeof FRUITS];
        if (fruit) {
          totalCost += fruit.sellPrice * ingredient.count;
        }
      } else {
        // Если не обычное семя, проверяем гибридное
        const hybridRecipe = HYBRID_RECIPES.find(r => r.resultSeedId === ingredient.id);
        if (hybridRecipe) {
          const hybridFruitPrice = calculateHybridFruitPrice(hybridRecipe.ingredients);
          totalCost += hybridFruitPrice * ingredient.count;
        }
      }
    }
  }
  
  return Math.floor(totalCost * 2);
}

export const HYBRID_RECIPES: HybridRecipe[] = [
  // ============ ТИР 1 (Уровень 2+) - Крафт из обычных семян/фруктов ============
  {
    id: 'golden_apple_t1',
    name: 'Золотое яблоко',
    emoji: '✨',
    description: 'Магическое яблоко с золотым блеском',
    ingredients: [
      { id: 'apple_seed', type: 'seed', count: 2 },
      { id: 'cherry', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'golden_apple_seed_t1',
    resultFruitId: 'golden_apple_fruit_t1',
    resultName: 'Семена золотого яблока',
    resultEmoji: '✨',
    rarity: 'uncommon',
    tier: 1,
    requiredLevel: 2
  },
  {
    id: 'rainbow_rose_t1',
    name: 'Радужная роза',
    emoji: '🌈',
    description: 'Роза всех цветов радуги',
    ingredients: [
      { id: 'rose_seed', type: 'seed', count: 1 },
      { id: 'lily', type: 'fruit', count: 2 },
      { id: 'sunflower', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'rainbow_rose_seed_t1',
    resultFruitId: 'rainbow_rose_fruit_t1',
    resultName: 'Семена радужной розы',
    resultEmoji: '🌈',
    rarity: 'uncommon',
    tier: 1,
    requiredLevel: 2
  },
  {
    id: 'crystal_bamboo_t1',
    name: 'Кристальный бамбук',
    emoji: '💎',
    description: 'Бамбук с кристальной структурой',
    ingredients: [
      { id: 'bamboo_seed', type: 'seed', count: 2 },
      { id: 'pinecone', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'crystal_bamboo_seed_t1',
    resultFruitId: 'crystal_bamboo_fruit_t1',
    resultName: 'Семена кристального бамбука',
    resultEmoji: '💎',
    rarity: 'uncommon',
    tier: 1,
    requiredLevel: 2
  },
  {
    id: 'fire_pepper_t1',
    name: 'Огненный перец',
    emoji: '🔥',
    description: 'Острейший перец с огненным вкусом',
    ingredients: [
      { id: 'pepper_seed', type: 'seed', count: 2 },
      { id: 'tomato', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'fire_pepper_seed_t1',
    resultFruitId: 'fire_pepper_fruit_t1',
    resultName: 'Семена огненного перца',
    resultEmoji: '🔥',
    rarity: 'uncommon',
    tier: 1,
    requiredLevel: 2
  },
  {
    id: 'moon_berry_t1',
    name: 'Лунная ягода',
    emoji: '🌙',
    description: 'Ягода, светящаяся в темноте',
    ingredients: [
      { id: 'berry_seed', type: 'seed', count: 3 },
      { id: 'grape', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'moon_berry_seed_t1',
    resultFruitId: 'moon_berry_fruit_t1',
    resultName: 'Семена лунной ягоды',
    resultEmoji: '🌙',
    rarity: 'uncommon',
    tier: 1,
    requiredLevel: 2
  },
  {
    id: 'ice_lotus_t1',
    name: 'Ледяной лотос',
    emoji: '❄️',
    description: 'Холодный цветок вечной зимы',
    ingredients: [
      { id: 'lily_seed', type: 'seed', count: 1 },
      { id: 'grape', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'ice_lotus_seed_t1',
    resultFruitId: 'ice_lotus_fruit_t1',
    resultName: 'Семена ледяного лотоса',
    resultEmoji: '❄️',
    rarity: 'uncommon',
    tier: 1,
    requiredLevel: 2
  },
  {
    id: 'thunder_oak_t1',
    name: 'Громовой дуб',
    emoji: '⚡',
    description: 'Дерево, притягивающее молнии',
    ingredients: [
      { id: 'oak_seed', type: 'seed', count: 2 },
      { id: 'acorn', type: 'fruit', count: 3 }
    ],
    resultSeedId: 'thunder_oak_seed_t1',
    resultFruitId: 'thunder_oak_fruit_t1',
    resultName: 'Семена громового дуба',
    resultEmoji: '⚡',
    rarity: 'uncommon',
    tier: 1,
    requiredLevel: 2
  },
  {
    id: 'sugar_corn_t1',
    name: 'Сахарная кукуруза',
    emoji: '🌽',
    description: 'Сладчайшая кукуруза',
    ingredients: [
      { id: 'corn_seed', type: 'seed', count: 2 },
      { id: 'strawberry', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'sugar_corn_seed_t1',
    resultFruitId: 'sugar_corn_fruit_t1',
    resultName: 'Семена сахарной кукурузы',
    resultEmoji: '🌽',
    rarity: 'uncommon',
    tier: 1,
    requiredLevel: 2
  },
  {
    id: 'spicy_tomato_t1',
    name: 'Острый томат',
    emoji: '🍅',
    description: 'Томат с перечным вкусом',
    ingredients: [
      { id: 'tomato_seed', type: 'seed', count: 1 },
      { id: 'pepper', type: 'fruit', count: 2 },
      { id: 'garlic', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'spicy_tomato_seed_t1',
    resultFruitId: 'spicy_tomato_fruit_t1',
    resultName: 'Семена острого томата',
    resultEmoji: '🍅',
    rarity: 'uncommon',
    tier: 1,
    requiredLevel: 2
  },
  {
    id: 'mystic_mushroom_t1',
    name: 'Мистический гриб',
    emoji: '🍄',
    description: 'Гриб со странными свойствами',
    ingredients: [
      { id: 'mushroom_seed', type: 'seed', count: 3 },
      { id: 'blueberry', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'mystic_mushroom_seed_t1',
    resultFruitId: 'mystic_mushroom_fruit_t1',
    resultName: 'Споры мистического гриба',
    resultEmoji: '🍄',
    rarity: 'uncommon',
    tier: 1,
    requiredLevel: 2
  },

  // ============ ТИР 2 (Уровень 2+) - Крафт из Т1 гибридов ============
  {
    id: 'solar_fruit_t2',
    name: 'Солнечный плод',
    emoji: '☀️',
    description: 'Плод, излучающий свет солнца',
    ingredients: [
      { id: 'golden_apple_seed_t1', type: 'seed', count: 1 },
      { id: 'rainbow_rose_fruit_t1', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'solar_fruit_seed_t2',
    resultFruitId: 'solar_fruit_fruit_t2',
    resultName: 'Семена солнечного плода',
    resultEmoji: '☀️',
    rarity: 'rare',
    tier: 2,
    requiredLevel: 2
  },
  {
    id: 'frozen_gem_t2',
    name: 'Ледяной кристалл',
    emoji: '🧊',
    description: 'Растение из вечной мерзлоты',
    ingredients: [
      { id: 'ice_lotus_seed_t1', type: 'seed', count: 1 },
      { id: 'fire_pepper_fruit_t1', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'frozen_gem_seed_t2',
    resultFruitId: 'frozen_gem_fruit_t2',
    resultName: 'Семена ледяного кристалла',
    resultEmoji: '🧊',
    rarity: 'rare',
    tier: 2,
    requiredLevel: 2
  },
  {
    id: 'thunder_vine_t2',
    name: 'Громовая лоза',
    emoji: '⚡',
    description: 'Лоза с электрической энергией',
    ingredients: [
      { id: 'thunder_oak_seed_t1', type: 'seed', count: 1 },
      { id: 'golden_apple_fruit_t1', type: 'fruit', count: 1 },
      { id: 'crystal_bamboo_fruit_t1', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'thunder_vine_seed_t2',
    resultFruitId: 'thunder_vine_fruit_t2',
    resultName: 'Семена громовой лозы',
    resultEmoji: '⚡',
    rarity: 'rare',
    tier: 2,
    requiredLevel: 2
  },
  {
    id: 'night_blossom_t2',
    name: 'Ночной цветок',
    emoji: '🌺',
    description: 'Цветок распускается только ночью',
    ingredients: [
      { id: 'moon_berry_seed_t1', type: 'seed', count: 2 },
      { id: 'rainbow_rose_fruit_t1', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'night_blossom_seed_t2',
    resultFruitId: 'night_blossom_fruit_t2',
    resultName: 'Семена ночного цветка',
    resultEmoji: '🌺',
    rarity: 'rare',
    tier: 2,
    requiredLevel: 2
  },
  {
    id: 'diamond_fruit_t2',
    name: 'Алмазный плод',
    emoji: '💠',
    description: 'Твердый как алмаз',
    ingredients: [
      { id: 'crystal_bamboo_seed_t1', type: 'seed', count: 1 },
      { id: 'ice_lotus_fruit_t1', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'diamond_fruit_seed_t2',
    resultFruitId: 'diamond_fruit_fruit_t2',
    resultName: 'Семена алмазного плода',
    resultEmoji: '💠',
    rarity: 'rare',
    tier: 2,
    requiredLevel: 2
  },
  {
    id: 'volcano_pepper_t2',
    name: 'Вулканический перец',
    emoji: '🌋',
    description: 'Жар как из вулкана',
    ingredients: [
      { id: 'fire_pepper_seed_t1', type: 'seed', count: 2 },
      { id: 'spicy_tomato_fruit_t1', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'volcano_pepper_seed_t2',
    resultFruitId: 'volcano_pepper_fruit_t2',
    resultName: 'Семена вулканического перца',
    resultEmoji: '🌋',
    rarity: 'rare',
    tier: 2,
    requiredLevel: 2
  },
  {
    id: 'spirit_corn_t2',
    name: 'Духовная кукуруза',
    emoji: '👻',
    description: 'Растет в мире духов',
    ingredients: [
      { id: 'sugar_corn_seed_t1', type: 'seed', count: 1 },
      { id: 'mystic_mushroom_fruit_t1', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'spirit_corn_seed_t2',
    resultFruitId: 'spirit_corn_fruit_t2',
    resultName: 'Семена духовной кукурузы',
    resultEmoji: '👻',
    rarity: 'rare',
    tier: 2,
    requiredLevel: 2
  },
  {
    id: 'star_berry_t2',
    name: 'Звездная ягода',
    emoji: '⭐',
    description: 'Сияет как звезда',
    ingredients: [
      { id: 'golden_apple_fruit_t1', type: 'fruit', count: 1 },
      { id: 'moon_berry_fruit_t1', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'star_berry_seed_t2',
    resultFruitId: 'star_berry_fruit_t2',
    resultName: 'Семена звездной ягоды',
    resultEmoji: '⭐',
    rarity: 'rare',
    tier: 2,
    requiredLevel: 2
  },
  {
    id: 'storm_tree_t2',
    name: 'Штормовое древо',
    emoji: '🌪️',
    description: 'Древо бури и ветра',
    ingredients: [
      { id: 'thunder_oak_seed_t1', type: 'seed', count: 1 },
      { id: 'ice_lotus_fruit_t1', type: 'fruit', count: 1 },
      { id: 'fire_pepper_fruit_t1', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'storm_tree_seed_t2',
    resultFruitId: 'storm_tree_fruit_t2',
    resultName: 'Семена штормового древа',
    resultEmoji: '🌪️',
    rarity: 'rare',
    tier: 2,
    requiredLevel: 2
  },
  {
    id: 'prism_flower_t2',
    name: 'Призматический цветок',
    emoji: '🔆',
    description: 'Преломляет свет во все цвета',
    ingredients: [
      { id: 'rainbow_rose_seed_t1', type: 'seed', count: 1 },
      { id: 'crystal_bamboo_fruit_t1', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'prism_flower_seed_t2',
    resultFruitId: 'prism_flower_fruit_t2',
    resultName: 'Семена призматического цветка',
    resultEmoji: '🔆',
    rarity: 'rare',
    tier: 2,
    requiredLevel: 2
  },

  // ============ ТИР 3 (Уровень 3+) - Крафт из Т1-Т2 гибридов ============
  {
    id: 'celestial_bloom_t3',
    name: 'Небесный цветок',
    emoji: '🌟',
    description: 'Цветок небесных садов',
    ingredients: [
      { id: 'solar_fruit_seed_t2', type: 'seed', count: 1 },
      { id: 'star_berry_fruit_t2', type: 'fruit', count: 1 },
      { id: 'prism_flower_fruit_t2', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'celestial_bloom_seed_t3',
    resultFruitId: 'celestial_bloom_fruit_t3',
    resultName: 'Семена небесного цветка',
    resultEmoji: '🌟',
    rarity: 'epic',
    tier: 3,
    requiredLevel: 3
  },
  {
    id: 'void_root_t3',
    name: 'Корень Бездны',
    emoji: '🌑',
    description: 'Корень из темных глубин',
    ingredients: [
      { id: 'night_blossom_seed_t2', type: 'seed', count: 1 },
      { id: 'frozen_gem_fruit_t2', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'void_root_seed_t3',
    resultFruitId: 'void_root_fruit_t3',
    resultName: 'Семена корня Бездны',
    resultEmoji: '🌑',
    rarity: 'epic',
    tier: 3,
    requiredLevel: 3
  },
  {
    id: 'phoenix_blossom_t3',
    name: 'Цветок феникса',
    emoji: '🦅',
    description: 'Возрождающийся из пепла',
    ingredients: [
      { id: 'volcano_pepper_seed_t2', type: 'seed', count: 1 },
      { id: 'solar_fruit_fruit_t2', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'phoenix_blossom_seed_t3',
    resultFruitId: 'phoenix_blossom_fruit_t3',
    resultName: 'Семена цветка феникса',
    resultEmoji: '🦅',
    rarity: 'epic',
    tier: 3,
    requiredLevel: 3
  },
  {
    id: 'nebula_plant_t3',
    name: 'Туманное растение',
    emoji: '🌌',
    description: 'Из космической туманности',
    ingredients: [
      { id: 'star_berry_seed_t2', type: 'seed', count: 1 },
      { id: 'spirit_corn_fruit_t2', type: 'fruit', count: 1 },
      { id: 'night_blossom_fruit_t2', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'nebula_plant_seed_t3',
    resultFruitId: 'nebula_plant_fruit_t3',
    resultName: 'Семена туманного растения',
    resultEmoji: '🌌',
    rarity: 'epic',
    tier: 3,
    requiredLevel: 3
  },
  {
    id: 'aurora_leaf_t3',
    name: 'Полярный лист',
    emoji: '🎇',
    description: 'Сияние северного сияния',
    ingredients: [
      { id: 'frozen_gem_seed_t2', type: 'seed', count: 1 },
      { id: 'prism_flower_fruit_t2', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'aurora_leaf_seed_t3',
    resultFruitId: 'aurora_leaf_fruit_t3',
    resultName: 'Семена полярного листа',
    resultEmoji: '🎇',
    rarity: 'epic',
    tier: 3,
    requiredLevel: 3
  },
  {
    id: 'dragon_scale_t3',
    name: 'Драконья чешуя',
    emoji: '🐉',
    description: 'Твердая как чешуя дракона',
    ingredients: [
      { id: 'diamond_fruit_seed_t2', type: 'seed', count: 1 },
      { id: 'volcano_pepper_fruit_t2', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'dragon_scale_seed_t3',
    resultFruitId: 'dragon_scale_fruit_t3',
    resultName: 'Семена драконьей чешуи',
    resultEmoji: '🐉',
    rarity: 'epic',
    tier: 3,
    requiredLevel: 3
  },
  {
    id: 'quantum_berry_t3',
    name: 'Квантовая ягода',
    emoji: '⚛️',
    description: 'Существует в двух местах одновременно',
    ingredients: [
      { id: 'spirit_corn_seed_t2', type: 'seed', count: 1 },
      { id: 'diamond_fruit_fruit_t2', type: 'fruit', count: 1 },
      { id: 'thunder_vine_fruit_t2', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'quantum_berry_seed_t3',
    resultFruitId: 'quantum_berry_fruit_t3',
    resultName: 'Семена квантовой ягоды',
    resultEmoji: '⚛️',
    rarity: 'epic',
    tier: 3,
    requiredLevel: 3
  },
  {
    id: 'gravity_root_t3',
    name: 'Гравитационный корень',
    emoji: '🌀',
    description: 'Притягивает все вокруг',
    ingredients: [
      { id: 'storm_tree_seed_t2', type: 'seed', count: 1 },
      { id: 'thunder_vine_fruit_t2', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'gravity_root_seed_t3',
    resultFruitId: 'gravity_root_fruit_t3',
    resultName: 'Семена гравитационного корня',
    resultEmoji: '🌀',
    rarity: 'epic',
    tier: 3,
    requiredLevel: 3
  },
  {
    id: 'plasma_flower_t3',
    name: 'Плазменный цветок',
    emoji: '💥',
    description: 'Горячий как плазма',
    ingredients: [
      { id: 'volcano_pepper_fruit_t2', type: 'fruit', count: 1 },
      { id: 'thunder_vine_fruit_t2', type: 'fruit', count: 1 },
      { id: 'solar_fruit_fruit_t2', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'plasma_flower_seed_t3',
    resultFruitId: 'plasma_flower_fruit_t3',
    resultName: 'Семена плазменного цветка',
    resultEmoji: '💥',
    rarity: 'epic',
    tier: 3,
    requiredLevel: 3
  },
  {
    id: 'shadow_bloom_t3',
    name: 'Теневой цветок',
    emoji: '🖤',
    description: 'Растет в тенях',
    ingredients: [
      { id: 'night_blossom_seed_t2', type: 'seed', count: 2 },
      { id: 'spirit_corn_fruit_t2', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'shadow_bloom_seed_t3',
    resultFruitId: 'shadow_bloom_fruit_t3',
    resultName: 'Семена теневого цветка',
    resultEmoji: '🖤',
    rarity: 'epic',
    tier: 3,
    requiredLevel: 3
  },

  // ============ ТИР 4 (Уровень 4+) - Крафт из Т2-Т3 гибридов ============
  {
    id: 'cosmic_heart_t4',
    name: 'Космическое сердце',
    emoji: '💫',
    description: 'Пульсирующее сердце космоса',
    ingredients: [
      { id: 'celestial_bloom_seed_t3', type: 'seed', count: 1 },
      { id: 'nebula_plant_fruit_t3', type: 'fruit', count: 1 },
      { id: 'star_berry_fruit_t2', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'cosmic_heart_seed_t4',
    resultFruitId: 'cosmic_heart_fruit_t4',
    resultName: 'Семена космического сердца',
    resultEmoji: '💫',
    rarity: 'epic',
    tier: 4,
    requiredLevel: 4
  },
  {
    id: 'eternal_flame_t4',
    name: 'Вечное пламя',
    emoji: '🔥',
    description: 'Огонь, который никогда не гаснет',
    ingredients: [
      { id: 'phoenix_blossom_seed_t3', type: 'seed', count: 1 },
      { id: 'dragon_scale_fruit_t3', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'eternal_flame_seed_t4',
    resultFruitId: 'eternal_flame_fruit_t4',
    resultName: 'Семена вечного пламени',
    resultEmoji: '🔥',
    rarity: 'epic',
    tier: 4,
    requiredLevel: 4
  },
  {
    id: 'shadow_garden_t4',
    name: 'Теневой сад',
    emoji: '🌿',
    description: 'Сад из мира теней',
    ingredients: [
      { id: 'void_root_seed_t3', type: 'seed', count: 1 },
      { id: 'shadow_bloom_fruit_t3', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'shadow_garden_seed_t4',
    resultFruitId: 'shadow_garden_fruit_t4',
    resultName: 'Семена теневого сада',
    resultEmoji: '🌿',
    rarity: 'epic',
    tier: 4,
    requiredLevel: 4
  },
  {
    id: 'time_warp_t4',
    name: 'Временной парадокс',
    emoji: '⏰',
    description: 'Искривляет пространство-время',
    ingredients: [
      { id: 'quantum_berry_seed_t3', type: 'seed', count: 1 },
      { id: 'gravity_root_fruit_t3', type: 'fruit', count: 1 },
      { id: 'nebula_plant_fruit_t3', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'time_warp_seed_t4',
    resultFruitId: 'time_warp_fruit_t4',
    resultName: 'Семена временного парадокса',
    resultEmoji: '⏰',
    rarity: 'epic',
    tier: 4,
    requiredLevel: 4
  },
  {
    id: 'omega_crystal_t4',
    name: 'Омега кристалл',
    emoji: '💠',
    description: 'Совершенный кристалл',
    ingredients: [
      { id: 'aurora_leaf_seed_t3', type: 'seed', count: 1 },
      { id: 'dragon_scale_fruit_t3', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'omega_crystal_seed_t4',
    resultFruitId: 'omega_crystal_fruit_t4',
    resultName: 'Семена омега кристалла',
    resultEmoji: '💠',
    rarity: 'epic',
    tier: 4,
    requiredLevel: 4
  },
  {
    id: 'inferno_lotus_t4',
    name: 'Инфернальный лотос',
    emoji: '🌋',
    description: 'Растет в лаве',
    ingredients: [
      { id: 'phoenix_blossom_fruit_t3', type: 'fruit', count: 1 },
      { id: 'plasma_flower_fruit_t3', type: 'fruit', count: 1 },
      { id: 'volcano_pepper_fruit_t2', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'inferno_lotus_seed_t4',
    resultFruitId: 'inferno_lotus_fruit_t4',
    resultName: 'Семена инфернального лотоса',
    resultEmoji: '🌋',
    rarity: 'epic',
    tier: 4,
    requiredLevel: 4
  },
  {
    id: 'astral_vine_t4',
    name: 'Астральная лоза',
    emoji: '🪐',
    description: 'Связь с астральным миром',
    ingredients: [
      { id: 'celestial_bloom_fruit_t3', type: 'fruit', count: 1 },
      { id: 'spirit_corn_fruit_t2', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'astral_vine_seed_t4',
    resultFruitId: 'astral_vine_fruit_t4',
    resultName: 'Семена астральной лозы',
    resultEmoji: '🪐',
    rarity: 'epic',
    tier: 4,
    requiredLevel: 4
  },
  {
    id: 'pure_energy_t4',
    name: 'Чистая энергия',
    emoji: '⚡',
    description: 'Концентрированная сила',
    ingredients: [
      { id: 'plasma_flower_seed_t3', type: 'seed', count: 1 },
      { id: 'gravity_root_fruit_t3', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'pure_energy_seed_t4',
    resultFruitId: 'pure_energy_fruit_t4',
    resultName: 'Семена чистой энергии',
    resultEmoji: '⚡',
    rarity: 'epic',
    tier: 4,
    requiredLevel: 4
  },
  {
    id: 'mind_flower_t4',
    name: 'Ментальный цветок',
    emoji: '🧠',
    description: 'Развивает разум',
    ingredients: [
      { id: 'quantum_berry_fruit_t3', type: 'fruit', count: 2 },
      { id: 'shadow_bloom_fruit_t3', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'mind_flower_seed_t4',
    resultFruitId: 'mind_flower_fruit_t4',
    resultName: 'Семена ментального цветка',
    resultEmoji: '🧠',
    rarity: 'epic',
    tier: 4,
    requiredLevel: 4
  },
  {
    id: 'aether_tree_t4',
    name: 'Эфирное древо',
    emoji: '🌳',
    description: 'Древо из эфира',
    ingredients: [
      { id: 'gravity_root_seed_t3', type: 'seed', count: 1 },
      { id: 'aurora_leaf_fruit_t3', type: 'fruit', count: 1 },
      { id: 'night_blossom_fruit_t2', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'aether_tree_seed_t4',
    resultFruitId: 'aether_tree_fruit_t4',
    resultName: 'Семена эфирного древа',
    resultEmoji: '🌳',
    rarity: 'epic',
    tier: 4,
    requiredLevel: 4
  },

  // ============ ТИР 5 (Уровень 5+) - Крафт из Т3-Т4 гибридов ============
  {
    id: 'divine_tree_t5',
    name: 'Божественное древо',
    emoji: '🌲',
    description: 'Древо богов',
    ingredients: [
      { id: 'cosmic_heart_seed_t4', type: 'seed', count: 1 },
      { id: 'aether_tree_fruit_t4', type: 'fruit', count: 1 },
      { id: 'celestial_bloom_fruit_t3', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'divine_tree_seed_t5',
    resultFruitId: 'divine_tree_fruit_t5',
    resultName: 'Семена божественного древа',
    resultEmoji: '🌲',
    rarity: 'legendary',
    tier: 5,
    requiredLevel: 5
  },
  {
    id: 'chaos_bloom_t5',
    name: 'Цветок хаоса',
    emoji: '🌪️',
    description: 'Воплощение чистого хаоса',
    ingredients: [
      { id: 'shadow_garden_seed_t4', type: 'seed', count: 1 },
      { id: 'time_warp_fruit_t4', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'chaos_bloom_seed_t5',
    resultFruitId: 'chaos_bloom_fruit_t5',
    resultName: 'Семена цветка хаоса',
    resultEmoji: '🌪️',
    rarity: 'legendary',
    tier: 5,
    requiredLevel: 5
  },
  {
    id: 'time_seed_t5',
    name: 'Семя времени',
    emoji: '⏳',
    description: 'Растение вне времени',
    ingredients: [
      { id: 'time_warp_seed_t4', type: 'seed', count: 1 },
      { id: 'omega_crystal_fruit_t4', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'time_seed_seed_t5',
    resultFruitId: 'time_seed_fruit_t5',
    resultName: 'Семена семени времени',
    resultEmoji: '⏳',
    rarity: 'legendary',
    tier: 5,
    requiredLevel: 5
  },
  {
    id: 'alpha_omega_t5',
    name: 'Альфа и Омега',
    emoji: 'Ω',
    description: 'Начало и конец всего',
    ingredients: [
      { id: 'eternal_flame_seed_t4', type: 'seed', count: 1 },
      { id: 'shadow_garden_fruit_t4', type: 'fruit', count: 1 },
      { id: 'phoenix_blossom_fruit_t3', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'alpha_omega_seed_t5',
    resultFruitId: 'alpha_omega_fruit_t5',
    resultName: 'Семена альфа и омеги',
    resultEmoji: 'Ω',
    rarity: 'legendary',
    tier: 5,
    requiredLevel: 5
  },
  {
    id: 'reality_bloom_t5',
    name: 'Цветок реальности',
    emoji: '🔮',
    description: 'Меняет саму реальность',
    ingredients: [
      { id: 'mind_flower_seed_t4', type: 'seed', count: 1 },
      { id: 'quantum_berry_fruit_t3', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'reality_bloom_seed_t5',
    resultFruitId: 'reality_bloom_fruit_t5',
    resultName: 'Семена цветка реальности',
    resultEmoji: '🔮',
    rarity: 'legendary',
    tier: 5,
    requiredLevel: 5
  },
  {
    id: 'singularity_core_t5',
    name: 'Ядро сингулярности',
    emoji: '⚫',
    description: 'Точка бесконечной плотности',
    ingredients: [
      { id: 'pure_energy_seed_t4', type: 'seed', count: 1 },
      { id: 'gravity_root_fruit_t3', type: 'fruit', count: 1 },
      { id: 'omega_crystal_fruit_t4', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'singularity_core_seed_t5',
    resultFruitId: 'singularity_core_fruit_t5',
    resultName: 'Семена ядра сингулярности',
    resultEmoji: '⚫',
    rarity: 'legendary',
    tier: 5,
    requiredLevel: 5
  },
  {
    id: 'infinity_root_t5',
    name: 'Корень бесконечности',
    emoji: '∞',
    description: 'Бесконечная энергия',
    ingredients: [
      { id: 'astral_vine_seed_t4', type: 'seed', count: 1 },
      { id: 'cosmic_heart_fruit_t4', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'infinity_root_seed_t5',
    resultFruitId: 'infinity_root_fruit_t5',
    resultName: 'Семена корня бесконечности',
    resultEmoji: '∞',
    rarity: 'legendary',
    tier: 5,
    requiredLevel: 5
  },
  {
    id: 'soul_tree_t5',
    name: 'Древо душ',
    emoji: '👻',
    description: 'Хранит все души',
    ingredients: [
      { id: 'aether_tree_seed_t4', type: 'seed', count: 1 },
      { id: 'mind_flower_fruit_t4', type: 'fruit', count: 1 },
      { id: 'shadow_bloom_fruit_t3', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'soul_tree_seed_t5',
    resultFruitId: 'soul_tree_fruit_t5',
    resultName: 'Семена древа душ',
    resultEmoji: '👻',
    rarity: 'legendary',
    tier: 5,
    requiredLevel: 5
  },
  {
    id: 'supernova_flower_t5',
    name: 'Цветок сверхновой',
    emoji: '💥',
    description: 'Взрыв звезды',
    ingredients: [
      { id: 'inferno_lotus_seed_t4', type: 'seed', count: 1 },
      { id: 'eternal_flame_fruit_t4', type: 'fruit', count: 1 },
      { id: 'plasma_flower_fruit_t3', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'supernova_flower_seed_t5',
    resultFruitId: 'supernova_flower_fruit_t5',
    resultName: 'Семена цветка сверхновой',
    resultEmoji: '💥',
    rarity: 'legendary',
    tier: 5,
    requiredLevel: 5
  },
  {
    id: 'primordial_seed_t5',
    name: 'Изначальное семя',
    emoji: '🌱',
    description: 'Первое семя творения',
    ingredients: [
      { id: 'cosmic_heart_fruit_t4', type: 'fruit', count: 1 },
      { id: 'time_warp_fruit_t4', type: 'fruit', count: 1 },
      { id: 'nebula_plant_fruit_t3', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'primordial_seed_seed_t5',
    resultFruitId: 'primordial_seed_fruit_t5',
    resultName: 'Изначальное семя',
    resultEmoji: '🌱',
    rarity: 'legendary',
    tier: 5,
    requiredLevel: 5
  },

  // ============ ТИР 6 (Уровень 6) - Крафт из Т4-Т5 гибридов ============
  {
    id: 'world_tree_t6',
    name: 'Мировое Древо',
    emoji: '🌍',
    description: 'Древо, поддерживающее миры',
    ingredients: [
      { id: 'divine_tree_seed_t5', type: 'seed', count: 1 },
      { id: 'soul_tree_fruit_t5', type: 'fruit', count: 1 },
      { id: 'aether_tree_fruit_t4', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'world_tree_seed_t6',
    resultFruitId: 'world_tree_fruit_t6',
    resultName: 'Семена мирового древа',
    resultEmoji: '🌍',
    rarity: 'legendary',
    tier: 6,
    requiredLevel: 6
  },
  {
    id: 'creation_flower_t6',
    name: 'Цветок творения',
    emoji: '✨',
    description: 'Источник всего сущего',
    ingredients: [
      { id: 'primordial_seed_seed_t5', type: 'seed', count: 1 },
      { id: 'alpha_omega_fruit_t5', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'creation_flower_seed_t6',
    resultFruitId: 'creation_flower_fruit_t6',
    resultName: 'Семена цветка творения',
    resultEmoji: '✨',
    rarity: 'legendary',
    tier: 6,
    requiredLevel: 6
  },
  {
    id: 'infinity_bloom_t6',
    name: 'Бесконечный цветок',
    emoji: '♾️',
    description: 'Цветок вечности',
    ingredients: [
      { id: 'infinity_root_seed_t5', type: 'seed', count: 1 },
      { id: 'time_seed_fruit_t5', type: 'fruit', count: 1 },
      { id: 'cosmic_heart_fruit_t4', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'infinity_bloom_seed_t6',
    resultFruitId: 'infinity_bloom_fruit_t6',
    resultName: 'Семена бесконечного цветка',
    resultEmoji: '♾️',
    rarity: 'legendary',
    tier: 6,
    requiredLevel: 6
  },
  {
    id: 'absolute_zero_t6',
    name: 'Абсолютный ноль',
    emoji: '🧊',
    description: 'Холоднее не бывает',
    ingredients: [
      { id: 'chaos_bloom_seed_t5', type: 'seed', count: 1 },
      { id: 'singularity_core_fruit_t5', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'absolute_zero_seed_t6',
    resultFruitId: 'absolute_zero_fruit_t6',
    resultName: 'Семена абсолютного нуля',
    resultEmoji: '🧊',
    rarity: 'legendary',
    tier: 6,
    requiredLevel: 6
  },
  {
    id: 'big_bang_t6',
    name: 'Большой взрыв',
    emoji: '🌌',
    description: 'Рождение вселенной',
    ingredients: [
      { id: 'supernova_flower_seed_t5', type: 'seed', count: 1 },
      { id: 'singularity_core_fruit_t5', type: 'fruit', count: 1 },
      { id: 'inferno_lotus_fruit_t4', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'big_bang_seed_t6',
    resultFruitId: 'big_bang_fruit_t6',
    resultName: 'Семена большого взрыва',
    resultEmoji: '🌌',
    rarity: 'legendary',
    tier: 6,
    requiredLevel: 6
  },
  {
    id: 'omniverse_t6',
    name: 'Омниверсум',
    emoji: '🌐',
    description: 'Все миры в одном',
    ingredients: [
      { id: 'reality_bloom_seed_t5', type: 'seed', count: 1 },
      { id: 'divine_tree_fruit_t5', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'omniverse_seed_t6',
    resultFruitId: 'omniverse_fruit_t6',
    resultName: 'Семена омниверсума',
    resultEmoji: '🌐',
    rarity: 'legendary',
    tier: 6,
    requiredLevel: 6
  },
  {
    id: 'transcendence_t6',
    name: 'Трансценденция',
    emoji: '🕉️',
    description: 'Выход за пределы',
    ingredients: [
      { id: 'soul_tree_seed_t5', type: 'seed', count: 1 },
      { id: 'reality_bloom_fruit_t5', type: 'fruit', count: 1 },
      { id: 'mind_flower_fruit_t4', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'transcendence_seed_t6',
    resultFruitId: 'transcendence_fruit_t6',
    resultName: 'Семена трансценденции',
    resultEmoji: '🕉️',
    rarity: 'legendary',
    tier: 6,
    requiredLevel: 6
  },
  {
    id: 'eternal_garden_t6',
    name: 'Вечный сад',
    emoji: '🏞️',
    description: 'Сад без конца и начала',
    ingredients: [
      { id: 'time_seed_seed_t5', type: 'seed', count: 1 },
      { id: 'alpha_omega_fruit_t5', type: 'fruit', count: 2 }
    ],
    resultSeedId: 'eternal_garden_seed_t6',
    resultFruitId: 'eternal_garden_fruit_t6',
    resultName: 'Семена вечного сада',
    resultEmoji: '🏞️',
    rarity: 'legendary',
    tier: 6,
    requiredLevel: 6
  },
  {
    id: 'genesis_seed_t6',
    name: 'Семя генезиса',
    emoji: '🌟',
    description: 'Начало начал',
    ingredients: [
      { id: 'primordial_seed_seed_t5', type: 'seed', count: 1 },
      { id: 'chaos_bloom_fruit_t5', type: 'fruit', count: 1 },
      { id: 'eternal_flame_fruit_t4', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'genesis_seed_seed_t6',
    resultFruitId: 'genesis_seed_fruit_t6',
    resultName: 'Семя генезиса',
    resultEmoji: '🌟',
    rarity: 'legendary',
    tier: 6,
    requiredLevel: 6
  },
  {
    id: 'ultimate_nexus_t6',
    name: 'Абсолютный Нексус',
    emoji: '🔱',
    description: 'Связь всех измерений',
    ingredients: [
      { id: 'infinity_root_fruit_t5', type: 'fruit', count: 1 },
      { id: 'supernova_flower_fruit_t5', type: 'fruit', count: 1 },
      { id: 'time_warp_fruit_t4', type: 'fruit', count: 1 },
      { id: 'pure_energy_fruit_t4', type: 'fruit', count: 1 }
    ],
    resultSeedId: 'ultimate_nexus_seed_t6',
    resultFruitId: 'ultimate_nexus_fruit_t6',
    resultName: 'Семена абсолютного нексуса',
    resultEmoji: '🔱',
    rarity: 'legendary',
    tier: 6,
    requiredLevel: 6
  }
];

export const getHybridById = (id: string) => {
  return HYBRID_RECIPES.find(recipe => recipe.id === id);
};



