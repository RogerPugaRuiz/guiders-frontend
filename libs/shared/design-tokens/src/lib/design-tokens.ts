/**
 * Design Tokens - Aggregated Export
 * Basado en la guía de diseño B2B Web Desktop
 * 
 * Este archivo consolida todos los tokens de diseño para fácil importación
 */

import * as colors from './tokens/colors';
import * as typography from './tokens/typography';
import * as spacing from './tokens/spacing';
import * as elevation from './tokens/elevation';
import * as motion from './tokens/motion';
import * as sizing from './tokens/sizing';

// Objeto principal que contiene todos los tokens
export const tokens = {
  colors,
  typography,
  spacing,
  elevation,
  motion,
  sizing,
} as const;

// Type definitions para el objeto completo
export type DesignTokens = typeof tokens;

// CSS Custom Properties generator para uso en SCSS
export const generateCSSVariables = (mode: 'light' | 'dark' = 'light') => {
  const colorTokens = mode === 'light' ? colors.lightModeColors : colors.darkModeColors;
  
  const cssVars: Record<string, string> = {};
  
  // Colores semánticos
  Object.entries(colorTokens).forEach(([key, value]) => {
    cssVars[`--color-${key}`] = value;
  });
  
  // Espaciado
  Object.entries(spacing.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });
  
  // Tipografía - tamaños
  Object.entries(typography.fontSizes).forEach(([key, value]) => {
    cssVars[`--font-size-${key}`] = value;
  });
  
  // Tipografía - pesos
  Object.entries(typography.fontWeights).forEach(([key, value]) => {
    cssVars[`--font-weight-${key}`] = String(value);
  });
  
  // Border radius
  Object.entries(elevation.borderRadius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value;
  });
  
  // Sombras (usar modo apropiado)
  const shadowTokens = mode === 'light' ? elevation.boxShadow : elevation.boxShadowDark;
  Object.entries(shadowTokens).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });
  
  // Z-index
  Object.entries(motion.zIndex).forEach(([key, value]) => {
    cssVars[`--z-${key}`] = String(value);
  });
  
  // Duraciones de animación
  Object.entries(motion.duration).forEach(([key, value]) => {
    cssVars[`--duration-${key}`] = value;
  });
  
  return cssVars;
};