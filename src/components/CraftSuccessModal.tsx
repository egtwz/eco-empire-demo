import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  resultName: string;
  resultEmoji: string;
  onClose: () => void;
}

export default function CraftSuccessModal({ open, resultName, resultEmoji, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              {/* Анимированная иконка успеха */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-4"
              >
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">✓</span>
                </div>
              </motion.div>

              {/* Заголовок */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-800 mb-2"
              >
                Крафт успешен!
              </motion.h2>

              {/* Результат */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-4"
              >
                <div className="text-6xl mb-3">{resultEmoji}</div>
                <div className="text-lg font-medium text-gray-700">{resultName}</div>
                <div className="text-sm text-green-600 mt-2">
                  🌱 Семена появились в инвентаре
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Теперь вы можете посадить их на поле или продать
                </div>
              </motion.div>

              {/* Кнопка закрытия */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
              >
                Отлично!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

