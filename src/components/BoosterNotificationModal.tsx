import { AnimatePresence, motion } from 'framer-motion';
import { BoosterNotification } from '../hooks/useGameLogic';

interface BoosterNotificationModalProps {
  notification: BoosterNotification | null;
  onClose: () => void;
}

export default function BoosterNotificationModal({ notification, onClose }: BoosterNotificationModalProps) {
  if (!notification) return null;

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-500">Бустер применён</div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                aria-label="Закрыть уведомление"
              >
                ✕
              </button>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-2">{notification.emoji}</div>
              <div className="text-base font-bold text-gray-800 mb-2">{notification.name}</div>
              <div className="text-sm text-gray-600 leading-relaxed">{notification.message}</div>
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold hover:bg-[var(--secondary)]"
            >
              Понятно
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


