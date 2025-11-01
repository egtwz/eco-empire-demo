import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

export default function MarketOperationModal({ open, title, description, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 24 }}
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold text-gray-800">{title}</div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-600 whitespace-pre-line">{description}</div>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600"
            >
              Понятно
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

