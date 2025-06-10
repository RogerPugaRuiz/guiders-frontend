#!/bin/bash

# Script para subir y configurar el script de limpieza en el servidor de producción
# deploy-cleanup-script.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables del servidor
SERVER_HOST="10.8.0.1"
SERVER_USER="root"
SERVER_PATH="/var/www/guiders"

# Función para logging
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Función principal
main() {
    log "🚀 Desplegando script de limpieza al servidor de producción"
    echo "Servidor: $SERVER_USER@$SERVER_HOST"
    echo "Destino: $SERVER_PATH"
    echo ""
    
    # Verificar que el script existe localmente
    if [ ! -f "clean-database-entities.sh" ]; then
        error "Archivo clean-database-entities.sh no encontrado en el directorio actual"
        exit 1
    fi
    
    # Verificar conexión SSH
    log "🔍 Verificando conexión SSH..."
    if ! ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_HOST" "echo 'Conexión SSH exitosa'" 2>/dev/null; then
        error "No se pudo conectar al servidor. Verifica:"
        echo "  - Que OpenVPN esté conectado"
        echo "  - Que la dirección $SERVER_HOST sea correcta"
        echo "  - Que tengas acceso SSH como $SERVER_USER"
        exit 1
    fi
    success "Conexión SSH establecida"
    
    # Subir script principal
    log "📤 Subiendo script de limpieza..."
    if scp "clean-database-entities.sh" "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"; then
        success "Script clean-database-entities.sh subido"
    else
        error "Error al subir el script principal"
        exit 1
    fi
    
    # Subir guías de documentación
    log "📤 Subiendo documentación..."
    for doc in "SERVIDOR-PRODUCCION-PASOS.md" "PRODUCTION-DATABASE-CLEANUP-GUIDE.md"; do
        if [ -f "$doc" ]; then
            scp "$doc" "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/" && \
            success "Documentación $doc subida" || \
            warning "No se pudo subir $doc"
        fi
    done
    
    # Configurar permisos en el servidor
    log "🔧 Configurando permisos en el servidor..."
    ssh "$SERVER_USER@$SERVER_HOST" << 'EOF'
        cd /var/www/guiders
        
        # Hacer scripts ejecutables
        chmod +x clean-database-entities.sh 2>/dev/null
        chmod +x pm2-safe-management.sh 2>/dev/null
        chmod +x verify-deployment-safe.sh 2>/dev/null
        
        # Verificar que están en su lugar
        echo "📁 Archivos en el servidor:"
        ls -la *.sh *.md 2>/dev/null | grep -E "\.(sh|md)$" || echo "  (No se encontraron archivos)"
        
        echo ""
        echo "✅ Configuración completada en el servidor"
EOF
    
    # Crear script de configuración rápida
    log "📝 Creando script de configuración rápida en el servidor..."
    ssh "$SERVER_USER@$SERVER_HOST" << 'EOF'
        cd /var/www/guiders
        
        cat > setup-database-cleanup.sh << 'SCRIPT_END'
#!/bin/bash

# Script de configuración rápida para limpieza de base de datos
# setup-database-cleanup.sh

echo "🔧 Configuración de variables para limpieza de base de datos"
echo ""

# Solicitar configuración de base de datos
read -p "🏠 Host de la base de datos [localhost]: " db_host
db_host=${db_host:-localhost}

read -p "🔌 Puerto de la base de datos [5432]: " db_port
db_port=${db_port:-5432}

read -p "📊 Nombre de la base de datos [guiders_production]: " db_name
db_name=${db_name:-guiders_production}

read -p "👤 Usuario de la base de datos [postgres]: " db_user
db_user=${db_user:-postgres}

read -s -p "🔐 Contraseña de la base de datos: " db_password
echo ""

# Exportar variables
export DB_HOST="$db_host"
export DB_PORT="$db_port"
export DB_NAME="$db_name"
export DB_USER="$db_user"
export DB_PASSWORD="$db_password"

echo ""
echo "✅ Variables configuradas:"
echo "  DB_HOST=$DB_HOST"
echo "  DB_PORT=$DB_PORT"
echo "  DB_NAME=$DB_NAME"
echo "  DB_USER=$DB_USER"
echo "  DB_PASSWORD=***"

# Probar conexión
echo ""
echo "🔍 Probando conexión a la base de datos..."
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" >/dev/null 2>&1; then
    echo "✅ Conexión exitosa a la base de datos"
    
    echo ""
    echo "📋 Comandos disponibles:"
    echo "  ./clean-database-entities.sh --analyze-only    # Analizar tablas"
    echo "  ./clean-database-entities.sh --generate-sql    # Generar SQL"
    echo "  ./clean-database-entities.sh                   # Ejecutar limpieza"
    echo ""
    echo "🚨 RECUERDA: Crear backup antes de limpiar"
    echo "  TIMESTAMP=\$(date +\"%Y%m%d_%H%M%S\")"
    echo "  PGPASSWORD=\"\$DB_PASSWORD\" pg_dump -h \"\$DB_HOST\" -p \"\$DB_PORT\" -U \"\$DB_USER\" -d \"\$DB_NAME\" > \"backup_\${TIMESTAMP}.sql\""
else
    echo "❌ Error de conexión. Verifica la configuración."
fi
SCRIPT_END

        chmod +x setup-database-cleanup.sh
        echo "✅ Script de configuración creado: setup-database-cleanup.sh"
EOF
    
    echo ""
    success "🎉 Deployment completado exitosamente"
    echo ""
    echo "📋 Próximos pasos en el servidor:"
    echo "  1. ssh $SERVER_USER@$SERVER_HOST"
    echo "  2. cd $SERVER_PATH"
    echo "  3. ./setup-database-cleanup.sh    # Configurar variables de BD"
    echo "  4. ./clean-database-entities.sh --analyze-only    # Analizar tablas"
    echo "  5. Crear backup y ejecutar limpieza"
    echo ""
    echo "📖 Documentación disponible en el servidor:"
    echo "  - SERVIDOR-PRODUCCION-PASOS.md"
    echo "  - PRODUCTION-DATABASE-CLEANUP-GUIDE.md"
}

# Verificar argumentos
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    echo "Script para desplegar limpieza de base de datos en servidor de producción"
    echo ""
    echo "Uso: $0"
    echo ""
    echo "Este script:"
    echo "  - Sube clean-database-entities.sh al servidor"
    echo "  - Configura permisos"
    echo "  - Crea script de configuración rápida"
    echo "  - Sube documentación"
    exit 0
fi

# Ejecutar función principal
main "$@"
