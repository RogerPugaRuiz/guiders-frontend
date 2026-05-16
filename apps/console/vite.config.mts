/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));

// Compute an explicit app version to inject at build time.
// Simplified priority (deterministic and CI-friendly):
// 1. APP_VERSION env var (CI or caller sets this)
// 2. package.json version
// 3. git describe --tags --always (last resort, only when repo available)
function resolveAppVersion(): string {
  // 1) explicit env var
  const fromEnv = process.env.APP_VERSION || process.env.VITE_APP_VERSION;
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  // 2) package.json version (stable default)
  if (pkg && pkg.version) return pkg.version;

  // No further fallback: if package.json version is missing, return a safe default
  return '0.0.0';
}

const APP_VERSION = resolveAppVersion();

export default defineConfig(() => ({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/console',
  publicDir: 'public',
  plugins: [angular(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    name: 'console',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/console',
      provider: 'v8' as const,
    },
  },
}));
