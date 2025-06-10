#!/bin/bash

# Script para probar el build local de Angular 20 SSR
# test-build-local.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de logging
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

log "🧪 Probando build local de Angular 20 SSR"

# Ir al directorio guiders-20
cd guiders-20 || {
    error "No se pudo acceder al directorio guiders-20"
    exit 1
}

# Ejecutar build
log "🏗️ Ejecutando build de producción..."
npm run build:prod:env

if [ $? -ne 0 ]; then
    error "Error en el build"
    exit 1
fi

success "Build completado exitosamente"

# Verificar estructura
log "📁 Verificando estructura de build..."
ls -la dist/

if [ -d "dist/guiders-20" ]; then
    success "Build exitoso - encontrado subdirectorio del proyecto"
    echo "📁 Contenido del build principal:"
    ls -la dist/guiders-20/
    
    # Verificar browser y server
    if [ -d "dist/guiders-20/browser" ] && [ -d "dist/guiders-20/server" ]; then
        success "Directorios browser y server encontrados"
        
        echo "📁 Contenido del cliente (browser):"
        ls -la dist/guiders-20/browser/ | head -10
        
        echo "📁 Contenido del servidor (server):"
        ls -la dist/guiders-20/server/ | head -10
        
        # Verificar server.mjs
        if [ -f "dist/guiders-20/server/server.mjs" ]; then
            success "server.mjs encontrado"
            echo "📊 Tamaño: $(ls -lh dist/guiders-20/server/server.mjs | awk '{print $5}')"
        else
            error "server.mjs no encontrado"
            exit 1
        fi
        
        # Verificar index HTML
        if [ -f "dist/guiders-20/browser/index.csr.html" ]; then
            success "index.csr.html encontrado en el cliente"
        elif [ -f "dist/guiders-20/browser/index.html" ]; then
            success "index.html encontrado en el cliente"
        else
            error "No se encontró archivo index HTML en el cliente"
            echo "📁 Archivos en browser/:"
            ls -la dist/guiders-20/browser/ | grep -E "\.(html|htm)$" || echo "No hay archivos HTML"
            exit 1
        fi
        
        # Verificar archivos principales
        echo ""
        log "📊 Resumen de archivos principales:"
        echo "  Browser:"
        find dist/guiders-20/browser/ -name "*.js" | wc -l | xargs echo "    - Archivos JS:"
        find dist/guiders-20/browser/ -name "*.css" | wc -l | xargs echo "    - Archivos CSS:"
        find dist/guiders-20/browser/ -name "*.html" | wc -l | xargs echo "    - Archivos HTML:"
        
        echo "  Server:"
        find dist/guiders-20/server/ -name "*.mjs" | wc -l | xargs echo "    - Archivos MJS:"
        
        # Calcular tamaños
        echo ""
        log "📊 Tamaños de directorios:"
        du -sh dist/guiders-20/browser/ | awk '{print "  Browser: " $1}'
        du -sh dist/guiders-20/server/ | awk '{print "  Server: " $1}'
        du -sh dist/guiders-20/ | awk '{print "  Total: " $1}'
        
        success "¡Build verificado exitosamente! ✨"
        success "La estructura está correcta para deployment"
        
    else
        error "No se encontraron directorios browser/server"
        echo "📁 Contenido disponible:"
        ls -la dist/guiders-20/
        exit 1
    fi
else
    error "No se encontró el subdirectorio del proyecto en dist/"
    echo "📁 Contenido de dist/:"
    ls -la dist/
    exit 1
fi

echo ""
success "🎉 Test de build local completado exitosamente"
log "El build está listo para ser desplegado usando el workflow de GitHub Actions"
