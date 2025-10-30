import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import { getSeedInfo, getFruitInfo } from '../utils/hybridUtils';
import BuyConfirmModal from './BuyConfirmModal';
import GiftModal from './GiftModal';

interface Props {
  open: boolean;
  item: {
    id: string;
    name: string;
    emoji: string;
    count: number;
    type: 'seed' | 'fruit' | 'booster';
  } | null;
  onClose: () => void;
}

export default function ItemActionModal({ open, item, onClose, game }: Props & { game: ReturnType<typeof useGameLogic> }) {
  const { sellFruit, sellSeed, useBoosterSpeedup } = game;
  const [showSellModal, setShowSellModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  if (!item) return null;

  const getSellPrice = () => {
    if (item.type === 'fruit') {
      const fruitDef = getFruitInfo(item.id);
      return fruitDef ? fruitDef.sellPrice : 0;
    } else {
      const seedDef = getSeedInfo(item.id);
      return seedDef ? Math.floor(seedDef.price * 0.5) : 0; // 50% от стоимости
    }
  };

  const handleSell = (count: number) => {
    if (item.type === 'fruit') {
      sellFruit(item.id, count);
    } else {
      sellSeed(item.id, count);
    }
    setShowSellModal(false);
    onClose();
  };

  const handleGift = (playerId: string, count: number) => {
    // Здесь будет логика отправки подарка
    console.log(`Отправка ${count} ${item.name} игроку ${playerId}`);
    setShowGiftModal(false);
    onClose();
  };

  const sellPrice = getSellPrice();

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-3"
            onClick={onClose}
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
                <div className="text-lg font-bold">Выберите действие</div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{item.emoji}</div>
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">В наличии: {item.count} шт</div>
                <div className="text-xs text-green-600 mt-1">
                  Цена продажи: {sellPrice} $ECO/шт
                </div>
              </div>

              <div className="space-y-3">
                {item.type === 'booster' ? (
                  <button
                    onClick={() => { useBoosterSpeedup(); onClose(); }}
                    className="w-full py-3 rounded-xl bg-purple-500 text-white hover:bg-purple-600 font-medium flex items-center justify-center gap-2"
                  >
                    <span>⚡</span>
                    <span>Использовать</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowSellModal(true)}
                      className="w-full py-3 rounded-xl bg-green-500 text-white hover:bg-green-600 font-medium flex items-center justify-center gap-2"
                    >
                      <span>💰</span>
                      <span>Продать</span>
                    </button>
                    
                    <button
                      onClick={() => setShowGiftModal(true)}
                      className="w-full py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 font-medium flex items-center justify-center gap-2"
                    >
                      <span>🎁</span>
                      <span>Подарить</span>
                    </button>
                  </>
                )}
              </div>

              <button 
                onClick={onClose}
                className="w-full mt-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
              >
                Отмена
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSellModal && (
        <BuyConfirmModal
          open={showSellModal}
          fruitName={item.name}
          fruitEmoji={item.emoji}
          pricePerUnit={sellPrice}
          availableCount={item.count}
          onClose={() => setShowSellModal(false)}
          onConfirm={handleSell}
        />
      )}

      {showGiftModal && (
        <GiftModal
          open={showGiftModal}
          itemName={item.name}
          itemEmoji={item.emoji}
          maxCount={item.count}
          onClose={() => setShowGiftModal(false)}
          onConfirm={handleGift}
        />
      )}
    </>
  );
}



