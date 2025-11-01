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
    const initTelegram = () => {
      try {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
          
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



