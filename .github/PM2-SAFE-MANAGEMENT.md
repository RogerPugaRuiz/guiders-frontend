# Gestión Segura de PM2 para Múltiples Servicios

## Problema Identificado

Durante el deployment, el workflow anterior utilizaba comandos que podían afectar otros servicios PM2 corriendo en el servidor:

- `pm2 kill` - **ELIMINA TODOS** los procesos PM2
- `pm2 restart all` - **REINICIA TODOS** los procesos PM2

Esto causaba interrupciones en otros servicios críticos que pudieran estar corriendo en el mismo servidor.

## Solución Implementada

### 1. Gestión Selectiva de Procesos

El nuevo workflow solo gestiona la aplicación específica `guiders-ssr`:

```bash
# ✅ CORRECTO - Solo afecta a guiders-ssr
pm2 stop guiders-ssr
pm2 delete guiders-ssr
pm2 start ecosystem.config.js --env production

# ❌ INCORRECTO - Afecta a todos los servicios
pm2 kill
pm2 restart all
```

### 2. Script de Gestión Segura

Se creó `pm2-safe-management.sh` que incluye:

- **Verificación de aplicaciones existentes** antes de actuar
- **Gestión granular** solo de `guiders-ssr`
- **Verificación de puertos** específicos
- **Logging detallado** sin afectar otros servicios

### 3. Verificación de Puerto Específico

```bash
# Verificar qué proceso usa el puerto 4000
lsof -ti:4000

# Solo terminar procesos relacionados con guiders-ssr
if ps -p $PROCESS_PID -o cmd= | grep -q "guiders-ssr\|server.mjs"; then
    kill -9 $PROCESS_PID
fi
```

## Comandos Seguros vs Peligrosos

### ✅ Comandos Seguros (Implementados)

```bash
# Listar todas las apps sin modificarlas
pm2 list
pm2 status

# Gestionar solo la app específica
pm2 stop guiders-ssr
pm2 restart guiders-ssr
pm2 delete guiders-ssr
pm2 logs guiders-ssr

# Guardar configuración actual
pm2 save

# Ver detalles de una app específica
pm2 describe guiders-ssr
```

### ❌ Comandos Peligrosos (Evitados)

```bash
# NUNCA usar estos en un servidor compartido:
pm2 kill              # Mata TODOS los procesos PM2
pm2 restart all        # Reinicia TODOS los procesos
pm2 stop all          # Detiene TODOS los procesos
pm2 delete all        # Elimina TODOS los procesos
pm2 flush             # Borra TODOS los logs
```

## Uso del Script de Gestión

### Comandos Disponibles

```bash
# Hacer el script ejecutable
chmod +x pm2-safe-management.sh

# Ver estado de todas las apps + verificar puerto
./pm2-safe-management.sh status

# Iniciar solo guiders-ssr
./pm2-safe-management.sh start

# Detener solo guiders-ssr
./pm2-safe-management.sh stop

# Reiniciar solo guiders-ssr
./pm2-safe-management.sh restart

# Ver logs de guiders-ssr
./pm2-safe-management.sh logs

# Verificar qué usa el puerto 4000
./pm2-safe-management.sh port-check
```

### Características del Script

1. **Verificación de Existencia**: Comprueba si la app existe antes de actuar
2. **Gestión Selectiva**: Solo modifica `guiders-ssr`
3. **Verificación de Puerto**: Identifica conflictos de puerto de forma inteligente
4. **Logging Colorizado**: Output claro y fácil de leer
5. **Manejo de Errores**: Continúa funcionando aunque algunos comandos fallen

## Beneficios de la Nueva Implementación

### 1. Aislamiento de Servicios
- Otros servicios PM2 no se ven afectados
- Cada servicio mantiene su configuración independiente
- Sin interrupciones no deseadas

### 2. Deployment Más Confiable
- Menor riesgo de fallar otros servicios
- Mejor logging y debugging
- Rollback más sencillo si algo falla

### 3. Mejor Monitoreo
- Estado claro de todos los servicios
- Identificación específica de problemas
- Logs separados por aplicación

## Verificación Post-Deployment

El workflow ahora incluye verificaciones que no afectan otros servicios:

```bash
# Verificar que guiders-ssr específicamente está corriendo
pm2 list | grep -q "guiders-ssr.*online"

# Mostrar estado de todas las apps (solo lectura)
pm2 status

# Verificar respuesta HTTP específica
curl -f -s http://localhost:4000

# Logs específicos de guiders-ssr
pm2 logs guiders-ssr --lines 20 --nostream
```

## Recomendaciones para Producción

### 1. Usar Nombres Únicos para Apps
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'guiders-ssr',        // Nombre único
    script: './dist/server/server.mjs',
    instances: 'max',
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000                // Puerto específico
    }
  }]
};
```

### 2. Documentar Servicios en el Servidor
Mantener un registro de qué servicios PM2 están corriendo:

```bash
# Crear inventario de servicios
pm2 list > /var/log/pm2-services-inventory.txt
```

### 3. Configurar Monitoreo
```bash
# Configurar PM2 monitoring (opcional)
pm2 monitor [key]

# Configurar logs rotativos
pm2 install pm2-logrotate
```

### 4. Backup de Configuración PM2
```bash
# Guardar configuración actual
pm2 save

# Hacer backup de la configuración
cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.backup
```

## Resolución de Problemas

### Si Otro Servicio Usa el Puerto 4000

1. **Identificar el servicio:**
   ```bash
   ./pm2-safe-management.sh port-check
   ```

2. **Cambiar puerto de guiders-ssr:**
   ```bash
   # En ecosystem.config.js cambiar PORT a 4001
   # Actualizar configuración de Nginx
   ```

3. **Verificar disponibilidad de puerto:**
   ```bash
   netstat -tlnp | grep :4001
   ```

### Si PM2 No Responde

1. **Verificar proceso PM2:**
   ```bash
   ps aux | grep PM2
   ```

2. **Reiniciar PM2 daemon (último recurso):**
   ```bash
   pm2 kill
   pm2 resurrect  # Solo restaura apps guardadas
   ```

### Si Hay Conflictos de Dependencias

1. **Verificar versiones de Node.js:**
   ```bash
   node --version
   npm --version
   ```

2. **Limpiar caché de npm:**
   ```bash
   npm cache clean --force
   ```

3. **Reinstalar dependencias:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

## Conclusión

Esta implementación garantiza que el deployment de `guiders-ssr` sea:

- **Seguro** para otros servicios en el servidor
- **Confiable** con mejor manejo de errores
- **Monitoreado** con logging detallado
- **Mantenible** con scripts reutilizables

El enfoque selectivo de PM2 es crucial en entornos de producción donde múltiples servicios comparten el mismo servidor.
