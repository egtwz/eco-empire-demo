import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTonConnect } from '../hooks/useTonConnect';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose, game }: Props & { game: ReturnType<typeof useGameLogic> }) {
  const { state, updateUsername } = game;
  const [newUsername, setNewUsername] = useState(state.username);
  const { walletAddress, isConnected, disconnectWallet } = useTonConnect();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubscriptionColor = (sub: string) => {
    switch (sub) {
      case 'plus': return 'from-yellow-400 to-yellow-600';
      case 'premium': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getSubscriptionName = (sub: string) => {
    switch (sub) {
      case 'plus': return 'EcoEmpire Plus';
      case 'premium': return 'EcoEmpire Premium';
      default: return 'Без подписки';
    }
  };

  const handleSaveUsername = () => {
    if (newUsername.trim()) {
      updateUsername(newUsername.trim());
    }
  };

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
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold">⚙️ Настройки</div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Профиль */}
            <div className="mb-6">
              <div className="text-base font-semibold mb-3 text-gray-700">👤 Профиль</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Имя пользователя</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Введите имя"
                    />
                    <button
                      onClick={handleSaveUsername}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">ID игрока</label>
                  <div className="px-3 py-2 bg-gray-100 rounded-xl text-sm font-mono">
                    {state.playerId}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Поделитесь этим ID с друзьями для получения подарков
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Титул</label>
                  <div className="px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-500">
                    В разработке
                  </div>
                </div>
              </div>
            </div>

            {/* Подписка */}
            <div className="mb-6">
              <div className="text-base font-semibold mb-3 text-gray-700">💎 Подписка</div>
              <div className={`p-3 rounded-xl bg-gradient-to-r ${getSubscriptionColor(state.subscription)} text-white`}>
                <div className="font-semibold">{getSubscriptionName(state.subscription)}</div>
                <div className="text-sm opacity-90">
                  {state.subscription === 'none' ? 'Подключите подписку для получения бонусов' : 'Активна'}
                </div>
              </div>
            </div>

            {/* TON кошелек */}
            <div className="mb-6">
              <div className="text-base font-semibold mb-3 text-gray-700">💰 TON кошелек</div>
              {isConnected && walletAddress ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                    <div className="font-semibold text-green-800 mb-1 text-sm">✅ Кошелек подключен</div>
                    <div className="text-xs text-green-700 font-mono break-all">
                      {walletAddress}
                    </div>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="w-full py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 font-medium text-sm"
                  >
                    Отключить кошелек
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <TonConnectButton />
                </div>
              )}
            </div>

            {/* Статистика */}
            <div className="mb-6">
              <div className="text-base font-semibold mb-3 text-gray-700">📊 Статистика</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{state.seedsPlanted}</div>
                  <div className="text-xs text-green-700">Семян посажено</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{state.fruitsHarvested}</div>
                  <div className="text-xs text-blue-700">Плодов собрано</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">{state.hybridsCreated}</div>
                  <div className="text-xs text-purple-700">Гибридов создано</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600">{state.totalEarned.toLocaleString()}</div>
                  <div className="text-xs text-yellow-700">$ECO заработано</div>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <div className="text-2xl font-bold text-red-600">{state.totalSpent.toLocaleString()}</div>
                  <div className="text-xs text-red-700">$ECO потрачено</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-600">{formatTime(state.playTime)}</div>
                  <div className="text-xs text-gray-700">Время в игре</div>
                </div>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
            >
              Закрыть
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
