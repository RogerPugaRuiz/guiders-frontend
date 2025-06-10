/**
 * Configuración del entorno de producción
 */
export const environment = {
  production: true,
  apiUrl: 'https://guiders.ancoradual.com/api',
  apiDocUrl: 'https://guiders.ancoradual.com/api/doc',
  // URL para la conexión WebSocket en producción
  websocketUrl: 'wss://guiders.ancoradual.com',
  appName: 'Guiders',
  version: '1.0.0',
  enableDevTools: false,
  logLevel: 'error'
};
