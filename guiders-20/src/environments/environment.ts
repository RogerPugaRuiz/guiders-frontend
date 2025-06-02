/**
 * Configuración del entorno de desarrollo
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  apiDocUrl: 'http://localhost:3000/doc',
  // URL para la conexión WebSocket (mismo servidor que la API pero usando puerto específico)
  websocketUrl: 'ws://localhost:3000',
  appName: 'Guiders',
  version: '1.0.0',
  enableDevTools: true,
  logLevel: 'debug'
};
