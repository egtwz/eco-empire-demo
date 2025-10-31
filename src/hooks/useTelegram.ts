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
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  openTelegramLink: (url: string) => void;
  openLink: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    const initTelegram = () => {
      try {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
          
          const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
          const rawInitData = window.Telegram.WebApp.initData || null;
          if (rawInitData) {
            setInitData(rawInitData);
          }
          if (tgUser) {
            setUser(tgUser);
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
  }, []);

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
    initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe,
    sendData,
    openLink,
    close
  };
}



