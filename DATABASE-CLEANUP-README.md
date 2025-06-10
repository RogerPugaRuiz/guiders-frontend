# Scripts de Limpieza de Base de Datos PostgreSQL

Este directorio contiene scripts para limpiar completamente todas las tablas de la base de datos PostgreSQL del proyecto Guiders.

## 📁 Archivos incluidos

### 1. `clean-database.sh` - Script completo de limpieza
Script robusto que incluye una lista predefinida de tablas comunes y detecta automáticamente las tablas existentes en la base de datos.

### 2. `clean-database-entities.sh` - Script basado en entidades
Script inteligente que analiza los archivos `.entity.ts` del proyecto para identificar automáticamente las tablas correspondientes.

## 🚀 Uso básico

### Limpieza completa (recomendado)
```bash
# Limpiar todas las tablas con confirmación
./clean-database.sh

# Limpiar sin confirmación (automatizado)
./clean-database.sh -y

# Solo verificar conexión y mostrar tablas
./clean-database.sh --check
```

### Limpieza basada en entidades TypeScript
```bash
# Analizar entidades y limpiar
./clean-database-entities.sh

# Solo analizar entidades sin limpiar
./clean-database-entities.sh --analyze-only

# Generar archivo SQL sin ejecutar
./clean-database-entities.sh --generate-sql

# Ejecutar usando archivo SQL generado
./clean-database-entities.sh --execute-sql
```

### Limpiar tabla específica
```bash
# Limpiar solo la tabla 'users'
./clean-database.sh -t users

# Limpiar solo la tabla 'chats'
./clean-database.sh -t chats
```

## ⚙️ Configuración

### Variables de entorno
Puedes configurar la conexión a la base de datos usando variables de entorno:

```bash
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="guiders_db"
export DB_USER="postgres"
export DB_PASSWORD="tu_password"
```

### Ejemplos con configuración personalizada
```bash
# Usar base de datos diferente
DB_NAME="guiders_production" ./clean-database.sh

# Usar servidor remoto
DB_HOST="192.168.1.100" DB_USER="admin" ./clean-database.sh

# Configuración completa
DB_HOST="db.example.com" \
DB_PORT="5432" \
DB_NAME="guiders_staging" \
DB_USER="staging_user" \
DB_PASSWORD="secret123" \
./clean-database.sh -y
```

## 📋 Entidades detectadas automáticamente

Basado en el análisis de archivos `.entity.ts` encontrados:

### 🔐 Autenticación (user.entity.ts)
- `users` - Usuarios del sistema
- `auth_sessions` - Sesiones de autenticación
- `user_tokens` - Tokens de usuario
- `refresh_tokens` - Tokens de refresco

### 💬 Chat (chat.entity.ts)
- `chats` - Conversaciones
- `messages` - Mensajes
- `participants` - Participantes
- `chat_participants` - Relación many-to-many

### 📊 Datos de negocio
- `leads` - Prospectos de ventas
- `companies` - Empresas
- `user_activities` - Actividades de usuario
- `tracking_events` - Eventos de seguimiento

### 🔔 Sistema
- `notifications` - Notificaciones
- `audit_logs` - Logs de auditoría
- `error_logs` - Logs de errores
- `websocket_connections` - Conexiones WebSocket

## 🛡️ Características de seguridad

### ✅ Verificaciones incluidas
- ✅ Verificación de conexión a base de datos
- ✅ Confirmación antes de ejecutar (excepto con `-y`)
- ✅ Manejo seguro de foreign key constraints
- ✅ Backup automático de esquema antes de limpiar
- ✅ Reinicio de secuencias automáticas
- ✅ Optimización post-limpieza (VACUUM)

### ⚠️ Precauciones
- **⚠️ ADVERTENCIA**: Estos scripts eliminan TODOS los datos de las tablas
- **⚠️ NO hay rollback**: Una vez ejecutado, los datos se pierden permanentemente
- **⚠️ Usar solo en desarrollo**: NO ejecutar en producción sin backup completo

## 📈 Características avanzadas

### Análisis de entidades
```bash
# Ver qué entidades y tablas detecta el script
./clean-database-entities.sh --analyze-only
```

### Generación de SQL
```bash
# Generar archivo SQL para revisión manual
./clean-database-entities.sh --generate-sql
# Esto crea: cleanup-database.sql

# Revisar el archivo generado
cat cleanup-database.sql

# Ejecutar manualmente
psql -h localhost -U postgres -d guiders_db -f cleanup-database.sql
```

### Logging detallado
Los scripts incluyen logging con colores y timestamps:
- 🔵 **Info**: Operaciones normales
- 🟢 **Success**: Operaciones exitosas  
- 🟡 **Warning**: Advertencias
- 🔴 **Error**: Errores

## 🔧 Troubleshooting

### Error: "psql command not found"
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# CentOS/RHEL
sudo yum install postgresql
```

### Error de conexión
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar puerto
netstat -tlnp | grep 5432

# Probar conexión manual
psql -h localhost -U postgres -d guiders_db -c "SELECT version();"
```

### Error de permisos
```bash
# Verificar permisos del usuario
psql -h localhost -U postgres -c "\\du"

# Dar permisos al usuario
psql -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE guiders_db TO mi_usuario;"
```

## 🎯 Casos de uso comunes

### Desarrollo local
```bash
# Limpiar todo para empezar fresh
./clean-database.sh -y

# Solo limpiar datos de chat para testing
./clean-database.sh -t chats
./clean-database.sh -t messages
```

### Testing automatizado
```bash
# En CI/CD pipeline
DB_NAME="test_db" ./clean-database.sh -y
```

### Staging environment
```bash
# Limpiar staging antes de deployment
DB_HOST="staging.example.com" \
DB_NAME="guiders_staging" \
./clean-database.sh -y
```

## 📚 Scripts relacionados

Estos scripts están diseñados para trabajar junto con:
- **Migraciones de base de datos**: Ejecutar después de limpiar
- **Seeders de datos**: Para poblar con datos de prueba
- **Tests de integración**: Para setup/teardown

## ⚡ Rendimiento

### Optimizaciones incluidas
- Deshabilitación temporal de foreign key constraints
- Batch processing para tablas grandes
- VACUUM automático post-limpieza
- Reinicio optimizado de secuencias

### Tiempos estimados
- **Base de datos pequeña** (< 1MB): ~5 segundos
- **Base de datos mediana** (1-100MB): ~30 segundos  
- **Base de datos grande** (> 100MB): ~2-5 minutos

---

## 🚨 Recordatorio importante

**⚠️ SIEMPRE hacer backup antes de ejecutar en datos importantes:**

```bash
# Backup completo
pg_dump -h localhost -U postgres guiders_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar si es necesario
psql -h localhost -U postgres guiders_db < backup_20231201_143022.sql
```

**¡Usa estos scripts responsablemente! 🛡️**
