import { useState, useEffect } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { HYBRID_RECIPES, HybridRecipe } from '../data/hybrids';
import IngredientSelector from './IngredientSelector';
import CraftSuccessModal from './CraftSuccessModal';

interface Props {
  game: ReturnType<typeof useGameLogic>;
}

export default function HybridCrafting({ game }: Props) {
  const { state, startCraft, initCraftDraft, addIngredientToCraft, cancelCraftDraft } = game;
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
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

  // Фильтруем рецепты по выбранному тиру
  const tierRecipes = HYBRID_RECIPES.filter(r => r.tier === selectedTier);
  
  // Проверяем доступность тира для игрока
  const isTierLocked = (tier: number) => {
    if (tier === 1) return state.level < 2; // Тир 1 доступен с уровня 2
    return state.level < tier; // Тир 2 с уровня 2, тир 3 с уровня 3, и т.д.
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
      return state.inventory.find(i => i.id === id && i.type === type);
    } else {
      return state.inventory.find(i => i.id === id && i.type === type);
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

  const getTierColor = (tier: number) => {
    const colors = {
      1: 'bg-gray-100 text-gray-700 border-gray-300',
      2: 'bg-green-50 text-green-700 border-green-300',
      3: 'bg-blue-50 text-blue-700 border-blue-300',
      4: 'bg-purple-50 text-purple-700 border-purple-300',
      5: 'bg-orange-50 text-orange-700 border-orange-300',
      6: 'bg-red-50 text-red-700 border-red-300'
    };
    return colors[tier as keyof typeof colors] || colors[1];
  };

  const getTierActiveColor = (tier: number) => {
    const colors = {
      1: 'bg-gray-500 text-white border-gray-700',
      2: 'bg-green-500 text-white border-green-700',
      3: 'bg-blue-500 text-white border-blue-700',
      4: 'bg-purple-500 text-white border-purple-700',
      5: 'bg-orange-500 text-white border-orange-700',
      6: 'bg-red-500 text-white border-red-700'
    };
    return colors[tier as keyof typeof colors] || colors[1];
  };

  return (
    <div className="max-w-md mx-auto p-3 pb-24">
      <div className="text-xl font-bold mb-4 text-center">🔬 Создать гибрид</div>
      
      {!selectedRecipe ? (
        <div className="space-y-3">
          {/* Вкладки тиров */}
          <div className="grid grid-cols-6 gap-1 mb-3">
            {[1, 2, 3, 4, 5, 6].map((tier) => {
              const locked = isTierLocked(tier);
              const isActive = selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => !locked && setSelectedTier(tier as any)}
                  disabled={locked}
                  className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                    locked 
                      ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                      : isActive
                        ? getTierActiveColor(tier)
                        : getTierColor(tier) + ' hover:opacity-80'
                  }`}
                >
                  {locked ? '🔒' : `T${tier}`}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-center text-gray-600 mb-2">
            {isTierLocked(selectedTier) 
              ? `🔒 Тир ${selectedTier} доступен с ${selectedTier === 1 ? 2 : selectedTier} уровня` 
              : `Тир ${selectedTier} • ${tierRecipes.length} рецептов`
            }
          </div>

          {tierRecipes.map((recipe) => {
            const locked = recipe.requiredLevel > state.level;
            const seedPrice = 0; // Placeholder, actual calculation removed
            const growTime = 0; // Placeholder, actual calculation removed
            const fruitPrice = 0; // Placeholder, actual calculation removed
            
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
                    <span>🌱 Семя: {seedPrice} $ECO</span>
                    <span>⏱ Рост: {growTime}с</span>
                  </div>
                  <div className="text-xs text-green-600 mt-0.5">
                    🍎 Фрукт: {fruitPrice} $ECO
                  </div>
                </div>
                <button
                  onClick={() => !locked && handleRecipeSelect(recipe)}
                  disabled={locked}
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${locked ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  {locked ? `🔒 ${recipe.requiredLevel} ур` : 'Выбрать'}
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

