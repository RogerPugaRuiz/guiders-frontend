import type { IframeConfig } from '../theme/theme.token';

/**
 * Default allowlist used when no `IFRAME_CONFIG_TOKEN` is provided
 * or when the provided config has no `allowedOrigins` field.
 *
 * **Deny by default**: an empty array means no origin is allowed.
 * The PostMessageHandler (story 8-4) silently drops every inbound
 * `message` event until the host app configures
 * `IFRAME_CONFIG_TOKEN.allowedOrigins` with a non-empty list of
 * exact origins.
 *
 * This default is intentionally restrictive: it is ALWAYS safer to
 * accidentally drop a legitimate message than to accept an attacker-
 * controlled one. The cost of misconfiguration is "postMessage
 * doesn't work in dev" (loud failure during integration); the cost
 * of being permissive is a cross-origin data leak.
 */
export const DEFAULT_ALLOWED_ORIGINS: readonly string[] = [];

/**
 * Regex for a valid origin string: scheme `http` or `https`, a host
 * (hostname or IPv4), and an optional port. No userinfo, no path,
 * no query. This matches what `event.origin` actually contains
 * (the browser always provides the form `<scheme>://<host>[:<port>]`,
 * never with a path).
 */
const VALID_ORIGIN = /^https?:\/\/[^/\s:]+(:\d+)?$/;

/**
 * Resolve the inbound postMessage origin allowlist from the iframe
 * runtime config.
 *
 * Validation rules:
 *   - `null` config → empty default allowlist
 *   - missing or empty `allowedOrigins` field → empty default
 *   - any entry that is `'null'`, `'*'`, or does not match the
 *     origin regex → THROW (loud failure at config resolution)
 *
 * The throw-on-invalid behaviour is deliberate: a misconfigured
 * allowlist (e.g. `['null']` from a copy-paste during debugging)
 * is a security issue, not a silent fallthrough. The host app
 * MUST fix the config.
 *
 * The check is intentionally simple (no `URL` parse, no regex
 * matching on the host portion). The same allowlist is then used
 * as a strict-equality membership test (`event.origin === expected`),
 * which defeats the
 *   `https://evil.com.attacker.net` and
 *   `https://leadcars.com@attacker.com`
 *   bypasses that a `URL` parse or wildcard match would allow.
 *
 * @param config The injected `IframeConfig`, or `null` in non-embedded mode.
 * @returns A non-null, immutable list of exact-match origin strings.
 * @throws {Error} if any allowedOrigin is `'null'`, `'*'`, or malformed.
 */
export function resolveAllowedOrigins(
  config: IframeConfig | null,
): readonly string[] {
  if (
    !config ||
    !config.allowedOrigins ||
    config.allowedOrigins.length === 0
  ) {
    return DEFAULT_ALLOWED_ORIGINS;
  }
  for (const origin of config.allowedOrigins) {
    if (origin === 'null') {
      throw new Error(
        `Invalid allowedOrigin: 'null' is the opaque origin for sandboxed iframes. Allowing it would let any sandboxed embed inject messages. Configure an explicit https:// origin.`,
      );
    }
    if (origin === '*') {
      throw new Error(
        `Invalid allowedOrigin: '*' never matches a real event.origin. Use an explicit https:// origin.`,
      );
    }
    if (!VALID_ORIGIN.test(origin)) {
      throw new Error(
        `Invalid allowedOrigin: '${origin}' is not a valid http(s)://host[:port] string.`,
      );
    }
  }
  return config.allowedOrigins;
}
