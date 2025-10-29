export type SeedId = 'oak_seed' | 'fir_seed' | 'lily_seed' | 'rose_seed' | 'sunflower_seed' | 'cactus_seed' | 'bamboo_seed' | 'cherry_seed' | 'apple_seed' | 'grape_seed' | 'dragon_seed' | 'phoenix_seed'
  | 'mushroom_seed' | 'berry_seed' | 'carrot_seed' | 'potato_seed' | 'tomato_seed' | 'pepper_seed' | 'corn_seed' | 'wheat_seed' | 'rice_seed' | 'bean_seed' | 'pumpkin_seed' | 'cucumber_seed' 
  | 'lettuce_seed' | 'onion_seed' | 'garlic_seed' | 'spinach_seed' | 'broccoli_seed' | 'strawberry_seed' | 'blueberry_seed' | 'raspberry_seed' | 'watermelon_seed';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface SeedDef {
  id: SeedId;
  name: string;
  emoji: string;
  price: number;
  fruitId: string;
  growSeconds: number;
  rarity: Rarity;
  description: string;
}

// Формула времени роста: baseTime * (price / 10) ^ 0.7
const RARITY_COLORS = {
  common: '#9CA3AF',
  uncommon: '#10B981', 
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B'
};

export const SEEDS: Record<SeedId, SeedDef> = {
  // Common (1-50 $ECO)
  oak_seed: { 
    id: 'oak_seed', 
    name: 'Семена дуба', 
    emoji: '🌰', 
    price: 10, 
    fruitId: 'acorn', 
    growSeconds: 10, 
    rarity: 'common',
    description: 'Классический дуб с жёлудями. Быстро растёт и даёт стабильный доход.'
  },
  lily_seed: { 
    id: 'lily_seed', 
    name: 'Семена лилии', 
    emoji: '🌸', 
    price: 8, 
    fruitId: 'lily', 
    growSeconds: 8, 
    rarity: 'common',
    description: 'Нежная лилия с приятным ароматом. Самый быстрый рост среди всех растений.'
  },
  sunflower_seed: { 
    id: 'sunflower_seed', 
    name: 'Семена подсолнуха', 
    emoji: '🌻', 
    price: 15, 
    fruitId: 'sunflower', 
    growSeconds: 12, 
    rarity: 'common',
    description: 'Яркий подсолнух, всегда поворачивается к солнцу. Даёт много семечек.'
  },

  // Uncommon (51-200 $ECO)
  fir_seed: { 
    id: 'fir_seed', 
    name: 'Семена ели', 
    emoji: '🌲', 
    price: 25, 
    fruitId: 'pinecone', 
    growSeconds: 15, 
    rarity: 'uncommon',
    description: 'Вечнозелёная ель с шишками. Растёт дольше, но даёт больше плодов.'
  },
  rose_seed: { 
    id: 'rose_seed', 
    name: 'Семена розы', 
    emoji: '🌹', 
    price: 35, 
    fruitId: 'rose', 
    growSeconds: 18, 
    rarity: 'uncommon',
    description: 'Красивая роза с шипами. Ценится за красоту и аромат.'
  },
  cactus_seed: { 
    id: 'cactus_seed', 
    name: 'Семена кактуса', 
    emoji: '🌵', 
    price: 40, 
    fruitId: 'cactus_fruit', 
    growSeconds: 20, 
    rarity: 'uncommon',
    description: 'Выносливый кактус, растёт в пустыне. Даёт сочные плоды.'
  },

  // Rare (201-1000 $ECO)
  bamboo_seed: { 
    id: 'bamboo_seed', 
    name: 'Семена бамбука', 
    emoji: '🎋', 
    price: 100, 
    fruitId: 'bamboo_shoot', 
    growSeconds: 25, 
    rarity: 'rare',
    description: 'Быстрорастущий бамбук. Очень ценится в восточной культуре.'
  },
  cherry_seed: { 
    id: 'cherry_seed', 
    name: 'Семена вишни', 
    emoji: '🍒', 
    price: 150, 
    fruitId: 'cherry', 
    growSeconds: 30, 
    rarity: 'rare',
    description: 'Сладкая вишня с косточкой. Очень популярна среди покупателей.'
  },
  apple_seed: { 
    id: 'apple_seed', 
    name: 'Семена яблони', 
    emoji: '🍎', 
    price: 200, 
    fruitId: 'apple', 
    growSeconds: 35, 
    rarity: 'rare',
    description: 'Классическое яблоко. Здоровый и вкусный плод.'
  },

  // Epic (1001-5000 $ECO)
  grape_seed: { 
    id: 'grape_seed', 
    name: 'Семена винограда', 
    emoji: '🍇', 
    price: 500, 
    fruitId: 'grape', 
    growSeconds: 45, 
    rarity: 'epic',
    description: 'Сочный виноград для вина. Очень ценится гурманами.'
  },
  dragon_seed: { 
    id: 'dragon_seed', 
    name: 'Семена дракона', 
    emoji: '🐉', 
    price: 1000, 
    fruitId: 'dragon_fruit', 
    growSeconds: 60, 
    rarity: 'epic',
    description: 'Мистическое растение дракона. Даёт экзотические плоды.'
  },

  // Legendary (5001+ $ECO)
  phoenix_seed: { 
    id: 'phoenix_seed', 
    name: 'Семена феникса', 
    emoji: '🔥', 
    price: 5000, 
    fruitId: 'phoenix_feather', 
    growSeconds: 120, 
    rarity: 'legendary',
    description: 'Легендарное растение феникса. Самое редкое и ценное растение в игре.'
  },
  
  // Common дополнительно
  mushroom_seed: { id: 'mushroom_seed', name: 'Семена грибов', emoji: '🍄', price: 12, fruitId: 'mushroom', growSeconds: 10, rarity: 'common', description: 'Вкусные съедобные грибы' },
  berry_seed: { id: 'berry_seed', name: 'Семена ягоды', emoji: '🫐', price: 20, fruitId: 'berry', growSeconds: 8, rarity: 'common', description: 'Сочные лесные ягоды' },
  carrot_seed: { id: 'carrot_seed', name: 'Семена моркови', emoji: '🥕', price: 18, fruitId: 'carrot', growSeconds: 12, rarity: 'common', description: 'Полезная морковь для здоровья' },
  potato_seed: { id: 'potato_seed', name: 'Семена картошки', emoji: '🥔', price: 15, fruitId: 'potato', growSeconds: 14, rarity: 'common', description: 'Сытный картофель' },
  tomato_seed: { id: 'tomato_seed', name: 'Семена помидора', emoji: '🍅', price: 22, fruitId: 'tomato', growSeconds: 11, rarity: 'common', description: 'Красные спелые томаты' },
  
  // Uncommon дополнительно
  pepper_seed: { id: 'pepper_seed', name: 'Семена перца', emoji: '🫑', price: 45, fruitId: 'pepper', growSeconds: 16, rarity: 'uncommon', description: 'Острый перец чили' },
  corn_seed: { id: 'corn_seed', name: 'Семена кукурузы', emoji: '🌽', price: 50, fruitId: 'corn', growSeconds: 18, rarity: 'uncommon', description: 'Золотистая кукуруза' },
  wheat_seed: { id: 'wheat_seed', name: 'Семена пшеницы', emoji: '🌾', price: 55, fruitId: 'wheat', growSeconds: 20, rarity: 'uncommon', description: 'Зерна пшеницы для хлеба' },
  rice_seed: { id: 'rice_seed', name: 'Семена риса', emoji: '🌾', price: 60, fruitId: 'rice', growSeconds: 19, rarity: 'uncommon', description: 'Рис для суши' },
  bean_seed: { id: 'bean_seed', name: 'Семена фасоли', emoji: '🫘', price: 48, fruitId: 'bean', growSeconds: 17, rarity: 'uncommon', description: 'Питательные бобы' },
  
  // Rare дополнительно
  pumpkin_seed: { id: 'pumpkin_seed', name: 'Семена тыквы', emoji: '🎃', price: 150, fruitId: 'pumpkin', growSeconds: 28, rarity: 'rare', description: 'Большая оранжевая тыква' },
  cucumber_seed: { id: 'cucumber_seed', name: 'Семена огурца', emoji: '🥒', price: 130, fruitId: 'cucumber', growSeconds: 24, rarity: 'rare', description: 'Свежие хрустящие огурцы' },
  lettuce_seed: { id: 'lettuce_seed', name: 'Семена салата', emoji: '🥬', price: 180, fruitId: 'lettuce', growSeconds: 30, rarity: 'rare', description: 'Свежий листовой салат' },
  onion_seed: { id: 'onion_seed', name: 'Семена лука', emoji: '🧅', price: 170, fruitId: 'onion', growSeconds: 26, rarity: 'rare', description: 'Острый репчатый лук' },
  garlic_seed: { id: 'garlic_seed', name: 'Семена чеснока', emoji: '🧄', price: 200, fruitId: 'garlic', growSeconds: 32, rarity: 'rare', description: 'Ароматный чеснок' },
  
  // Epic дополнительно
  spinach_seed: { id: 'spinach_seed', name: 'Семена шпината', emoji: '🥬', price: 300, fruitId: 'spinach', growSeconds: 35, rarity: 'epic', description: 'Полезный шпинат' },
  broccoli_seed: { id: 'broccoli_seed', name: 'Семена брокколи', emoji: '🥦', price: 350, fruitId: 'broccoli', growSeconds: 38, rarity: 'epic', description: 'Зелёная брокколи' },
  strawberry_seed: { id: 'strawberry_seed', name: 'Семена клубники', emoji: '🍓', price: 400, fruitId: 'strawberry', growSeconds: 40, rarity: 'epic', description: 'Сладкая клубника' },
  blueberry_seed: { id: 'blueberry_seed', name: 'Семена черники', emoji: '🫐', price: 450, fruitId: 'blueberry', growSeconds: 42, rarity: 'epic', description: 'Полезная черника' },
  raspberry_seed: { id: 'raspberry_seed', name: 'Семена малины', emoji: '🫐', price: 480, fruitId: 'raspberry', growSeconds: 44, rarity: 'epic', description: 'Ароматная малина' },
  
  // Legendary дополнительно  
  watermelon_seed: { id: 'watermelon_seed', name: 'Семена арбуза', emoji: '🍉', price: 8000, fruitId: 'watermelon', growSeconds: 150, rarity: 'legendary', description: 'Гигантский сочный арбуз' },
};

export const SHOP_ITEMS = Object.values(SEEDS);

export { RARITY_COLORS };