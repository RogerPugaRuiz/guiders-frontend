/**
 * Design Tokens - SCSS Variables Export
 * 
 * Este paquete proporciona variables SCSS para el sistema de design tokens.
 * Los tokens están disponibles para importación usando @use:
 * 
 * @example
 * @use '@guiders-frontend/shared/design-tokens/tokens-vars' as tokens;
 * 
 * background: tokens.$color-primary-500;
 * padding: tokens.$spacing-md;
 */

// El archivo principal de tokens SCSS está disponible en:
// libs/shared/design-tokens/src/lib/tokens-vars.scss
//
// Se puede importar usando la ruta:
// '@guiders-frontend/shared/design-tokens/src/lib/tokens-vars'

/**
 * Path to the compiled SCSS tokens entrypoint.
 * Exported so the package has a valid TypeScript entry symbol for ng-packagr.
 */
export const DESIGN_TOKENS_SCSS_ENTRY =
  '@guiders-frontend/shared/design-tokens/src/lib/tokens-vars';
