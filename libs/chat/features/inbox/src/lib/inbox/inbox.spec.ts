import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Inbox } from './inbox';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { Environment } from '@guiders-frontend/shared/types';
import { ChatService } from '@guiders-frontend/chat-service';
import {
  TourSandboxService,
  DEMO_CHAT_ID,
} from '@guiders-frontend/tour-sandbox';

describe('Inbox', () => {
  let component: Inbox;
  let fixture: ComponentFixture<Inbox>;

  const mockEnvironment: Environment = {
    production: false,
    auth: {
      authority: 'https://test.com',
      clientId: 'test-client',
      scope: 'openid',
      secureRoutes: [],
    },
    api: {
      baseUrl: 'http://localhost:3000/api',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inbox],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Inbox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onSendMessage · TourSandbox integration', () => {
    let chatService: ChatService;
    let sandbox: TourSandboxService;
    let sendMessageSpy: ReturnType<typeof vi.spyOn>;
    let appendOperatorSpy: ReturnType<typeof vi.spyOn>;
    let simulateReplySpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      chatService = TestBed.inject(ChatService);
      sandbox = TestBed.inject(TourSandboxService);
      sendMessageSpy = vi
        .spyOn(chatService, 'sendMessage')
        .mockReturnValue(of({} as never));
      appendOperatorSpy = vi
        .spyOn(sandbox, 'appendOperatorMessage')
        .mockImplementation(() => undefined);
      simulateReplySpy = vi
        .spyOn(sandbox, 'simulateVisitorReply')
        .mockImplementation(() => undefined);
    });

    it('routes demo chat sends through TourSandboxService instead of ChatService', () => {
      sandbox.activate();
      component.selectedConversationId.set(DEMO_CHAT_ID);

      component.onSendMessage('Hola María, claro que sí');

      expect(appendOperatorSpy).toHaveBeenCalledWith(
        'Hola María, claro que sí'
      );
      expect(simulateReplySpy).toHaveBeenCalled();
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('uses ChatService for non-demo conversations', () => {
      component.selectedConversationId.set('real-chat-123');

      component.onSendMessage('hello');

      expect(sendMessageSpy).toHaveBeenCalledWith({
        chatId: 'real-chat-123',
        content: 'hello',
        type: 'text',
      });
      expect(appendOperatorSpy).not.toHaveBeenCalled();
      expect(simulateReplySpy).not.toHaveBeenCalled();
    });
  });
});
