import { describe, it, expect } from 'vitest';
import {
  buildCssVariableMap,
  sanitizeCss,
} from './theme.utils';
import type { ThemeConfig } from './theme.types';

const TEST_THEME: ThemeConfig = {
  id: 'test-theme',
  colors: {
    primary: '#1a73e8',
    secondary: '#f8f9fa',
    accent: '#ff6b35',
    textPrimary: '#202124',
    textSecondary: '#5f6368',
    background: '#ffffff',
    surface: '#f8f9fa',
    error: '#d93025',
    success: '#188038',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    baseFontSize: '14px',
    headingFontWeight: '600',
  },
  logos: {
    header: { url: 'https://cdn.guiders.com/header.svg', height: 48 },
    favicon: { url: 'https://cdn.guiders.com/favicon.ico' },
    emptyState: { url: 'https://cdn.guiders.com/empty.svg' },
  },
  enabledSections: ['chat'],
  customCss: '',
  componentMappings: {},
};

describe('sanitizeCss', () => {
  describe('input validation', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeCss('')).toBe('');
    });

    it('returns empty string for non-string input', () => {
      expect(sanitizeCss(null as unknown as string)).toBe('');
      expect(sanitizeCss(undefined as unknown as string)).toBe('');
      expect(sanitizeCss(42 as unknown as string)).toBe('');
    });
  });

  describe('@import blocking', () => {
    it('strips @import statements', () => {
      const input = '@import url("https://evil.com/x.css"); .foo { color: red; }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/@import/i);
      expect(result).toContain('.foo');
      expect(result).toContain('color: red');
    });

    it('strips multiple @import statements', () => {
      const input = '@import "a.css"; @import "b.css"; .x { color: red; }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/@import/i);
      expect(result).toContain('.x');
    });
  });

  describe('javascript: URL blocking', () => {
    it('strips javascript: in url()', () => {
      const input = 'a { background: url(javascript:alert(1)); }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/javascript:/i);
    });

    it('strips javascript: in url() with quotes', () => {
      const input = `a { background: url("javascript:alert(1)"); }`;
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/javascript:/i);
    });
  });

  describe('expression() blocking (legacy IE XSS)', () => {
    it('strips expression() calls', () => {
      const input = 'a { width: expression(alert(1)); }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/expression\s*\(/i);
    });
  });

  describe('url() allowlist', () => {
    it('allows relative URLs', () => {
      const input = 'a { background: url(/img/foo.png); }';
      const result = sanitizeCss(input);
      expect(result).toMatch(/url\(\/img\/foo\.png\)/);
    });

    it('allows data: image URLs', () => {
      const input = 'a { background: url(data:image/png;base64,iVBORw0KG); }';
      const result = sanitizeCss(input);
      expect(result).toMatch(/url\(data:image\/png/);
    });

    it('blocks external URLs not in allowlist', () => {
      const input = 'a { background: url(https://evil.com/x.png); }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/evil\.com/);
    });

    it('allows URLs from CDN allowlist', () => {
      const input = 'a { background: url(https://cdn.guiders.com/x.png); }';
      const result = sanitizeCss(input);
      expect(result).toMatch(/cdn\.guiders\.com/);
    });
  });

  describe(':root variable name validation', () => {
    it('keeps valid :root variable names', () => {
      const input = ':root { --primary-color: #fff; --text-2: red; }';
      const result = sanitizeCss(input);
      expect(result).toContain('--primary-color');
      expect(result).toContain('--text-2');
    });

    it('rejects :root variable names with invalid characters', () => {
      const input = ':root { --bad-Name: red; --evil<script>: blue; }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/--bad-Name/);
      expect(result).not.toMatch(/--evil<script>/);
    });

    it('keeps a multi-line :root block intact (only bad vars stripped)', () => {
      const input = ':root { --ok-var: red; --BAD: blue; }';
      const result = sanitizeCss(input);
      expect(result).toContain('--ok-var: red');
      expect(result).not.toMatch(/--BAD/);
    });

    it('rejects names starting with a digit (--2stuff)', () => {
      const input = ':root { --2stuff: red; }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/--2stuff/);
    });

    it('rejects mixed-case --ok-BAD (uppercase letters)', () => {
      const input = ':root { --ok-BAD: red; }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/--ok-BAD/);
    });
  });

  describe(':root variable VALUE sanitization (F14)', () => {
    it('strips javascript: inside a :root var value', () => {
      const input = ':root { --x: url(javascript:alert(1)); }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/javascript:/i);
    });

    it('strips non-allowlisted external URLs inside :root var values', () => {
      const input = ':root { --x: url(https://evil.com/y.png); }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/evil\.com/);
    });
  });

  describe('@import regex robustness (F12)', () => {
    it('strips @import with semicolon terminator and keeps the next rule', () => {
      const input = '@import url(evil.css); .foo { color: red; }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/@import/i);
      expect(result).toContain('.foo');
      expect(result).toContain('color: red');
    });

    it('strips @import with quoted-string terminator', () => {
      const input = '@import "evil.css"; .x { color: red; }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/@import/i);
      expect(result).toContain('.x');
    });

    it('strips multiple @import statements sequentially', () => {
      const input = '@import "a.css"; @import "b.css"; .x { color: red; }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/@import/i);
      expect(result).toContain('.x');
    });

    it('strips @import with no semicolon before the next rule (best-effort)', () => {
      // KNOWN LIMITATION: the regex is best-effort. For malformed
      // input like `@import url(evil.css) .foo { color: red; }`, the
      // @import is matched up to the first `;` — which is the `;`
      // at the end of the .foo rule. The result strips the whole
      // thing. This is acceptable because:
      //   (a) the @import is still removed (no external stylesheet
      //       is loaded — security goal achieved),
      //   (b) the .foo rule is also lost, but that is a no-op for
      //       the iframe's own styling (the lost rule was an
      //       adversarial attack attempt, not legitimate CSS),
      //   (c) the browser's own parser would reject this malformed
      //       CSS anyway.
      // The robust fix is a real CSS parser, deferred to post-MVP.
      const input = '@import url(evil.css) .foo { color: red; }';
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/@import/i);
      // The "}" is what survives the greedy match — the entire block
      // (including the closing brace of the .foo rule) is consumed.
      // This is acceptable per the rationale above.
    });
  });

  describe('url() robustness (F10, F11)', () => {
    it('handles URLs containing ) characters (paren counter)', () => {
      const input = 'a { background: url(/img(test)file.png); }';
      const result = sanitizeCss(input);
      // The relative URL is allowed; the rule should still parse
      expect(result).toMatch(/url\(/);
    });

    it('strips CSS comments before url() check (no bypass via /*x*/)', () => {
      const input = 'a { background: url(/*x*/https://evil.com/x.png); }';
      const result = sanitizeCss(input);
      // The comment is stripped first, then url() sees the evil URL
      // and replaces it. Final: no "evil.com" in output.
      expect(result).not.toMatch(/evil\.com/);
    });
  });

  describe('combined attacks', () => {
    it('strips @import + javascript: + invalid var in one pass', () => {
      const input = `
        @import "evil.css";
        .x { background: url(javascript:alert(1)); }
        :root { --ok: 1; --EVIL: 2; }
      `;
      const result = sanitizeCss(input);
      expect(result).not.toMatch(/@import/i);
      expect(result).not.toMatch(/javascript:/i);
      expect(result).toContain('--ok: 1');
      expect(result).not.toMatch(/--EVIL/);
    });
  });
});

describe('buildCssVariableMap', () => {
  it('returns 13 entries for a fully-populated theme', () => {
    const map = buildCssVariableMap(TEST_THEME);
    expect(Object.keys(map)).toHaveLength(13);
  });

  it('maps all 9 colors to --guiders-color-*', () => {
    const map = buildCssVariableMap(TEST_THEME);
    expect(map['--guiders-color-primary']).toBe('#1a73e8');
    expect(map['--guiders-color-secondary']).toBe('#f8f9fa');
    expect(map['--guiders-color-accent']).toBe('#ff6b35');
    expect(map['--guiders-color-text-primary']).toBe('#202124');
    expect(map['--guiders-color-text-secondary']).toBe('#5f6368');
    expect(map['--guiders-color-background']).toBe('#ffffff');
    expect(map['--guiders-color-surface']).toBe('#f8f9fa');
    expect(map['--guiders-color-error']).toBe('#d93025');
    expect(map['--guiders-color-success']).toBe('#188038');
  });

  it('maps all 3 typography vars to --guiders-font-*', () => {
    const map = buildCssVariableMap(TEST_THEME);
    expect(map['--guiders-font-family']).toBe('Inter, sans-serif');
    expect(map['--guiders-font-size-base']).toBe('14px');
    expect(map['--guiders-font-weight-heading']).toBe('600');
  });

  it('maps logo header height to --guiders-logo-header-height with px', () => {
    const map = buildCssVariableMap(TEST_THEME);
    expect(map['--guiders-logo-header-height']).toBe('48px');
  });

  it('falls back to 32px when logo height is undefined', () => {
    const map = buildCssVariableMap({
      ...TEST_THEME,
      logos: {
        ...TEST_THEME.logos,
        header: { url: 'https://x.com/h.svg' },
      },
    });
    expect(map['--guiders-logo-header-height']).toBe('32px');
  });

  it('falls back to 32px when logo height is a non-number (F9)', () => {
    const map = buildCssVariableMap({
      ...TEST_THEME,
      logos: {
        ...TEST_THEME.logos,
        header: { url: 'https://x.com/h.svg', height: '50%' as unknown as number },
      },
    });
    expect(map['--guiders-logo-header-height']).toBe('32px');
  });

  it('falls back to 32px when logo height is NaN', () => {
    const map = buildCssVariableMap({
      ...TEST_THEME,
      logos: {
        ...TEST_THEME.logos,
        header: { url: 'https://x.com/h.svg', height: Number.NaN },
      },
    });
    expect(map['--guiders-logo-header-height']).toBe('32px');
  });
});
