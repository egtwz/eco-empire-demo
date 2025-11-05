import { SEEDS } from '../data/seeds';
import { FRUITS } from '../data/fruits';
import { HYBRID_RECIPES, calculateHybridSeedPrice, calculateHybridGrowTime, calculateHybridFruitPrice } from '../data/hybrids';
import { SYNTHESIS_PLANTS } from '../data/synthesis';
import { PROCESSING_RECIPES, PROCESSED_ITEMS, calculateProcessedItemPrice } from '../data/processing';

// Получение информации о семени (включая гибридные)
export function getSeedInfo(seedId: string) {
  // Сначала проверяем обычные семена
  if (seedId in SEEDS) {
    return SEEDS[seedId as keyof typeof SEEDS];
  }
  
  // Если не найдено, проверяем гибридные семена
  const recipe = HYBRID_RECIPES.find(r => r.resultSeedId === seedId);
  if (recipe) {
    return {
      id: seedId,
      name: recipe.resultName,
      emoji: recipe.resultEmoji,
      price: calculateHybridSeedPrice(recipe.ingredients),
      fruitId: recipe.resultFruitId,
      growSeconds: calculateHybridGrowTime(recipe.ingredients),
      rarity: recipe.rarity,
      description: recipe.description
    };
  }
  
  return null;
}

// Получение информации о фрукте (включая гибридные, синтезные и переработанные)
export function getFruitInfo(fruitId: string) {
  // Сначала проверяем обычные фрукты
  if (fruitId in FRUITS) {
    return FRUITS[fruitId as keyof typeof FRUITS];
  }
  
  // Если не найдено, проверяем гибридные фрукты
  const recipe = HYBRID_RECIPES.find(r => r.resultFruitId === fruitId);
  if (recipe) {
    return {
      id: fruitId,
      name: recipe.name,
      emoji: recipe.resultEmoji,
      sellPrice: calculateHybridFruitPrice(recipe.ingredients)
    };
  }
  
  // Если не найдено, проверяем синтезные фрукты
  const synthesisPlant = SYNTHESIS_PLANTS.find(p => p.id === fruitId);
  if (synthesisPlant) {
    return {
      id: fruitId,
      name: synthesisPlant.name,
      emoji: synthesisPlant.emoji,
      sellPrice: synthesisPlant.sellPrice
    };
  }
  
  // Если не найдено, проверяем переработанные продукты
  const processedItem = PROCESSED_ITEMS[fruitId as keyof typeof PROCESSED_ITEMS];
  if (processedItem) {
    // Находим рецепт, который создает этот продукт
    const processingRecipe = PROCESSING_RECIPES.find(r => r.resultId === fruitId);
    if (processingRecipe) {
      // Вычисляем цену как 3x от стоимости ингредиентов (включая гибриды и синтезы)
      const getItemPrice = (id: string, type: 'seed' | 'fruit' | 'hybrid' | 'synthesis'): number => {
        if (type === 'seed') {
          const seed = SEEDS[id as keyof typeof SEEDS];
          if (seed) return seed.price;
          // Проверяем гибридные семена
          const hybridRecipe = HYBRID_RECIPES.find(r => r.resultSeedId === id);
          if (hybridRecipe) {
            return calculateHybridSeedPrice(hybridRecipe.ingredients);
          }
          return 0;
        } else if (type === 'fruit') {
          const fruit = FRUITS[id as keyof typeof FRUITS];
          if (fruit) return fruit.sellPrice;
          // Проверяем гибридные/синтезные/переработанные фрукты (но избегаем рекурсии)
          const hybridRecipe = HYBRID_RECIPES.find(r => r.resultFruitId === id);
          if (hybridRecipe) {
            return calculateHybridFruitPrice(hybridRecipe.ingredients);
          }
          const synthesisPlant = SYNTHESIS_PLANTS.find(p => p.id === id);
          if (synthesisPlant) {
            return synthesisPlant.sellPrice;
          }
          return 0;
        } else if (type === 'hybrid') {
          // Для гибридов берем цену фрукта
          const hybridRecipe = HYBRID_RECIPES.find(r => r.resultFruitId === id);
          if (hybridRecipe) {
            return calculateHybridFruitPrice(hybridRecipe.ingredients);
          }
          return 0;
        } else if (type === 'synthesis') {
          // Для синтеза берем цену фрукта
          const synthesisPlant = SYNTHESIS_PLANTS.find(p => p.id === id);
          if (synthesisPlant) {
            return synthesisPlant.sellPrice;
          }
          return 0;
        }
        return 0;
      };
      
      // Если sellPrice === -1, значит предмет нельзя продать
      if (processedItem.sellPrice === -1) {
        return {
          id: fruitId,
          name: processedItem.name,
          emoji: processedItem.emoji,
          sellPrice: -1 // Нельзя продать
        };
      }
      
      const calculatedPrice = calculateProcessedItemPrice(processingRecipe.ingredients, getItemPrice);
      
      return {
        id: fruitId,
        name: processedItem.name,
        emoji: processedItem.emoji,
        sellPrice: calculatedPrice
      };
    }
    
    // Если рецепт не найден, возвращаем базовую информацию (но цена будет 0)
    return {
      id: fruitId,
      name: processedItem.name,
      emoji: processedItem.emoji,
      sellPrice: 0
    };
  }
  
  return null;
}


