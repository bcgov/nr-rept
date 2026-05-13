import { fileURLToPath } from 'node:url';
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const projectRootDir = fileURLToPath(new URL('.', import.meta.url));
  const define = {
    global: {},
  };
  const devHost = env.VITE_DEV_HOST ?? 'localhost';
  const devPort = Number(env.VITE_DEV_PORT ?? 3000);
  const backendTarget = env.VITE_DEV_BACKEND_TARGET ?? 'http://localhost:8080';
  const hmrPort = env.VITE_HMR_PORT ? Number(env.VITE_HMR_PORT) : devPort;
  const hmrHost = env.VITE_HMR_HOST ?? devHost;
  const hmrProtocolEnv = env.VITE_HMR_PROTOCOL ?? 'ws';
  const hmrProtocol = hmrProtocolEnv === 'wss' ? 'wss' : 'ws';
  return {
    define,
    resolve: {
      alias: {
        '@': resolve(projectRootDir, 'src'),
      },
    },
    plugins: [react(), tsconfigPaths()],
    base: env.VITE_BASE_PATH || '/',
    build: {
      chunkSizeWarningLimit: 1024,
      outDir: 'dist',
    },
    optimizeDeps: {
      include: [
        '@tanstack/react-query',
        'aws-amplify',
        'aws-amplify/auth/cognito',
        'aws-amplify/utils',
        'react-dom/client',
        '@tanstack/react-query-devtools',
        'aws-amplify/auth',
      ],
    },
    server: {
      host: devHost,
      port: devPort,
      hmr: {
        overlay: false,
        protocol: hmrProtocol,
        host: hmrHost,
        port: hmrPort,
      },
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: devPort,
    },
    test: {
      env,
      globals: true,
      exclude: [...configDefaults.exclude, 'dist/**', 'build/**'],
      coverage: {
        provider: 'v8',
        reporter: ['lcov', 'cobertura', 'html', 'json', 'text'],
        reportsDirectory: './coverage',
        all: true,
        exclude: [
          '**/node_modules/**',
          '**/tests/**',
          '**/*.test.{ts,tsx}',
          '**/vite-env.d.ts',
          '**/types/**',
          '**/constants/**',
          '**/config/fam/*',
          '**/config/react-query/*',
          '**/config/tests/*',
          '**/*.env.ts',
          '**/*.scss',
          '**/*.css',
          '**/*.d.ts',
          '**/types.ts',
          '**/main.tsx',
          '**/App.tsx',
        ],
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      projects: [
        {
          resolve: {
            alias: {
              '@': resolve(projectRootDir, 'src'),
            },
          },
          plugins: [react(), tsconfigPaths()],
          test: {
            name: 'node',
            setupFiles: [
              './src/config/tests/setup-env.ts',
              './src/config/tests/custom-matchers.ts',
            ],
            environment: 'happy-dom',
            include: ['src/**/*.unit.test.{ts,tsx}'],
          },
        },
        {
          resolve: {
            alias: {
              '@': resolve(projectRootDir, 'src'),
            },
          },
          plugins: [react(), tsconfigPaths()],
          test: {
            name: 'browser',
            setupFiles: [
              './src/config/tests/setup-browser.ts',
              './src/config/tests/custom-matchers.ts',
            ],
            browser: {
              enabled: true,
              provider: 'playwright',
              instances: [{ browser: 'chromium' }],
            },
            include: ['src/**/*.browser.test.{ts,tsx}'],
          },
        },
      ],
    },
  };
});
