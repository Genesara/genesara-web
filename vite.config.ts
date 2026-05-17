import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // In real-API mode the dev server proxies /api → genesara-engine.
    // In mock mode (VITE_USE_MOCK=true) MSW intercepts in-browser and the proxy is unused.
    proxy: process.env.VITE_USE_MOCK
      ? undefined
      : {
          '/api': {
            target: process.env.VITE_ENGINE_URL || 'http://localhost:8080',
            changeOrigin: true,
          },
        },
  },
});
