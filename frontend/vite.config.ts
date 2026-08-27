import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // The public site is hosted as static files with no API behind it, so a
  // production build answers its own requests from `src/demo`. This lives here
  // rather than in `.env.production` because that file is gitignored, and the
  // flag has to survive a fresh clone. Build against a real Express API with
  // `VITE_DEMO_MODE=false npm run build`.
  define:
    command === 'build'
      ? {
          'import.meta.env.VITE_DEMO_MODE': JSON.stringify(process.env.VITE_DEMO_MODE ?? 'true'),
        }
      : {},
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173, // Default Vite port
    proxy: {
      // Proxy API requests to the backend container
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-recharts': ['recharts'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    testTimeout: 30000,
    css: false,
    poolOptions: {
      threads: {
        isolate: false,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      // Set just below the levels actually measured (97.35 stmts / 90.33 branch /
      // 82.56 funcs) so a regression fails the build instead of going unnoticed.
      // Raise these when coverage rises; never lower them to make a build pass.
      thresholds: {
        lines: 95,
        statements: 95,
        functions: 80,
        branches: 88,
      },
    },
  },
}));
