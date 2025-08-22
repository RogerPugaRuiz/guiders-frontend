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
// Importaciones Angular se difieren para capturar errores y loggear primero
let AngularNodeAppEngine, writeResponseToNodeResponse;

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

  // Intentar cargar compiler primero para evitar fallo de linker/JIT
  try {
    trace('[SSR] Intentando importar @angular/compiler temprano...');
    await import('@angular/compiler');
    trace('[SSR] @angular/compiler cargado (JIT disponible)');
  } catch (e) {
    trace('[SSR] ⚠️ No se pudo importar @angular/compiler temprano: ' + (e && e.message));
  }

  // Cargar módulo SSR Angular ahora (de forma diferida)
  try {
    trace('[SSR] Importando @angular/ssr/node...');
    ({ AngularNodeAppEngine, writeResponseToNodeResponse } = await import('@angular/ssr/node'));
    trace('[SSR] @angular/ssr/node importado OK');
  } catch (e) {
    trace('[SSR] ❌ Error importando @angular/ssr/node: ' + (e && e.stack || e));
    process.exit(1);
  }

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

  // Crear engine de inmediato para detectar fallos temprano
  let engineInitError = null;
  let engineInstance = null;
  try {
    trace('[SSR] Creando AngularNodeAppEngine inicial (early)...');
    engineInstance = new AngularNodeAppEngine();
    trace('[SSR] AngularNodeAppEngine creado (early)');
  } catch (e) {
    engineInitError = e;
    trace('[SSR] ❌ Falló engine early: ' + (e && e.stack || e));
    // Intento JIT si aún no se intentó compiler
    if (!/compiler/i.test(e.message || '')) {
      try {
        trace('[SSR] Intento de recuperación importando @angular/compiler para JIT...');
        await import('@angular/compiler');
        trace('[SSR] Reintentando engine tras compiler...');
        engineInstance = new AngularNodeAppEngine();
        engineInitError = null;
        trace('[SSR] ✅ Engine recuperado tras compiler');
      } catch (e2) {
        trace('[SSR] ❌ Recuperación fallida: ' + (e2 && e2.stack || e2));
        engineInitError = e2;
      }
    }
  }

  // Inicialización diferida del engine Angular con reintento JIT si falta compiler
  async function getEngine() {
    if (engineInstance) return engineInstance;
    if (engineInitError) throw engineInitError;
    throw new Error('Engine no inicializado por motivo desconocido');
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
    if (engineInitError) {
      trace('[SSR] ❌ Engine estaba en error previo (fast-fail)');
      return res.status(500).send('SSR Engine init failed: ' + (engineInitError && engineInitError.message));
    }
    let engine;
    try { engine = await getEngine(); } catch (e) {
      trace('[SSR] ❌ getEngine() error: ' + (e && e.stack || e));
      return res.status(500).send('SSR Engine init failed (late): ' + (e && e.message));
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
