import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acesso externo (essencial para Docker)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:3001', // Redireciona para o serviço de backend do Docker
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    exclude: [...configDefaults.exclude, '**/node_modules/**', '**/dist/**'],
  },
});
