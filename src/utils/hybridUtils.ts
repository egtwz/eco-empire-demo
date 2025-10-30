import { SEEDS } from '../data/seeds';
import { FRUITS } from '../data/fruits';
import { HYBRID_RECIPES, calculateHybridSeedPrice, calculateHybridGrowTime, calculateHybridFruitPrice } from '../data/hybrids';

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

// Получение информации о фрукте (включая гибридные)
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
  
  return null;
}

