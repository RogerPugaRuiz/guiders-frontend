/**
 * Tipos para el sistema de presencia y typing indicators
 * Basado en la guía de integración del backend
 */

/**
 * Estados de presencia posibles
 */
export type PresenceStatus =
  | 'online' // Conectado y disponible
  | 'offline' // Desconectado
  | 'away' // Conectado pero inactivo >5min
  | 'busy' // Solo comerciales (múltiples chats)
  | 'chatting'; // Solo visitantes (activo en chat)

/**
 * Tipo de usuario en el sistema
 */
export type UserType = 'commercial' | 'visitor';

/**
 * Participante de un chat con su estado de presencia
 */
export interface Participant {
  userId: string;
  userType: UserType;
  connectionStatus: PresenceStatus;
  isTyping: boolean;
  lastActivity?: string; // ISO 8601 timestamp
}

/**
 * Respuesta del endpoint GET /presence/chat/:chatId
 */
export interface ChatPresence {
  chatId: string;
  participants: Participant[];
  timestamp: string; // ISO 8601 timestamp
}

/**
 * Evento de cambio de presencia (WebSocket: presence:changed)
 */
export interface PresenceChangedEvent {
  userId: string;
  userType: UserType;
  status: PresenceStatus;
  previousStatus: PresenceStatus;
  timestamp: string; // ISO 8601 timestamp
}

/**
 * Evento de typing start (WebSocket: typing:start)
 */
export interface TypingStartEvent {
  chatId: string;
  userId: string;
  userType: UserType;
  timestamp: string; // ISO 8601 timestamp
}

/**
 * Evento de typing stop (WebSocket: typing:stop)
 */
export interface TypingStopEvent {
  chatId: string;
  userId: string;
  userType: UserType;
  timestamp: string; // ISO 8601 timestamp
}

/**
 * Request para unirse a una sala de chat
 */
export interface ChatJoinRequest {
  chatId: string;
}

/**
 * Response de chat:join
 */
export interface ChatJoinResponse {
  success: boolean;
  message?: string;
}

/**
 * Payload para emitir typing:start
 */
export interface EmitTypingStartPayload {
  chatId: string;
  userId: string;
  userType: UserType;
}

/**
 * Payload para emitir typing:stop
 */
export interface EmitTypingStopPayload {
  chatId: string;
  userId: string;
  userType: UserType;
}

/**
 * Estado de presencia de un chat para UI
 */
export interface ChatPresenceState {
  chatId: string;
  participants: Map<string, Participant>; // userId -> Participant
  typingUsers: Set<string>; // Set de userIds que están escribiendo
  lastUpdated: Date;
}

/**
 * Configuración del sistema de presencia
 */
export interface PresenceConfig {
  /**
   * Tiempo en ms para debounce de typing events (default: 300)
   */
  typingDebounceMs?: number;

  /**
   * Tiempo en ms para auto-stop de typing (default: 2000)
   */
  typingAutoStopMs?: number;

  /**
   * Habilitar logs de debug
   */
  debug?: boolean;
}

/**
 * Evento emitido cuando un cliente se une exitosamente a una sala de empresa (tenant)
 */
export interface TenantJoinedEvent {
  companyId: string; // ID de la empresa
  roomName: string;
  timestamp: number;
  automatic?: boolean; // true si fue unión automática al conectarse
}

/**
 * Evento de bienvenida al conectarse al WebSocket
 */
export interface WelcomeEvent {
  message: string;
  clientId: string;
  timestamp: number;
}

/**
 * Evento de error del WebSocket
 */
export interface WebSocketErrorEvent {
  message: string;
  timestamp: number;
  code?: string;
}
