import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Field from './components/Field';
import Inventory from './components/Inventory';
import Shop from './components/Shop';
import Profile from './components/Profile';
import BoosterNotificationModal from './components/BoosterNotificationModal';
import { useGameLogic } from './hooks/useGameLogic';
import { useTelegram } from './hooks/useTelegram';
import './styles.css';

const MOBILE_UA_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export default function App() {
  const initialMobile = typeof navigator === 'undefined'
    ? true
    : MOBILE_UA_REGEX.test(navigator.userAgent) || (typeof window !== 'undefined' && window.innerWidth <= 768);
  const [isMobile, setIsMobile] = useState(initialMobile);
  const { user: telegramUser, isReady: telegramReady, initData, startParam } = useTelegram();
  const [tgId, setTgId] = useState<number | undefined>();
  const game = useGameLogic(tgId, initData, startParam);
  const [showSplash, setShowSplash] = useState(true);
  const tips = useMemo(() => [
    '💡 Совет: Сначала сажайте быстрые семена для старта',
    '🌱 Совет: Улучшайте поле, чтобы выращивать больше',
    '💰 Совет: Продавайте плоды в магазине за $ECO',
    '⏰ Совет: Следите за временем роста и собирайте вовремя',
    '🔬 Совет: Создавайте гибриды для увеличения дохода',
    '⚡ Совет: Используйте ускорители для быстрого роста',
  ], []);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => MOBILE_UA_REGEX.test(navigator.userAgent) || window.innerWidth <= 768;
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 text-center">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl p-8 space-y-4">
          <div className="text-6xl">🌿</div>
          <div className="text-2xl font-bold text-gray-800">EcoEmpire</div>
          <div className="text-sm text-gray-600">
            Приложение доступно только на мобильных устройствах. Откройте EcoEmpire в Telegram на своём телефоне.
          </div>
        </div>
      </div>
    );
  }

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
      <Header balance={game.state.balance} view={game.view} setView={game.setView} game={game} />
      
      {/* Контент с отступом сверху и снизу */}
      <div className="pt-20 pb-28">
        {game.view === 'field' && <Field game={game} />}
        {game.view === 'shop' && <Shop game={game} />}
        {game.view === 'inventory' && <Inventory game={game} />}
        {game.view === 'exchange' && (
          <div className="max-w-md mx-auto p-6 text-center">
            <div className="text-6xl mb-4">🔨</div>
            <div className="text-2xl font-bold text-gray-800 mb-2">В разработке</div>
            <div className="text-gray-600">Раздел биржи находится в разработке</div>
          </div>
        )}
        {game.view === 'profile' && <Profile game={game} telegramId={tgId} />}
      </div>

      <Navigation view={game.view} setView={game.setView} />

      <BoosterNotificationModal
        notification={game.boosterNotification}
        onClose={game.clearBoosterNotification}
      />
    </div>
  );
}
