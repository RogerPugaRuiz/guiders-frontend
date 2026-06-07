import { InjectionToken } from '@angular/core';
import type { ThemeConfig } from '@guiders-frontend/shared/types/iframe';

/**
 * Runtime iframe configuration provided by the embed flow.
 *
 * - `token`: the iframe access token used as `Authorization: Bearer <token>`
 *   when calling `GET /api/v1/iframe/init`. Backend validates the token
 *   signature and resolves the company / theme / user from it.
 * - `tenantId`: stable tenant identifier used for multi-tenant keying
 *   (e.g. localStorage namespaces for non-theme state, cache keys, log
 *   correlation). The ThemeService does not use this directly, but other
 *   services in this lib will.
 * - `baseUrl`: BFF base URL. The IframeInitService (story 8-5) reads
 *   this to build the absolute `/api/v1/iframe/init` URL.
 * - `allowedOrigins`: exact-match allowlist for inbound `postMessage`
 *   events. The PostMessageHandler (story 8-4) drops every event
 *   whose `event.origin` is not in this list. **Deny by default**:
 *   an empty or missing allowlist means NO inbound messages are
 *   processed. Only EXACT origin strings are accepted — no wildcards,
 *   no regex, no `URL` parse. (The runtime `AllowedParentOrigin`
 *   template-literal type is a hint, not a guarantee; this field is
 *   the actual security gate.)
 *
 * Provided by the app shell (story 8-10) after the URL query parameter
 * `?token=...` has been captured. Optional in tests and in non-embedded
 * default mode (the lib is a no-op when this token is null).
 */
export interface IframeConfig {
  readonly token: string;
  readonly tenantId: string;
  readonly baseUrl: string;
  /**
   * Exact-match origin allowlist for inbound `postMessage` events.
   * Optional; default `[]` (deny by default). The PostMessageHandler
   * drops every event whose `event.origin` is not in this list.
   */
  readonly allowedOrigins?: readonly string[];
}

/**
 * Injection token for the active iframe runtime configuration.
 *
 * Use via `inject(IFRAME_CONFIG_TOKEN, { optional: true })` — the lib is
 * designed to be importable from non-embedded default mode (where the
 * token is `null`) without forcing every consumer to provide it.
 */
export const IFRAME_CONFIG_TOKEN = new InjectionToken<IframeConfig | null>(
  'IFRAME_CONFIG_TOKEN',
  { providedIn: 'root', factory: () => null },
);

/**
 * Injection token for a pre-resolved theme configuration.
 *
 * Some apps may want to inject a known theme without going through the
 * full `/iframe/init` round-trip (e.g. Storybook stories, test harnesses,
 * or the admin white-label preview). The ThemeService falls back to this
 * token when present, before reading its own internal signal state.
 *
 * Defaults to `null` (the ThemeService starts with no theme applied).
 */
export const THEME_CONFIG_TOKEN = new InjectionToken<ThemeConfig | null>(
  'THEME_CONFIG_TOKEN',
  { providedIn: 'root', factory: () => null },
);
