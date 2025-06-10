/**
 * Enum para los tipos de mensajes WebSocket
 * Centraliza todos los tipos de eventos WebSocket utilizados en la aplicación
 */
export enum WebSocketMessageType {
  // Eventos generales de WebSocket
  MESSAGE = 'message',
  
  // Eventos de conexión y estado del usuario
  USER_STATUS_CHANGE = 'user_status_change',
  NOTIFICATION = 'notification',
  
  // Eventos de chat básicos
  CHAT_MESSAGE = 'chat_message',
  CHAT_TYPING = 'chat_typing',
  CHAT_STATUS_CHANGE = 'chat_status_change',
  CHAT_PARTICIPANT_UPDATE = 'chat_participant_update',
  
  // Eventos específicos de chat (nomenclatura con namespace)
  CHAT_STATUS_UPDATED = 'chat:status-updated',
  CHAT_LAST_MESSAGE_UPDATED = 'chat:last-message-updated',
  CHAT_TYPING_STATUS_UPDATED = 'chat:typing-status-updated',
  
  // Eventos de participantes
  PARTICIPANT_ONLINE_STATUS_UPDATED = 'participant:online-status-updated',
  
  // Eventos de mensajes entrantes
  RECEIVE_MESSAGE = 'receive-message',
  
  // Eventos de heartbeat/ping-pong
  PING = 'ping',
  PONG = 'pong',
  
  // Eventos de conexión Socket.IO
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  AUTH_ERROR = 'auth_error',
  RECONNECT = 'reconnect',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  RECONNECT_FAILED = 'reconnect_failed'
}

/**
 * Enum para tipos de eventos de chat WebSocket
 */
export enum ChatWebSocketEventType {
  MESSAGE = 'message',
  STATUS_CHANGE = 'status_change',
  TYPING = 'typing',
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_LEFT = 'participant_left'
}

/**
 * Helper para verificar si un tipo de mensaje está relacionado con chat
 */
export const CHAT_RELATED_MESSAGE_TYPES: readonly WebSocketMessageType[] = [
  WebSocketMessageType.CHAT_MESSAGE,
  WebSocketMessageType.CHAT_TYPING,
  WebSocketMessageType.CHAT_STATUS_CHANGE,
  WebSocketMessageType.CHAT_PARTICIPANT_UPDATE,
  WebSocketMessageType.CHAT_STATUS_UPDATED,
  WebSocketMessageType.CHAT_LAST_MESSAGE_UPDATED,
  WebSocketMessageType.CHAT_TYPING_STATUS_UPDATED,
  WebSocketMessageType.PARTICIPANT_ONLINE_STATUS_UPDATED,
  WebSocketMessageType.RECEIVE_MESSAGE
] as const;

/**
 * Helper para verificar si un mensaje WebSocket está relacionado con chat
 */
export function isChatRelatedMessageType(messageType: string): boolean {
  return CHAT_RELATED_MESSAGE_TYPES.includes(messageType as WebSocketMessageType);
}

/**
 * Mapeo de tipos de mensaje WebSocket a tipos de eventos de chat
 */
export const WEBSOCKET_TO_CHAT_EVENT_MAP: Record<WebSocketMessageType, ChatWebSocketEventType> = {
  [WebSocketMessageType.CHAT_MESSAGE]: ChatWebSocketEventType.MESSAGE,
  [WebSocketMessageType.CHAT_STATUS_CHANGE]: ChatWebSocketEventType.STATUS_CHANGE,
  [WebSocketMessageType.CHAT_TYPING]: ChatWebSocketEventType.TYPING,
  [WebSocketMessageType.CHAT_PARTICIPANT_UPDATE]: ChatWebSocketEventType.PARTICIPANT_JOINED, // Se puede ajustar dinámicamente
  
  // Mapeos por defecto para otros tipos
  [WebSocketMessageType.MESSAGE]: ChatWebSocketEventType.MESSAGE,
  [WebSocketMessageType.USER_STATUS_CHANGE]: ChatWebSocketEventType.STATUS_CHANGE,
  [WebSocketMessageType.NOTIFICATION]: ChatWebSocketEventType.MESSAGE,
  [WebSocketMessageType.CHAT_STATUS_UPDATED]: ChatWebSocketEventType.STATUS_CHANGE,
  [WebSocketMessageType.CHAT_LAST_MESSAGE_UPDATED]: ChatWebSocketEventType.MESSAGE,
  [WebSocketMessageType.CHAT_TYPING_STATUS_UPDATED]: ChatWebSocketEventType.TYPING,
  [WebSocketMessageType.PARTICIPANT_ONLINE_STATUS_UPDATED]: ChatWebSocketEventType.STATUS_CHANGE,
  [WebSocketMessageType.PING]: ChatWebSocketEventType.MESSAGE,
  [WebSocketMessageType.PONG]: ChatWebSocketEventType.MESSAGE,
  [WebSocketMessageType.CONNECT]: ChatWebSocketEventType.STATUS_CHANGE,
  [WebSocketMessageType.DISCONNECT]: ChatWebSocketEventType.STATUS_CHANGE,
  [WebSocketMessageType.CONNECT_ERROR]: ChatWebSocketEventType.STATUS_CHANGE,
  [WebSocketMessageType.AUTH_ERROR]: ChatWebSocketEventType.STATUS_CHANGE,
  [WebSocketMessageType.RECONNECT]: ChatWebSocketEventType.STATUS_CHANGE,
  [WebSocketMessageType.RECONNECT_ATTEMPT]: ChatWebSocketEventType.STATUS_CHANGE,
  [WebSocketMessageType.RECONNECT_FAILED]: ChatWebSocketEventType.STATUS_CHANGE
};

/**
 * Helper para mapear tipo de mensaje WebSocket a tipo de evento de chat
 */
export function mapWebSocketMessageTypeToChatEventType(
  messageType: string,
  data?: any
): ChatWebSocketEventType {
  const wsType = messageType as WebSocketMessageType;
  
  // Lógica especial para CHAT_PARTICIPANT_UPDATE
  if (wsType === WebSocketMessageType.CHAT_PARTICIPANT_UPDATE) {
    return data?.action === 'joined' 
      ? ChatWebSocketEventType.PARTICIPANT_JOINED 
      : ChatWebSocketEventType.PARTICIPANT_LEFT;
  }
  
  return WEBSOCKET_TO_CHAT_EVENT_MAP[wsType] || ChatWebSocketEventType.MESSAGE;
}
