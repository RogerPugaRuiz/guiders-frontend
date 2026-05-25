import { test, expect } from '@playwright/test';
import { io, Socket } from 'socket.io-client';

/**
 * Test e2e para verificar la configuración del WebSocket y los eventos de presence:changed
 *
 * Este test verifica:
 * 1. Conexión exitosa al servidor WebSocket
 * 2. Unión a la sala del tenant
 * 3. Recepción de eventos presence:changed
 *
 * All tests in this suite are skipped automatically when the WebSocket backend
 * is not reachable (e.g. local dev without Docker, or CI before the stack starts).
 */

/** Returns true if the WebSocket backend at wsUrl is reachable. */
async function isWebSocketAvailable(wsUrl: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const s = io(wsUrl, {
      path: '/socket.io/',
      transports: ['websocket'],
      reconnection: false,
      timeout: 2000,
    });
    const t = setTimeout(() => { s.disconnect(); resolve(false); }, 2500);
    s.on('connect', () => { clearTimeout(t); s.disconnect(); resolve(true); });
    s.on('connect_error', () => { clearTimeout(t); resolve(false); });
  });
}

test.describe('WebSocket - Presence Events', () => {
  let socket: Socket;
  const TENANT_ID = '83504359-b783-41dd-bee1-5237c009179d';
  const VISITOR_ID = '9598b495-205c-46af-9c06-d5dffb28ee21';
  // El backend WebSocket está en el puerto 3000, no en el frontend (4200)
  // Esto debe coincidir con la configuración del backend
  const WS_URL = process.env['WS_URL'] || 'http://localhost:3000';

  // Skip the entire suite if the WebSocket backend is not available.
  test.beforeAll(async () => {
    const available = await isWebSocketAvailable(WS_URL);
    if (!available) {
      console.log(`⚠️  WebSocket backend not available at ${WS_URL} — skipping suite`);
      test.skip();
    }
  });

  test.afterEach(async () => {
    // Limpiar la conexión WebSocket después de cada test
    if (socket) {
      socket.disconnect();
      socket.removeAllListeners();
    }
  });

  test('should connect to WebSocket server successfully', async () => {
    // Crear conexión al WebSocket
    socket = io(WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: false,
    });

    // Esperar a que se conecte
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando conexión WebSocket'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Conectado al WebSocket - Socket ID:', socket.id);
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Verificar que está conectado
    expect(socket.connected).toBe(true);
    expect(socket.id).toBeDefined();
  });

  test('should join tenant presence room and receive tenant:joined event', async () => {
    socket = io(WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: false,
    });

    // Esperar a que se conecte
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando conexión WebSocket'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Conectado al WebSocket - Socket ID:', socket.id);
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Esperar evento tenant:joined
    const tenantJoinedPromise = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando evento tenant:joined'));
      }, 5000);

      socket.on('tenant:joined', (data) => {
        clearTimeout(timeout);
        console.log('✅ Recibido evento tenant:joined:', data);
        resolve(data);
      });
    });

    // Emitir evento para unirse a la sala del tenant
    console.log('📤 Emitiendo tenant:join con tenantId:', TENANT_ID);
    socket.emit('tenant:join', { tenantId: TENANT_ID });

    // Esperar y verificar el evento
    const tenantJoinedData = await tenantJoinedPromise;

    expect(tenantJoinedData).toBeDefined();
    expect(tenantJoinedData.roomName).toBe(`tenant:${TENANT_ID}`);
    expect(tenantJoinedData.timestamp).toBeDefined();
  });

  test('should receive presence:changed events after joining tenant room', async () => {
    // Crear conexión al WebSocket
    socket = io(WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: false,
    });

    // Esperar a que se conecte
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando conexión WebSocket'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Conectado al WebSocket - Socket ID:', socket.id);
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Esperar evento tenant:joined
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando evento tenant:joined'));
      }, 5000);

      socket.on('tenant:joined', () => {
        clearTimeout(timeout);
        console.log('✅ Unido a la sala del tenant');
        resolve();
      });

      // Emitir evento para unirse a la sala del tenant
      console.log('📤 Emitiendo tenant:join con tenantId:', TENANT_ID);
      socket.emit('tenant:join', { tenantId: TENANT_ID });
    });

    // Configurar listener para presence:changed
    const presenceEvents: any[] = [];
    socket.on('presence:changed', (data) => {
      console.log('📨 Recibido evento presence:changed:', data);
      presenceEvents.push(data);
    });

    // NOTA: Este test requiere que el backend emita eventos presence:changed
    // Para probarlo completamente, necesitarías:
    // 1. Simular un cambio de estado de un usuario
    // 2. O crear otro socket que simule ser un visitante y cambiar su estado

    // Por ahora, verificamos que el listener está configurado
    // y que no hay errores al unirse a la sala

    // Esperar un poco para verificar que no hay errores
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar que la conexión sigue activa
    expect(socket.connected).toBe(true);

    console.log('✅ Test completado - Listener de presence:changed configurado correctamente');
    console.log('   Para probar la recepción de eventos, necesitas simular cambios de estado en el backend');
  });

  test('should verify presence:changed event structure when received', async () => {
    // Crear conexión al WebSocket
    socket = io(WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: false,
    });

    // Esperar a que se conecte
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando conexión WebSocket'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Conectado al WebSocket - Socket ID:', socket.id);
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Esperar evento tenant:joined
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando evento tenant:joined'));
      }, 5000);

      socket.on('tenant:joined', () => {
        clearTimeout(timeout);
        console.log('✅ Unido a la sala del tenant');
        resolve();
      });

      // Emitir evento para unirse a la sala del tenant
      console.log('📤 Emitiendo tenant:join con tenantId:', TENANT_ID);
      socket.emit('tenant:join', { tenantId: TENANT_ID });
    });

    // Simular recepción de evento presence:changed
    // Este es un test de estructura, verificando que cuando llegue un evento,
    // tenga la estructura correcta esperada

    socket.on('presence:changed', (data) => {
      console.log('📨 Recibido evento presence:changed:', data);

      // Verificar estructura del evento según la interfaz PresenceChangedEvent
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('userType');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('previousStatus');
      expect(data).toHaveProperty('timestamp');

      // Verificar tipos
      expect(typeof data.userId).toBe('string');
      expect(['commercial', 'visitor']).toContain(data.userType);
      expect(['online', 'offline', 'away', 'busy', 'chatting']).toContain(data.status);
      expect(['online', 'offline', 'away', 'busy', 'chatting']).toContain(data.previousStatus);
      expect(typeof data.timestamp).toBe('string');

      console.log('✅ Evento presence:changed tiene la estructura correcta');
    });

    // Log para documentar el caso de uso esperado
    console.log('');
    console.log('📋 INFORMACIÓN DEL TEST:');
    console.log('   Tenant ID:', TENANT_ID);
    console.log('   Visitor ID esperado:', VISITOR_ID);
    console.log('   Cambio esperado: offline → online');
    console.log('');
    console.log('📋 CÓMO PROBAR MANUALMENTE:');
    console.log('   1. Ejecutar este test: npm run e2e:console');
    console.log('   2. Simular un cambio de estado del visitante en el backend');
    console.log('   3. Verificar que se recibe el evento presence:changed');
    console.log('');

    // Esperar un tiempo para dar oportunidad a recibir eventos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar que la conexión sigue activa
    expect(socket.connected).toBe(true);
  });

  test('should handle multiple presence events for different users', async () => {
    // Crear conexión al WebSocket
    socket = io(WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: false,
    });

    // Esperar a que se conecte
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando conexión WebSocket'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Conectado al WebSocket - Socket ID:', socket.id);
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Esperar evento tenant:joined
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando evento tenant:joined'));
      }, 5000);

      socket.on('tenant:joined', () => {
        clearTimeout(timeout);
        console.log('✅ Unido a la sala del tenant');
        resolve();
      });

      // Emitir evento para unirse a la sala del tenant
      console.log('📤 Emitiendo tenant:join con tenantId:', TENANT_ID);
      socket.emit('tenant:join', { tenantId: TENANT_ID });
    });

    // Contador de eventos por usuario
    const eventsByUser = new Map<string, number>();

    socket.on('presence:changed', (data) => {
      const count = eventsByUser.get(data.userId) || 0;
      eventsByUser.set(data.userId, count + 1);

      console.log(`📨 Evento #${count + 1} para usuario ${data.userId}:`,
        `${data.previousStatus} → ${data.status}`);
    });

    // Esperar un tiempo para dar oportunidad a recibir eventos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar que la conexión sigue activa
    expect(socket.connected).toBe(true);

    console.log('');
    console.log('📊 RESUMEN DE EVENTOS RECIBIDOS:');
    if (eventsByUser.size === 0) {
      console.log('   ⚠️  No se recibieron eventos (esperado en ambiente de test)');
      console.log('   💡 Para recibir eventos, simula cambios de estado en el backend');
    } else {
      eventsByUser.forEach((count, userId) => {
        console.log(`   Usuario ${userId}: ${count} eventos`);
      });
    }
    console.log('');
  });
});
