/// <reference types="node" />
import { defineConfig, type ConfigEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig((env: ConfigEnv): UserConfig => {
  const isServe = env.command === 'serve';

  const server = isServe ? (() => {
    const keyPath = resolve(__dirname, '192.168.1.120+3-key.pem');
    const certPath = resolve(__dirname, '192.168.1.120+3.pem');
    const https = (existsSync(keyPath) && existsSync(certPath))
      ? { key: readFileSync(keyPath), cert: readFileSync(certPath) }
      : undefined;

    return {
      ...(https ? { https } : {}),
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    };
  })() : undefined;

  return {
    plugins: [react()],
    ...(server ? { server } : {})
  };
});
