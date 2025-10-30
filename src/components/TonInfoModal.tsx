import { AnimatePresence, motion } from 'framer-motion';

export default function TonInfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
              <div className="text-lg font-bold">TON Кошелек</div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>

            <div className="mb-4">
              <button className="w-full py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 font-semibold">
                Подключить TON кошелек
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="font-semibold text-blue-800 mb-2">Для чего нужны TON?</div>
              <ul className="text-sm text-blue-900 list-disc pl-5 space-y-1">
                <li>Покупка $ECO токенов</li>
                <li>Покупка улучшений и бустеров</li>
                <li>Приобретение подписки Premium</li>
                <li>Участие в торгах на бирже</li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


