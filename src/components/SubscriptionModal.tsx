import { AnimatePresence, motion } from 'framer-motion';

export default function SubscriptionModal({ open, onClose, type }: { open: boolean; onClose: () => void; type: 'plus' | 'premium' }) {
  const isPremium = type === 'premium';
  const color = isPremium ? 'from-purple-500 to-pink-500' : 'from-yellow-400 to-yellow-600';
  const emoji = isPremium ? '💎' : '🥇';
  const name = isPremium ? 'EcoEmpire Premium' : 'EcoEmpire Plus';
  const price = isPremium ? '1000 TON/месяц' : '500 TON/месяц';

  const features = isPremium ? [
    '2.25x ускорение роста',
    'Двойной доход с шансом 37.5%',
    '1.875x цена у скупщика',
    'Приоритет на бирже каждые 1.5 часа',
    'Платиновый цвет никнейма',
    'Эксклюзивные семена',
    'Приоритетная поддержка'
  ] : [
    '1.5x ускорение роста',
    'Двойной доход с шансом 25%',
    '1.25x цена у скупщика',
    'Приоритет на бирже каждые 2 часа',
    'Золотой цвет никнейма'
  ];

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
            className={`w-full max-w-sm bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold">{name}</div>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{emoji}</div>
              <div className="text-sm opacity-90">Премиум подписка</div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span>✨</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{price}</div>
              <button className="w-full py-3 rounded-xl bg-white text-gray-800 font-bold hover:bg-gray-100 transition">
                Подписаться
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



