export type BoosterId =
  | 'booster_speedup'
  | 'booster_watering_can'
  | 'booster_fertilizer';

export type BoosterUsage = 'global' | 'target';

export interface BoosterDef {
  id: BoosterId;
  name: string;
  emoji: string;
  price: number; // Стоимость в $ECO
  shortDescription: string;
  detailedDescription: string;
  usage: BoosterUsage;
}

export const BOOSTERS: Record<BoosterId, BoosterDef> = {
  booster_speedup: {
    id: 'booster_speedup',
    name: 'Ускоритель роста',
    emoji: '⚡',
    price: 250,
    shortDescription: 'Сокращает время роста всех растений вдвое',
    detailedDescription:
      'Мгновенно воздействует на все растущие растения на поле и ускоряет их рост. Остаток времени сокращается в два раза, что помогает быстро довести урожай до сбора.',
    usage: 'global',
  },
  booster_watering_can: {
    id: 'booster_watering_can',
    name: 'Лейка',
    emoji: '💧',
    price: 120,
    shortDescription: 'Поливает выбранное растение и сокращает его рост на 50%',
    detailedDescription:
      'Применяется к конкретной клетке с растущим семенем и уменьшает оставшееся время роста вдвое. Выбирается через меню клетки.',
    usage: 'target',
  },
  booster_fertilizer: {
    id: 'booster_fertilizer',
    name: 'Удобрение',
    emoji: '🌱',
    price: 200,
    shortDescription: 'Мгновенно дозревает выбранное растение',
    detailedDescription:
      'Используется на клетке с растущим семенем и сразу переводит растение в стадию сбора. Применяется через меню клетки.',
    usage: 'target',
  },
};

export const TARGET_BOOSTER_IDS = Object.values(BOOSTERS)
  .filter((booster) => booster.usage === 'target')
  .map((booster) => booster.id);

