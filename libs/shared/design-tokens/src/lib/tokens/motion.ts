/**
 * Design Tokens - Z-Index y Motion
 * Basado en la guía de diseño B2B Web Desktop
 */

// Z-index layers para gestión de profundidad
export const zIndex = {
  auto: 'auto',
  base: 0,
  behind: -1,
  // Contenido normal
  content: 10,
  // Elementos flotantes
  sticky: 100,
  fixed: 200,
  // Overlays y navegación
  dropdown: 1000,
  popover: 1100,
  tooltip: 1200,
  // Elementos críticos
  modal: 1300,
  drawer: 1400,
  notification: 1500,
  // Elementos del sistema
  loading: 9000,
  debug: 9999,
} as const;

// Duraciones de animación
export const duration = {
  instant: '0ms',
  fast: '100ms',     // Micro-interacciones
  normal: '150ms',   // Hover, focus
  slow: '200ms',     // Transiciones de estado
  slower: '300ms',   // Animaciones de entrada/salida
  slowest: '400ms',  // Animaciones complejas (máximo recomendado)
} as const;

// Easing functions para animaciones naturales
export const easing = {
  // Estándar para la mayoría de transiciones
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  // Para elementos que entran a la vista
  entrance: 'cubic-bezier(0, 0, 0.2, 1)', 
  // Para elementos que salen de la vista
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  // Para énfasis en interacciones
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  // Easing más suave para contenido
  gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  // Easing con rebote sutil
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Configuraciones de animación comunes
export const motion = {
  // Transiciones básicas
  'fade-in': {
    duration: duration.normal,
    easing: easing.entrance,
    property: 'opacity',
  },
  'fade-out': {
    duration: duration.fast,
    easing: easing.exit,
    property: 'opacity',
  },
  'slide-up': {
    duration: duration.slow,
    easing: easing.entrance,
    property: 'transform',
  },
  'slide-down': {
    duration: duration.slow,
    easing: easing.exit,
    property: 'transform',
  },
  'scale-in': {
    duration: duration.slower,
    easing: easing.bounce,
    property: 'transform',
  },
  'scale-out': {
    duration: duration.normal,
    easing: easing.exit,
    property: 'transform',
  },

  // Hover y focus
  hover: {
    duration: duration.fast,
    easing: easing.standard,
    property: 'all',
  },
  focus: {
    duration: duration.instant,
    easing: easing.standard,
    property: 'box-shadow, border-color',
  },

  // Estados de carga
  loading: {
    duration: '1s',
    easing: 'linear',
    property: 'transform',
    iterationCount: 'infinite',
  },
  pulse: {
    duration: '2s',
    easing: easing.gentle,
    property: 'opacity',
    iterationCount: 'infinite',
  },

  // Elementos de navegación
  'sidebar-collapse': {
    duration: duration.slower,
    easing: easing.standard,
    property: 'width, opacity',
  },
  'modal-enter': {
    duration: duration.slower,
    easing: easing.entrance,
    property: 'opacity, transform',
  },
  'modal-exit': {
    duration: duration.slow,
    easing: easing.exit,
    property: 'opacity, transform',
  },
} as const;

// Configuración para reducción de movimiento
export const reducedMotion = {
  duration: duration.instant,
  easing: easing.standard,
} as const;

// Type definitions
export type ZIndexToken = keyof typeof zIndex;
export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
export type MotionToken = keyof typeof motion;