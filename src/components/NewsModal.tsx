import { AnimatePresence, motion } from 'framer-motion';

export default function NewsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold">📰 Новости</div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                <div className="font-semibold text-green-800 mb-2">🚀 Готовимся к релизу!</div>
                <div className="text-sm text-green-900 space-y-2">
                  <p>Команда EcoEmpire активно работает над запуском полноценной версии игры. Мы делаем всё, чтобы вы получили лучший игровой опыт!</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="font-semibold text-blue-800 mb-2">✨ Что будет на релизе?</div>
                <ul className="text-sm text-blue-900 list-disc pl-5 space-y-1">
                  <li>Интеграция с TON кошельками</li>
                  <li>Реальная торговля на бирже между игроками</li>
                  <li>Система рефералов с выплатами</li>
                  <li>Новые редкие семена и гибриды</li>
                  <li>Соревнования и турниры с призами</li>
                  <li>NFT коллекция уникальных растений</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="font-semibold text-purple-800 mb-2">🎮 Текущие возможности</div>
                <ul className="text-sm text-purple-900 list-disc pl-5 space-y-1">
                  <li>Выращивание растений и сбор урожая</li>
                  <li>Создание гибридов</li>
                  <li>Колесо фортуны с наградами</li>
                  <li>Ежедневные награды за вход</li>
                  <li>Система уровней и титулов</li>
                  <li>Магазин с динамическим ассортиментом</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200">
                <div className="font-semibold text-yellow-800 mb-2">📅 Дата релиза</div>
                <div className="text-sm text-yellow-900">
                  Официальный запуск планируется в ближайшие недели. Следите за обновлениями в нашем Telegram-канале!
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                <div className="font-semibold text-red-800 mb-2">💎 Ранняя поддержка</div>
                <div className="text-sm text-red-900">
                  Игроки, которые присоединились на этапе тестирования, получат эксклюзивные награды и бонусы при релизе!
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


