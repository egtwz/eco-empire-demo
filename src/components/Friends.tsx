import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Friends() {
  const [invitedCount] = useState(0);
  const [incomeFromSales] = useState(0);
  const [incomeFromTopups] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  const totalIncome = incomeFromSales + incomeFromTopups;

  return (
    <div className="max-w-md mx-auto p-3 pb-24">
      <div className="text-xl font-bold text-center mb-4 text-[var(--text)]">👥 Друзья</div>

      {/* Кнопка пригласить */}
      <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all mb-4">
        🔗 Пригласить друзей
      </button>

      {/* Статистика */}
      <div className="bg-white rounded-2xl p-4 shadow-md mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-semibold text-gray-700">Статистика</div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--secondary)] transition"
          >
            ℹ️
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Приглашено друзей</span>
            <span className="font-bold text-[var(--primary)]">{invitedCount}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Доход от продаж</span>
            <span className="font-bold text-green-600">+{incomeFromSales} $ECO</span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Доход от пополнений</span>
            <span className="font-bold text-green-600">+{incomeFromTopups} $ECO</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t-2 border-[var(--primary)]">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-700">Всего заработано</span>
            <span className="font-bold text-xl text-[var(--primary)]">+{totalIncome} $ECO</span>
          </div>
        </div>
      </div>

      {/* Информация о бонусах - модальное окно */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-3"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-md bg-gradient-to-br from-[var(--accent)] to-[var(--secondary)] rounded-2xl p-5 text-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold">💎 Бонусная программа</div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span>💰</span>
                  <span>За каждую продажу скупщику от каждого друга вы получаете <strong>5%</strong> от суммы сделки</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>💳</span>
                  <span>За каждое пополнение TON от каждого друга вы получаете <strong>5%</strong> от суммы пополнения</span>
                </div>
                <div className="text-xs opacity-90 mt-3 pt-3 border-t border-white/20">
                  Приглашайте друзей и зарабатывайте вместе! 🚀
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Список друзей (заглушка) */}
      {invitedCount === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-sm">У вас пока нет приглашенных друзей</div>
          <div className="text-xs mt-2">Пригласите друзей и начните зарабатывать вместе!</div>
        </div>
      )}
    </div>
  );
}

