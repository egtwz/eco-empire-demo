import { motion, AnimatePresence } from 'framer-motion';
import { InventoryItem } from '../hooks/useGameLogic';

interface Props {
  open: boolean;
  seeds: InventoryItem[];
  onClose: () => void;
  onSelect: (seedId: string) => void;
}

export default function SeedSelectModal({ open, seeds, onClose, onSelect }: Props) {
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
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-sm bg-white rounded-2xl p-4 shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-semibold mb-2">Выберите семена</div>
            <div className="grid grid-cols-2 gap-2">
              {seeds.length === 0 && (
                <div className="col-span-2 text-sm text-gray-500">Нет семян в инвентаре</div>
              )}
              {seeds.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[var(--card)] shadow-md hover:bg-gray-50 focus:outline-none"
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-sm flex-1 text-left">{s.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">×{s.count}</span>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <button onClick={onClose} className="w-full py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--secondary)]">
                Закрыть
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}








