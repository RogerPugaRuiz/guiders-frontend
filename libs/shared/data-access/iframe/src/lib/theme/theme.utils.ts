import type { ThemeConfig } from './theme.types';

/**
 * Regex for valid CSS custom-property names on `:root`.
 *
 * Per the architecture doc (XSS Sanitization Strategy):
 *   "All `:root` variables validated against regex `^[a-z0-9-]+$`"
 *
 * Lowercase, digits, and hyphens only. The first character must be a
 * letter or hyphen (CSS custom-ident cannot start with a digit per the
 * CSS spec). Names like `--primaryColor`, `--text_primary`, `--2stuff`,
 * or `--bad<name>` are rejected and replaced with a placeholder comment
 * so the rest of the rule still parses cleanly.
 */
const CSS_VAR_NAME_REGEX = /^[a-z-][a-z0-9-]*$/;

/**
 * Allowlist of hostnames permitted in `url(...)` references inside the
 * tenant-supplied custom CSS. The same allowlist is enforced on the
 * backend (image proxy) and on the CSP `img-src` directive.
 *
 * Relative URLs (`/path/...`) and `data:image/...` URIs are always
 * allowed regardless of host.
 */
const ALLOWED_URL_DOMAINS: readonly string[] = [
  'cdn.guiders.com',
  'cdn.leadcars.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

/**
 * Default logo height (in px) when the theme provides no `height` for
 * the header logo, or when the runtime value is not a finite number.
 */
const DEFAULT_LOGO_HEADER_HEIGHT_PX = 32;

/**
 * Extract the content of the first balanced `url(...)` group starting
 * at `startIndex`. Handles URLs that may contain `)` (e.g. data URIs
 * with base64 padding) by counting parentheses rather than using a
 * naïve regex.
 *
 * Returns the URL string (without the surrounding `url(...)` syntax)
 * and the index just past the closing `)`. Returns `null` if no
 * balanced group exists.
 */
function extractBalancedUrl(
  input: string,
  startIndex: number,
): { url: string; endIndex: number } | null {
  // Expect literal "url(" at startIndex
  if (!input.startsWith('url(', startIndex)) {
    return null;
  }
  let depth = 1;
  let i = startIndex + 4;
  let inSingle = false;
  let inDouble = false;
  while (i < input.length) {
    const c = input[i];
    if (inSingle) {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === "'") inSingle = false;
    } else if (inDouble) {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === '"') inDouble = false;
    } else {
      if (c === "'") inSingle = true;
      else if (c === '"') inDouble = true;
      else if (c === '(') depth++;
      else if (c === ')') {
        depth--;
        if (depth === 0) {
          return { url: input.slice(startIndex + 4, i), endIndex: i + 1 };
        }
      }
    }
    i++;
  }
  return null;
}

/**
 * Determine whether a URL extracted from `url(...)` is allowed.
 *
 * Allowed:
 *   - Relative paths starting with `/`
 *   - `data:image/...` URIs (base64 / inline)
 *   - Absolute URLs whose hostname is in `ALLOWED_URL_DOMAINS`
 *
 * Everything else is rejected.
 */
function isUrlAllowed(url: string): boolean {
  const trimmed = url.trim().replace(/^['"]|['"]$/g, '');
  if (trimmed.startsWith('/')) return true;
  if (trimmed.startsWith('data:image/')) return true;
  try {
    const host = new URL(trimmed).hostname;
    return ALLOWED_URL_DOMAINS.includes(host);
  } catch {
    return false;
  }
}

/**
 * Strip CSS block comments from a CSS string. Necessary as a pre-pass
 * before the url() allowlist, because comments inside url(...) are
 * stripped by the browser at parse time and would otherwise allow
 * bypass of our checks (e.g. `url(COMMENT evil.com/x.png)`).
 */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Sanitize a tenant-supplied CSS string.
 *
 * The iframe init endpoint accepts a `customCss` field that the BFF
 * forwards from the tenant admin config. The string is treated as
 * untrusted: even though it travels over an authenticated channel, a
 * compromised admin panel or a malicious theme author could ship CSS
 * that breaks the CSP or steals click data.
 *
 * Rules applied (matching the architecture doc § 1.3 verbatim):
 *   1. Strip `@import` — defeats external stylesheet injection.
 *   2. Strip `javascript:` in `url(...)` — defeats pseudo-protocol XSS.
 *   3. Strip `expression(...)` — defeats legacy IE XSS vectors.
 *   4. Restrict `url(...)` to relative paths, `data:image/...`, and the
 *      `ALLOWED_URL_DOMAINS` allowlist. Anything else is replaced with
 *      an empty `url()` so the property still parses. Handles URLs
 *      containing `)` (e.g. data URIs) via paren counting.
 *   5. Validate every `--var-name` declared inside `:root` blocks
 *      against `^[a-z-][a-z0-9-]*$`. Invalid names are replaced with
 *      a placeholder comment so the surrounding block stays valid.
 *   6. Apply the url() allowlist to `:root` variable VALUES as well
 *      as to `url(...)` in regular declarations — otherwise a tenant
 *      can stash a malicious URL inside a custom property and have
 *      it resolved at compute time via `var(--x)`.
 *
 * Returns the sanitized CSS, or an empty string for falsy / non-string
 * input. Never throws.
 */
export function sanitizeCss(rawCss: string): string {
  if (!rawCss || typeof rawCss !== 'string') {
    return '';
  }

  let css = rawCss;

  // Pre-pass: strip CSS comments so they cannot be used to bypass
  // subsequent url() and javascript: checks (the browser strips them
  // at parse time, so any check that ignores them is leaky).
  css = stripCssComments(css);

  // 1. Strip @import. We require a `;` terminator (or end of string
  //    AFTER whitespace). The body is non-greedy AND restricted to
  //    a single line so we don't eat the next rule's content. If no
  //    `;` is found, the @import is left untouched (malformed input
  //    is not a security risk because the browser will reject it).
  css = css.replace(/@import\b[^;\n]*?;/gi, '');

  // 2. Strip javascript: in url(...). Both quoted and unquoted forms.
  //    Applied BEFORE the allowlist pass to keep the allowlist simple.
  css = css.replace(/url\(\s*["']?javascript:[^)]*\)/gi, 'url()');

  // 3. Strip expression(...) (legacy IE XSS vector).
  css = css.replace(/expression\s*\([^)]*\)/gi, '');

  // 4. Restrict url(...) to the allowlist. We walk the string and use
  //    a paren counter so that URLs containing `)` (e.g. data URIs
  //    with `=` padding characters) are matched correctly.
  css = (() => {
    const out: string[] = [];
    let i = 0;
    while (i < css.length) {
      // Find the next "url(" case-insensitively
      const matchIdx = css.toLowerCase().indexOf('url(', i);
      if (matchIdx === -1) {
        out.push(css.slice(i));
        break;
      }
      out.push(css.slice(i, matchIdx));
      const extracted = extractBalancedUrl(css, matchIdx);
      if (extracted === null) {
        // Unbalanced; emit rest verbatim
        out.push(css.slice(matchIdx));
        break;
      }
      if (isUrlAllowed(extracted.url)) {
        // Re-emit the original (preserves quoting and original spacing)
        out.push(css.slice(matchIdx, extracted.endIndex));
      } else {
        out.push('url()');
      }
      i = extracted.endIndex;
    }
    return out.join('');
  })();

  // 5 + 6. Validate :root variable NAMES and apply the url() allowlist
  //    to var VALUES. The body regex `[^}]*` is intentionally non-
  //    greedy: it stops at the first `}`, which is correct for
  //    well-formed CSS. Nested-brace adversarial input loses trailing
  //    declarations (low-impact, no security impact).
  css = css.replace(
    /:root\s*\{([^}]*)\}/gi,
    (match: string, body: string) => {
      const validated = body.replace(
        /--([a-zA-Z0-9-_]*[^\s;:}]*)\s*:\s*([^;]+);?/gi,
        (_m: string, name: string, rawValue: string) => {
          if (!CSS_VAR_NAME_REGEX.test(name)) {
            return '/* invalid var */';
          }
          // Sanitize the value too: strip javascript: / non-allowlisted
          // urls so a tenant cannot stash a malicious URL inside a
          // custom property (which would be resolved at compute time
          // via `var(--x)` in a later rule).
          const sanitizedValue = sanitizeVarValue(rawValue);
          return `--${name}: ${sanitizedValue};`;
        },
      );
      return `:root { ${validated} }`;
    },
  );

  return css.trim();
}

/**
 * Sanitize a single CSS custom-property value. The url() allowlist
 * is applied here; everything else passes through unchanged.
 */
function sanitizeVarValue(value: string): string {
  return value.replace(
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    (match: string, url: string) => {
      return isUrlAllowed(url) ? match : 'url()';
    },
  );
}

/**
 * Build the flat CSS custom-property map for a given theme.
 *
 * Each entry is a single `--guiders-*` property → value pair. The map
 * is the contract between the `ThemeService.applyToDom()` method and
 * the SCSS files that read these variables via `var(--guiders-*)`.
 *
 * The 13 entries are:
 *   - 9 colors  (`--guiders-color-{primary,secondary,accent,text-primary,
 *                                text-secondary,background,surface,
 *                                error,success}`)
 *   - 3 typography (`--guiders-font-{family,size-base,weight-heading}`)
 *   - 1 logo height (`--guiders-logo-header-height`, with `px` suffix;
 *                     falls back to 32px when undefined or non-finite)
 *
 * The order is stable so snapshots, tests, and style-diffs are
 * deterministic. SCSS files consume these via the design-tokens layer.
 */
export function buildCssVariableMap(theme: ThemeConfig): Record<string, string> {
  const headerHeight = theme.logos.header.height;
  const safeHeaderHeight =
    typeof headerHeight === 'number' && Number.isFinite(headerHeight)
      ? headerHeight
      : DEFAULT_LOGO_HEADER_HEIGHT_PX;

  return {
    '--guiders-color-primary': theme.colors.primary,
    '--guiders-color-secondary': theme.colors.secondary,
    '--guiders-color-accent': theme.colors.accent,
    '--guiders-color-text-primary': theme.colors.textPrimary,
    '--guiders-color-text-secondary': theme.colors.textSecondary,
    '--guiders-color-background': theme.colors.background,
    '--guiders-color-surface': theme.colors.surface,
    '--guiders-color-error': theme.colors.error,
    '--guiders-color-success': theme.colors.success,
    '--guiders-font-family': theme.typography.fontFamily,
    '--guiders-font-size-base': theme.typography.baseFontSize,
    '--guiders-font-weight-heading': String(theme.typography.headingFontWeight),
    '--guiders-logo-header-height': `${safeHeaderHeight}px`,
  };
}
