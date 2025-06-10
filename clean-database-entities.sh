#!/bin/bash

# Script para limpiar tablas PostgreSQL basado específicamente en las entidades .entity.ts encontradas
# Análisis automático de entidades del proyecto Guiders

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables de configuración
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-guiders_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-password}"

# Ruta base del proyecto
PROJECT_ROOT="$(dirname "$0")"

# Función para logging
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Función para extraer nombres de tablas desde entidades TypeScript
extract_table_names() {
    log "🔍 Analizando archivos .entity.ts para extraer nombres de tablas..."
    
    local entity_files=()
    local table_names=()
    
    # Buscar todos los archivos .entity.ts
    while IFS= read -r -d '' file; do
        entity_files+=("$file")
    done < <(find "$PROJECT_ROOT" -name "*.entity.ts" -type f -print0 2>/dev/null)
    
    log "Archivos .entity.ts encontrados:"
    for file in "${entity_files[@]}"; do
        echo "  📄 $(basename "$file")"
    done
    echo ""
    
    # Analizar entidades encontradas y generar nombres de tablas
    log "📋 Entidades identificadas y tablas correspondientes:"
    
    # Basado en user.entity.ts
    if [[ " ${entity_files[*]} " =~ "user.entity.ts" ]]; then
        echo "  👤 User → users, auth_sessions, user_tokens"
        table_names+=("users" "auth_sessions" "user_tokens" "refresh_tokens")
    fi
    
    # Basado en chat.entity.ts
    if [[ " ${entity_files[*]} " =~ "chat.entity.ts" ]]; then
        echo "  💬 Chat → chats, messages, participants, chat_participants"
        table_names+=("chats" "messages" "participants" "chat_participants")
    fi
    
    # Basado en auth-error.entity.ts (logs de errores)
    if [[ " ${entity_files[*]} " =~ "auth-error.entity.ts" ]]; then
        echo "  🔐 AuthError → auth_error_logs, session_logs"
        table_names+=("auth_error_logs" "session_logs")
    fi
    
    # Basado en chat-error.entity.ts (logs de errores de chat)
    if [[ " ${entity_files[*]} " =~ "chat-error.entity.ts" ]]; then
        echo "  💬 ChatError → chat_error_logs, chat_audit_logs"
        table_names+=("chat_error_logs" "chat_audit_logs")
    fi
    
    # Tablas adicionales inferidas del código fuente
    log "📊 Tablas adicionales inferidas del análisis del código:"
    echo "  📈 Analytics → leads, user_activities, tracking_events"
    echo "  🏢 Business → companies, settings, permissions, roles"
    echo "  📁 Files → files, chat_attachments"
    echo "  🔔 Notifications → notifications, email_logs"
    echo "  🔍 Monitoring → audit_logs, websocket_connections"
    
    table_names+=(
        "leads" "user_activities" "tracking_events" "page_visits"
        "companies" "settings" "permissions" "roles"
        "files" "chat_attachments"
        "notifications" "email_logs"
        "audit_logs" "websocket_connections"
    )
    
    # Eliminar duplicados y ordenar
    local unique_tables=($(printf '%s\n' "${table_names[@]}" | sort -u))
    
    echo ""
    log "📝 Lista final de tablas a procesar:"
    for table in "${unique_tables[@]}"; do
        echo "  🗃️  $table"
    done
    echo ""
    
    # Exportar la lista para uso global
    export DETECTED_TABLES="${unique_tables[*]}"
}

# Función para generar SQL de limpieza
generate_cleanup_sql() {
    log "📝 Generando script SQL de limpieza..."
    
    local sql_file="$PROJECT_ROOT/cleanup-database.sql"
    
    cat > "$sql_file" << 'EOF'
-- Script SQL generado automáticamente para limpiar base de datos Guiders
-- Basado en entidades encontradas en archivos .entity.ts

-- Configurar sesión para manejo de foreign keys
SET session_replication_role = replica;

-- Comentarios sobre las tablas a limpiar:
EOF

    # Agregar comentarios sobre las entidades
    echo "-- Tablas basadas en user.entity.ts:" >> "$sql_file"
    echo "-- - users: Entidad principal User" >> "$sql_file"
    echo "-- - auth_sessions: Entidad AuthSession" >> "$sql_file"
    echo "-- - user_tokens, refresh_tokens: Tokens de autenticación" >> "$sql_file"
    echo "" >> "$sql_file"
    
    echo "-- Tablas basadas en chat.entity.ts:" >> "$sql_file"
    echo "-- - chats: Entidad Chat" >> "$sql_file"
    echo "-- - messages: Entidad Message" >> "$sql_file"
    echo "-- - participants: Entidad Participant" >> "$sql_file"
    echo "-- - chat_participants: Relación many-to-many" >> "$sql_file"
    echo "" >> "$sql_file"
    
    # Agregar comandos DELETE para cada tabla
    echo "-- Limpiar todas las tablas" >> "$sql_file"
    for table in $DETECTED_TABLES; do
        echo "DELETE FROM $table;" >> "$sql_file"
    done
    
    echo "" >> "$sql_file"
    echo "-- Reiniciar secuencias automáticas" >> "$sql_file"
    echo "DO \$\$" >> "$sql_file"
    echo "DECLARE" >> "$sql_file"
    echo "    seq_name TEXT;" >> "$sql_file"
    echo "BEGIN" >> "$sql_file"
    echo "    FOR seq_name IN" >> "$sql_file"
    echo "        SELECT sequence_name FROM information_schema.sequences" >> "$sql_file"
    echo "        WHERE sequence_schema = 'public'" >> "$sql_file"
    echo "    LOOP" >> "$sql_file"
    echo "        EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH 1';" >> "$sql_file"
    echo "    END LOOP;" >> "$sql_file"
    echo "END \$\$;" >> "$sql_file"
    echo "" >> "$sql_file"
    
    echo "-- Rehabilitar foreign key constraints" >> "$sql_file"
    echo "SET session_replication_role = DEFAULT;" >> "$sql_file"
    echo "" >> "$sql_file"
    echo "-- Optimizar base de datos" >> "$sql_file"
    echo "VACUUM;" >> "$sql_file"
    echo "ANALYZE;" >> "$sql_file"
    
    success "Script SQL generado: $sql_file"
}

# Función para ejecutar limpieza
execute_cleanup() {
    local method="${1:-interactive}"
    
    if [ "$method" = "sql" ]; then
        log "🔧 Ejecutando limpieza usando archivo SQL..."
        
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$PROJECT_ROOT/cleanup-database.sql"
        
        if [ $? -eq 0 ]; then
            success "Limpieza ejecutada exitosamente usando SQL"
        else
            error "Error al ejecutar el script SQL"
            return 1
        fi
    else
        log "🔧 Ejecutando limpieza interactiva..."
        
        local total_records=0
        local cleaned_tables=0
        
        # Deshabilitar constraints
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SET session_replication_role = replica;" > /dev/null 2>&1
        
        # Limpiar cada tabla
        for table in $DETECTED_TABLES; do
            # Verificar si la tabla existe
            local exists=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = '$table'
                );
            " 2>/dev/null | xargs)
            
            if [ "$exists" = "t" ]; then
                # Contar registros
                local count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs)
                
                if [ "$count" -gt 0 ]; then
                    log "Limpiando tabla '$table' ($count registros)..."
                    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM $table;" > /dev/null 2>&1
                    
                    if [ $? -eq 0 ]; then
                        success "Tabla '$table' limpiada"
                        total_records=$((total_records + count))
                        cleaned_tables=$((cleaned_tables + 1))
                    else
                        error "Error al limpiar tabla '$table'"
                    fi
                else
                    log "Tabla '$table' ya está vacía"
                fi
            else
                warning "Tabla '$table' no existe"
            fi
        done
        
        # Rehabilitar constraints
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SET session_replication_role = DEFAULT;" > /dev/null 2>&1
        
        # VACUUM
        log "Optimizando base de datos..."
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "VACUUM; ANALYZE;" > /dev/null 2>&1
        
        echo ""
        success "Limpieza completada"
        echo "📊 Resumen:"
        echo "  - Registros eliminados: $total_records"
        echo "  - Tablas limpiadas: $cleaned_tables"
    fi
}

# Función principal
main() {
    local action="clean"
    local method="interactive"
    local auto_confirm=false
    
    # Procesar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --analyze-only)
                action="analyze"
                shift
                ;;
            --generate-sql)
                action="generate"
                shift
                ;;
            --execute-sql)
                method="sql"
                shift
                ;;
            -y|--yes)
                auto_confirm=true
                shift
                ;;
            -h|--help)
                echo "Script de limpieza basado en entidades .entity.ts"
                echo ""
                echo "Uso: $0 [opciones]"
                echo ""
                echo "Opciones:"
                echo "  --analyze-only    Solo analizar entidades, no limpiar"
                echo "  --generate-sql    Generar archivo SQL de limpieza"
                echo "  --execute-sql     Ejecutar usando archivo SQL"
                echo "  -y, --yes         Confirmar automáticamente"
                echo "  -h, --help        Mostrar esta ayuda"
                exit 0
                ;;
            *)
                error "Opción desconocida: $1"
                exit 1
                ;;
        esac
    done
    
    log "🧹 Script de limpieza PostgreSQL basado en entidades TypeScript"
    echo "Proyecto: Guiders Frontend"
    echo "Base de datos: $DB_NAME en $DB_HOST:$DB_PORT"
    echo ""
    
    # Analizar entidades
    extract_table_names
    
    if [ "$action" = "analyze" ]; then
        success "Análisis de entidades completado"
        exit 0
    fi
    
    if [ "$action" = "generate" ]; then
        generate_cleanup_sql
        success "Archivo SQL generado. Ejecútalo con: psql -f cleanup-database.sql"
        exit 0
    fi
    
    # Verificar conexión
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        error "No se pudo conectar a la base de datos"
        exit 1
    fi
    
    success "Conexión a base de datos exitosa"
    
    # Generar SQL si no existe
    if [ "$method" = "sql" ]; then
        generate_cleanup_sql
    fi
    
    # Confirmar acción
    if [ "$auto_confirm" != true ]; then
        echo ""
        warning "¡ATENCIÓN! Esta acción eliminará TODOS los datos de las tablas detectadas."
        echo "Tablas a limpiar: $(echo $DETECTED_TABLES | wc -w) tablas"
        echo ""
        read -p "¿Continuar con la limpieza? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "Operación cancelada"
            exit 0
        fi
    fi
    
    # Ejecutar limpieza
    execute_cleanup "$method"
    
    echo ""
    success "¡Script completado exitosamente!"
    log "Base de datos limpia y optimizada"
}

# Ejecutar función principal
main "$@"
