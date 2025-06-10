# Resumen de Mejoras: Protección de Servicios PM2 Durante Deployment

## 🚨 Problema Original

El workflow de deployment anterior podía **eliminar accidentalmente otros servicios PM2** corriendo en el servidor debido a comandos destructivos como:

```bash
pm2 kill              # ❌ ELIMINA TODOS los procesos PM2
pm2 restart all        # ❌ REINICIA TODOS los procesos
pm2 stop all          # ❌ DETIENE TODOS los procesos
```

## ✅ Soluciones Implementadas

### 1. **Gestión Selectiva de Procesos PM2**

**Antes (Peligroso):**
```bash
pm2 kill  # Eliminaba TODOS los servicios PM2
```

**Ahora (Seguro):**
```bash
# Solo gestiona guiders-ssr específicamente
if pm2 list | grep -q "guiders-ssr"; then
    pm2 stop guiders-ssr
    pm2 delete guiders-ssr
fi
pm2 start ecosystem.config.js --env production
```

### 2. **Script de Gestión Segura (`pm2-safe-management.sh`)**

Nuevo script que proporciona:
- ✅ **Gestión granular** solo de `guiders-ssr`
- ✅ **Verificación de puertos** específicos
- ✅ **Logs colorizados** y detallados
- ✅ **Protección** de otros servicios PM2

**Comandos disponibles:**
```bash
./pm2-safe-management.sh start      # Solo inicia guiders-ssr
./pm2-safe-management.sh stop       # Solo detiene guiders-ssr
./pm2-safe-management.sh restart    # Solo reinicia guiders-ssr
./pm2-safe-management.sh status     # Estado de TODAS las apps (lectura)
./pm2-safe-management.sh logs       # Logs solo de guiders-ssr
./pm2-safe-management.sh port-check # Verifica puerto 4000
```

### 3. **Verificación Inteligente de Puertos**

**Antes:**
```bash
# Mataba cualquier proceso en puerto 4000
kill -9 $(lsof -ti:4000)
```

**Ahora:**
```bash
# Solo mata procesos relacionados con guiders-ssr
PROCESS_PID=$(lsof -ti:4000)
if ps -p $PROCESS_PID -o cmd= | grep -q "guiders-ssr\|server.mjs"; then
    echo "🔄 Liberando puerto 4000 de proceso guiders-ssr..."
    kill -9 $PROCESS_PID
else
    echo "⚠️ Puerto 4000 ocupado por otro servicio (no guiders-ssr)"
    echo "📝 Proceso: $(ps -p $PROCESS_PID -o cmd=)"
fi
```

### 4. **Script de Verificación Mejorado (`verify-deployment-safe.sh`)**

Características del nuevo script:
- ✅ **Solo lectura** de estado PM2 general
- ✅ **Verificación específica** de guiders-ssr
- ✅ **Análisis de logs** sin afectar otros servicios
- ✅ **Diagnóstico detallado** con colores
- ✅ **Información de recursos** (CPU, memoria)

### 5. **Monitoreo de Estado Completo**

El workflow ahora incluye:
```bash
# Mostrar estado de TODAS las aplicaciones PM2 (solo lectura)
pm2 status

# Verificar específicamente que guiders-ssr está online
if pm2 list | grep -q "guiders-ssr.*online"; then
    echo "✅ guiders-ssr está corriendo correctamente"
fi

# Detalles específicos solo de nuestra app
pm2 describe guiders-ssr
```

## 📊 Workflow Actualizado

### Cambios Principales en `deploy.yml`:

1. **Sección de Build**: Usa rutas correctas de Angular 20
2. **Gestión PM2**: Solo afecta a `guiders-ssr`
3. **Scripts Seguros**: Usa `pm2-safe-management.sh`
4. **Verificación**: Usa `verify-deployment-safe.sh`
5. **Logging Mejorado**: Más información, menor riesgo

### Archivos Actualizados:

- ✅ `.github/workflows/deploy.yml` - Workflow principal
- ✅ `.github/pm2-safe-management.sh` - Gestión segura de PM2
- ✅ `.github/verify-deployment-safe.sh` - Verificación sin riesgos
- ✅ `.github/PM2-SAFE-MANAGEMENT.md` - Documentación completa

## 🔒 Garantías de Seguridad

### ✅ Lo que NUNCA se ejecuta ahora:
- `pm2 kill` (elimina todos los procesos)
- `pm2 restart all` (reinicia todos los procesos)
- `pm2 stop all` (detiene todos los procesos)
- `pm2 delete all` (elimina todos los procesos)
- `pm2 flush` (borra todos los logs)

### ✅ Lo que SÍ se ejecuta (seguro):
- `pm2 list` (solo lectura)
- `pm2 status` (solo lectura)
- `pm2 stop guiders-ssr` (solo nuestra app)
- `pm2 delete guiders-ssr` (solo nuestra app)
- `pm2 start ecosystem.config.js` (solo nuestra app)
- `pm2 describe guiders-ssr` (solo lectura de nuestra app)
- `pm2 logs guiders-ssr` (solo logs de nuestra app)

## 🎯 Beneficios Inmediatos

1. **Cero Impacto** en otros servicios PM2
2. **Deployment Más Confiable** con mejor manejo de errores
3. **Debugging Mejorado** con logs detallados y colorizados
4. **Gestión Granular** de cada aplicación independientemente
5. **Rollback Más Seguro** sin afectar otros servicios
6. **Monitoreo Detallado** del estado de todos los servicios

## 🚀 Uso en Producción

Para usar estas mejoras:

1. **Push to main branch** - Se ejecuta automáticamente
2. **Manual deployment** - Usa `workflow_dispatch`
3. **Gestión manual en servidor**:
   ```bash
   cd /var/www/guiders
   ./pm2-safe-management.sh status    # Ver estado
   ./pm2-safe-management.sh restart   # Reiniciar solo guiders-ssr
   ./verify-deployment-safe.sh        # Verificar salud
   ```

## 📝 Notas para Administradores

- **Otros servicios PM2** permanecen intactos durante el deployment
- **Configuración PM2** existente se preserva
- **Logs de otros servicios** no se ven afectados
- **Puertos específicos** se gestionan de forma inteligente
- **Backup automático** antes de cada deployment

Esta implementación garantiza que el deployment de `guiders-ssr` sea completamente **aislado y seguro** para el resto del ecosistema de servicios en el servidor.
