import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import { HYBRID_RECIPES, HybridRecipe } from '../data/hybrids';
import { SEEDS } from '../data/seeds';
import { FRUITS } from '../data/fruits';
import IngredientSelector from './IngredientSelector';

interface Props {
  game: ReturnType<typeof useGameLogic>;
}

export default function HybridCrafting({ game }: Props) {
  const { state, startCraft, completeCraft, getCraftProgress } = game;
  const [selectedRecipe, setSelectedRecipe] = useState<HybridRecipe | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<{ [key: number]: { id: string; count: number } }>({});
  const [showIngredientSelector, setShowIngredientSelector] = useState<{ index: number; ingredient: any } | null>(null);

  // Больше не сохраняем локально

  const craftProgress = getCraftProgress();

  // Ограничения по уровням для крафтов (тирам соответствует максимальная редкость ингредиентов)
  const rarityToTier: Record<string, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
  const allowedTierByLevel: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  const playerLevel = Math.min(Math.max(state.level, 1), 6);
  const allowedTier = allowedTierByLevel[playerLevel];

  const getIngredientTier = (ingredient: { id: string; type: 'seed'|'fruit' }) => {
    if (ingredient.type === 'seed') {
      const seed: any = SEEDS[ingredient.id as keyof typeof SEEDS];
      return rarityToTier[seed?.rarity || 'common'] || 1;
    }
    // Плоды — берём редкость исходного семени по связке FRUITS <- SEEDS
    // На практике рецепты чаще используют семена/плоды известных семян
    const seedFromFruit = Object.values(SEEDS).find((s) => s.fruitId === ingredient.id);
    return rarityToTier[seedFromFruit?.rarity || 'common'] || 1;
  };

  const getRecipeTier = (recipe: any) => {
    return Math.max(...recipe.ingredients.map((ing: any) => getIngredientTier(ing)));
  };

  // Проверяем завершение крафта
  useEffect(() => {
    if (craftProgress?.isComplete) {
      completeCraft();
    }
  }, [craftProgress, completeCraft]);

  const handleRecipeSelect = (recipe: HybridRecipe) => {
    setSelectedRecipe(recipe);
    setSelectedIngredients({});
  };

  const handleIngredientClick = (index: number, ingredient: any) => {
    setShowIngredientSelector({ index, ingredient });
  };

  const handleIngredientSelect = (itemId: string, count: number) => {
    if (showIngredientSelector) {
      setSelectedIngredients(prev => ({
        ...prev,
        [showIngredientSelector.index]: { id: itemId, count }
      }));
    }
  };

  const canCraft = () => {
    if (!selectedRecipe) return false;
    return selectedRecipe.ingredients.every((_, index) => selectedIngredients[index]);
  };

  const handleCraft = () => {
    if (!selectedRecipe || !canCraft()) return;
    
    const ingredients = selectedRecipe.ingredients.map((ingredient, index) => ({
      id: selectedIngredients[index].id,
      type: ingredient.type,
      count: selectedIngredients[index].count
    }));

    startCraft(selectedRecipe.id, ingredients);
    setSelectedRecipe(null);
    setSelectedIngredients({});
  };

  const getItemInfo = (id: string, type: 'seed' | 'fruit') => {
    if (type === 'seed') {
      return SEEDS[id as keyof typeof SEEDS];
    } else {
      return FRUITS[id as keyof typeof FRUITS];
    }
  };

  const getAvailableCount = (id: string, type: 'seed' | 'fruit') => {
    const item = state.inventory.find(i => i.id === id && i.type === type);
    return item ? item.count : 0;
  };

  if (craftProgress) {
    return (
      <div className="max-w-md mx-auto p-3 pb-24">
        <div className="text-xl font-bold mb-4 text-center">🔬 Создание гибрида</div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">{craftProgress.recipe.resultEmoji}</div>
            <div className="text-lg font-bold">{craftProgress.recipe.resultName}</div>
            <div className="text-sm text-gray-600">{craftProgress.recipe.description}</div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Прогресс</span>
              <span>{Math.round(craftProgress.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${craftProgress.progress}%` }}
              />
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            {craftProgress.timeLeft > 0 ? `Осталось: ${craftProgress.timeLeft} сек` : 'Завершено!'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-3 pb-24">
      <div className="text-xl font-bold mb-4 text-center">🔬 Создать гибрид</div>
      
      {!selectedRecipe ? (
        <div className="space-y-3">
          <div className="text-xs text-gray-600 mb-1">{playerLevel < 2 ? '🔒 Крафт доступен с 2 уровня' : `Доступные гибриды: до ${allowedTier} тира`}</div>
          {HYBRID_RECIPES.map((recipe) => {
            const tier = getRecipeTier(recipe);
            const locked = tier > allowedTier || playerLevel < 2;
            return (
            <div key={recipe.id} className={`p-3 rounded-2xl bg-white border border-gray-300 shadow-md ${locked ? 'opacity-70' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">{recipe.resultEmoji}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{recipe.resultName}</div>
                  <div className="text-xs text-gray-500">{recipe.description}</div>
                  <div className="text-xs text-green-600 mt-1">
                    Цена продажи: {recipe.sellPrice} $ECO
                  </div>
                </div>
                <button
                  onClick={() => !locked && handleRecipeSelect(recipe)}
                  disabled={locked}
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${locked ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  {locked ? `🔒 С ${Math.max(2, tier + 1 - 1)} уровня` : 'Выбрать'}
                </button>
              </div>
            </div>
            );})}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">{selectedRecipe.resultEmoji}</div>
              <div className="text-lg font-bold">{selectedRecipe.resultName}</div>
              <div className="text-sm text-gray-600">{selectedRecipe.description}</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Ингредиенты:</div>
              {selectedRecipe.ingredients.map((ingredient, index) => {
                const itemInfo = getItemInfo(ingredient.id, ingredient.type);
                const selected = selectedIngredients[index];
                const available = getAvailableCount(ingredient.id, ingredient.type);
                const displayEmoji = itemInfo?.emoji;
                
                return (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                    <div className="text-2xl">
                      {selected ? (
                        itemInfo?.emoji
                      ) : (
                        <div className="opacity-30">{displayEmoji || (ingredient.type === 'seed' ? '🌱' : '🍎')}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {selected ? itemInfo?.name : `${itemInfo?.name || ingredient.id} (нужно)`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Нужно: {ingredient.count} шт • В наличии: {available} шт
                      </div>
                    </div>
                    <button
                      onClick={() => handleIngredientClick(index, ingredient)}
                      disabled={available === 0}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        selected 
                          ? 'bg-green-500 text-white' 
                          : available > 0 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {selected ? '✓ Выбрано' : 'Выбрать'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
              >
                Назад
              </button>
              <button
                onClick={handleCraft}
                disabled={!canCraft()}
                className="flex-1 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {showIngredientSelector && (
        <IngredientSelector
          open={!!showIngredientSelector}
          ingredient={showIngredientSelector.ingredient}
          onClose={() => setShowIngredientSelector(null)}
          onSelect={handleIngredientSelect}
          game={game}
        />
      )}
    </div>
  );
}

