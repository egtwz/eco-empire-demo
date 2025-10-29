import React from 'react'
import { createRoot } from 'react-dom/client'
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

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

