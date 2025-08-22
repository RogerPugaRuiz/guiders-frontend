#!/usr/bin/env node
/**
 * Wrapper SSR (staging)
 * Motivos del rediseño:
 *  - El bundle `server.mjs` sólo arranca el server si es módulo principal (isMainModule)
 *    pero aquí lo importamos dinámicamente, por lo que no invoca app.listen.
 *  - No exporta la instancia de Express; por tanto no podemos descubrirla.
 *  - Este wrapper recrea el server Express usando la misma API que `src/server.ts`.
 *
 * Resultado:
 *  - Montamos Express + AngularNodeAppEngine directamente.
 *  - Servimos estáticos y gestionamos SSR.
 *  - Señalizamos a PM2 con 'ready'.
 */

import process from 'node:process';
import { resolve } from 'node:path';
import express from 'express';
import {
  AngularNodeAppEngine,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

const PORT = parseInt(process.env.PORT || '4001', 10);
const distRoot = resolve(process.cwd(), 'dist/guiders-20');
const browserDistFolder = resolve(distRoot, 'browser');
const serverBundlePath = resolve(distRoot, 'server/server.mjs');

async function start() {
  console.log('[SSR] Wrapper inicializado');
  console.log('[SSR] dist root        :', distRoot);
  console.log('[SSR] browser assets   :', browserDistFolder);
  console.log('[SSR] server bundle    :', serverBundlePath);
  console.log('[SSR] Node version     :', process.version);

  // Importar bundle para que registre posibles side-effects (no dependemos de listen interno)
  try {
    await import(serverBundlePath + `?t=${Date.now()}`);
  } catch (e) {
    console.error('[SSR] ❌ Error importando bundle SSR:', e);
    process.exit(1);
  }

  const app = express();
  const angularApp = new AngularNodeAppEngine();

  // Estáticos
  app.use(express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }));

  // SSR handler
  app.use((req, res, next) => {
    angularApp.handle(req)
      .then(r => r ? writeResponseToNodeResponse(r, res) : next())
      .catch(next);
  });

  // Error básico
  app.use((err, _req, res, _next) => {
    console.error('[SSR] ❌ Error de request:', err);
    res.status(500).send('SSR Error');
  });

  const server = app.listen(PORT, () => {
    console.log(`[SSR] ✅ Servidor escuchando en http://localhost:${PORT}`);
    if (process.send) process.send('ready');
  });

  // Diagnóstico tardío
  setTimeout(() => {
    try {
      console.log('[SSR] Handles activos:', process._getActiveHandles().length);
      console.log('[SSR] Requests activas:', process._getActiveRequests().length);
    } catch (_) {}
  }, 3000);

  const shutdown = (signal) => {
    console.log(`[SSR] Señal ${signal} recibida. Cerrando...`);
    server.close(() => {
      console.log('[SSR] Cerrado limpio.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };
  ['SIGINT','SIGTERM'].forEach(s => process.on(s, () => shutdown(s)));
}

start();
