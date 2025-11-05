import { SeedId } from './seeds';
import { FruitId } from './fruits';
import { BuildingId } from './buildings';

export type ProcessedItemId = 
  | 'wine' | 'canned_fruit' | 'oil' | 'fabric' | 'dried_fruit' | 'juice'
  | 'roasted_coffee' | 'cheese' | 'honey' | 'flour' | 'bread' | 'beer'
  | 'premium_wine' | 'premium_jam' | 'premium_oil' | 'silk' | 'nectar'
  | 'champagne' | 'pickles' | 'sauce' | 'syrup' | 'candy'
  | 'simple_singularity' | 't1_singularity' | 't2_singularity' | 't3_singularity' | 't4_singularity' | 't5_singularity' | 't6_singularity';

export interface ProcessedItemDef {
  id: ProcessedItemId;
  name: string;
  emoji: string;
  sellPrice: number; // Цена продажи (×2 от стоимости ингредиентов)
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface ProcessingIngredient {
  id: SeedId | FruitId | string; // string для гибридов/синтезов
  type: 'seed' | 'fruit' | 'hybrid' | 'synthesis';
  count: number;
}

export interface ProcessingRecipe {
  id: string;
  buildingId: BuildingId;
  name: string;
  emoji: string;
  description: string;
  ingredients: ProcessingIngredient[];
  resultId: ProcessedItemId;
  processingSeconds: number; // Время переработки в секундах
  isSpecial: boolean; // true для гибридов/синтезов (фиолетовая обводка)
  requiredLevel?: number; // Минимальный уровень для рецепта
}

// Определения переработанных продуктов
export const PROCESSED_ITEMS: Record<ProcessedItemId, ProcessedItemDef> = {
  wine: { id: 'wine', name: 'Вино', emoji: '🍷', sellPrice: 0, rarity: 'common' },
  canned_fruit: { id: 'canned_fruit', name: 'Консервы', emoji: '🥫', sellPrice: 0, rarity: 'common' },
  oil: { id: 'oil', name: 'Растительное масло', emoji: '🫒', sellPrice: 0, rarity: 'common' },
  fabric: { id: 'fabric', name: 'Ткань', emoji: '🧵', sellPrice: 0, rarity: 'common' },
  dried_fruit: { id: 'dried_fruit', name: 'Сушеные фрукты', emoji: '🍇', sellPrice: 0, rarity: 'common' },
  juice: { id: 'juice', name: 'Сок', emoji: '🧃', sellPrice: 0, rarity: 'common' },
  roasted_coffee: { id: 'roasted_coffee', name: 'Обжаренный кофе', emoji: '☕', sellPrice: 0, rarity: 'uncommon' },
  cheese: { id: 'cheese', name: 'Сыр', emoji: '🧀', sellPrice: 0, rarity: 'uncommon' },
  honey: { id: 'honey', name: 'Мед', emoji: '🍯', sellPrice: 0, rarity: 'uncommon' },
  flour: { id: 'flour', name: 'Мука', emoji: '🌾', sellPrice: 0, rarity: 'common' },
  bread: { id: 'bread', name: 'Хлеб', emoji: '🥖', sellPrice: 0, rarity: 'common' },
  beer: { id: 'beer', name: 'Пиво', emoji: '🍺', sellPrice: 0, rarity: 'uncommon' },
  premium_wine: { id: 'premium_wine', name: 'Премиум вино', emoji: '🍾', sellPrice: 0, rarity: 'epic' },
  premium_jam: { id: 'premium_jam', name: 'Премиум варенье', emoji: '🍯', sellPrice: 0, rarity: 'rare' },
  premium_oil: { id: 'premium_oil', name: 'Премиум масло', emoji: '💎', sellPrice: 0, rarity: 'epic' },
  silk: { id: 'silk', name: 'Шелк', emoji: '🕸️', sellPrice: 0, rarity: 'rare' },
  nectar: { id: 'nectar', name: 'Нектар', emoji: '🍯', sellPrice: 0, rarity: 'epic' },
  champagne: { id: 'champagne', name: 'Шампанское', emoji: '🥂', sellPrice: 0, rarity: 'legendary' },
  pickles: { id: 'pickles', name: 'Маринованные овощи', emoji: '🥒', sellPrice: 0, rarity: 'uncommon' },
  sauce: { id: 'sauce', name: 'Соус', emoji: '🍝', sellPrice: 0, rarity: 'rare' },
  syrup: { id: 'syrup', name: 'Сироп', emoji: '🍯', sellPrice: 0, rarity: 'rare' },
  candy: { id: 'candy', name: 'Конфеты', emoji: '🍬', sellPrice: 0, rarity: 'uncommon' },
  // Сингулярности
  simple_singularity: { id: 'simple_singularity', name: 'Простая сингулярность', emoji: '⚛️', sellPrice: -1, rarity: 'legendary' }, // -1 означает что нельзя продать
  t1_singularity: { id: 't1_singularity', name: 'Сингулярность T1', emoji: '🌀', sellPrice: 0, rarity: 'legendary' },
  t2_singularity: { id: 't2_singularity', name: 'Сингулярность T2', emoji: '🌀', sellPrice: 0, rarity: 'legendary' },
  t3_singularity: { id: 't3_singularity', name: 'Сингулярность T3', emoji: '🌀', sellPrice: 0, rarity: 'legendary' },
  t4_singularity: { id: 't4_singularity', name: 'Сингулярность T4', emoji: '🌀', sellPrice: 0, rarity: 'legendary' },
  t5_singularity: { id: 't5_singularity', name: 'Сингулярность T5', emoji: '🌀', sellPrice: 0, rarity: 'legendary' },
  t6_singularity: { id: 't6_singularity', name: 'Сингулярность T6', emoji: '🌀', sellPrice: 0, rarity: 'legendary' }
};

// Рецепты переработки (только редкие и выше ингредиенты)
export const PROCESSING_RECIPES: ProcessingRecipe[] = [
  // === ВИНОКУРНЯ ===
  {
    id: 'wine_grape',
    buildingId: 'winery',
    name: 'Виноградное вино',
    emoji: '🍷',
    description: 'Классическое вино из винограда',
    ingredients: [{ id: 'grape', type: 'fruit', count: 10 }],
    resultId: 'wine',
    processingSeconds: 600, // 10 минут
    isSpecial: false
  },
  {
    id: 'wine_apple',
    buildingId: 'winery',
    name: 'Яблочное вино',
    emoji: '🍎',
    description: 'Вино из яблок',
    ingredients: [{ id: 'apple', type: 'fruit', count: 15 }],
    resultId: 'wine',
    processingSeconds: 720, // 12 минут
    isSpecial: false
  },
  {
    id: 'wine_cherry',
    buildingId: 'winery',
    name: 'Вишневое вино',
    emoji: '🍒',
    description: 'Сладкое вино из вишни',
    ingredients: [{ id: 'cherry', type: 'fruit', count: 12 }],
    resultId: 'wine',
    processingSeconds: 660, // 11 минут
    isSpecial: false
  },
  {
    id: 'premium_wine',
    buildingId: 'winery',
    name: 'Премиум вино',
    emoji: '🍾',
    description: 'Элитное вино из редких сортов',
    ingredients: [
      { id: 'grape', type: 'fruit', count: 5 },
      { id: 'strawberry', type: 'fruit', count: 5 },
      { id: 'blueberry', type: 'fruit', count: 5 }
    ],
    resultId: 'premium_wine',
    processingSeconds: 1800, // 30 минут
    isSpecial: false
  },

  // === КОНСЕРВНАЯ ===
  {
    id: 'canned_cucumber',
    buildingId: 'cannery',
    name: 'Консервированные огурцы',
    emoji: '🥫',
    description: 'Огурцы в банке',
    ingredients: [{ id: 'cucumber', type: 'fruit', count: 8 }],
    resultId: 'canned_fruit',
    processingSeconds: 480, // 8 минут
    isSpecial: false
  },
  {
    id: 'canned_pumpkin',
    buildingId: 'cannery',
    name: 'Консервированная тыква',
    emoji: '🥫',
    description: 'Тыква в банке',
    ingredients: [{ id: 'pumpkin', type: 'fruit', count: 6 }],
    resultId: 'canned_fruit',
    processingSeconds: 540, // 9 минут
    isSpecial: false
  },
  {
    id: 'canned_lettuce',
    buildingId: 'cannery',
    name: 'Консервированный салат',
    emoji: '🥫',
    description: 'Салат в банке',
    ingredients: [{ id: 'lettuce', type: 'fruit', count: 10 }],
    resultId: 'canned_fruit',
    processingSeconds: 600, // 10 минут
    isSpecial: false
  },

  // === МАСЛОБОЙНЯ ===
  {
    id: 'oil_pumpkin',
    buildingId: 'oil_press',
    name: 'Тыквенное масло',
    emoji: '🎃',
    description: 'Масло из семян тыквы',
    ingredients: [{ id: 'pumpkin_seed', type: 'seed', count: 15 }],
    resultId: 'oil',
    processingSeconds: 540, // 9 минут
    isSpecial: false
  },
  {
    id: 'oil_garlic',
    buildingId: 'oil_press',
    name: 'Чесночное масло',
    emoji: '🫒',
    description: 'Ароматное масло из чеснока',
    ingredients: [{ id: 'garlic_seed', type: 'seed', count: 12 }],
    resultId: 'oil',
    processingSeconds: 600, // 10 минут
    isSpecial: false
  },
  {
    id: 'oil_onion',
    buildingId: 'oil_press',
    name: 'Луковое масло',
    emoji: '🫒',
    description: 'Масло из лука',
    ingredients: [{ id: 'onion_seed', type: 'seed', count: 14 }],
    resultId: 'oil',
    processingSeconds: 570, // 9.5 минут
    isSpecial: false
  },

  // === ПРЯДИЛЬНЯ ===
  {
    id: 'fabric_bamboo',
    buildingId: 'spinnery',
    name: 'Бамбуковая ткань',
    emoji: '🧵',
    description: 'Ткань из бамбука',
    ingredients: [{ id: 'bamboo_seed', type: 'seed', count: 12 }],
    resultId: 'fabric',
    processingSeconds: 900, // 15 минут
    isSpecial: false
  },
  {
    id: 'fabric_lettuce',
    buildingId: 'spinnery',
    name: 'Льняная ткань',
    emoji: '🧵',
    description: 'Ткань из салата',
    ingredients: [{ id: 'lettuce_seed', type: 'seed', count: 15 }],
    resultId: 'fabric',
    processingSeconds: 1200, // 20 минут
    isSpecial: false
  },

  // === СУШИЛЬНЯ ===
  {
    id: 'dried_apple',
    buildingId: 'dryer',
    name: 'Сушеные яблоки',
    emoji: '🍎',
    description: 'Сушеные яблоки',
    ingredients: [{ id: 'apple', type: 'fruit', count: 10 }],
    resultId: 'dried_fruit',
    processingSeconds: 1800, // 30 минут
    isSpecial: false
  },
  {
    id: 'dried_cherry',
    buildingId: 'dryer',
    name: 'Сушеная вишня',
    emoji: '🍒',
    description: 'Сушеная вишня',
    ingredients: [{ id: 'cherry', type: 'fruit', count: 12 }],
    resultId: 'dried_fruit',
    processingSeconds: 2000, // 33 минуты
    isSpecial: false
  },
  {
    id: 'dried_cucumber',
    buildingId: 'dryer',
    name: 'Сушеные огурцы',
    emoji: '🥒',
    description: 'Сушеные огурцы',
    ingredients: [{ id: 'cucumber', type: 'fruit', count: 15 }],
    resultId: 'dried_fruit',
    processingSeconds: 1600, // 27 минут
    isSpecial: false
  },

  // === СОКОВЫЖИМАЛКА ===
  {
    id: 'juice_apple',
    buildingId: 'juicer',
    name: 'Яблочный сок',
    emoji: '🧃',
    description: 'Свежий сок из яблок',
    ingredients: [{ id: 'apple', type: 'fruit', count: 8 }],
    resultId: 'juice',
    processingSeconds: 300, // 5 минут
    isSpecial: false
  },
  {
    id: 'juice_berry',
    buildingId: 'juicer',
    name: 'Ягодный сок',
    emoji: '🫐',
    description: 'Сок из смеси ягод',
    ingredients: [
      { id: 'strawberry', type: 'fruit', count: 5 },
      { id: 'blueberry', type: 'fruit', count: 5 }
    ],
    resultId: 'juice',
    processingSeconds: 360, // 6 минут
    isSpecial: false
  },
  {
    id: 'juice_grape',
    buildingId: 'juicer',
    name: 'Виноградный сок',
    emoji: '🍇',
    description: 'Сладкий сок из винограда',
    ingredients: [{ id: 'grape', type: 'fruit', count: 6 }],
    resultId: 'juice',
    processingSeconds: 240, // 4 минуты
    isSpecial: false
  },
  {
    id: 'juice_cucumber',
    buildingId: 'juicer',
    name: 'Огуречный сок',
    emoji: '🧃',
    description: 'Освежающий сок из огурцов',
    ingredients: [{ id: 'cucumber', type: 'fruit', count: 10 }],
    resultId: 'juice',
    processingSeconds: 420, // 7 минут
    isSpecial: false
  },

  // === КОФЕЙНЯ ===
  {
    id: 'coffee_bamboo',
    buildingId: 'coffee_roaster',
    name: 'Бамбуковый кофе',
    emoji: '☕',
    description: 'Ароматный кофе из бамбуковых зерен',
    ingredients: [{ id: 'bamboo_seed', type: 'seed', count: 12 }],
    resultId: 'roasted_coffee',
    processingSeconds: 1200, // 20 минут
    isSpecial: false
  },
  {
    id: 'coffee_pumpkin',
    buildingId: 'coffee_roaster',
    name: 'Тыквенный кофе',
    emoji: '☕',
    description: 'Экзотический кофе из тыквенных семян',
    ingredients: [{ id: 'pumpkin_seed', type: 'seed', count: 15 }],
    resultId: 'roasted_coffee',
    processingSeconds: 1080, // 18 минут
    isSpecial: false
  },
  {
    id: 'coffee_premium',
    buildingId: 'coffee_roaster',
    name: 'Премиум кофе',
    emoji: '☕',
    description: 'Элитный кофе из смеси редких зерен',
    ingredients: [
      { id: 'apple_seed', type: 'seed', count: 8 },
      { id: 'cherry_seed', type: 'seed', count: 5 }
    ],
    resultId: 'roasted_coffee',
    processingSeconds: 1500, // 25 минут
    isSpecial: false
  },

  // === СЫРНАЯ ===
  {
    id: 'cheese_basic',
    buildingId: 'cheese_factory',
    name: 'Классический сыр',
    emoji: '🧀',
    description: 'Сыр из редких ингредиентов',
    ingredients: [
      { id: 'apple', type: 'fruit', count: 8 },
      { id: 'cherry', type: 'fruit', count: 5 }
    ],
    resultId: 'cheese',
    processingSeconds: 2400, // 40 минут
    isSpecial: false
  },
  {
    id: 'cheese_premium',
    buildingId: 'cheese_factory',
    name: 'Премиум сыр',
    emoji: '🧀',
    description: 'Элитный сыр из эпических ингредиентов',
    ingredients: [
      { id: 'strawberry', type: 'fruit', count: 6 },
      { id: 'blueberry', type: 'fruit', count: 4 }
    ],
    resultId: 'cheese',
    processingSeconds: 3000, // 50 минут
    isSpecial: false
  },

  // === МЕДОГОНКА ===
  {
    id: 'honey_cherry',
    buildingId: 'honey_extractor',
    name: 'Вишневый мед',
    emoji: '🍯',
    description: 'Мед из вишневых цветов',
    ingredients: [{ id: 'cherry', type: 'fruit', count: 12 }],
    resultId: 'honey',
    processingSeconds: 1500, // 25 минут
    isSpecial: false
  },
  {
    id: 'honey_apple',
    buildingId: 'honey_extractor',
    name: 'Яблочный мед',
    emoji: '🍯',
    description: 'Мед из яблоневых цветов',
    ingredients: [{ id: 'apple', type: 'fruit', count: 10 }],
    resultId: 'honey',
    processingSeconds: 1200, // 20 минут
    isSpecial: false
  },

  // === МЕЛЬНИЦА ===
  {
    id: 'flour_pumpkin',
    buildingId: 'mill',
    name: 'Тыквенная мука',
    emoji: '🌾',
    description: 'Мука из тыквенных семян',
    ingredients: [{ id: 'pumpkin_seed', type: 'seed', count: 12 }],
    resultId: 'flour',
    processingSeconds: 600, // 10 минут
    isSpecial: false
  },
  {
    id: 'flour_apple',
    buildingId: 'mill',
    name: 'Яблочная мука',
    emoji: '🌾',
    description: 'Мука из яблок',
    ingredients: [{ id: 'apple', type: 'fruit', count: 10 }],
    resultId: 'flour',
    processingSeconds: 720, // 12 минут
    isSpecial: false
  },
  {
    id: 'flour_cucumber',
    buildingId: 'mill',
    name: 'Огуречная мука',
    emoji: '🌾',
    description: 'Мука из огурцов',
    ingredients: [{ id: 'cucumber', type: 'fruit', count: 12 }],
    resultId: 'flour',
    processingSeconds: 540, // 9 минут
    isSpecial: false
  },
  {
    id: 'flour_bamboo',
    buildingId: 'mill',
    name: 'Бамбуковая мука',
    emoji: '🌾',
    description: 'Мука из бамбука',
    ingredients: [{ id: 'bamboo_seed', type: 'seed', count: 14 }],
    resultId: 'flour',
    processingSeconds: 660, // 11 минут
    isSpecial: false
  },

  // === ПЕКАРНЯ ===
  {
    id: 'bread_apple',
    buildingId: 'bakery',
    name: 'Яблочный хлеб',
    emoji: '🥖',
    description: 'Свежий хлеб с яблоками',
    ingredients: [
      { id: 'apple', type: 'fruit', count: 8 },
      { id: 'apple_seed', type: 'seed', count: 4 }
    ],
    resultId: 'bread',
    processingSeconds: 900, // 15 минут
    isSpecial: false
  },
  {
    id: 'bread_cherry',
    buildingId: 'bakery',
    name: 'Вишневый хлеб',
    emoji: '🥖',
    description: 'Хлеб с вишней',
    ingredients: [{ id: 'cherry', type: 'fruit', count: 10 }],
    resultId: 'bread',
    processingSeconds: 1080, // 18 минут
    isSpecial: false
  },
  {
    id: 'bread_pumpkin',
    buildingId: 'bakery',
    name: 'Тыквенный хлеб',
    emoji: '🥖',
    description: 'Темный хлеб из тыквенных семян',
    ingredients: [{ id: 'pumpkin_seed', type: 'seed', count: 12 }],
    resultId: 'bread',
    processingSeconds: 960, // 16 минут
    isSpecial: false
  },

  // === ПИВОВАРНЯ ===
  {
    id: 'beer_apple',
    buildingId: 'brewery',
    name: 'Яблочное пиво',
    emoji: '🍺',
    description: 'Пиво из яблок',
    ingredients: [
      { id: 'apple', type: 'fruit', count: 10 },
      { id: 'cherry', type: 'fruit', count: 5 }
    ],
    resultId: 'beer',
    processingSeconds: 1800, // 30 минут
    isSpecial: false
  },
  {
    id: 'beer_berry',
    buildingId: 'brewery',
    name: 'Ягодное пиво',
    emoji: '🍺',
    description: 'Пиво из ягод',
    ingredients: [
      { id: 'strawberry', type: 'fruit', count: 8 },
      { id: 'blueberry', type: 'fruit', count: 5 }
    ],
    resultId: 'beer',
    processingSeconds: 2100, // 35 минут
    isSpecial: false
  },

  // === СПЕЦИАЛЬНЫЕ РЕЦЕПТЫ ДЛЯ ГИБРИДОВ И СИНТЕЗОВ ===
  // Эти рецепты будут доступны только для гибридов/синтезов (isSpecial: true)
  
  // Винокурня - специальные рецепты
  {
    id: 'champagne_hybrid',
    buildingId: 'winery',
    name: 'Шампанское из гибридов',
    emoji: '🥂',
    description: 'Элитное шампанское из радужной розы T1, золотого яблока T1 и кристального бамбука T1',
    ingredients: [
      { id: 'rainbow_rose_fruit_t1', type: 'hybrid', count: 1 },
      { id: 'golden_apple_fruit_t1', type: 'hybrid', count: 1 },
      { id: 'crystal_bamboo_fruit_t1', type: 'hybrid', count: 1 }
    ],
    resultId: 'champagne',
    processingSeconds: 3600, // 60 минут
    isSpecial: true,
    requiredLevel: 5
  },

  // Консервная - специальные рецепты
  {
    id: 'premium_jam_hybrid',
    buildingId: 'cannery',
    name: 'Премиум варенье',
    emoji: '🍯',
    description: 'Эксклюзивное варенье из лунной ягоды T1 и звездной ягоды T2',
    ingredients: [
      { id: 'moon_berry_fruit_t1', type: 'hybrid', count: 3 },
      { id: 'star_berry_fruit_t2', type: 'hybrid', count: 2 }
    ],
    resultId: 'premium_jam',
    processingSeconds: 2700, // 45 минут
    isSpecial: true,
    requiredLevel: 3
  },

  // Маслобойня - специальные рецепты
  {
    id: 'premium_oil_synthesis',
    buildingId: 'oil_press',
    name: 'Премиум масло',
    emoji: '💎',
    description: 'Элитное масло из кристального цветка и капли росы',
    ingredients: [
      { id: 'synthesis_crystal_flower', type: 'synthesis', count: 1 },
      { id: 'synthesis_dew_drop', type: 'synthesis', count: 1 }
    ],
    resultId: 'premium_oil',
    processingSeconds: 3000, // 50 минут
    isSpecial: true,
    requiredLevel: 4
  },

  // Прядильня - специальные рецепты
  {
    id: 'silk_hybrid',
    buildingId: 'spinnery',
    name: 'Шелк',
    emoji: '🕸️',
    description: 'Роскошный шелк из радужной розы T1 и призматического цветка T2',
    ingredients: [
      { id: 'rainbow_rose_fruit_t1', type: 'hybrid', count: 2 },
      { id: 'prism_flower_fruit_t2', type: 'hybrid', count: 2 }
    ],
    resultId: 'silk',
    processingSeconds: 2400, // 40 минут
    isSpecial: true,
    requiredLevel: 3
  },

  // Медогонка - специальные рецепты
  {
    id: 'nectar_synthesis',
    buildingId: 'honey_extractor',
    name: 'Нектар',
    emoji: '🍯',
    description: 'Божественный нектар из ночной почки, ледяной ягоды и базисного камня',
    ingredients: [
      { id: 'synthesis_night_bud', type: 'synthesis', count: 1 },
      { id: 'synthesis_ice_berry', type: 'synthesis', count: 1 },
      { id: 'synthesis_basil_gem', type: 'synthesis', count: 1 }
    ],
    resultId: 'nectar',
    processingSeconds: 4500, // 75 минут
    isSpecial: true,
    requiredLevel: 5
  },

  // Соковыжималка - специальные рецепты
  {
    id: 'syrup_hybrid',
    buildingId: 'juicer',
    name: 'Сироп',
    emoji: '🍯',
    description: 'Густой сироп из сахарной кукурузы T1 и солнечного плода T2',
    ingredients: [
      { id: 'sugar_corn_fruit_t1', type: 'hybrid', count: 3 },
      { id: 'solar_fruit_fruit_t2', type: 'hybrid', count: 3 }
    ],
    resultId: 'syrup',
    processingSeconds: 1800, // 30 минут
    isSpecial: true,
    requiredLevel: 2
  },

  // === ОБРАБОТЧИК СИНГУЛЯРНОСТЕЙ ===
  {
    id: 'simple_singularity_all',
    buildingId: 'singularity_processor',
    name: 'Простая сингулярность',
    emoji: '⚛️',
    description: 'Создается из абсолютно всех видов семян и плодов (по 1 шт каждого)',
    ingredients: [
      // Все семена (по 1 шт)
      { id: 'oak_seed', type: 'seed', count: 1 },
      { id: 'fir_seed', type: 'seed', count: 1 },
      { id: 'lily_seed', type: 'seed', count: 1 },
      { id: 'rose_seed', type: 'seed', count: 1 },
      { id: 'sunflower_seed', type: 'seed', count: 1 },
      { id: 'cactus_seed', type: 'seed', count: 1 },
      { id: 'bamboo_seed', type: 'seed', count: 1 },
      { id: 'cherry_seed', type: 'seed', count: 1 },
      { id: 'apple_seed', type: 'seed', count: 1 },
      { id: 'grape_seed', type: 'seed', count: 1 },
      { id: 'dragon_seed', type: 'seed', count: 1 },
      { id: 'phoenix_seed', type: 'seed', count: 1 },
      { id: 'mushroom_seed', type: 'seed', count: 1 },
      { id: 'berry_seed', type: 'seed', count: 1 },
      { id: 'carrot_seed', type: 'seed', count: 1 },
      { id: 'potato_seed', type: 'seed', count: 1 },
      { id: 'tomato_seed', type: 'seed', count: 1 },
      { id: 'pepper_seed', type: 'seed', count: 1 },
      { id: 'corn_seed', type: 'seed', count: 1 },
      { id: 'wheat_seed', type: 'seed', count: 1 },
      { id: 'rice_seed', type: 'seed', count: 1 },
      { id: 'bean_seed', type: 'seed', count: 1 },
      { id: 'pumpkin_seed', type: 'seed', count: 1 },
      { id: 'cucumber_seed', type: 'seed', count: 1 },
      { id: 'lettuce_seed', type: 'seed', count: 1 },
      { id: 'onion_seed', type: 'seed', count: 1 },
      { id: 'garlic_seed', type: 'seed', count: 1 },
      { id: 'spinach_seed', type: 'seed', count: 1 },
      { id: 'broccoli_seed', type: 'seed', count: 1 },
      { id: 'strawberry_seed', type: 'seed', count: 1 },
      { id: 'blueberry_seed', type: 'seed', count: 1 },
      { id: 'raspberry_seed', type: 'seed', count: 1 },
      { id: 'watermelon_seed', type: 'seed', count: 1 },
      // Все плоды (по 1 шт)
      { id: 'acorn', type: 'fruit', count: 1 },
      { id: 'pinecone', type: 'fruit', count: 1 },
      { id: 'lily', type: 'fruit', count: 1 },
      { id: 'rose', type: 'fruit', count: 1 },
      { id: 'sunflower', type: 'fruit', count: 1 },
      { id: 'cactus_fruit', type: 'fruit', count: 1 },
      { id: 'bamboo_shoot', type: 'fruit', count: 1 },
      { id: 'cherry', type: 'fruit', count: 1 },
      { id: 'apple', type: 'fruit', count: 1 },
      { id: 'grape', type: 'fruit', count: 1 },
      { id: 'dragon_fruit', type: 'fruit', count: 1 },
      { id: 'phoenix_feather', type: 'fruit', count: 1 },
      { id: 'mushroom', type: 'fruit', count: 1 },
      { id: 'berry', type: 'fruit', count: 1 },
      { id: 'carrot', type: 'fruit', count: 1 },
      { id: 'potato', type: 'fruit', count: 1 },
      { id: 'tomato', type: 'fruit', count: 1 },
      { id: 'pepper', type: 'fruit', count: 1 },
      { id: 'corn', type: 'fruit', count: 1 },
      { id: 'wheat', type: 'fruit', count: 1 },
      { id: 'rice', type: 'fruit', count: 1 },
      { id: 'bean', type: 'fruit', count: 1 },
      { id: 'pumpkin', type: 'fruit', count: 1 },
      { id: 'cucumber', type: 'fruit', count: 1 },
      { id: 'lettuce', type: 'fruit', count: 1 },
      { id: 'onion', type: 'fruit', count: 1 },
      { id: 'garlic', type: 'fruit', count: 1 },
      { id: 'spinach', type: 'fruit', count: 1 },
      { id: 'broccoli', type: 'fruit', count: 1 },
      { id: 'strawberry', type: 'fruit', count: 1 },
      { id: 'blueberry', type: 'fruit', count: 1 },
      { id: 'raspberry', type: 'fruit', count: 1 },
      { id: 'watermelon', type: 'fruit', count: 1 }
    ],
    resultId: 'simple_singularity',
    processingSeconds: 86400, // 24 часа
    isSpecial: false
  },

  // === РЕАКТОР СИНГУЛЯРНОСТЕЙ ===
  // T1 сингулярность: простая сингулярность + плоды всех гибридов тира 1
  {
    id: 't1_singularity',
    buildingId: 'singularity_reactor',
    name: 'Сингулярность T1',
    emoji: '🌀',
    description: 'Простая сингулярность + плоды всех гибридов тира 1',
    ingredients: [
      { id: 'simple_singularity', type: 'fruit', count: 1 },
      // Плоды тира 1
      { id: 'golden_apple_fruit_t1', type: 'hybrid', count: 1 }, // Золотое яблоко
      { id: 'rainbow_rose_fruit_t1', type: 'hybrid', count: 1 }, // Радужная роза
      { id: 'crystal_bamboo_fruit_t1', type: 'hybrid', count: 1 }, // Кристальный бамбук
      { id: 'fire_pepper_fruit_t1', type: 'hybrid', count: 1 }, // Огненный перец
      { id: 'moon_berry_fruit_t1', type: 'hybrid', count: 1 }, // Лунная ягода
      { id: 'ice_lotus_fruit_t1', type: 'hybrid', count: 1 }, // Ледяной лотос
      { id: 'thunder_oak_fruit_t1', type: 'hybrid', count: 1 }, // Громовой дуб
      { id: 'sugar_corn_fruit_t1', type: 'hybrid', count: 1 }, // Сахарная кукуруза
      { id: 'spicy_tomato_fruit_t1', type: 'hybrid', count: 1 }, // Острый томат
      { id: 'mystic_mushroom_fruit_t1', type: 'hybrid', count: 1 } // Мистический гриб
    ],
    resultId: 't1_singularity',
    processingSeconds: 86400,
    isSpecial: true
  },
  // T2 сингулярность: T1 сингулярность + плоды всех гибридов тира 2
  {
    id: 't2_singularity',
    buildingId: 'singularity_reactor',
    name: 'Сингулярность T2',
    emoji: '🌀',
    description: 'Сингулярность T1 + плоды всех гибридов тира 2',
    ingredients: [
      { id: 't1_singularity', type: 'fruit', count: 1 },
      // Плоды тира 2
      { id: 'solar_fruit_fruit_t2', type: 'hybrid', count: 1 }, // Солнечный плод
      { id: 'frozen_gem_fruit_t2', type: 'hybrid', count: 1 }, // Ледяной кристалл
      { id: 'thunder_vine_fruit_t2', type: 'hybrid', count: 1 }, // Громовая лоза
      { id: 'night_blossom_fruit_t2', type: 'hybrid', count: 1 }, // Ночной цветок
      { id: 'diamond_fruit_fruit_t2', type: 'hybrid', count: 1 }, // Алмазный плод
      { id: 'volcano_pepper_fruit_t2', type: 'hybrid', count: 1 }, // Вулканический перец
      { id: 'spirit_corn_fruit_t2', type: 'hybrid', count: 1 }, // Духовная кукуруза
      { id: 'star_berry_fruit_t2', type: 'hybrid', count: 1 }, // Звездная ягода
      { id: 'storm_tree_fruit_t2', type: 'hybrid', count: 1 }, // Штормовое древо
      { id: 'prism_flower_fruit_t2', type: 'hybrid', count: 1 } // Призматический цветок
    ],
    resultId: 't2_singularity',
    processingSeconds: 86400,
    isSpecial: true
  },
  // T3 сингулярность: T2 сингулярность + плоды всех гибридов тира 3
  {
    id: 't3_singularity',
    buildingId: 'singularity_reactor',
    name: 'Сингулярность T3',
    emoji: '🌀',
    description: 'Сингулярность T2 + плоды всех гибридов тира 3',
    ingredients: [
      { id: 't2_singularity', type: 'fruit', count: 1 },
      // Плоды тира 3
      { id: 'celestial_bloom_fruit_t3', type: 'hybrid', count: 1 }, // Небесный цветок
      { id: 'void_root_fruit_t3', type: 'hybrid', count: 1 }, // Корень Бездны
      { id: 'phoenix_blossom_fruit_t3', type: 'hybrid', count: 1 }, // Цветок феникса
      { id: 'nebula_plant_fruit_t3', type: 'hybrid', count: 1 }, // Туманное растение
      { id: 'aurora_leaf_fruit_t3', type: 'hybrid', count: 1 }, // Полярный лист
      { id: 'dragon_scale_fruit_t3', type: 'hybrid', count: 1 }, // Драконья чешуя
      { id: 'quantum_berry_fruit_t3', type: 'hybrid', count: 1 }, // Квантовая ягода
      { id: 'gravity_root_fruit_t3', type: 'hybrid', count: 1 }, // Гравитационный корень
      { id: 'plasma_flower_fruit_t3', type: 'hybrid', count: 1 }, // Плазменный цветок
      { id: 'shadow_bloom_fruit_t3', type: 'hybrid', count: 1 } // Теневой цветок
    ],
    resultId: 't3_singularity',
    processingSeconds: 86400,
    isSpecial: true
  },
  // T4 сингулярность: T3 сингулярность + плоды всех гибридов тира 4
  {
    id: 't4_singularity',
    buildingId: 'singularity_reactor',
    name: 'Сингулярность T4',
    emoji: '🌀',
    description: 'Сингулярность T3 + плоды всех гибридов тира 4',
    ingredients: [
      { id: 't3_singularity', type: 'fruit', count: 1 },
      // Плоды тира 4
      { id: 'cosmic_heart_fruit_t4', type: 'hybrid', count: 1 }, // Космическое сердце
      { id: 'eternal_flame_fruit_t4', type: 'hybrid', count: 1 }, // Вечное пламя
      { id: 'shadow_garden_fruit_t4', type: 'hybrid', count: 1 }, // Теневой сад
      { id: 'time_warp_fruit_t4', type: 'hybrid', count: 1 }, // Временной парадокс
      { id: 'omega_crystal_fruit_t4', type: 'hybrid', count: 1 }, // Омега кристалл
      { id: 'inferno_lotus_fruit_t4', type: 'hybrid', count: 1 }, // Инфернальный лотос
      { id: 'astral_vine_fruit_t4', type: 'hybrid', count: 1 }, // Астральная лоза
      { id: 'pure_energy_fruit_t4', type: 'hybrid', count: 1 }, // Чистая энергия
      { id: 'mind_flower_fruit_t4', type: 'hybrid', count: 1 }, // Ментальный цветок
      { id: 'aether_tree_fruit_t4', type: 'hybrid', count: 1 } // Эфирное древо
    ],
    resultId: 't4_singularity',
    processingSeconds: 86400,
    isSpecial: true
  },
  // T5 сингулярность: T4 сингулярность + плоды всех гибридов тира 5
  {
    id: 't5_singularity',
    buildingId: 'singularity_reactor',
    name: 'Сингулярность T5',
    emoji: '🌀',
    description: 'Сингулярность T4 + плоды всех гибридов тира 5',
    ingredients: [
      { id: 't4_singularity', type: 'fruit', count: 1 },
      // Плоды тира 5
      { id: 'divine_tree_fruit_t5', type: 'hybrid', count: 1 }, // Божественное древо
      { id: 'chaos_bloom_fruit_t5', type: 'hybrid', count: 1 }, // Цветок хаоса
      { id: 'time_seed_fruit_t5', type: 'hybrid', count: 1 }, // Семя времени
      { id: 'alpha_omega_fruit_t5', type: 'hybrid', count: 1 }, // Альфа и Омега
      { id: 'reality_bloom_fruit_t5', type: 'hybrid', count: 1 }, // Цветок реальности
      { id: 'singularity_core_fruit_t5', type: 'hybrid', count: 1 }, // Ядро сингулярности
      { id: 'infinity_root_fruit_t5', type: 'hybrid', count: 1 }, // Корень бесконечности
      { id: 'soul_tree_fruit_t5', type: 'hybrid', count: 1 }, // Древо душ
      { id: 'supernova_flower_fruit_t5', type: 'hybrid', count: 1 }, // Цветок сверхновой
      { id: 'primordial_seed_fruit_t5', type: 'hybrid', count: 1 } // Изначальное семя
    ],
    resultId: 't5_singularity',
    processingSeconds: 86400,
    isSpecial: true
  },
  // T6 сингулярность: T5 сингулярность + плоды всех гибридов тира 6
  {
    id: 't6_singularity',
    buildingId: 'singularity_reactor',
    name: 'Сингулярность T6',
    emoji: '🌀',
    description: 'Сингулярность T5 + плоды всех гибридов тира 6',
    ingredients: [
      { id: 't5_singularity', type: 'fruit', count: 1 },
      // Плоды тира 6
      { id: 'world_tree_fruit_t6', type: 'hybrid', count: 1 }, // Мировое Древо
      { id: 'creation_flower_fruit_t6', type: 'hybrid', count: 1 }, // Цветок творения
      { id: 'infinity_bloom_fruit_t6', type: 'hybrid', count: 1 }, // Бесконечный цветок
      { id: 'absolute_zero_fruit_t6', type: 'hybrid', count: 1 }, // Абсолютный ноль
      { id: 'big_bang_fruit_t6', type: 'hybrid', count: 1 }, // Большой взрыв
      { id: 'omniverse_fruit_t6', type: 'hybrid', count: 1 }, // Омниверсум
      { id: 'transcendence_fruit_t6', type: 'hybrid', count: 1 }, // Трансценденция
      { id: 'eternal_garden_fruit_t6', type: 'hybrid', count: 1 }, // Вечный сад
      { id: 'genesis_seed_fruit_t6', type: 'hybrid', count: 1 }, // Семя генезиса
      { id: 'ultimate_nexus_fruit_t6', type: 'hybrid', count: 1 } // Абсолютный Нексус
    ],
    resultId: 't6_singularity',
    processingSeconds: 86400,
    isSpecial: true
  }
];

// Функция для вычисления цены переработанного продукта (×3 от стоимости ингредиентов)
export function calculateProcessedItemPrice(ingredients: ProcessingIngredient[], getItemPrice: (id: string, type: 'seed' | 'fruit' | 'hybrid' | 'synthesis') => number): number {
  let totalCost = 0;
  for (const ing of ingredients) {
    const price = getItemPrice(ing.id, ing.type);
    totalCost += price * ing.count;
  }
  return Math.round(totalCost * 3); // Прибыль ×3
}

// Получение всех рецептов для здания
export function getRecipesForBuilding(buildingId: BuildingId): ProcessingRecipe[] {
  return PROCESSING_RECIPES.filter(r => r.buildingId === buildingId);
}

// Получение рецепта по ID
export function getRecipeById(recipeId: string): ProcessingRecipe | undefined {
  return PROCESSING_RECIPES.find(r => r.id === recipeId);
}

