import { io, Socket } from 'socket.io-client';

/**
 * Cliente WebSocket de prueba para simular eventos de presencia
 *
 * Este helper puede ser usado para:
 * 1. Probar la conexión WebSocket manualmente
 * 2. Simular eventos de presencia desde un script Node.js
 * 3. Debugging de problemas con WebSocket
 *
 * USO:
 * ```typescript
 * const client = new WebSocketTestClient('http://localhost:3000');
 * await client.connect();
 * await client.joinTenantRoom('tenant-id');
 *
 * client.onPresenceChanged((event) => {
 *   console.log('Evento recibido:', event);
 * });
 * ```
 */
export class WebSocketTestClient {
  private socket: Socket | null = null;
  private wsUrl: string;
  private connected = false;

  constructor(wsUrl: string = 'http://localhost:3000') {
    this.wsUrl = wsUrl;
  }

  /**
   * Conectar al servidor WebSocket
   */
  async connect(authToken?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.wsUrl, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        withCredentials: true,
        autoConnect: true,
        reconnection: false,
        auth: authToken ? { token: authToken } : undefined,
      });

      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando conexión WebSocket'));
      }, 5000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.connected = true;
        console.log('✅ Conectado al WebSocket - Socket ID:', this.socket?.id);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        this.connected = false;
        console.log('⚠️ Desconectado del WebSocket - Razón:', reason);
      });

      this.socket.on('error', (data) => {
        console.error('❌ Error del WebSocket:', data);
      });

      this.socket.on('welcome', (data) => {
        console.log('👋 Mensaje de bienvenida:', data.message);
        console.log('🆔 Client ID:', data.clientId);
      });
    });
  }

  /**
   * Unirse a la sala del tenant
   */
  async joinTenantRoom(tenantId: string): Promise<any> {
    if (!this.socket || !this.connected) {
      throw new Error('No conectado. Usa connect() primero.');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando evento tenant:joined'));
      }, 5000);

      this.socket!.on('tenant:joined', (data) => {
        clearTimeout(timeout);
        console.log('✅ Unido a sala del tenant:', data.roomName);
        resolve(data);
      });

      console.log('📤 Emitiendo tenant:join con tenantId:', tenantId);
      this.socket!.emit('tenant:join', { tenantId });
    });
  }

  /**
   * Unirse a la sala de presencia personal
   */
  async joinPresenceRoom(userId: string, userType: 'commercial' | 'visitor'): Promise<void> {
    if (!this.socket || !this.connected) {
      throw new Error('No conectado. Usa connect() primero.');
    }

    console.log(`📤 Emitiendo presence:join para ${userType}:${userId}`);
    this.socket.emit('presence:join', { userId, userType });

    // Dar tiempo para que se procese
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Escuchar eventos presence:changed
   */
  onPresenceChanged(callback: (event: PresenceChangedEvent) => void): void {
    if (!this.socket) {
      throw new Error('Socket no inicializado. Usa connect() primero.');
    }

    this.socket.on('presence:changed', (data) => {
      console.log('📨 Evento presence:changed recibido:', data);
      callback(data);
    });
  }

  /**
   * Escuchar cualquier evento
   */
  on(eventName: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      throw new Error('Socket no inicializado. Usa connect() primero.');
    }

    this.socket.on(eventName, callback);
  }

  /**
   * Emitir un evento
   */
  emit(eventName: string, data: any): void {
    if (!this.socket || !this.connected) {
      throw new Error('No conectado. Usa connect() primero.');
    }

    this.socket.emit(eventName, data);
  }

  /**
   * Desconectar del servidor
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Desconectando del WebSocket...');
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.connected && this.socket !== null;
  }

  /**
   * Obtener el socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

/**
 * Interfaz para eventos de presencia
 */
export interface PresenceChangedEvent {
  userId: string;
  userType: 'commercial' | 'visitor';
  status: 'online' | 'offline' | 'away' | 'busy' | 'chatting';
  previousStatus: 'online' | 'offline' | 'away' | 'busy' | 'chatting';
  timestamp: string;
}

/**
 * Script de ejemplo para probar manualmente
 *
 * Para ejecutar:
 * 1. Guardar este código en un archivo test-websocket.ts
 * 2. Ejecutar: npx ts-node test-websocket.ts
 */
export async function testWebSocketManually() {
  const TENANT_ID = '83504359-b783-41dd-bee1-5237c009179d';
  const VISITOR_ID = '9598b495-205c-46af-9c06-d5dffb28ee21';

  const client = new WebSocketTestClient('http://localhost:3000');

  try {
    console.log('🔌 Conectando al WebSocket...');
    await client.connect();

    console.log('🏢 Uniéndose a sala del tenant...');
    await client.joinTenantRoom(TENANT_ID);

    console.log('👂 Escuchando eventos presence:changed...');
    let eventCount = 0;
    client.onPresenceChanged((event) => {
      eventCount++;
      console.log(`\n[Evento #${eventCount}]`);
      console.log(`  Usuario: ${event.userId}`);
      console.log(`  Tipo: ${event.userType}`);
      console.log(`  Cambio: ${event.previousStatus} → ${event.status}`);
      console.log(`  Timestamp: ${event.timestamp}`);
    });

    console.log('\n✅ Cliente WebSocket configurado correctamente');
    console.log('💡 Ahora simula un cambio de estado en el backend para ver eventos');
    console.log(`   Tenant: ${TENANT_ID}`);
    console.log(`   Visitor esperado: ${VISITOR_ID}`);
    console.log('\nPresiona Ctrl+C para salir\n');

    // Mantener el proceso vivo
    await new Promise(() => {
      // Infinito, hasta que el usuario presione Ctrl+C
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    client.disconnect();
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  testWebSocketManually().catch(console.error);
}
