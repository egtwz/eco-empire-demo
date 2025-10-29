import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  fruitName: string;
  fruitEmoji: string;
  pricePerUnit: number;
  availableCount: number;
  onClose: () => void;
  onConfirm: (count: number) => void;
}

export default function BuyConfirmModal({ open, fruitName, fruitEmoji, pricePerUnit, availableCount, onClose, onConfirm }: Props) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (open) setCount(1);
  }, [open]);

  const totalPrice = count * pricePerUnit;

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
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold">Продать плоды</div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{fruitEmoji}</div>
              <div className="text-base font-medium">{fruitName}</div>
              <div className="text-sm text-gray-500">В наличии: {availableCount} шт.</div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Количество: {count} шт.
              </label>
              <input
                type="range"
                min="1"
                max={availableCount}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>{availableCount}</span>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex justify-between text-sm mb-1">
                <span>Цена за шт:</span>
                <span className="font-semibold">{pricePerUnit} $ECO</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--primary)]">
                <span>Итого:</span>
                <span>{totalPrice} $ECO</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium">
                Отмена
              </button>
              <button
                onClick={() => { onConfirm(count); onClose(); }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-90 font-bold"
              >
                Продать
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

