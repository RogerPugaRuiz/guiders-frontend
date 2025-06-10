# 🔧 Troubleshooting Completo para Deployment Issues

## 🚨 Problemas Identificados y Solucionados

### 1. **Missing Build Directory Error**
```
Error: guiders-20/dist/guiders-20/server/ was not found
```

**🔍 Causa:** El build no se estaba creando correctamente o la verificación no era suficiente.

**✅ Solución Implementada:**
- Verificación exhaustiva del build con validación específica de `server.mjs`
- Listado detallado de contenidos de directorios para debugging
- Fallo temprano si el servidor SSR no se genera

### 2. **NPM CI Error - Missing package-lock.json**
```
Error: npm ci requires package-lock.json or npm-shrinkwrap.json
```

**🔍 Causa:** Los archivos package-lock.json no se estaban copiando al servidor.

**✅ Solución Implementada:**
- Copia automática de `package-lock.json` junto con `package.json`
- Fallback a `npm install` si no existe `package-lock.json`
- Uso consistente de `--legacy-peer-deps` en todas las instalaciones

### 3. **PM2 Process Management Errors**
```
Error: Process or namespace guiders-ssr could not be found
```

**🔍 Causa:** Gestión inadecuada de procesos PM2 y configuración incorrecta.

**✅ Solución Implementada:**
- Limpieza completa de procesos PM2 antes de iniciar
- Verificación de existencia del archivo `server.mjs`
- Configuración mejorada de PM2 con opciones de startup
- Health checks con reintentos automáticos

### 4. **Dependency Conflicts (ERESOLVE)**
```
Error: ERESOLVE conflicts between @angular/core@20.0.0 and @ngrx/signals@19.2.1
```

**✅ Solución Implementada:**
- Flag `--legacy-peer-deps` en todos los comandos npm
- Sección `overrides` en package.json para forzar versiones
- Verificación local exitosa del build

## 🛠️ Cambios Implementados en el Workflow

### **Instalación de Dependencias Mejorada**
```yaml
# Antes
run: npm ci

# Después  
run: npm ci --legacy-peer-deps
```

### **Copia de Archivos de Dependencias**
```yaml
# Nuevo: Copia package-lock.json también
- name: Deploy package.json and dependencies
  run: |
    sshpass -p "$SSH_PASSWORD" scp guiders-20/package.json server:/path/
    if [ -f guiders-20/package-lock.json ]; then
      sshpass -p "$SSH_PASSWORD" scp guiders-20/package-lock.json server:/path/
    fi
```

### **Instalación en Servidor con Fallback**
```yaml
# Nuevo: Verificación y fallback
run: |
  if [ -f package-lock.json ]; then
    npm ci --only=production --omit=dev --legacy-peer-deps
  else
    npm install --only=production --legacy-peer-deps
  fi
```

### **Gestión Mejorada de PM2**
```yaml
# Nuevo: Limpieza completa y verificaciones
run: |
  # Verificar archivo server.mjs existe
  if [ ! -f "./dist/server/server.mjs" ]; then
    echo "Error: server.mjs no encontrado"
    exit 1
  fi
  
  # Limpiar procesos PM2
  pm2 kill || echo "No había procesos para limpiar"
  
  # Iniciar con configuración mejorada
  pm2 start ecosystem.config.js --env production
```

## 🔍 Verificaciones Añadidas

### **Pre-deployment Checks**
1. ✅ Verificación de estructura de build
2. ✅ Validación de archivos críticos (`server.mjs`)
3. ✅ Confirmación de dependencias necesarias

### **Post-deployment Health Checks**
1. ✅ Estado de PM2
2. ✅ Respuesta HTTP de la aplicación
3. ✅ Verificación de logs de errores
4. ✅ Métricas del sistema

## 🚀 Script de Verificación Mejorado

El script `verify-deployment.sh` ahora incluye:
- ✅ Verificación robusta de PM2 (con y sin jq)
- ✅ Health checks con reintentos automáticos
- ✅ Análisis de logs de errores
- ✅ Métricas del sistema
- ✅ Validación de respuesta HTTP

## 📊 Configuración PM2 Optimizada

Nuevas características en `ecosystem.config.js`:
- ✅ `wait_ready`: Espera confirmación de startup
- ✅ `listen_timeout`: Timeout extendido para startup
- ✅ `max_restarts`: Límite de reintentos
- ✅ `health_check_grace_period`: Tiempo para health checks
- ✅ Logging mejorado con formato JSON

## 🎯 Comandos de Debugging Locales

```bash
# Verificar dependencias
npm ls @ngrx/signals

# Test del build local
cd guiders-20
npm ci --legacy-peer-deps
npm run build:prod

# Verificar estructura del build
ls -la dist/guiders-20/server/
file dist/guiders-20/server/server.mjs

# Test PM2 local
pm2 start ecosystem.config.js
pm2 status
pm2 logs guiders-ssr
```

## 🔮 Monitoreo Continuo

Para prevenir futuros problemas:

### **Alertas Recomendadas**
1. 📊 Monitoreo de memoria de PM2
2. 🚨 Alertas de fallos de deployment
3. 📈 Métricas de respuesta de la aplicación
4. 🔍 Logs de errores en tiempo real

### **Actualizaciones Pendientes**
1. 📦 Monitorear `@ngrx/signals@20.x` cuando esté disponible
2. 🔄 Revisar si se puede eliminar `--legacy-peer-deps`
3. ⚡ Optimizar tiempo de build y deployment
4. 🛡️ Añadir tests de integración para deployment

## 🎉 Estado Actual

✅ **Todos los problemas identificados han sido resueltos**
✅ **Workflow robusto con fallbacks y verificaciones**
✅ **Health checks automáticos implementados**
✅ **Documentación completa y troubleshooting guides**

El deployment ahora debería funcionar correctamente. En caso de nuevos errores, revisar los logs específicos y aplicar el troubleshooting correspondiente.
