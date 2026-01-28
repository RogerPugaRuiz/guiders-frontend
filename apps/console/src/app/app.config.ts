import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth, authInterceptor } from 'angular-auth-oidc-client';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import {
  ENVIRONMENT_TOKEN,
  authRefreshInterceptor,
  UserService,
  SessionGuardianService,
} from '@guiders-frontend/auth/data-access/session';
import { ThemeService } from '@guiders-frontend/theme-service';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';
import { CommercialStatusService } from '@guiders-frontend/commercial-status';
import { WebSocketService } from '@guiders-frontend/chat/data-access/websocket-service';
import { UnreadMessagesService } from '@guiders-frontend/unread-messages-service';
import { ChatService } from '@guiders-frontend/chat-service';
import { EscalationService } from '@guiders-frontend/escalation-service';
import { firstValueFrom } from 'rxjs';

/**
 * Factory para inicializar el usuario, tema y presencia del comercial al arrancar la aplicación.
 * Primero carga el usuario, luego el tema, y finalmente conecta la presencia del comercial y WebSocket.
 */
function initializeApp() {
  const userService = inject(UserService);
  const themeService = inject(ThemeService);
  const presenceService = inject(CommercialPresenceService);
  const statusService = inject(CommercialStatusService);
  const webSocketService = inject(WebSocketService);
  const unreadMessagesService = inject(UnreadMessagesService);
  const chatService = inject(ChatService);
  const escalationService = inject(EscalationService);

  return async () => {
    // 0. Configurar ThemeService con la URL base
    themeService.setBaseUrl(environment.api.baseUrl);

    // 1. Cargar el usuario
    console.log('[AppInitializer] 🚀 Cargando usuario...');
    try {
      const user = await firstValueFrom(userService.fetchUser());
      console.log('[AppInitializer] ✅ Usuario cargado:', user.sub);

      // 1.1 Cargar tema de marca blanca después de tener el usuario
      if (user?.companyId) {
        console.log(
          '[AppInitializer] 🎨 Cargando tema para company:',
          user.companyId
        );
        try {
          await firstValueFrom(themeService.loadAndApplyTheme(user.companyId));
          console.log('[AppInitializer] ✅ Tema aplicado correctamente');
        } catch (themeError: unknown) {
          const msg =
            themeError instanceof Error ? themeError.message : 'Unknown error';
          console.warn('[AppInitializer] ⚠️ Error cargando tema:', msg);
          themeService.applyDefaults();
        }
      } else {
        console.log(
          '[AppInitializer] ℹ️ Usuario sin companyId, aplicando tema por defecto'
        );
        themeService.applyDefaults();
      }

      // 1.1 Configurar usuario en UnreadMessagesService para filtrar mensajes propios
      console.log(
        '[AppInitializer] 📨 Configurando UnreadMessagesService con usuario:',
        user.sub
      );
      unreadMessagesService.setCurrentUser(user.sub);

      // 2. Conectar presencia del comercial (solo si hay usuario)
      if (user) {
        console.log('[AppInitializer] 🔌 Conectando comercial...');
        try {
          const commercial = await firstValueFrom(presenceService.connect());
          console.log(
            '[AppInitializer] ✅ Comercial conectado:',
            commercial.id
          );

          // 3. Iniciar polling del estado del comercial
          console.log('[AppInitializer] 📊 Iniciando polling de estado...');
          statusService.startPolling(commercial.id);

          // 4. Habilitar reconexión automática por actividad del usuario
          console.log(
            '[AppInitializer] 🔄 Habilitando reconexión automática...'
          );
          presenceService.enableAutoReconnectOnActivity();

          // 5. Conectar WebSocket y unirse a salas de presencia
          console.log('[AppInitializer] 🌐 Conectando WebSocket...');
          webSocketService.connect();

          // Esperar a que se conecte el WebSocket (máximo 3 segundos)
          const waitForConnection = new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
              if (webSocketService.connected) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);

            // Timeout después de 3 segundos
            setTimeout(() => {
              clearInterval(checkInterval);
              resolve();
            }, 3000);
          });

          await waitForConnection;

          if (webSocketService.connected) {
            console.log('[AppInitializer] ✅ WebSocket conectado');
            console.log(
              '[AppInitializer] 🚨 Servicio de Escalaciones inicializado y escuchando eventos',
              {
                escalationCount: escalationService.escalationCount(),
              }
            );
            console.log('[AppInitializer] 📋 Usuario completo:', user);

            // Suscribirse al evento welcome
            webSocketService.welcome$.subscribe((event) => {
              console.log(
                '[AppInitializer] 👋 Bienvenida del servidor:',
                event.message
              );
            });

            // Suscribirse a errores
            webSocketService.error$.subscribe((event) => {
              console.error(
                '[AppInitializer] ❌ Error WebSocket:',
                event.message
              );
            });

            console.log(
              '═══════════════════════════════════════════════════════════'
            );
            console.log('🚀 [AppInitializer] NUEVA ARQUITECTURA DE PRESENCIA');
            console.log(
              '═══════════════════════════════════════════════════════════'
            );
            console.log('ℹ️  Ya NO se une a sala de tenant (tenant:companyId)');
            console.log(
              'ℹ️  El comercial SOLO recibe eventos presence:changed de:'
            );
            console.log('   1️⃣  Visitantes con los que tiene chats activos');
            console.log('   2️⃣  Sus propios cambios de presencia');
            console.log('ℹ️  El filtrado lo hace el backend automáticamente');
            console.log(
              '═══════════════════════════════════════════════════════════'
            );
            console.log('');
            console.log(
              '📡 [AppInitializer] Uniéndose a sala de presencia personal...'
            );
            console.log('   👤 Commercial ID:', user.sub);
            console.log('   🏷️  User Type: commercial');
            console.log('   🚪 Room ID: commercial:' + user.sub);
            console.log('');

            webSocketService.joinPresenceRoom(user.sub, 'commercial');

            console.log('');
            console.log(
              '✅ [AppInitializer] Proceso de unión a sala de presencia completado'
            );
            console.log(
              '🔔 [AppInitializer] Ahora recibirás eventos presence:changed filtrados'
            );
            console.log(
              '═══════════════════════════════════════════════════════════'
            );
            console.log('');

            // Mostrar resumen de salas activas
            setTimeout(() => {
              webSocketService.logActiveRooms();
            }, 500);

            // 6. Cargar chats y contadores de mensajes no leídos
            console.log(
              '═══════════════════════════════════════════════════════════'
            );
            console.log(
              '📨 [AppInitializer] INICIALIZAR NOTIFICACIONES GLOBALES'
            );
            console.log(
              '═══════════════════════════════════════════════════════════'
            );
            console.log('📥 [AppInitializer] Cargando chats del comercial...');

            try {
              const chats = await firstValueFrom(
                chatService.getCommercialChats(user.sub)
              );
              console.log(`✅ [AppInitializer] ${chats.length} chats cargados`);

              if (chats.length > 0) {
                const chatIds = chats.map((chat) => chat.chatId);

                // 6.1 Unirse a salas de WebSocket para recibir mensajes en tiempo real
                console.log(
                  `📡 [AppInitializer] Uniéndose a ${chatIds.length} salas de chat...`
                );
                webSocketService.joinMultipleRooms(chatIds);
                console.log(
                  `✅ [AppInitializer] Suscrito a ${chatIds.length} chats para notificaciones en tiempo real`
                );

                // 6.2 Refrescar contadores de mensajes no leídos
                console.log(
                  `🔄 [AppInitializer] Refrescando contadores de mensajes no leídos...`
                );
                unreadMessagesService.refreshUnreadCounts(chatIds);
                console.log(
                  `✅ [AppInitializer] Contadores de mensajes no leídos inicializados`
                );
              } else {
                console.log('ℹ️  [AppInitializer] No hay chats para cargar');
              }

              console.log(
                '═══════════════════════════════════════════════════════════'
              );
              console.log(
                '✅ [AppInitializer] Notificaciones globales inicializadas'
              );
              console.log(
                '🔔 [AppInitializer] Badge y notificaciones funcionarán en todas las rutas'
              );
              console.log(
                '═══════════════════════════════════════════════════════════'
              );
              console.log('');
            } catch (error: unknown) {
              const errorMessage =
                error instanceof Error ? error.message : 'Error desconocido';
              console.warn(
                '⚠️  [AppInitializer] Error al cargar chats:',
                errorMessage
              );
              // No lanzar error para permitir que la app continúe
            }
          } else {
            console.warn(
              '[AppInitializer] ⚠️ WebSocket no se conectó a tiempo'
            );
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          console.warn(
            '[AppInitializer] ⚠️ Error al conectar comercial:',
            errorMessage
          );
          // No lanzar error para permitir que la app continúe
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn(
        '[AppInitializer] ⚠️ No se pudo cargar el usuario:',
        errorMessage
      );
      // Aplicar tema por defecto si no hay usuario
      themeService.applyDefaults();
      // No lanzar error para permitir que la app continúe
      // El auth guard manejará la redirección al login si es necesario
    }
  };
}

/**
 * Factory para inicializar el SessionGuardian
 * Protege la sesión contra expiraciones silenciosas
 */
function initializeSessionGuardian() {
  const sessionGuardian = inject(SessionGuardianService);

  return () => {
    sessionGuardian.initialize({
      inactivityRefreshMinutes: 5, // Refresh si >5 min inactivo
      inactivityExpiredMinutes: 30, // Force relogin si >30 min
      heartbeatIntervalMinutes: 0, // Deshabilitado por defecto
      debug: !environment.production, // Debug en desarrollo
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(
      withInterceptors([
        authRefreshInterceptor, // Refresh automático antes que el auth interceptor
        authInterceptor(),
      ])
    ),
    provideAuth({
      config: {
        authority: environment.auth.authority,
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: environment.auth.clientId,
        scope: environment.auth.scope,
        responseType: 'code',
        useRefreshToken: true,
        silentRenew: true,
        secureRoutes: environment.auth.secureRoutes,
      },
    }),
    // Proporcionar el environment a las librerías
    { provide: ENVIRONMENT_TOKEN, useValue: environment },
    // Inicializar la aplicación (usuario + presencia comercial)
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
    },
    // Inicializar SessionGuardian para protección de sesión
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSessionGuardian,
      multi: true,
    },
  ],
};
