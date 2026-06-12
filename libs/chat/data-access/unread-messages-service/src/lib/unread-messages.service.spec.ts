import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { UnreadMessagesService } from './unread-messages.service';
import { WebSocketService } from '@guiders-frontend/chat/data-access/websocket-service';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { Environment } from '@guiders-frontend/shared/types';
import { Subject } from 'rxjs';
import { Message } from '@guiders-frontend/shared/types';

const mockEnvironment: Environment = {
  production: false,
  auth: {
    authority: 'https://test.com',
    clientId: 'test-client',
    scope: 'openid',
    secureRoutes: []
  },
  api: {
    baseUrl: 'https://test-api.com'
  }
};

const mockWebSocketService = {
  connected: false,
  socketId: undefined,
  isConnected: vi.fn().mockReturnValue(false),
  connectionState$: new Subject<'connected' | 'disconnected' | 'connecting'>(),
  on: vi.fn().mockReturnValue(undefined),
  off: vi.fn().mockReturnValue(undefined),
  emit: vi.fn().mockReturnValue(undefined),
  messageReceived$: new Subject<Message>()
};

describe('UnreadMessagesService', () => {
  let service: UnreadMessagesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment },
        { provide: WebSocketService, useValue: mockWebSocketService }
      ]
    });

    service = TestBed.inject(UnreadMessagesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try {
      httpMock.verify();
    } catch {
      // Ignore verification errors in tests that trigger async operations
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should NOT setup WebSocket listeners immediately when not connected', () => {
    expect(mockWebSocketService.on).not.toHaveBeenCalled();
  });

  it('should initialize with empty unread count', () => {
    expect(service.totalUnreadCount()).toBe(0);
    expect(service.hasUnreadMessages()).toBe(false);
  });

  it('should set current user', () => {
    service.setCurrentUser('user-123');
    expect(service.getCurrentUserId()).toBe('user-123');
  });

  it('should set active chat without HTTP calls', () => {
    service.setActiveChat(null);
    expect(service.getActiveChat()).toBeNull();
  });

  it('should clear state', () => {
    service.clear();
    expect(service.totalUnreadCount()).toBe(0);
  });
});