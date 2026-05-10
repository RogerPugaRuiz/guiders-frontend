import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import type { Chat, Message } from '@guiders-frontend/types';
import type { Visitor } from '@guiders-frontend/types';
import {
  DEMO_CHAT_ID,
  DEMO_VISITOR_ID,
  TourSandboxService,
  isDemoId,
} from './tour-sandbox';

describe('TourSandboxService', () => {
  let service: TourSandboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TourSandboxService],
    });
    service = TestBed.inject(TourSandboxService);
  });

  describe('initial state', () => {
    it('starts inactive', () => {
      expect(service.isActive()).toBe(false);
    });

    it('emits empty arrays before activate()', async () => {
      const visitors = await firstValueFrom(service.visitors$);
      const chats = await firstValueFrom(service.chats$);
      const messages = await firstValueFrom(service.messages$);
      expect(visitors).toEqual([]);
      expect(chats).toEqual([]);
      expect(messages).toEqual({});
    });
  });

  describe('activate()', () => {
    beforeEach(() => service.activate());

    it('flips isActive to true', () => {
      expect(service.isActive()).toBe(true);
    });

    it('emits one demo visitor with the agreed identity', async () => {
      const visitors = await firstValueFrom(service.visitors$);
      expect(visitors).toHaveLength(1);
      const v: Visitor = visitors[0];
      expect(v.id).toBe(DEMO_VISITOR_ID);
      expect(v.name).toBe('María García (DEMO)');
      expect(v.email).toBe('maria.garcia@demo.guiders.es');
      expect(v.lifecycle).toBe('ENGAGED');
      expect(v.status).toBe('online');
      expect(v.connectionStatus).toBe('chatting');
      expect(v.currentUrl).toBe('/productos/plan-premium');
      expect(v.country).toBe('España');
      expect(v.city).toBe('Madrid');
      expect(v.hasActiveChat).toBe(true);
      expect(v.lastChatId).toBe(DEMO_CHAT_ID);
    });

    it('emits one demo chat linked to the demo visitor', async () => {
      const chats = await firstValueFrom(service.chats$);
      expect(chats).toHaveLength(1);
      const c: Chat = chats[0];
      expect(c.chatId).toBe(DEMO_CHAT_ID);
      expect(c.visitorId).toBe(DEMO_VISITOR_ID);
      expect(c.status).toBe('ACTIVE');
      expect(c.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('emits an initial visitor message about the Plan Premium', async () => {
      const messages = await firstValueFrom(service.messages$);
      const list = messages[DEMO_CHAT_ID];
      expect(list).toBeDefined();
      expect(list).toHaveLength(1);
      const m: Message = list[0];
      expect(m.chatId).toBe(DEMO_CHAT_ID);
      expect(m.senderType).toBe('VISITOR');
      expect(m.senderId).toBe(DEMO_VISITOR_ID);
      expect(m.content).toContain('Plan Premium');
      expect(m.type).toBe('TEXT');
    });

    it('is idempotent: calling activate() twice keeps a single demo visitor and chat', async () => {
      service.activate();
      const visitors = await firstValueFrom(service.visitors$);
      const chats = await firstValueFrom(service.chats$);
      expect(visitors).toHaveLength(1);
      expect(chats).toHaveLength(1);
    });
  });

  describe('appendOperatorMessage()', () => {
    beforeEach(() => service.activate());

    it('appends a COMMERCIAL message to the demo chat', async () => {
      service.appendOperatorMessage('Hola María, claro que sí.');
      const messages = await firstValueFrom(service.messages$);
      const list = messages[DEMO_CHAT_ID];
      expect(list).toHaveLength(2);
      const last = list[list.length - 1];
      expect(last.senderType).toBe('COMMERCIAL');
      expect(last.content).toBe('Hola María, claro que sí.');
      expect(last.chatId).toBe(DEMO_CHAT_ID);
      expect(last.type).toBe('TEXT');
    });

    it('throws when sandbox is not active', () => {
      service.deactivate();
      expect(() => service.appendOperatorMessage('x')).toThrow(
        /sandbox is not active/i,
      );
    });
  });

  describe('simulateVisitorReply()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      service.activate();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('appends a VISITOR follow-up message after the configured delay', async () => {
      service.simulateVisitorReply(1500);

      // Before delay elapses: still only the initial visitor message
      let messages = await firstValueFrom(service.messages$);
      expect(messages[DEMO_CHAT_ID]).toHaveLength(1);

      vi.advanceTimersByTime(1500);

      messages = await firstValueFrom(service.messages$);
      const list = messages[DEMO_CHAT_ID];
      expect(list).toHaveLength(2);
      const last = list[list.length - 1];
      expect(last.senderType).toBe('VISITOR');
      expect(last.senderId).toBe(DEMO_VISITOR_ID);
      expect(last.content).toContain('soporte');
    });

    it('uses a default delay when none is provided', async () => {
      service.simulateVisitorReply();
      vi.advanceTimersByTime(1500);
      const messages = await firstValueFrom(service.messages$);
      expect(messages[DEMO_CHAT_ID]).toHaveLength(2);
    });
  });

  describe('deactivate()', () => {
    it('clears all sandbox state and flips isActive to false', async () => {
      service.activate();
      service.appendOperatorMessage('hola');
      service.deactivate();

      expect(service.isActive()).toBe(false);
      expect(await firstValueFrom(service.visitors$)).toEqual([]);
      expect(await firstValueFrom(service.chats$)).toEqual([]);
      expect(await firstValueFrom(service.messages$)).toEqual({});
    });

    it('cancels any pending visitor reply timer', async () => {
      vi.useFakeTimers();
      try {
        service.activate();
        service.simulateVisitorReply(1500);
        service.deactivate();
        vi.advanceTimersByTime(5000);

        expect(await firstValueFrom(service.messages$)).toEqual({});
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('isDemoId() helper', () => {
    it('returns true for the demo visitor id', () => {
      expect(isDemoId(DEMO_VISITOR_ID)).toBe(true);
    });

    it('returns true for the demo chat id', () => {
      expect(isDemoId(DEMO_CHAT_ID)).toBe(true);
    });

    it('returns true for any id starting with the tour-demo- prefix', () => {
      expect(isDemoId('tour-demo-anything')).toBe(true);
    });

    it('returns false for normal ids', () => {
      expect(isDemoId('chat-123')).toBe(false);
      expect(isDemoId('visitor-abc')).toBe(false);
      expect(isDemoId('')).toBe(false);
    });
  });
});
