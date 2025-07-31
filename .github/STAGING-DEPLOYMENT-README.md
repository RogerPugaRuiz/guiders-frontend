# Deploy de Staging - Frontend Angular SSR

Este documento explica cómo funciona el deployment de staging para el frontend Angular 20 con SSR del proyecto Guiders.

## 🎯 Propósito

El workflow de staging permite desplegar automáticamente el frontend Angular SSR en un entorno de staging para testing y validación antes de producción.

## 🚀 Cómo activar el deployment

### Automático
- **Push a `develop`**: Activa el deployment automáticamente
- **Push a branches `feature/*`**: Activa el deployment automáticamente

### Manual
1. Ve a la pestaña **Actions** en GitHub
2. Selecciona **Deploy Angular SSR to Staging**
3. Haz clic en **Run workflow**
4. Opcionalmente marca **Force deploy** si quieres saltarte algunas verificaciones

## 🏗️ Arquitectura del deployment

### Frontend Angular 20 + SSR
```
Angular 20 Application
├── Browser Bundle (CSR/SPA)
├── Server Bundle (SSR)
└── Express.js Server (server.mjs)
```

### Estructura desplegada
```
/var/www/guiders-frontend-staging/
├── dist/
│   └── guiders-20/
│       ├── browser/          # Cliente Angular (SSR/CSR)
│       │   ├── index.html
│       │   ├── main-*.js
│       │   └── assets/
│       └── server/           # Servidor Express
│           └── server.mjs    # Punto de entrada SSR
├── node_modules/             # Dependencias optimizadas
├── package.json              # Configuración de producción
├── ecosystem.staging.config.js  # Configuración PM2
├── pm2-staging-management.sh    # Script de gestión
└── logs/                     # Logs de aplicación
```

## 🔄 Proceso de deployment

### 1. Testing y Build (15 min máximo)
- ✅ Checkout del código
- ✅ Setup Node.js 20
- ✅ Instalación de dependencias (root + guiders-20)
- ✅ Linting del código
- ✅ Build Angular SSR
- ✅ Tests unitarios con Jest
- ✅ Verificación de estructura de build

### 2. Deploy a Staging (20 min máximo)
- 🌐 Conexión VPN con WireGuard
- 🔧 Preparación del entorno del servidor
- 📦 Build optimizado para staging
- 📤 Upload de archivos via SSH
- 🛠️ Instalación de dependencias de producción
- ⚡ Gestión segura con PM2
- 🔍 Verificaciones de salud

## 🔧 Configuración necesaria

### Secrets en GitHub
```
# VPN/Network
WG_PRIVATE_KEY=<clave-privada-wireguard>
WG_SERVER_PUBLIC_KEY=<clave-publica-servidor>
WG_SERVER_ENDPOINT=<ip-servidor-vpn>

# Staging Server
STAGING_HOST=<ip-servidor-staging>
STAGING_USER=<usuario-ssh>
STAGING_SSH_PASSWORD=<password-ssh>
```

### Servidor de staging
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2
pm2 startup && pm2 save

# Directorios
sudo mkdir -p /var/www/guiders-frontend-staging
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/www/guiders-frontend-staging /var/log/pm2

# Firewall
sudo ufw allow 4001/tcp
```

## 📊 Monitoreo y gestión

### Información del deployment
- **URL**: `http://STAGING_HOST:4001`
- **PM2 App**: `guiders-frontend-staging`
- **Logs**: `/var/log/pm2/guiders-frontend-staging*.log`
- **Path**: `/var/www/guiders-frontend-staging`

### Comandos útiles en el servidor

```bash
# Estado de la aplicación
pm2 status guiders-frontend-staging

# Logs en tiempo real
pm2 logs guiders-frontend-staging --lines 50

# Reiniciar aplicación
pm2 restart guiders-frontend-staging

# Verificar conectividad
curl http://localhost:4001

# Monitoreo de recursos
pm2 monit

# Verificar puerto
netstat -tulpn | grep :4001

# Verificar estructura
ls -la /var/www/guiders-frontend-staging/dist/guiders-20/
```

### Scripts de verificación
```bash
# En el servidor
cd /var/www/guiders-frontend-staging
./verify-staging-deployment.sh
```

## 🛡️ Seguridad

### VPN Requerida
- Conexión WireGuard obligatoria para acceso al servidor
- IP del cliente: `10.0.0.3/24`
- Red VPN: `10.0.0.0/24`

### Gestión de procesos
- PM2 con clustering para alta disponibilidad
- Reinicio automático en caso de fallos
- Límites de memoria configurados (500MB)
- Timeouts configurados para evitar bloqueos

## 🔍 Troubleshooting

### Problemas comunes

#### 1. Error de VPN
```
❌ No se puede establecer conectividad VPN
```
**Solución**:
- Verificar secrets de WireGuard
- Verificar que el servidor VPN esté corriendo
- Verificar firewall en el servidor VPN

#### 2. Error de build
```
❌ Error: server.mjs no encontrado
```
**Solución**:
- Verificar que el build de Angular SSR se ejecute correctamente
- Verificar configuración de `angular.json`
- Verificar que la aplicación esté configurada para SSR

#### 3. Error de PM2
```
❌ La aplicación no está corriendo después del inicio
```
**Solución**:
- Verificar logs: `pm2 logs guiders-frontend-staging`
- Verificar dependencias instaladas
- Verificar puerto 4001 disponible

#### 4. Error de conectividad
```
❌ Aplicación no responde a peticiones HTTP
```
**Solución**:
- Verificar que PM2 esté corriendo: `pm2 status`
- Verificar puerto: `netstat -tulpn | grep :4001`
- Verificar firewall: `sudo ufw status`

### Logs importantes

```bash
# Logs de la aplicación
tail -f /var/log/pm2/guiders-frontend-staging.log

# Logs de errores
tail -f /var/log/pm2/guiders-frontend-staging-error.log

# Logs del sistema
journalctl -u pm2-$USER -f
```

## 🔄 Rollback

### Rollback automático
En caso de fallo, se mantienen backups automáticos:
```bash
# Listar backups disponibles
ls -la /tmp/guiders-frontend-staging-backup_*

# Restaurar backup
sudo cp -r /tmp/guiders-frontend-staging-backup_TIMESTAMP/* /var/www/guiders-frontend-staging/
pm2 restart guiders-frontend-staging
```

### Rollback manual
```bash
# Detener aplicación actual
pm2 stop guiders-frontend-staging

# Restaurar versión anterior
git checkout COMMIT_ANTERIOR
# Ejecutar deployment manual o usar GitHub Actions

# O restaurar desde backup
sudo cp -r /tmp/guiders-frontend-staging-backup_LATEST/* /var/www/guiders-frontend-staging/
pm2 restart guiders-frontend-staging
```

## 📈 Métricas y rendimiento

### Configuración PM2
- **Instancias**: 1 (cluster mode)
- **Memoria máxima**: 500MB con reinicio automático
- **Node args**: `--max-old-space-size=512`
- **Reinicio**: Máximo 10 reintentos con delay de 4s

### Optimizaciones de staging
- Dependencies optimizadas (sin dev dependencies)
- Build específico para staging
- Logs centralizados en `/var/log/pm2/`
- Health checks automáticos

## 🔗 URLs y recursos

- **Staging URL**: `http://STAGING_HOST:4001`
- **GitHub Actions**: `.github/workflows/deploy-staging.yml`
- **PM2 Config**: `.github/ecosystem.staging.config.js`
- **Management Script**: `.github/pm2-staging-management.sh`
- **Verification Script**: `.github/verify-staging-deployment.sh`

Este deployment está optimizado para el desarrollo ágil y testing continuo, proporcionando un entorno de staging robusto y automatizado para el frontend Angular 20 con SSR.
