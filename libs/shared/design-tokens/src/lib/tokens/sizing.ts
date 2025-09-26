/**
 * Design Tokens - Breakpoints y Tamaños
 * Basado en la guía de diseño B2B Web Desktop
 */

// Breakpoints para responsive design (desktop-first para B2B)
export const breakpoints = {
  // Mobile (mínimo soportado para administración móvil básica)
  sm: '640px',   // 40rem
  md: '768px',   // 48rem  
  // Tablet y desktop pequeño
  lg: '1024px',  // 64rem
  xl: '1280px',  // 80rem - Mínimo recomendado para B2B
  '2xl': '1440px', // 90rem - Estándar B2B
  '3xl': '1600px', // 100rem - Pantallas grandes
  '4xl': '1920px', // 120rem - Pantallas muy grandes
} as const;

// Anchos máximos de contenedor
export const maxWidth = {
  none: 'none',
  xs: '320px',   // 20rem
  sm: '384px',   // 24rem
  md: '448px',   // 28rem
  lg: '512px',   // 32rem
  xl: '576px',   // 36rem
  '2xl': '672px', // 42rem
  '3xl': '768px', // 48rem
  '4xl': '896px', // 56rem
  '5xl': '1024px', // 64rem
  '6xl': '1152px', // 72rem
  '7xl': '1280px', // 80rem - Contenido principal
  '8xl': '1440px', // 90rem - Máximo recomendado para B2B
  full: '100%',
  screen: '100vw',
} as const;

// Alturas de componentes estándar
export const height = {
  auto: 'auto',
  full: '100%',
  screen: '100vh',
  
  // Componentes específicos
  'button-sm': '32px',    // 2rem
  'button-md': '40px',    // 2.5rem  
  'button-lg': '48px',    // 3rem
  
  'input-sm': '32px',     // 2rem
  'input-md': '40px',     // 2.5rem
  'input-lg': '48px',     // 3rem
  
  'header': '64px',       // 4rem
  'toolbar': '48px',      // 3rem
  'footer': '64px',       // 4rem
  
  // Áreas de contenido
  'content-min': '400px', // 25rem - Mínimo para formularios
  'content-ideal': '600px', // 37.5rem - Ideal para lectura
  'content-max': '800px',  // 50rem - Máximo antes de scroll
} as const;

// Anchos de sidebar y navegación
export const width = {
  auto: 'auto',
  full: '100%',
  
  // Sidebar y navegación
  'sidebar-collapsed': '64px',  // 4rem
  'sidebar-normal': '256px',    // 16rem
  'sidebar-wide': '320px',      // 20rem
  
  // Paneles laterales
  'panel-sm': '240px',    // 15rem
  'panel-md': '320px',    // 20rem
  'panel-lg': '480px',    // 30rem
  'panel-xl': '640px',    // 40rem
  
  // Formularios y contenido
  'form-sm': '320px',     // 20rem
  'form-md': '480px',     // 30rem
  'form-lg': '640px',     // 40rem
  'form-xl': '768px',     // 48rem
} as const;

// Tamaños de iconos
export const iconSize = {
  xs: '12px',   // 0.75rem
  sm: '16px',   // 1rem
  base: '20px', // 1.25rem
  md: '20px',   // 1.25rem (alias)
  lg: '24px',   // 1.5rem
  xl: '32px',   // 2rem
  '2xl': '40px', // 2.5rem
  '3xl': '48px', // 3rem
} as const;

// Type definitions
export type BreakpointToken = keyof typeof breakpoints;
export type MaxWidthToken = keyof typeof maxWidth;
export type HeightToken = keyof typeof height;
export type WidthToken = keyof typeof width;
export type IconSizeToken = keyof typeof iconSize;