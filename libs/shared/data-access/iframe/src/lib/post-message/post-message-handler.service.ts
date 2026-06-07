import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import {
  checkCompatibility,
  PROTOCOL_VERSION,
  type MessageKind,
  type MessageEnvelope,
  type PayloadFor,
} from '@guiders-frontend/shared/types/iframe';
import { IFRAME_CONFIG_TOKEN } from '../theme/theme.token';
import { resolveAllowedOrigins } from './allowed-origins';

/**
 * A handler receives the narrowed payload (NOT the full envelope).
 * The envelope's metadata (timestamp, requestId, version) is consumed
 * by the dispatcher and not exposed to handlers.
 */
type Handler<K extends MessageKind> = (payload: PayloadFor<K>) => void;

/**
 * White-label iframe postMessage handler.
 *
 * Responsibilities:
 *   1. Mount a single `window.addEventListener('message', ...)` listener
 *      that filters inbound events by origin allowlist and envelope
 *      shape, then dispatches to registered handlers.
 *   2. Expose a typed `send()` API for outbound messages to the parent
 *      window, with auto-filled envelope metadata.
 *   3. Implement the explicit handshake from architecture § ADR-017:
 *      on first start, send `GUIDERS_READY` and set a 3s timeout
 *      that sends `GUIDERS_PROTOCOL_MISMATCH` if the parent does
 *      not respond.
 *   4. Be SSR-safe: in a non-browser or non-iframe context, all
 *      public methods are no-ops.
 *
 * Explicit non-responsibilities:
 *   - **No persistence** of any message contents.
 *   - **No coupling to ThemeService / SessionService / any auth lib**.
 *     This is a transport layer. Downstream services decide what
 *     to do with the typed payloads.
 *   - **No wildcard origin matching**. Strict equality only.
 *   - **No payload runtime validation** of the inner `payload` field.
 *     The dispatcher only validates `type` (must be a string) and
 *     `version` (must pass `checkCompatibility`). Consumers MUST
 *     validate the payload shape themselves — see JSDoc on `listen()`.
 *   - **No replay protection** for inbound messages (deferred to
 *     post-MVP; tracked in deferred-work.md).
 *   - **No multi-level iframe nesting** — assumes depth 1
 *     (`window.parent` is the leadcars parent).
 *
 * The service is `providedIn: 'root'` so a single instance is shared
 * across the app. Lifecycle is managed by the IframeShell (story 8-9)
 * via `start()` and `stop()` calls.
 */
@Injectable({ providedIn: 'root' })
export class PostMessageHandler {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly config = inject(IFRAME_CONFIG_TOKEN, { optional: true });

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly allowedOrigins: readonly string[] =
    resolveAllowedOrigins(this.config ?? null);

  private readonly handlers = new Map<MessageKind, Set<(payload: unknown) => void>>();
  private readonly _isStarted = signal(false);
  /** `true` once we've received a `LEADCARS_EMBED_CONFIG` or `LEADCARS_USER_INFO` from the parent. */
  private handshakeCompleted = false;
  /** Tracks whether the dev-mode "empty allowlist" warning has already fired this service lifetime. */
  private hasWarnedEmptyAllowlist = false;
  /** Per-handler-instance dedup so a chatty parent doesn't flood the console. */
  private readonly warnedHandlers = new WeakSet<Handler<MessageKind>>();
  private handshakeTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
  /** Bound reference to the `message` listener, for `removeEventListener`. */
  private boundOnMessage: ((event: MessageEvent) => void) | null = null;

  /** Read-only signal: `true` when the service has called `start()`. */
  readonly isStarted: Signal<boolean> = this._isStarted.asReadonly();

  /**
   * Mount the `message` listener and emit the `GUIDERS_READY` handshake.
   * Idempotent: subsequent calls are no-ops.
   */
  start(): void {
    if (!this.isBrowser || !this.computeIsIframe()) {
      return;
    }
    if (this._isStarted()) {
      return;
    }
    this._isStarted.set(true);

    this.boundOnMessage = (event: MessageEvent): void => {
      this.onMessage(event);
    };
    this.document.defaultView?.addEventListener('message', this.boundOnMessage);

    // Emit the handshake AFTER the listener is registered (race
    // condition prevention per architecture § ADR-017).
    this.ready();

    // 3s handshake timeout → GUIDERS_PROTOCOL_MISMATCH.
    this.armHandshakeTimeout();
  }

  /**
   * Remove the `message` listener and cancel the handshake timeout.
   * Idempotent: subsequent calls are no-ops.
   */
  stop(): void {
    if (!this.isBrowser) {
      return;
    }
    if (this.boundOnMessage) {
      this.document.defaultView?.removeEventListener('message', this.boundOnMessage);
      this.boundOnMessage = null;
    }
    if (this.handshakeTimeoutHandle !== null) {
      clearTimeout(this.handshakeTimeoutHandle);
      this.handshakeTimeoutHandle = null;
    }
    this.handshakeCompleted = false;
    this._isStarted.set(false);
  }

  /**
   * Re-emit `GUIDERS_READY` if started. After the first start, the
   * handshake is one-shot. If the parent never responded, `ready()`
   * CAN be called to re-arm the 3s timeout and re-emit GUIDERS_READY.
   * If the parent already responded, `ready()` is a no-op (the
   * handshake is already complete).
   */
  ready(): void {
    if (!this._isStarted()) {
      return;
    }
    this.send('GUIDERS_READY', { protocolVersion: PROTOCOL_VERSION });
    // Only re-arm the timeout if the previous handshake never completed.
    if (!this.handshakeCompleted) {
      this.armHandshakeTimeout();
    }
  }

  /**
   * Send a typed message to the parent window. The envelope is
   * auto-filled with the current `PROTOCOL_VERSION`, a UUID v4
   * `requestId`, and the current `timestamp`.
   *
   * The `targetOrigin` is the FIRST entry of the resolved allowlist
   * (the iframe is single-tenant; multi-tenant configs are not
   * supported for outbound), or `'*'` if the allowlist is empty
   * (with a one-shot dev-mode warning, regardless of hostname).
   * Use of `'*'` in production is the host app's responsibility —
   * the service never silently downgrades the security posture.
   *
   * If `crypto.randomUUID()` is unavailable (insecure context), a
   * `Math.random()`-based fallback is used. The fallback is NOT
   * a real UUID v4 but is unique enough for request correlation.
   */
  send<K extends MessageKind>(type: K, payload: PayloadFor<K>): void {
    const win = this.document.defaultView;
    if (!this.isBrowser || !win || win.parent === win || !win.parent) {
      return;
    }
    const targetOrigin = this.allowedOrigins[0] ?? '*';
    if (this.allowedOrigins.length === 0 && !this.hasWarnedEmptyAllowlist) {
      this.hasWarnedEmptyAllowlist = true;
      console.warn(
        'PostMessageHandler: send() with empty allowlist; using "*" targetOrigin. Configure IFRAME_CONFIG_TOKEN.allowedOrigins in production.',
      );
    }
    const envelope: MessageEnvelope<K> = {
      type,
      version: PROTOCOL_VERSION,
      requestId: generateRequestId(),
      timestamp: Date.now(),
      payload,
    };
    win.parent.postMessage(envelope, targetOrigin);
  }

  /**
   * Register a handler for a specific message kind. Returns an
   * idempotent unsubscribe function. Calling the unsubscribe
   * twice is a no-op.
   *
   * **Payload is NOT runtime-validated**: the handler receives the
   * raw `event.data.payload` object. Consumers MUST validate the
   * shape themselves before accessing fields, or accept the type
   * assertion at the type level. The dispatcher only ensures
   * `event.data.type` is a string and `event.data.version` passes
   * `checkCompatibility()`.
   */
  listen<K extends MessageKind>(
    type: K,
    handler: Handler<K>,
  ): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as (payload: unknown) => void);
    let unsubscribed = false;
    return () => {
      if (unsubscribed) {
        return;
      }
      unsubscribed = true;
      const current = this.handlers.get(type);
      if (current) {
        current.delete(handler as (payload: unknown) => void);
        if (current.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  /**
   * Process an inbound `MessageEvent`. The pipeline is 4 gates:
   *   1. origin allowlist
   *   2. `event.data` is a non-null object
   *   3. `event.data.type` is a string
   *   4. `event.data.version` passes `checkCompatibility()`
   *
   * Events that fail any gate are silently dropped (no log, no
   * error). A 5th optional gate — `event.source === window.parent`
   * — is intentionally NOT implemented because cross-origin
   * `postMessage` produces `source === null` for legitimate
   * messages, which would reject all valid traffic.
   *
   * The entire body is wrapped in try/catch so a malicious
   * payload with a throwing getter (e.g. `Object.create(null, {
   * type: { get() { throw ... } } })`) cannot crash the listener.
   */
  private onMessage(event: MessageEvent): void {
    try {
      // Gate 1: origin allowlist (strict equality)
      if (!this.allowedOrigins.includes(event.origin)) {
        return;
      }
      // Gate 2: data shape
      if (typeof event.data !== 'object' || event.data === null) {
        return;
      }
      const data = event.data as { type?: unknown; version?: unknown };
      // Gate 3: type is a string
      if (typeof data.type !== 'string') {
        return;
      }
      // Gate 4: version compatibility
      const compat = checkCompatibility(
        PROTOCOL_VERSION,
        typeof data.version === 'string' ? data.version : 'malformed',
      );
      if (compat.action !== 'proceed') {
        return;
      }
      // Mark handshake complete BEFORE dispatching handlers — this
      // prevents the 3s timeout from racing with a slow handler
      // (architecture § ADR-017 contract: the parent should see
      // exactly one of {normal handshake, protocol_mismatch}).
      const type = data.type as MessageKind;
      if (
        type === 'LEADCARS_EMBED_CONFIG' ||
        type === 'LEADCARS_USER_INFO'
      ) {
        this.handshakeCompleted = true;
        if (this.handshakeTimeoutHandle !== null) {
          clearTimeout(this.handshakeTimeoutHandle);
          this.handshakeTimeoutHandle = null;
        }
      }
      // Dispatch over a snapshot — if a handler unsubscribes another
      // handler in the same Set, the standard Set iterator would
      // skip the removed entry, but a snapshot does not.
      const set = this.handlers.get(type);
      if (!set || set.size === 0) {
        return;
      }
      const envelope = event.data as MessageEnvelope<MessageKind>;
      const handlers = Array.from(set);
      for (const handler of handlers) {
        try {
          handler(envelope.payload);
        } catch (err) {
          // Dedup per-handler-instance so a chatty parent doesn't
          // flood the console.
          if (!this.warnedHandlers.has(handler as Handler<MessageKind>)) {
            this.warnedHandlers.add(handler as Handler<MessageKind>);
            console.warn(
              `PostMessageHandler: handler for ${type} threw (further errors from this handler will be silenced)`,
              err,
            );
          }
        }
      }
    } catch {
      // Defensive: any throw during the pipeline (malicious getter,
      // unexpected runtime error) is silently dropped, consistent
      // with the rest of the pipeline.
    }
  }

  /**
   * Set or replace the 3s handshake timeout. Cancels any previous
   * pending timeout first (so `ready()` after a previous timeout
   * can re-arm).
   */
  private armHandshakeTimeout(): void {
    if (this.handshakeTimeoutHandle !== null) {
      clearTimeout(this.handshakeTimeoutHandle);
    }
    this.handshakeTimeoutHandle = setTimeout(() => {
      this.handshakeTimeoutHandle = null;
      // Guard: if stop() ran between scheduling and firing, the
      // service is no longer "started" and we should not emit.
      if (!this._isStarted()) {
        return;
      }
      if (!this.handshakeCompleted) {
        this.send('GUIDERS_PROTOCOL_MISMATCH', {
          reason: 'Handshake timeout — parent did not respond within 3s',
          receiver: PROTOCOL_VERSION,
          sender: PROTOCOL_VERSION,
        });
      }
    }, 3000);
  }

  /**
   * Recomputed on every `start()` call (not at construction) so the
   * service works in environments where the same singleton is
   * constructed in a non-iframe context (SSR, top-level) and
   * later hydrated inside an iframe.
   *
   * Returns false when `window.parent === window` (top-level) or
   * when the cross-origin access throws. Returns true in any
   * nested context.
   */
  private computeIsIframe(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    const win = this.document.defaultView;
    if (!win) {
      return false;
    }
    try {
      return win.parent !== win;
    } catch {
      // Cross-origin access to window.parent may throw — treat as iframe.
      return true;
    }
  }
}

/**
 * Generate a request ID for outbound envelopes. Uses
 * `crypto.randomUUID()` when available (secure context), otherwise
 * a `Math.random()`-based fallback. The fallback is NOT a real
 * UUID v4 but is unique enough for request correlation in dev
 * or non-HTTPS environments.
 */
function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: 16 random hex chars (NOT RFC 4122 compliant)
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += Math.floor(Math.random() * 16).toString(16);
  }
  return id;
}
