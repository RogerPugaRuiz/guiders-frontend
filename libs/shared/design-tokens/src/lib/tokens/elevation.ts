/**
 * Design Tokens - Radios y Sombras
 * Basado en la guía de diseño B2B Web Desktop
 */

// Border radius
export const borderRadius = {
  none: '0px',
  sm: '2px',      // Elementos pequeños
  base: '4px',    // Default para botones, inputs
  md: '6px',      // Cards, modales pequeños
  lg: '8px',      // Cards grandes, contenedores
  xl: '12px',     // Contenedores principales
  '2xl': '16px',  // Contenedores destacados
  '3xl': '24px',  // Elementos decorativos
  full: '9999px', // Elementos circulares
} as const;

// Box shadows con niveles de elevación
export const boxShadow = {
  none: 'none',
  // Elevaciones sutiles
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Sombras para estados específicos
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  'focus-brand': '0 0 0 3px rgba(0, 123, 255, 0.25)',

  // Sombras para overlays
  overlay: '0 10px 25px rgba(0, 0, 0, 0.15)',
  modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  tooltip: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
} as const;

// Drop shadows para modo oscuro
export const boxShadowDark = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',

  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.3)',
  'focus-brand': '0 0 0 3px rgba(0, 123, 255, 0.4)',

  overlay: '0 10px 25px rgba(0, 0, 0, 0.5)',
  modal: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
  tooltip: '0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4)',
} as const;

// Border widths
export const borderWidth = {
  0: '0px',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
} as const;

// Type definitions
export type BorderRadiusToken = keyof typeof borderRadius;
export type BoxShadowToken = keyof typeof boxShadow;
export type BorderWidthToken = keyof typeof borderWidth;