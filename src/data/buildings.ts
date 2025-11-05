export type BuildingId = 
  | 'winery'           // Винокурня
  | 'cannery'          // Консервная
  | 'oil_press'        // Маслобойня
  | 'spinnery'         // Прядильня
  | 'dryer'            // Сушильня
  | 'juicer'           // Соковыжималка
  | 'coffee_roaster'   // Кофейня
  | 'cheese_factory'   // Сырная
  | 'honey_extractor'  // Медогонка
  | 'mill'             // Мельница
  | 'bakery'           // Пекарня
  | 'brewery'          // Пивоварня
  | 'singularity_processor' // Обработчик сингулярностей
  | 'singularity_reactor';   // Реактор сингулярностей

export interface BuildingDef {
  id: BuildingId;
  name: string;
  emoji: string;
  description: string;
  basePrice: number; // Цена первого здания
  category: 'food' | 'drink' | 'material' | 'special';
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  winery: {
    id: 'winery',
    name: 'Винокурня',
    emoji: '🍷',
    description: 'Производит вино из фруктов',
    basePrice: 30000,
    category: 'drink'
  },
  cannery: {
    id: 'cannery',
    name: 'Консервная',
    emoji: '🥫',
    description: 'Производит консервы из плодов',
    basePrice: 35000,
    category: 'food'
  },
  oil_press: {
    id: 'oil_press',
    name: 'Маслобойня',
    emoji: '🫒',
    description: 'Производит масло из семян и плодов',
    basePrice: 40000,
    category: 'material'
  },
  spinnery: {
    id: 'spinnery',
    name: 'Прядильня',
    emoji: '🧵',
    description: 'Производит ткани из растений',
    basePrice: 45000,
    category: 'material'
  },
  dryer: {
    id: 'dryer',
    name: 'Сушильня',
    emoji: '🌾',
    description: 'Сушит плоды для долгого хранения',
    basePrice: 38000,
    category: 'food'
  },
  juicer: {
    id: 'juicer',
    name: 'Соковыжималка',
    emoji: '🧃',
    description: 'Производит соки из фруктов',
    basePrice: 32000,
    category: 'drink'
  },
  coffee_roaster: {
    id: 'coffee_roaster',
    name: 'Кофейня',
    emoji: '☕',
    description: 'Обжаривает кофейные зерна',
    basePrice: 50000,
    category: 'drink'
  },
  cheese_factory: {
    id: 'cheese_factory',
    name: 'Сырная',
    emoji: '🧀',
    description: 'Производит сыр из специальных растений',
    basePrice: 55000,
    category: 'food'
  },
  honey_extractor: {
    id: 'honey_extractor',
    name: 'Медогонка',
    emoji: '🍯',
    description: 'Производит мед из цветов',
    basePrice: 42000,
    category: 'food'
  },
  mill: {
    id: 'mill',
    name: 'Мельница',
    emoji: '🌾',
    description: 'Перемалывает зерна в муку',
    basePrice: 36000,
    category: 'material'
  },
  bakery: {
    id: 'bakery',
    name: 'Пекарня',
    emoji: '🥖',
    description: 'Выпекает хлеб и кондитерские изделия',
    basePrice: 48000,
    category: 'food'
  },
  brewery: {
    id: 'brewery',
    name: 'Пивоварня',
    emoji: '🍺',
    description: 'Производит пиво из зерновых',
    basePrice: 52000,
    category: 'drink'
  },
  singularity_processor: {
    id: 'singularity_processor',
    name: 'Обработчик сингулярностей',
    emoji: '⚛️',
    description: 'Создает простую сингулярность из всех семян и плодов',
    basePrice: 10000000, // 10 миллионов
    category: 'special'
  },
  singularity_reactor: {
    id: 'singularity_reactor',
    name: 'Реактор сингулярностей',
    emoji: '🌀',
    description: 'Создает сингулярности более высоких уровней',
    basePrice: 10000000, // 10 миллионов
    category: 'special'
  }
};

// Вычисление цены здания (первое - basePrice, второе - ×4, третье - ×4 от предыдущего)
// Для singularity_reactor: ×2 прогрессия (10М, 20М, 40М, ...)
export function getBuildingPrice(buildingId: BuildingId, count: number): number {
  const building = BUILDINGS[buildingId];
  
  // Специальная логика для реактора сингулярностей
  if (buildingId === 'singularity_reactor') {
    if (count === 0) return building.basePrice; // Первое здание = 10М
    // ×2 прогрессия: 10М, 20М, 40М, 80М, ...
    return building.basePrice * Math.pow(2, count);
  }
  
  // Обычная логика для остальных зданий
  if (count === 0) return building.basePrice;
  if (count === 1) return building.basePrice * 4;
  return building.basePrice * Math.pow(4, count);
}

// Получение цены следующего здания
export function getNextBuildingPrice(buildingId: BuildingId, count: number): number {
  return getBuildingPrice(buildingId, count);
}

