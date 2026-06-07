/**
 * Protocol version negotiation for the postMessage channel between the
 * guiders iframe and the leadcars parent window.
 *
 * Wire format (each postMessage envelope):
 *   { type, version: PROTOCOL_VERSION, requestId, timestamp, payload }
 *
 * Semver semantics:
 *   - MAJOR: changes incompatible with older MAJOR (renamed/removed fields,
 *            changed types, broken handshake order). Receivers must REJECT.
 *   - MINOR: additive changes (new optional fields, new message types).
 *            Older receivers ignore unknown fields and may proceed.
 *   - PATCH: never changes behaviour; build/doc only.
 *
 * The first version released is 1.0.0. Future bumps follow these rules.
 * Deprecations must be announced 90 days in advance via the Sunset header
 * (RFC 8594).
 */
export const PROTOCOL_VERSION = '1.0.0' as const satisfies ProtocolVersion;

/**
 * Compile-time semver string in the form `MAJOR.MINOR.PATCH`.
 *
 * ⚠️ **Compile-time only.** This template-literal type matches any
 * number-shaped triple — including negative numbers, scientific
 * notation (`'1.0.0e0'`), hex (`'0x1.0.0'`), and `NaN`/`Infinity`
 * if they coerce. The runtime `parseVersion()` helper (and
 * `checkCompatibility()`, which calls it) is the source of truth
 * for validity: it rejects anything that is not three non-negative
 * integer parts separated by dots.
 *
 * Callers that receive version strings from untrusted sources
 * (postMessage payloads, HTTP headers, JSON.parse results) MUST
 * validate them via `checkCompatibility()` before treating them
 * as a `ProtocolVersion`. The cast `wireVersion as ProtocolVersion`
 * is NOT a runtime check.
 */
export type ProtocolVersion = `${number}.${number}.${number}`;

/**
 * Result of a compatibility check between a receiver version and a sender
 * version. Discriminated by `action` so consumers can branch exhaustively.
 */
export interface VersionCompatibility {
  readonly supported: boolean;
  readonly action: 'proceed' | 'reject';
  readonly reason?: string;
}

const MALFORMED_REJECT: VersionCompatibility = {
  supported: false,
  action: 'reject',
  reason: 'Malformed version string — expected MAJOR.MINOR.PATCH',
};

/**
 * Strict semver triple regex: three non-negative integers separated by
 * dots, no leading zeros, no whitespace, no signs, no scientific/hex
 * notation.
 *
 * Anchored to the full string — `' 1.0.0'`, `'1.0.0 '`, `'1.0.0\n'`,
 * `'1..0'`, `'.1.0'`, `'1.0.'`, `'1e2.0.0'`, `'0x1.0.0'`, `'+1.0.0'`,
 * `'01.0.0'`, `'1.00.0'`, `'1.0.00'` all fail to match.
 */
const STRICT_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parseVersion(
  v: string,
): { ok: true; major: number; minor: number; patch: number } | { ok: false } {
  if (typeof v !== 'string' || !STRICT_SEMVER.test(v)) {
    return { ok: false };
  }
  const parts = v.split('.');
  const maj = Number(parts[0]);
  const min = Number(parts[1]);
  const pat = Number(parts[2]);
  // STRICT_SEMVER already guarantees digits-only, so the only way for
  // Number to fail is integer overflow to Infinity, which is not
  // representable as a non-negative integer in practice. We guard it
  // for completeness.
  if (
    !Number.isInteger(maj) ||
    !Number.isInteger(min) ||
    !Number.isInteger(pat) ||
    maj < 0 ||
    min < 0 ||
    pat < 0
  ) {
    return { ok: false };
  }
  return { ok: true, major: maj, minor: min, patch: pat };
}

/**
 * Decide whether messages from `sender` should be accepted by `receiver`.
 *
 * Rules:
 *   - Both versions must parse to three finite, non-negative integers.
 *     Anything else (NaN, undefined-portion, length !== 3) → `reject`.
 *   - Same MAJOR required.
 *   - Different MAJOR → `action: 'reject'` (unsupported).
 *   - Same MAJOR, sender MINOR > receiver MINOR → `action: 'proceed'`
 *     with a `reason` indicating the receiver is older and will ignore
 *     unknown fields.
 *   - Same MAJOR, sender MINOR <= receiver MINOR → `action: 'proceed'`.
 *   - PATCH is ignored (per semver contract in file header).
 */
export function checkCompatibility(
  receiver: string,
  sender: string,
): VersionCompatibility {
  const r = parseVersion(receiver);
  const s = parseVersion(sender);
  if (!r.ok || !s.ok) {
    return {
      ...MALFORMED_REJECT,
      reason: `Malformed version string: receiver=${receiver}, sender=${sender}`,
    };
  }

  if (r.major !== s.major) {
    return {
      supported: false,
      action: 'reject',
      reason: `MAJOR version mismatch: receiver ${receiver}, sender ${sender}`,
    };
  }

  if (r.minor < s.minor) {
    return {
      supported: true,
      action: 'proceed',
      reason: `Receiver older (${r.minor} < ${s.minor}) — extra fields ignored`,
    };
  }

  return { supported: true, action: 'proceed' };
}
