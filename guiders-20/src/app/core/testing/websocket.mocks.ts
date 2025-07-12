import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { WebSocketMessage, WebSocketConnectionState, WebSocketConnectionStateDefault } from '../services/websocket.service';
import { WebSocketMessageType } from '../enums/websocket-message-types.enum';

/**
 * Mock del WebSocketService para testing
 */
@Injectable()
export class MockWebSocketService {
  private connectionState = new BehaviorSubject<WebSocketConnectionState>(
    new WebSocketConnectionStateDefault()
  );
  
  private messages = new BehaviorSubject<WebSocketMessage>({
    type: WebSocketMessageType.CHAT_MESSAGE,
    data: {},
    timestamp: Date.now()
  });

  connect(): void {
    console.log('Mock WebSocket: Conectando...');
    this.connectionState.next({
      connected: true,
      connecting: false,
      error: null,
      lastConnected: new Date(),
      reconnectAttempts: 0
    });
  }

  async connectAsync(): Promise<WebSocketConnectionState> {
    this.connect();
    return this.connectionState.value;
  }

  disconnect(): void {
    console.log('Mock WebSocket: Desconectando...');
    this.connectionState.next({
      connected: false,
      connecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0
    });
  }

  isConnected(): boolean {
    return this.connectionState.value.connected;
  }

  isConnecting(): boolean {
    return this.connectionState.value.connecting;
  }

  sendMessage(type: WebSocketMessageType | string, data?: any): void {
    console.log('Mock WebSocket: Enviando mensaje:', { type, data });
  }

  emitEvent(eventName: string, data?: Record<string, unknown>): void {
    console.log('Mock WebSocket: Emitiendo evento:', { eventName, data });
  }

  send(message: WebSocketMessage): boolean {
    console.log('Mock WebSocket: Enviando mensaje:', message);
    return true;
  }

  getConnectionState(): Observable<WebSocketConnectionState> {
    return this.connectionState.asObservable();
  }

  getMessages(): Observable<WebSocketMessage> {
    return this.messages.asObservable();
  }

  getMessagesByType(type: WebSocketMessageType | string): Observable<WebSocketMessage> {
    return this.messages.asObservable();
  }

  getConnectionStatus(): Observable<WebSocketConnectionState> {
    return this.connectionState.asObservable();
  }

  setAuthToken(newToken: string): void {
    console.log('Mock WebSocket: Actualizando token:', newToken);
  }

  reconnectWithNewToken(newToken: string): void {
    console.log('Mock WebSocket: Reconectando con nuevo token:', newToken);
  }

  getConnectionDiagnostics(): any {
    return {
      isConnected: this.isConnected(),
      socketId: 'mock-socket-id',
      hasListeners: true,
      connectionState: this.connectionState.value,
      duplicateStats: {},
      duplicateProtectionStats: {}
    };
  }

  // Métodos para simular estados en tests
  simulateConnection(): void {
    this.connectionState.next({
      connected: true,
      connecting: false,
      error: null,
      lastConnected: new Date(),
      reconnectAttempts: 0
    });
  }

  simulateDisconnection(): void {
    this.connectionState.next({
      connected: false,
      connecting: false,
      error: 'Disconnected for testing',
      lastConnected: null,
      reconnectAttempts: 0
    });
  }

  simulateMessage(message: WebSocketMessage): void {
    this.messages.next(message);
  }
}

/**
 * Providers para el testing de WebSocket
 */
export const MOCK_WEBSOCKET_PROVIDERS = [
  { provide: 'WebSocketService', useClass: MockWebSocketService }
];
