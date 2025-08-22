#!/usr/bin/env node
/**
 * Wrapper de arranque para SSR en staging.
 * Asegura que el bundle SSR escuche en el puerto configurado
 * y notifica a PM2 (wait_ready) cuando está listo.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || '4001', 10);
const ENTRY_RELATIVE = './dist/guiders-20/server/server.mjs';
const entryPath = resolve(__dirname, ENTRY_RELATIVE);

async function bootstrap() {
  console.log(`[SSR] Iniciando wrapper SSR...`);
  console.log(`[SSR] Importando bundle: ${entryPath}`);

  let mod;
  try {
    mod = await import(entryPath + `?t=${Date.now()}`); // cache bust
  } catch (err) {
    console.error('[SSR] ❌ Error importando server.mjs:', err);
    process.exit(1);
  }

  const candidates = [
    mod.app,
    mod.default?.app,
    mod.default,
    mod.server,
    mod.default?.server
  ].filter(Boolean);

  let appLike = candidates.find(c => typeof c?.listen === 'function');

  if (!appLike) {
    console.error('[SSR] ❌ No se encontró instancia con listen() en server.mjs');
    console.error('[SSR] Exports disponibles:', Object.keys(mod));
    process.exit(1);
  }

  if (appLike._guidersStarted) {
    console.warn('[SSR] ⚠️ La aplicación ya estaba marcada como iniciada');
  }

  try {
    const server = appLike.listen(PORT, () => {
      console.log(`[SSR] ✅ Escuchando en puerto ${PORT}`);
      if (process.send) process.send('ready');
    });
    appLike._guidersStarted = true;

    setTimeout(() => {
      try {
        console.log('[SSR] Diagnóstico post-arranque:');
        console.log('  Handles activos:', process._getActiveHandles().length);
        console.log('  Requests activas:', process._getActiveRequests().length);
      } catch (_) {}
    }, 4000);

    const shutdown = (signal) => {
      console.log(`[SSR] Recibida señal ${signal}, cerrando...`);
      server.close(() => {
        console.log('[SSR] Servidor cerrado. Bye.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 8000).unref();
    };
    ['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));
  } catch (err) {
    console.error('[SSR] ❌ Error en listen():', err);
    process.exit(1);
  }
}

bootstrap();
