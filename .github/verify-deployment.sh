#!/bin/bash
# Script de verificación post-deployment
# verify-deployment.sh

echo "🔍 Iniciando verificación post-deployment..."

# Variables
SERVER_URL="http://localhost:4000"
HEALTH_ENDPOINT="${SERVER_URL}/health"
MAX_RETRIES=30
RETRY_DELAY=2

# Función para verificar HTTP status
check_http_status() {
    local url=$1
    local expected_status=${2:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" -eq "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# Función para verificar que PM2 está ejecutando la aplicación
check_pm2_status() {
    local app_name="guiders-ssr"
    
    # Verificar que PM2 está instalado
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 no está instalado"
        return 1
    fi
    
    # Verificar estado de la aplicación
    pm2_status=$(pm2 jlist | jq -r ".[] | select(.name==\"$app_name\") | .pm2_env.status" 2>/dev/null)
    
    if [ "$pm2_status" = "online" ]; then
        echo "✅ PM2: Aplicación '$app_name' está en línea"
        return 0
    else
        echo "❌ PM2: Aplicación '$app_name' no está en línea (status: $pm2_status)"
        return 1
    fi
}

# Función para verificar logs de errores recientes
check_error_logs() {
    local log_file="./logs/err.log"
    
    if [ -f "$log_file" ]; then
        # Buscar errores en los últimos 5 minutos
        recent_errors=$(find "$log_file" -mmin -5 -exec grep -l "ERROR\|FATAL\|Exception" {} \; 2>/dev/null)
        
        if [ -n "$recent_errors" ]; then
            echo "⚠️ Se encontraron errores recientes en los logs:"
            tail -10 "$log_file"
            return 1
        else
            echo "✅ No se encontraron errores recientes en los logs"
            return 0
        fi
    else
        echo "⚠️ Archivo de log de errores no encontrado: $log_file"
        return 1
    fi
}

# Función principal de verificación
main() {
    local all_checks_passed=true
    
    echo "📊 Verificando estado de PM2..."
    if ! check_pm2_status; then
        all_checks_passed=false
    fi
    
    echo "🌐 Verificando respuesta HTTP..."
    retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if check_http_status "$SERVER_URL" 200; then
            echo "✅ Servidor respondiendo correctamente en $SERVER_URL"
            break
        else
            retry_count=$((retry_count + 1))
            echo "⏳ Intento $retry_count/$MAX_RETRIES - Esperando respuesta del servidor..."
            sleep $RETRY_DELAY
        fi
    done
    
    if [ $retry_count -eq $MAX_RETRIES ]; then
        echo "❌ Servidor no responde después de $MAX_RETRIES intentos"
        all_checks_passed=false
    fi
    
    # Verificar endpoint de salud si existe
    echo "🏥 Verificando endpoint de health check..."
    if check_http_status "$HEALTH_ENDPOINT" 200; then
        echo "✅ Health check OK"
    else
        echo "⚠️ Health check no disponible (esto es normal si no está implementado)"
    fi
    
    echo "📋 Verificando logs de errores..."
    if ! check_error_logs; then
        echo "⚠️ Se encontraron problemas en los logs, pero el deployment continúa"
    fi
    
    # Mostrar información del sistema
    echo "📊 Información del sistema:"
    echo "- CPU: $(nproc) cores"
    echo "- RAM: $(free -h | awk '/^Mem:/ {print $2}') total, $(free -h | awk '/^Mem:/ {print $7}') disponible"
    echo "- Disk: $(df -h / | awk 'NR==2 {print $4}') disponible en /"
    echo "- Node.js: $(node --version)"
    echo "- PM2: $(pm2 --version)"
    
    # Mostrar estado detallado de PM2
    echo "📊 Estado detallado de PM2:"
    pm2 status
    
    if [ "$all_checks_passed" = true ]; then
        echo "🎉 ¡Verificación post-deployment completada exitosamente!"
        exit 0
    else
        echo "❌ Algunas verificaciones fallaron. Revisa los logs para más detalles."
        exit 1
    fi
}

# Ejecutar verificación
main "$@"
