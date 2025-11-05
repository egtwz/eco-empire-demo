import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import { gameAPI } from '../api/gameApi';

interface TopPlayer {
  telegramId: number;
  username?: string;
  playerId?: string;
  balance?: number;
  totalEarned?: number;
  level?: number;
}

type TopTab = 'eco' | 'other';

export default function TopModal({ 
  open, 
  onClose, 
  game 
}: { 
  open: boolean; 
  onClose: () => void; 
  game: ReturnType<typeof useGameLogic> 
}) {
  const [activeTab, setActiveTab] = useState<TopTab>('eco');
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = game.telegramId;

  useEffect(() => {
    if (open && activeTab === 'eco') {
      loadTopPlayers();
    }
  }, [open, activeTab]);

  const loadTopPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading top players...');
      const players = await gameAPI.getTopPlayers('eco', 100);
      console.log('Top players loaded:', players.length);
      setTopPlayers(players);
    } catch (err: any) {
      const errorMessage = err?.message || 'Не удалось загрузить топ игроков';
      setError(errorMessage);
      console.error('Failed to load top players', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-400 to-sky-500 p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold">🏆 ТОП игроков</div>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Табы */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('eco')}
                className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === 'eco'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💰 ТОП по ECO
              </button>
              <button
                onClick={() => {}}
                disabled
                className="flex-1 py-2 rounded-xl font-semibold bg-gray-200 text-gray-400 cursor-not-allowed"
              >
                🔒 Скоро
              </button>
            </div>

            {/* Контент */}
            <div className="flex-1 overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 animate-spin">⏳</div>
                  <div className="text-sm text-gray-600">Загрузка топа...</div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">❌</div>
                  <div className="text-sm text-red-600">{error}</div>
                  <button
                    onClick={loadTopPlayers}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Попробовать снова
                  </button>
                </div>
              ) : topPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <div className="text-sm text-gray-600">Топ игроков пока пуст</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {topPlayers.map((player, index) => {
                    const rank = index + 1;
                    const isCurrentUser = player.telegramId === currentUserId;
                    return (
                      <div
                        key={player.telegramId || index}
                        data-player-id={player.telegramId}
                        className={`p-3 rounded-xl border-2 ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="text-xl font-bold text-gray-700 min-w-[40px]">
                              {getRankEmoji(rank)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold truncate ${isCurrentUser ? 'text-blue-600' : 'text-gray-800'}`}>
                                {player.username || `Игрок ${player.playerId || player.telegramId}`}
                                {isCurrentUser && ' (Вы)'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Уровень: {player.level || 1} • Заработано: {((player.totalEarned || 0) / 1000).toFixed(1)}k $ECO
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${isCurrentUser ? 'text-blue-600' : 'text-green-600'}`}>
                              {(player.balance || 0).toLocaleString()} $ECO
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Закрепленное окно с местом текущего игрока */}
            {!loading && !error && topPlayers.length > 0 && currentUserId && (
              <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3">
                {(() => {
                  const currentPlayerIndex = topPlayers.findIndex(p => p.telegramId === currentUserId);
                  if (currentPlayerIndex === -1) {
                    return (
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-600">
                          Вы пока не в топе 100
                        </div>
                      </div>
                    );
                  }
                  const currentPlayer = topPlayers[currentPlayerIndex];
                  const rank = currentPlayerIndex + 1;
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getRankEmoji(rank)}</span>
                        <div>
                          <div className="font-bold text-blue-600">Ваше место: {rank}</div>
                          <div className="text-xs text-gray-600">
                            {(currentPlayer.balance || 0).toLocaleString()} $ECO
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const element = document.querySelector(`[data-player-id="${currentUserId}"]`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600"
                      >
                        Показать
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

