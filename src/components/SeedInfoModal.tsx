import { motion, AnimatePresence } from 'framer-motion';
import { SeedDef, RARITY_COLORS } from '../data/seeds';

interface Props {
  open: boolean;
  seed: SeedDef | null;
  onClose: () => void;
}

export default function SeedInfoModal({ open, seed, onClose }: Props) {
  if (!seed) return null;

  const rarityColor = RARITY_COLORS[seed.rarity];
  const rarityNames = {
    common: 'Обычная',
    uncommon: 'Необычная', 
    rare: 'Редкая',
    epic: 'Эпическая',
    legendary: 'Легендарная'
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
              <div className="text-lg font-bold">{seed.name}</div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{seed.emoji}</div>
              <div 
                className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: rarityColor }}
              >
                {rarityNames[seed.rarity]}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Время созревания:</span>
                <span className="font-semibold">{seed.growSeconds} сек</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Цена покупки:</span>
                <span className="font-semibold text-green-600">{seed.price} $ECO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Цена продажи:</span>
                <span className="font-semibold text-blue-600">{seed.price * 1.5} $ECO</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-700">{seed.description}</div>
            </div>

            <button 
              onClick={onClose}
              className="w-full mt-4 py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--secondary)] font-medium"
            >
              Понятно
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
