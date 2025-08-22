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
import { AngularNodeAppEngine, writeResponseToNodeResponse } from '@angular/ssr/node';

const PORT = parseInt(process.env.PORT || '4001', 10);
const distRoot = resolve(process.cwd(), 'dist/guiders-20');
const browserDistFolder = resolve(distRoot, 'browser');
const serverBundlePath = resolve(distRoot, 'server/server.mjs');

function trace(msg) {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  try { fs.appendFileSync(resolve(process.cwd(), 'ssr-wrapper.log'), line + '\n'); } catch {}
}

function fileExists(path) { try { return fs.existsSync(path); } catch { return false; } }
function readPackageVersion(pkgName) {
  try {
    const pkgPath = require.resolve(pkgName + '/package.json', { paths: [process.cwd()] });
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version || 'unknown';
  } catch { return 'missing'; }
}
process.on('unhandledRejection', r => trace('[SSR] ❌ unhandledRejection: ' + (r && r.stack || r)));
process.on('uncaughtException', e => { trace('[SSR] ❌ uncaughtException: ' + (e && e.stack || e)); });

async function start() {
  trace('[SSR] Wrapper inicializado');
  trace('[SSR] dist root        : ' + distRoot);
  trace('[SSR] browser assets   : ' + browserDistFolder);
  trace('[SSR] server bundle    : ' + serverBundlePath);
  trace('[SSR] Node version     : ' + process.version);
  trace('[SSR] CWD               : ' + process.cwd());
  trace('[SSR] ENV PORT          : ' + process.env.PORT);

  // FS / deps pre-flight
  const critical = [distRoot, browserDistFolder, serverBundlePath];
  critical.forEach(p => trace(`[SSR] Check path: ${p} ${fileExists(p) ? '✅' : '❌'}`));
  trace('[SSR] node_modules presente: ' + (fileExists(resolve(process.cwd(), 'node_modules')) ? 'sí' : 'NO'));
  trace('[SSR] Paquetes núcleo:');
  ['@angular/core','@angular/common','@angular/compiler','@angular/platform-server','@angular/ssr','express','rxjs','zone.js'].forEach(p => trace(`   - ${p}@${readPackageVersion(p)}`));

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

  // Inicialización diferida del engine Angular con reintento JIT si falta compiler
  let angularEnginePromise;
  async function initAngularEngine() {
    if (angularEnginePromise) return angularEnginePromise;
    angularEnginePromise = (async () => {
      try {
        trace('[SSR] Creando AngularNodeAppEngine (AOT esperado)');
        return new AngularNodeAppEngine();
      } catch (e) {
        const msg = (e && e.message) || '';
        trace('[SSR] ⚠️ Falló creación engine inicial: ' + (e && e.stack || e));
        if (/compiler/i.test(msg) || /ngDeclareFactory/i.test(msg)) {
          trace('[SSR] Intentando cargar @angular/compiler para modo JIT de respaldo...');
          try {
            await import('@angular/compiler');
            trace('[SSR] @angular/compiler importado. Reintentando engine...');
            return new AngularNodeAppEngine();
          } catch (e2) {
            trace('[SSR] ❌ Reintento con compiler también falló: ' + (e2 && e2.stack || e2));
            throw e2;
          }
        }
        throw e;
      }
    })();
    return angularEnginePromise;
  }

  // Estáticos
  app.use(express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }));

  // SSR handler
  app.use(async (req, res, next) => {
    trace('[SSR] Request: ' + req.method + ' ' + req.url);
    let engine;
    try {
      engine = await initAngularEngine();
    } catch (e) {
      trace('[SSR] ❌ No se pudo inicializar Angular engine: ' + (e && e.stack || e));
      return res.status(500).send('SSR Engine init failed');
    }
    try {
      const r = await engine.handle(req);
      if (r) {
        trace('[SSR] Render OK: ' + req.url + ' status=' + r.status);
        return writeResponseToNodeResponse(r, res);
      }
      trace('[SSR] Pasando a next() ' + req.url);
      return next();
    } catch (err) {
      trace('[SSR] ❌ Error en handle: ' + (err && err.stack || err));
      return next(err);
    }
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

  // Confirmar dirección tras un breve delay
  setTimeout(() => {
    try { trace('[SSR] server.address(): ' + JSON.stringify(server.address())); } catch {}
  }, 1200);

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
