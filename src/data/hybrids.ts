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
  resultId: string;
  resultName: string;
  resultEmoji: string;
  sellPrice: number;
  craftTime: number; // в секундах
}

export const HYBRID_RECIPES: HybridRecipe[] = [
  {
    id: 'golden_apple',
    name: 'Золотое яблоко',
    emoji: '🍎',
    description: 'Магическое яблоко с золотым блеском',
    ingredients: [
      { id: 'apple_seed', type: 'seed', count: 2 },
      { id: 'cherry', type: 'fruit', count: 3 },
      { id: 'grape', type: 'fruit', count: 1 }
    ],
    resultId: 'golden_apple',
    resultName: 'Золотое яблоко',
    resultEmoji: '🍎',
    sellPrice: 1500, // 3x от суммы ингредиентов
    craftTime: 10
  },
  {
    id: 'rainbow_rose',
    name: 'Радужная роза',
    emoji: '🌹',
    description: 'Роза, переливающаяся всеми цветами радуги',
    ingredients: [
      { id: 'rose_seed', type: 'seed', count: 1 },
      { id: 'lily', type: 'fruit', count: 2 },
      { id: 'sunflower', type: 'fruit', count: 2 }
    ],
    resultId: 'rainbow_rose',
    resultName: 'Радужная роза',
    resultEmoji: '🌹',
    sellPrice: 900,
    craftTime: 10
  },
  {
    id: 'crystal_cactus',
    name: 'Кристальный кактус',
    emoji: '🌵',
    description: 'Кактус с кристальными иголками',
    ingredients: [
      { id: 'cactus_seed', type: 'seed', count: 1 },
      { id: 'bamboo_shoot', type: 'fruit', count: 2 },
      { id: 'pinecone', type: 'fruit', count: 1 }
    ],
    resultId: 'crystal_cactus',
    resultName: 'Кристальный кактус',
    resultEmoji: '🌵',
    sellPrice: 1200,
    craftTime: 10
  },
  {
    id: 'mystic_vine',
    name: 'Мистическая лоза',
    emoji: '🍇',
    description: 'Виноградная лоза с магическими свойствами',
    ingredients: [
      { id: 'grape_seed', type: 'seed', count: 1 },
      { id: 'dragon_fruit', type: 'fruit', count: 1 },
      { id: 'phoenix_feather', type: 'fruit', count: 1 }
    ],
    resultId: 'mystic_vine',
    resultName: 'Мистическая лоза',
    resultEmoji: '🍇',
    sellPrice: 6000,
    craftTime: 10
  },
  {
    id: 'forest_guardian',
    name: 'Лесной страж',
    emoji: '🌲',
    description: 'Древнее дерево-защитник леса',
    ingredients: [
      { id: 'oak_seed', type: 'seed', count: 2 },
      { id: 'fir_seed', type: 'seed', count: 1 },
      { id: 'bamboo_shoot', type: 'fruit', count: 3 }
    ],
    resultId: 'forest_guardian',
    resultName: 'Лесной страж',
    resultEmoji: '🌲',
    sellPrice: 1800,
    craftTime: 10
  },
  {
    id: 'cosmic_flower',
    name: 'Космический цветок',
    emoji: '🌸',
    description: 'Цветок, вобравший в себя энергию звезд',
    ingredients: [
      { id: 'lily_seed', type: 'seed', count: 1 },
      { id: 'sunflower_seed', type: 'seed', count: 1 },
      { id: 'apple', type: 'fruit', count: 2 }
    ],
    resultId: 'cosmic_flower',
    resultName: 'Космический цветок',
    resultEmoji: '🌸',
    sellPrice: 1050,
    craftTime: 10
  }
];

export const getHybridById = (id: string) => {
  return HYBRID_RECIPES.find(recipe => recipe.id === id);
};



