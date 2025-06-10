#!/bin/bash

# Script para gestión segura de PM2 - Solo gestiona guiders-ssr
# Uso: ./pm2-safe-management.sh [start|stop|restart|status|logs]

APP_NAME="guiders-ssr"
SCRIPT_PATH="./dist/server/server.mjs"
ECOSYSTEM_FILE="ecosystem.config.js"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Función para verificar si la app existe en PM2
app_exists() {
    timeout 10 pm2 list | grep -q "$APP_NAME"
}

# Función para verificar si la app está corriendo
app_running() {
    timeout 10 pm2 list | grep -q "$APP_NAME.*online"
}

# Función para mostrar estado de todas las apps (sin modificarlas)
show_all_status() {
    log "Estado de todas las aplicaciones PM2:"
    timeout 15 pm2 status || warning "No se pudo obtener el estado de PM2"
}

# Función para mostrar estado específico de nuestra app
show_app_status() {
    log "Estado específico de $APP_NAME:"
    if app_exists; then
        timeout 10 pm2 describe "$APP_NAME" | grep -E "(name|status|pid|uptime|memory|cpu)"
    else
        warning "La aplicación $APP_NAME no existe en PM2"
    fi
}

# Función para iniciar la aplicación
start_app() {
    log "Iniciando aplicación $APP_NAME..."
    
    # Verificar que el archivo de script existe
    if [ ! -f "$SCRIPT_PATH" ]; then
        error "Archivo del servidor no encontrado: $SCRIPT_PATH"
        return 1
    fi
    
    # Verificar que el archivo ecosystem existe
    if [ ! -f "$ECOSYSTEM_FILE" ]; then
        error "Archivo ecosystem no encontrado: $ECOSYSTEM_FILE"
        return 1
    fi
    
    if app_running; then
        warning "La aplicación $APP_NAME ya está corriendo"
        show_app_status
        return 0
    fi
    
    # Si existe pero no está corriendo, eliminarla primero
    if app_exists; then
        log "Eliminando instancia anterior de $APP_NAME..."
        timeout 15 pm2 delete "$APP_NAME" || warning "No se pudo eliminar la instancia anterior"
    fi
    
    # Iniciar aplicación
    timeout 30 pm2 start "$ECOSYSTEM_FILE" --env production
    
    if app_running; then
        success "Aplicación $APP_NAME iniciada exitosamente"
        
        # Guardar configuración PM2
        timeout 10 pm2 save || warning "No se pudo guardar la configuración PM2"
        
        # Esperar un momento y verificar estado
        sleep 3
        show_app_status
        
        # Verificar respuesta HTTP con timeout más corto
        log "Verificando respuesta HTTP en puerto 4000..."
        for i in {1..3}; do
            if timeout 5 curl -f -s http://localhost:4000 > /dev/null 2>&1; then
                success "Aplicación respondiendo correctamente en puerto 4000"
                return 0
            else
                warning "Intento $i/3 - Esperando respuesta del servidor..."
                sleep 3
            fi
        done
        
        warning "La aplicación no responde en puerto 4000 después de 3 intentos"
        log "Mostrando logs recientes:"
        timeout 10 pm2 logs "$APP_NAME" --lines 10 --nostream || warning "Timeout en logs"
        return 1
    else
        error "No se pudo iniciar la aplicación $APP_NAME"
        timeout 10 pm2 logs "$APP_NAME" --lines 10 --nostream || warning "Timeout en logs de error"
        return 1
    fi
}

# Función para detener la aplicación
stop_app() {
    log "Deteniendo aplicación $APP_NAME..."
    
    if ! app_exists; then
        warning "La aplicación $APP_NAME no existe en PM2"
        return 0
    fi
    
    timeout 15 pm2 stop "$APP_NAME" || warning "Timeout al detener aplicación"
    timeout 15 pm2 delete "$APP_NAME" || warning "Timeout al eliminar aplicación"
    
    if ! app_exists; then
        success "Aplicación $APP_NAME detenida y eliminada exitosamente"
    else
        error "No se pudo detener completamente la aplicación $APP_NAME"
        return 1
    fi
}

# Función para reiniciar la aplicación
restart_app() {
    log "Reiniciando aplicación $APP_NAME..."
    stop_app
    sleep 2
    start_app
}

# Función para mostrar logs
show_logs() {
    log "Mostrando logs de $APP_NAME..."
    if app_exists; then
        timeout 15 pm2 logs "$APP_NAME" --lines 50 || warning "Timeout al mostrar logs"
    else
        warning "La aplicación $APP_NAME no existe en PM2"
    fi
}

# Función para verificar puerto 4000
check_port() {
    log "Verificando puerto 4000..."
    if lsof -ti:4000 > /dev/null 2>&1; then
        PROCESS_PID=$(lsof -ti:4000)
        PROCESS_CMD=$(ps -p $PROCESS_PID -o cmd= 2>/dev/null || echo "Comando no disponible")
        warning "Puerto 4000 está ocupado por PID: $PROCESS_PID"
        log "Comando del proceso: $PROCESS_CMD"
        
        # Verificar si es nuestro proceso
        if echo "$PROCESS_CMD" | grep -q "guiders-ssr\|server.mjs"; then
            log "El proceso parece ser de nuestra aplicación guiders-ssr"
        else
            warning "El proceso NO parece ser de nuestra aplicación"
        fi
    else
        success "Puerto 4000 está libre"
    fi
}

# Función principal
main() {
    case "${1:-status}" in
        "start")
            start_app
            ;;
        "stop")
            stop_app
            ;;
        "restart")
            restart_app
            ;;
        "status")
            show_all_status
            echo ""
            show_app_status
            echo ""
            check_port
            ;;
        "logs")
            show_logs
            ;;
        "port-check")
            check_port
            ;;
        *)
            echo "Uso: $0 [start|stop|restart|status|logs|port-check]"
            echo ""
            echo "Comandos:"
            echo "  start      - Iniciar la aplicación guiders-ssr"
            echo "  stop       - Detener la aplicación guiders-ssr"
            echo "  restart    - Reiniciar la aplicación guiders-ssr"
            echo "  status     - Mostrar estado de todas las apps y verificar puerto"
            echo "  logs       - Mostrar logs de guiders-ssr"
            echo "  port-check - Verificar qué proceso usa el puerto 4000"
            exit 1
            ;;
    esac
}

# Verificar que PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    error "PM2 no está instalado. Instálalo con: npm install -g pm2"
    exit 1
fi

# Ejecutar función principal
main "$@"
