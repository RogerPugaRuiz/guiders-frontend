import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { ChatService } from './chat.service';
import { ENVIRONMENT_TOKEN, UserService } from '@guiders-frontend/auth/data-access/session';
import { WebSocketService } from '@guiders-frontend/chat/data-access/websocket-service';
import type { Chat, Message } from '@guiders-frontend/shared/types';

describe('ChatService - sandbox wrappers', () => {
  let service: ChatService;

  const mockEnvironment = {
    api: { baseUrl: 'http://localhost:3000/api' }
  };

  const userServiceMock: Partial<UserService> = {
    getUserId: () => 'operator-1'
  };

  const webSocketMock = {
    connect: vi.fn(),
    isConnected: vi.fn().mockReturnValue(false),
    messageReceived$: new Subject<Message | null>().asObservable(),
    chatStatus$: new Subject<unknown>().asObservable()
  };

  const buildChat = (overrides: Partial<Chat> = {}): Chat => ({
    chatId: 'tour-demo-chat-1',
    visitorId: 'tour-demo-visitor-1',
    visitorInfo: { id: 'tour-demo-visitor-1', name: 'María (DEMO)' },
    status: 'ACTIVE',
    priority: 'NORMAL',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as Chat);

  const buildMessage = (overrides: Partial<Message> = {}): Message => ({
    messageId: 'msg-1',
    chatId: 'tour-demo-chat-1',
    senderId: 'operator-1',
    senderType: 'COMMERCIAL',
    content: 'hola',
    type: 'TEXT',
    sentAt: new Date(),
    status: 'SENT',
    ...overrides
  } as Message);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChatService,
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment },
        { provide: UserService, useValue: userServiceMock },
        { provide: WebSocketService, useValue: webSocketMock }
      ]
    });

    service = TestBed.inject(ChatService);
  });

  describe('addDemoChat', () => {
    it('appends a demo chat to chats$ stream', () => {
      const chat = buildChat();
      service.addDemoChat(chat);

      let captured: Chat[] = [];
      service.chats$.subscribe((chats) => (captured = chats));

      expect(captured).toHaveLength(1);
      expect(captured[0].chatId).toBe('tour-demo-chat-1');
    });

    it('replaces an existing chat with the same id', () => {
      service.addDemoChat(buildChat({ status: 'PENDING' }));
      service.addDemoChat(buildChat({ status: 'ACTIVE' }));

      let captured: Chat[] = [];
      service.chats$.subscribe((chats) => (captured = chats));

      expect(captured).toHaveLength(1);
      expect(captured[0].status).toBe('ACTIVE');
    });
  });

  describe('addDemoMessage', () => {
    it('adds a message under the given chatId in messages$ stream', () => {
      const message = buildMessage();
      service.addDemoMessage('tour-demo-chat-1', message);

      let captured: { [chatId: string]: Message[] } = {};
      service.messages$.subscribe((map) => (captured = map));

      expect(captured['tour-demo-chat-1']).toHaveLength(1);
      expect(captured['tour-demo-chat-1'][0].messageId).toBe('msg-1');
    });

    it('does not duplicate messages with the same messageId', () => {
      const message = buildMessage();
      service.addDemoMessage('tour-demo-chat-1', message);
      service.addDemoMessage('tour-demo-chat-1', message);

      let captured: { [chatId: string]: Message[] } = {};
      service.messages$.subscribe((map) => (captured = map));

      expect(captured['tour-demo-chat-1']).toHaveLength(1);
    });
  });

  describe('setDemoMessages', () => {
    it('replaces the entire message list for a given chatId', () => {
      service.addDemoMessage('tour-demo-chat-1', buildMessage({ messageId: 'old-1' }));
      service.setDemoMessages('tour-demo-chat-1', [
        buildMessage({ messageId: 'new-1' }),
        buildMessage({ messageId: 'new-2' })
      ]);

      let captured: { [chatId: string]: Message[] } = {};
      service.messages$.subscribe((map) => (captured = map));

      expect(captured['tour-demo-chat-1']).toHaveLength(2);
      expect(captured['tour-demo-chat-1'].map((m) => m.messageId)).toEqual(['new-1', 'new-2']);
    });
  });

  describe('removeDemoChat', () => {
    it('removes the chat with the given id from chats$ stream', () => {
      service.addDemoChat(buildChat({ chatId: 'tour-demo-chat-1' }));
      service.addDemoChat(buildChat({ chatId: 'real-chat-2' }));

      service.removeDemoChat('tour-demo-chat-1');

      let captured: Chat[] = [];
      service.chats$.subscribe((chats) => (captured = chats));

      expect(captured).toHaveLength(1);
      expect(captured[0].chatId).toBe('real-chat-2');
    });

    it('clears the messages map entry for the removed chatId', () => {
      service.addDemoChat(buildChat());
      service.addDemoMessage('tour-demo-chat-1', buildMessage());

      service.removeDemoChat('tour-demo-chat-1');

      let captured: { [chatId: string]: Message[] } = {};
      service.messages$.subscribe((map) => (captured = map));

      expect(captured['tour-demo-chat-1']).toBeUndefined();
    });

    it('is a no-op when the chatId is not present', () => {
      service.addDemoChat(buildChat({ chatId: 'real-chat-2' }));

      expect(() => service.removeDemoChat('non-existent')).not.toThrow();

      let captured: Chat[] = [];
      service.chats$.subscribe((chats) => (captured = chats));
      expect(captured).toHaveLength(1);
    });
  });
});
