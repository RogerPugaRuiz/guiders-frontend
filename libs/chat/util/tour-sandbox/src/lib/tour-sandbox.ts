/**
 * TourSandbox - injects a fake visitor so the user can see what the
 * visitors panel looks like during the interactive tour without touching
 * the backend. The chat used during the tour is the user's own SELF chat
 * (managed by SelfChatService and bridged into ChatService) — not a demo
 * chat.
 *
 * The sandbox is process-local: nothing is persisted, nothing crosses the
 * network. State is exposed as observables so the existing data services
 * can merge it with their real BehaviorSubjects, and as an Angular signal
 * (`isActive`) so components can react to activation/deactivation.
 *
 * Identification convention: every demo entity id starts with `tour-demo-`.
 * Use `isDemoId(id)` to branch in services that should bypass HTTP for
 * demo entities.
 */
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { Visitor } from '@guiders-frontend/types';

/** Stable id for the single demo visitor injected by the sandbox. */
export const DEMO_VISITOR_ID = 'tour-demo-visitor-1';

const DEMO_PREFIX = 'tour-demo-';
/** Synthetic chat id referenced by the demo visitor's `lastChatId` field. */
const DEMO_VISITOR_LAST_CHAT_ID = 'tour-demo-chat-1';

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
  private readonly _isActive = signal(false);

  /** Emits the in-memory list of demo visitors (empty when inactive). */
  readonly visitors$: Observable<Visitor[]> = this._visitors$.asObservable();

  /** Read-only signal that flips to true between activate() and deactivate(). */
  readonly isActive = this._isActive.asReadonly();

  /** Synchronous snapshot of the current demo visitors (empty when inactive). */
  get visitorsSnapshot(): Visitor[] {
    return this._visitors$.value;
  }

  /**
   * Activates the sandbox: emits the demo visitor. Idempotent: calling
   * twice does not duplicate.
   */
  activate(): void {
    if (this._isActive()) {
      return;
    }
    this._isActive.set(true);
    this._visitors$.next([buildDemoVisitor()]);
  }

  /**
   * Clears all sandbox state and flips `isActive` back to false. Safe to
   * call when already inactive.
   */
  deactivate(): void {
    this._isActive.set(false);
    this._visitors$.next([]);
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
    lastChatId: DEMO_VISITOR_LAST_CHAT_ID,
    totalChats: 1,
  };
}
