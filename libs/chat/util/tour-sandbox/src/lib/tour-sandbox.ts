/**
 * TourSandbox - injects fake visitor + chat + messages so the user can
 * practise real interactions (open chat, send message, receive reply)
 * during the interactive tour without touching the backend.
 *
 * The sandbox is process-local: nothing is persisted, nothing crosses the
 * network. State is exposed as observables so the existing data services
 * can merge it with their real BehaviorSubjects, and as an Angular signal
 * (`isActive`) so components can react to activation/deactivation.
 *
 * Identification convention: every demo entity id starts with `tour-demo-`.
 * Use `isDemoId(id)` to branch in services that should bypass HTTP for
 * demo entities (e.g. `Inbox.onSendMessage`).
 */
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { Chat, Message } from '@guiders-frontend/types';
import type { Visitor } from '@guiders-frontend/types';

/** Stable id for the single demo visitor injected by the sandbox. */
export const DEMO_VISITOR_ID = 'tour-demo-visitor-1';

/** Stable id for the single demo chat injected by the sandbox. */
export const DEMO_CHAT_ID = 'tour-demo-chat-1';

const DEMO_PREFIX = 'tour-demo-';
const DEFAULT_REPLY_DELAY_MS = 1500;

/**
 * Returns true when the given id was minted by the tour sandbox.
 * Used by data services to branch demo entities away from real HTTP calls.
 */
export function isDemoId(id: string): boolean {
  return typeof id === 'string' && id.startsWith(DEMO_PREFIX);
}

@Injectable({ providedIn: 'root' })
export class TourSandboxService {
  private readonly _visitors$ = new BehaviorSubject<Visitor[]>([]);
  private readonly _chats$ = new BehaviorSubject<Chat[]>([]);
  private readonly _messages$ = new BehaviorSubject<Record<string, Message[]>>(
    {},
  );
  private readonly _isActive = signal(false);
  private replyTimer: ReturnType<typeof setTimeout> | null = null;

  /** Emits the in-memory list of demo visitors (empty when inactive). */
  readonly visitors$: Observable<Visitor[]> = this._visitors$.asObservable();

  /** Emits the in-memory list of demo chats (empty when inactive). */
  readonly chats$: Observable<Chat[]> = this._chats$.asObservable();

  /** Emits the in-memory map chatId -> messages (empty when inactive). */
  readonly messages$: Observable<Record<string, Message[]>> =
    this._messages$.asObservable();

  /** Read-only signal that flips to true between activate() and deactivate(). */
  readonly isActive = this._isActive.asReadonly();

  /**
   * Activates the sandbox: emits the demo visitor, demo chat and the
   * initial visitor message. Idempotent: calling twice does not duplicate.
   */
  activate(): void {
    if (this._isActive()) {
      return;
    }
    this._isActive.set(true);
    this._visitors$.next([buildDemoVisitor()]);
    this._chats$.next([buildDemoChat()]);
    this._messages$.next({ [DEMO_CHAT_ID]: [buildInitialVisitorMessage()] });
  }

  /**
   * Appends an operator (COMMERCIAL) message to the demo chat. Throws if
   * the sandbox is not active to surface integration mistakes early.
   */
  appendOperatorMessage(content: string): void {
    if (!this._isActive()) {
      throw new Error('TourSandboxService: sandbox is not active');
    }
    const messages = this._messages$.value;
    const list = messages[DEMO_CHAT_ID] ?? [];
    const next: Message = {
      messageId: `tour-demo-message-${list.length + 1}`,
      chatId: DEMO_CHAT_ID,
      senderId: 'tour-demo-operator',
      senderType: 'COMMERCIAL',
      content,
      type: 'TEXT',
      sentAt: new Date(),
      status: 'SENT',
    };
    this._messages$.next({
      ...messages,
      [DEMO_CHAT_ID]: [...list, next],
    });
  }

  /**
   * Schedules a follow-up VISITOR message after `delayMs` (default 1500ms).
   * The pending timer is cancelled by `deactivate()` so a stopped tour
   * never injects messages after the user closed it.
   */
  simulateVisitorReply(delayMs: number = DEFAULT_REPLY_DELAY_MS): void {
    if (!this._isActive()) {
      throw new Error('TourSandboxService: sandbox is not active');
    }
    this.cancelPendingReply();
    this.replyTimer = setTimeout(() => {
      this.replyTimer = null;
      if (!this._isActive()) {
        return;
      }
      const messages = this._messages$.value;
      const list = messages[DEMO_CHAT_ID] ?? [];
      const reply: Message = {
        messageId: `tour-demo-message-${list.length + 1}`,
        chatId: DEMO_CHAT_ID,
        senderId: DEMO_VISITOR_ID,
        senderType: 'VISITOR',
        content:
          '¡Genial, gracias! ¿Y el plan incluye soporte 24/7?',
        type: 'TEXT',
        sentAt: new Date(),
        status: 'DELIVERED',
      };
      this._messages$.next({
        ...messages,
        [DEMO_CHAT_ID]: [...list, reply],
      });
    }, delayMs);
  }

  /**
   * Clears all sandbox state, cancels pending reply timers and flips
   * `isActive` back to false. Safe to call when already inactive.
   */
  deactivate(): void {
    this.cancelPendingReply();
    this._isActive.set(false);
    this._visitors$.next([]);
    this._chats$.next([]);
    this._messages$.next({});
  }

  private cancelPendingReply(): void {
    if (this.replyTimer !== null) {
      clearTimeout(this.replyTimer);
      this.replyTimer = null;
    }
  }
}

function buildDemoVisitor(): Visitor {
  const now = new Date();
  return {
    id: DEMO_VISITOR_ID,
    lifecycle: 'ENGAGED',
    isNewVisitor: false,
    name: 'María García (DEMO)',
    email: 'maria.garcia@demo.guiders.es',
    status: 'online',
    connectionStatus: 'chatting',
    currentUrl: '/productos/plan-premium',
    domain: 'demo.guiders.es',
    siteId: 'tour-demo-site',
    companyId: 'tour-demo-company',
    country: 'España',
    city: 'Madrid',
    firstVisit: now,
    lastVisit: now,
    currentSessionStart: now,
    totalSessions: 1,
    totalPageViews: 4,
    averageSessionDuration: 240,
    hasActiveChat: true,
    lastChatId: DEMO_CHAT_ID,
    totalChats: 1,
  };
}

function buildDemoChat(): Chat {
  const now = new Date();
  return {
    chatId: DEMO_CHAT_ID,
    status: 'ACTIVE',
    priority: 'NORMAL',
    visitorId: DEMO_VISITOR_ID,
    unreadCount: 1,
    isTyping: false,
    typingUsers: [],
    createdAt: now,
    updatedAt: now,
    participants: [],
    name: 'María García (DEMO)',
    archived: false,
    muted: false,
    pinned: false,
  };
}

function buildInitialVisitorMessage(): Message {
  return {
    messageId: 'tour-demo-message-0',
    chatId: DEMO_CHAT_ID,
    senderId: DEMO_VISITOR_ID,
    senderType: 'VISITOR',
    content:
      'Hola, estoy viendo el Plan Premium pero tengo dudas sobre los límites de uso. ¿Podrías ayudarme?',
    type: 'TEXT',
    sentAt: new Date(),
    status: 'DELIVERED',
  };
}
