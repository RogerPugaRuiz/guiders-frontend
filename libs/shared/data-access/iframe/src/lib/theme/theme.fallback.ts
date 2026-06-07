import type { ThemeConfig } from './theme.types';

/**
 * Default guiders theme used when no tenant theme is provided.
 *
 * This is the white-label iframe's "no branding" fallback — applied when
 * `/iframe/init` returns `theme: null`, when a 503 response arrives without
 * a `fallbackTheme`, or when the app runs in non-embedded default mode.
 *
 * The palette mirrors the guiders design-tokens neutral scale
 * (Carbon / Greys) so the iframe visually matches the rest of the
 * console/admin apps. See `libs/shared/design-tokens/src/lib/tokens-vars.scss`
 * for the full design token mapping.
 */
export const DEFAULT_THEME: ThemeConfig = {
  id: 'guiders-default',
  colors: {
    primary: '#1a1a1a',
    secondary: '#363636',
    accent: '#1a1a1a',
    textPrimary: '#262626',
    textSecondary: '#707276',
    background: '#f8f8f6',
    surface: '#ffffff',
    error: '#d93025',
    success: '#188038',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    baseFontSize: '14px',
    headingFontWeight: 600,
  },
  logos: {
    header: { url: '/assets/guiders-logo.svg', height: 32 },
    favicon: { url: '/assets/favicon.ico' },
    emptyState: { url: '/assets/empty-state.svg' },
  },
  enabledSections: ['chat', 'escalations', 'contacts', 'visitors', 'inbox'],
  customCss: '',
  componentMappings: {},
} as const;
