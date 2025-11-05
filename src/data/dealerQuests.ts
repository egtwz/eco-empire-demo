import { SeedId } from './seeds';
import { FruitId } from './fruits';
import { BoosterId } from './boosters';

export type QuestType = 
  | 'plant_seed'           // Посадить X семян определенного типа
  | 'sell_fruit'           // Продать X плодов определенного типа
  | 'sell_amount'          // Продать на сумму X $ECO
  | 'spend_amount'        // Потратить X $ECO (любые траты)
  | 'harvest_seed'         // Вырастить (собрать) X семян определенного типа
  | 'create_hybrid'        // Создать X гибридов
  | 'do_synthesis'         // Сделать X синтезов
  | 'use_booster'          // Использовать X бустеров определенного типа
  | 'process_item';        // Переработать X продуктов в определенном здании

export interface DealerQuest {
  id: string;              // Уникальный ID квеста
  type: QuestType;         // Тип квеста
  page: number | 'daily' | 'weekly'; // Страница (1-6) или 'daily' или 'weekly'
  itemId?: string;         // ID конкретного предмета (seedId, fruitId, boosterId)
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'; // Для квестов по редкости
  target: number;          // Требуемое количество
  rewardEco: number;       // Награда в $ECO (базовая, для daily/weekly будет умножена)
  rewardBoosters?: Array<{ boosterId: BoosterId; count: number }>; // Награда бустерами
  rewardSeeds?: Array<{ seedId: SeedId; count: number }>; // Награда семенами
  description: string;     // Описание квеста
}

// Массив всех возможных квестов (2000+)
export const DEALER_QUESTS: DealerQuest[] = [
  // ============ СТРАНИЦА 1 (Простые квесты для новичков) ============
  
  // Посадить семена (common)
  { id: 'dq_001', type: 'plant_seed', page: 1, itemId: 'oak_seed', target: 5, rewardEco: 50, rewardSeeds: [{ seedId: 'oak_seed', count: 2 }], description: 'Посадите 5 семян дуба' },
  { id: 'dq_002', type: 'plant_seed', page: 1, itemId: 'lily_seed', target: 10, rewardEco: 40, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 1 }], description: 'Посадите 10 семян лилии' },
  { id: 'dq_003', type: 'plant_seed', page: 1, itemId: 'sunflower_seed', target: 8, rewardEco: 60, rewardSeeds: [{ seedId: 'oak_seed', count: 2 }], description: 'Посадите 8 семян подсолнуха' },
  { id: 'dq_004', type: 'plant_seed', page: 1, itemId: 'mushroom_seed', target: 12, rewardEco: 55, rewardSeeds: [{ seedId: 'mushroom_seed', count: 3 }], description: 'Посадите 12 семян грибов' },
  { id: 'dq_005', type: 'plant_seed', page: 1, itemId: 'berry_seed', target: 15, rewardEco: 70, rewardBoosters: [{ boosterId: 'booster_speedup', count: 1 }], description: 'Посадите 15 семян ягоды' },
  { id: 'dq_006', type: 'plant_seed', page: 1, itemId: 'carrot_seed', target: 10, rewardEco: 65, rewardSeeds: [{ seedId: 'carrot_seed', count: 2 }], description: 'Посадите 10 семян моркови' },
  { id: 'dq_007', type: 'plant_seed', page: 1, itemId: 'potato_seed', target: 10, rewardEco: 60, rewardSeeds: [{ seedId: 'potato_seed', count: 3 }], description: 'Посадите 10 семян картофеля' },
  { id: 'dq_008', type: 'plant_seed', page: 1, itemId: 'tomato_seed', target: 8, rewardEco: 70, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 1 }], rewardSeeds: [{ seedId: 'tomato_seed', count: 2 }], description: 'Посадите 8 семян помидора' },
  
  // Продать плоды (common)
  { id: 'dq_009', type: 'sell_fruit', page: 1, itemId: 'acorn', target: 10, rewardEco: 75, rewardSeeds: [{ seedId: 'oak_seed', count: 2 }], description: 'Продайте 10 жёлудей' },
  { id: 'dq_010', type: 'sell_fruit', page: 1, itemId: 'lily', target: 15, rewardEco: 80, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 1 }], description: 'Продайте 15 лилий' },
  { id: 'dq_011', type: 'sell_fruit', page: 1, itemId: 'sunflower', target: 12, rewardEco: 90, rewardSeeds: [{ seedId: 'sunflower_seed', count: 2 }], description: 'Продайте 12 подсолнухов' },
  { id: 'dq_012', type: 'sell_fruit', page: 1, itemId: 'mushroom', target: 20, rewardEco: 100, rewardSeeds: [{ seedId: 'mushroom_seed', count: 3 }], rewardBoosters: [{ boosterId: 'booster_speedup', count: 1 }], description: 'Продайте 20 грибов' },
  { id: 'dq_013', type: 'sell_fruit', page: 1, itemId: 'berry', target: 18, rewardEco: 110, rewardSeeds: [{ seedId: 'berry_seed', count: 3 }], description: 'Продайте 18 ягод' },
  { id: 'dq_014', type: 'sell_fruit', page: 1, itemId: 'carrot', target: 15, rewardEco: 95, rewardSeeds: [{ seedId: 'carrot_seed', count: 2 }], description: 'Продайте 15 морковок' },
  { id: 'dq_015', type: 'sell_fruit', page: 1, itemId: 'potato', target: 15, rewardEco: 90, rewardSeeds: [{ seedId: 'potato_seed', count: 3 }], description: 'Продайте 15 картофелин' },
  { id: 'dq_016', type: 'sell_fruit', page: 1, itemId: 'tomato', target: 12, rewardEco: 100, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 1 }], description: 'Продайте 12 помидоров' },
  
  // Вырастить (собрать) семена
  { id: 'dq_017', type: 'harvest_seed', page: 1, itemId: 'oak_seed', target: 20, rewardEco: 120, rewardSeeds: [{ seedId: 'oak_seed', count: 3 }], description: 'Вырастите 20 дубов' },
  { id: 'dq_018', type: 'harvest_seed', page: 1, itemId: 'lily_seed', target: 25, rewardEco: 110, rewardSeeds: [{ seedId: 'lily_seed', count: 5 }], rewardBoosters: [{ boosterId: 'booster_watering_can', count: 1 }], description: 'Вырастите 25 лилий' },
  { id: 'dq_019', type: 'harvest_seed', page: 1, itemId: 'sunflower_seed', target: 20, rewardEco: 130, rewardSeeds: [{ seedId: 'sunflower_seed', count: 3 }], description: 'Вырастите 20 подсолнухов' },
  { id: 'dq_020', type: 'harvest_seed', page: 1, itemId: 'carrot_seed', target: 30, rewardEco: 140, rewardBoosters: [{ boosterId: 'booster_speedup', count: 1 }], description: 'Вырастите 30 морковок' },
  
  // Продать на сумму
  { id: 'dq_021', type: 'sell_amount', page: 1, target: 500, rewardEco: 150, rewardSeeds: [{ seedId: 'oak_seed', count: 3 }], description: 'Продайте плодов на сумму 500 $ECO' },
  { id: 'dq_022', type: 'sell_amount', page: 1, target: 750, rewardEco: 180, rewardBoosters: [{ boosterId: 'booster_speedup', count: 1 }], rewardSeeds: [{ seedId: 'lily_seed', count: 2 }], description: 'Продайте плодов на сумму 750 $ECO' },
  { id: 'dq_023', type: 'sell_amount', page: 1, target: 1000, rewardEco: 200, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 1 }], description: 'Продайте плодов на сумму 1000 $ECO' },
  
  // Использовать бустеры
  { id: 'dq_024', type: 'use_booster', page: 1, itemId: 'booster_watering_can', target: 3, rewardEco: 100, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 2 }], description: 'Используйте 3 лейки' },
  { id: 'dq_025', type: 'use_booster', page: 1, itemId: 'booster_speedup', target: 2, rewardEco: 150, rewardBoosters: [{ boosterId: 'booster_speedup', count: 1 }], rewardSeeds: [{ seedId: 'oak_seed', count: 3 }], description: 'Используйте 2 ускорителя роста' },
  { id: 'dq_026', type: 'use_booster', page: 1, itemId: 'booster_fertilizer', target: 2, rewardEco: 120, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 1 }], description: 'Используйте 2 удобрения' },
  
  // Посадить семена (uncommon)
  { id: 'dq_027', type: 'plant_seed', page: 1, itemId: 'fir_seed', target: 3, rewardEco: 80, rewardSeeds: [{ seedId: 'fir_seed', count: 1 }], rewardBoosters: [{ boosterId: 'booster_watering_can', count: 1 }], description: 'Посадите 3 семени ели' },
  { id: 'dq_028', type: 'plant_seed', page: 1, itemId: 'rose_seed', target: 3, rewardEco: 90, rewardSeeds: [{ seedId: 'rose_seed', count: 1 }], description: 'Посадите 3 семени розы' },
  { id: 'dq_029', type: 'plant_seed', page: 1, itemId: 'pepper_seed', target: 5, rewardEco: 100, rewardBoosters: [{ boosterId: 'booster_speedup', count: 1 }], description: 'Посадите 5 семян перца' },
  { id: 'dq_030', type: 'plant_seed', page: 1, itemId: 'corn_seed', target: 4, rewardEco: 110, rewardSeeds: [{ seedId: 'corn_seed', count: 2 }], rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 1 }], description: 'Посадите 4 семени кукурузы' },
  
  // ============ СТРАНИЦА 2 (Более сложные квесты) ============
  
  // Посадить семена (больше количества)
  { id: 'dq_031', type: 'plant_seed', page: 2, itemId: 'oak_seed', target: 20, rewardEco: 200, description: 'Посадите 20 семян дуба' },
  { id: 'dq_032', type: 'plant_seed', page: 2, itemId: 'lily_seed', target: 30, rewardEco: 180, rewardSeeds: [{ seedId: 'lily_seed', count: 5 }], description: 'Посадите 30 семян лилии' },
  { id: 'dq_033', type: 'plant_seed', page: 2, itemId: 'sunflower_seed', target: 25, rewardEco: 220, description: 'Посадите 25 семян подсолнуха' },
  { id: 'dq_034', type: 'plant_seed', page: 2, itemId: 'carrot_seed', target: 30, rewardEco: 210, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 2 }], description: 'Посадите 30 семян моркови' },
  { id: 'dq_035', type: 'plant_seed', page: 2, itemId: 'tomato_seed', target: 20, rewardEco: 240, description: 'Посадите 20 семян помидора' },
  { id: 'dq_036', type: 'plant_seed', page: 2, itemId: 'potato_seed', target: 25, rewardEco: 200, description: 'Посадите 25 семян картофеля' },
  { id: 'dq_037', type: 'plant_seed', page: 2, itemId: 'mushroom_seed', target: 35, rewardEco: 190, description: 'Посадите 35 семян грибов' },
  { id: 'dq_038', type: 'plant_seed', page: 2, itemId: 'berry_seed', target: 40, rewardEco: 230, rewardSeeds: [{ seedId: 'berry_seed', count: 5 }], description: 'Посадите 40 семян ягоды' },
  { id: 'dq_039', type: 'plant_seed', page: 2, itemId: 'wheat_seed', target: 15, rewardEco: 250, description: 'Посадите 15 семян пшеницы' },
  { id: 'dq_040', type: 'plant_seed', page: 2, itemId: 'rice_seed', target: 15, rewardEco: 260, description: 'Посадите 15 семян риса' },
  { id: 'dq_041', type: 'plant_seed', page: 2, itemId: 'bean_seed', target: 20, rewardEco: 220, description: 'Посадите 20 семян фасоли' },
  { id: 'dq_042', type: 'plant_seed', page: 2, itemId: 'pepper_seed', target: 15, rewardEco: 270, rewardBoosters: [{ boosterId: 'booster_speedup', count: 1 }], description: 'Посадите 15 семян перца' },
  { id: 'dq_043', type: 'plant_seed', page: 2, itemId: 'corn_seed', target: 12, rewardEco: 280, description: 'Посадите 12 семян кукурузы' },
  { id: 'dq_044', type: 'plant_seed', page: 2, itemId: 'fir_seed', target: 10, rewardEco: 240, description: 'Посадите 10 семян ели' },
  { id: 'dq_045', type: 'plant_seed', page: 2, itemId: 'rose_seed', target: 10, rewardEco: 260, rewardSeeds: [{ seedId: 'rose_seed', count: 2 }], description: 'Посадите 10 семян розы' },
  { id: 'dq_046', type: 'plant_seed', page: 2, itemId: 'cactus_seed', target: 8, rewardEco: 300, description: 'Посадите 8 семян кактуса' },
  
  // Продать плоды (больше количества)
  { id: 'dq_047', type: 'sell_fruit', page: 2, itemId: 'acorn', target: 50, rewardEco: 300, description: 'Продайте 50 жёлудей' },
  { id: 'dq_048', type: 'sell_fruit', page: 2, itemId: 'lily', target: 60, rewardEco: 280, description: 'Продайте 60 лилий' },
  { id: 'dq_049', type: 'sell_fruit', page: 2, itemId: 'sunflower', target: 50, rewardEco: 320, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 3 }], description: 'Продайте 50 подсолнухов' },
  { id: 'dq_050', type: 'sell_fruit', page: 2, itemId: 'mushroom', target: 70, rewardEco: 310, description: 'Продайте 70 грибов' },
  { id: 'dq_051', type: 'sell_fruit', page: 2, itemId: 'berry', target: 65, rewardEco: 330, rewardSeeds: [{ seedId: 'berry_seed', count: 5 }], description: 'Продайте 65 ягод' },
  { id: 'dq_052', type: 'sell_fruit', page: 2, itemId: 'carrot', target: 55, rewardEco: 290, description: 'Продайте 55 морковок' },
  { id: 'dq_053', type: 'sell_fruit', page: 2, itemId: 'potato', target: 55, rewardEco: 280, description: 'Продайте 55 картофелин' },
  { id: 'dq_054', type: 'sell_fruit', page: 2, itemId: 'tomato', target: 45, rewardEco: 310, description: 'Продайте 45 помидоров' },
  { id: 'dq_055', type: 'sell_fruit', page: 2, itemId: 'pepper', target: 30, rewardEco: 350, description: 'Продайте 30 перцев' },
  { id: 'dq_056', type: 'sell_fruit', page: 2, itemId: 'corn', target: 30, rewardEco: 360, description: 'Продайте 30 кукуруз' },
  { id: 'dq_057', type: 'sell_fruit', page: 2, itemId: 'wheat', target: 35, rewardEco: 340, description: 'Продайте 35 пшениц' },
  { id: 'dq_058', type: 'sell_fruit', page: 2, itemId: 'rice', target: 30, rewardEco: 350, description: 'Продайте 30 рисов' },
  { id: 'dq_059', type: 'sell_fruit', page: 2, itemId: 'bean', target: 35, rewardEco: 330, description: 'Продайте 35 фасолей' },
  { id: 'dq_060', type: 'sell_fruit', page: 2, itemId: 'pinecone', target: 25, rewardEco: 380, rewardSeeds: [{ seedId: 'fir_seed', count: 3 }], description: 'Продайте 25 шишек' },
  { id: 'dq_061', type: 'sell_fruit', page: 2, itemId: 'rose', target: 20, rewardEco: 390, description: 'Продайте 20 роз' },
  { id: 'dq_062', type: 'sell_fruit', page: 2, itemId: 'cactus_fruit', target: 15, rewardEco: 400, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 1 }], description: 'Продайте 15 плодов кактуса' },
  
  // Вырастить семена
  { id: 'dq_063', type: 'harvest_seed', page: 2, itemId: 'oak_seed', target: 60, rewardEco: 320, description: 'Вырастите 60 дубов' },
  { id: 'dq_064', type: 'harvest_seed', page: 2, itemId: 'lily_seed', target: 70, rewardEco: 300, description: 'Вырастите 70 лилий' },
  { id: 'dq_065', type: 'harvest_seed', page: 2, itemId: 'carrot_seed', target: 80, rewardEco: 340, rewardSeeds: [{ seedId: 'carrot_seed', count: 5 }], description: 'Вырастите 80 морковок' },
  { id: 'dq_066', type: 'harvest_seed', page: 2, itemId: 'tomato_seed', target: 50, rewardEco: 360, description: 'Вырастите 50 помидоров' },
  { id: 'dq_067', type: 'harvest_seed', page: 2, itemId: 'sunflower_seed', target: 55, rewardEco: 350, rewardBoosters: [{ boosterId: 'booster_speedup', count: 1 }], description: 'Вырастите 55 подсолнухов' },
  { id: 'dq_068', type: 'harvest_seed', page: 2, itemId: 'fir_seed', target: 30, rewardEco: 380, description: 'Вырастите 30 елей' },
  
  // Продать на сумму
  { id: 'dq_069', type: 'sell_amount', page: 2, target: 2500, rewardEco: 400, description: 'Продайте плодов на сумму 2500 $ECO' },
  { id: 'dq_070', type: 'sell_amount', page: 2, target: 3500, rewardEco: 450, rewardBoosters: [{ boosterId: 'booster_speedup', count: 2 }], description: 'Продайте плодов на сумму 3500 $ECO' },
  { id: 'dq_071', type: 'sell_amount', page: 2, target: 5000, rewardEco: 500, rewardSeeds: [{ seedId: 'fir_seed', count: 3 }, { seedId: 'rose_seed', count: 2 }], description: 'Продайте плодов на сумму 5000 $ECO' },
  
  // Использовать бустеры
  { id: 'dq_072', type: 'use_booster', page: 2, itemId: 'booster_watering_can', target: 10, rewardEco: 280, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 5 }], description: 'Используйте 10 леек' },
  { id: 'dq_073', type: 'use_booster', page: 2, itemId: 'booster_speedup', target: 5, rewardEco: 350, description: 'Используйте 5 ускорителей роста' },
  { id: 'dq_074', type: 'use_booster', page: 2, itemId: 'booster_fertilizer', target: 5, rewardEco: 330, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 3 }], description: 'Используйте 5 удобрений' },
  
  // Посадить rare семена
  { id: 'dq_075', type: 'plant_seed', page: 2, itemId: 'bamboo_seed', target: 5, rewardEco: 400, description: 'Посадите 5 семян бамбука' },
  { id: 'dq_076', type: 'plant_seed', page: 2, itemId: 'cherry_seed', target: 4, rewardEco: 420, rewardSeeds: [{ seedId: 'cherry_seed', count: 2 }], description: 'Посадите 4 семени вишни' },
  { id: 'dq_077', type: 'plant_seed', page: 2, itemId: 'apple_seed', target: 3, rewardEco: 450, description: 'Посадите 3 семени яблони' },
  { id: 'dq_078', type: 'plant_seed', page: 2, itemId: 'pumpkin_seed', target: 5, rewardEco: 430, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 1 }], description: 'Посадите 5 семян тыквы' },
  { id: 'dq_079', type: 'plant_seed', page: 2, itemId: 'cucumber_seed', target: 6, rewardEco: 410, description: 'Посадите 6 семян огурца' },
  { id: 'dq_080', type: 'plant_seed', page: 2, itemId: 'lettuce_seed', target: 4, rewardEco: 440, description: 'Посадите 4 семени салата' },
  { id: 'dq_081', type: 'plant_seed', page: 2, itemId: 'onion_seed', target: 5, rewardEco: 420, description: 'Посадите 5 семян лука' },
  { id: 'dq_082', type: 'plant_seed', page: 2, itemId: 'garlic_seed', target: 4, rewardEco: 460, rewardSeeds: [{ seedId: 'garlic_seed', count: 1 }], description: 'Посадите 4 семени чеснока' },
  
  // Продать rare плоды
  { id: 'dq_083', type: 'sell_fruit', page: 2, itemId: 'bamboo_shoot', target: 10, rewardEco: 480, description: 'Продайте 10 ростков бамбука' },
  { id: 'dq_084', type: 'sell_fruit', page: 2, itemId: 'cherry', target: 8, rewardEco: 500, rewardBoosters: [{ boosterId: 'booster_speedup', count: 1 }], description: 'Продайте 8 вишен' },
  { id: 'dq_085', type: 'sell_fruit', page: 2, itemId: 'apple', target: 6, rewardEco: 520, description: 'Продайте 6 яблок' },
  { id: 'dq_086', type: 'sell_fruit', page: 2, itemId: 'pumpkin', target: 8, rewardEco: 510, description: 'Продайте 8 тыкв' },
  { id: 'dq_087', type: 'sell_fruit', page: 2, itemId: 'cucumber', target: 10, rewardEco: 490, description: 'Продайте 10 огурцов' },
  { id: 'dq_088', type: 'sell_fruit', page: 2, itemId: 'lettuce', target: 7, rewardEco: 530, rewardSeeds: [{ seedId: 'lettuce_seed', count: 2 }], description: 'Продайте 7 салатов' },
  { id: 'dq_089', type: 'sell_fruit', page: 2, itemId: 'onion', target: 8, rewardEco: 500, description: 'Продайте 8 луков' },
  { id: 'dq_090', type: 'sell_fruit', page: 2, itemId: 'garlic', target: 6, rewardEco: 540, description: 'Продайте 6 чесноков' },
  
  // Вырастить rare семена
  { id: 'dq_091', type: 'harvest_seed', page: 2, itemId: 'bamboo_seed', target: 15, rewardEco: 480, description: 'Вырастите 15 бамбуков' },
  { id: 'dq_092', type: 'harvest_seed', page: 2, itemId: 'cherry_seed', target: 12, rewardEco: 500, rewardSeeds: [{ seedId: 'cherry_seed', count: 3 }], description: 'Вырастите 12 вишен' },
  { id: 'dq_093', type: 'harvest_seed', page: 2, itemId: 'apple_seed', target: 10, rewardEco: 520, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 1 }], description: 'Вырастите 10 яблонь' },
  { id: 'dq_094', type: 'harvest_seed', page: 2, itemId: 'pumpkin_seed', target: 12, rewardEco: 510, description: 'Вырастите 12 тыкв' },
  { id: 'dq_095', type: 'harvest_seed', page: 2, itemId: 'garlic_seed', target: 10, rewardEco: 530, description: 'Вырастите 10 чесноков' },
  { id: 'dq_096', type: 'harvest_seed', page: 2, itemId: 'lettuce_seed', target: 15, rewardEco: 490, description: 'Вырастите 15 салатов' },
  
  // Продать на большую сумму
  { id: 'dq_097', type: 'sell_amount', page: 2, target: 8000, rewardEco: 600, description: 'Продайте плодов на сумму 8000 $ECO' },
  { id: 'dq_098', type: 'sell_amount', page: 2, target: 10000, rewardEco: 700, rewardBoosters: [{ boosterId: 'booster_speedup', count: 2 }, { boosterId: 'booster_fertilizer', count: 1 }], description: 'Продайте плодов на сумму 10000 $ECO' },
  { id: 'dq_099', type: 'sell_amount', page: 2, target: 15000, rewardEco: 800, rewardSeeds: [{ seedId: 'apple_seed', count: 2 }, { seedId: 'cherry_seed', count: 2 }], description: 'Продайте плодов на сумму 15000 $ECO' },
  { id: 'dq_100', type: 'sell_amount', page: 2, target: 20000, rewardEco: 900, description: 'Продайте плодов на сумму 20000 $ECO' },
  
  // ============ СТРАНИЦА 3 ============
  
  // Посадить epic/legendary семена
  { id: 'dq_101', type: 'plant_seed', page: 3, itemId: 'grape_seed', target: 3, rewardEco: 600, rewardSeeds: [{ seedId: 'grape_seed', count: 1 }], description: 'Посадите 3 семени винограда' },
  { id: 'dq_102', type: 'plant_seed', page: 3, itemId: 'dragon_seed', target: 2, rewardEco: 800, description: 'Посадите 2 семени дракона' },
  { id: 'dq_103', type: 'plant_seed', page: 3, itemId: 'spinach_seed', target: 4, rewardEco: 700, description: 'Посадите 4 семени шпината' },
  { id: 'dq_104', type: 'plant_seed', page: 3, itemId: 'broccoli_seed', target: 4, rewardEco: 720, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 1 }], description: 'Посадите 4 семени брокколи' },
  { id: 'dq_105', type: 'plant_seed', page: 3, itemId: 'strawberry_seed', target: 5, rewardEco: 680, description: 'Посадите 5 семян клубники' },
  { id: 'dq_106', type: 'plant_seed', page: 3, itemId: 'blueberry_seed', target: 4, rewardEco: 750, rewardSeeds: [{ seedId: 'blueberry_seed', count: 2 }], description: 'Посадите 4 семени черники' },
  { id: 'dq_107', type: 'plant_seed', page: 3, itemId: 'raspberry_seed', target: 4, rewardEco: 730, description: 'Посадите 4 семени малины' },
  { id: 'dq_108', type: 'plant_seed', page: 3, itemId: 'phoenix_seed', target: 1, rewardEco: 1500, rewardBoosters: [{ boosterId: 'booster_speedup', count: 3 }, { boosterId: 'booster_fertilizer', count: 2 }], description: 'Посадите 1 семя феникса' },
  { id: 'dq_109', type: 'plant_seed', page: 3, itemId: 'watermelon_seed', target: 1, rewardEco: 2000, rewardSeeds: [{ seedId: 'watermelon_seed', count: 1 }], description: 'Посадите 1 семя арбуза' },
  
  // Продать epic/legendary плоды
  { id: 'dq_110', type: 'sell_fruit', page: 3, itemId: 'grape', target: 5, rewardEco: 800, description: 'Продайте 5 виноградов' },
  { id: 'dq_111', type: 'sell_fruit', page: 3, itemId: 'dragon_fruit', target: 2, rewardEco: 1200, rewardBoosters: [{ boosterId: 'booster_speedup', count: 2 }], description: 'Продайте 2 плода дракона' },
  { id: 'dq_112', type: 'sell_fruit', page: 3, itemId: 'spinach', target: 6, rewardEco: 900, description: 'Продайте 6 шпинатов' },
  { id: 'dq_113', type: 'sell_fruit', page: 3, itemId: 'broccoli', target: 5, rewardEco: 950, rewardSeeds: [{ seedId: 'broccoli_seed', count: 2 }], description: 'Продайте 5 брокколи' },
  { id: 'dq_114', type: 'sell_fruit', page: 3, itemId: 'strawberry', target: 8, rewardEco: 1100, description: 'Продайте 8 клубник' },
  { id: 'dq_115', type: 'sell_fruit', page: 3, itemId: 'blueberry', target: 7, rewardEco: 1150, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 2 }], description: 'Продайте 7 черник' },
  { id: 'dq_116', type: 'sell_fruit', page: 3, itemId: 'raspberry', target: 6, rewardEco: 1200, description: 'Продайте 6 малин' },
  { id: 'dq_117', type: 'sell_fruit', page: 3, itemId: 'phoenix_feather', target: 1, rewardEco: 2500, rewardSeeds: [{ seedId: 'phoenix_seed', count: 1 }, { seedId: 'dragon_seed', count: 1 }], description: 'Продайте 1 перо феникса' },
  { id: 'dq_118', type: 'sell_fruit', page: 3, itemId: 'watermelon', target: 1, rewardEco: 3000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 3 }], description: 'Продайте 1 арбуз' },
  
  // Большие количества common/uncommon
  { id: 'dq_119', type: 'plant_seed', page: 3, itemId: 'oak_seed', target: 50, rewardEco: 600, description: 'Посадите 50 семян дуба' },
  { id: 'dq_120', type: 'plant_seed', page: 3, itemId: 'lily_seed', target: 60, rewardEco: 580, description: 'Посадите 60 семян лилии' },
  { id: 'dq_121', type: 'plant_seed', page: 3, itemId: 'carrot_seed', target: 70, rewardEco: 620, rewardSeeds: [{ seedId: 'carrot_seed', count: 10 }], description: 'Посадите 70 семян моркови' },
  { id: 'dq_122', type: 'plant_seed', page: 3, itemId: 'tomato_seed', target: 55, rewardEco: 640, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 5 }], description: 'Посадите 55 семян помидора' },
  { id: 'dq_123', type: 'plant_seed', page: 3, itemId: 'fir_seed', target: 25, rewardEco: 700, description: 'Посадите 25 семян ели' },
  { id: 'dq_124', type: 'plant_seed', page: 3, itemId: 'rose_seed', target: 25, rewardEco: 720, rewardSeeds: [{ seedId: 'rose_seed', count: 5 }], description: 'Посадите 25 семян розы' },
  { id: 'dq_125', type: 'plant_seed', page: 3, itemId: 'cactus_seed', target: 20, rewardEco: 750, description: 'Посадите 20 семян кактуса' },
  { id: 'dq_126', type: 'plant_seed', page: 3, itemId: 'bamboo_seed', target: 15, rewardEco: 800, rewardBoosters: [{ boosterId: 'booster_speedup', count: 2 }], description: 'Посадите 15 семян бамбука' },
  { id: 'dq_127', type: 'plant_seed', page: 3, itemId: 'cherry_seed', target: 12, rewardEco: 850, description: 'Посадите 12 семян вишни' },
  { id: 'dq_128', type: 'plant_seed', page: 3, itemId: 'apple_seed', target: 10, rewardEco: 900, rewardSeeds: [{ seedId: 'apple_seed', count: 3 }], description: 'Посадите 10 семян яблони' },
  
  // Продать большие количества
  { id: 'dq_129', type: 'sell_fruit', page: 3, itemId: 'acorn', target: 100, rewardEco: 700, description: 'Продайте 100 жёлудей' },
  { id: 'dq_130', type: 'sell_fruit', page: 3, itemId: 'lily', target: 120, rewardEco: 680, description: 'Продайте 120 лилий' },
  { id: 'dq_131', type: 'sell_fruit', page: 3, itemId: 'carrot', target: 110, rewardEco: 720, rewardSeeds: [{ seedId: 'carrot_seed', count: 10 }], description: 'Продайте 110 морковок' },
  { id: 'dq_132', type: 'sell_fruit', page: 3, itemId: 'tomato', target: 90, rewardEco: 740, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 5 }], description: 'Продайте 90 помидоров' },
  { id: 'dq_133', type: 'sell_fruit', page: 3, itemId: 'pinecone', target: 50, rewardEco: 800, description: 'Продайте 50 шишек' },
  { id: 'dq_134', type: 'sell_fruit', page: 3, itemId: 'rose', target: 40, rewardEco: 850, rewardSeeds: [{ seedId: 'rose_seed', count: 5 }], description: 'Продайте 40 роз' },
  { id: 'dq_135', type: 'sell_fruit', page: 3, itemId: 'cactus_fruit', target: 30, rewardEco: 900, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 2 }], description: 'Продайте 30 плодов кактуса' },
  { id: 'dq_136', type: 'sell_fruit', page: 3, itemId: 'bamboo_shoot', target: 25, rewardEco: 950, description: 'Продайте 25 ростков бамбука' },
  { id: 'dq_137', type: 'sell_fruit', page: 3, itemId: 'cherry', target: 20, rewardEco: 1000, rewardSeeds: [{ seedId: 'cherry_seed', count: 3 }], description: 'Продайте 20 вишен' },
  { id: 'dq_138', type: 'sell_fruit', page: 3, itemId: 'apple', target: 15, rewardEco: 1100, description: 'Продайте 15 яблок' },
  
  // Вырастить большие количества
  { id: 'dq_139', type: 'harvest_seed', page: 3, itemId: 'oak_seed', target: 150, rewardEco: 800, description: 'Вырастите 150 дубов' },
  { id: 'dq_140', type: 'harvest_seed', page: 3, itemId: 'lily_seed', target: 180, rewardEco: 750, description: 'Вырастите 180 лилий' },
  { id: 'dq_141', type: 'harvest_seed', page: 3, itemId: 'carrot_seed', target: 200, rewardEco: 850, rewardSeeds: [{ seedId: 'carrot_seed', count: 10 }], description: 'Вырастите 200 морковок' },
  { id: 'dq_142', type: 'harvest_seed', page: 3, itemId: 'tomato_seed', target: 120, rewardEco: 900, rewardBoosters: [{ boosterId: 'booster_speedup', count: 3 }], description: 'Вырастите 120 помидоров' },
  { id: 'dq_143', type: 'harvest_seed', page: 3, itemId: 'fir_seed', target: 80, rewardEco: 950, description: 'Вырастите 80 елей' },
  { id: 'dq_144', type: 'harvest_seed', page: 3, itemId: 'rose_seed', target: 75, rewardEco: 980, rewardSeeds: [{ seedId: 'rose_seed', count: 5 }], description: 'Вырастите 75 роз' },
  { id: 'dq_145', type: 'harvest_seed', page: 3, itemId: 'bamboo_seed', target: 40, rewardEco: 1050, description: 'Вырастите 40 бамбуков' },
  { id: 'dq_146', type: 'harvest_seed', page: 3, itemId: 'cherry_seed', target: 35, rewardEco: 1100, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 2 }], description: 'Вырастите 35 вишен' },
  { id: 'dq_147', type: 'harvest_seed', page: 3, itemId: 'apple_seed', target: 30, rewardEco: 1200, rewardSeeds: [{ seedId: 'apple_seed', count: 3 }], description: 'Вырастите 30 яблонь' },
  { id: 'dq_148', type: 'harvest_seed', page: 3, itemId: 'grape_seed', target: 15, rewardEco: 1300, description: 'Вырастите 15 виноградов' },
  { id: 'dq_149', type: 'harvest_seed', page: 3, itemId: 'dragon_seed', target: 8, rewardEco: 1500, rewardBoosters: [{ boosterId: 'booster_speedup', count: 3 }, { boosterId: 'booster_fertilizer', count: 2 }], description: 'Вырастите 8 драконов' },
  { id: 'dq_150', type: 'harvest_seed', page: 3, itemId: 'phoenix_seed', target: 3, rewardEco: 2500, rewardSeeds: [{ seedId: 'phoenix_seed', count: 1 }, { seedId: 'dragon_seed', count: 1 }], description: 'Вырастите 3 феникса' },
  
  // Продать на очень большую сумму
  { id: 'dq_151', type: 'sell_amount', page: 3, target: 30000, rewardEco: 1500, description: 'Продайте плодов на сумму 30000 $ECO' },
  { id: 'dq_152', type: 'sell_amount', page: 3, target: 40000, rewardEco: 1800, rewardBoosters: [{ boosterId: 'booster_speedup', count: 3 }, { boosterId: 'booster_fertilizer', count: 2 }], description: 'Продайте плодов на сумму 40000 $ECO' },
  { id: 'dq_153', type: 'sell_amount', page: 3, target: 50000, rewardEco: 2000, rewardSeeds: [{ seedId: 'apple_seed', count: 5 }, { seedId: 'cherry_seed', count: 5 }, { seedId: 'grape_seed', count: 2 }], description: 'Продайте плодов на сумму 50000 $ECO' },
  { id: 'dq_154', type: 'sell_amount', page: 3, target: 75000, rewardEco: 2500, rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 3 }], description: 'Продайте плодов на сумму 75000 $ECO' },
  { id: 'dq_155', type: 'sell_amount', page: 3, target: 100000, rewardEco: 3000, rewardSeeds: [{ seedId: 'dragon_seed', count: 2 }, { seedId: 'grape_seed', count: 3 }], description: 'Продайте плодов на сумму 100000 $ECO' },
  
  // Использовать много бустеров
  { id: 'dq_156', type: 'use_booster', page: 3, itemId: 'booster_watering_can', target: 25, rewardEco: 800, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 10 }], description: 'Используйте 25 леек' },
  { id: 'dq_157', type: 'use_booster', page: 3, itemId: 'booster_speedup', target: 15, rewardEco: 1200, rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }], description: 'Используйте 15 ускорителей роста' },
  { id: 'dq_158', type: 'use_booster', page: 3, itemId: 'booster_fertilizer', target: 12, rewardEco: 1000, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 5 }], description: 'Используйте 12 удобрений' },
  
  // Создать гибриды (требует уровня 2+)
  { id: 'dq_159', type: 'create_hybrid', page: 3, target: 1, rewardEco: 500, rewardSeeds: [{ seedId: 'apple_seed', count: 1 }], description: 'Создайте 1 гибрид' },
  { id: 'dq_160', type: 'create_hybrid', page: 3, target: 3, rewardEco: 800, rewardBoosters: [{ boosterId: 'booster_speedup', count: 2 }], description: 'Создайте 3 гибрида' },
  { id: 'dq_161', type: 'create_hybrid', page: 3, target: 5, rewardEco: 1200, rewardSeeds: [{ seedId: 'rose_seed', count: 1 }, { seedId: 'bamboo_seed', count: 1 }], description: 'Создайте 5 гибридов' },
  { id: 'dq_162', type: 'create_hybrid', page: 3, target: 10, rewardEco: 2000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 3 }, { boosterId: 'booster_fertilizer', count: 2 }], description: 'Создайте 10 гибридов' },
  
  // Сделать синтез (требует уровня 2+)
  { id: 'dq_163', type: 'do_synthesis', page: 3, target: 1, rewardEco: 600, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 1 }], description: 'Выполните 1 синтез' },
  { id: 'dq_164', type: 'do_synthesis', page: 3, target: 3, rewardEco: 1000, rewardSeeds: [{ seedId: 'cherry_seed', count: 1 }], description: 'Выполните 3 синтеза' },
  { id: 'dq_165', type: 'do_synthesis', page: 3, target: 5, rewardEco: 1500, rewardBoosters: [{ boosterId: 'booster_speedup', count: 2 }, { boosterId: 'booster_fertilizer', count: 1 }], description: 'Выполните 5 синтезов' },
  { id: 'dq_166', type: 'do_synthesis', page: 3, target: 10, rewardEco: 2500, rewardSeeds: [{ seedId: 'grape_seed', count: 1 }, { seedId: 'dragon_seed', count: 1 }], description: 'Выполните 10 синтезов' },
  
  // Комбинированные квесты
  { id: 'dq_167', type: 'plant_seed', page: 3, itemId: 'strawberry_seed', target: 10, rewardEco: 900, description: 'Посадите 10 семян клубники' },
  { id: 'dq_168', type: 'sell_fruit', page: 3, itemId: 'strawberry', target: 20, rewardEco: 1400, rewardSeeds: [{ seedId: 'strawberry_seed', count: 5 }], description: 'Продайте 20 клубник' },
  { id: 'dq_169', type: 'harvest_seed', page: 3, itemId: 'strawberry_seed', target: 25, rewardEco: 1300, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 2 }], description: 'Вырастите 25 клубник' },
  { id: 'dq_170', type: 'plant_seed', page: 3, itemId: 'blueberry_seed', target: 8, rewardEco: 950, description: 'Посадите 8 семян черники' },
  { id: 'dq_171', type: 'sell_fruit', page: 3, itemId: 'blueberry', target: 15, rewardEco: 1500, rewardSeeds: [{ seedId: 'blueberry_seed', count: 3 }], description: 'Продайте 15 черник' },
  { id: 'dq_172', type: 'harvest_seed', page: 3, itemId: 'blueberry_seed', target: 20, rewardEco: 1400, rewardBoosters: [{ boosterId: 'booster_speedup', count: 2 }], description: 'Вырастите 20 черник' },
  
  // Большие количества rare
  { id: 'dq_173', type: 'plant_seed', page: 3, itemId: 'bamboo_seed', target: 30, rewardEco: 1100, description: 'Посадите 30 семян бамбука' },
  { id: 'dq_174', type: 'plant_seed', page: 3, itemId: 'cherry_seed', target: 25, rewardEco: 1200, rewardSeeds: [{ seedId: 'cherry_seed', count: 5 }], description: 'Посадите 25 семян вишни' },
  { id: 'dq_175', type: 'plant_seed', page: 3, itemId: 'apple_seed', target: 20, rewardEco: 1300, description: 'Посадите 20 семян яблони' },
  { id: 'dq_176', type: 'sell_fruit', page: 3, itemId: 'bamboo_shoot', target: 50, rewardEco: 1150, description: 'Продайте 50 ростков бамбука' },
  { id: 'dq_177', type: 'sell_fruit', page: 3, itemId: 'cherry', target: 40, rewardEco: 1250, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 5 }], description: 'Продайте 40 вишен' },
  { id: 'dq_178', type: 'sell_fruit', page: 3, itemId: 'apple', target: 30, rewardEco: 1350, rewardSeeds: [{ seedId: 'apple_seed', count: 5 }], description: 'Продайте 30 яблок' },
  { id: 'dq_179', type: 'harvest_seed', page: 3, itemId: 'bamboo_seed', target: 80, rewardEco: 1200, description: 'Вырастите 80 бамбуков' },
  { id: 'dq_180', type: 'harvest_seed', page: 3, itemId: 'cherry_seed', target: 70, rewardEco: 1300, rewardSeeds: [{ seedId: 'cherry_seed', count: 5 }], description: 'Вырастите 70 вишен' },
  
  // Переработка (начиная с 3 страницы)
  { id: 'dq_181', type: 'process_item', page: 3, itemId: 'winery', target: 2, rewardEco: 1000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 2 }], description: 'Сделайте в винокурне 2 продукта' },
  { id: 'dq_182', type: 'process_item', page: 3, itemId: 'cannery', target: 3, rewardEco: 1100, rewardSeeds: [{ seedId: 'tomato_seed', count: 3 }], description: 'Сделайте в консервной 3 продукта' },
  { id: 'dq_183', type: 'process_item', page: 3, itemId: 'oil_press', target: 2, rewardEco: 1200, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 1 }], description: 'Сделайте в маслобойне 2 продукта' },
  { id: 'dq_184', type: 'process_item', page: 3, itemId: 'juicer', target: 4, rewardEco: 950, description: 'Сделайте в соковыжималке 4 продукта' },
  { id: 'dq_185', type: 'process_item', page: 3, itemId: 'bakery', target: 3, rewardEco: 1050, rewardSeeds: [{ seedId: 'wheat_seed', count: 5 }], description: 'Сделайте в пекарне 3 продукта' },
];

// Генерация дополнительных квестов до 2000+
// Я создам функции для генерации массовых квестов

function generateMassQuests(): DealerQuest[] {
  const quests: DealerQuest[] = [];
  const seedIds: SeedId[] = ['oak_seed', 'lily_seed', 'sunflower_seed', 'mushroom_seed', 'berry_seed', 'carrot_seed', 'potato_seed', 'tomato_seed'];
  const fruitIds: FruitId[] = ['acorn', 'lily', 'sunflower', 'mushroom', 'berry', 'carrot', 'potato', 'tomato'];
  const uncommonSeeds: SeedId[] = ['fir_seed', 'rose_seed', 'cactus_seed', 'pepper_seed', 'corn_seed', 'wheat_seed', 'rice_seed', 'bean_seed'];
  const uncommonFruits: FruitId[] = ['pinecone', 'rose', 'cactus_fruit', 'pepper', 'corn', 'wheat', 'rice', 'bean'];
  const rareSeeds: SeedId[] = ['bamboo_seed', 'cherry_seed', 'apple_seed', 'pumpkin_seed', 'cucumber_seed', 'lettuce_seed', 'onion_seed', 'garlic_seed'];
  const rareFruits: FruitId[] = ['bamboo_shoot', 'cherry', 'apple', 'pumpkin', 'cucumber', 'lettuce', 'onion', 'garlic'];
  const epicSeeds: SeedId[] = ['grape_seed', 'dragon_seed', 'spinach_seed', 'broccoli_seed', 'strawberry_seed', 'blueberry_seed', 'raspberry_seed'];
  const epicFruits: FruitId[] = ['grape', 'dragon_fruit', 'spinach', 'broccoli', 'strawberry', 'blueberry', 'raspberry'];
  const legendarySeeds: SeedId[] = ['phoenix_seed', 'watermelon_seed'];
  const legendaryFruits: FruitId[] = ['phoenix_feather', 'watermelon'];
  
  let questId = 181;
  
  // Страница 4 - разнообразные квесты
  for (let i = 0; i < seedIds.length; i++) {
    const seedId = seedIds[i];
    const targets = [40, 60, 80, 100];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'plant_seed',
        page: 4,
        itemId: seedId,
        target,
        rewardEco: 400 + (target * 5) + (idx * 50),
        description: `Посадите ${target} ${seedId.replace('_seed', '').replace('_', ' ')}`
      });
    });
  }
  
  for (let i = 0; i < fruitIds.length; i++) {
    const fruitId = fruitIds[i];
    const targets = [80, 120, 150, 200];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'sell_fruit',
        page: 4,
        itemId: fruitId,
        target,
        rewardEco: 500 + (target * 4) + (idx * 60),
        description: `Продайте ${target} ${fruitId.replace('_', ' ')}`
      });
    });
  }
  
  for (let i = 0; i < seedIds.length; i++) {
    const seedId = seedIds[i];
    const targets = [100, 150, 200, 250];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'harvest_seed',
        page: 4,
        itemId: seedId,
        target,
        rewardEco: 600 + (target * 3) + (idx * 80),
        description: `Вырастите ${target} ${seedId.replace('_seed', '').replace('_', ' ')}`
      });
    });
  }
  
  // Uncommon семена для страницы 4
  for (let i = 0; i < uncommonSeeds.length; i++) {
    const seedId = uncommonSeeds[i];
    const targets = [20, 30, 40];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'plant_seed',
        page: 4,
        itemId: seedId,
        target,
        rewardEco: 800 + (target * 8) + (idx * 100),
        rewardSeeds: idx === 2 ? [{ seedId: seedId, count: 3 }] : undefined,
        description: `Посадите ${target} ${seedId.replace('_seed', '').replace('_', ' ')}`
      });
    });
  }
  
  for (let i = 0; i < uncommonFruits.length; i++) {
    const fruitId = uncommonFruits[i];
    const targets = [40, 60, 80];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'sell_fruit',
        page: 4,
        itemId: fruitId,
        target,
        rewardEco: 900 + (target * 6) + (idx * 120),
        rewardBoosters: idx === 2 ? [{ boosterId: 'booster_watering_can', count: 3 }] : undefined,
        description: `Продайте ${target} ${fruitId.replace('_', ' ')}`
      });
    });
  }
  
  // Продать на сумму для страницы 4
  const sellAmounts = [150000, 200000, 250000, 300000, 400000];
  sellAmounts.forEach((amount, idx) => {
    quests.push({
      id: `dq_${questId++}`,
      type: 'sell_amount',
      page: 4,
      target: amount,
      rewardEco: 2000 + (amount / 100),
      rewardBoosters: idx >= 2 ? [{ boosterId: 'booster_speedup', count: 3 }, { boosterId: 'booster_fertilizer', count: 2 }] : undefined,
      rewardSeeds: idx === 4 ? [{ seedId: 'apple_seed', count: 5 }, { seedId: 'grape_seed', count: 2 }] : undefined,
      description: `Продайте плодов на сумму ${amount.toLocaleString()} $ECO`
    });
  });
  
  // Бустеры для страницы 4
  quests.push(
    { id: `dq_${questId++}`, type: 'use_booster', page: 4, itemId: 'booster_watering_can', target: 50, rewardEco: 1200, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 15 }], description: 'Используйте 50 леек' },
    { id: `dq_${questId++}`, type: 'use_booster', page: 4, itemId: 'booster_speedup', target: 30, rewardEco: 1800, rewardBoosters: [{ boosterId: 'booster_speedup', count: 10 }], description: 'Используйте 30 ускорителей роста' },
    { id: `dq_${questId++}`, type: 'use_booster', page: 4, itemId: 'booster_fertilizer', target: 25, rewardEco: 1500, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 8 }], description: 'Используйте 25 удобрений' }
  );
  
  // Гибриды для страницы 4
  const hybridTargets = [15, 20, 30, 50];
  hybridTargets.forEach((target, idx) => {
    quests.push({
      id: `dq_${questId++}`,
      type: 'create_hybrid',
      page: 4,
      target,
      rewardEco: 1500 + (target * 30),
      rewardBoosters: idx >= 2 ? [{ boosterId: 'booster_speedup', count: 3 }, { boosterId: 'booster_fertilizer', count: 2 }] : undefined,
      rewardSeeds: idx === 3 ? [{ seedId: 'apple_seed', count: 1 }] : undefined,
      description: `Создайте ${target} гибридов`
    });
  });
  
  // Синтез для страницы 4
  const synthesisTargets = [15, 25, 40, 60];
  synthesisTargets.forEach((target, idx) => {
    quests.push({
      id: `dq_${questId++}`,
      type: 'do_synthesis',
      page: 4,
      target,
      rewardEco: 1800 + (target * 40),
      rewardBoosters: idx >= 2 ? [{ boosterId: 'booster_speedup', count: 4 }, { boosterId: 'booster_fertilizer', count: 3 }] : undefined,
      rewardSeeds: idx === 3 ? [{ seedId: 'dragon_seed', count: 1 }] : undefined,
      description: `Выполните ${target} синтезов`
    });
  });
  
  // Переработка для страницы 4
  const buildingIds = ['winery', 'cannery', 'oil_press', 'spinnery', 'dryer', 'juicer', 'coffee_roaster', 'cheese_factory', 'honey_extractor', 'mill', 'bakery', 'brewery'];
  const buildingNames: Record<string, string> = {
    winery: 'винокурне',
    cannery: 'консервной',
    oil_press: 'маслобойне',
    spinnery: 'прядильне',
    dryer: 'сушильне',
    juicer: 'соковыжималке',
    coffee_roaster: 'кофейне',
    cheese_factory: 'сырной',
    honey_extractor: 'медогонке',
    mill: 'мельнице',
    bakery: 'пекарне',
    brewery: 'пивоварне',
  };
  
  buildingIds.forEach((buildingId, idx) => {
    const targets = [5, 8, 10, 15];
    targets.forEach((target, tIdx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'process_item',
        page: 4,
        itemId: buildingId,
        target,
        rewardEco: 2000 + (target * 100) + (idx * 50),
        rewardBoosters: tIdx >= 2 ? [{ boosterId: 'booster_speedup', count: 3 }] : undefined,
        rewardSeeds: tIdx === 3 ? [{ seedId: 'apple_seed', count: 3 }] : undefined,
        description: `Сделайте в ${buildingNames[buildingId] || buildingId} ${target} продуктов`
      });
    });
  });
  
  // Страница 5 - еще более сложные квесты
  // Rare семена большие количества
  for (let i = 0; i < rareSeeds.length; i++) {
    const seedId = rareSeeds[i];
    const targets = [40, 60, 80];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'plant_seed',
        page: 5,
        itemId: seedId,
        target,
        rewardEco: 1500 + (target * 10) + (idx * 200),
        rewardSeeds: idx === 2 ? [{ seedId: seedId, count: 5 }] : undefined,
        description: `Посадите ${target} ${seedId.replace('_seed', '').replace('_', ' ')}`
      });
    });
  }
  
  for (let i = 0; i < rareFruits.length; i++) {
    const fruitId = rareFruits[i];
    const targets = [60, 80, 100];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'sell_fruit',
        page: 5,
        itemId: fruitId,
        target,
        rewardEco: 1600 + (target * 8) + (idx * 250),
        rewardBoosters: idx === 2 ? [{ boosterId: 'booster_fertilizer', count: 3 }] : undefined,
        description: `Продайте ${target} ${fruitId.replace('_', ' ')}`
      });
    });
  }
  
  for (let i = 0; i < rareSeeds.length; i++) {
    const seedId = rareSeeds[i];
    const targets = [80, 120, 150];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'harvest_seed',
        page: 5,
        itemId: seedId,
        target,
        rewardEco: 1700 + (target * 7) + (idx * 300),
        rewardSeeds: idx === 2 ? [{ seedId: seedId, count: 5 }] : undefined,
        description: `Вырастите ${target} ${seedId.replace('_seed', '').replace('_', ' ')}`
      });
    });
  }
  
  // Epic семена
  for (let i = 0; i < epicSeeds.length; i++) {
    const seedId = epicSeeds[i];
    const targets = [15, 25, 35];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'plant_seed',
        page: 5,
        itemId: seedId,
        target,
        rewardEco: 2000 + (target * 15) + (idx * 400),
        rewardSeeds: idx >= 1 ? [{ seedId: seedId, count: 2 }] : undefined,
        rewardBoosters: idx === 2 ? [{ boosterId: 'booster_speedup', count: 3 }] : undefined,
        description: `Посадите ${target} ${seedId.replace('_seed', '').replace('_', ' ')}`
      });
    });
  }
  
  for (let i = 0; i < epicFruits.length; i++) {
    const fruitId = epicFruits[i];
    const targets = [30, 50, 70];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'sell_fruit',
        page: 5,
        itemId: fruitId,
        target,
        rewardEco: 2200 + (target * 12) + (idx * 500),
        rewardSeeds: idx >= 1 ? [{ seedId: epicSeeds[i] as SeedId, count: 3 }] : undefined,
        rewardBoosters: idx === 2 ? [{ boosterId: 'booster_fertilizer', count: 4 }] : undefined,
        description: `Продайте ${target} ${fruitId.replace('_', ' ')}`
      });
    });
  }
  
  // Legendary семена
  for (let i = 0; i < legendarySeeds.length; i++) {
    const seedId = legendarySeeds[i];
    const targets = [3, 5, 8];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'plant_seed',
        page: 5,
        itemId: seedId,
        target,
        rewardEco: 3000 + (target * 200) + (idx * 1000),
        rewardSeeds: idx >= 1 ? [{ seedId: seedId, count: 1 }] : undefined,
        rewardBoosters: idx === 2 ? [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 5 }] : undefined,
        description: `Посадите ${target} ${seedId.replace('_seed', '').replace('_', ' ')}`
      });
    });
  }
  
  for (let i = 0; i < legendaryFruits.length; i++) {
    const fruitId = legendaryFruits[i];
    const targets = [2, 3, 5];
    targets.forEach((target, idx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'sell_fruit',
        page: 5,
        itemId: fruitId,
        target,
        rewardEco: 3500 + (target * 500) + (idx * 1500),
        rewardSeeds: idx >= 1 ? [{ seedId: legendarySeeds[i] as SeedId, count: 1 }] : undefined,
        rewardBoosters: idx === 2 ? [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 5 }] : undefined,
        description: `Продайте ${target} ${fruitId.replace('_', ' ')}`
      });
    });
  }
  
  // Очень большие суммы для страницы 5
  const bigSellAmounts = [500000, 750000, 1000000, 1500000, 2000000];
  bigSellAmounts.forEach((amount, idx) => {
    quests.push({
      id: `dq_${questId++}`,
      type: 'sell_amount',
      page: 5,
      target: amount,
      rewardEco: 3000 + (amount / 50),
      rewardBoosters: idx >= 2 ? [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 5 }] : undefined,
      rewardSeeds: idx === 4 ? [{ seedId: 'dragon_seed', count: 3 }, { seedId: 'grape_seed', count: 5 }, { seedId: 'phoenix_seed', count: 1 }] : undefined,
      description: `Продайте плодов на сумму ${amount.toLocaleString()} $ECO`
    });
  });
  
  // Много гибридов и синтезов
  quests.push(
    { id: `dq_${questId++}`, type: 'create_hybrid', page: 5, target: 75, rewardEco: 4000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 5 }], rewardSeeds: [{ seedId: 'dragon_seed', count: 1 }], description: 'Создайте 75 гибридов' },
    { id: `dq_${questId++}`, type: 'create_hybrid', page: 5, target: 100, rewardEco: 5000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 10 }, { boosterId: 'booster_fertilizer', count: 10 }], rewardSeeds: [{ seedId: 'phoenix_seed', count: 1 }], description: 'Создайте 100 гибридов' },
    { id: `dq_${questId++}`, type: 'do_synthesis', page: 5, target: 80, rewardEco: 4500, rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 5 }], rewardSeeds: [{ seedId: 'watermelon_seed', count: 1 }], description: 'Выполните 80 синтезов' },
    { id: `dq_${questId++}`, type: 'do_synthesis', page: 5, target: 100, rewardEco: 5500, rewardBoosters: [{ boosterId: 'booster_speedup', count: 10 }, { boosterId: 'booster_fertilizer', count: 10 }], rewardSeeds: [{ seedId: 'phoenix_seed', count: 1 }], description: 'Выполните 100 синтезов' }
  );
  
  // Страница 6 - самые сложные квесты
  // Огромные количества common/uncommon
  for (let i = 0; i < seedIds.length; i++) {
    const seedId = seedIds[i];
    quests.push({
      id: `dq_${questId++}`,
      type: 'plant_seed',
      page: 6,
      itemId: seedId,
      target: 200,
      rewardEco: 2500,
      rewardSeeds: [{ seedId: seedId, count: 10 }],
      description: `Посадите 200 ${seedId.replace('_seed', '').replace('_', ' ')}`
    });
  }
  
  for (let i = 0; i < fruitIds.length; i++) {
    const fruitId = fruitIds[i];
    quests.push({
      id: `dq_${questId++}`,
      type: 'sell_fruit',
      page: 6,
      itemId: fruitId,
      target: 300,
      rewardEco: 2800,
      rewardBoosters: [{ boosterId: 'booster_watering_can', count: 10 }],
      description: `Продайте 300 ${fruitId.replace('_', ' ')}`
    });
  }
  
  for (let i = 0; i < seedIds.length; i++) {
    const seedId = seedIds[i];
    quests.push({
      id: `dq_${questId++}`,
      type: 'harvest_seed',
      page: 6,
      itemId: seedId,
      target: 400,
      rewardEco: 3000,
      rewardSeeds: [{ seedId: seedId, count: 15 }],
      description: `Вырастите 400 ${seedId.replace('_seed', '').replace('_', ' ')}`
    });
  }
  
  // Огромные количества rare/epic
  for (let i = 0; i < rareSeeds.length; i++) {
    const seedId = rareSeeds[i];
    quests.push({
      id: `dq_${questId++}`,
      type: 'plant_seed',
      page: 6,
      itemId: seedId,
      target: 100,
      rewardEco: 4000,
      rewardSeeds: [{ seedId: seedId, count: 10 }],
      rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }],
      description: `Посадите 100 ${seedId.replace('_seed', '').replace('_', ' ')}`
    });
  }
  
  for (let i = 0; i < rareFruits.length; i++) {
    const fruitId = rareFruits[i];
    quests.push({
      id: `dq_${questId++}`,
      type: 'sell_fruit',
      page: 6,
      itemId: fruitId,
      target: 150,
      rewardEco: 4500,
      rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 5 }],
      description: `Продайте 150 ${fruitId.replace('_', ' ')}`
    });
  }
  
  for (let i = 0; i < epicSeeds.length; i++) {
    const seedId = epicSeeds[i];
    quests.push({
      id: `dq_${questId++}`,
      type: 'plant_seed',
      page: 6,
      itemId: seedId,
      target: 50,
      rewardEco: 5000,
      rewardSeeds: [{ seedId: seedId, count: 5 }],
      rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 5 }],
      description: `Посадите 50 ${seedId.replace('_seed', '').replace('_', ' ')}`
    });
  }
  
  for (let i = 0; i < epicFruits.length; i++) {
    const fruitId = epicFruits[i];
    quests.push({
      id: `dq_${questId++}`,
      type: 'sell_fruit',
      page: 6,
      itemId: fruitId,
      target: 80,
      rewardEco: 5500,
      rewardSeeds: [{ seedId: epicSeeds[i] as SeedId, count: 5 }],
      rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 5 }],
      description: `Продайте 80 ${fruitId.replace('_', ' ')}`
    });
  }
  
  // Legendary большие количества
  for (let i = 0; i < legendarySeeds.length; i++) {
    const seedId = legendarySeeds[i];
    quests.push({
      id: `dq_${questId++}`,
      type: 'plant_seed',
      page: 6,
      itemId: seedId,
      target: 15,
      rewardEco: 8000,
      rewardSeeds: [{ seedId: seedId, count: 3 }],
      rewardBoosters: [{ boosterId: 'booster_speedup', count: 10 }, { boosterId: 'booster_fertilizer', count: 10 }],
      description: `Посадите 15 ${seedId.replace('_seed', '').replace('_', ' ')}`
    });
  }
  
  for (let i = 0; i < legendaryFruits.length; i++) {
    const fruitId = legendaryFruits[i];
    quests.push({
      id: `dq_${questId++}`,
      type: 'sell_fruit',
      page: 6,
      itemId: fruitId,
      target: 10,
      rewardEco: 10000,
      rewardSeeds: [{ seedId: legendarySeeds[i] as SeedId, count: 2 }],
      rewardBoosters: [{ boosterId: 'booster_speedup', count: 10 }, { boosterId: 'booster_fertilizer', count: 10 }],
      description: `Продайте 10 ${fruitId.replace('_', ' ')}`
    });
  }
  
  // Огромные суммы
  const hugeSellAmounts = [3000000, 5000000, 7500000, 10000000];
  hugeSellAmounts.forEach((amount, idx) => {
    quests.push({
      id: `dq_${questId++}`,
      type: 'sell_amount',
      page: 6,
      target: amount,
      rewardEco: 5000 + (amount / 100),
      rewardBoosters: [{ boosterId: 'booster_speedup', count: 10 }, { boosterId: 'booster_fertilizer', count: 10 }],
      rewardSeeds: idx === 3 ? [{ seedId: 'phoenix_seed', count: 5 }, { seedId: 'watermelon_seed', count: 5 }, { seedId: 'dragon_seed', count: 5 }] : undefined,
      description: `Продайте плодов на сумму ${amount.toLocaleString()} $ECO`
    });
  });
  
  // Максимальные гибриды и синтезы
  quests.push(
    { id: `dq_${questId++}`, type: 'create_hybrid', page: 6, target: 200, rewardEco: 8000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 15 }, { boosterId: 'booster_fertilizer', count: 15 }], rewardSeeds: [{ seedId: 'watermelon_seed', count: 1 }], description: 'Создайте 200 гибридов' },
    { id: `dq_${questId++}`, type: 'create_hybrid', page: 6, target: 300, rewardEco: 10000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 20 }, { boosterId: 'booster_fertilizer', count: 20 }], rewardSeeds: [{ seedId: 'phoenix_seed', count: 1 }], description: 'Создайте 300 гибридов' },
    { id: `dq_${questId++}`, type: 'do_synthesis', page: 6, target: 200, rewardEco: 9000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 15 }, { boosterId: 'booster_fertilizer', count: 15 }], rewardSeeds: [{ seedId: 'watermelon_seed', count: 1 }], description: 'Выполните 200 синтезов' },
    { id: `dq_${questId++}`, type: 'do_synthesis', page: 6, target: 300, rewardEco: 12000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 20 }, { boosterId: 'booster_fertilizer', count: 20 }], rewardSeeds: [{ seedId: 'phoenix_seed', count: 1 }, { seedId: 'dragon_seed', count: 1 }], description: 'Выполните 300 синтезов' }
  );
  
  // Максимальные бустеры
  quests.push(
    { id: `dq_${questId++}`, type: 'use_booster', page: 6, itemId: 'booster_watering_can', target: 100, rewardEco: 3000, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 30 }], description: 'Используйте 100 леек' },
    { id: `dq_${questId++}`, type: 'use_booster', page: 6, itemId: 'booster_speedup', target: 75, rewardEco: 5000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 25 }], description: 'Используйте 75 ускорителей роста' },
    { id: `dq_${questId++}`, type: 'use_booster', page: 6, itemId: 'booster_fertilizer', target: 60, rewardEco: 4000, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 20 }], description: 'Используйте 60 удобрений' }
  );
  
  // Переработка для страницы 5
  buildingIds.forEach((buildingId, idx) => {
    const targets = [15, 25, 35];
    targets.forEach((target, tIdx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'process_item',
        page: 5,
        itemId: buildingId,
        target,
        rewardEco: 3000 + (target * 150) + (idx * 100),
        rewardBoosters: tIdx >= 1 ? [{ boosterId: 'booster_speedup', count: 4 }, { boosterId: 'booster_fertilizer', count: 3 }] : undefined,
        rewardSeeds: tIdx === 2 ? [{ seedId: 'grape_seed', count: 2 }] : undefined,
        description: `Сделайте в ${buildingNames[buildingId] || buildingId} ${target} продуктов`
      });
    });
  });
  
  // Продажа переработанных продуктов для страницы 5
  const processedItemsPage5: Array<{ id: string; name: string; targets: number[] }> = [
    { id: 'wine', name: 'вино', targets: [20, 30, 40] },
    { id: 'canned_fruit', name: 'консервы', targets: [25, 35, 50] },
    { id: 'oil', name: 'растительное масло', targets: [30, 40, 60] },
    { id: 'juice', name: 'сок', targets: [35, 50, 70] },
    { id: 'bread', name: 'хлеб', targets: [25, 40, 55] },
    { id: 'flour', name: 'мука', targets: [30, 45, 60] },
    { id: 'cheese', name: 'сыр', targets: [15, 25, 35] },
    { id: 'honey', name: 'мед', targets: [20, 30, 40] },
    { id: 'roasted_coffee', name: 'обжаренный кофе', targets: [15, 25, 35] },
    { id: 'beer', name: 'пиво', targets: [12, 20, 30] }
  ];
  
  processedItemsPage5.forEach((item, idx) => {
    item.targets.forEach((target, tIdx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'sell_fruit',
        page: 5,
        itemId: item.id,
        target,
        rewardEco: 3500 + (target * 200) + (idx * 100),
        rewardBoosters: tIdx >= 1 ? [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 4 }] : undefined,
        rewardSeeds: tIdx === 2 ? [{ seedId: 'apple_seed', count: 2 }] : undefined,
        description: `Продайте ${target} ${item.name}`
      });
    });
  });
  
  // Переработка для страницы 6
  buildingIds.forEach((buildingId, idx) => {
    const targets = [50, 75, 100];
    targets.forEach((target, tIdx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'process_item',
        page: 6,
        itemId: buildingId,
        target,
        rewardEco: 5000 + (target * 200) + (idx * 200),
        rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 5 }],
        rewardSeeds: tIdx === 2 ? [{ seedId: 'dragon_seed', count: 1 }] : undefined,
        description: `Сделайте в ${buildingNames[buildingId] || buildingId} ${target} продуктов`
      });
    });
  });
  
  // Продажа переработанных продуктов для страницы 6
  const processedItemsPage6: Array<{ id: string; name: string; targets: number[] }> = [
    { id: 'wine', name: 'вино', targets: [80, 120, 150] },
    { id: 'premium_wine', name: 'премиум вино', targets: [20, 30, 50] },
    { id: 'champagne', name: 'шампанское', targets: [5, 10, 15] },
    { id: 'canned_fruit', name: 'консервы', targets: [100, 150, 200] },
    { id: 'oil', name: 'растительное масло', targets: [120, 180, 250] },
    { id: 'premium_oil', name: 'премиум масло', targets: [15, 25, 40] },
    { id: 'juice', name: 'сок', targets: [150, 200, 300] },
    { id: 'bread', name: 'хлеб', targets: [100, 150, 200] },
    { id: 'flour', name: 'мука', targets: [120, 180, 250] },
    { id: 'cheese', name: 'сыр', targets: [60, 90, 120] },
    { id: 'honey', name: 'мед', targets: [80, 120, 150] },
    { id: 'nectar', name: 'нектар', targets: [10, 20, 30] },
    { id: 'roasted_coffee', name: 'обжаренный кофе', targets: [60, 100, 140] },
    { id: 'beer', name: 'пиво', targets: [50, 80, 120] },
    { id: 'silk', name: 'шелк', targets: [25, 40, 60] },
    { id: 'premium_jam', name: 'премиум варенье', targets: [30, 50, 80] }
  ];
  
  processedItemsPage6.forEach((item, idx) => {
    item.targets.forEach((target, tIdx) => {
      quests.push({
        id: `dq_${questId++}`,
        type: 'sell_fruit',
        page: 6,
        itemId: item.id,
        target,
        rewardEco: 4500 + (target * 250) + (idx * 150),
        rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }, { boosterId: 'booster_fertilizer', count: 5 }],
        rewardSeeds: tIdx === 2 && (item.id === 'champagne' || item.id === 'nectar' || item.id === 'premium_oil') ? [{ seedId: 'dragon_seed', count: 1 }] : undefined,
        description: `Продайте ${target} ${item.name}`
      });
    });
  });
  
  return quests;
}

// Объединяем все квесты
export const ALL_DEALER_QUESTS = [...DEALER_QUESTS, ...generateMassQuests()];

// Функция для получения случайного квеста с определенной страницы
export function getRandomQuestFromPage(page: number): DealerQuest | null {
  const pageQuests = ALL_DEALER_QUESTS.filter(q => q.page === page);
  if (pageQuests.length === 0) return null;
  return pageQuests[Math.floor(Math.random() * pageQuests.length)];
}

// Функция для получения квеста по ID (включая daily/weekly)
export function getQuestById(questId: string): DealerQuest | null {
  return ALL_DEALER_QUESTS.find(q => q.id === questId) 
    || DAILY_QUESTS.find(q => q.id === questId) 
    || WEEKLY_QUESTS.find(q => q.id === questId) 
    || null;
}

// Функция для получения всех квестов страницы
export function getQuestsByPage(page: number): DealerQuest[] {
  return ALL_DEALER_QUESTS.filter(q => q.page === page);
}

// ============ ЕЖЕДНЕВНЫЕ КВЕСТЫ (page: 'daily') ============
// Сложные квесты с наградами ×5
export const DAILY_QUESTS: DealerQuest[] = [
  // Продать плоды конкретного типа
  { id: 'daily_001', type: 'sell_fruit', page: 'daily', itemId: 'acorn', target: 200, rewardEco: 500, rewardSeeds: [{ seedId: 'oak_seed', count: 10 }], description: 'Продайте 200 жёлудей' },
  { id: 'daily_002', type: 'sell_fruit', page: 'daily', itemId: 'lily', target: 250, rewardEco: 600, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 5 }], description: 'Продайте 250 лилий' },
  { id: 'daily_003', type: 'sell_fruit', page: 'daily', itemId: 'carrot', target: 300, rewardEco: 700, rewardSeeds: [{ seedId: 'carrot_seed', count: 15 }], description: 'Продайте 300 морковок' },
  { id: 'daily_004', type: 'sell_fruit', page: 'daily', itemId: 'tomato', target: 200, rewardEco: 650, rewardBoosters: [{ boosterId: 'booster_speedup', count: 3 }], description: 'Продайте 200 помидоров' },
  { id: 'daily_005', type: 'sell_fruit', page: 'daily', itemId: 'potato', target: 250, rewardEco: 600, rewardSeeds: [{ seedId: 'potato_seed', count: 12 }], description: 'Продайте 250 картофелин' },
  { id: 'daily_006', type: 'sell_fruit', page: 'daily', itemId: 'mushroom', target: 350, rewardEco: 750, rewardSeeds: [{ seedId: 'mushroom_seed', count: 20 }], description: 'Продайте 350 грибов' },
  { id: 'daily_007', type: 'sell_fruit', page: 'daily', itemId: 'berry', target: 280, rewardEco: 720, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 2 }], description: 'Продайте 280 ягод' },
  { id: 'daily_008', type: 'sell_fruit', page: 'daily', itemId: 'sunflower', target: 220, rewardEco: 680, rewardSeeds: [{ seedId: 'sunflower_seed', count: 10 }], description: 'Продайте 220 подсолнухов' },
  { id: 'daily_009', type: 'sell_fruit', page: 'daily', itemId: 'pepper', target: 150, rewardEco: 800, rewardBoosters: [{ boosterId: 'booster_speedup', count: 4 }], description: 'Продайте 150 перцев' },
  { id: 'daily_010', type: 'sell_fruit', page: 'daily', itemId: 'corn', target: 140, rewardEco: 850, rewardSeeds: [{ seedId: 'corn_seed', count: 8 }], description: 'Продайте 140 кукуруз' },
  { id: 'daily_011', type: 'sell_fruit', page: 'daily', itemId: 'wheat', target: 160, rewardEco: 780, rewardSeeds: [{ seedId: 'wheat_seed', count: 10 }], description: 'Продайте 160 пшениц' },
  { id: 'daily_012', type: 'sell_fruit', page: 'daily', itemId: 'rice', target: 150, rewardEco: 820, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 4 }], description: 'Продайте 150 рисов' },
  { id: 'daily_013', type: 'sell_fruit', page: 'daily', itemId: 'bean', target: 170, rewardEco: 790, rewardSeeds: [{ seedId: 'bean_seed', count: 9 }], description: 'Продайте 170 фасолей' },
  { id: 'daily_014', type: 'sell_fruit', page: 'daily', itemId: 'pinecone', target: 100, rewardEco: 900, rewardSeeds: [{ seedId: 'fir_seed', count: 5 }], description: 'Продайте 100 шишек' },
  { id: 'daily_015', type: 'sell_fruit', page: 'daily', itemId: 'rose', target: 80, rewardEco: 950, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 3 }], description: 'Продайте 80 роз' },
  { id: 'daily_016', type: 'sell_fruit', page: 'daily', itemId: 'cactus_fruit', target: 60, rewardEco: 1000, rewardSeeds: [{ seedId: 'cactus_seed', count: 4 }], description: 'Продайте 60 плодов кактуса' },
  { id: 'daily_017', type: 'sell_fruit', page: 'daily', itemId: 'bamboo_shoot', target: 50, rewardEco: 1100, rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }], description: 'Продайте 50 ростков бамбука' },
  { id: 'daily_018', type: 'sell_fruit', page: 'daily', itemId: 'cherry', target: 40, rewardEco: 1200, rewardSeeds: [{ seedId: 'cherry_seed', count: 3 }], description: 'Продайте 40 вишен' },
  { id: 'daily_019', type: 'sell_fruit', page: 'daily', itemId: 'apple', target: 30, rewardEco: 1300, rewardSeeds: [{ seedId: 'apple_seed', count: 2 }], description: 'Продайте 30 яблок' },
  
  // Потратить ECO
  { id: 'daily_020', type: 'spend_amount', page: 'daily', target: 10000, rewardEco: 1000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 3 }, { boosterId: 'booster_fertilizer', count: 2 }], description: 'Потратьте 10000 $ECO' },
  { id: 'daily_021', type: 'spend_amount', page: 'daily', target: 15000, rewardEco: 1500, rewardSeeds: [{ seedId: 'apple_seed', count: 3 }], description: 'Потратьте 15000 $ECO' },
  { id: 'daily_022', type: 'spend_amount', page: 'daily', target: 20000, rewardEco: 2000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }], description: 'Потратьте 20000 $ECO' },
  { id: 'daily_023', type: 'spend_amount', page: 'daily', target: 25000, rewardEco: 2500, rewardSeeds: [{ seedId: 'grape_seed', count: 2 }], description: 'Потратьте 25000 $ECO' },
  { id: 'daily_024', type: 'spend_amount', page: 'daily', target: 30000, rewardEco: 3000, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 5 }], description: 'Потратьте 30000 $ECO' },
  { id: 'daily_025', type: 'spend_amount', page: 'daily', target: 50000, rewardEco: 5000, rewardSeeds: [{ seedId: 'dragon_seed', count: 1 }], description: 'Потратьте 50000 $ECO' },
  
  // Продать на сумму
  { id: 'daily_026', type: 'sell_amount', page: 'daily', target: 50000, rewardEco: 2000, rewardSeeds: [{ seedId: 'apple_seed', count: 5 }], description: 'Продайте плодов на сумму 50000 $ECO' },
  { id: 'daily_027', type: 'sell_amount', page: 'daily', target: 75000, rewardEco: 3000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 4 }], description: 'Продайте плодов на сумму 75000 $ECO' },
  { id: 'daily_028', type: 'sell_amount', page: 'daily', target: 100000, rewardEco: 4000, rewardSeeds: [{ seedId: 'cherry_seed', count: 5 }], description: 'Продайте плодов на сумму 100000 $ECO' },
  { id: 'daily_029', type: 'sell_amount', page: 'daily', target: 150000, rewardEco: 6000, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 4 }], description: 'Продайте плодов на сумму 150000 $ECO' },
  { id: 'daily_030', type: 'sell_amount', page: 'daily', target: 200000, rewardEco: 8000, rewardSeeds: [{ seedId: 'grape_seed', count: 3 }], description: 'Продайте плодов на сумму 200000 $ECO' },
  { id: 'daily_031', type: 'sell_amount', page: 'daily', target: 300000, rewardEco: 12000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 6 }, { boosterId: 'booster_fertilizer', count: 5 }], description: 'Продайте плодов на сумму 300000 $ECO' },
  { id: 'daily_032', type: 'sell_amount', page: 'daily', target: 500000, rewardEco: 20000, rewardSeeds: [{ seedId: 'dragon_seed', count: 2 }], description: 'Продайте плодов на сумму 500000 $ECO' },
  
  // Вырастить семена
  { id: 'daily_033', type: 'harvest_seed', page: 'daily', itemId: 'oak_seed', target: 500, rewardEco: 1500, rewardSeeds: [{ seedId: 'oak_seed', count: 20 }], description: 'Вырастите 500 дубов' },
  { id: 'daily_034', type: 'harvest_seed', page: 'daily', itemId: 'carrot_seed', target: 600, rewardEco: 1800, rewardSeeds: [{ seedId: 'carrot_seed', count: 25 }], description: 'Вырастите 600 морковок' },
  { id: 'daily_035', type: 'harvest_seed', page: 'daily', itemId: 'tomato_seed', target: 400, rewardEco: 1600, rewardBoosters: [{ boosterId: 'booster_speedup', count: 4 }], description: 'Вырастите 400 помидоров' },
  { id: 'daily_036', type: 'harvest_seed', page: 'daily', itemId: 'lily_seed', target: 700, rewardEco: 1400, rewardSeeds: [{ seedId: 'lily_seed', count: 30 }], description: 'Вырастите 700 лилий' },
  { id: 'daily_037', type: 'harvest_seed', page: 'daily', itemId: 'berry_seed', target: 550, rewardEco: 1700, rewardSeeds: [{ seedId: 'berry_seed', count: 22 }], description: 'Вырастите 550 ягод' },
  
  // Посадить семена
  { id: 'daily_038', type: 'plant_seed', page: 'daily', itemId: 'oak_seed', target: 300, rewardEco: 1200, rewardSeeds: [{ seedId: 'oak_seed', count: 15 }], description: 'Посадите 300 семян дуба' },
  { id: 'daily_039', type: 'plant_seed', page: 'daily', itemId: 'carrot_seed', target: 350, rewardEco: 1400, rewardSeeds: [{ seedId: 'carrot_seed', count: 18 }], description: 'Посадите 350 семян моркови' },
  { id: 'daily_040', type: 'plant_seed', page: 'daily', itemId: 'tomato_seed', target: 250, rewardEco: 1300, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 5 }], description: 'Посадите 250 семян помидора' },
  { id: 'daily_041', type: 'plant_seed', page: 'daily', itemId: 'fir_seed', target: 100, rewardEco: 1800, rewardSeeds: [{ seedId: 'fir_seed', count: 10 }], description: 'Посадите 100 семян ели' },
  { id: 'daily_042', type: 'plant_seed', page: 'daily', itemId: 'rose_seed', target: 80, rewardEco: 2000, rewardSeeds: [{ seedId: 'rose_seed', count: 8 }], description: 'Посадите 80 семян розы' },
  { id: 'daily_043', type: 'plant_seed', page: 'daily', itemId: 'bamboo_seed', target: 60, rewardEco: 2200, rewardBoosters: [{ boosterId: 'booster_speedup', count: 3 }], description: 'Посадите 60 семян бамбука' },
  { id: 'daily_044', type: 'plant_seed', page: 'daily', itemId: 'cherry_seed', target: 50, rewardEco: 2400, rewardSeeds: [{ seedId: 'cherry_seed', count: 5 }], description: 'Посадите 50 семян вишни' },
  { id: 'daily_045', type: 'plant_seed', page: 'daily', itemId: 'apple_seed', target: 40, rewardEco: 2600, rewardSeeds: [{ seedId: 'apple_seed', count: 4 }], description: 'Посадите 40 семян яблони' },
  
  // Использовать бустеры
  { id: 'daily_046', type: 'use_booster', page: 'daily', itemId: 'booster_watering_can', target: 50, rewardEco: 1500, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 15 }], description: 'Используйте 50 леек' },
  { id: 'daily_047', type: 'use_booster', page: 'daily', itemId: 'booster_speedup', target: 30, rewardEco: 2000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 10 }], description: 'Используйте 30 ускорителей роста' },
  { id: 'daily_048', type: 'use_booster', page: 'daily', itemId: 'booster_fertilizer', target: 25, rewardEco: 1800, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 8 }], description: 'Используйте 25 удобрений' },
  
  // Создать гибриды
  { id: 'daily_049', type: 'create_hybrid', page: 'daily', target: 20, rewardEco: 2500, rewardBoosters: [{ boosterId: 'booster_speedup', count: 5 }], description: 'Создайте 20 гибридов' },
  { id: 'daily_050', type: 'create_hybrid', page: 'daily', target: 30, rewardEco: 3500, rewardSeeds: [{ seedId: 'apple_seed', count: 3 }], description: 'Создайте 30 гибридов' },
  
  // Выполнить синтез
  { id: 'daily_051', type: 'do_synthesis', page: 'daily', target: 15, rewardEco: 2800, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 4 }], description: 'Выполните 15 синтезов' },
  { id: 'daily_052', type: 'do_synthesis', page: 'daily', target: 25, rewardEco: 4000, rewardSeeds: [{ seedId: 'cherry_seed', count: 3 }], description: 'Выполните 25 синтезов' },
];

// ============ ЕЖЕНЕДЕЛЬНЫЕ КВЕСТЫ (page: 'weekly') ============
// Очень сложные квесты с наградами ×20
export const WEEKLY_QUESTS: DealerQuest[] = [
  // Продать на очень большую сумму
  { id: 'weekly_001', type: 'sell_amount', page: 'weekly', target: 1000000, rewardEco: 50000, rewardSeeds: [{ seedId: 'apple_seed', count: 10 }, { seedId: 'cherry_seed', count: 10 }], description: 'Продайте плодов на сумму 1000000 $ECO' },
  { id: 'weekly_002', type: 'sell_amount', page: 'weekly', target: 2000000, rewardEco: 100000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 20 }, { boosterId: 'booster_fertilizer', count: 15 }], description: 'Продайте плодов на сумму 2000000 $ECO' },
  { id: 'weekly_003', type: 'sell_amount', page: 'weekly', target: 5000000, rewardEco: 250000, rewardSeeds: [{ seedId: 'grape_seed', count: 10 }, { seedId: 'dragon_seed', count: 5 }], description: 'Продайте плодов на сумму 5000000 $ECO' },
  { id: 'weekly_004', type: 'sell_amount', page: 'weekly', target: 10000000, rewardEco: 500000, rewardSeeds: [{ seedId: 'phoenix_seed', count: 3 }], description: 'Продайте плодов на сумму 10000000 $ECO' },
  
  // Потратить огромную сумму
  { id: 'weekly_005', type: 'spend_amount', page: 'weekly', target: 500000, rewardEco: 100000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 15 }, { boosterId: 'booster_fertilizer', count: 15 }], description: 'Потратьте 500000 $ECO' },
  { id: 'weekly_006', type: 'spend_amount', page: 'weekly', target: 1000000, rewardEco: 200000, rewardSeeds: [{ seedId: 'dragon_seed', count: 5 }, { seedId: 'grape_seed', count: 8 }], description: 'Потратьте 1000000 $ECO' },
  { id: 'weekly_007', type: 'spend_amount', page: 'weekly', target: 2000000, rewardEco: 400000, rewardSeeds: [{ seedId: 'phoenix_seed', count: 2 }], description: 'Потратьте 2000000 $ECO' },
  
  // Продать огромное количество плодов
  { id: 'weekly_008', type: 'sell_fruit', page: 'weekly', itemId: 'acorn', target: 2000, rewardEco: 80000, rewardSeeds: [{ seedId: 'oak_seed', count: 50 }], description: 'Продайте 2000 жёлудей' },
  { id: 'weekly_009', type: 'sell_fruit', page: 'weekly', itemId: 'carrot', target: 2500, rewardEco: 90000, rewardSeeds: [{ seedId: 'carrot_seed', count: 60 }], description: 'Продайте 2500 морковок' },
  { id: 'weekly_010', type: 'sell_fruit', page: 'weekly', itemId: 'tomato', target: 1500, rewardEco: 85000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 12 }], description: 'Продайте 1500 помидоров' },
  { id: 'weekly_011', type: 'sell_fruit', page: 'weekly', itemId: 'apple', target: 300, rewardEco: 120000, rewardSeeds: [{ seedId: 'apple_seed', count: 15 }], description: 'Продайте 300 яблок' },
  { id: 'weekly_012', type: 'sell_fruit', page: 'weekly', itemId: 'cherry', target: 400, rewardEco: 110000, rewardSeeds: [{ seedId: 'cherry_seed', count: 12 }], description: 'Продайте 400 вишен' },
  { id: 'weekly_013', type: 'sell_fruit', page: 'weekly', itemId: 'grape', target: 200, rewardEco: 150000, rewardSeeds: [{ seedId: 'grape_seed', count: 8 }], description: 'Продайте 200 виноградов' },
  { id: 'weekly_014', type: 'sell_fruit', page: 'weekly', itemId: 'dragon_fruit', target: 50, rewardEco: 200000, rewardSeeds: [{ seedId: 'dragon_seed', count: 5 }], description: 'Продайте 50 плодов дракона' },
  { id: 'weekly_015', type: 'sell_fruit', page: 'weekly', itemId: 'phoenix_feather', target: 10, rewardEco: 500000, rewardSeeds: [{ seedId: 'phoenix_seed', count: 3 }], description: 'Продайте 10 перьев феникса' },
  
  // Вырастить огромное количество
  { id: 'weekly_016', type: 'harvest_seed', page: 'weekly', itemId: 'oak_seed', target: 2000, rewardEco: 100000, rewardSeeds: [{ seedId: 'oak_seed', count: 100 }], description: 'Вырастите 2000 дубов' },
  { id: 'weekly_017', type: 'harvest_seed', page: 'weekly', itemId: 'carrot_seed', target: 2500, rewardEco: 120000, rewardSeeds: [{ seedId: 'carrot_seed', count: 120 }], description: 'Вырастите 2500 морковок' },
  { id: 'weekly_018', type: 'harvest_seed', page: 'weekly', itemId: 'apple_seed', target: 300, rewardEco: 150000, rewardSeeds: [{ seedId: 'apple_seed', count: 20 }], description: 'Вырастите 300 яблонь' },
  { id: 'weekly_019', type: 'harvest_seed', page: 'weekly', itemId: 'cherry_seed', target: 400, rewardEco: 140000, rewardSeeds: [{ seedId: 'cherry_seed', count: 25 }], description: 'Вырастите 400 вишен' },
  { id: 'weekly_020', type: 'harvest_seed', page: 'weekly', itemId: 'grape_seed', target: 200, rewardEco: 180000, rewardSeeds: [{ seedId: 'grape_seed', count: 15 }], description: 'Вырастите 200 виноградов' },
  { id: 'weekly_021', type: 'harvest_seed', page: 'weekly', itemId: 'dragon_seed', target: 80, rewardEco: 250000, rewardSeeds: [{ seedId: 'dragon_seed', count: 10 }], description: 'Вырастите 80 драконов' },
  { id: 'weekly_022', type: 'harvest_seed', page: 'weekly', itemId: 'phoenix_seed', target: 20, rewardEco: 600000, rewardSeeds: [{ seedId: 'phoenix_seed', count: 5 }], description: 'Вырастите 20 фениксов' },
  
  // Посадить огромное количество
  { id: 'weekly_023', type: 'plant_seed', page: 'weekly', itemId: 'oak_seed', target: 1500, rewardEco: 90000, rewardSeeds: [{ seedId: 'oak_seed', count: 80 }], description: 'Посадите 1500 семян дуба' },
  { id: 'weekly_024', type: 'plant_seed', page: 'weekly', itemId: 'carrot_seed', target: 1800, rewardEco: 110000, rewardSeeds: [{ seedId: 'carrot_seed', count: 100 }], description: 'Посадите 1800 семян моркови' },
  { id: 'weekly_025', type: 'plant_seed', page: 'weekly', itemId: 'apple_seed', target: 250, rewardEco: 160000, rewardSeeds: [{ seedId: 'apple_seed', count: 18 }], description: 'Посадите 250 семян яблони' },
  { id: 'weekly_026', type: 'plant_seed', page: 'weekly', itemId: 'cherry_seed', target: 300, rewardEco: 150000, rewardSeeds: [{ seedId: 'cherry_seed', count: 15 }], description: 'Посадите 300 семян вишни' },
  { id: 'weekly_027', type: 'plant_seed', page: 'weekly', itemId: 'grape_seed', target: 150, rewardEco: 200000, rewardSeeds: [{ seedId: 'grape_seed', count: 12 }], description: 'Посадите 150 семян винограда' },
  { id: 'weekly_028', type: 'plant_seed', page: 'weekly', itemId: 'dragon_seed', target: 60, rewardEco: 300000, rewardSeeds: [{ seedId: 'dragon_seed', count: 8 }], description: 'Посадите 60 семян дракона' },
  { id: 'weekly_029', type: 'plant_seed', page: 'weekly', itemId: 'phoenix_seed', target: 15, rewardEco: 750000, rewardSeeds: [{ seedId: 'phoenix_seed', count: 5 }], description: 'Посадите 15 семян феникса' },
  
  // Использовать много бустеров
  { id: 'weekly_030', type: 'use_booster', page: 'weekly', itemId: 'booster_watering_can', target: 200, rewardEco: 80000, rewardBoosters: [{ boosterId: 'booster_watering_can', count: 60 }], description: 'Используйте 200 леек' },
  { id: 'weekly_031', type: 'use_booster', page: 'weekly', itemId: 'booster_speedup', target: 150, rewardEco: 120000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 50 }], description: 'Используйте 150 ускорителей роста' },
  { id: 'weekly_032', type: 'use_booster', page: 'weekly', itemId: 'booster_fertilizer', target: 120, rewardEco: 100000, rewardBoosters: [{ boosterId: 'booster_fertilizer', count: 40 }], description: 'Используйте 120 удобрений' },
  
  // Создать много гибридов
  { id: 'weekly_033', type: 'create_hybrid', page: 'weekly', target: 200, rewardEco: 300000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 20 }, { boosterId: 'booster_fertilizer', count: 20 }], description: 'Создайте 200 гибридов' },
  { id: 'weekly_034', type: 'create_hybrid', page: 'weekly', target: 300, rewardEco: 450000, rewardSeeds: [{ seedId: 'dragon_seed', count: 10 }], description: 'Создайте 300 гибридов' },
  { id: 'weekly_035', type: 'create_hybrid', page: 'weekly', target: 500, rewardEco: 750000, rewardSeeds: [{ seedId: 'phoenix_seed', count: 5 }], description: 'Создайте 500 гибридов' },
  
  // Выполнить много синтезов
  { id: 'weekly_036', type: 'do_synthesis', page: 'weekly', target: 200, rewardEco: 350000, rewardBoosters: [{ boosterId: 'booster_speedup', count: 20 }, { boosterId: 'booster_fertilizer', count: 20 }], description: 'Выполните 200 синтезов' },
  { id: 'weekly_037', type: 'do_synthesis', page: 'weekly', target: 300, rewardEco: 500000, rewardSeeds: [{ seedId: 'watermelon_seed', count: 3 }], description: 'Выполните 300 синтезов' },
  { id: 'weekly_038', type: 'do_synthesis', page: 'weekly', target: 500, rewardEco: 800000, rewardSeeds: [{ seedId: 'phoenix_seed', count: 5 }, { seedId: 'dragon_seed', count: 5 }], description: 'Выполните 500 синтезов' },
];

// Функция для получения случайного ежедневного квеста
export function getRandomDailyQuest(): DealerQuest {
  return DAILY_QUESTS[Math.floor(Math.random() * DAILY_QUESTS.length)];
}

// Функция для получения случайного еженедельного квеста
export function getRandomWeeklyQuest(): DealerQuest {
  return WEEKLY_QUESTS[Math.floor(Math.random() * WEEKLY_QUESTS.length)];
}

// Функция для получения квеста по ID (включая daily/weekly)
export function getAllQuestById(questId: string): DealerQuest | null {
  return ALL_DEALER_QUESTS.find(q => q.id === questId) 
    || DAILY_QUESTS.find(q => q.id === questId) 
    || WEEKLY_QUESTS.find(q => q.id === questId) 
    || null;
}

