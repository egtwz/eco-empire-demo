export type SynthesisRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface SynthesisPlant {
  id: string;
  name: string;
  emoji: string;
  successChance: number; // 0-100
  growSeconds: number;
  description: string;
  sellPrice: number;
  rarity: SynthesisRarity;
  minLevel: number;
}

export interface SynthesisRecipe {
  resultId: string;
  requiredPlants: { seedId: string; count: number }[];
  description: string;
}

// Рецепты синтеза на основе комбинаций соседних растений
export const SYNTHESIS_RECIPES: SynthesisRecipe[] = [
  // ========== COMMON (Common + Common = Common) ==========
  { resultId: 'synthesis_crystal_flower', requiredPlants: [{ seedId: 'oak_seed', count: 2 }, { seedId: 'lily_seed', count: 2 }], description: '2 дуба + 2 лилии' },
  { resultId: 'synthesis_night_bud', requiredPlants: [{ seedId: 'sunflower_seed', count: 2 }, { seedId: 'mushroom_seed', count: 2 }], description: '2 подсолнуха + 2 гриба' },
  { resultId: 'synthesis_ice_berry', requiredPlants: [{ seedId: 'berry_seed', count: 2 }, { seedId: 'carrot_seed', count: 2 }], description: '2 ягоды + 2 моркови' },
  { resultId: 'synthesis_dew_drop', requiredPlants: [{ seedId: 'potato_seed', count: 2 }, { seedId: 'tomato_seed', count: 2 }], description: '2 картофеля + 2 помидора' },
  { resultId: 'synthesis_basil_gem', requiredPlants: [{ seedId: 'oak_seed', count: 1 }, { seedId: 'lily_seed', count: 1 }, { seedId: 'mushroom_seed', count: 1 }, { seedId: 'berry_seed', count: 1 }], description: 'Дуб + Лилия + Гриб + Ягода' },
  
  // ========== UNCOMMON (Common + Uncommon = Uncommon) ==========
  { resultId: 'synthesis_fire_vine', requiredPlants: [{ seedId: 'fir_seed', count: 2 }, { seedId: 'rose_seed', count: 2 }], description: '2 ели + 2 розы' },
  { resultId: 'synthesis_star_root', requiredPlants: [{ seedId: 'pepper_seed', count: 2 }, { seedId: 'corn_seed', count: 2 }], description: '2 перца + 2 кукурузы' },
  { resultId: 'synthesis_thunder_leaf', requiredPlants: [{ seedId: 'wheat_seed', count: 2 }, { seedId: 'rice_seed', count: 2 }], description: '2 пшеницы + 2 риса' },
  { resultId: 'synthesis_ocean_mist', requiredPlants: [{ seedId: 'bean_seed', count: 2 }, { seedId: 'carrot_seed', count: 2 }], description: '2 фасоли + 2 моркови' },
  { resultId: 'synthesis_wind_pearl', requiredPlants: [{ seedId: 'oak_seed', count: 1 }, { seedId: 'fir_seed', count: 1 }, { seedId: 'rose_seed', count: 1 }, { seedId: 'corn_seed', count: 1 }], description: 'Дуб + Ель + Роза + Кукуруза' },
  { resultId: 'synthesis_magic_moss', requiredPlants: [{ seedId: 'lily_seed', count: 1 }, { seedId: 'mushroom_seed', count: 1 }, { seedId: 'pepper_seed', count: 1 }, { seedId: 'carrot_seed', count: 1 }], description: 'Лилия + Гриб + Перец + Морковь' },
  { resultId: 'synthesis_golden_grass', requiredPlants: [{ seedId: 'sunflower_seed', count: 1 }, { seedId: 'berry_seed', count: 1 }, { seedId: 'wheat_seed', count: 1 }, { seedId: 'rice_seed', count: 1 }], description: 'Подсолнух + Ягода + Пшеница + Рис' },
  
  // ========== RARE (Uncommon + Rare = Rare) ==========
  { resultId: 'synthesis_golden_bud', requiredPlants: [{ seedId: 'cactus_seed', count: 2 }, { seedId: 'cherry_seed', count: 2 }], description: '2 кактуса + 2 вишни' },
  { resultId: 'synthesis_solar_bloom', requiredPlants: [{ seedId: 'apple_seed', count: 2 }, { seedId: 'grape_seed', count: 2 }], description: '2 яблока + 2 винограда' },
  { resultId: 'synthesis_shadow_bloom', requiredPlants: [{ seedId: 'bamboo_seed', count: 2 }, { seedId: 'pumpkin_seed', count: 2 }], description: '2 бамбука + 2 тыквы' },
  { resultId: 'synthesis_frost_rose', requiredPlants: [{ seedId: 'cucumber_seed', count: 2 }, { seedId: 'lettuce_seed', count: 2 }], description: '2 огурца + 2 салата' },
  { resultId: 'synthesis_emerald_tear', requiredPlants: [{ seedId: 'onion_seed', count: 2 }, { seedId: 'garlic_seed', count: 2 }], description: '2 лука + 2 чеснока' },
  { resultId: 'synthesis_rainbow_leaf', requiredPlants: [{ seedId: 'cactus_seed', count: 1 }, { seedId: 'cherry_seed', count: 1 }, { seedId: 'apple_seed', count: 1 }, { seedId: 'grape_seed', count: 1 }], description: 'Кактус + Вишня + Яблоко + Виноград' },
  { resultId: 'synthesis_cloud_plant', requiredPlants: [{ seedId: 'potato_seed', count: 1 }, { seedId: 'tomato_seed', count: 1 }, { seedId: 'pepper_seed', count: 1 }, { seedId: 'corn_seed', count: 1 }], description: 'Картофель + Помидор + Перец + Кукуруза' },
  { resultId: 'synthesis_mystic_twine', requiredPlants: [{ seedId: 'oak_seed', count: 1 }, { seedId: 'rose_seed', count: 1 }, { seedId: 'apple_seed', count: 1 }, { seedId: 'cherry_seed', count: 1 }], description: 'Дуб + Роза + Яблоко + Вишня' },
  
  // ========== EPIC (Rare + Epic = Epic) ==========
  { resultId: 'synthesis_aurora_bud', requiredPlants: [{ seedId: 'lettuce_seed', count: 1 }, { seedId: 'onion_seed', count: 1 }, { seedId: 'garlic_seed', count: 1 }, { seedId: 'spinach_seed', count: 1 }], description: 'Салат + Лук + Чеснок + Шпинат' },
  { resultId: 'synthesis_diamond_petal', requiredPlants: [{ seedId: 'strawberry_seed', count: 1 }, { seedId: 'blueberry_seed', count: 1 }, { seedId: 'raspberry_seed', count: 1 }, { seedId: 'broccoli_seed', count: 1 }], description: 'Клубника + Черника + Малина + Брокколи' },
  { resultId: 'synthesis_void_blossom', requiredPlants: [{ seedId: 'spinach_seed', count: 2 }, { seedId: 'broccoli_seed', count: 2 }], description: '2 шпината + 2 брокколи' },
  { resultId: 'synthesis_blood_moon', requiredPlants: [{ seedId: 'strawberry_seed', count: 2 }, { seedId: 'blueberry_seed', count: 2 }], description: '2 клубники + 2 черники' },
  { resultId: 'synthesis_storm_petal', requiredPlants: [{ seedId: 'raspberry_seed', count: 2 }, { seedId: 'broccoli_seed', count: 2 }], description: '2 малины + 2 брокколи' },
  { resultId: 'synthesis_celestial_berry', requiredPlants: [{ seedId: 'apple_seed', count: 1 }, { seedId: 'cherry_seed', count: 1 }, { seedId: 'strawberry_seed', count: 1 }, { seedId: 'blueberry_seed', count: 1 }], description: 'Яблоко + Вишня + Клубника + Черника' },
  { resultId: 'synthesis_eternal_bud', requiredPlants: [{ seedId: 'grape_seed', count: 1 }, { seedId: 'cactus_seed', count: 1 }, { seedId: 'lettuce_seed', count: 1 }, { seedId: 'spinach_seed', count: 1 }], description: 'Виноград + Кактус + Салат + Шпинат' },
  
  // ========== LEGENDARY (Epic + Legendary = Legendary) ==========
  { resultId: 'synthesis_moonstone_plant', requiredPlants: [{ seedId: 'dragon_seed', count: 2 }, { seedId: 'phoenix_seed', count: 2 }], description: '2 дракона + 2 феникса' },
  { resultId: 'synthesis_infinity_core', requiredPlants: [{ seedId: 'watermelon_seed', count: 2 }, { seedId: 'dragon_seed', count: 2 }], description: '2 арбуза + 2 дракона' },
  { resultId: 'synthesis_godly_seed', requiredPlants: [{ seedId: 'watermelon_seed', count: 2 }, { seedId: 'phoenix_seed', count: 2 }], description: '2 арбуза + 2 феникса' },
  { resultId: 'synthesis_primordial_root', requiredPlants: [{ seedId: 'watermelon_seed', count: 1 }, { seedId: 'dragon_seed', count: 1 }, { seedId: 'phoenix_seed', count: 1 }, { seedId: 'strawberry_seed', count: 1 }], description: 'Арбуз + Дракон + Феникс + Клубника' },
  { resultId: 'synthesis_omega_fruit', requiredPlants: [{ seedId: 'watermelon_seed', count: 1 }, { seedId: 'dragon_seed', count: 1 }, { seedId: 'phoenix_seed', count: 1 }, { seedId: 'blueberry_seed', count: 1 }], description: 'Арбуз + Дракон + Феникс + Черника' },
];

export const SYNTHESIS_PLANTS: SynthesisPlant[] = [
  // ========== COMMON (Уровень 2+) ==========
  { id: 'synthesis_crystal_flower', name: 'Кристальный цветок', emoji: '💎', successChance: 8, growSeconds: 120, description: 'Мерцающий цветок из кристалла', sellPrice: 1500, rarity: 'common', minLevel: 2 },
  { id: 'synthesis_night_bud', name: 'Ночная почка', emoji: '🌙', successChance: 9, growSeconds: 120, description: 'Распускается только под звездами', sellPrice: 1600, rarity: 'common', minLevel: 2 },
  { id: 'synthesis_ice_berry', name: 'Ледяная ягода', emoji: '❄️', successChance: 10, growSeconds: 120, description: 'Холодная как лед', sellPrice: 1400, rarity: 'common', minLevel: 2 },
  { id: 'synthesis_dew_drop', name: 'Капля росы', emoji: '💧', successChance: 8, growSeconds: 130, description: 'Чистая утренняя роса', sellPrice: 1350, rarity: 'common', minLevel: 2 },
  { id: 'synthesis_basil_gem', name: 'Базисный камень', emoji: '🔷', successChance: 7, growSeconds: 140, description: 'Основа всех синтезов', sellPrice: 1200, rarity: 'common', minLevel: 2 },
  
  // ========== UNCOMMON (Уровень 2+) ==========
  { id: 'synthesis_fire_vine', name: 'Огненная лоза', emoji: '🔥', successChance: 7, growSeconds: 150, description: 'Пылает мягким огнем', sellPrice: 2200, rarity: 'uncommon', minLevel: 2 },
  { id: 'synthesis_star_root', name: 'Звёздный корень', emoji: '⭐', successChance: 8, growSeconds: 150, description: 'Светится в темноте', sellPrice: 2300, rarity: 'uncommon', minLevel: 2 },
  { id: 'synthesis_thunder_leaf', name: 'Громовой лист', emoji: '⚡', successChance: 7, growSeconds: 160, description: 'Излучает электричество', sellPrice: 2100, rarity: 'uncommon', minLevel: 2 },
  { id: 'synthesis_ocean_mist', name: 'Океанский туман', emoji: '🌊', successChance: 8, growSeconds: 150, description: 'Покрыт каплями океана', sellPrice: 2400, rarity: 'uncommon', minLevel: 2 },
  { id: 'synthesis_wind_pearl', name: 'Ветряная жемчужина', emoji: '🌪️', successChance: 9, growSeconds: 140, description: 'Легкое как воздух', sellPrice: 2000, rarity: 'uncommon', minLevel: 2 },
  { id: 'synthesis_magic_moss', name: 'Волшебный мох', emoji: '🍀', successChance: 10, growSeconds: 145, description: 'Приносит удачу', sellPrice: 2800, rarity: 'uncommon', minLevel: 2 },
  { id: 'synthesis_golden_grass', name: 'Золотая трава', emoji: '🌾', successChance: 8, growSeconds: 150, description: 'Блистает на солнце', sellPrice: 2100, rarity: 'uncommon', minLevel: 2 },
  
  // ========== RARE (Уровень 3+) ==========
  { id: 'synthesis_golden_bud', name: 'Золотая почка', emoji: '🥇', successChance: 5, growSeconds: 180, description: 'Сделан из чистого золота', sellPrice: 3800, rarity: 'rare', minLevel: 3 },
  { id: 'synthesis_solar_bloom', name: 'Солнечное цветение', emoji: '☀️', successChance: 5, growSeconds: 180, description: 'Питается солнечным светом', sellPrice: 3500, rarity: 'rare', minLevel: 3 },
  { id: 'synthesis_shadow_bloom', name: 'Теневой цветок', emoji: '🖤', successChance: 6, growSeconds: 170, description: 'Растет в тени', sellPrice: 3200, rarity: 'rare', minLevel: 3 },
  { id: 'synthesis_frost_rose', name: 'Морозная роза', emoji: '🥀', successChance: 6, growSeconds: 175, description: 'Не боится холода', sellPrice: 3400, rarity: 'rare', minLevel: 3 },
  { id: 'synthesis_emerald_tear', name: 'Изумрудная слеза', emoji: '💚', successChance: 7, growSeconds: 165, description: 'Сверкает изумрудом', sellPrice: 3600, rarity: 'rare', minLevel: 3 },
  { id: 'synthesis_rainbow_leaf', name: 'Радужный лист', emoji: '🌈', successChance: 8, growSeconds: 160, description: 'Меняет цвета как радуга', sellPrice: 3300, rarity: 'rare', minLevel: 3 },
  { id: 'synthesis_cloud_plant', name: 'Облачное растение', emoji: '☁️', successChance: 8, growSeconds: 155, description: 'Парящее в облаках', sellPrice: 3100, rarity: 'rare', minLevel: 3 },
  { id: 'synthesis_mystic_twine', name: 'Мистическая нить', emoji: '🧵', successChance: 7, growSeconds: 170, description: 'Связывает миры', sellPrice: 3400, rarity: 'rare', minLevel: 3 },
  
  // ========== EPIC (Уровень 4+) ==========
  { id: 'synthesis_aurora_bud', name: 'Почка Авроры', emoji: '✨', successChance: 4, growSeconds: 200, description: 'Светится северным сиянием', sellPrice: 5000, rarity: 'epic', minLevel: 4 },
  { id: 'synthesis_diamond_petal', name: 'Бриллиантовый лепесток', emoji: '💠', successChance: 3, growSeconds: 220, description: 'Самый редкий цветок', sellPrice: 6000, rarity: 'epic', minLevel: 4 },
  { id: 'synthesis_void_blossom', name: 'Цветок пустоты', emoji: '⚫', successChance: 4, growSeconds: 210, description: 'Поглощает свет', sellPrice: 5500, rarity: 'epic', minLevel: 4 },
  { id: 'synthesis_blood_moon', name: 'Кровавая луна', emoji: '🌙', successChance: 3, growSeconds: 230, description: 'Пульсирует энергией', sellPrice: 5800, rarity: 'epic', minLevel: 4 },
  { id: 'synthesis_storm_petal', name: 'Штормовой лепесток', emoji: '🌪️', successChance: 4, growSeconds: 210, description: 'Вызывает бури', sellPrice: 5200, rarity: 'epic', minLevel: 4 },
  { id: 'synthesis_celestial_berry', name: 'Небесная ягода', emoji: '🌟', successChance: 5, growSeconds: 190, description: 'Плод с небес', sellPrice: 4800, rarity: 'epic', minLevel: 4 },
  { id: 'synthesis_eternal_bud', name: 'Вечная почка', emoji: '♾️', successChance: 4, growSeconds: 200, description: 'Неувядаемая красота', sellPrice: 5300, rarity: 'epic', minLevel: 4 },
  
  // ========== LEGENDARY (Уровень 5+) ==========
  { id: 'synthesis_moonstone_plant', name: 'Лунный камень', emoji: '🌕', successChance: 1, growSeconds: 300, description: 'Светится лунным светом', sellPrice: 12000, rarity: 'legendary', minLevel: 5 },
  { id: 'synthesis_infinity_core', name: 'Ядро бесконечности', emoji: '♾️', successChance: 0.5, growSeconds: 360, description: 'Источник бесконечности', sellPrice: 15000, rarity: 'legendary', minLevel: 5 },
  { id: 'synthesis_godly_seed', name: 'Божественное семя', emoji: '👑', successChance: 0.5, growSeconds: 360, description: 'Семя самого бога', sellPrice: 15000, rarity: 'legendary', minLevel: 5 },
  { id: 'synthesis_primordial_root', name: 'Первозданный корень', emoji: '🌍', successChance: 0.8, growSeconds: 330, description: 'Корень всего живого', sellPrice: 13000, rarity: 'legendary', minLevel: 5 },
  { id: 'synthesis_omega_fruit', name: 'Омега плод', emoji: '🔱', successChance: 0.8, growSeconds: 330, description: 'Последний плод', sellPrice: 13000, rarity: 'legendary', minLevel: 5 },
];

