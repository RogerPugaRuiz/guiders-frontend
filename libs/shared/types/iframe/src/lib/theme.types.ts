/**
 * Theme contract for the white-label iframe.
 *
 * These types are the canonical (camelCase) shape used inside Angular code.
 * The backend BFF returns the same shape in snake_case keys; consumers
 * (story 8-5) are responsible for the API → camelCase mapping.
 *
 * The custom CSS field is intentionally `string` (not parsed) — sanitization
 * happens at the application boundary in `theme.utils.sanitizeCss()`, not
 * in the type system.
 */

/** Section identifiers that the iframe can hide/show per tenant. */
export type SectionName =
  | 'chat'
  | 'escalations'
  | 'contacts'
  | 'visitors'
  | 'inbox';

const VALID_SECTION_NAMES = ['chat', 'escalations', 'contacts', 'visitors', 'inbox'] as const;

export function isSectionName(value: string): value is SectionName {
  return VALID_SECTION_NAMES.includes(value as SectionName);
}

/** Colour palette applied as CSS custom properties (`--guiders-color-*`). */
export interface ThemeColors {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly background: string;
  readonly surface: string;
  readonly error: string;
  readonly success: string;
}

/**
 * Valid CSS `font-weight` values: 1-3 digit numbers 1-9 (i.e.
 * `100` | `200` | `300` | `400` | `500` | `600` | `700` | `800` | `900`)
 * OR the four CSS keywords. Used to tighten `ThemeTypography.headingFontWeight`
 * so a tenant config like `'banana'` becomes a compile-time error.
 */
export type FontWeight =
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 'normal'
  | 'bold'
  | 'lighter'
  | 'bolder';

/** Typography stack applied to the iframe shell and components. */
export interface ThemeTypography {
  readonly fontFamily: string;
  readonly baseFontSize: string;
  /**
   * CSS font-weight for headings. Accepts either a numeric value
   * (100-900) or one of the four CSS keywords. Values outside this
   * set are compile-time errors so the tenant admin form can validate
   * at the input layer.
   */
  readonly headingFontWeight: FontWeight;
}

/**
 * A single logo asset (URL + optional sizing + optional MIME).
 *
 * `height` is a CSS pixel value used by the iframe shell's header
 * slot. `type` is the MIME type, REQUIRED for favicons (so the
 * browser can pick the right icon format) and OPTIONAL for other
 * logos where MIME is inferred from the file extension.
 */
export interface ThemeLogoAsset {
  readonly url: string;
  readonly height?: number;
  readonly type?: string;
}

/** Bundle of brand assets used by the iframe UI. */
export interface ThemeLogos {
  readonly header: ThemeLogoAsset;
  readonly favicon: ThemeLogoAsset;
  readonly emptyState: ThemeLogoAsset;
}

/**
 * Top-level theme configuration. One instance per `WhiteLabelTheme` row
 * in the backend. The iframe applies this to the DOM via
 * `applyCssVariables()` (story 8-3) and uses the assets to render the shell.
 */
export interface ThemeConfig {
  /**
   * Stable identifier for this theme. Maps from the backend's
   * `WhiteLabelTheme.id` (UUID). Used by the ThemeService (story 8-3) to
   * tag injected `<style>` elements with `data-guiders-theme="<id>"`
   * for debugging and per-theme removal.
   *
   * For the no-branding fallback, the id is the literal `'guiders-default'`.
   */
  readonly id: string;
  readonly colors: ThemeColors;
  readonly typography: ThemeTypography;
  readonly logos: ThemeLogos;
  /**
   * Which sections of the iframe are enabled for this tenant.
   *
   * Contract:
   *   - **Must contain at least one section** — an empty array would
   *     leave the iframe shell without any routable view, which is
   *     always a configuration error.
   *   - **Duplicates are ignored** at render time; the admin form
   *     should de-dup before save.
   *   - **Backend returns `string[]`**, not `SectionName[]`. The
   *     IframeInitService (story 8-5) MUST filter unknown values
   *     via a type guard (`isSectionName`) before casting. Unknown
   *     sections from the backend are ignored, not rejected.
   */
  readonly enabledSections: readonly SectionName[];
  readonly customCss: string;
  /**
   * Optional slot → component-class mapping. Consumers (story 8-8) use
   * this to resolve which Angular component to render in each slot.
   * Unknown keys fall back to the guiders default.
   */
  readonly componentMappings: Readonly<Record<string, string>>;
}
