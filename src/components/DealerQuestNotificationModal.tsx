import { DealerQuestNotification } from '../hooks/useGameLogic';

interface DealerQuestNotificationModalProps {
  notification: DealerQuestNotification | null;
  onClose: () => void;
}

export default function DealerQuestNotificationModal({
  notification,
  onClose,
}: DealerQuestNotificationModalProps) {
  if (!notification) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
        <div className="text-6xl mb-4">{notification.questEmoji}</div>
        <h3 className="text-xl font-bold mb-2">{notification.questName}</h3>
        <p className="text-gray-700 mb-6">{notification.message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-semibold active:bg-green-600"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}

