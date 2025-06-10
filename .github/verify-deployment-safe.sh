#!/bin/bash

# Script de verificación post-deployment para Angular SSR
# Verifica que la aplicación guiders-ssr esté funcionando correctamente
# SIN AFECTAR otros servicios PM2

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_NAME="guiders-ssr"
PORT=4000
MAX_RETRIES=10

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

log "🔍 Iniciando verificación post-deployment..."

# 1. Verificar que PM2 está funcionando
log "1. Verificando estado de PM2..."
if ! command -v pm2 &> /dev/null; then
    error "PM2 no está instalado"
    exit 1
fi

# Mostrar estado de todas las aplicaciones PM2 (solo lectura)
log "📊 Estado de todas las aplicaciones PM2:"
pm2 status || warning "No se pudo obtener el estado de PM2"

# 2. Verificar que guiders-ssr específicamente está en PM2
log "2. Verificando aplicación $APP_NAME en PM2..."
if pm2 list | grep -q "$APP_NAME"; then
    if pm2 list | grep -q "$APP_NAME.*online"; then
        success "Aplicación $APP_NAME está corriendo en PM2"
        
        # Mostrar detalles específicos de nuestra aplicación
        log "📋 Detalles de $APP_NAME:"
        pm2 describe "$APP_NAME" | grep -E "(name|status|pid|uptime|memory|cpu|restart)" || true
    else
        error "Aplicación $APP_NAME existe pero no está online"
        pm2 describe "$APP_NAME" || true
        exit 1
    fi
else
    error "Aplicación $APP_NAME no encontrada en PM2"
    exit 1
fi

# 3. Verificar que el puerto está siendo usado por nuestra aplicación
log "3. Verificando puerto $PORT..."
if lsof -ti:$PORT > /dev/null 2>&1; then
    PROCESS_PID=$(lsof -ti:$PORT)
    PROCESS_CMD=$(ps -p $PROCESS_PID -o cmd= 2>/dev/null || echo "Comando no disponible")
    
    if echo "$PROCESS_CMD" | grep -q "guiders-ssr\|server.mjs"; then
        success "Puerto $PORT está siendo usado por nuestra aplicación"
        log "📝 Proceso: $PROCESS_CMD"
    else
        warning "Puerto $PORT está ocupado por otro proceso"
        log "📝 Proceso: $PROCESS_CMD"
        log "🔍 Verificando si es un proceso relacionado..."
    fi
else
    error "Puerto $PORT no está siendo usado"
    exit 1
fi

# 4. Verificar respuesta HTTP
log "4. Verificando respuesta HTTP en http://localhost:$PORT..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s -m 10 "http://localhost:$PORT" > /dev/null 2>&1; then
        success "Aplicación responde correctamente en puerto $PORT"
        
        # Obtener información básica de la respuesta
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT")
        log "📊 Código de respuesta HTTP: $HTTP_STATUS"
        
        # Verificar que es una respuesta HTML válida (Angular SSR)
        RESPONSE_CONTENT=$(curl -s -m 5 "http://localhost:$PORT" | head -10)
        if echo "$RESPONSE_CONTENT" | grep -q "<!DOCTYPE html>\|<html"; then
            success "Respuesta contiene HTML válido (SSR funcionando)"
        else
            warning "Respuesta no parece ser HTML válido"
            log "📄 Primeras líneas de la respuesta:"
            echo "$RESPONSE_CONTENT"
        fi
        break
    else
        warning "Intento $i/$MAX_RETRIES - Aplicación no responde, esperando..."
        if [ $i -eq $MAX_RETRIES ]; then
            error "Aplicación no responde después de $MAX_RETRIES intentos"
            
            # Mostrar logs recientes para debugging
            log "📋 Mostrando logs recientes de $APP_NAME:"
            pm2 logs "$APP_NAME" --lines 20 --nostream || true
            
            exit 1
        fi
        sleep 5
    fi
done

# 5. Verificar archivos de build
log "5. Verificando archivos de build..."
if [ -f "./dist/server/server.mjs" ]; then
    success "Archivo servidor SSR encontrado"
    
    # Verificar tamaño del archivo (debería ser > 0)
    FILE_SIZE=$(stat -f%z "./dist/server/server.mjs" 2>/dev/null || stat -c%s "./dist/server/server.mjs" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -gt 0 ]; then
        log "📊 Tamaño del archivo servidor: $FILE_SIZE bytes"
    else
        warning "Archivo servidor está vacío"
    fi
else
    error "Archivo servidor SSR no encontrado"
    exit 1
fi

if [ -d "./dist/browser" ]; then
    success "Directorio cliente (browser) encontrado"
    
    # Contar archivos en el directorio browser
    BROWSER_FILES=$(find "./dist/browser" -type f | wc -l)
    log "📊 Archivos en directorio browser: $BROWSER_FILES"
    
    # Verificar que index.html existe
    if [ -f "./dist/browser/index.html" ]; then
        success "Archivo index.html encontrado"
    else
        warning "Archivo index.html no encontrado"
    fi
else
    error "Directorio cliente (browser) no encontrado"
    exit 1
fi

# 6. Verificar logs recientes
log "6. Verificando logs recientes..."
if pm2 logs "$APP_NAME" --lines 5 --nostream > /dev/null 2>&1; then
    success "Logs de aplicación accesibles"
    
    # Buscar errores recientes en los logs
    ERROR_COUNT=$(pm2 logs "$APP_NAME" --lines 50 --nostream 2>/dev/null | grep -i "error\|exception\|fail" | wc -l)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        success "No se encontraron errores recientes en los logs"
    else
        warning "Se encontraron $ERROR_COUNT posibles errores en logs recientes"
        log "📋 Últimos errores/warnings:"
        pm2 logs "$APP_NAME" --lines 20 --nostream 2>/dev/null | grep -i "error\|exception\|fail\|warn" | tail -5 || true
    fi
else
    warning "No se pudieron acceder a los logs de la aplicación"
fi

# 7. Verificar memoria y CPU
log "7. Verificando uso de recursos..."
if command -v pm2 &> /dev/null; then
    MEMORY_USAGE=$(pm2 describe "$APP_NAME" 2>/dev/null | grep "memory usage" | head -1 || echo "No disponible")
    CPU_USAGE=$(pm2 describe "$APP_NAME" 2>/dev/null | grep "cpu usage" | head -1 || echo "No disponible")
    
    log "📊 Uso de memoria: $MEMORY_USAGE"
    log "📊 Uso de CPU: $CPU_USAGE"
fi

# 8. Verificar tiempo de actividad
log "8. Verificando tiempo de actividad..."
UPTIME=$(pm2 describe "$APP_NAME" 2>/dev/null | grep "uptime" | head -1 || echo "No disponible")
log "📊 Tiempo activo: $UPTIME"

# 9. Resumen final
echo ""
log "🎉 Verificación post-deployment completada"
echo ""
success "✅ Aplicación $APP_NAME está funcionando correctamente"
success "✅ Responde en http://localhost:$PORT"
success "✅ Archivos de build están presentes"
success "✅ PM2 gestiona la aplicación correctamente"

# Mostrar información de contacto para debugging
echo ""
log "📋 Para debugging adicional:"
log "   - Ver logs: pm2 logs $APP_NAME"
log "   - Estado detallado: pm2 describe $APP_NAME"
log "   - Reiniciar app: pm2 restart $APP_NAME"
log "   - Ver todas las apps: pm2 status"

exit 0
