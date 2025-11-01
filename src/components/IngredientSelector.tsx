import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import { SEEDS } from '../data/seeds';
import { FRUITS } from '../data/fruits';

interface Props {
  open: boolean;
  ingredient: {
    id: string;
    type: 'seed' | 'fruit';
    count: number;
  } | null;
  onClose: () => void;
  onSelect: (itemId: string, count: number) => void;
}

export default function IngredientSelector({ open, ingredient, onClose, onSelect, game }: Props & { game: ReturnType<typeof useGameLogic> }) {
  const { state } = game;
  const [selectedCount, setSelectedCount] = useState(1);

  const availableItems = useMemo(() => {
    if (!ingredient) return [];
    
    // Найти точный предмет в инвентаре
    const item = state.inventory.find(item => 
      item.id === ingredient.id && 
      item.type === ingredient.type
    );
    
    return item && item.count > 0 ? [item] : [];
  }, [state.inventory, ingredient]);

  const getRequiredItemName = () => {
    if (!ingredient) return '';
    
    if (ingredient.type === 'seed') {
      const seed = SEEDS[ingredient.id as keyof typeof SEEDS];
      return seed ? seed.name : ingredient.id;
    } else {
      const fruit = FRUITS[ingredient.id as keyof typeof FRUITS];
      return fruit ? fruit.name : ingredient.id;
    }
  };

  const handleSelect = () => {
    if (ingredient && selectedCount > 0) {
      onSelect(ingredient.id, selectedCount);
      setSelectedCount(1);
      onClose();
    }
  };

  if (!ingredient) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg max-h-[80vh] overflow-y-auto"
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
              <div className="text-4xl mb-2">{availableItems[0]?.emoji || '❓'}</div>
              <div className="text-sm font-medium">{availableItems[0]?.name || 'Неизвестный предмет'}</div>
              <div className="text-xs text-gray-500">
                Нужно: {ingredient.count} шт • В наличии: {availableItems[0]?.count || 0} шт
              </div>
            </div>

            {availableItems.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Количество</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max={Math.min(ingredient.count, availableItems[0].count)}
                      value={selectedCount}
                      onChange={(e) => setSelectedCount(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="1"
                      max={Math.min(ingredient.count, availableItems[0].count)}
                      value={selectedCount}
                      onChange={(e) => setSelectedCount(Math.max(1, Math.min(ingredient.count, parseInt(e.target.value) || 1)))}
                      className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-sm"
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-700">
                    Выбранные предметы: {selectedCount} из {ingredient.count} необходимых
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
                    onClick={handleSelect}
                    disabled={selectedCount <= 0}
                    className="flex-1 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 font-medium"
                  >
                    Выбрать
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <div className="text-sm font-medium mb-1">Нет подходящих предметов</div>
                <div className="text-xs">Вам нужно: {getRequiredItemName()}</div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

