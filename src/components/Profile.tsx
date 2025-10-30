import { useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { motion, AnimatePresence } from 'framer-motion';
import LevelDisplay from './LevelDisplay';

export default function Profile({ game }: { game: ReturnType<typeof useGameLogic> }) {
  const { state, updateUsername, updateTitle } = game;
  const [newUsername, setNewUsername] = useState(state.username);
  const [showInvite, setShowInvite] = useState(false);
  const [showTitles, setShowTitles] = useState(false);

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

  const referralLink = `${window.location.origin}/?ref=${state.playerId}`;

  const handleSaveUsername = () => {
    if (newUsername.trim()) {
      updateUsername(newUsername.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto p-3 pb-24">
      <div className="text-xl font-bold text-center mb-4 text-[var(--text)]">👤 Профиль</div>

      {/* Профиль */}
      <div className="mb-4 bg-white rounded-2xl p-4 shadow-md">
        <div className="text-base font-semibold mb-3 text-gray-700">Данные</div>
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
            <div className="px-3 py-2 bg-gray-100 rounded-xl text-sm font-mono">{state.playerId}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Титул</label>
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 flex-1 min-h-[38px] flex items-center">
                {state.title || 'Не выбран'}
              </div>
              <button onClick={() => setShowTitles(true)} className="px-3 py-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 text-sm font-medium">Выбрать</button>
            </div>
          </div>
        </div>
      </div>

      {/* Уровень */}
      <div className="mb-4">
        <LevelDisplay
          level={game.getLevelProgress().currentLevel}
          xp={game.getLevelProgress().currentXP}
          requiredXP={game.getLevelProgress().requiredXP}
          progress={game.getLevelProgress().progress}
          onInfoClick={() => {}}
        />
      </div>

      {/* Подписка */}
      <div className="mb-4 bg-white rounded-2xl p-4 shadow-md">
        <div className="text-base font-semibold mb-3 text-gray-700">💎 Подписка</div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${getSubscriptionColor(state.subscription)} text-white`}>
          <div className="font-semibold">{getSubscriptionName(state.subscription)}</div>
          <div className="text-sm opacity-90">
            {state.subscription === 'none' ? 'Подключите подписку для получения бонусов' : 'Активна'}
          </div>
        </div>
      </div>

      {/* TON кошелек */}
      <div className="mb-4 bg-white rounded-2xl p-4 shadow-md">
        <div className="text-base font-semibold mb-3 text-gray-700">💰 TON кошелек</div>
        <button className="w-full py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 font-medium">Подключить кошелек</button>
      </div>

      {/* Статистика */}
      <div className="mb-4 bg-white rounded-2xl p-4 shadow-md">
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

      {/* Кнопка приглашения друзей во весь экран шириной */}
      <button
        onClick={() => setShowInvite(true)}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all"
      >
        🔗 Пригласить друзей
      </button>

      {/* Модалка выбора титула */}
      <AnimatePresence>
        {showTitles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-3"
            onClick={() => setShowTitles(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold">🏷️ Выбор титула</div>
                <button onClick={() => setShowTitles(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
              </div>

              <div className="text-xs text-gray-600 mb-2">Некоторые титулы открываются с уровня или при подписке</div>

              <TitleList 
                currentTitle={state.title}
                level={state.level}
                subscription={state.subscription}
                onSelect={(t) => { updateTitle(t); setShowTitles(false); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-3"
            onClick={() => setShowInvite(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold">👥 Пригласить друзей</div>
                <button onClick={() => setShowInvite(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
              </div>

              {/* Реферальная ссылка */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Ваша реферальная ссылка</label>
                <div className="flex gap-2">
                  <input readOnly value={referralLink} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                  <button onClick={() => navigator.clipboard.writeText(referralLink)} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Копировать</button>
                </div>
              </div>

              {/* Статистика приглашений (заглушки) */}
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-white rounded-xl">
                    <div className="text-xs text-gray-500">Приглашено друзей</div>
                    <div className="text-lg font-bold text-[var(--primary)]">0</div>
                  </div>
                  <div className="p-2 bg-white rounded-xl">
                    <div className="text-xs text-gray-500">Доход от продаж</div>
                    <div className="text-lg font-bold text-green-600">+0 $ECO</div>
                  </div>
                  <div className="p-2 bg-white rounded-xl">
                    <div className="text-xs text-gray-500">Доход от пополнений</div>
                    <div className="text-lg font-bold text-green-600">+0 $ECO</div>
                  </div>
                  <div className="p-2 bg-white rounded-xl">
                    <div className="text-xs text-gray-500">Всего заработано</div>
                    <div className="text-lg font-bold text-[var(--primary)]">+0 $ECO</div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-700">
                <div className="font-semibold mb-1">Как это работает</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>За каждую продажу скупщику вашим другом вы получаете 5%</li>
                  <li>За каждое пополнение TON вашим другом вы получаете 5%</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TitleList({ currentTitle, level, subscription, onSelect }: { currentTitle: string; level: number; subscription: string; onSelect: (t: string) => void }) {
  const titles: Array<{ name: string; color: string; requiredLevel?: number; requiresSub?: 'plus'|'premium' }> = [
    { name: 'Истинный фермер', color: '#10B981' },
    { name: 'Сын фермера', color: '#34D399' },
    { name: 'Тракторист', color: '#60A5FA' },
    { name: 'Хранитель урожая', color: '#F59E0B', requiredLevel: 3 },
    { name: 'Лесной друид', color: '#A78BFA', requiredLevel: 4 },
    { name: 'Повелитель семян', color: '#EF4444', requiredLevel: 5 },
    { name: 'Император Эко', color: '#F97316', requiredLevel: 6 },
    { name: 'Премиум-агроном', color: '#EAB308', requiresSub: 'plus' },
    { name: 'Платиновый эко-мастер', color: '#8B5CF6', requiresSub: 'premium' },
    { name: 'Зелёный алхимик', color: '#22C55E', requiredLevel: 2 },
    { name: 'Мастер полей', color: '#06B6D4', requiredLevel: 4 },
    { name: 'Хозяин империи', color: '#9333EA', requiredLevel: 6 },
  ];

  const canUse = (t: { requiredLevel?: number; requiresSub?: 'plus'|'premium' }) => {
    if (t.requiredLevel && level < t.requiredLevel) return false;
    if (t.requiresSub && subscription !== t.requiresSub) return false;
    return true;
  };

  return (
    <div className="space-y-2">
      {titles.map((t) => {
        const allowed = canUse(t);
        return (
          <div key={t.name} className={`p-3 rounded-xl border flex items-center justify-between ${allowed ? 'bg-white' : 'bg-gray-50 opacity-80'}`}>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg text-white text-sm" style={{ backgroundColor: t.color }}>{t.name}</span>
              {!allowed && (
                <span className="text-xs text-gray-600">
                  🔒 {t.requiredLevel ? `С ${t.requiredLevel} уровня` : ''}{t.requiredLevel && t.requiresSub ? ' • ' : ''}{t.requiresSub ? (t.requiresSub === 'plus' ? 'Требуется Plus' : 'Требуется Premium') : ''}
                </span>
              )}
            </div>
            <button
              disabled={!allowed}
              onClick={() => onSelect(t.name)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${allowed ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              {currentTitle === t.name ? 'Выбран' : 'Выбрать'}
            </button>
          </div>
        );
      })}
    </div>
  );
}


