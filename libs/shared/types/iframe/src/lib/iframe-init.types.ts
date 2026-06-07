import type { ProtocolVersion } from './protocol-version';
import type { ThemeConfig } from './theme.types';

/**
 * Reason codes that the iframe init endpoint and the postMessage
 * `AuthRequiredPayload` share. The backend uses the same set of
 * identifiers in both the HTTP error body and the GUIDERS_AUTH_REQUIRED
 * postMessage, so the frontend treats them as one type.
 *
 * See `IframeInitErrorReason` for the full set (init endpoint adds
 * `iframe_mode_disabled` and `theme_not_found`, which are not
 * relevant to a runtime re-auth event).
 */
export type AuthErrorReason = 'expired' | 'missing' | 'invalid';

/**
 * Response shape of `GET /api/v1/iframe/init`.
 *
 * This is the canonical (camelCase) shape used inside Angular. The BFF
 * returns the same payload but with snake_case keys; the IframeInitService
 * (story 8-5) is responsible for the mapping.
 *
 * The success and error responses are combined into `IframeInitResult`
 * (discriminated by `ok`) so consumers can narrow in a single cast.
 */
export interface IframeCompany {
  readonly id: string;
  readonly name: string;
  readonly subdomain: string;
  /**
   * Inline logo for the company. Differs from `ThemeLogoAsset`:
   *   - inline logo carries `alt` (accessibility) — required
   *   - `ThemeLogoAsset` carries `height?` (sizing) and `type?` (MIME)
   *
   * Both shapes describe a logo; the split is intentional because
   * company-level logos are decorative brand assets (always need alt)
   * while theme-level logos are size-constrained CSS variables.
   */
  readonly logo: { readonly url: string; readonly alt: string };
  readonly supportEmail: string;
}

/** Reduced theme summary embedded in the init response. */
export interface IframeThemeSummary {
  readonly id: string;
  readonly name: string;
  readonly config: ThemeConfig;
}

/**
 * Operator context for the embedded session.
 *
 * The `role` field uses backend-side identifiers verbatim (snake_case)
 * because they are VALUE identifiers, not field names — they map to
 * backend RBAC strings, not to TypeScript object keys. The Angular
 * mapping layer (story 8-5) passes the value through unchanged.
 */
export interface IframeUser {
  readonly id: string;
  readonly name: string;
  /**
   * Backend role identifier. `super_admin` is the literal value
   * emitted by the BFF; see backend-handoff line 172.
   */
  readonly role: 'operator' | 'supervisor' | 'super_admin';
  readonly avatar: string;
  /**
   * Server-validated permission strings (e.g. `chat:read`,
   * `escalations:write`). The frontend does NOT interpret these —
   * the backend enforces RBAC on every API call. This list is for
   * UI affordances only (e.g. hiding buttons the user can't use).
   * Free-form strings because the backend permission set evolves
   * without a frontend release.
   */
  readonly permissions: readonly string[];
}

/**
 * Per-tenant feature flags.
 *
 * The flag names mirror the five `SectionName` values plus a few
 * cross-cutting capabilities. The mapping is:
 *   - `chatEnabled`        ↔ `SectionName 'chat'`
 *   - `escalationsEnabled` ↔ `SectionName 'escalations'`
 *   - `contactsEnabled`    ↔ `SectionName 'contacts'`
 *   - `visitorsEnabled`    ↔ `SectionName 'visitors'`
 *   - `inboxEnabled`       ↔ `SectionName 'inbox'`
 *
 * The four cross-cutting flags (`fileAttachments`, `readReceipts`,
 * `typingIndicators`, `aiSuggestions`) are NOT section-gated.
 */
export interface IframeFeatureFlags {
  // Section-gated
  readonly chatEnabled: boolean;
  readonly escalationsEnabled: boolean;
  readonly contactsEnabled: boolean;
  readonly visitorsEnabled: boolean;
  readonly inboxEnabled: boolean;
  // Cross-cutting
  readonly fileAttachments: boolean;
  readonly readReceipts: boolean;
  readonly typingIndicators: boolean;
  readonly aiSuggestions: boolean;
}

/** Per-tenant runtime configuration. */
export interface IframeRuntimeConfig {
  /** Session lifetime in seconds. */
  readonly sessionTimeout: number;
  /** Maximum attachment size in bytes. */
  readonly maxFileSize: number;
  /**
   * MIME types accepted for attachments (e.g. `image/png`,
   * `application/pdf`). Server-validated — the backend rejects
   * uploads whose MIME does not match. Free-form strings because
   * the accepted set evolves without a frontend release.
   */
  readonly allowedFileTypes: readonly string[];
}

/**
 * Successful response of the iframe init endpoint.
 *
 * `version` is the PROTOCOL_VERSION used to build the response — the
 * client uses this with `checkCompatibility()` to validate its own
 * protocol before applying the rest of the payload.
 */
export interface IframeInitResponse {
  readonly company: IframeCompany;
  /**
   * The active theme. `null` means "no custom branding configured
   * for this tenant" — the client should fall back to the DEFAULT_THEME
   * from `@guiders-frontend/shared/data-access/iframe/theme.fallback`.
   * `null` is NOT a transient loading state: the BFF only returns
   * `null` when `Company.iframeMode = true` and `whiteLabelThemeId`
   * is unset.
   */
  readonly theme: IframeThemeSummary | null;
  readonly features: IframeFeatureFlags;
  readonly user: IframeUser;
  readonly config: IframeRuntimeConfig;
  readonly version: ProtocolVersion;
}

/** Reason codes returned by the iframe init endpoint on failure. */
export type IframeInitErrorReason =
  | AuthErrorReason
  | 'iframe_mode_disabled'
  | 'theme_not_found'
  | 'network_error'
  | 'timeout'
  | 'server_error'
  | 'protocol_mismatch'
  | 'not_initialized';

/**
 * Error response shape. Always non-2xx.
 *
 * The 503 (Service Unavailable) response from the backend handoff
 * (line 192) has a body of `{ fallbackTheme, retryAfter }` WITHOUT
 * a `reason` field — that's the canonical "BFF is down, please retry"
 * shape, where the only signal the client needs is the fallback
 * theme and the retry hint. All other 4xx/5xx responses include
 * `reason`. So `reason` is optional to accommodate the 503 case.
 */
export interface IframeInitError {
  readonly reason?: IframeInitErrorReason;
  readonly message?: string;
  /**
   * Fallback theme used to degrade gracefully. Per the backend
   * handoff, the 503 case always includes this so the iframe can
   * apply a default theme even when the init endpoint is unavailable.
   *
   * For `theme_not_found` reason, the BFF MUST include a
   * `fallbackTheme` (a generic neutral theme). For other reasons,
   * `fallbackTheme` is optional.
   */
  readonly fallbackTheme?: ThemeConfig;
  /**
   * Retry hint in **seconds** (per HTTP `Retry-After` header, RFC
   * 7231 §7.1.3). The backend echoes the upstream `Retry-After`
   * value, which is in seconds. `0` or undefined means "retry
   * immediately". Consumers wanting milliseconds should multiply
   * by 1000 themselves.
   */
  readonly retryAfter?: number;
}

/**
 * Discriminated union wrapping both possible responses of
 * `/api/v1/iframe/init`. Use this as the return type of
 * IframeInitService (story 8-5); narrow with `result.ok`.
 *
 *   if (result.ok) { result.response; }
 *   else           { result.error; }
 */
export type IframeInitResult =
  | { readonly ok: true; readonly response: IframeInitResponse }
  | { readonly ok: false; readonly error: IframeInitError };
