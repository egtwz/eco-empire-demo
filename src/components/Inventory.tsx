import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import { RARITY_COLORS } from '../data/seeds';
import { getFruitInfo } from '../utils/hybridUtils';
import ItemActionModal from './ItemActionModal';
import HybridCrafting from './HybridCrafting';

type FilterBy = 'all' | 'seeds' | 'fruits' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type Tab = 'inventory' | 'crafting';

export default function Inventory({ game }: { game: ReturnType<typeof useGameLogic> }) {
  const { state, sellFruit } = game;
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; emoji: string; count: number; type: 'seed' | 'fruit' | 'booster' } | null>(null);
  const [showSellAllModal, setShowSellAllModal] = useState(false);

  const filteredInventory = useMemo(() => {
    let items = [...state.inventory];
    
    switch (filterBy) {
      case 'seeds':
        items = items.filter(item => item.type === 'seed');
        break;
      case 'fruits':
        items = items.filter(item => item.type === 'fruit');
        break;
      case 'common':
      case 'uncommon':
      case 'rare':
      case 'epic':
      case 'legendary':
        items = items.filter(item => (item as any).rarity === filterBy);
        break;
      default:
        // 'all' - показываем все
        break;
    }
    
    // Сортируем по редкости, затем по типу
    const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
    return items.sort((a, b) => {
      const aRarity = (a as any).rarity || 'common';
      const bRarity = (b as any).rarity || 'common';
      const rarityDiff = rarityOrder[bRarity as keyof typeof rarityOrder] - rarityOrder[aRarity as keyof typeof rarityOrder];
      if (rarityDiff !== 0) return rarityDiff;
      return a.type.localeCompare(b.type);
    });
  }, [state.inventory, filterBy]);

  const getRarityColor = (rarity: string) => {
    return RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || '#9CA3AF';
  };

  const getRarityName = (rarity: string) => {
    const names = {
      common: 'Обычная',
      uncommon: 'Необычная',
      rare: 'Редкая',
      epic: 'Эпическая',
      legendary: 'Легендарная'
    };
    return names[rarity as keyof typeof names] || 'Неизвестная';
  };

  const handleItemClick = (item: any) => {
    setSelectedItem({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      count: item.count,
      type: item.type
    });
  };

  const handleSellAllFruits = () => {
    const fruits = state.inventory.filter(item => item.type === 'fruit');
    let totalIncome = 0;
    
    fruits.forEach(fruit => {
      const fruitDef = getFruitInfo(fruit.id);
      if (fruitDef) {
        totalIncome += fruitDef.sellPrice * fruit.count;
        sellFruit(fruit.id, fruit.count);
      }
    });
    
    setShowSellAllModal(false);
  };

  const getTotalFruitValue = () => {
    const fruits = state.inventory.filter(item => item.type === 'fruit');
    return fruits.reduce((total, fruit) => {
      const fruitDef = getFruitInfo(fruit.id);
      return total + (fruitDef ? fruitDef.sellPrice * fruit.count : 0);
    }, 0);
  };

  return (
    <div className="max-w-md mx-auto p-3 pb-24">
      {/* Вкладки */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
            activeTab === 'inventory' 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-700 shadow-md' 
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          }`}
        >
          <div className="text-lg mb-1">🎒</div>
          <div className="text-xs">Инвентарь</div>
        </button>
        <button
          onClick={() => {
            if (game.state.level < 2) {
              alert('🔒 Раздел доступен с 2 уровня');
              return;
            }
            setActiveTab('crafting');
          }}
          disabled={game.state.level < 2}
          className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
            activeTab === 'crafting' 
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-700 shadow-md' 
              : game.state.level < 2 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          }`}
        >
          <div className="text-lg mb-1">{game.state.level < 2 ? '🔒' : '🔬'}</div>
          <div className="text-xs">Создать гибрид</div>
        </button>
      </div>
      {game.state.level < 2 && (
        <div className="text-center text-xs text-gray-500 mb-3">
          🔒 Раздел "Создать гибрид" доступен с 2 уровня
        </div>
      )}

      {activeTab === 'inventory' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-bold">🎒 Инвентарь</div>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterBy)}
              className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm"
            >
              <option value="all">Все предметы</option>
              <option value="seeds">Семена</option>
              <option value="fruits">Плоды</option>
              <option value="common">Обычные</option>
              <option value="uncommon">Необычные</option>
              <option value="rare">Редкие</option>
              <option value="epic">Эпические</option>
              <option value="legendary">Легендарные</option>
            </select>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎒</div>
              <div className="text-sm">Инвентарь пуст</div>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {filteredInventory.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded-2xl bg-white border border-gray-300 shadow-md cursor-pointer hover:shadow-lg transition-all active:scale-95"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{item.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-medium">{item.name}</div>
                        {(item as any).rarity && (
                          <div 
                            className="px-2 py-0.5 rounded-full text-xs text-white"
                            style={{ backgroundColor: getRarityColor((item as any).rarity) }}
                          >
                            {getRarityName((item as any).rarity)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.type === 'seed' ? 'Семена' : item.type === 'fruit' ? 'Плоды' : 'Усилители'} • ×{item.count}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[var(--primary)]">×{item.count}</div>
                      <div className="text-xs text-gray-400 mt-1">Нажмите для действий</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filterBy === 'all' && (
              <button
                onClick={() => setShowSellAllModal(true)}
                disabled={getTotalFruitValue() === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md active:scale-95 transition-all"
              >
                💰 Продать все плоды ({getTotalFruitValue().toLocaleString()} $ECO)
              </button>
            )}
          </div>
        </>
      )}

      {activeTab === 'crafting' && (
        <HybridCrafting game={game} />
      )}

      {selectedItem && (
        <ItemActionModal
          open={!!selectedItem}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          game={game}
        />
      )}

      {/* Модальное окно продажи всех плодов */}
      <AnimatePresence>
        {showSellAllModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-3"
            onClick={() => setShowSellAllModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold">💰 Продать все плоды</div>
                <button 
                  onClick={() => setShowSellAllModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="text-center mb-4">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-sm text-gray-600 mb-2">
                  Вы получите за все плоды:
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {getTotalFruitValue()} $ECO
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowSellAllModal(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSellAllFruits}
                  className="flex-1 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 font-medium"
                >
                  Продать все
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}