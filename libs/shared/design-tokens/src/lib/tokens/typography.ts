/**
 * Design Tokens - Tipografía
 * Basado en la guía de diseño B2B Web Desktop
 */

// Familias tipográficas
export const fontFamilies = {
  ui: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  mono: ['Roboto Mono', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
} as const;

// Pesos de fuente
export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Tamaños de fuente (escala modular)
export const fontSizes = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '32px',
} as const;

// Line heights para legibilidad
export const lineHeights = {
  tight: 1.25,    // Para títulos grandes
  snug: 1.375,    // Para títulos medianos
  normal: 1.5,    // Para texto de interfaz
  relaxed: 1.625, // Para texto de lectura
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// Tokens de tipografía semántica
export const typography = {
  // Headings
  h1: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes['4xl'],
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights.snug,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.snug,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },

  // Body text
  'body-large': {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.relaxed,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  'body-base': {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  'body-small': {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },

  // UI elements
  'button-large': {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  'button-medium': {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  'button-small': {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wider,
  },

  // Labels and captions
  'label-large': {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.normal,
  },
  'label-medium': {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  caption: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },

  // Data and code
  'data-large': {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  'data-medium': {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  'data-small': {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
} as const;

// Type definitions
export type FontFamily = keyof typeof fontFamilies;
export type FontWeight = keyof typeof fontWeights;
export type FontSize = keyof typeof fontSizes;
export type LineHeight = keyof typeof lineHeights;
export type LetterSpacing = keyof typeof letterSpacing;
export type TypographyToken = keyof typeof typography;