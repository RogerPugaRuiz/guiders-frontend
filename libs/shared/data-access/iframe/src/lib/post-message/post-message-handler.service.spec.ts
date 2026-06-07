import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, DOCUMENT } from '@angular/core';
import { PostMessageHandler } from './post-message-handler.service';
import { IFRAME_CONFIG_TOKEN } from '../theme/theme.token';
import type { AllowedParentOrigin } from '@guiders-frontend/shared/types/iframe';
import type { MessageEnvelope } from '@guiders-frontend/shared/types/iframe';

const ALLOWED: AllowedParentOrigin = 'https://leadcars.com';
const FORBIDDEN = 'https://evil.com';

const GUIDERS_READY: MessageEnvelope<'GUIDERS_READY'> = {
  type: 'GUIDERS_READY',
  version: '1.0.0',
  requestId: 'r-1',
  timestamp: 1700000000000,
  payload: { protocolVersion: '1.0.0' },
};

const LEADCARS_EMBED_CONFIG: MessageEnvelope<'LEADCARS_EMBED_CONFIG'> = {
  type: 'LEADCARS_EMBED_CONFIG',
  version: '1.0.0',
  requestId: 'r-2',
  timestamp: 1700000000001,
  payload: { timestamp: 1700000000001, language: 'es' },
};

const LEADCARS_USER_INFO: MessageEnvelope<'LEADCARS_USER_INFO'> = {
  type: 'LEADCARS_USER_INFO',
  version: '1.0.0',
  requestId: 'r-3',
  timestamp: 1700000000002,
  payload: { userId: 'u-1', userName: 'Alice', timestamp: 1700000000002 },
};

const PROTOCOL_MISMATCH: MessageEnvelope<'GUIDERS_PROTOCOL_MISMATCH'> = {
  type: 'GUIDERS_PROTOCOL_MISMATCH',
  version: '1.0.0',
  requestId: 'r-4',
  timestamp: 1700000000003,
  payload: {
    reason: 'test',
    receiver: '1.0.0',
    sender: '0.0.0',
  },
};

function makeMessageEvent(
  data: unknown,
  origin: string = ALLOWED,
  source: Window | null = null,
): MessageEvent {
  return {
    data,
    origin,
    source,
    type: 'message',
  } as unknown as MessageEvent;
}

function captureOnMessage(
  handler: PostMessageHandler,
): (event: MessageEvent) => void {
  const addSpy = vi.spyOn(window, 'addEventListener');
  handler.start();
  const messageCall = addSpy.mock.calls.find(([name]) => name === 'message');
  if (!messageCall) {
    throw new Error('start() did not register a "message" listener');
  }
  return messageCall[1] as unknown as (event: MessageEvent) => void;
}

describe('PostMessageHandler', () => {
  let postSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  /**
   * Mocked parent window. In jsdom, `window.parent === window`, which
   * makes `computeIsIframe()` return false and `start()` a no-op.
   * We stub `window.parent` with a fresh object so the service
   * detects an iframe context and registers the listener.
   */
  let parentMock: Window;

  beforeEach(() => {
    parentMock = {
      postMessage: vi.fn(),
    } as unknown as Window;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      get: () => parentMock,
    });
    postSpy = vi.spyOn(parentMock, 'postMessage');
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore window.parent to the default (self in jsdom)
    Object.defineProperty(window, 'parent', {
      configurable: true,
      get: () => window,
    });
  });

  describe('origin allowlist (AC #3, #4)', () => {
    it('processes events from an allowlisted origin', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      const service = TestBed.inject(PostMessageHandler);
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_USER_INFO', handler);
      onMessage(makeMessageEvent(LEADCARS_USER_INFO, ALLOWED));
      expect(handler).toHaveBeenCalledOnce();
    });

    it('silently drops events from a non-allowlisted origin', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      const service = TestBed.inject(PostMessageHandler);
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_USER_INFO', handler);
      onMessage(makeMessageEvent(LEADCARS_USER_INFO, FORBIDDEN));
      expect(handler).not.toHaveBeenCalled();
    });

    it('denies by default when allowlist is empty', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          { provide: IFRAME_CONFIG_TOKEN, useValue: null },
          PostMessageHandler,
        ],
      });
      const service = TestBed.inject(PostMessageHandler);
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_USER_INFO', handler);
      onMessage(makeMessageEvent(LEADCARS_USER_INFO, ALLOWED));
      expect(handler).not.toHaveBeenCalled();
    });

    it('IFRAME_CONFIG_TOKEN.allowedOrigins overrides the default', () => {
      const custom: AllowedParentOrigin = 'https://custom.example';
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 't', baseUrl: 'https://api', allowedOrigins: [custom] },
          },
          PostMessageHandler,
        ],
      });
      const service = TestBed.inject(PostMessageHandler);
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_USER_INFO', handler);
      onMessage(makeMessageEvent(LEADCARS_USER_INFO, custom));
      expect(handler).toHaveBeenCalledOnce();
      onMessage(makeMessageEvent(LEADCARS_USER_INFO, ALLOWED));
      expect(handler).toHaveBeenCalledOnce(); // still 1 — custom not in allowlist
    });
  });

  describe('inbound validation (AC #5, #6)', () => {
    function configuredService(): PostMessageHandler {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      return TestBed.inject(PostMessageHandler);
    }

    it('dispatches a valid envelope to the registered handler', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_EMBED_CONFIG', handler);
      onMessage(makeMessageEvent(LEADCARS_EMBED_CONFIG));
      expect(handler).toHaveBeenCalledWith(LEADCARS_EMBED_CONFIG.payload);
    });

    it('drops envelopes with missing type field', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_USER_INFO', handler);
      onMessage(makeMessageEvent({ version: '1.0.0', payload: {} }));
      expect(handler).not.toHaveBeenCalled();
    });

    it('drops envelopes with wrong version', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_USER_INFO', handler);
      onMessage(
        makeMessageEvent({
          type: 'LEADCARS_USER_INFO',
          version: '2.0.0',
          requestId: 'r',
          timestamp: 0,
          payload: { userId: 'u', userName: 'n', timestamp: 0 },
        }),
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('drops non-object event.data', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_USER_INFO', handler);
      onMessage(makeMessageEvent('a string'));
      onMessage(makeMessageEvent(42));
      onMessage(makeMessageEvent(null));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('handler registration (AC #7)', () => {
    function configuredService(): PostMessageHandler {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      return TestBed.inject(PostMessageHandler);
    }

    it('listen() returns a working unsubscribe', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      const unsubscribe = service.listen('LEADCARS_USER_INFO', handler);
      onMessage(makeMessageEvent(LEADCARS_USER_INFO));
      expect(handler).toHaveBeenCalledOnce();
      unsubscribe();
      onMessage(makeMessageEvent(LEADCARS_USER_INFO));
      expect(handler).toHaveBeenCalledOnce(); // still 1
    });

    it('calling unsubscribe twice is idempotent', () => {
      const service = configuredService();
      const handler = vi.fn();
      const unsubscribe = service.listen('LEADCARS_USER_INFO', handler);
      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });

    it('multiple handlers for the same type all fire', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      const h1 = vi.fn();
      const h2 = vi.fn();
      service.listen('LEADCARS_USER_INFO', h1);
      service.listen('LEADCARS_USER_INFO', h2);
      onMessage(makeMessageEvent(LEADCARS_USER_INFO));
      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
    });
  });

  describe('send() (AC #7)', () => {
    function configuredService(): PostMessageHandler {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      return TestBed.inject(PostMessageHandler);
    }

    it('sends with auto-filled envelope (version, requestId, timestamp)', () => {
      const service = configuredService();
      service.send('GUIDERS_READY', { protocolVersion: '1.0.0' });
      expect(postSpy).toHaveBeenCalledOnce();
      const [envelope, targetOrigin] = postSpy.mock.calls[0] as [
        MessageEnvelope<'GUIDERS_READY'>,
        string,
      ];
      expect(envelope.type).toBe('GUIDERS_READY');
      expect(envelope.version).toBe('1.0.0');
      expect(typeof envelope.requestId).toBe('string');
      expect(envelope.requestId.length).toBeGreaterThan(0);
      expect(typeof envelope.timestamp).toBe('number');
      expect(envelope.payload).toEqual({ protocolVersion: '1.0.0' });
      expect(targetOrigin).toBe(ALLOWED);
    });

    it('sends with targetOrigin = "*" when allowlist is empty (with dev warning)', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          { provide: IFRAME_CONFIG_TOKEN, useValue: null },
          PostMessageHandler,
        ],
      });
      const service = TestBed.inject(PostMessageHandler);
      service.send('GUIDERS_READY', { protocolVersion: '1.0.0' });
      expect(postSpy).toHaveBeenCalledOnce();
      const targetOrigin = postSpy.mock.calls[0][1] as string;
      expect(targetOrigin).toBe('*');
      // warn was called because allowlist is empty
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('start() / stop() (AC #7, #9)', () => {
    function configuredService(): PostMessageHandler {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      return TestBed.inject(PostMessageHandler);
    }

    it('first start() mounts the listener AND emits GUIDERS_READY', () => {
      const service = configuredService();
      const addSpy = vi.spyOn(window, 'addEventListener');
      service.start();
      const messageCall = addSpy.mock.calls.find(([name]) => name === 'message');
      expect(messageCall).toBeDefined();
      // GUIDERS_READY was sent
      const readyCall = postSpy.mock.calls.find(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_READY',
      );
      expect(readyCall).toBeDefined();
    });

    it('second start() is a no-op', () => {
      const service = configuredService();
      const addSpy = vi.spyOn(window, 'addEventListener');
      service.start();
      const callCountAfterFirst = addSpy.mock.calls.filter(([n]) => n === 'message').length;
      service.start();
      const callCountAfterSecond = addSpy.mock.calls.filter(([n]) => n === 'message').length;
      expect(callCountAfterSecond).toBe(callCountAfterFirst);
    });

    it('stop() removes the listener', () => {
      const service = configuredService();
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      service.start();
      service.stop();
      const messageCall = removeSpy.mock.calls.find(([n]) => n === 'message');
      expect(messageCall).toBeDefined();
    });

    it('start() after stop() re-mounts', () => {
      const service = configuredService();
      service.start();
      service.stop();
      const addSpy = vi.spyOn(window, 'addEventListener');
      service.start();
      const messageCall = addSpy.mock.calls.find(([n]) => n === 'message');
      expect(messageCall).toBeDefined();
    });
  });

  describe('SSR (AC #8)', () => {
    it('start() in non-browser platform is a no-op', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      const service = TestBed.inject(PostMessageHandler);
      const addSpy = vi.spyOn(window, 'addEventListener');
      service.start();
      expect(addSpy).not.toHaveBeenCalledWith('message', expect.anything());
    });

    it('send() in non-browser platform is a no-op', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: DOCUMENT, useValue: document },
          { provide: IFRAME_CONFIG_TOKEN, useValue: null },
          PostMessageHandler,
        ],
      });
      const service = TestBed.inject(PostMessageHandler);
      service.send('GUIDERS_READY', { protocolVersion: '1.0.0' });
      expect(postSpy).not.toHaveBeenCalled();
    });
  });

  describe('handler isolation (AC #6)', () => {
    function configuredService(): PostMessageHandler {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      return TestBed.inject(PostMessageHandler);
    }

    it('a handler that throws does not break other handlers', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      const h1 = vi.fn(() => {
        throw new Error('boom');
      });
      const h2 = vi.fn();
      service.listen('LEADCARS_USER_INFO', h1);
      service.listen('LEADCARS_USER_INFO', h2);
      onMessage(makeMessageEvent(LEADCARS_USER_INFO));
      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
    });

    it('a handler that throws is logged with console.warn', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      service.listen('LEADCARS_USER_INFO', () => {
        throw new Error('boom');
      });
      onMessage(makeMessageEvent(LEADCARS_USER_INFO));
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('handshake timeout (F13, F3)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    function configuredService(): PostMessageHandler {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      return TestBed.inject(PostMessageHandler);
    }

    it('emits GUIDERS_PROTOCOL_MISMATCH with sender=PROTOCOL_VERSION after 3s', () => {
      const service = configuredService();
      postSpy.mockClear();
      service.start();
      // GUIDERS_READY was already sent at start
      const readyCallsBefore = postSpy.mock.calls.filter(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_READY',
      ).length;
      vi.advanceTimersByTime(3000);
      const mismatchCalls = postSpy.mock.calls.filter(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_PROTOCOL_MISMATCH',
      );
      expect(mismatchCalls.length).toBe(1);
      const envelope = mismatchCalls[0][0] as MessageEnvelope<'GUIDERS_PROTOCOL_MISMATCH'>;
      // F3: sender is now PROTOCOL_VERSION, not '0.0.0.0'
      expect(envelope.payload.sender).toBe('1.0.0');
      expect(envelope.payload.receiver).toBe('1.0.0');
      expect(envelope.payload.reason).toMatch(/Handshake timeout/);
      // GUIDERS_READY was only sent once (at start)
      const readyCallsAfter = postSpy.mock.calls.filter(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_READY',
      ).length;
      expect(readyCallsAfter).toBe(readyCallsBefore);
    });

    it('cancels the timeout when LEADCARS_EMBED_CONFIG arrives', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      postSpy.mockClear();
      // Respond BEFORE timeout fires
      onMessage(makeMessageEvent(LEADCARS_EMBED_CONFIG));
      vi.advanceTimersByTime(3000);
      const mismatchCalls = postSpy.mock.calls.filter(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_PROTOCOL_MISMATCH',
      );
      expect(mismatchCalls.length).toBe(0);
    });

    it('cancels the timeout when LEADCARS_USER_INFO arrives', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      postSpy.mockClear();
      onMessage(makeMessageEvent(LEADCARS_USER_INFO));
      vi.advanceTimersByTime(3000);
      const mismatchCalls = postSpy.mock.calls.filter(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_PROTOCOL_MISMATCH',
      );
      expect(mismatchCalls.length).toBe(0);
    });

    it('does NOT cancel the timeout for unrelated message kinds (e.g. GUIDERS_LOGOUT)', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      postSpy.mockClear();
      onMessage(makeMessageEvent(PROTOCOL_MISMATCH));
      vi.advanceTimersByTime(3000);
      const mismatchCalls = postSpy.mock.calls.filter(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_PROTOCOL_MISMATCH',
      );
      expect(mismatchCalls.length).toBe(1);
    });
  });

  describe('ready() re-emit (F8, F14)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    function configuredService(): PostMessageHandler {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      return TestBed.inject(PostMessageHandler);
    }

    it('re-emits GUIDERS_READY when called externally', () => {
      const service = configuredService();
      postSpy.mockClear();
      service.start();
      const initialReadyCount = postSpy.mock.calls.filter(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_READY',
      ).length;
      service.ready();
      const newReadyCount = postSpy.mock.calls.filter(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_READY',
      ).length;
      expect(newReadyCount).toBe(initialReadyCount + 1);
    });

    it('re-arms the 3s timeout when called after a previous timeout fired', () => {
      const service = configuredService();
      postSpy.mockClear();
      service.start();
      // First timeout fires
      vi.advanceTimersByTime(3000);
      const firstMismatchCount = postSpy.mock.calls.filter(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_PROTOCOL_MISMATCH',
      ).length;
      expect(firstMismatchCount).toBe(1);
      // Re-attempt handshake
      service.ready();
      // Second timeout should fire 3s after ready()
      vi.advanceTimersByTime(3000);
      const secondMismatchCount = postSpy.mock.calls.filter(
        ([e]) => (e as MessageEnvelope).type === 'GUIDERS_PROTOCOL_MISMATCH',
      ).length;
      expect(secondMismatchCount).toBe(2);
    });
  });

  describe('crypto.randomUUID fallback (F1, F15)', () => {
    function configuredService(): PostMessageHandler {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      return TestBed.inject(PostMessageHandler);
    }

    it('falls back to a 16-char hex string when crypto.randomUUID is unavailable', () => {
      // Save original and replace with undefined to simulate insecure context
      const originalRandomUUID = crypto.randomUUID;
      Object.defineProperty(crypto, 'randomUUID', {
        configurable: true,
        get: () => undefined,
      });
      try {
        const service = configuredService();
        service.send('GUIDERS_READY', { protocolVersion: '1.0.0' });
        const envelope = postSpy.mock.calls[0][0] as MessageEnvelope<'GUIDERS_READY'>;
        expect(typeof envelope.requestId).toBe('string');
        expect(envelope.requestId.length).toBe(16);
        // Hex-only
        expect(envelope.requestId).toMatch(/^[0-9a-f]{16}$/);
      } finally {
        Object.defineProperty(crypto, 'randomUUID', {
          configurable: true,
          value: originalRandomUUID,
        });
      }
    });
  });

  describe('edge cases (F23, F24, F25)', () => {
    function configuredService(): PostMessageHandler {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 'leadcars', baseUrl: 'https://api', allowedOrigins: [ALLOWED] },
          },
          PostMessageHandler,
        ],
      });
      return TestBed.inject(PostMessageHandler);
    }

    it('handles Object.create(null) payload without throwing (F23)', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_USER_INFO', handler);
      const nullProto = Object.create(null);
      nullProto.type = 'LEADCARS_USER_INFO';
      nullProto.version = '1.0.0';
      nullProto.requestId = 'r';
      nullProto.timestamp = 0;
      nullProto.payload = { userId: 'u', userName: 'A', timestamp: 0 };
      // Should NOT throw on the message listener
      expect(() => onMessage(makeMessageEvent(nullProto))).not.toThrow();
      expect(handler).toHaveBeenCalledOnce();
    });

    it('silently drops events with unknown type (F24)', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_USER_INFO', handler);
      const malicious = {
        type: 'MALICIOUS_KIND',
        version: '1.0.0',
        requestId: 'r',
        timestamp: 0,
        payload: { evil: true },
      };
      onMessage(makeMessageEvent(malicious));
      expect(handler).not.toHaveBeenCalled();
    });

    it('silently drops events with a throwing data.type getter (F6)', () => {
      const service = configuredService();
      const onMessage = captureOnMessage(service);
      const handler = vi.fn();
      service.listen('LEADCARS_USER_INFO', handler);
      const evil = Object.create(null, {
        type: { get: () => { throw new Error('pwned'); } },
      });
      // Should NOT throw on the message listener (wrapped in try/catch)
      expect(() => onMessage(makeMessageEvent(evil))).not.toThrow();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('allowedOrigins format validation (F7, F16)', () => {
    function configureWithAllowedOrigins(allowedOrigins: readonly string[]): void {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 't', baseUrl: 'https://api', allowedOrigins },
          },
          PostMessageHandler,
        ],
      });
    }

    it('throws on allowedOrigins: ["null"]', () => {
      configureWithAllowedOrigins(['null']);
      expect(() => TestBed.inject(PostMessageHandler)).toThrow(/Invalid allowedOrigin.*null/);
    });

    it('throws on allowedOrigins: ["*"]', () => {
      configureWithAllowedOrigins(['*']);
      expect(() => TestBed.inject(PostMessageHandler)).toThrow(/Invalid allowedOrigin.*\*/);
    });

    it('throws on allowedOrigins: ["not-a-url"]', () => {
      configureWithAllowedOrigins(['not-a-url']);
      expect(() => TestBed.inject(PostMessageHandler)).toThrow(/Invalid allowedOrigin.*not-a-url/);
    });
  });

  describe('one-shot warnings (F19, F36)', () => {
    function configuredService(allowlist: readonly string[] = []): PostMessageHandler {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: document },
          {
            provide: IFRAME_CONFIG_TOKEN,
            useValue: { token: 't', tenantId: 't', baseUrl: 'https://api', allowedOrigins: allowlist },
          },
          PostMessageHandler,
        ],
      });
      return TestBed.inject(PostMessageHandler);
    }

    it('warns once for empty allowlist, not on every send (F19)', () => {
      const service = configuredService([]);
      service.send('GUIDERS_READY', { protocolVersion: '1.0.0' });
      service.send('GUIDERS_READY', { protocolVersion: '1.0.0' });
      service.send('GUIDERS_READY', { protocolVersion: '1.0.0' });
      const emptyAllowlistWarnings = warnSpy.mock.calls.filter(([msg]) =>
        String(msg).includes('empty allowlist'),
      );
      expect(emptyAllowlistWarnings.length).toBe(1);
    });

    it('dedups per-handler throw warnings (F36)', () => {
      const service = configuredService([ALLOWED]);
      const onMessage = captureOnMessage(service);
      const throwingHandler = vi.fn(() => {
        throw new Error('boom');
      });
      service.listen('LEADCARS_USER_INFO', throwingHandler);
      onMessage(makeMessageEvent(LEADCARS_USER_INFO));
      onMessage(makeMessageEvent(LEADCARS_USER_INFO));
      onMessage(makeMessageEvent(LEADCARS_USER_INFO));
      const throwWarnings = warnSpy.mock.calls.filter(([msg]) =>
        String(msg).includes('handler for LEADCARS_USER_INFO threw'),
      );
      expect(throwWarnings.length).toBe(1);
    });
  });
});
