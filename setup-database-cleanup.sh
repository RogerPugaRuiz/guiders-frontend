#!/bin/bash

# Script de configuración rápida para limpieza de base de datos
# setup-database-cleanup.sh

echo "🔧 Configuración de variables para limpieza de base de datos en servidor de producción"
echo "=================================================================="
echo ""

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

# Obtener configuración de base de datos
echo "Por favor, proporciona la configuración de tu base de datos PostgreSQL:"
echo ""

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
success "Variables configuradas:"
echo "  DB_HOST=$DB_HOST"
echo "  DB_PORT=$DB_PORT"
echo "  DB_NAME=$DB_NAME"
echo "  DB_USER=$DB_USER"
echo "  DB_PASSWORD=***"

# Crear archivo .env para persistir configuración
cat > .env << EOF
# Variables de configuración para base de datos
# Generado por setup-database-cleanup.sh en $(date)
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF

success "Configuración guardada en archivo .env"

# Probar conexión
echo ""
log "🔍 Probando conexión a la base de datos..."
if command -v psql &> /dev/null; then
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" >/dev/null 2>&1; then
        success "Conexión exitosa a la base de datos"
        
        # Mostrar información de la base de datos
        echo ""
        log "📊 Información de la base de datos:"
        DB_VERSION=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" 2>/dev/null | head -1 | xargs)
        echo "  Versión PostgreSQL: $DB_VERSION"
        
        # Contar tablas existentes
        TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        " 2>/dev/null | xargs)
        echo "  Tablas existentes: $TABLE_COUNT"
        
        echo ""
        success "¡Configuración completada exitosamente!"
        echo ""
        echo "📋 Comandos disponibles:"
        echo "  source .env                                      # Cargar variables"
        echo "  ./clean-database-entities.sh --analyze-only     # Analizar tablas"
        echo "  ./clean-database-entities.sh --generate-sql     # Generar SQL"
        echo "  ./clean-database-entities.sh                    # Ejecutar limpieza"
        echo ""
        echo "📚 Documentación disponible:"
        echo "  cat DATABASE-CLEANUP-README.md                  # Guía general"
        echo "  cat SERVIDOR-PRODUCCION-PASOS.md               # Pasos específicos"
        echo "  cat QUICK-START-CLEANUP.md                     # Resumen rápido"
        echo ""
        warning "RECUERDA: Crear backup antes de limpiar"
        echo "  TIMESTAMP=\$(date +\"%Y%m%d_%H%M%S\")"
        echo "  PGPASSWORD=\"\$DB_PASSWORD\" pg_dump -h \"\$DB_HOST\" -p \"\$DB_PORT\" -U \"\$DB_USER\" -d \"\$DB_NAME\" > \"backup_\${TIMESTAMP}.sql\""
        
    else
        error "No se pudo conectar a la base de datos"
        echo ""
        echo "Verifica que:"
        echo "  1. PostgreSQL esté ejecutándose"
        echo "  2. Las credenciales sean correctas"
        echo "  3. La base de datos exista"
        echo "  4. El usuario tenga permisos"
        echo ""
        echo "Puedes ejecutar este script nuevamente para corregir la configuración."
    fi
else
    warning "psql no está instalado. Instalando cliente PostgreSQL..."
    
    # Detectar sistema operativo e instalar psql
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        log "Detectado sistema Ubuntu/Debian. Instalando postgresql-client..."
        sudo apt-get update && sudo apt-get install -y postgresql-client
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        log "Detectado sistema CentOS/RHEL. Instalando postgresql..."
        sudo yum install -y postgresql
    elif command -v dnf &> /dev/null; then
        # Fedora
        log "Detectado sistema Fedora. Instalando postgresql..."
        sudo dnf install -y postgresql
    else
        warning "Sistema operativo no reconocido. Instala manualmente el cliente PostgreSQL:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
        echo "  CentOS/RHEL: sudo yum install postgresql"
        echo "  Fedora: sudo dnf install postgresql"
    fi
    
    echo ""
    echo "Después de instalar PostgreSQL, ejecuta nuevamente:"
    echo "  ./setup-database-cleanup.sh"
fi

echo ""
echo "=================================================================="
log "Configuración completada. Usa 'source .env' para cargar las variables."
