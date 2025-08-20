#!/bin/bash

# Script de deploy para stagi#!/bin/bash

# Script simplificado de deploy para staging
set -e

echo "🚀 Deploy local a staging..."

# Variables
PROJECT_NAME="guiders-frontend-staging"
DEPLOY_PATH="/var/www/guiders-frontend-staging"

# Construir para staging
echo "📦 Construyendo aplicación..."
npm run build:guiders-20:staging

# Verificar build
if [ ! -f "guiders-20/dist/guiders-20/server/server.mjs" ]; then
    echo "❌ Error: server.mjs no generado"
    exit 1
fi

echo "✅ Build completado"

# Crear tarball para upload manual
echo "📦 Creando paquete de deployment..."
cd guiders-20
tar czf ../staging-deploy.tar.gz dist
cd ..

# Copiar configuración de PM2
cp .github/ecosystem.staging.config.js .

echo "✅ Archivos listos:"
echo "  - staging-deploy.tar.gz"
echo "  - ecosystem.staging.config.js"
echo ""
echo "📋 Para deployment manual:"
echo "1. Subir archivos al servidor"
echo "2. Descomprimir: tar xzf staging-deploy.tar.gz"
echo "3. Ejecutar PM2: pm2 start ecosystem.staging.config.js"
echo ""
echo "🌐 Backend configurado: http://217.154.105.26/api"
echo "🚀 Puerto frontend: 4001"Este script construye la aplicación para staging y la despliega usando PM2

set -e

echo "🚀 Iniciando deploy de staging..."

# Configuración
PROJECT_NAME="guiders-frontend-staging"
DEPLOY_PATH="/var/www/guiders-frontend-staging"
PM2_CONFIG="$DEPLOY_PATH/.github/ecosystem.staging.config.js"

# Crear directorio de deploy si no existe
echo "📂 Preparando directorio de deploy..."
sudo mkdir -p "$DEPLOY_PATH"
sudo chown -R $(whoami):$(whoami) "$DEPLOY_PATH"

# Construir la aplicación para staging
echo "📦 Construyendo aplicación para staging..."
npm run build:guiders-20:staging

# Verificar que el build fue exitoso
if [ ! -f "guiders-20/dist/guiders-20/server/server.mjs" ]; then
    echo "❌ Error: El archivo server.mjs no fue generado"
    echo "Archivos en dist/guiders-20/server/:"
    ls -la guiders-20/dist/guiders-20/server/ 2>/dev/null || echo "Directorio no existe"
    exit 1
fi

echo "✅ Build completado exitosamente"

# Detener PM2 si está corriendo
echo "🛑 Deteniendo aplicación actual..."
pm2 stop $PROJECT_NAME 2>/dev/null || echo "La aplicación no estaba corriendo"
pm2 delete $PROJECT_NAME 2>/dev/null || echo "La aplicación no estaba en PM2"

# Copiar archivos al directorio de deploy
echo "📂 Copiando archivos al directorio de deploy..."
cp -r guiders-20/dist/* "$DEPLOY_PATH/"

# Copiar configuración de PM2
echo "� Copiando configuración de PM2..."
mkdir -p "$DEPLOY_PATH/.github"
cp .github/ecosystem.staging.config.js "$DEPLOY_PATH/.github/"

# Verificar estructura
echo "🔍 Verificando estructura de archivos..."
echo "Contenido de $DEPLOY_PATH:"
ls -la "$DEPLOY_PATH"

if [ -f "$DEPLOY_PATH/guiders-20/server/server.mjs" ]; then
    echo "✅ server.mjs copiado correctamente"
else
    echo "❌ Error: server.mjs no se copió correctamente"
    exit 1
fi

# Actualizar permisos
echo "🔐 Configurando permisos..."
chmod +x "$DEPLOY_PATH/guiders-20/server/server.mjs"

# Iniciar con PM2
echo "🔄 Iniciando aplicación con PM2..."
cd "$DEPLOY_PATH"
pm2 start "$PM2_CONFIG"

# Verificar estado
echo "📊 Estado de la aplicación:"
pm2 status $PROJECT_NAME

# Esperar un momento para que la aplicación se inicie
echo "⏳ Esperando que la aplicación se inicie..."
sleep 5

# Mostrar logs recientes
echo "📝 Logs recientes:"
pm2 logs $PROJECT_NAME --lines 20

echo "✅ Deploy de staging completado!"
echo "🌐 La aplicación debería estar corriendo en:"
echo "   - Puerto: 4001"
echo "   - API Backend: http://217.154.105.26/api"
echo ""
echo "Para monitorear la aplicación:"
echo "   pm2 logs $PROJECT_NAME"
echo "   pm2 status"
echo "   pm2 monit"
