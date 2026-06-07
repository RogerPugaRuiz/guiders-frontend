import type { ProtocolVersion } from './protocol-version';
import type { IframeFeatureFlags } from './iframe-init.types';
import type { AuthErrorReason } from './iframe-init.types';

/**
 * Branded type for valid HTTPS parent origins. Compile-time safety:
 * the template literal type rejects `http://`, missing schemes, or
 * arbitrary strings. Runtime validation happens in the PostMessageHandler
 * (story 8-4) using a `URL` parse.
 */
export type AllowedParentOrigin = `https://${string}`;

/**
 * All message kinds that cross the iframe ↔ parent boundary.
 * Both directions: `LEADCARS_*` flows parent → iframe, `GUIDERS_*`
 * flows iframe → parent.
 */
export type MessageKind =
  // parent → iframe
  | 'LEADCARS_USER_INFO'
  | 'LEADCARS_EMBED_CONFIG'
  | 'LEADCARS_REAUTH_COMPLETE'
  // iframe → parent
  | 'GUIDERS_READY'
  | 'GUIDERS_SESSION_EXPIRED'
  | 'GUIDERS_AUTH_REQUIRED'
  | 'GUIDERS_LOGOUT'
  | 'GUIDERS_PROTOCOL_MISMATCH';

/**
 * Embed configuration sent by the parent (leadcars) after the iframe
 * signals it is ready. May include i18n, accent colour overrides, and
 * per-session feature toggles.
 */
export interface EmbedConfig {
  /** Optional accent override; falls back to theme.colors.accent. */
  readonly primaryColor?: string;
  /** ISO-639-1 language code (e.g., `es`, `en`). */
  readonly language?: 'es' | 'en';
  /**
   * Per-tenant feature toggles. Typing as `keyof IframeFeatureFlags`
   * (i.e. `'chatEnabled' | 'escalationsEnabled' | 'contactsEnabled'
   * | 'visitorsEnabled' | 'inboxEnabled' | 'fileAttachments'
   * | 'readReceipts' | 'typingIndicators' | 'aiSuggestions'`)
   * catches typos at compile time. The `Partial<…>` shape is not
   * needed here because the parent sends only the keys it wants
   * to override — missing keys mean "default".
   */
  readonly features?: ReadonlyArray<keyof IframeFeatureFlags>;
  /**
   * Always required (unlike the other fields which are per-session
   * overrides): the timestamp lets the iframe detect stale configs
   * (e.g. parent sent an old config before reconnecting) and
   * correlate with the postMessage envelope's own timestamp.
   */
  readonly timestamp: number;
}

/**
 * Lightweight user info sent by the parent for UI hints ONLY. Not used for
 * authorisation — BFF session is the source of truth.
 */
export interface UserInfo {
  readonly userId: string;
  readonly userName: string;
  readonly avatarUrl?: string;
  readonly timestamp: number;
}

/** Re-auth completion acknowledgement from the parent. */
export interface ReauthCompletePayload {
  readonly success: boolean;
  readonly newSessionToken?: string;
  readonly error?: string;
}

/** Payload sent by the iframe after the postMessage handler is mounted. */
export interface ReadyPayload {
  readonly protocolVersion: ProtocolVersion;
}

/** Payload sent by the iframe when the BFF session has expired. */
export interface SessionExpiredPayload {
  readonly sessionId: string;
  /** URL the parent can call to refresh credentials. */
  readonly reAuthCallback: string;
  readonly timestamp: number;
}

/**
 * Payload sent by the iframe when re-authentication is required.
 * The `reason` set is shared with `IframeInitErrorReason` and lives
 * in `AuthErrorReason` (see `iframe-init.types.ts`) so the two
 * code paths cannot drift apart.
 */
export interface AuthRequiredPayload {
  readonly reason: AuthErrorReason;
  readonly timestamp: number;
}

/** Payload sent by the iframe when the user explicitly logs out. */
export interface LogoutPayload {
  readonly reason: 'user_action' | 'session_timeout';
  readonly timestamp: number;
}

/** Payload sent by the iframe when protocol negotiation fails. */
export interface ProtocolMismatchPayload {
  readonly reason: string;
  readonly receiver: ProtocolVersion;
  readonly sender: ProtocolVersion;
}

/**
 * Maps each `MessageKind` to its payload shape. Consumers (postMessage
 * handler, validators) use this for type-safe discriminated-union narrowing.
 *
 * **Exhaustivity invariant:** every member of `MessageKind` MUST have
 * a corresponding key here. The `MessagePayloadsExhaustive` mapped
 * type below enforces this at compile time — if you add a new
 * `MessageKind`, the build will break on this line until you add
 * the matching payload. Don't delete that mapped type.
 */
export interface MessagePayloads {
  readonly LEADCARS_USER_INFO: UserInfo;
  readonly LEADCARS_EMBED_CONFIG: EmbedConfig;
  readonly LEADCARS_REAUTH_COMPLETE: ReauthCompletePayload;
  readonly GUIDERS_READY: ReadyPayload;
  readonly GUIDERS_SESSION_EXPIRED: SessionExpiredPayload;
  readonly GUIDERS_AUTH_REQUIRED: AuthRequiredPayload;
  readonly GUIDERS_LOGOUT: LogoutPayload;
  readonly GUIDERS_PROTOCOL_MISMATCH: ProtocolMismatchPayload;
}

/**
 * Compile-time exhaustiveness check for `MessagePayloads`.
 *
 * The `extends keyof MessagePayloads ? MessagePayloads[K] : never`
 * conditional means: if a `MessageKind` is missing from
 * `MessagePayloads`, the lookup resolves to `never`, and assigning
 * `never` to a non-never type is a compile error.
 *
 * The `_exhaustive` variable is intentionally unused (prefix `_`)
 * so eslint/tsc don't flag it. The TYPE is the check, not the value.
 */
type _MessagePayloadsExhaustive<T> = {
  [K in MessageKind]: K extends keyof MessagePayloads
    ? MessagePayloads[K]
    : never;
};
type _CheckExhaustive = _MessagePayloadsExhaustive<MessageKind>;

/** Mapped helper: `PayloadFor<'LEADCARS_USER_INFO'>` resolves to `UserInfo`. */
export type PayloadFor<T extends MessageKind> = MessagePayloads[T];

/**
 * Envelope wrapping every postMessage payload. Includes a version tag,
 * a per-message UUID for debugging/correlation, and a millisecond timestamp
 * to detect stale or replayed messages.
 */
export interface MessageEnvelope<T extends MessageKind> {
  readonly type: T;
  readonly version: ProtocolVersion;
  /** UUID v4 generated by the sender, used for debugging and ack correlation. */
  readonly requestId: string;
  readonly timestamp: number;
  readonly payload: PayloadFor<T>;
}

/**
 * Concrete discriminated union of every concrete envelope. Use this when
 * the message kind is only known at runtime (postMessage handler, log
 * aggregation, etc.). The TypeScript narrowing is driven by `type`.
 */
export type PostMessage = {
  [K in MessageKind]: MessageEnvelope<K>;
}[MessageKind];
