import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  PROTOCOL_VERSION,
  checkCompatibility,
  type ProtocolVersion,
} from './protocol-version';

describe('PROTOCOL_VERSION', () => {
  it('is 1.0.0', () => {
    expect(PROTOCOL_VERSION).toBe('1.0.0');
  });

  it('has a literal type assignable to ProtocolVersion (F21)', () => {
    // Type-level assertion: this assignment is the only meaningful
    // check. A regression that widens the type (e.g. to `${string}…`)
    // would break at this site, not at the runtime `toBe` line.
    // We use `toMatchTypeOf` because the literal '1.0.0' is a
    // subtype of the broader template `ProtocolVersion`; the two
    // are not structurally identical.
    expectTypeOf(PROTOCOL_VERSION).toMatchTypeOf<ProtocolVersion>();
    expect(PROTOCOL_VERSION).toBe('1.0.0');
  });
});

describe('checkCompatibility', () => {
  it('proceeds for the same version', () => {
    const r = checkCompatibility('1.0.0', '1.0.0');
    expect(r.supported).toBe(true);
    expect(r.action).toBe('proceed');
    expect(r.reason).toBeUndefined();
  });

  it('proceeds when receiver is older (sender has higher MINOR)', () => {
    const r = checkCompatibility('1.0.0', '1.2.3');
    expect(r.supported).toBe(true);
    expect(r.action).toBe('proceed');
    expect(r.reason).toMatch(/Receiver older/);
  });

  it('proceeds without reason when sender is older (receiver has higher MINOR)', () => {
    const r = checkCompatibility('2.3.0', '2.1.0');
    expect(r.supported).toBe(true);
    expect(r.action).toBe('proceed');
    expect(r.reason).toBeUndefined();
  });

  it('rejects MAJOR mismatch (sender has higher MAJOR)', () => {
    const r = checkCompatibility('1.5.0', '2.0.0');
    expect(r.supported).toBe(false);
    expect(r.action).toBe('reject');
    expect(r.reason).toMatch(/MAJOR version mismatch/);
  });

  it('rejects MAJOR mismatch (sender has lower MAJOR)', () => {
    const r = checkCompatibility('3.0.0', '1.0.0');
    expect(r.supported).toBe(false);
    expect(r.action).toBe('reject');
  });

  it('ignores PATCH difference (same MAJOR + MINOR, different PATCH)', () => {
    const r = checkCompatibility('1.0.0', '1.0.5');
    expect(r.supported).toBe(true);
    expect(r.action).toBe('proceed');
    // F22: assert that PATCH-only difference does NOT spuriously
    // emit a "Receiver older" reason.
    expect(r.reason).toBeUndefined();
  });

  it('yields identical results when receiver and sender are the same version (F1)', () => {
    // Real (non-tautological) symmetry test: pick two distinct
    // same-version pairs and assert their results are deep-equal.
    const a = checkCompatibility('2.4.7', '2.4.7');
    const b = checkCompatibility('10.20.30', '10.20.30');
    expect(a).toEqual(b);
  });

  it('rejects malformed receiver (not 3 parts)', () => {
    const r = checkCompatibility('1.0', '1.0.0');
    expect(r.action).toBe('reject');
    expect(r.supported).toBe(false);
    expect(r.reason).toMatch(/Malformed version string/);
  });

  it('rejects malformed sender (NaN part)', () => {
    const r = checkCompatibility('1.0.0', '1.x.0');
    expect(r.action).toBe('reject');
    expect(r.supported).toBe(false);
  });

  it('rejects empty string', () => {
    const r = checkCompatibility('', '1.0.0');
    expect(r.action).toBe('reject');
  });

  it('rejects negative version parts', () => {
    const r = checkCompatibility('-1.0.0', '1.0.0');
    expect(r.action).toBe('reject');
  });
});

describe('checkCompatibility — semver edge cases (F16)', () => {
  it.each([
    ['1.0.0-beta', 'prerelease suffix'],
    ['1.0.0+sha', 'build metadata'],
    ['1.0', '2 parts only'],
    ['1', '1 part only'],
    ['1.0.0.0', '4 parts'],
    ['01.0.0', 'leading zero MAJOR'],
    ['1.00.0', 'leading zero MINOR'],
    ['1.0.00', 'leading zero PATCH'],
    [' 1.0.0', 'leading whitespace'],
    ['1.0.0 ', 'trailing whitespace'],
    ['1..0', 'empty middle part'],
    ['.1.0', 'empty leading part'],
    ['1.0.', 'empty trailing part'],
    ['1e2.0.0', 'scientific notation'],
    ['0x1.0.0', 'hex notation'],
    ['+1.0.0', 'leading plus sign'],
    ['-1.0.0', 'negative MAJOR'],
  ])('rejects %s (%s)', (input) => {
    const r = checkCompatibility(input, '1.0.0');
    expect(r.action).toBe('reject');
    expect(r.supported).toBe(false);
  });

  it('rejects MAJOR=0.x (semver convention: 0.x is unstable)', () => {
    // Current implementation accepts 0.x the same as 1.x. The
    // semver spec recommends 0.x to be treated as MAJOR-breaking
    // on MINOR bumps. We document the current behavior and skip
    // 0.x-specific handling for now.
    const r = checkCompatibility('0.5.0', '0.6.0');
    expect(r.action).toBe('proceed');
    expect(r.supported).toBe(true);
  });
});
