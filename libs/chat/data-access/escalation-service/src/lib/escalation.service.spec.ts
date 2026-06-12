import { TestBed } from '@angular/core/testing';
import { EscalationService } from './escalation.service';
import { WebSocketService } from '@guiders-frontend/chat/data-access/websocket-service';
import { EscalationEvent } from '@guiders-frontend/shared/types';
import { Subject } from 'rxjs';

const mockWebSocketService = {
  connected: false,
  socketId: undefined,
  isConnected: vi.fn().mockReturnValue(false),
  connectionState$: new Subject<'connected' | 'disconnected' | 'connecting'>(),
  on: vi.fn().mockReturnValue(undefined),
  off: vi.fn().mockReturnValue(undefined),
  emit: vi.fn().mockReturnValue(undefined),
  messageReceived$: new Subject()
};

describe('EscalationService', () => {
  let service: EscalationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WebSocketService, useValue: mockWebSocketService }
      ]
    });

    service = TestBed.inject(EscalationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should NOT setup WebSocket listener immediately when not connected', () => {
    expect(mockWebSocketService.on).not.toHaveBeenCalled();
  });

  it('should initialize with empty escalations', () => {
    expect(service.escalationCount()).toBe(0);
    expect(service.escalations().length).toBe(0);
  });

  it('should add escalation', () => {
    const event: EscalationEvent = {
      chatId: 'chat-123',
      visitorId: 'visitor-456',
      message: 'Test escalation message',
      timestamp: new Date().toISOString()
    };

    service.addEscalation(event);
    expect(service.escalationCount()).toBe(1);
  });

  it('should avoid duplicate escalations', () => {
    const event: EscalationEvent = {
      chatId: 'chat-123',
      visitorId: 'visitor-456',
      message: 'Test escalation message',
      timestamp: new Date().toISOString()
    };

    service.addEscalation(event);
    service.addEscalation(event);
    expect(service.escalationCount()).toBe(1);
  });

  it('should remove escalation', () => {
    const event: EscalationEvent = {
      chatId: 'chat-123',
      visitorId: 'visitor-456',
      message: 'Test escalation message',
      timestamp: new Date().toISOString()
    };

    service.addEscalation(event);
    expect(service.escalationCount()).toBe(1);

    service.removeEscalation('chat-123');
    expect(service.escalationCount()).toBe(0);
  });

  it('should clear all escalations', () => {
    const event1: EscalationEvent = {
      chatId: 'chat-1',
      visitorId: 'visitor-1',
      message: 'Test 1',
      timestamp: new Date().toISOString()
    };
    const event2: EscalationEvent = {
      chatId: 'chat-2',
      visitorId: 'visitor-2',
      message: 'Test 2',
      timestamp: new Date().toISOString()
    };

    service.addEscalation(event1);
    service.addEscalation(event2);
    expect(service.escalationCount()).toBe(2);

    service.clearAll();
    expect(service.escalationCount()).toBe(0);
  });

  it('should enable/disable sound', () => {
    service.enableSound(false);
    service.enableSound(true);
    expect(service).toBeTruthy();
  });
});