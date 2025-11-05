import React from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import App from './App'

// Allowed domains for quick local/tunnel runs
const ALLOWED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  // LocalTunnel
  'loca.lt',
  // ngrok free
  'ngrok-free.app',
  // Telegram
  't.me',
  'telegram.org',
];

try {
  const host = location.hostname;
  const ok = ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  if (!ok) {
    console.warn('[EcoEmpire] Host is not in allowed list:', host);
  }
} catch {}

// Инициализация Telegram WebApp сразу при загрузке страницы
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  const tgWebApp = window.Telegram.WebApp;
  
  // Инициализируем сразу
  tgWebApp.ready();
  tgWebApp.expand();
  
  // Отключаем свайпы сразу
  if (typeof tgWebApp.disableVerticalSwipes === 'function') {
    tgWebApp.disableVerticalSwipes();
  }
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={window.location.origin + '/tonconnect-manifest.json'}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>
)

