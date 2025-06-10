# 🚀 RESUMEN RÁPIDO: Limpiar Base de Datos en Producción

## Desde tu máquina local:

### 1. Subir script al servidor
```bash
# En tu máquina (directorio del proyecto)
./deploy-cleanup-script.sh
```

## En el servidor de producción:

### 2. Conectar y configurar
```bash
# Conectar al servidor
ssh root@10.8.0.1

# Ir al directorio
cd /var/www/guiders

# Configurar variables de BD (interactivo)
./setup-database-cleanup.sh
```

### 3. Proceso de limpieza
```bash
# 1. Detener aplicación
./pm2-safe-management.sh stop

# 2. Crear backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "backup_${TIMESTAMP}.sql"

# 3. Analizar qué se va a limpiar
./clean-database-entities.sh --analyze-only

# 4. Ejecutar limpieza (te pedirá confirmación)
./clean-database-entities.sh

# 5. Reiniciar aplicación
./pm2-safe-management.sh start

# 6. Verificar que todo funciona
./verify-deployment-safe.sh
```

## ⚡ Comando todo-en-uno (avanzado):
```bash
cd /var/www/guiders && \
./pm2-safe-management.sh stop && \
TIMESTAMP=$(date +"%Y%m%d_%H%M%S") && \
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "backup_${TIMESTAMP}.sql" && \
echo "✅ Backup: backup_${TIMESTAMP}.sql" && \
./clean-database-entities.sh --analyze-only && \
echo "🚨 Revisa el análisis y ejecuta: ./clean-database-entities.sh"
```

## 🛡️ Archivos importantes:
- `clean-database-entities.sh` - Script principal
- `setup-database-cleanup.sh` - Configuración fácil
- `SERVIDOR-PRODUCCION-PASOS.md` - Guía detallada
- `backup_*.sql` - Backups de seguridad

## 🚨 Recuerda:
- **SIEMPRE crear backup** antes de limpiar
- **Detener la aplicación** durante la limpieza
- **Verificar conexión** a la base de datos primero
- **Analizar tablas** antes de ejecutar limpieza
