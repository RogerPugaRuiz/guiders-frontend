import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { signal } from '@angular/core';

/**
 * Mock para ChatStateService
 */
@Injectable()
export class MockChatStateService {
  chats = signal([]);
  selectedChatId = signal<string | null>(null);
  messages = signal([]);
  isConnected = signal(true);
  
  initialize = () => Promise.resolve(true);
  selectChat = () => Promise.resolve(true);
  addMessage = () => {};
  updateMessage = () => {};
  removeMessage = () => {};
  updateLastMessage = () => {};
}

/**
 * Mock para ChatService
 */
@Injectable()
export class MockChatService {
  getChatById = () => of(null);
  getMessages = () => of([]);
  getChats = () => of([]);
}

/**
 * Mock para ChatSelectionService
 */
@Injectable()
export class MockChatSelectionService {
  selectedChat = signal(null);
  selectChat = () => {};
  clearSelection = () => {};
}

/**
 * Mock para ChatWebSocketService
 */
@Injectable()
export class MockChatWebSocketService {
  connect = () => {};
  disconnect = () => {};
  sendMessage = () => {};
  isConnected = () => true;
  getConnectionState = () => of({ connected: true });
}

/**
 * Mock para ChatClaimService
 */
@Injectable()
export class MockChatClaimService {
  claimChat = () => of({ success: true });
  releaseChatClaim = () => of({ success: true });
  isChatAvailable = () => of(true);
  getChatClaim = () => of(null);
  getAvailableChats = () => of({ chats: [] });
}

/**
 * Providers para testing de servicios de chat
 */
export const MOCK_CHAT_SERVICES_PROVIDERS = [
  { provide: 'ChatStateService', useClass: MockChatStateService },
  { provide: 'ChatService', useClass: MockChatService },
  { provide: 'ChatSelectionService', useClass: MockChatSelectionService },
  { provide: 'ChatWebSocketService', useClass: MockChatWebSocketService },
  { provide: 'ChatClaimService', useClass: MockChatClaimService }
];
