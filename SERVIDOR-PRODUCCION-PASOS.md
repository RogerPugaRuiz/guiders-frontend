# Guía Paso a Paso: Usar Script de Limpieza en Servidor de Producción

## 🚀 Pasos Específicos para tu Servidor (10.8.0.1)

### 1. Conectar al Servidor de Producción

```bash
# 1. Conectar OpenVPN (si no estás conectado)
sudo openvpn --config tu-config.ovpn --daemon

# 2. Conectar por SSH al servidor
ssh root@10.8.0.1
```

### 2. Navegar al Directorio de la Aplicación

```bash
# Ir al directorio donde está desplegada la aplicación Guiders
cd /var/www/guiders

# Verificar que estamos en el lugar correcto
ls -la
# Deberías ver: dist/, package.json, ecosystem.config.js, etc.
```

### 3. Subir el Script al Servidor

Desde tu máquina local, copia el script al servidor:

```bash
# Opción A: Desde tu máquina local (en otra terminal)
scp /Users/rogerpugaruiz/Proyectos/guiders-frontend/clean-database-entities.sh root@10.8.0.1:/var/www/guiders/

# Opción B: Crear el archivo directamente en el servidor
# (Si estás conectado por SSH, puedes copiarlo manualmente)
```

### 4. Hacer el Script Ejecutable

```bash
# En el servidor, hacer el script ejecutable
chmod +x clean-database-entities.sh

# Verificar que tiene permisos
ls -la clean-database-entities.sh
```

### 5. Configurar Variables de Base de Datos

```bash
# Configurar las variables según tu base de datos de producción
export DB_HOST="localhost"              # O la IP de tu PostgreSQL
export DB_PORT="5432"                  # Puerto estándar de PostgreSQL
export DB_NAME="guiders_production"    # Nombre real de tu base de datos
export DB_USER="postgres"              # Tu usuario de PostgreSQL
export DB_PASSWORD="tu_password_real"  # Tu contraseña real

# Verificar configuración
echo "Base de datos: $DB_NAME en $DB_HOST:$DB_PORT como usuario $DB_USER"
```

### 6. Verificar Conexión a PostgreSQL

```bash
# Probar conexión a la base de datos
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();"

# Si funciona, verás la versión de PostgreSQL
# Si falla, revisa la configuración
```

### 7. Detener la Aplicación Angular (Recomendado)

```bash
# Detener temporalmente la aplicación para evitar conflictos
./pm2-safe-management.sh stop

# Verificar que se detuvo
./pm2-safe-management.sh status
```

### 8. Crear Backup de Seguridad (OBLIGATORIO)

```bash
# Crear backup completo con timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_before_cleanup_${TIMESTAMP}.sql"

echo "📦 Creando backup de seguridad..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    > "$BACKUP_FILE"

echo "✅ Backup creado: $BACKUP_FILE"
ls -lh "$BACKUP_FILE"
```

### 9. Analizar las Tablas (Paso Seguro)

```bash
# Primero ver qué tablas se van a limpiar SIN ejecutar la limpieza
./clean-database-entities.sh --analyze-only

# Esto te mostrará:
# - Qué archivos .entity.ts encuentra
# - Qué tablas va a limpiar
# - NO ejecuta ninguna limpieza
```

### 10. Verificar Tablas Existentes

```bash
# Ver qué tablas realmente existen en tu base de datos
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;
"
```

### 11. Ejecutar la Limpieza

#### Opción A: Limpieza Interactiva (Recomendada)
```bash
# Ejecutar con confirmación manual
./clean-database-entities.sh

# El script te preguntará: "¿Continuar con la limpieza? (yes/no):"
# Responde "yes" solo si estás seguro
```

#### Opción B: Generar SQL para Revisión
```bash
# 1. Generar archivo SQL para revisar
./clean-database-entities.sh --generate-sql

# 2. Revisar el contenido del archivo SQL generado
cat cleanup-database.sql

# 3. Si todo se ve bien, ejecutar manualmente
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f cleanup-database.sql
```

### 12. Verificar Resultado de la Limpieza

```bash
# Verificar que las tablas están vacías
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE n_live_tup > 0 OR n_dead_tup > 0
ORDER BY n_live_tup DESC;
"
```

### 13. Reiniciar la Aplicación

```bash
# Reiniciar la aplicación Angular SSR
./pm2-safe-management.sh start

# Verificar que está funcionando
./pm2-safe-management.sh status

# Verificar que responde
curl -I http://localhost:4000
```

### 14. Verificar Deployment Completo

```bash
# Ejecutar verificación completa
./verify-deployment-safe.sh
```

## 🔧 Comandos de Ejemplo Completos

### Secuencia Completa Segura:
```bash
# 1. Conectar al servidor
ssh root@10.8.0.1

# 2. Ir al directorio
cd /var/www/guiders

# 3. Configurar variables
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="guiders_production"  # Ajusta este nombre
export DB_USER="postgres"            # Ajusta este usuario
export DB_PASSWORD="tu_password"     # Ajusta esta contraseña

# 4. Probar conexión
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT current_database();"

# 5. Detener aplicación
./pm2-safe-management.sh stop

# 6. Crear backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "backup_${TIMESTAMP}.sql"

# 7. Analizar tablas
./clean-database-entities.sh --analyze-only

# 8. Ejecutar limpieza
./clean-database-entities.sh

# 9. Reiniciar aplicación
./pm2-safe-management.sh start

# 10. Verificar
./verify-deployment-safe.sh
```

## 🚨 Troubleshooting Común

### Error: "No se pudo conectar a la base de datos"
```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Ver puertos en uso
netstat -tlnp | grep 5432

# Verificar configuración PostgreSQL
sudo cat /etc/postgresql/*/main/postgresql.conf | grep listen_addresses
```

### Error: "psql: command not found"
```bash
# Instalar cliente PostgreSQL
sudo apt update
sudo apt install postgresql-client
```

### Error: "Tabla no existe"
```bash
# Ver todas las tablas disponibles
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt"
```

### Error de Permisos
```bash
# Verificar permisos del usuario
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT current_user, 
       session_user, 
       current_database(),
       has_database_privilege(current_user, current_database(), 'CREATE') as can_create;
"
```

## 📋 Checklist de Seguridad

Antes de ejecutar en producción:

- [ ] ✅ **Conectado al servidor** (10.8.0.1)
- [ ] ✅ **Script subido y ejecutable** (`chmod +x`)
- [ ] ✅ **Variables configuradas** (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
- [ ] ✅ **Conexión probada** (`psql` funciona)
- [ ] ✅ **Aplicación detenida** (`pm2-safe-management.sh stop`)
- [ ] ✅ **Backup creado** (archivo .sql guardado)
- [ ] ✅ **Análisis ejecutado** (`--analyze-only`)
- [ ] ✅ **Tablas verificadas** (coinciden con las existentes)

## 🔄 Restaurar si Algo Sale Mal

```bash
# Restaurar desde backup
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < backup_YYYYMMDD_HHMMSS.sql

# Reiniciar aplicación
./pm2-safe-management.sh restart
```

## 📝 Guardar Log de Ejecución

```bash
# Ejecutar con log completo
./clean-database-entities.sh --analyze-only 2>&1 | tee cleanup_analysis_$(date +%Y%m%d_%H%M%S).log

# Para limpieza completa
./clean-database-entities.sh 2>&1 | tee cleanup_execution_$(date +%Y%m%d_%H%M%S).log
```

## 🎯 Comando Final Resumido

```bash
# Todo en uno (después de configurar variables)
cd /var/www/guiders && \
./pm2-safe-management.sh stop && \
TIMESTAMP=$(date +"%Y%m%d_%H%M%S") && \
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "backup_${TIMESTAMP}.sql" && \
./clean-database-entities.sh --analyze-only && \
echo "Backup creado: backup_${TIMESTAMP}.sql" && \
echo "Revisa el análisis anterior y ejecuta: ./clean-database-entities.sh"
```

⚠️ **IMPORTANTE**: Este script eliminará TODOS los datos. Úsalo solo si estás 100% seguro de que quieres una base de datos completamente limpia.
