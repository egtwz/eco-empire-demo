import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Field from './components/Field';
import Inventory from './components/Inventory';
import Shop from './components/Shop';
import Profile from './components/Profile';
import BoosterNotificationModal from './components/BoosterNotificationModal';
import DealerQuests from './components/DealerQuests';
import DealerQuestNotificationModal from './components/DealerQuestNotificationModal';
import ProcessingNotificationModal from './components/ProcessingNotificationModal';
import RewardsModal from './components/RewardsModal';
import NewsModal from './components/NewsModal';
import TopModal from './components/TopModal';
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
  
  // Состояния для модалок наград/информации/топ (для вкладки field)
  const [showRewards, setShowRewards] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [showTop, setShowTop] = useState(false);
  
  // Состояние viewMode для переключения между полем и домом
  const [fieldViewMode, setFieldViewMode] = useState<'field' | 'house'>(() => {
    try {
      const saved = localStorage.getItem('fieldViewMode');
      return (saved === 'field' || saved === 'house') ? saved : 'field';
    } catch {
      return 'field';
    }
  });

  // Сохраняем viewMode в localStorage при изменении
  const handleFieldViewModeChange = (mode: 'field' | 'house') => {
    setFieldViewMode(mode);
    try {
      localStorage.setItem('fieldViewMode', mode);
    } catch {}
  };
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

  // Скролл жёстко в самый верх при переключении вкладок
  useEffect(() => {
    const scrollTopAll = () => {
      const root = document.getElementById('root');
      if (root) {
        root.scrollTop = 0;
        try { root.scrollTo({ top: 0, behavior: 'auto' }); } catch {}
      }
      try { window.scrollTo(0, 0); } catch {}
      try { document.documentElement.scrollTop = 0; } catch {}
      try { (document.body as any).scrollTop = 0; } catch {}
    };
    // Сразу и на следующий кадр (после отрисовки контента)
    scrollTopAll();
    requestAnimationFrame(scrollTopAll);
    setTimeout(scrollTopAll, 50);
  }, [game.view]);

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
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #e0e7ff, #eff6ff, #e0e7ff)' }}>
      <Header balance={game.state.balance} view={game.view} setView={game.setView} game={game} />
      
      {/* Статичные кнопки и переключатели для вкладки field */}
      {game.view === 'field' && (
        <div className="max-w-md mx-auto px-3 pb-0" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)' }}>
          {/* Кнопки Награды/Информация/ТОП */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            <button onClick={() => setShowRewards(true)} className="py-3 rounded-xl bg-gradient-to-r from-pink-300 to-rose-300 text-white text-base font-medium shadow-sm hover:from-pink-400 hover:to-rose-400 transition-all border-2 border-pink-400">
              Награды
            </button>
            <button onClick={() => setShowNews(true)} className="py-3 rounded-xl bg-gradient-to-r from-sky-300 to-blue-300 text-white text-base font-medium shadow-sm hover:from-sky-400 hover:to-blue-400 transition-all border-2 border-sky-400">
              Информация
            </button>
            <button onClick={() => setShowTop(true)} className="py-3 rounded-xl bg-gradient-to-r from-violet-300 to-purple-300 text-white text-base font-medium shadow-sm hover:from-violet-400 hover:to-purple-400 transition-all border-2 border-violet-400">
              ТОП
            </button>
          </div>

          {/* Переключатель Поле ↔ Дом с заголовком в одной строке */}
          <div className="mt-5 mb-0 flex items-center justify-between gap-1">
            <button
              onClick={() => handleFieldViewModeChange('field')}
              className={`px-4 py-2 rounded-lg font-medium transition-all shadow-md whitespace-nowrap ${
                fieldViewMode === 'field'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🌱 ← Поле
            </button>
            <h1 className="text-xl font-bold text-center flex-1">
              {fieldViewMode === 'field' ? '🌱 Поле' : '🏠 Дом'}
            </h1>
            <button
              onClick={() => game.state.level >= 3 ? handleFieldViewModeChange('house') : null}
              disabled={game.state.level < 3}
              className={`px-4 py-2 rounded-lg font-medium transition-all shadow-md whitespace-nowrap ${
                game.state.level >= 3
                  ? fieldViewMode === 'house'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              }`}
              title={game.state.level < 3 ? 'Доступно с 3 уровня' : ''}
            >
              Дом → 🏠 {game.state.level < 3 && '🔒'}
            </button>
          </div>
        </div>
      )}
      
      {/* Контент с отступом сверху и снизу */}
      <div
        className="pb-28"
        style={{
          paddingTop:
            game.view === 'field'
              ? 'calc(env(safe-area-inset-top, 0px) + 0px)'
              : 'calc(env(safe-area-inset-top, 0px) + 0px)',
        }}
      >
        {game.view === 'field' && <Field game={game} fieldViewMode={fieldViewMode} />}
        {game.view === 'shop' && <Shop game={game} />}
        {game.view === 'inventory' && <Inventory game={game} />}
        {game.view === 'exchange' && <DealerQuests game={game} />}
        {game.view === 'profile' && <Profile game={game} telegramId={tgId} />}
      </div>

      <Navigation view={game.view} setView={game.setView} />

      <BoosterNotificationModal
        notification={game.boosterNotification}
        onClose={game.clearBoosterNotification}
      />

      <DealerQuestNotificationModal
        notification={game.dealerQuestNotification}
        onClose={game.clearDealerQuestNotification}
      />

      <ProcessingNotificationModal
        notification={game.processingNotification}
        onClose={game.clearProcessingNotification}
      />

      {/* Модалки для вкладки field */}
      {game.view === 'field' && (
        <>
          <RewardsModal open={showRewards} onClose={() => setShowRewards(false)} game={game} />
          <NewsModal open={showNews} onClose={() => setShowNews(false)} />
          <TopModal open={showTop} onClose={() => setShowTop(false)} game={game} />
        </>
      )}
    </div>
  );
}
