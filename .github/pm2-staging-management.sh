#!/bin/bash

set -e

APP_NAME="guiders-frontend-staging"
TIMEOUT=30
MAX_RETRIES=3

echo "🔄 Gestión segura de PM2 para $APP_NAME..."

# Función para verificar si la app está corriendo
check_app_status() {
  pm2 list | grep -q "$APP_NAME.*online" && return 0 || return 1
}

# Función para esperar que la app esté corriendo
wait_for_app() {
  local retries=0
  while [ $retries -lt $MAX_RETRIES ]; do
    if check_app_status; then
      echo "✅ Aplicación está corriendo correctamente"
      return 0
    fi
    retries=$((retries + 1))
    echo "⏳ Esperando que la aplicación se inicie... (intento $retries/$MAX_RETRIES)"
    sleep 5
  done
  return 1
}

# Función para limpiar aplicaciones anteriores
cleanup_previous() {
  echo "🧹 Limpiando aplicaciones anteriores..."
  
  if pm2 list | grep -q "$APP_NAME"; then
    echo "🛑 Deteniendo aplicación anterior..."
    timeout $TIMEOUT pm2 stop "$APP_NAME" 2>/dev/null || echo "⚠️ Timeout o error deteniendo aplicación"
    
    echo "🗑️ Eliminando aplicación anterior..."
    timeout $TIMEOUT pm2 delete "$APP_NAME" 2>/dev/null || echo "⚠️ Timeout o error eliminando aplicación"
  else
    echo "ℹ️ No hay aplicación anterior para limpiar"
  fi
}

# Función para iniciar la aplicación
start_application() {
  echo "🚀 Iniciando aplicación staging..."
  
  if timeout $TIMEOUT pm2 start ecosystem.staging.config.js; then
    echo "✅ Comando PM2 start ejecutado exitosamente"
    return 0
  else
    echo "❌ Error ejecutando comando PM2 start"
    return 1
  fi
}

# Función para verificar la salud de la aplicación
health_check() {
  echo "🔍 Verificando salud de la aplicación..."
  
  # Esperar un momento para que la aplicación se inicie
  sleep 10
  
  # Verificar que el proceso está corriendo
  if ! check_app_status; then
    echo "❌ La aplicación no está corriendo en PM2"
    return 1
  fi
  
  # Verificar que el puerto está abierto
  if netstat -tulpn | grep -q ":4001"; then
    echo "✅ Puerto 4001 está abierto"
  else
    echo "⚠️ Puerto 4001 no está abierto, pero la aplicación puede estar iniciándose"
  fi
  
  # Intentar hacer una petición HTTP simple
  if curl -f -s --max-time 5 http://localhost:4001 > /dev/null 2>&1; then
    echo "✅ Aplicación responde a peticiones HTTP"
    return 0
  else
    echo "⚠️ Aplicación no responde todavía, pero puede estar iniciándose"
    # No fallar inmediatamente, dar otra oportunidad
    sleep 5
    if curl -f -s --max-time 5 http://localhost:4001 > /dev/null 2>&1; then
      echo "✅ Aplicación responde a peticiones HTTP (segundo intento)"
      return 0
    else
      echo "❌ Aplicación no responde a peticiones HTTP después de 2 intentos"
      return 1
    fi
  fi
}

# Función para mostrar logs en caso de error
show_error_logs() {
  echo "📋 Mostrando logs de error..."
  timeout 10 pm2 logs "$APP_NAME" --lines 20 --nostream 2>/dev/null || echo "⚠️ No se pudieron obtener los logs"
}

# Función principal
main() {
  echo "🏁 Iniciando gestión segura de PM2..."
  
  # Verificar que el archivo de configuración existe
  if [ ! -f "ecosystem.staging.config.js" ]; then
    echo "❌ Error: ecosystem.staging.config.js no encontrado"
    exit 1
  fi
  
  # Verificar que el archivo server.mjs existe
  if [ ! -f "./dist/guiders-20/server/server.mjs" ]; then
    echo "❌ Error: ./dist/guiders-20/server/server.mjs no encontrado"
    exit 1
  fi
  
  # Limpiar aplicaciones anteriores
  cleanup_previous
  
  # Iniciar nueva aplicación
  if start_application; then
    # Esperar y verificar que la aplicación está corriendo
    if wait_for_app; then
      # Verificar salud de la aplicación
      if health_check; then
        echo "💾 Guardando configuración PM2..."
        timeout 10 pm2 save || echo "⚠️ No se pudo guardar la configuración PM2"
        
        echo "📊 Estado final:"
        timeout 10 pm2 status || echo "⚠️ No se pudo mostrar el estado"
        
        echo "🎉 ¡Aplicación desplegada exitosamente!"
        exit 0
      else
        echo "❌ La aplicación no pasó el health check"
        show_error_logs
        exit 1
      fi
    else
      echo "❌ La aplicación no se inició correctamente"
      show_error_logs
      exit 1
    fi
  else
    echo "❌ Error al iniciar la aplicación con PM2"
    exit 1
  fi
}

# Ejecutar función principal
main
