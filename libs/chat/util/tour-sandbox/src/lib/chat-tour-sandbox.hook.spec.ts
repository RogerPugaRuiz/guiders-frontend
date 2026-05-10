import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatService } from '@guiders-frontend/chat-service';
import {
  ChatTourSandboxLifecycleHook,
  CHAT_TOUR_SANDBOX_HOOK_PROVIDER,
} from './chat-tour-sandbox.hook';
import {
  DEMO_CHAT_ID,
  DEMO_VISITOR_ID,
  TourSandboxService,
} from './tour-sandbox';
import { TOUR_LIFECYCLE_HOOKS } from '@guiders-frontend/shared/util/tour';

/**
 * The hook must:
 * - Activate the sandbox AND mirror the demo chat + initial messages into
 *   ChatService state so the existing inbox UI renders them with zero
 *   changes to its rendering pipeline.
 * - On end, remove the demo chat from ChatService and deactivate the sandbox.
 * - Be a no-op for tour ids other than 'console'. Admin tour does not seed
 *   chat data (it lives in the dashboard scope).
 */
describe('ChatTourSandboxLifecycleHook', () => {
  let hook: ChatTourSandboxLifecycleHook;
  let sandbox: TourSandboxService;
  let chatService: {
    addDemoChat: ReturnType<typeof vi.fn>;
    setDemoMessages: ReturnType<typeof vi.fn>;
    removeDemoChat: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    chatService = {
      addDemoChat: vi.fn(),
      setDemoMessages: vi.fn(),
      removeDemoChat: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TourSandboxService,
        { provide: ChatService, useValue: chatService },
        ChatTourSandboxLifecycleHook,
      ],
    });

    sandbox = TestBed.inject(TourSandboxService);
    hook = TestBed.inject(ChatTourSandboxLifecycleHook);
  });

  describe('onTourStart', () => {
    it('activates the sandbox for the console tour', async () => {
      await hook.onTourStart('console', 'user-1');
      expect(sandbox.isActive()).toBe(true);
    });

    it('seeds the demo chat into ChatService state', async () => {
      await hook.onTourStart('console', 'user-1');
      expect(chatService.addDemoChat).toHaveBeenCalledTimes(1);
      const seededChat = chatService.addDemoChat.mock.calls[0][0];
      expect(seededChat.chatId).toBe(DEMO_CHAT_ID);
      expect(seededChat.visitorId).toBe(DEMO_VISITOR_ID);
    });

    it('seeds the initial visitor message into ChatService state', async () => {
      await hook.onTourStart('console', 'user-1');
      expect(chatService.setDemoMessages).toHaveBeenCalledTimes(1);
      const [chatId, messages] = chatService.setDemoMessages.mock.calls[0];
      expect(chatId).toBe(DEMO_CHAT_ID);
      expect(messages).toHaveLength(1);
      expect(messages[0].senderType).toBe('VISITOR');
    });

    it('is a no-op for the admin tour', async () => {
      await hook.onTourStart('admin', 'user-1');
      expect(sandbox.isActive()).toBe(false);
      expect(chatService.addDemoChat).not.toHaveBeenCalled();
      expect(chatService.setDemoMessages).not.toHaveBeenCalled();
    });
  });

  describe('onTourEnd', () => {
    it('removes the demo chat from ChatService and deactivates the sandbox', async () => {
      await hook.onTourStart('console', 'user-1');
      await hook.onTourEnd('console', 'user-1');

      expect(chatService.removeDemoChat).toHaveBeenCalledWith(DEMO_CHAT_ID);
      expect(sandbox.isActive()).toBe(false);
    });

    it('is idempotent: calling onTourEnd without onTourStart does not throw', async () => {
      await expect(hook.onTourEnd('console', 'user-1')).resolves.toBeUndefined();
      expect(chatService.removeDemoChat).toHaveBeenCalledWith(DEMO_CHAT_ID);
    });

    it('is a no-op for the admin tour', async () => {
      await hook.onTourEnd('admin', 'user-1');
      expect(chatService.removeDemoChat).not.toHaveBeenCalled();
    });
  });

  describe('sandbox observable state', () => {
    it('exposes the demo visitor through the sandbox after onTourStart', async () => {
      await hook.onTourStart('console', 'user-1');
      const visitors = await firstValueFrom(sandbox.visitors$);
      expect(visitors).toHaveLength(1);
      expect(visitors[0].id).toBe(DEMO_VISITOR_ID);
    });
  });
});

describe('CHAT_TOUR_SANDBOX_HOOK_PROVIDER', () => {
  it('registers ChatTourSandboxLifecycleHook as a TOUR_LIFECYCLE_HOOKS multi-provider', () => {
    const chatServiceStub = {
      addDemoChat: vi.fn(),
      setDemoMessages: vi.fn(),
      removeDemoChat: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TourSandboxService,
        { provide: ChatService, useValue: chatServiceStub },
        CHAT_TOUR_SANDBOX_HOOK_PROVIDER,
      ],
    });

    const hooks = TestBed.inject(TOUR_LIFECYCLE_HOOKS);
    expect(hooks).toBeTruthy();
    expect(hooks.length).toBeGreaterThanOrEqual(1);
    expect(hooks.some((h) => h instanceof ChatTourSandboxLifecycleHook)).toBe(
      true,
    );
  });
});
