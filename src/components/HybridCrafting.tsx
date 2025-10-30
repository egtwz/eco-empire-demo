import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import { HYBRID_RECIPES, HybridRecipe, calculateHybridSeedPrice, calculateHybridGrowTime, calculateHybridFruitPrice } from '../data/hybrids';
import { SEEDS } from '../data/seeds';
import { FRUITS } from '../data/fruits';
import IngredientSelector from './IngredientSelector';
import CraftSuccessModal from './CraftSuccessModal';

interface Props {
  game: ReturnType<typeof useGameLogic>;
}

export default function HybridCrafting({ game }: Props) {
  const { state, startCraft, initCraftDraft, addIngredientToCraft, cancelCraftDraft } = game;
  const [selectedRecipe, setSelectedRecipe] = useState<HybridRecipe | null>(null);
  const [showIngredientSelector, setShowIngredientSelector] = useState<{ index: number; ingredient: any } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<{ name: string; emoji: string } | null>(null);

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

  const handleCloseSuccess = () => {
    setShowSuccessModal(null);
    setSelectedRecipe(null); // Возвращаемся к списку рецептов
  };

  const handleRecipeSelect = (recipe: HybridRecipe) => {
    setSelectedRecipe(recipe);
    // Создаём пустой черновик сразу при выборе рецепта
    initCraftDraft(recipe.id);
  };

  const handleIngredientClick = (index: number, ingredient: any) => {
    // Вычисляем оставшееся требуемое количество
    const addedIngredient = addedIngredients.find(ing => ing.index === index);
    const remainingCount = ingredient.count - (addedIngredient?.count || 0);
    
    setShowIngredientSelector({ 
      index, 
      ingredient: {
        ...ingredient,
        count: remainingCount // Передаем оставшееся количество, а не полное
      }
    });
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

    // Мгновенно крафтим
    startCraft(selectedRecipe.id, ingredients);
    
    // Показываем модальное окно успеха
    setShowSuccessModal({
      name: selectedRecipe.resultName,
      emoji: selectedRecipe.resultEmoji
    });
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
            const seedPrice = calculateHybridSeedPrice(recipe.ingredients);
            const growTime = calculateHybridGrowTime(recipe.ingredients);
            const fruitPrice = calculateHybridFruitPrice(recipe.ingredients);
            
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
                  <div className="text-xs text-gray-700 mt-1 flex gap-3">
                    <span>💰 Семя: {seedPrice} $ECO</span>
                    <span>⏱ Рост: {growTime}с</span>
                  </div>
                  <div className="text-xs text-green-600 mt-0.5">
                    🍎 Фрукт продается за: {fruitPrice} $ECO
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
                
                // Проверяем оставшееся количество в инвентаре (с учетом уже добавленных)
                const available = getAvailableCount(ingredient.id, ingredient.type);
                const remainingNeeded = ingredient.count - (addedIngredient?.count || 0);
                const canAddMore = available > 0 && remainingNeeded > 0;
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
                      <div className={`text-xs ${addedIngredient ? (remainingNeeded === 0 ? 'text-green-600' : 'text-orange-600') : 'text-gray-500'}`}>
                        {addedIngredient 
                          ? (remainingNeeded === 0 ? '✓ Полностью добавлено' : `⚠ Нужно ещё ${remainingNeeded} шт (в наличии: ${available})`)
                          : `В наличии: ${available} шт`
                        }
                      </div>
                    </div>
                    <button
                      onClick={() => handleIngredientClick(index, ingredient)}
                      disabled={!canAddMore}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        remainingNeeded === 0
                          ? 'bg-green-500 text-white cursor-default' 
                          : canAddMore 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {remainingNeeded === 0 ? '✓ Готово' : 'Выбрать'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Отменить
              </button>
              <button
                onClick={handleCraft}
                disabled={!canCraft()}
                className={`flex-1 py-2 rounded-xl font-medium text-white ${
                  canCraft() 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Начать крафт
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

      {showSuccessModal && (
        <CraftSuccessModal
          open={!!showSuccessModal}
          resultName={showSuccessModal.name}
          resultEmoji={showSuccessModal.emoji}
          onClose={handleCloseSuccess}
        />
      )}
    </div>
  );
}

