import { Injectable } from '@angular/core';
import { signal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { 
  GET_CHATS_USE_CASE_TOKEN,
  GET_MESSAGES_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_USE_CASE_TOKEN,
  START_CHAT_USE_CASE_TOKEN,
  // Tokens V2
  GET_CHATS_V2_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_V2_USE_CASE_TOKEN,
  GET_COMMERCIAL_CHATS_V2_USE_CASE_TOKEN,
  GET_VISITOR_CHATS_V2_USE_CASE_TOKEN,
  GET_PENDING_QUEUE_V2_USE_CASE_TOKEN,
  GET_COMMERCIAL_METRICS_V2_USE_CASE_TOKEN,
  GET_RESPONSE_TIME_STATS_V2_USE_CASE_TOKEN,
  ASSIGN_CHAT_V2_USE_CASE_TOKEN,
  CLOSE_CHAT_V2_USE_CASE_TOKEN
} from '../providers/chat-use-case.providers';
import { CHAT_REPOSITORY_TOKEN } from '../providers/chat-adapter-providers';

// Mock para ChatStateService
@Injectable()
export class MockChatStateService {
  selectedChatId = signal<string | null>(null);
  messages = signal<any[]>([]);
  isConnected = signal<boolean>(false);
  
  setSelectedChatId(chatId: string | null): void {
    this.selectedChatId.set(chatId);
  }
  
  addMessage(message: any): void {
    this.messages.update(current => [...current, message]);
  }
  
  clearMessages(): void {
    this.messages.set([]);
  }
}

// Mock para environment
export const mockEnvironment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000'
};

// Mock para httpResource
export const mockHttpResource = () => ({
  value: () => ({
    messages: [],
    hasMore: false,
    cursor: ''
  }),
  status: () => 'idle' as const,
  reload: () => {}
});

// Mock para ChatMessages dependencies
export const MOCK_CHAT_PROVIDERS = [
  // Use case mocks V1
  { provide: GET_CHATS_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve([]) } },
  { provide: GET_MESSAGES_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve([]) } },
  { provide: GET_CHAT_BY_ID_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve(null) } },
  { provide: START_CHAT_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve({ id: 'new-chat' }) } },
  
  // Use case mocks V2
  { provide: GET_CHATS_V2_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve([]) } },
  { provide: GET_CHAT_BY_ID_V2_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve(null) } },
  { provide: GET_COMMERCIAL_CHATS_V2_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve([]) } },
  { provide: GET_VISITOR_CHATS_V2_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve([]) } },
  { provide: GET_PENDING_QUEUE_V2_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve([]) } },
  { provide: GET_COMMERCIAL_METRICS_V2_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve({}) } },
  { provide: GET_RESPONSE_TIME_STATS_V2_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve({}) } },
  { provide: ASSIGN_CHAT_V2_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve({}) } },
  { provide: CLOSE_CHAT_V2_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve({}) } },
  
  // Repository mock
  { provide: CHAT_REPOSITORY_TOKEN, useValue: { 
    getChats: () => Promise.resolve([]),
    getMessages: () => Promise.resolve([]),
    getChatById: () => Promise.resolve(null),
    startChat: () => Promise.resolve({ id: 'new-chat' }),
    sendMessage: () => Promise.resolve({ id: 'new-message' })
  }},
  
  // Service mocks
  { provide: 'environment', useValue: mockEnvironment },
  { provide: HttpClient, useValue: { get: () => of([]) } }
];

// Mock para ChatData
export const mockChatData = {
  id: 'test-chat-1',
  participants: [
    { id: 'visitor-1', isVisitor: true, name: 'Visitor' },
    { id: 'agent-1', isVisitor: false, name: 'Agent' }
  ],
  lastMessage: 'Test message',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock para Messages
export const mockMessages = [
  {
    id: 'msg-1',
    senderId: 'visitor-1',
    content: 'Hello, I need help',
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  },
  {
    id: 'msg-2',
    senderId: 'agent-1',
    content: 'Hi! How can I help you?',
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  }
];
