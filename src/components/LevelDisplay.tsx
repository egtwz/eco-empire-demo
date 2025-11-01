import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  level: number;
  xp: number;
  requiredXP: number;
  progress: number;
}

export default function LevelDisplay({ level, xp, requiredXP, progress }: Props) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all"
        onClick={() => setShowInfo(true)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-bold">Уровень {level}</div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Опыт: {xp}</span>
            <span>{requiredXP} XP</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
        
        <div className="text-xs opacity-90">
          {level >= 10 ? 'Максимальный уровень!' : `До следующего уровня: ${requiredXP - xp} XP`}
        </div>
      </div>

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
              className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold">Система уровней</div>
                <button 
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="font-semibold text-purple-800 mb-2">За что ещё дают опыт:</div>
                <ul className="text-sm list-disc pl-5 space-y-1 text-purple-900">
                  <li>Продажи на бирже — бонусный XP за активность (в тестировании)</li>
                  <li>Участие в розыгрышах и ивентах — разовый XP</li>
                  <li>Ежедневные задания — небольшой XP за выполнение</li>
                </ul>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <div className="font-semibold text-blue-800 mb-2">Как получить опыт:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>🌱 Обычные плоды:</span>
                      <span className="font-semibold">1 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🌿 Необычные плоды:</span>
                      <span className="font-semibold">2 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🌳 Редкие плоды:</span>
                      <span className="font-semibold">4 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>💎 Эпические плоды:</span>
                      <span className="font-semibold">8 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🔥 Легендарные плоды:</span>
                      <span className="font-semibold">16 XP</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-xl">
                  <div className="font-semibold text-green-800 mb-2">Требования по уровням:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Уровень 1→2:</span>
                      <span className="font-semibold">200 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Уровень 2→3:</span>
                      <span className="font-semibold">400 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Уровень 3→4:</span>
                      <span className="font-semibold">800 XP</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      И так далее по геометрической прогрессии ×2
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowInfo(false)}
                className="w-full mt-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 font-medium"
              >
                Понятно
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

