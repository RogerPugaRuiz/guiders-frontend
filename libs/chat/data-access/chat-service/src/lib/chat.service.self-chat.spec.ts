import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ENVIRONMENT_TOKEN, UserService } from '@guiders-frontend/auth/data-access/session';
import { WebSocketService } from '@guiders-frontend/chat/data-access/websocket-service';
import { SelfChatService } from '@guiders-frontend/self-chat';
import type { Chat, Message } from '@guiders-frontend/shared/types';
import { firstValueFrom, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatService } from './chat.service';

describe('ChatService - self chat integration', () => {
  let service: ChatService;
  let selfChat: SelfChatService;
  let httpMock: HttpTestingController;

  const mockEnvironment = { api: { baseUrl: 'http://localhost:3000/api' } };
  const userServiceMock: Partial<UserService> = {
    getUserId: () => 'operator-1',
  };
  const webSocketMock = {
    connect: vi.fn(),
    isConnected: vi.fn().mockReturnValue(false),
    messageReceived$: new Subject<Message | null>().asObservable(),
    chatStatus$: new Subject<unknown>().asObservable(),
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChatService,
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment },
        { provide: UserService, useValue: userServiceMock },
        { provide: WebSocketService, useValue: webSocketMock },
      ],
    });
    service = TestBed.inject(ChatService);
    selfChat = TestBed.inject(SelfChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('exposes isSelfChatId() helper based on `self-` prefix', () => {
    expect(service.isSelfChatId('self-operator-1')).toBe(true);
    expect(service.isSelfChatId('chat-abc')).toBe(false);
    expect(service.isSelfChatId(null)).toBe(false);
  });

  it('prepends the self chat to chats$ when SelfChatService emits', async () => {
    selfChat.initialize({ sub: 'operator-1', email: 'op@example.com' });

    const chats = await firstValueFrom(service.chats$.pipe(take(1)));
    expect(chats).toHaveLength(1);
    expect(chats[0].chatId).toBe('self-operator-1');
    expect(chats[0].pinned).toBe(true);
  });

  it('keeps the self chat pinned at the top alongside other chats', async () => {
    selfChat.initialize({ sub: 'operator-1', email: 'op@example.com' });

    // Seed a non-self chat via the HTTP path (getCommercialChats is invoked
    // by getChats() when there is a current user).
    service.getChats().subscribe();
    const req = httpMock.expectOne(
      (r) => r.url.includes('/commercials/operator-1/chats')
    );
    req.flush({
      chats: [
        {
          id: 'remote-chat-1',
          status: 'ACTIVE',
          priority: 'NORMAL',
          visitorId: 'v1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          participants: [],
        },
      ],
      total: 1,
    });

    const chats = await firstValueFrom(service.chats$.pipe(take(1)));
    expect(chats[0].chatId).toBe('self-operator-1');
    expect(chats.map((c) => c.chatId)).toContain('remote-chat-1');
  });

  it('mirrors self chat messages into messages$ stream', async () => {
    selfChat.initialize({ sub: 'operator-1', email: 'op@example.com' });
    await selfChat.sendMessage('hola desde self chat');

    const messagesMap = await firstValueFrom(service.messages$.pipe(take(1)));
    const selfMessages = messagesMap['self-operator-1'] ?? [];
    expect(selfMessages).toHaveLength(1);
    expect(selfMessages[0].content).toBe('hola desde self chat');
  });

  it('routes sendMessage() for self chat to SelfChatService and skips HTTP', async () => {
    selfChat.initialize({ sub: 'operator-1', email: 'op@example.com' });
    const spy = vi.spyOn(selfChat, 'sendMessage');

    const result = await firstValueFrom(
      service.sendMessage({
        chatId: 'self-operator-1',
        content: 'mensaje self',
        type: 'TEXT',
      })
    );

    expect(spy).toHaveBeenCalledWith('mensaje self');
    expect(result).not.toBeNull();
    expect(result?.chatId).toBe('self-operator-1');
    httpMock.expectNone(() => true);
  });
});
