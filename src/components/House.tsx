import { useState, useMemo } from 'react';
import { useGameLogic, GameState } from '../hooks/useGameLogic';
import { BUILDINGS, BuildingId, getBuildingPrice } from '../data/buildings';
import { getRecipesForBuilding, getRecipeById, ProcessingRecipe } from '../data/processing';
import ProcessingIngredientSelector from './ProcessingIngredientSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { getSeedInfo, getFruitInfo } from '../utils/hybridUtils';

export default function House({ game }: { game: ReturnType<typeof useGameLogic> }) {
  const { 
    state, 
    buyBuilding, 
    expandHouse, 
    getHouseExpansionCost,
    initProcessingDraft,
    addIngredientToProcessing,
    cancelProcessingDraft,
    startProcessing,
    collectProcessing,
    getProcessingProgress,
    sellBuilding,
  } = game;

  const houseSize = state.houseSize || 2;
  const houseGrid = state.houseGrid || [];
  const expansionCost = getHouseExpansionCost();
  
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showIngredientSelector, setShowIngredientSelector] = useState<{ index: number; ingredient: any } | null>(null);

  // Создаем сетку позиций
  const gridPositions = useMemo(() => {
    const positions: Array<{ position: number; building: typeof houseGrid[0] | null }> = [];
    for (let i = 0; i < houseSize * houseSize; i++) {
      const building = houseGrid.find(b => b.position === i);
      positions.push({ position: i, building: building || null });
    }
    return positions;
  }, [houseSize, houseGrid]);

  const handleCellClick = (position: number) => {
    const building = houseGrid.find(b => b.position === position);
    if (building) {
      // Открываем модалку здания с рецептами
      setSelectedPosition(position);
      setShowRecipeModal(true);
    } else {
      // Открываем модалку выбора здания для покупки
      setSelectedPosition(position);
      setShowBuildingModal(true);
    }
  };


  const handleBuyBuilding = (buildingType: BuildingId) => {
    if (selectedPosition !== null) {
      buyBuilding(buildingType, selectedPosition);
      setShowBuildingModal(false);
      setSelectedPosition(null);
    }
  };

  // Получаем черновик для выбранной постройки
  const getDraftForPosition = useMemo(() => {
    if (selectedPosition === null) return null;
    return state.processingDrafts?.[selectedPosition] || null;
  }, [selectedPosition, state.processingDrafts]);

  const selectedRecipe = useMemo(() => {
    const draft = getDraftForPosition;
    if (!draft) return null;
    return getRecipeById(draft.recipeId) || null;
  }, [getDraftForPosition]);

  const addedIngredients = getDraftForPosition?.addedIngredients || [];

  const handleStartRecipe = (recipeId: string) => {
    if (selectedPosition !== null) {
      initProcessingDraft(selectedPosition, recipeId);
      // Модалка остается открытой для выбора ингредиентов
    }
  };

  const handleIngredientClick = (index: number, ingredient: any) => {
    const addedIngredient = addedIngredients.find(ing => ing.index === index);
    const remainingCount = ingredient.count - (addedIngredient?.count || 0);
    
    setShowIngredientSelector({ 
      index, 
      ingredient: {
        ...ingredient,
        count: remainingCount
      }
    });
  };

  const handleIngredientSelect = (itemId: string, count: number) => {
    if (showIngredientSelector && selectedPosition !== null && selectedRecipe) {
      addIngredientToProcessing(
        selectedPosition,
        selectedRecipe.id,
        showIngredientSelector.index,
        itemId,
        showIngredientSelector.ingredient.type,
        count
      );
      setShowIngredientSelector(null);
    }
  };

  const handleCancelDraft = () => {
    if (selectedPosition !== null) {
      cancelProcessingDraft(selectedPosition);
    }
  };

  const canStartProcessing = () => {
    if (!selectedRecipe || selectedPosition === null) return false;
    
    return selectedRecipe.ingredients.every((ingredient, index) => {
      const addedIngredient = addedIngredients.find(ing => ing.index === index);
      return addedIngredient && addedIngredient.count >= ingredient.count;
    });
  };

  const handleStartProcessing = () => {
    if (selectedPosition !== null && canStartProcessing()) {
      startProcessing(selectedPosition);
      setShowRecipeModal(false);
      setSelectedPosition(null);
    }
  };

  return (
    <div className="max-w-md mx-auto px-3 pt-0 pb-24">
      {/* Сетка зданий */}
      <div className="w-full -mt-2 mb-4">
        <div 
          className="grid gap-2"
          style={{ 
            gridTemplateColumns: `repeat(${houseSize}, 1fr)`,
            width: '100%'
          }}
        >
          {gridPositions.map(({ position, building }) => {
            const processingProgress = building?.processing ? getProcessingProgress(position) : null;
            const buildingDef = building ? BUILDINGS[building.buildingType as BuildingId] : null;
            
            return (
              <div
                key={position}
                onClick={() => handleCellClick(position)}
                className={`
                  aspect-square border-2 rounded-lg cursor-pointer transition-all min-w-0
                  ${building 
                    ? 'bg-gray-100 border-gray-300 hover:border-gray-400' 
                    : 'bg-gray-50 border-dashed border-gray-300 hover:border-gray-400'
                  }
                `}
              >
                {building ? (
                  <div className="h-full flex flex-col items-center justify-center p-1">
                    <div className="text-lg mb-0.5">{buildingDef?.emoji || '🏢'}</div>
                    {processingProgress && (
                      <div className="mt-1 w-full px-0.5">
                        {processingProgress.isReady ? (
                          <div className="text-[9px] text-green-600 font-bold">✓</div>
                        ) : (
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full transition-all"
                              style={{ width: `${processingProgress.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xl">
                    +
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Кнопка расширения внизу */}
      {expansionCost !== null && (
        <div className="mt-4 text-center">
          <button
            onClick={expandHouse}
            disabled={state.balance < expansionCost}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Расширить дом ({expansionCost.toLocaleString()} $ECO)
          </button>
        </div>
      )}

      {/* Модалка выбора здания */}
      <AnimatePresence>
        {showBuildingModal && selectedPosition !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4"
            onClick={() => {
              setShowBuildingModal(false);
              setSelectedPosition(null);
            }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[70vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Выберите здание</h2>
                  <button
                    onClick={() => {
                      setShowBuildingModal(false);
                      setSelectedPosition(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="px-6 pb-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(BUILDINGS).map((building) => {
                    const existingCount = houseGrid.filter(b => b.buildingType === building.id).length;
                    const price = getBuildingPrice(building.id, existingCount);
                    const canAfford = state.balance >= price;

                    return (
                      <button
                        key={building.id}
                        onClick={() => handleBuyBuilding(building.id)}
                        disabled={!canAfford}
                        className={`
                          p-3 border-2 rounded-lg text-left transition-all
                          ${canAfford
                            ? 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                            : 'border-gray-200 opacity-50 cursor-not-allowed'
                          }
                        `}
                      >
                        <div className="text-2xl mb-1">{building.emoji}</div>
                        <div className="font-medium text-sm">{building.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {price.toLocaleString()} $ECO
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалка рецептов здания */}
      <AnimatePresence>
        {showRecipeModal && selectedPosition !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-3"
            onClick={() => {
              setShowRecipeModal(false);
              setSelectedPosition(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="bg-white rounded-2xl shadow-md max-w-sm w-full max-h-[66vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Рецепты</h2>
                  <button
                    onClick={() => {
                      setShowRecipeModal(false);
                      setSelectedPosition(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4 pt-0 overflow-y-auto">
                {selectedPosition !== null && (
                  <BuildingRecipesList
                    position={selectedPosition}
                    houseGrid={houseGrid}
                    onStartRecipe={handleStartRecipe}
                    getProcessingProgress={getProcessingProgress}
                    collectProcessing={collectProcessing}
                    selectedRecipe={selectedRecipe}
                    addedIngredients={addedIngredients}
                    onIngredientClick={handleIngredientClick}
                    onCancel={handleCancelDraft}
                    onStartProcessing={handleStartProcessing}
                    canStartProcessing={canStartProcessing()}
                    onSellBuilding={() => {
                      if (selectedPosition !== null) {
                        sellBuilding(selectedPosition);
                        setShowRecipeModal(false);
                        setSelectedPosition(null);
                      }
                    }}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалка выбора ингредиентов */}
      <ProcessingIngredientSelector
        open={showIngredientSelector !== null}
        ingredient={showIngredientSelector?.ingredient || null}
        onClose={() => setShowIngredientSelector(null)}
        onSelect={handleIngredientSelect}
        game={game}
      />

    </div>
  );
}

function BuildingRecipesList({
  position,
  houseGrid,
  onStartRecipe,
  getProcessingProgress,
  collectProcessing,
  selectedRecipe,
  addedIngredients,
  onIngredientClick,
  onCancel,
  onStartProcessing,
  canStartProcessing,
  onSellBuilding,
}: {
  position: number;
  houseGrid: GameState['houseGrid'];
  onStartRecipe: (recipeId: string) => void;
  getProcessingProgress: (position: number) => { progress: number; remaining: number; isReady: boolean } | null;
  collectProcessing: (position: number) => void;
  selectedRecipe: ProcessingRecipe | null;
  addedIngredients: Array<{ index: number; id: string; type: 'seed' | 'fruit' | 'hybrid' | 'synthesis'; count: number }>;
  onIngredientClick: (index: number, ingredient: any) => void;
  onCancel: () => void;
  onStartProcessing: () => void;
  canStartProcessing: boolean;
  onSellBuilding: () => void;
}) {
  const building = houseGrid?.find(b => b.position === position);
  if (!building) return null;

  const buildingType = building.buildingType as BuildingId;
  const buildingDef = BUILDINGS[buildingType];
  const recipes = getRecipesForBuilding(buildingType);
  const processingProgress = building.processing ? getProcessingProgress(position) : null;
  const isProcessing = building.processing !== null;
  const isReady = processingProgress?.isReady || false;
  const sellPrice = building.purchasePrice ? Math.floor(building.purchasePrice * 0.5) : 0;

  return (
    <div className="space-y-3">
      {/* Информация о здании */}
      <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{buildingDef?.emoji}</span>
          <span className="font-semibold">{buildingDef?.name}</span>
        </div>
        {isProcessing && (
          <div className="text-xs text-gray-500 mt-2">
            Здание занято обработкой. Продажа недоступна.
          </div>
        )}
      </div>
      {isProcessing && (
        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="font-semibold mb-2">Текущий рецепт:</div>
          {building.processing && (
            <>
              <div className="text-sm">
                {(() => {
                  const recipe = getRecipeById(building.processing.recipeId);
                  return recipe ? `${recipe.emoji} ${recipe.name}` : 'Неизвестный рецепт';
                })()}
              </div>
              {isReady ? (
                <button
                  onClick={() => collectProcessing(position)}
                  className="mt-3 w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                >
                  Собрать готовый продукт
                </button>
              ) : processingProgress && (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">
                    Осталось: {Math.ceil(processingProgress.remaining / 1000)}с
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${processingProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Рецепт запущен, отмена недоступна
              </div>
            </>
          )}
        </div>
      )}
      
      {!isProcessing && !selectedRecipe && (
        <>
          <div className="font-semibold mb-2">Доступные рецепты:</div>
          <div className="space-y-2">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onStartRecipe(recipe.id)}
                className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                  recipe.isSpecial
                    ? 'border-purple-300 hover:border-purple-500 hover:bg-purple-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{recipe.emoji} {recipe.name}</span>
                      {recipe.isSpecial && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          Специальный
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{recipe.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Время: {Math.floor(recipe.processingSeconds / 60)} мин
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {!isProcessing && selectedRecipe && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Рецепт: {selectedRecipe.emoji} {selectedRecipe.name}</div>
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Отменить
            </button>
          </div>

          <div className="space-y-2">
            {selectedRecipe.ingredients.map((ingredient, index) => {
              const addedIngredient = addedIngredients.find(ai => ai.index === index);
              const addedCount = addedIngredient?.count || 0;
              const remaining = ingredient.count - addedCount;
              const isComplete = remaining <= 0;

              return (
                <button
                  key={index}
                  onClick={() => !isComplete && onIngredientClick(index, ingredient)}
                  disabled={isComplete}
                  className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                    isComplete
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {(() => {
                          if (ingredient.type === 'hybrid') {
                            // Проверяем, это семя или плод гибрида
                            const seedInfo = getSeedInfo(ingredient.id);
                            if (seedInfo) {
                              return `${seedInfo.emoji || '🌱'} ${seedInfo.name || ingredient.id}`;
                            }
                            const fruitInfo = getFruitInfo(ingredient.id);
                            if (fruitInfo) {
                              return `${fruitInfo.emoji || '🍎'} ${fruitInfo.name || ingredient.id}`;
                            }
                            return `🌺 ${ingredient.id}`;
                          }
                          if (ingredient.type === 'synthesis') {
                            const fruitInfo = getFruitInfo(ingredient.id);
                            if (fruitInfo) {
                              return `${fruitInfo.emoji || '🧬'} ${fruitInfo.name || ingredient.id}`;
                            }
                            return `🧬 ${ingredient.id}`;
                          }
                          if (ingredient.type === 'seed') {
                            const seedInfo = getSeedInfo(ingredient.id);
                            return `${seedInfo?.emoji || '🌱'} ${seedInfo?.name || ingredient.id}`;
                          }
                          if (ingredient.type === 'fruit') {
                            const fruitInfo = getFruitInfo(ingredient.id);
                            return `${fruitInfo?.emoji || '🍎'} ${fruitInfo?.name || ingredient.id}`;
                          }
                          return `Ингредиент ${index + 1}`;
                        })()}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Нужно: {ingredient.count} шт
                      </div>
                      <div className={`text-xs mt-1 ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
                        Добавлено: {addedCount} / {ingredient.count}
                        {isComplete && ' ✓'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {canStartProcessing && (
            <button
              onClick={onStartProcessing}
              className="w-full mt-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Начать переработку
            </button>
          )}
        </div>
      )}
      
      {/* Кнопка продажи здания в конце модалки */}
      <div className="pt-3 mt-3 border-t-2 border-gray-200">
        <button
          onClick={onSellBuilding}
          disabled={isProcessing}
          className={`w-full py-3 text-sm rounded-lg font-medium transition-all ${
            isProcessing
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
          title={isProcessing ? 'Нельзя продать здание во время обработки' : `Продать за ${sellPrice.toLocaleString()} $ECO (50% от цены покупки)`}
        >
          💰 Продать здание ({sellPrice.toLocaleString()} $ECO)
        </button>
      </div>
    </div>
  );
}

