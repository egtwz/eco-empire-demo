import { AnimatePresence, motion } from 'framer-motion';
import { ProcessingNotification } from '../hooks/useGameLogic';

export default function ProcessingNotificationModal({
  notification,
  onClose,
}: {
  notification: ProcessingNotification | null;
  onClose: () => void;
}) {
  if (!notification) return null;

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{notification.productEmoji}</div>
              <div className="text-xl font-bold mb-1">{notification.productName}</div>
              <div className="text-sm text-gray-600">
                {notification.buildingEmoji} {notification.buildingName}
              </div>
            </div>
            
            <div className="text-center text-gray-700 mb-6">
              {notification.message}
            </div>
            
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              Понятно
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


