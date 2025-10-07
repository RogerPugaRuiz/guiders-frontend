import { InjectionToken } from '@angular/core';

// Definir el tipo para import.meta.env de Vite
interface ViteImportMetaEnv {
  VITE_USE_MOCK_DATA?: string;
}

interface ViteImportMeta {
  env: ViteImportMetaEnv;
}

/**
 * Token de inyección para indicar si la aplicación debe usar datos mock.
 * Este token se configura mediante variables de entorno en tiempo de build.
 * 
 * @example
 * ```typescript
 * // Para inyectar el valor
 * const useMockData = inject(USE_MOCK_DATA);
 * ```
 */
export const USE_MOCK_DATA = new InjectionToken<boolean>('use.mock.data', {
  providedIn: 'root',
  factory: () => {
    // Lee la variable de entorno en tiempo de build
    // Vite expone las variables con el prefijo VITE_
    return typeof import.meta !== 'undefined' && 
           (import.meta as unknown as ViteImportMeta).env?.VITE_USE_MOCK_DATA === 'true';
  }
});
