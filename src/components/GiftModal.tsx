import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  itemName: string;
  itemEmoji: string;
  maxCount: number;
  onClose: () => void;
  onConfirm: (playerId: string, count: number) => void;
}

export default function GiftModal({ open, itemName, itemEmoji, maxCount, onClose, onConfirm }: Props) {
  const [playerId, setPlayerId] = useState('');
  const [count, setCount] = useState(1);

  const handleConfirm = () => {
    if (playerId.trim() && count > 0 && count <= maxCount) {
      onConfirm(playerId.trim(), count);
      setPlayerId('');
      setCount(1);
      onClose();
    }
  };

  return (
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
              <div className="text-lg font-bold">🎁 Подарить предмет</div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{itemEmoji}</div>
              <div className="text-sm font-medium">{itemName}</div>
              <div className="text-xs text-gray-500">Максимум: {maxCount} шт</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ID игрока</label>
                <input
                  type="text"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value.toUpperCase())}
                  placeholder="Введите ID игрока (например: ECO12345678)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Количество</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max={maxCount}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="1"
                    max={maxCount}
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
                    className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirm}
                disabled={!playerId.trim() || count <= 0 || count > maxCount}
                className="flex-1 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 font-medium"
              >
                Подарить
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



