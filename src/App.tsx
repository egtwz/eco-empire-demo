import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Field from './components/Field';
import Inventory from './components/Inventory';
import Shop from './components/Shop';
import Exchange from './components/Exchange';
import Profile from './components/Profile';
import BoosterNotificationModal from './components/BoosterNotificationModal';
import { useGameLogic } from './hooks/useGameLogic';
import { useTelegram } from './hooks/useTelegram';
import './styles.css';

export default function App() {
  const { user: telegramUser, isReady: telegramReady, initData } = useTelegram();
  const [tgId, setTgId] = useState<number | undefined>();
  const game = useGameLogic(tgId, initData);
  const [showSplash, setShowSplash] = useState(true);
  const tips = useMemo(() => [
    '💡 Совет: Сначала сажайте быстрые семена для старта',
    '🌱 Совет: Улучшайте поле, чтобы выращивать больше',
    '💰 Совет: Продавайте лишнее на обмене за $ECO',
    '⏰ Совет: Следите за временем роста и собирайте вовремя',
    '🔬 Совет: Создавайте гибриды для увеличения дохода',
    '⚡ Совет: Используйте ускорители для быстрого роста',
  ], []);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (telegramUser?.id) {
      setTgId(telegramUser.id);
    } else if (telegramReady && !telegramUser) {
      // Fallback для локальной разработки
      setTgId(123456789);
    }
  }, [telegramUser, telegramReady]);

  useEffect(() => {
    if (telegramUser?.first_name) {
      game.updateUsername(telegramUser.first_name);
    }
  }, [telegramUser?.first_name, game.updateUsername]);

  // Splash screen lifecycle
  useEffect(() => {
    const splashMinTime = setTimeout(() => setShowSplash(false), 2000);
    const tipTimer = setInterval(() => setTipIndex((i) => (i + 1) % tips.length), 2000);
    return () => {
      clearTimeout(splashMinTime);
      clearInterval(tipTimer);
    };
  }, [tips.length]);

  if (showSplash || game.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mb-8 animate-bounce">
            <div className="text-7xl mb-2">🌿</div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            EcoEmpire
          </div>
          <div className="text-sm text-gray-500 mb-8">Твоя экологическая империя</div>
          
          {/* Прогресс бар */}
          <div className="mb-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Советы */}
          <div className="p-4 rounded-2xl bg-white/80 backdrop-blur shadow-lg border border-green-100">
            <div className="text-sm text-gray-700 font-medium">{tips[tipIndex]}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="fixed bottom-2 left-2 z-50 max-w-xs rounded-xl bg-black/80 text-white text-xs px-3 py-2 space-y-1 font-mono">
        <div className="font-semibold">user.id: {telegramUser?.id ?? '—'}</div>
        <div className="border-t border-white/20 pt-1 text-[10px] max-h-40 overflow-y-auto" id="debug-log"></div>
      </div>
      <Header balance={game.state.balance} view={game.view} setView={game.setView} game={game} />
      
      {/* Контент с отступом сверху и снизу */}
      <div className="pt-20 pb-28">
        {game.view === 'field' && <Field game={game} />}
        {game.view === 'shop' && <Shop game={game} />}
        {game.view === 'inventory' && <Inventory game={game} />}
        {game.view === 'exchange' && <Exchange game={game} />}
        {game.view === 'profile' && <Profile game={game} />}
      </div>

      <Navigation view={game.view} setView={game.setView} />

      <BoosterNotificationModal
        notification={game.boosterNotification}
        onClose={game.clearBoosterNotification}
      />
    </div>
  );
}
