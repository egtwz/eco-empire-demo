export type FruitId = 'acorn' | 'pinecone' | 'lily' | 'rose' | 'sunflower' | 'cactus_fruit' | 'bamboo_shoot' | 'cherry' | 'apple' | 'grape' | 'dragon_fruit' | 'phoenix_feather'
  | 'mushroom' | 'berry' | 'carrot' | 'potato' | 'tomato' | 'pepper' | 'corn' | 'wheat' | 'rice' | 'bean' | 'pumpkin' | 'cucumber'
  | 'lettuce' | 'onion' | 'garlic' | 'spinach' | 'broccoli' | 'strawberry' | 'blueberry' | 'raspberry' | 'watermelon';

export interface FruitDef {
  id: FruitId;
  name: string;
  emoji: string;
  sellPrice: number;
}

export const FRUITS: Record<FruitId, FruitDef> = {
  acorn: { id: 'acorn', name: 'Жёлудь', emoji: '🌰', sellPrice: 15 }, // 10 * 1.5
  pinecone: { id: 'pinecone', name: 'Шишка', emoji: '🌲', sellPrice: 37.5 }, // 25 * 1.5
  lily: { id: 'lily', name: 'Лилия', emoji: '🌸', sellPrice: 12 }, // 8 * 1.5
  rose: { id: 'rose', name: 'Роза', emoji: '🌹', sellPrice: 52.5 }, // 35 * 1.5
  sunflower: { id: 'sunflower', name: 'Подсолнух', emoji: '🌻', sellPrice: 22.5 }, // 15 * 1.5
  cactus_fruit: { id: 'cactus_fruit', name: 'Плод кактуса', emoji: '🌵', sellPrice: 60 }, // 40 * 1.5
  bamboo_shoot: { id: 'bamboo_shoot', name: 'Росток бамбука', emoji: '🎋', sellPrice: 150 }, // 100 * 1.5
  cherry: { id: 'cherry', name: 'Вишня', emoji: '🍒', sellPrice: 225 }, // 150 * 1.5
  apple: { id: 'apple', name: 'Яблоко', emoji: '🍎', sellPrice: 300 }, // 200 * 1.5
  grape: { id: 'grape', name: 'Виноград', emoji: '🍇', sellPrice: 750 }, // 500 * 1.5
  dragon_fruit: { id: 'dragon_fruit', name: 'Плод дракона', emoji: '🐉', sellPrice: 1500 }, // 1000 * 1.5
  phoenix_feather: { id: 'phoenix_feather', name: 'Перо феникса', emoji: '🔥', sellPrice: 7500 }, // 5000 * 1.5
  
  // Новые плоды
  mushroom: { id: 'mushroom', name: 'Гриб', emoji: '🍄', sellPrice: 18 },
  berry: { id: 'berry', name: 'Ягода', emoji: '🫐', sellPrice: 30 },
  carrot: { id: 'carrot', name: 'Морковь', emoji: '🥕', sellPrice: 27 },
  potato: { id: 'potato', name: 'Картофель', emoji: '🥔', sellPrice: 22.5 },
  tomato: { id: 'tomato', name: 'Помидор', emoji: '🍅', sellPrice: 33 },
  pepper: { id: 'pepper', name: 'Перец', emoji: '🫑', sellPrice: 67.5 },
  corn: { id: 'corn', name: 'Кукуруза', emoji: '🌽', sellPrice: 75 },
  wheat: { id: 'wheat', name: 'Пшеница', emoji: '🌾', sellPrice: 82.5 },
  rice: { id: 'rice', name: 'Рис', emoji: '🌾', sellPrice: 90 },
  bean: { id: 'bean', name: 'Фасоль', emoji: '🫘', sellPrice: 72 },
  pumpkin: { id: 'pumpkin', name: 'Тыква', emoji: '🎃', sellPrice: 225 },
  cucumber: { id: 'cucumber', name: 'Огурец', emoji: '🥒', sellPrice: 195 },
  lettuce: { id: 'lettuce', name: 'Салат', emoji: '🥬', sellPrice: 270 },
  onion: { id: 'onion', name: 'Лук', emoji: '🧅', sellPrice: 255 },
  garlic: { id: 'garlic', name: 'Чеснок', emoji: '🧄', sellPrice: 300 },
  spinach: { id: 'spinach', name: 'Шпинат', emoji: '🥬', sellPrice: 450 },
  broccoli: { id: 'broccoli', name: 'Брокколи', emoji: '🥦', sellPrice: 525 },
  strawberry: { id: 'strawberry', name: 'Клубника', emoji: '🍓', sellPrice: 600 },
  blueberry: { id: 'blueberry', name: 'Черника', emoji: '🫐', sellPrice: 675 },
  raspberry: { id: 'raspberry', name: 'Малина', emoji: '🫐', sellPrice: 720 },
  watermelon: { id: 'watermelon', name: 'Арбуз', emoji: '🍉', sellPrice: 12000 },
};

export const ALL_FRUITS = Object.values(FRUITS);