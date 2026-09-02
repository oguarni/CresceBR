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
      // Set just below the levels actually measured (93.35-93.41 lines /
      // 92.41-92.47 stmts / 85.79-85.88 branches / 89.00 funcs, over repeated
      // runs) so a regression fails the build instead of going unnoticed.
      // Raise these when coverage rises; never lower them to make a build
      // pass. The ranges are real: consecutive runs of the identical suite
      // vary by up to ~0.09pp, so the margin here absorbs that rather than
      // sitting flush against a single measurement and going flaky.
      //
      // Re-baselined for vitest 4. The previous numbers (97.44 lines+stmts /
      // 90.10 branches / 87.82 funcs) were measured by v8's line-range
      // remapping. Vitest 4 makes AST-aware remapping mandatory -- the
      // `experimentalAstAwareRemapping` opt-out no longer exists -- so it
      // counts statements and branches from the real AST and reports lower
      // percentages for identical code. Nothing became less covered: the same
      // 942 tests in 56 files pass, no source changed, and *function* coverage
      // rose (87.82 -> 89.00), which a real regression cannot do. Lines and
      // statements also diverge now, where line-range remapping made them
      // identical. These are the same tests measured with a stricter ruler.
      thresholds: {
        lines: 93.2,
        statements: 92.3,
        functions: 88.9,
        branches: 85.6,
      },
    },
  },
}));
