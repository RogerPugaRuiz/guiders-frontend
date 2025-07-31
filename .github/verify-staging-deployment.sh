#!/bin/bash

set -e

APP_NAME="guiders-frontend-staging"
PORT=4001
DEPLOY_PATH="/var/www/guiders-frontend-staging"

echo "🔍 Verificación segura de deployment - Frontend Angular SSR"
echo "=================================================="

# Función para verificar PM2
check_pm2_status() {
  echo "📊 Verificando estado de PM2..."
  
  if pm2 list | grep -q "$APP_NAME"; then
    if pm2 list | grep -q "$APP_NAME.*online"; then
      echo "✅ Aplicación está corriendo en PM2"
      
      # Mostrar información detallada
      echo "📋 Información de la aplicación:"
      pm2 describe "$APP_NAME" | grep -E "(status|uptime|restarts|memory|cpu)" || echo "ℹ️ Información detallada no disponible"
      
      return 0
    else
      echo "❌ Aplicación existe en PM2 pero no está online"
      pm2 list | grep "$APP_NAME"
      return 1
    fi
  else
    echo "❌ Aplicación no encontrada en PM2"
    echo "📋 Aplicaciones PM2 actuales:"
    pm2 list
    return 1
  fi
}

# Función para verificar puerto
check_port() {
  echo "🌐 Verificando puerto $PORT..."
  
  if netstat -tulpn | grep -q ":$PORT"; then
    echo "✅ Puerto $PORT está abierto"
    
    # Mostrar qué proceso está usando el puerto
    echo "📋 Proceso usando el puerto:"
    netstat -tulpn | grep ":$PORT" | head -1
    
    return 0
  else
    echo "❌ Puerto $PORT no está abierto"
    echo "📋 Puertos abiertos en el sistema:"
    netstat -tulpn | grep LISTEN | head -10
    return 1
  fi
}

# Función para verificar respuesta HTTP
check_http_response() {
  echo "🔗 Verificando respuesta HTTP..."
  
  # Múltiples intentos para dar tiempo a la aplicación
  local max_attempts=3
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "  Intento $attempt/$max_attempts..."
    
    if curl -f -s --max-time 10 http://localhost:$PORT > /dev/null; then
      echo "✅ Aplicación responde correctamente"
      
      # Obtener información básica de la respuesta
      local status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT)
      echo "📋 Código de estado HTTP: $status_code"
      
      # Verificar que es una respuesta HTML (Angular SSR)
      local content_type=$(curl -s -I http://localhost:$PORT | grep -i content-type | head -1)
      echo "📋 Content-Type: $content_type"
      
      return 0
    else
      echo "  ❌ Intento $attempt falló"
      if [ $attempt -eq $max_attempts ]; then
        echo "❌ Aplicación no responde después de $max_attempts intentos"
        return 1
      fi
      sleep 5
      attempt=$((attempt + 1))
    fi
  done
}

# Función para verificar estructura de archivos
check_file_structure() {
  echo "📁 Verificando estructura de archivos..."
  
  cd "$DEPLOY_PATH" || {
    echo "❌ No se puede acceder al directorio $DEPLOY_PATH"
    return 1
  }
  
  # Verificar archivos críticos
  local critical_files=(
    "dist/guiders-20/server/server.mjs"
    "dist/guiders-20/browser"
    "package.json"
    "ecosystem.staging.config.js"
  )
  
  for file in "${critical_files[@]}"; do
    if [ -e "$file" ]; then
      echo "✅ $file existe"
    else
      echo "❌ $file no encontrado"
      return 1
    fi
  done
  
  # Mostrar tamaño del deployment
  echo "📊 Tamaño del deployment:"
  du -sh "$DEPLOY_PATH"
  
  # Mostrar estructura básica
  echo "📁 Estructura principal:"
  ls -la "$DEPLOY_PATH/dist/guiders-20/" | head -10
  
  return 0
}

# Función para verificar logs
check_logs() {
  echo "📋 Verificando logs..."
  
  local log_files=(
    "/var/log/pm2/guiders-frontend-staging.log"
    "/var/log/pm2/guiders-frontend-staging-error.log"
    "/var/log/pm2/guiders-frontend-staging-out.log"
  )
  
  for log_file in "${log_files[@]}"; do
    if [ -f "$log_file" ]; then
      echo "✅ $log_file existe"
      
      # Mostrar últimas líneas si hay contenido
      if [ -s "$log_file" ]; then
        echo "📄 Últimas 5 líneas de $log_file:"
        tail -5 "$log_file" | sed 's/^/    /'
        echo ""
      else
        echo "ℹ️ $log_file está vacío"
      fi
    else
      echo "⚠️ $log_file no encontrado (puede ser normal si es el primer deployment)"
    fi
  done
}

# Función para verificar recursos del sistema
check_system_resources() {
  echo "💻 Verificando recursos del sistema..."
  
  # Memoria
  echo "💾 Uso de memoria:"
  free -h | head -2
  
  # Disco
  echo "💽 Uso de disco:"
  df -h / | tail -1
  
  # Procesos Node.js
  echo "🔄 Procesos Node.js:"
  ps aux | grep -E "(node|pm2)" | grep -v grep | head -5 || echo "No se encontraron procesos Node.js"
}

# Función para generar reporte de salud
generate_health_report() {
  echo ""
  echo "📊 REPORTE DE SALUD DEL DEPLOYMENT"
  echo "================================="
  echo "- Aplicación: $APP_NAME"
  echo "- Puerto: $PORT"
  echo "- Path: $DEPLOY_PATH"
  echo "- Timestamp: $(date)"
  echo ""
  
  local checks_passed=0
  local total_checks=5
  
  echo "✅ Verificaciones realizadas:"
  
  if check_pm2_status; then
    echo "  ✅ PM2 Status: PASS"
    checks_passed=$((checks_passed + 1))
  else
    echo "  ❌ PM2 Status: FAIL"
  fi
  
  if check_port; then
    echo "  ✅ Puerto: PASS"
    checks_passed=$((checks_passed + 1))
  else
    echo "  ❌ Puerto: FAIL"
  fi
  
  if check_http_response; then
    echo "  ✅ HTTP Response: PASS"
    checks_passed=$((checks_passed + 1))
  else
    echo "  ❌ HTTP Response: FAIL"
  fi
  
  if check_file_structure; then
    echo "  ✅ File Structure: PASS"
    checks_passed=$((checks_passed + 1))
  else
    echo "  ❌ File Structure: FAIL"
  fi
  
  # Los logs no son críticos para el deployment
  check_logs
  echo "  ℹ️ Logs: INFORMATIONAL"
  checks_passed=$((checks_passed + 1))
  
  echo ""
  echo "📊 Resultado: $checks_passed/$total_checks verificaciones pasaron"
  
  if [ $checks_passed -eq $total_checks ]; then
    echo "🎉 ¡DEPLOYMENT EXITOSO! Todas las verificaciones pasaron."
    return 0
  elif [ $checks_passed -ge 4 ]; then
    echo "⚠️ DEPLOYMENT PARCIALMENTE EXITOSO. Revisar issues menores."
    return 0
  else
    echo "❌ DEPLOYMENT CON PROBLEMAS. Se requiere intervención."
    return 1
  fi
}

# Función principal
main() {
  echo "🚀 Iniciando verificación de deployment..."
  echo ""
  
  # Verificar que estamos en el directorio correcto
  if [ ! -d "$DEPLOY_PATH" ]; then
    echo "❌ Error: Directorio de deployment no encontrado: $DEPLOY_PATH"
    exit 1
  fi
  
  # Ejecutar verificaciones
  check_system_resources
  echo ""
  
  # Generar reporte final
  if generate_health_report; then
    echo ""
    echo "✅ Verificación completada exitosamente"
    exit 0
  else
    echo ""
    echo "❌ Verificación completada con errores"
    exit 1
  fi
}

# Ejecutar función principal
main
