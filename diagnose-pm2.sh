#!/bin/bash

# Script de diagnóstico para PM2 staging
echo "🔍 Diagnóstico de PM2 para Guiders Frontend Staging"
echo "=================================================="

PROJECT_NAME="guiders-frontend-staging"
DEPLOY_PATH="/var/www/guiders-frontend-staging"

echo ""
echo "1. 📊 Estado actual de PM2:"
pm2 status

echo ""
echo "2. 📂 Verificando estructura de archivos:"
echo "Directorio de deploy: $DEPLOY_PATH"
if [ -d "$DEPLOY_PATH" ]; then
    echo "✅ Directorio existe"
    echo "Contenido del directorio:"
    ls -la "$DEPLOY_PATH"
    
    echo ""
    echo "Verificando archivo server.mjs:"
    if [ -f "$DEPLOY_PATH/dist/guiders-20/server/server.mjs" ]; then
        echo "✅ server.mjs existe"
        echo "Tamaño: $(stat -c%s "$DEPLOY_PATH/dist/guiders-20/server/server.mjs" 2>/dev/null || stat -f%z "$DEPLOY_PATH/dist/guiders-20/server/server.mjs") bytes"
    else
        echo "❌ server.mjs NO existe"
        echo "Estructura del directorio dist:"
        find "$DEPLOY_PATH" -name "*.mjs" -o -name "server*" 2>/dev/null || echo "No se encontraron archivos server"
    fi
else
    echo "❌ Directorio $DEPLOY_PATH no existe"
fi

echo ""
echo "3. 🔧 Verificando configuración de PM2:"
PM2_CONFIG="$DEPLOY_PATH/.github/ecosystem.staging.config.js"
if [ -f "$PM2_CONFIG" ]; then
    echo "✅ Configuración PM2 existe"
    echo "Contenido de la configuración:"
    cat "$PM2_CONFIG"
else
    echo "❌ Configuración PM2 NO existe en $PM2_CONFIG"
fi

echo ""
echo "4. 📝 Logs de PM2:"
echo "Logs de error:"
pm2 logs $PROJECT_NAME --err --lines 20 2>/dev/null || echo "No se pudieron obtener los logs de error"

echo ""
echo "Logs de salida:"
pm2 logs $PROJECT_NAME --out --lines 20 2>/dev/null || echo "No se pudieron obtener los logs de salida"

echo ""
echo "5. 🌐 Verificando puerto 4001:"
if command -v netstat &> /dev/null; then
    echo "Procesos escuchando en puerto 4001:"
    netstat -tlnp | grep :4001 || echo "Ningún proceso escuchando en puerto 4001"
elif command -v ss &> /dev/null; then
    echo "Procesos escuchando en puerto 4001:"
    ss -tlnp | grep :4001 || echo "Ningún proceso escuchando en puerto 4001"
else
    echo "No se pudo verificar el puerto (netstat/ss no disponible)"
fi

echo ""
echo "6. 🔍 Información del sistema:"
echo "Node.js version: $(node --version 2>/dev/null || echo 'Node.js no encontrado')"
echo "PM2 version: $(pm2 --version 2>/dev/null || echo 'PM2 no encontrado')"
echo "Usuario actual: $(whoami)"
echo "Directorio actual: $(pwd)"

echo ""
echo "7. 💾 Uso de memoria:"
free -h 2>/dev/null || echo "Comando 'free' no disponible"

echo ""
echo "8. 🔄 Intentando reiniciar aplicación:"
echo "Deteniendo aplicación..."
pm2 stop $PROJECT_NAME 2>/dev/null || echo "La aplicación no estaba corriendo"

echo "Eliminando aplicación de PM2..."
pm2 delete $PROJECT_NAME 2>/dev/null || echo "La aplicación no estaba en PM2"

echo ""
echo "Diagnóstico completado. Ahora intenta ejecutar:"
echo "1. pm2 start $PM2_CONFIG"
echo "2. pm2 logs $PROJECT_NAME"
