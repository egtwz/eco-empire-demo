import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
    auth_date?: number;
    query_id?: string;
    start_param?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  openTelegramLink: (url: string) => void;
  openLink: (url: string) => void;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  platform?: string;
  version?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

function extractInitDataFromLocation(): string | null {
  try {
    const candidates = [window.location.hash, window.location.search];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const source = candidate.startsWith('#') || candidate.startsWith('?')
        ? candidate.slice(1)
        : candidate;
      if (!source) continue;
      const params = new URLSearchParams(source);
      const tgData = params.get('tgWebAppData');
      if (tgData) {
        return decodeURIComponent(tgData);
      }
    }
  } catch (error) {
    console.error('Failed to parse tgWebAppData from URL', error);
  }
  return null;
}

function parseUserFromInitData(raw: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(raw);
    const userParam = params.get('user');
    if (!userParam) return null;
    return JSON.parse(userParam) as TelegramUser;
  } catch (error) {
    console.error('Failed to parse user from initData', error);
    return null;
  }
}

function parseStartParamFromInitData(raw: string): string | null {
  try {
    const params = new URLSearchParams(raw);
    const start = params.get('start_param');
    if (start) return start;
  } catch (error) {
    console.error('Failed to parse start_param from initData', error);
  }
  return null;
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState<string | null>(null);
  const [startParam, setStartParam] = useState<string | null>(null);

  useEffect(() => {
    let touchStartY: number | undefined;
    let touchStartScrollY: number | undefined;
    let scrollableEl: HTMLElement | null = null;
    
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      if (scrollableEl) {
        touchStartScrollY = scrollableEl.scrollTop;
      } else {
        touchStartScrollY = window.scrollY;
      }
    };
    
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY === undefined || touchStartScrollY === undefined) return;
      
      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - touchStartY;
      
      // Блокируем только свайп вниз для предотвращения закрытия приложения
      // Блокируем ТОЛЬКО если:
      // 1. Пользователь начал касание в верхней части экрана (первые 100px)
      // 2. Контент уже в самом верху (scrollTop === 0)
      // 3. Пользователь пытается свайпнуть вниз (deltaY > 0)
      if (deltaY > 0) {
        const isNearTop = touchStartY < 100; // Начало касания в верхних 100px экрана
        
        if (scrollableEl) {
          const currentScroll = scrollableEl.scrollTop;
          // Блокируем только если начали касание вверху И контент уже в самом верху
          if (isNearTop && currentScroll <= 0 && touchStartScrollY <= 0 && deltaY > 10) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        } else {
          // Если нет scrollable элемента
          if (isNearTop && touchStartScrollY <= 0 && deltaY > 10) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
      }
      // Разрешаем свайп вверх (deltaY < 0) - не блокируем
    };
    
    const initTelegram = () => {
      try {
        if (window.Telegram?.WebApp) {
          const tgWebApp = window.Telegram.WebApp;
          
          // Инициализируем WebApp
          tgWebApp.ready();
          
          // Отключаем вертикальные свайпы СРАЗУ после ready()
          // Bot API 7.7+ (июль 2024) - согласно документации: https://core.telegram.org/bots/webapps
          if (typeof tgWebApp.disableVerticalSwipes === 'function') {
            tgWebApp.disableVerticalSwipes();
          }
          
          // Разворачиваем приложение на весь доступный экран
          tgWebApp.expand();
          
          // Находим scrollable элемент (root элемент)
          scrollableEl = document.getElementById('root');

          const registerTouchHandlers = () => {
            const target = scrollableEl || document.documentElement;

            target.removeEventListener('touchstart', onTouchStart);
            target.removeEventListener('touchmove', onTouchMove);
            target.addEventListener('touchstart', onTouchStart, { passive: false });
            target.addEventListener('touchmove', onTouchMove, { passive: false });

            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.addEventListener('touchstart', onTouchStart, { passive: false });
            window.addEventListener('touchmove', onTouchMove, { passive: false });
          };

          registerTouchHandlers();
          setTimeout(registerTouchHandlers, 100);
          setTimeout(registerTouchHandlers, 300);
           
          // Запрашиваем полноэкранный режим и еще раз вызываем expand несколько раз
          const requestFullscreenAndExpand = () => {
            // Запрашиваем полноэкранный режим (Bot API 8.0+, ноябрь 2024)
            if (typeof tgWebApp.requestFullscreen === 'function' && tgWebApp.requestFullscreen) {
              try {
                tgWebApp.requestFullscreen();
              } catch (e) {
                console.warn('Failed to request fullscreen:', e);
              }
            }
            
            // Вызываем expand несколько раз для гарантии развертывания
            try {
              tgWebApp.expand();
            } catch (e) {
              console.warn('Failed to expand:', e);
            }
          };
          
          setTimeout(requestFullscreenAndExpand, 150);
          setTimeout(requestFullscreenAndExpand, 400);
          setTimeout(requestFullscreenAndExpand, 800);
          
          const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
          let rawInitData = window.Telegram.WebApp.initData || null;
          if (!rawInitData) {
            rawInitData = extractInitDataFromLocation();
          }
          if (rawInitData) {
            setInitData(rawInitData);
            const start = parseStartParamFromInitData(rawInitData);
            if (start) setStartParam(start);
          }
          if (tgUser) {
            setUser(tgUser);
          }
          if (window.Telegram.WebApp.initDataUnsafe?.start_param && !startParam) {
            setStartParam(window.Telegram.WebApp.initDataUnsafe.start_param);
          }
          
          setIsReady(true);
          return true;
        }
      } catch (e) {
        console.error('Telegram WebApp initialization error:', e);
      }
      return false;
    };

    if (!initTelegram()) {
      // Fallback для разработки
      setIsReady(true);
    }
    
    // Cleanup функция для удаления обработчиков событий
    return () => {
      const target = document.getElementById('root') || document.documentElement;
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // В некоторых клиентах initData передаётся только через URL — обрабатываем его отдельно
  useEffect(() => {
    if (!initData) {
      const hashData = extractInitDataFromLocation();
      if (hashData) {
        setInitData(hashData);
        const start = parseStartParamFromInitData(hashData);
        if (start) setStartParam(start);
      }
    }
  }, [initData]);

  // Если пользователь не получен напрямую, пытаемся извлечь его из initData
  useEffect(() => {
    if (!user && initData) {
      const parsedUser = parseUserFromInitData(initData);
      if (parsedUser) {
        setUser(parsedUser);
      }
      if (!startParam) {
        const start = parseStartParamFromInitData(initData);
        if (start) setStartParam(start);
      }
    }
  }, [user, initData, startParam]);

  const sendData = (data: any) => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify(data));
    }
  };

  const openLink = (url: string) => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const close = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  return {
    user,
    isReady,
    initData,
    startParam,
    initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe,
    sendData,
    openLink,
    close
  };
}



