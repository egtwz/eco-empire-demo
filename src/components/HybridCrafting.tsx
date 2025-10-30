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
  const { state, startCraft, completeCraft, getCraftProgress, initCraftDraft, addIngredientToCraft, cancelCraftDraft } = game;
  const [selectedRecipe, setSelectedRecipe] = useState<HybridRecipe | null>(null);
  const [showIngredientSelector, setShowIngredientSelector] = useState<{ index: number; ingredient: any } | null>(null);

  // Восстанавливаем черновик только при первой загрузке компонента
  useEffect(() => {
    if (state.craftDraft && !selectedRecipe) {
      const recipe = HYBRID_RECIPES.find(r => r.id === state.craftDraft!.recipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
      }
    }
  }, []); // Пустой массив зависимостей - выполняется только один раз при монтировании

  // Получаем добавленные ингредиенты из черновика
  const addedIngredients = state.craftDraft?.addedIngredients || [];

  const craftProgress = getCraftProgress();

  // Защита от белого экрана - если нет прогресса и нет выбранного рецепта, сбрасываем черновик
  useEffect(() => {
    if (!craftProgress && !selectedRecipe && state.craftDraft) {
      // Если есть черновик, но нет активного крафта и выбранного рецепта - восстанавливаем
      const recipe = HYBRID_RECIPES.find(r => r.id === state.craftDraft!.recipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
      }
    }
  }, [craftProgress, selectedRecipe, state.craftDraft]);

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

  // Обработчик завершения крафта
  const handleCompleteCraft = () => {
    completeCraft();
    setSelectedRecipe(null); // Возвращаемся к списку рецептов
  };

  const handleRecipeSelect = (recipe: HybridRecipe) => {
    setSelectedRecipe(recipe);
    // Создаём пустой черновик сразу при выборе рецепта
    initCraftDraft(recipe.id);
  };

  const handleIngredientClick = (index: number, ingredient: any) => {
    setShowIngredientSelector({ index, ingredient });
  };

  const handleIngredientSelect = (itemId: string, count: number) => {
    if (showIngredientSelector && selectedRecipe) {
      addIngredientToCraft(
        selectedRecipe.id,
        showIngredientSelector.index,
        itemId,
        showIngredientSelector.ingredient.type,
        count
      );
      setShowIngredientSelector(null);
    }
  };

  const handleCancel = () => {
    cancelCraftDraft();
    setSelectedRecipe(null);
  };

  const canCraft = () => {
    if (!selectedRecipe) return false;
    return selectedRecipe.ingredients.every((ingredient, index) => {
      const addedIngredient = addedIngredients.find(ing => ing.index === index);
      // Проверяем что ингредиент добавлен И количество совпадает с требуемым
      return addedIngredient && addedIngredient.count === ingredient.count;
    });
  };

  const handleCraft = () => {
    if (!selectedRecipe || !canCraft()) return;
    
    const ingredients = addedIngredients.map(ing => ({
      id: ing.id,
      type: ing.type,
      count: ing.count
    }));

    startCraft(selectedRecipe.id, ingredients);
    // НЕ очищаем selectedRecipe - показываем прогресс крафта
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

  const getRarityBorderColor = (rarity: string) => {
    const colors = {
      common: '#9CA3AF',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#A855F7',
      legendary: '#F59E0B'
    };
    return colors[rarity as keyof typeof colors] || '#9CA3AF';
  };

  const getRarityOrder = (rarity: string) => {
    const order = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5
    };
    return order[rarity as keyof typeof order] || 0;
  };

  // Сортируем рецепты по редкости
  const sortedRecipes = [...HYBRID_RECIPES].sort((a, b) => getRarityOrder(a.rarity) - getRarityOrder(b.rarity));

  return (
    <div className="max-w-md mx-auto p-3 pb-24">
      <div className="text-xl font-bold mb-4 text-center">🔬 Создать гибрид</div>
      
      {!selectedRecipe ? (
        <div className="space-y-3">
          <div className="text-xs text-gray-600 mb-1">{playerLevel < 2 ? '🔒 Крафт доступен с 2 уровня' : `Доступные гибриды: до ${allowedTier} тира`}</div>
          {sortedRecipes.map((recipe) => {
            const tier = getRecipeTier(recipe);
            const locked = tier > allowedTier || playerLevel < 2;
            return (
            <div key={recipe.id} className={`p-3 rounded-2xl bg-white border border-gray-300 shadow-md ${locked ? 'opacity-70' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">{recipe.resultEmoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: getRarityBorderColor(recipe.rarity) }}
                    >
                      {recipe.resultName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{recipe.description}</div>
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
              <span
                className="inline-block px-3 py-1 rounded-lg text-lg font-bold text-white"
                style={{ backgroundColor: getRarityBorderColor(selectedRecipe.rarity) }}
              >
                {selectedRecipe.resultName}
              </span>
              <div className="text-sm text-gray-600 mt-2">{selectedRecipe.description}</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Ингредиенты:</div>
              {selectedRecipe.ingredients.map((ingredient, index) => {
                const itemInfo = getItemInfo(ingredient.id, ingredient.type);
                const addedIngredient = addedIngredients.find(ing => ing.index === index);
                const addedItemInfo = addedIngredient ? getItemInfo(addedIngredient.id, addedIngredient.type) : null;
                
                // Если ингредиент УЖЕ добавлен, не проверяем наличие (его уже нет в инвентаре)
                // Если НЕ добавлен, проверяем наличие в инвентаре
                const available = addedIngredient ? 0 : getAvailableCount(ingredient.id, ingredient.type);
                const displayEmoji = itemInfo?.emoji;
                
                return (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                    <div className="text-2xl">
                      {addedIngredient ? (
                        addedItemInfo?.emoji
                      ) : (
                        <div className="opacity-30">{displayEmoji || (ingredient.type === 'seed' ? '🌱' : '🍎')}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {addedIngredient 
                          ? `${addedItemInfo?.name} (${addedIngredient.count}/${ingredient.count} шт)` 
                          : `${itemInfo?.name || ingredient.id} (нужно ${ingredient.count} шт)`
                        }
                      </div>
                      <div className={`text-xs ${addedIngredient ? (addedIngredient.count === ingredient.count ? 'text-green-600' : 'text-orange-600') : 'text-gray-500'}`}>
                        {addedIngredient 
                          ? (addedIngredient.count === ingredient.count ? '✓ Полностью добавлено' : `⚠ Нужно ещё ${ingredient.count - addedIngredient.count} шт`)
                          : `В наличии: ${available} шт`
                        }
                      </div>
                    </div>
                    <button
                      onClick={() => handleIngredientClick(index, ingredient)}
                      disabled={(addedIngredient && addedIngredient.count === ingredient.count) || available === 0 || !!craftProgress}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        addedIngredient 
                          ? (addedIngredient.count === ingredient.count 
                              ? 'bg-green-500 text-white cursor-default' 
                              : 'bg-blue-500 text-white hover:bg-blue-600')
                          : available > 0 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {addedIngredient 
                        ? (addedIngredient.count === ingredient.count ? '✓ Готово' : 'Выбрать')
                        : 'Выбрать'
                      }
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Прогресс бар если крафт начат */}
            {craftProgress && (
              <div className="mt-4">
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Прогресс крафта</span>
                    <span className="font-semibold text-blue-600">{Math.round(craftProgress.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${craftProgress.progress}%` }}
                    />
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600 mb-3">
                  {craftProgress.timeLeft > 0 ? `Осталось: ${craftProgress.timeLeft} сек` : '✅ Готово!'}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCancel}
                disabled={!!craftProgress}
                className={`flex-1 py-2 rounded-xl font-medium ${
                  craftProgress 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Отменить
              </button>
              <button
                onClick={craftProgress?.isComplete ? handleCompleteCraft : handleCraft}
                disabled={craftProgress ? !craftProgress.isComplete : !canCraft()}
                className={`flex-1 py-2 rounded-xl font-medium text-white ${
                  craftProgress 
                    ? (craftProgress.isComplete 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-gray-400 cursor-not-allowed')
                    : (canCraft() 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-gray-400 cursor-not-allowed')
                }`}
              >
                {craftProgress 
                  ? (craftProgress.isComplete ? 'Забрать' : `Крафтится... ${craftProgress.timeLeft} сек`)
                  : 'Начать крафт'
                }
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

