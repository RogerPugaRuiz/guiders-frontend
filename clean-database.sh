#!/bin/bash

# Script para limpiar todas las tablas de la base de datos PostgreSQL
# Basado en las entidades encontradas en los archivos .entity.ts del proyecto

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración de base de datos
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-guiders_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-password}"

# Lista de tablas basadas en las entidades encontradas en el proyecto
TABLES=(
    # Tablas principales del dominio de autenticación
    "users"
    "auth_sessions" 
    "user_tokens"
    "refresh_tokens"
    
    # Tablas principales del dominio de chat
    "chats"
    "messages"
    "participants"
    "chat_participants"
    
    # Tablas de seguimiento y analytics
    "leads"
    "user_activities"
    "tracking_events"
    "page_visits"
    
    # Tablas de configuración
    "companies"
    "settings"
    "permissions"
    "roles"
    
    # Tablas de metadatos y logs
    "audit_logs"
    "error_logs"
    "websocket_connections"
    
    # Tablas de archivos y multimedia
    "files"
    "chat_attachments"
    
    # Tablas de notificaciones
    "notifications"
    "email_logs"
)

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

# Función para verificar si psql está instalado
check_psql() {
    if ! command -v psql &> /dev/null; then
        error "psql no está instalado. Instálalo primero:"
        echo "  - macOS: brew install postgresql"
        echo "  - Ubuntu/Debian: apt-get install postgresql-client"
        echo "  - CentOS/RHEL: yum install postgresql"
        exit 1
    fi
}

# Función para verificar conexión a la base de datos
check_connection() {
    log "Verificando conexión a la base de datos..."
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        success "Conexión a la base de datos exitosa"
        
        # Mostrar información de la base de datos
        DB_VERSION=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" 2>/dev/null | head -1 | xargs)
        log "Versión de PostgreSQL: $DB_VERSION"
        
        return 0
    else
        error "No se pudo conectar a la base de datos"
        echo "Parámetros de conexión:"
        echo "  Host: $DB_HOST"
        echo "  Puerto: $DB_PORT"
        echo "  Base de datos: $DB_NAME"
        echo "  Usuario: $DB_USER"
        echo ""
        echo "Verifica que:"
        echo "  1. PostgreSQL esté ejecutándose"
        echo "  2. Las credenciales sean correctas"
        echo "  3. La base de datos exista"
        echo "  4. El usuario tenga permisos"
        return 1
    fi
}

# Función para obtener todas las tablas existentes
get_existing_tables() {
    log "Obteniendo lista de tablas existentes..."
    
    EXISTING_TABLES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
    " 2>/dev/null | sed '/^$/d' | xargs)
    
    if [ -n "$EXISTING_TABLES" ]; then
        log "Tablas encontradas en la base de datos:"
        for table in $EXISTING_TABLES; do
            echo "  - $table"
        done
        echo ""
        return 0
    else
        warning "No se encontraron tablas en la base de datos o no se pudo acceder"
        return 1
    fi
}

# Función para contar registros en una tabla
count_records() {
    local table=$1
    local count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs)
    echo "$count"
}

# Función para limpiar una tabla específica
clean_table() {
    local table=$1
    
    # Verificar si la tabla existe
    TABLE_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '$table'
        );
    " 2>/dev/null | xargs)
    
    if [ "$TABLE_EXISTS" = "t" ]; then
        # Contar registros antes de limpiar
        local record_count=$(count_records "$table")
        
        if [ "$record_count" -gt 0 ]; then
            log "Limpiando tabla '$table' ($record_count registros)..."
            
            # Limpiar la tabla
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM $table;" > /dev/null 2>&1
            
            if [ $? -eq 0 ]; then
                success "Tabla '$table' limpiada exitosamente"
                
                # Reiniciar secuencias si existen
                PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
                    SELECT setval(pg_get_serial_sequence('$table', column_name), 1, false)
                    FROM information_schema.columns 
                    WHERE table_name = '$table' 
                    AND column_default LIKE 'nextval%';
                " > /dev/null 2>&1
                
                return 0
            else
                error "Error al limpiar la tabla '$table'"
                return 1
            fi
        else
            log "Tabla '$table' ya está vacía"
            return 0
        fi
    else
        warning "Tabla '$table' no existe - saltando"
        return 0
    fi
}

# Función para limpiar todas las tablas
clean_all_tables() {
    log "Iniciando limpieza de todas las tablas..."
    echo ""
    
    local cleaned_count=0
    local error_count=0
    local total_records_before=0
    
    # Deshabilitar constraints temporalmente para evitar errores de foreign key
    log "Deshabilitando constraints de foreign key temporalmente..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SET session_replication_role = replica;
    " > /dev/null 2>&1
    
    # Procesar tablas existentes primero
    if [ -n "$EXISTING_TABLES" ]; then
        for table in $EXISTING_TABLES; do
            local record_count=$(count_records "$table")
            total_records_before=$((total_records_before + record_count))
            
            if clean_table "$table"; then
                cleaned_count=$((cleaned_count + 1))
            else
                error_count=$((error_count + 1))
            fi
        done
    fi
    
    # Procesar tablas de la lista predefinida que no estén en las existentes
    for table in "${TABLES[@]}"; do
        if [[ ! " $EXISTING_TABLES " =~ " $table " ]]; then
            clean_table "$table"
        fi
    done
    
    # Rehabilitar constraints
    log "Rehabilitando constraints de foreign key..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SET session_replication_role = DEFAULT;
    " > /dev/null 2>&1
    
    # Ejecutar VACUUM para limpiar el espacio
    log "Ejecutando VACUUM para optimizar la base de datos..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "VACUUM;" > /dev/null 2>&1
    
    echo ""
    success "Limpieza completada"
    echo "📊 Resumen:"
    echo "  - Registros eliminados: $total_records_before"
    echo "  - Tablas procesadas: $cleaned_count"
    echo "  - Errores: $error_count"
}

# Función para mostrar ayuda
show_help() {
    echo "Script para limpiar todas las tablas de PostgreSQL - Proyecto Guiders"
    echo ""
    echo "Uso: $0 [opciones]"
    echo ""
    echo "Opciones:"
    echo "  -h, --help              Mostrar esta ayuda"
    echo "  -c, --check             Solo verificar conexión y mostrar tablas"
    echo "  -t, --table TABLE       Limpiar solo una tabla específica"
    echo "  -y, --yes               Confirmar automáticamente (sin preguntar)"
    echo ""
    echo "Variables de entorno:"
    echo "  DB_HOST                 Host de PostgreSQL (default: localhost)"
    echo "  DB_PORT                 Puerto de PostgreSQL (default: 5432)"
    echo "  DB_NAME                 Nombre de la base de datos (default: guiders_db)"
    echo "  DB_USER                 Usuario de PostgreSQL (default: postgres)"
    echo "  DB_PASSWORD             Contraseña de PostgreSQL (default: password)"
    echo ""
    echo "Ejemplos:"
    echo "  $0                      # Limpiar todas las tablas (con confirmación)"
    echo "  $0 -y                   # Limpiar todas las tablas (sin confirmación)"
    echo "  $0 -c                   # Solo verificar conexión"
    echo "  $0 -t users             # Limpiar solo la tabla 'users'"
    echo "  DB_NAME=mi_db $0        # Usar base de datos personalizada"
}

# Función para confirmar acción
confirm_action() {
    if [ "$AUTO_CONFIRM" = true ]; then
        return 0
    fi
    
    echo ""
    warning "¡ATENCIÓN! Esta acción eliminará TODOS los datos de las tablas."
    echo "Base de datos: $DB_NAME en $DB_HOST:$DB_PORT"
    echo ""
    read -p "¿Estás seguro de que quieres continuar? (yes/no): " -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        return 0
    else
        log "Operación cancelada por el usuario"
        exit 0
    fi
}

# Función principal
main() {
    local CHECK_ONLY=false
    local SPECIFIC_TABLE=""
    local AUTO_CONFIRM=false
    
    # Procesar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--check)
                CHECK_ONLY=true
                shift
                ;;
            -t|--table)
                SPECIFIC_TABLE="$2"
                shift 2
                ;;
            -y|--yes)
                AUTO_CONFIRM=true
                shift
                ;;
            *)
                error "Opción desconocida: $1"
                echo "Usa -h o --help para ver las opciones disponibles"
                exit 1
                ;;
        esac
    done
    
    log "🧹 Iniciando script de limpieza de tablas PostgreSQL"
    echo "Configuración:"
    echo "  Host: $DB_HOST:$DB_PORT"
    echo "  Base de datos: $DB_NAME"
    echo "  Usuario: $DB_USER"
    echo ""
    
    # Verificaciones previas
    check_psql
    
    if ! check_connection; then
        exit 1
    fi
    
    get_existing_tables
    
    # Si solo es verificación, salir aquí
    if [ "$CHECK_ONLY" = true ]; then
        success "Verificación completada"
        exit 0
    fi
    
    # Limpiar tabla específica
    if [ -n "$SPECIFIC_TABLE" ]; then
        log "Limpiando tabla específica: $SPECIFIC_TABLE"
        if ! confirm_action; then
            exit 0
        fi
        clean_table "$SPECIFIC_TABLE"
        exit $?
    fi
    
    # Limpiar todas las tablas
    if ! confirm_action; then
        exit 0
    fi
    
    clean_all_tables
    
    echo ""
    success "¡Script completado exitosamente!"
    log "La base de datos está ahora limpia y lista para usar"
}

# Ejecutar función principal con todos los argumentos
main "$@"
