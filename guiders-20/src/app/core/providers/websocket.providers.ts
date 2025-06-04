import { APP_INITIALIZER, inject } from '@angular/core';
import { WebSocketService } from '../services/websocket.service';
import { AuthService } from '../services/auth.service';

/**
 * Función de inicialización para el WebSocket
 */
function initializeWebSocket(): () => Promise<void> {
  return async (): Promise<void> => {
    const websocketService = inject(WebSocketService);
    const authService = inject(AuthService);
    
    console.log('🚀 [WebSocket Provider] Inicializando WebSocket...');
    
    // Esperar un poco para que Angular se inicialice completamente
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar si hay una sesión activa antes de conectar
    try {
      const session = await authService.getSession().toPromise();
      if (session?.token) {
        console.log('🔌 [WebSocket Provider] Sesión encontrada, conectando WebSocket...');
        websocketService.connect();
      } else {
        console.log('⚠️ [WebSocket Provider] No hay sesión activa, WebSocket se conectará cuando el usuario se autentique');
      }
    } catch (error) {
      console.warn('⚠️ [WebSocket Provider] Error verificando sesión inicial:', error);
    }
  };
}

/**
 * Providers para la inicialización del WebSocket
 */
export const WEBSOCKET_PROVIDERS = [
  {
    provide: APP_INITIALIZER,
    useFactory: initializeWebSocket,
    multi: true
  }
];
