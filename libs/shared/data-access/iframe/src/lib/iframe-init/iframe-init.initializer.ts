import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IframeInitService } from './iframe-init.service';

export function initializeIframeInit() {
  const iframeInitService = inject(IframeInitService);

  return async () => {
    console.log('[AppInitializer] 🔧 Inicializando iframe...');
    try {
      const result = await firstValueFrom(iframeInitService.initialize());
      if (result.ok) {
        console.log('[AppInitializer] ✅ Iframe inicializado correctamente');
      } else {
        console.warn('[AppInitializer] ⚠️ Iframe init falló:', result.error.reason);
      }
    } catch (error) {
      console.error('[AppInitializer] ❌ Error al inicializar iframe:', error);
    }
  };
}