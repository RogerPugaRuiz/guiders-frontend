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

// WebSocket event data interfaces
export interface ChatStatusUpdatedData extends Record<string, unknown> {
  status: string;
  chatId: string;
}

export interface ParticipantOnlineStatusUpdatedData extends Record<string, unknown> {
  isOnline: boolean;
  participantId: string;
}

export interface ChatLastMessageUpdatedData extends Record<string, unknown> {
  lastMessage: string;
  lastMessageAt: string;
  chatId: string;
  senderId: string;
}

// WebSocket message interface
export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

export interface WebSocketConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
}