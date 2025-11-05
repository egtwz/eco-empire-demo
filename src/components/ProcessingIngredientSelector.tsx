import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import { HYBRID_RECIPES } from '../data/hybrids';
import { SYNTHESIS_PLANTS } from '../data/synthesis';
import { getSeedInfo, getFruitInfo } from '../utils/hybridUtils';

interface Props {
  open: boolean;
  ingredient: {
    id: string;
    type: 'seed' | 'fruit' | 'hybrid' | 'synthesis';
    count: number;
  } | null;
  onClose: () => void;
  onSelect: (itemId: string, count: number) => void;
  game: ReturnType<typeof useGameLogic>;
}

export default function ProcessingIngredientSelector({ open, ingredient, onClose, onSelect, game }: Props) {
  const { state } = game;
  const [selectedCount, setSelectedCount] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const availableItems = useMemo(() => {
    if (!ingredient) return [];
    
    // Для обычных seed/fruit ищем в инвентаре
    if (ingredient.type === 'seed' || ingredient.type === 'fruit') {
      const items = state.inventory.filter(item => 
        item.id === ingredient.id && 
        item.type === ingredient.type &&
        item.count > 0
      );
      return items;
    }
    
    // Для hybrid ищем гибридные семена/плоды
    if (ingredient.type === 'hybrid') {
      const hybridSeeds = state.inventory.filter(item => {
        if (item.type !== 'seed') return false;
        const recipe = HYBRID_RECIPES.find(r => r.resultSeedId === item.id);
        return recipe !== undefined;
      });
      
      const hybridFruits = state.inventory.filter(item => {
        if (item.type !== 'fruit') return false;
        const recipe = HYBRID_RECIPES.find(r => r.resultFruitId === item.id);
        return recipe !== undefined;
      });
      
      return [...hybridSeeds, ...hybridFruits];
    }
    
    // Для synthesis ищем синтезные растения
    if (ingredient.type === 'synthesis') {
      const synthesisItems = state.inventory.filter(item => {
        if (item.type !== 'fruit') return false;
        const plant = SYNTHESIS_PLANTS.find(p => p.id === item.id);
        return plant !== undefined;
      });
      return synthesisItems;
    }
    
    return [];
  }, [state.inventory, ingredient]);

  const getItemInfo = (item: any) => {
    if (ingredient?.type === 'seed' || ingredient?.type === 'fruit') {
      if (ingredient.type === 'seed') {
        const seed = getSeedInfo(item.id);
        return { name: seed?.name || item.name, emoji: seed?.emoji || item.emoji };
      } else {
        const fruit = getFruitInfo(item.id);
        return { name: fruit?.name || item.name, emoji: fruit?.emoji || item.emoji };
      }
    }
    
    if (ingredient?.type === 'hybrid') {
      if (item.type === 'seed') {
        const recipe = HYBRID_RECIPES.find(r => r.resultSeedId === item.id);
        return { name: recipe?.resultName || item.name, emoji: recipe?.resultEmoji || item.emoji };
      } else {
        const recipe = HYBRID_RECIPES.find(r => r.resultFruitId === item.id);
        return { name: recipe?.resultName || item.name, emoji: recipe?.resultEmoji || item.emoji };
      }
    }
    
    if (ingredient?.type === 'synthesis') {
      const plant = SYNTHESIS_PLANTS.find(p => p.id === item.id);
      return { name: plant?.name || item.name, emoji: plant?.emoji || item.emoji };
    }
    
    return { name: item.name, emoji: item.emoji };
  };

  const handleSelect = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  const handleAdd = () => {
    if (ingredient && selectedCount > 0 && selectedItemId) {
      onSelect(selectedItemId, selectedCount);
      setSelectedCount(1);
      setSelectedItemId(null);
      onClose();
    }
  };

  // Сбрасываем и выбираем первый предмет при открытии модалки
  useEffect(() => {
    if (!open) {
      setSelectedItemId(null);
      setSelectedCount(1);
    } else if (availableItems.length > 0 && !selectedItemId) {
      // При открытии выбираем первый доступный предмет
      setSelectedItemId(availableItems[0].id);
    }
  }, [open, availableItems, selectedItemId]);

  if (!ingredient) return null;

  const maxAvailable = availableItems.reduce((sum, item) => sum + item.count, 0);
  const maxSelectable = Math.min(ingredient.count, maxAvailable);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-400 to-sky-500 p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold">Выберите ингредиент</div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="text-lg font-semibold mb-2">
                {(() => {
                  if (ingredient.type === 'hybrid') {
                    return '🌺 Любой гибрид';
                  }
                  if (ingredient.type === 'synthesis') {
                    return '🧬 Любой синтез';
                  }
                  if (ingredient.type === 'seed') {
                    const seedInfo = getSeedInfo(ingredient.id);
                    return `${seedInfo?.emoji || '🌱'} ${seedInfo?.name || ingredient.id}`;
                  }
                  if (ingredient.type === 'fruit') {
                    const fruitInfo = getFruitInfo(ingredient.id);
                    return `${fruitInfo?.emoji || '🍎'} ${fruitInfo?.name || ingredient.id}`;
                  }
                  return 'Ингредиент';
                })()}
              </div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                Нужно: {ingredient.count} шт
              </div>
              <div className="text-xs text-gray-500">
                Доступно: {maxAvailable} шт
              </div>
              {ingredient.type === 'hybrid' && (
                <div className="mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium inline-block">
                  Специальный рецепт для гибридов
                </div>
              )}
              {ingredient.type === 'synthesis' && (
                <div className="mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium inline-block">
                  Специальный рецепт для синтезов
                </div>
              )}
            </div>

            {availableItems.length > 0 ? (
              <div className="space-y-3">
                {/* Список доступных предметов */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableItems.map((item) => {
                    const info = getItemInfo(item);
                    const canSelect = item.count > 0;
                    return (
                      <button
                        key={item.id}
                        onClick={() => canSelect && handleSelect(item.id)}
                        disabled={!canSelect}
                        className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                          selectedItemId === item.id
                            ? 'border-blue-500 bg-blue-50'
                            : canSelect
                            ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            : 'border-gray-100 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl">{info.emoji}</div>
                            <div>
                              <div className="font-medium text-sm">{info.name}</div>
                              <div className="text-xs text-gray-500">В наличии: {item.count} шт</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Выбор количества */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Количество</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max={maxSelectable}
                      value={selectedCount}
                      onChange={(e) => setSelectedCount(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="1"
                      max={maxSelectable}
                      value={selectedCount}
                      onChange={(e) => setSelectedCount(Math.max(1, Math.min(maxSelectable, parseInt(e.target.value) || 1)))}
                      className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-sm"
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-700">
                    Выбрано: {selectedCount} из {ingredient.count} необходимых
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={availableItems.length === 0 || selectedCount <= 0 || !selectedItemId}
                    className="flex-1 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <div className="text-sm font-medium mb-1">Нет подходящих предметов</div>
                <div className="text-xs">
                  {ingredient.type === 'hybrid' && 'Вам нужны гибридные семена или плоды'}
                  {ingredient.type === 'synthesis' && 'Вам нужны синтезные растения'}
                  {ingredient.type !== 'hybrid' && ingredient.type !== 'synthesis' && 'Вам нужен этот предмет в инвентаре'}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

