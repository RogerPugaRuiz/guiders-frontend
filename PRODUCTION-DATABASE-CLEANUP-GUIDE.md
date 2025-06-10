# Guía para Limpieza de Base de Datos en Servidor de Producción

## 🚨 ADVERTENCIA IMPORTANTE
**¡ESTE SCRIPT ELIMINARÁ TODOS LOS DATOS DE LA BASE DE DATOS!**
Solo úsalo si estás completamente seguro de que quieres limpiar la base de datos de producción.

## 📋 Pasos para Ejecutar en Servidor de Producción

### 1. Acceder al Servidor de Producción

```bash
# Conectar a través de OpenVPN (si es necesario)
sudo openvpn --config tu-config.ovpn --daemon

# Conectar por SSH
ssh root@10.8.0.1
```

### 2. Navegar al Directorio de la Aplicación

```bash
# Ir al directorio donde está desplegada la aplicación
cd /var/www/guiders
```

### 3. Verificar que el Script Existe

```bash
# Ver si el script está presente
ls -la clean-database-entities.sh

# Si no está, descargarlo desde el repositorio
wget https://raw.githubusercontent.com/tu-usuario/guiders-frontend/main/clean-database-entities.sh
chmod +x clean-database-entities.sh
```

### 4. Configurar Variables de Entorno

Antes de ejecutar el script, configura las variables de conexión a la base de datos:

```bash
# Configurar variables de base de datos
export DB_HOST="localhost"          # O la IP de tu base de datos
export DB_PORT="5432"              # Puerto de PostgreSQL
export DB_NAME="guiders_production" # Nombre de tu base de datos
export DB_USER="postgres"          # Usuario de base de datos
export DB_PASSWORD="tu_password"   # Contraseña de la base de datos
```

**Alternativa: Crear archivo de configuración**

```bash
# Crear archivo .env para configuración
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=guiders_production
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
EOF

# Cargar variables
source .env
```

### 5. Verificar Conexión a Base de Datos

```bash
# Probar conexión antes de ejecutar el script
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();"
```

### 6. Hacer Backup de Seguridad (RECOMENDADO)

```bash
# Crear backup completo antes de limpiar
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "backup_before_cleanup_${TIMESTAMP}.sql"

echo "✅ Backup creado: backup_before_cleanup_${TIMESTAMP}.sql"
```

### 7. Analizar las Entidades (Recomendado)

```bash
# Primero analizar qué tablas se van a limpiar (sin ejecutar limpieza)
./clean-database-entities.sh --analyze-only
```

### 8. Ejecutar la Limpieza

#### Opción A: Ejecución Interactiva (Recomendada)
```bash
# Ejecutar con confirmación manual
./clean-database-entities.sh
```

#### Opción B: Generación de SQL para Revisión
```bash
# Generar archivo SQL para revisar antes de ejecutar
./clean-database-entities.sh --generate-sql

# Revisar el archivo generado
cat cleanup-database.sql

# Ejecutar manualmente si todo se ve bien
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f cleanup-database.sql
```

#### Opción C: Ejecución Automática (Peligrosa)
```bash
# Solo si estás 100% seguro
./clean-database-entities.sh --yes
```

### 9. Verificar Resultado

```bash
# Verificar que las tablas están vacías
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_del as deletes,
    n_live_tup as live_rows
FROM pg_stat_user_tables 
ORDER BY schemaname, tablename;
"
```

### 10. Reiniciar Servicios (Si es necesario)

```bash
# Reiniciar la aplicación Angular SSR
./pm2-safe-management.sh restart

# Verificar que todo funciona
./verify-deployment-safe.sh
```

## 🔧 Opciones del Script

| Opción | Descripción |
|--------|-------------|
| `--analyze-only` | Solo analizar entidades, no limpiar |
| `--generate-sql` | Generar archivo SQL de limpieza |
| `--execute-sql` | Ejecutar usando archivo SQL |
| `-y, --yes` | Confirmar automáticamente |
| `-h, --help` | Mostrar ayuda |

## 📊 Ejemplos de Uso

### Análisis Seguro
```bash
# Ver qué tablas se van a afectar
./clean-database-entities.sh --analyze-only
```

### Limpieza con Revisión
```bash
# 1. Generar SQL
./clean-database-entities.sh --generate-sql

# 2. Revisar contenido
less cleanup-database.sql

# 3. Ejecutar manualmente
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f cleanup-database.sql
```

### Limpieza Automática
```bash
# Backup + Limpieza automatizada
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "backup_${TIMESTAMP}.sql" && \
./clean-database-entities.sh --yes
```

## 🚨 Checklist de Seguridad

Antes de ejecutar en producción, verifica:

- [ ] **Backup creado** - Tienes un backup reciente de la base de datos
- [ ] **Variables configuradas** - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD están correctas
- [ ] **Conexión probada** - Puedes conectarte a la base de datos
- [ ] **Análisis ejecutado** - Has revisado qué tablas se van a limpiar
- [ ] **Equipo notificado** - Has avisado al equipo sobre la limpieza
- [ ] **Horario apropiado** - Es un momento apropiado para mantenimiento
- [ ] **Rollback plan** - Sabes cómo restaurar desde backup si algo sale mal

## 🔄 Restaurar desde Backup

Si necesitas restaurar los datos:

```bash
# Restaurar desde backup
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < backup_before_cleanup_YYYYMMDD_HHMMSS.sql
```

## 📝 Log de Ejecución

El script generará logs detallados. Para guardar la salida:

```bash
# Ejecutar con log
./clean-database-entities.sh --analyze-only 2>&1 | tee cleanup_analysis.log

# Para limpieza completa
./clean-database-entities.sh 2>&1 | tee cleanup_execution.log
```

## 🆘 Troubleshooting

### Error de Conexión
```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar puertos
netstat -tlnp | grep 5432
```

### Error de Permisos
```bash
# Verificar permisos del usuario
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT current_user, session_user, current_database();
"
```

### Tablas No Encontradas
```bash
# Ver todas las tablas disponibles
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
"
```

## 🎯 Recomendaciones Finales

1. **Siempre hacer backup** antes de cualquier operación destructiva
2. **Probar primero** en un entorno de desarrollo/staging
3. **Usar --analyze-only** para revisar antes de ejecutar
4. **Ejecutar en horarios de bajo tráfico**
5. **Tener un plan de rollback** preparado
6. **Notificar al equipo** antes de la operación
