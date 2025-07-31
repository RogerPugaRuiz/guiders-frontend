# Configuración de Secrets para Deploy de Staging - Frontend

## Secrets requeridos en GitHub Repository Settings

Para que el workflow de staging funcione correctamente, necesitas configurar los siguientes secrets en tu repositorio de GitHub:

### 🌐 VPN/Network Secrets
- `WG_PRIVATE_KEY` - Clave privada de WireGuard para conexión VPN
- `WG_SERVER_PUBLIC_KEY` - Clave pública del servidor WireGuard
- `WG_SERVER_ENDPOINT` - IP/dominio del servidor WireGuard (ej: vpn.tudominio.com)

### 🖥️ Staging Server Secrets
- `STAGING_HOST` - IP del servidor de staging (ej: 10.0.0.10)
- `STAGING_USER` - Usuario SSH para acceso al servidor (ej: ubuntu, root)
- `STAGING_SSH_PASSWORD` - Contraseña SSH para el usuario

## 📋 Cómo configurar los secrets:

1. Ve a tu repositorio en GitHub
2. Navega a **Settings** > **Secrets and variables** > **Actions**
3. Haz clic en **New repository secret**
4. Agrega cada uno de los secrets listados arriba

## 🔧 Configuración del servidor de staging:

### Prerrequisitos en el servidor:
```bash
# 1. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar PM2 globalmente
sudo npm install -g pm2

# 3. Configurar PM2 para auto-start
pm2 startup
pm2 save

# 4. Crear directorios necesarios
sudo mkdir -p /var/www/guiders-frontend-staging
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/www/guiders-frontend-staging
sudo chown $USER:$USER /var/log/pm2

# 5. Configurar firewall (opcional)
sudo ufw allow 4001/tcp  # Puerto para la aplicación staging
```

### Configuración de WireGuard en el servidor:
```bash
# Instalar WireGuard
sudo apt update && sudo apt install -y wireguard

# Configurar según tu setup de red VPN específico
```

## 🚀 Características del workflow:

### ✅ Lo que hace:
1. **Testing y Build**: Ejecuta linting, tests unitarios y build de Angular SSR
2. **VPN Connection**: Se conecta al servidor via WireGuard VPN para seguridad
3. **Deployment**: Despliega la aplicación Angular SSR con Express server
4. **PM2 Management**: Gestiona el proceso con PM2 para alta disponibilidad
5. **Health Checks**: Verifica que la aplicación esté funcionando correctamente

### 🏗️ Estructura desplegada:
```
/var/www/guiders-frontend-staging/
├── dist/
│   └── guiders-20/
│       ├── browser/          # Cliente Angular (SSR/CSR)
│       └── server/           # Servidor Express (server.mjs)
├── node_modules/             # Dependencias de producción
├── package.json              # Optimizado para staging
├── ecosystem.staging.config.js  # Configuración PM2
└── logs/                     # Logs de la aplicación
```

### 🔄 Trigger del workflow:
- Push a branch `develop`
- Push a cualquier branch `feature/*`
- Ejecución manual via `workflow_dispatch`

### 📊 Monitoreo:
- **Puerto**: 4001
- **PM2 App**: guiders-frontend-staging
- **Logs**: /var/log/pm2/guiders-frontend-staging*.log
- **Health check**: http://localhost:4001

## ⚠️ Notas importantes:

1. **VPN requerida**: El deploy requiere conexión VPN para acceso seguro al servidor
2. **Hexagonal Architecture**: Respeta la arquitectura hexagonal del proyecto
3. **Angular 20 SSR**: Configurado específicamente para Angular 20 con SSR
4. **PM2 Clustering**: Usa modo cluster para mejor rendimiento
5. **Backups automáticos**: Crea backups antes de cada deploy

## 🛠️ Comandos útiles en el servidor:

```bash
# Ver estado de la aplicación
pm2 status guiders-frontend-staging

# Ver logs en tiempo real
pm2 logs guiders-frontend-staging --lines 50

# Reiniciar aplicación
pm2 restart guiders-frontend-staging

# Verificar conectividad
curl http://localhost:4001

# Ver uso de recursos
pm2 monit
```
