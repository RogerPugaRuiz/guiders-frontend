/**
 * Theme type re-exports for the white-label iframe ThemeService.
 *
 * These types are owned by `@guiders-frontend/shared/types/iframe` (story 8.2).
 * We re-export from there so the ThemeService and its utils share a single
 * source of truth with the IframeInitService (story 8-5) and the
 * IframeShell (story 8-9). If the types change, only story 8-2 needs to be
 * updated and every consumer recompiles against the new shape.
 *
 * This file is intentionally a pure re-export — no local type definitions.
 */
export type {
  ThemeConfig,
  ThemeColors,
  ThemeTypography,
  ThemeLogos,
  ThemeLogoAsset,
  SectionName,
} from '@guiders-frontend/shared/types/iframe';
