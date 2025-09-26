/**
 * Design Tokens - Espaciado
 * Basado en la guía de diseño B2B Web Desktop
 * Escala: 4/8px como base
 */

// Espaciado base (escala modular de 4px)
export const spacing = {
  0: '0px',
  1: '4px',   // 0.25rem
  2: '8px',   // 0.5rem
  3: '12px',  // 0.75rem
  4: '16px',  // 1rem
  5: '20px',  // 1.25rem
  6: '24px',  // 1.5rem
  7: '28px',  // 1.75rem
  8: '32px',  // 2rem
  10: '40px', // 2.5rem
  12: '48px', // 3rem
  16: '64px', // 4rem
  20: '80px', // 5rem
  24: '96px', // 6rem
  32: '128px', // 8rem
  40: '160px', // 10rem
  48: '192px', // 12rem
  56: '224px', // 14rem
  64: '256px', // 16rem
} as const;

// Espaciado semántico para componentes
export const componentSpacing = {
  // Espaciado interno (padding)
  'padding-xs': spacing[2],    // 8px
  'padding-sm': spacing[3],    // 12px
  'padding-md': spacing[4],    // 16px
  'padding-lg': spacing[6],    // 24px
  'padding-xl': spacing[8],    // 32px

  // Espaciado entre elementos (margin)
  'margin-xs': spacing[1],     // 4px
  'margin-sm': spacing[2],     // 8px
  'margin-md': spacing[4],     // 16px
  'margin-lg': spacing[6],     // 24px
  'margin-xl': spacing[8],     // 32px

  // Espaciado de secciones
  'section-xs': spacing[8],    // 32px
  'section-sm': spacing[12],   // 48px
  'section-md': spacing[16],   // 64px
  'section-lg': spacing[24],   // 96px
  'section-xl': spacing[32],   // 128px

  // Espaciado de contenedores
  'container-xs': spacing[4],  // 16px
  'container-sm': spacing[6],  // 24px
  'container-md': spacing[8],  // 32px
  'container-lg': spacing[12], // 48px
  'container-xl': spacing[16], // 64px
} as const;

// Espaciado específico para layouts
export const layoutSpacing = {
  // Grid gutters
  'grid-gutter': spacing[6],   // 24px
  'grid-margin': spacing[6],   // 24px (desktop)
  'grid-margin-lg': spacing[8], // 32px (large screens)

  // Header y navegación
  'header-height': spacing[16], // 64px
  'sidebar-width': spacing[64], // 256px
  'sidebar-collapsed': spacing[16], // 64px

  // Áreas de hit mínimas (accesibilidad)
  'hit-area-min': spacing[8],   // 32px
  'hit-area-spacing': spacing[2], // 8px entre elementos interactivos
} as const;

// Type definitions
export type SpacingToken = keyof typeof spacing;
export type ComponentSpacingToken = keyof typeof componentSpacing;
export type LayoutSpacingToken = keyof typeof layoutSpacing;