// Interfaces para// Interfaces específicas para eventos de chat
export interface ChatStatusUpdatedData extends Record<string, unknown> {
  status: string;
  chatId: string;
}

export interface ParticipantOnlineStatusUpdatedData extends Record<string, unknown> {
  isOnline: boolean;
  participantId: string;
  isTyping?: boolean;
  isViewing?: boolean;
  lastSeenAt?: string;
}

export interface ChatLastMessageUpdatedData extends Record<string, unknown> {
  lastMessage: string;
  lastMessageAt: string;
  chatId: string;
  senderId: string;
}

export interface ErrorResponse {
  error: string;
  timestamp: number;
}

export interface SuccessResponse<T extends Record<string, unknown>> {
  type: string;
  message: string;
  timestamp: number;
  data: T;
}

export type Response<T extends Record<string, unknown>> =
  | ErrorResponse
  | SuccessResponse<T>;

// Tipos específicos para los eventos de chat
export interface ChatStatusUpdatedData {
  status: string;
  chatId: string;
}

export interface ParticipantOnlineStatusUpdatedData {
  isOnline: boolean;
  participantId: string;
  isTyping?: boolean;
  isViewing?: boolean;
  lastSeenAt?: string;
}

export interface ChatLastMessageUpdatedData {
  lastMessage: string;
  lastMessageAt: string;
  chatId: string;
  senderId: string;
}

// Verificadores de tipo para diferenciar entre éxito y error
export function isSuccessResponse<T extends Record<string, unknown>>(
  response: Response<T>
): response is SuccessResponse<T> {
  return 'type' in response && 'data' in response;
}

export function isErrorResponse<T extends Record<string, unknown>>(
  response: Response<T>
): response is ErrorResponse {
  return 'error' in response && !('type' in response);
}
