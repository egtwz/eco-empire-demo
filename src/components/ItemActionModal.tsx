import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import { getSeedInfo, getFruitInfo } from '../utils/hybridUtils';
import { BOOSTERS, BoosterId } from '../data/boosters';
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
  const { sellFruit, sellSeed, applyBooster } = game;
  const [showSellModal, setShowSellModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  if (!item) return null;

  const isBooster = item.type === 'booster';
  const boosterInfo =
    isBooster && Object.prototype.hasOwnProperty.call(BOOSTERS, item.id)
      ? BOOSTERS[item.id as BoosterId]
      : undefined;

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

  const sellPrice = isBooster ? 0 : getSellPrice();

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
              {isBooster ? (
                boosterInfo && (
                  <div className="text-xs text-purple-600 mt-1">{boosterInfo.shortDescription}</div>
                )
              ) : item.type === 'seed' ? (
                <>
                  {(() => {
                    const seedInfo = getSeedInfo(item.id);
                    const growSeconds = seedInfo?.growSeconds || 0;
                    if (growSeconds > 0) {
                      const hours = Math.floor(growSeconds / 3600);
                      const minutes = Math.floor((growSeconds % 3600) / 60);
                      const seconds = growSeconds % 60;
                      let timeString = '';
                      if (hours > 0) timeString += `${hours}ч `;
                      if (minutes > 0) timeString += `${minutes}мин `;
                      if (seconds > 0 && hours === 0) timeString += `${seconds}сек`;
                      return (
                        <div className="text-xs text-blue-600 mt-1">
                          ⏱️ Время роста: {timeString.trim()}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {sellPrice === -1 ? (
                    <div className="text-xs text-red-600 mt-1 font-semibold">
                      ❌ Этот предмет нельзя продать
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 mt-1">
                      Цена продажи: {sellPrice} $ECO/шт
                    </div>
                  )}
                </>
              ) : sellPrice === -1 ? (
                <div className="text-xs text-red-600 mt-1 font-semibold">
                  ❌ Этот предмет нельзя продать
                </div>
              ) : (
                <div className="text-xs text-green-600 mt-1">
                  Цена продажи: {sellPrice} $ECO/шт
                </div>
              )}
              </div>

              <div className="space-y-3">
                {item.type === 'booster' ? (
                  <>
                    {boosterInfo && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-left">
                        <div className="text-sm font-semibold text-purple-800 mb-1">{boosterInfo.name}</div>
                        <div className="text-xs text-purple-700 leading-relaxed">{boosterInfo.detailedDescription}</div>
                        <div className="text-xs text-purple-600 mt-2">
                          {boosterInfo.usage === 'target'
                            ? 'Чтобы применить бустер, нажмите на клетку с растущим растением и выберите этот бустер в меню.'
                            : 'Используйте бустер, и он сработает на всех подходящих растениях сразу.'}
                        </div>
                      </div>
                    )}
                    {boosterInfo?.usage === 'global' ? (
                      <button
                        onClick={() => {
                          applyBooster(boosterInfo.id);
                          onClose();
                        }}
                        className="w-full py-3 rounded-xl bg-purple-500 text-white hover:bg-purple-600 font-medium flex items-center justify-center gap-2"
                      >
                        <span>⚡</span>
                        <span>Использовать</span>
                      </button>
                    ) : (
                      <div className="text-xs text-gray-500 text-center">
                        Выберите клетку с растущим семенем, чтобы применить бустер.
                      </div>
                    )}
                  </>
                ) : sellPrice === -1 ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                    <div className="text-sm font-semibold text-red-800">
                      Этот предмет нельзя продать скупщику
                    </div>
                  </div>
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



