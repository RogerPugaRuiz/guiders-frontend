import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { PresenceService } from './presence.service';
import { WebSocketService } from '@guiders-frontend/chat/data-access/websocket-service';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { Environment } from '@guiders-frontend/shared/types';
import { Subject } from 'rxjs';

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
  on: vi.fn().mockReturnValue(undefined),
  off: vi.fn().mockReturnValue(undefined),
  emit: vi.fn().mockReturnValue(undefined),
  messageReceived$: new Subject()
};

describe('PresenceService', () => {
  let service: PresenceService;
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

    service = TestBed.inject(PresenceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should setup WebSocket listeners on init', () => {
    expect(mockWebSocketService.on).toHaveBeenCalled();
    expect(mockWebSocketService.on.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});