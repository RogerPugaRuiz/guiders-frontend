/**
 * Design Tokens - Colores
 * Basado en la guía de diseño B2B Web Desktop
 */

// Colores base - paleta primaria
export const colors = {
  // Brand colors
  primary: {
    50: '#e7f3ff',
    100: '#cce6ff', 
    200: '#99ccff',
    300: '#66b3ff',
    400: '#3399ff',
    500: '#007bff', // Primary brand
    600: '#0066cc',
    700: '#004d99',
    800: '#003366',
    900: '#001a33',
  },
  
  // Greys for UI structure
  grey: {
    50: '#f8f9fa',
    100: '#f1f3f4', 
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#6c757d',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },

  // Semantic colors
  success: {
    50: '#f0f9f4',
    100: '#dcf4e6',
    200: '#bbe8d1',
    300: '#86d4ab',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Special colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Semantic color mappings para modo claro
export const lightModeColors = {
  // Surface colors
  surface: colors.white,
  'surface-secondary': colors.grey[50],
  'surface-tertiary': colors.grey[100],
  'surface-hover': colors.grey[100],
  'surface-active': colors.primary[50],
  'surface-disabled': colors.grey[100],

  // Text colors
  'on-surface': colors.grey[900],
  'on-surface-secondary': colors.grey[700],
  'on-surface-tertiary': colors.grey[600],
  'on-surface-disabled': colors.grey[400],
  
  // Brand colors
  brand: colors.primary[500],
  'on-brand': colors.white,
  'brand-hover': colors.primary[600],
  'brand-active': colors.primary[700],
  'brand-disabled': colors.grey[300],

  // Borders
  border: colors.grey[300],
  'border-hover': colors.grey[400],
  'border-focus': colors.primary[500],
  'border-disabled': colors.grey[200],

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
  'shadow-focus': `${colors.primary[500]}40`, // 25% opacity

  // States
  success: colors.success[500],
  'on-success': colors.white,
  warning: colors.warning[500],
  'on-warning': colors.white,
  danger: colors.danger[500],
  'on-danger': colors.white,
  info: colors.info[500],
  'on-info': colors.white,
} as const;

// Semantic color mappings para modo oscuro
export const darkModeColors = {
  // Surface colors
  surface: colors.grey[900],
  'surface-secondary': colors.grey[800],
  'surface-tertiary': colors.grey[700],
  'surface-hover': colors.grey[700],
  'surface-active': colors.primary[900],
  'surface-disabled': colors.grey[800],

  // Text colors
  'on-surface': colors.white,
  'on-surface-secondary': colors.grey[300],
  'on-surface-tertiary': colors.grey[400],
  'on-surface-disabled': colors.grey[600],
  
  // Brand colors
  brand: colors.primary[400],
  'on-brand': colors.grey[900],
  'brand-hover': colors.primary[300],
  'brand-active': colors.primary[200],
  'brand-disabled': colors.grey[600],

  // Borders
  border: colors.grey[600],
  'border-hover': colors.grey[500],
  'border-focus': colors.primary[400],
  'border-disabled': colors.grey[700],

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.3)',
  'shadow-focus': `${colors.primary[400]}40`, // 25% opacity

  // States
  success: colors.success[400],
  'on-success': colors.grey[900],
  warning: colors.warning[400],
  'on-warning': colors.grey[900],
  danger: colors.danger[400],
  'on-danger': colors.grey[900],
  info: colors.info[400],
  'on-info': colors.grey[900],
} as const;

// Type definitions
export type ColorToken = keyof typeof colors;
export type SemanticColorToken = keyof typeof lightModeColors;
export type ColorModeTokens = typeof lightModeColors | typeof darkModeColors;