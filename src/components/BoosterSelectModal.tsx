import { AnimatePresence, motion } from 'framer-motion';
import { BoosterDef, BoosterId } from '../data/boosters';
import { Cell } from '../hooks/useGameLogic';
import { getSeedInfo } from '../utils/hybridUtils';

interface BoosterSelectModalProps {
  open: boolean;
  boosters: Array<{ def: BoosterDef; count: number }>;
  onClose: () => void;
  onSelect: (boosterId: BoosterId) => void;
  selectedCell: Cell | null;
  timeLeft: number | null;
  blockedReason: string | null;
}

const formatTime = (timeLeft: number | null) => {
  if (timeLeft === null) return null;
  if (timeLeft <= 0) return 'Готово совсем скоро';
  const totalSeconds = Math.ceil(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function BoosterSelectModal({ open, boosters, onClose, onSelect, selectedCell, timeLeft, blockedReason }: BoosterSelectModalProps) {
  const cellSeedInfo = selectedCell?.seed ? getSeedInfo(selectedCell.seed) : null;
  const formattedTime = formatTime(timeLeft);
  const hasAnyBoosters = boosters.length > 0;
  const isBlocked = Boolean(blockedReason);

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
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold">Выберите бустер</div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {selectedCell && selectedCell.seed && (
              <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Целевая клетка</div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cellSeedInfo?.emoji ?? '🌱'}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{cellSeedInfo?.name ?? selectedCell.seed}</div>
                    {formattedTime && (
                      <div className="text-xs text-gray-500">Осталось: {formattedTime}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {isBlocked ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 text-center leading-relaxed">
                  {blockedReason}
                </div>
              ) : hasAnyBoosters ? (
                boosters.map(({ def, count }) => (
                  <div
                    key={def.id}
                    className={`p-3 rounded-xl border-2 transition bg-white ${
                      count > 0 ? 'border-purple-200 hover:bg-purple-50' : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{def.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-800">{def.name}</span>
                          <span className="text-xs font-medium text-gray-500">×{count}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 leading-relaxed">{def.shortDescription}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {def.usage === 'target'
                            ? 'Применение: выбирается для конкретной клетки'
                            : 'Применение: мгновенный эффект'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => count > 0 && onSelect(def.id)}
                      disabled={count <= 0}
                      className="mt-3 w-full py-2 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Применить
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 py-6">
                  Нет доступных бустеров для применения.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

