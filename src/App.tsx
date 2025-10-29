import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Field from './components/Field';
import Inventory from './components/Inventory';
import Shop from './components/Shop';
import Exchange from './components/Exchange';
import Profile from './components/Profile';
import Onboarding from './components/Onboarding';
import { useGameLogic } from './hooks/useGameLogic';
import './styles.css';

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function App() {
  const [tgId, setTgId] = useState<number | undefined>();
  const game = useGameLogic(tgId);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const tips = useMemo(() => [
    'Совет: Сначала сажайте быстрые семена для старта',
    'Совет: Улучшайте поле, чтобы выращивать больше',
    'Совет: Продавайте лишнее на обмене за $ECO',
    'Совет: Следите за временем роста и собирайте вовремя',
  ], []);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // Больше не используем localStorage для onboarding; можно включить первый запуск по умолчанию
    setShowOnboarding(false);

    // Инициализируем Telegram WebApp
    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        // Получаем данные пользователя из Telegram
        const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
        if (tgUser) {
          setTgId(tgUser.id);
          game.updateUsername(tgUser.first_name || 'Пользователь');
        }
      } else {
        // Fallback для разработки
        setTgId(123456789);
      }
    } catch (e) {
      console.error('Telegram WebApp initialization error:', e);
      setTgId(123456789);
    }
  }, []);

  // Splash screen lifecycle
  useEffect(() => {
    const splashMinTime = setTimeout(() => setShowSplash(false), 1500);
    const tipTimer = setInterval(() => setTipIndex((i) => (i + 1) % tips.length), 1200);
    return () => {
      clearTimeout(splashMinTime);
      clearInterval(tipTimer);
    };
  }, [tips.length]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-full max-w-md px-6 text-center">
          <div className="text-3xl font-bold text-[var(--primary)] mb-2">🌿 EcoEmpire</div>
          <div className="text-sm text-gray-600 mb-6">Загрузка...</div>
          <div className="p-4 rounded-xl bg-white shadow-md">
            <div className="text-xs text-gray-700">{tips[tipIndex]}</div>
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
        {game.view === 'exchange' && <Exchange game={game} />}
        {game.view === 'profile' && <Profile game={game} />}
      </div>

      <Navigation view={game.view} setView={game.setView} />
    </div>
  );
}
