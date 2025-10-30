import { AnimatePresence, motion } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';

export default function BuyEcoModal({ open, onClose, game }: { open: boolean; onClose: () => void; game: ReturnType<typeof useGameLogic> }) {
  const packages = [
    { eco: 100, ton: 10, label: 'Starter' },
    { eco: 500, ton: 40, label: 'Popular' },
    { eco: 1000, ton: 70, label: 'Best Deal' },
  ];

  const handleBuy = (eco: number, ton: number) => {
    game.buyEcoWithTon(eco, ton);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold">Купить $ECO</div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>

            <div className="text-xs text-gray-600 mb-3">Баланс TON: {game.state.tonBalance}</div>

            <div className="space-y-3">
              {packages.map((pkg, i) => (
                <div key={i} className="p-4 rounded-2xl border-2 border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-800">{pkg.label}</div>
                      <div className="text-sm text-gray-600">{pkg.eco} $ECO</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">{pkg.ton} TON</div>
                  </div>
                  <button
                    onClick={() => handleBuy(pkg.eco, pkg.ton)}
                    disabled={game.state.tonBalance < pkg.ton}
                    className={`w-full py-2 rounded-xl font-semibold text-white ${game.state.tonBalance >= pkg.ton ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}
                  >
                    Купить
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


