import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: readFileSync(resolve(__dirname, '192.168.1.120+3-key.pem')),
      cert: readFileSync(resolve(__dirname, '192.168.1.120+3.pem'))
    },
    host: '192.168.1.120',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});
