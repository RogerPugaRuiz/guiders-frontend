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
import fs from 'node:fs';
import express from 'express';
import {
  AngularNodeAppEngine,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

const PORT = parseInt(process.env.PORT || '4001', 10);
const distRoot = resolve(process.cwd(), 'dist/guiders-20');
const browserDistFolder = resolve(distRoot, 'browser');
const serverBundlePath = resolve(distRoot, 'server/server.mjs');

function trace(msg) {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  try { fs.appendFileSync(resolve(process.cwd(), 'ssr-wrapper.log'), line + '\n'); } catch {}
}

async function start() {
  trace('[SSR] Wrapper inicializado');
  trace('[SSR] dist root        : ' + distRoot);
  trace('[SSR] browser assets   : ' + browserDistFolder);
  trace('[SSR] server bundle    : ' + serverBundlePath);
  trace('[SSR] Node version     : ' + process.version);
  trace('[SSR] CWD               : ' + process.cwd());
  trace('[SSR] ENV PORT          : ' + process.env.PORT);

  // Importar bundle para que registre posibles side-effects (no dependemos de listen interno)
  try {
    trace('[SSR] Importando bundle SSR...');
    await import(serverBundlePath + `?t=${Date.now()}`);
    trace('[SSR] Bundle SSR importado.');
  } catch (e) {
    trace('[SSR] ❌ Error importando bundle SSR: ' + (e && e.stack || e));
    process.exit(1);
  }

  trace('[SSR] Creando instancia Express');
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
    trace('[SSR] Request: ' + req.method + ' ' + req.url);
    angularApp.handle(req)
      .then(r => {
        if (r) {
          trace('[SSR] Render OK: ' + req.url + ' status=' + r.status);
          return writeResponseToNodeResponse(r, res);
        }
        trace('[SSR] Pasando a next() ' + req.url);
        return next();
      })
      .catch(err => {
        trace('[SSR] ❌ Error en handle: ' + (err && err.stack || err));
        next(err);
      });
  });

  // Error básico
  app.use((err, _req, res, _next) => {
    trace('[SSR] ❌ Middleware error: ' + (err && err.stack || err));
    res.status(500).send('SSR Error');
  });

  let server;
  try {
    server = app.listen(PORT, () => {
      trace(`[SSR] ✅ Servidor escuchando en http://localhost:${PORT}`);
      if (process.send) process.send('ready');
    });
  } catch (e) {
    trace('[SSR] ❌ Error al iniciar listen(): ' + (e && e.stack || e));
    process.exit(1);
  }

  // Diagnóstico tardío
  setTimeout(() => {
    try {
      trace('[SSR] Handles activos: ' + process._getActiveHandles().length);
      trace('[SSR] Requests activas: ' + process._getActiveRequests().length);
    } catch (_) {}
  }, 3000);

  const shutdown = (signal) => {
    trace(`[SSR] Señal ${signal} recibida. Cerrando...`);
    server.close(() => {
      trace('[SSR] Cerrado limpio.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };
  ['SIGINT','SIGTERM'].forEach(s => process.on(s, () => shutdown(s)));
}

start();
