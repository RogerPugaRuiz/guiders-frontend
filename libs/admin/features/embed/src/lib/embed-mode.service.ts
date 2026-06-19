import { Injectable, inject, DOCUMENT } from '@angular/core';

/**
 * Servicio que detecta si la app está corriendo en modo embed (dentro de un iframe)
 * o en modo standalone (ventana normal).
 *
 * Story 3.2 — Epic 3: Cross-Frame Auth Handshake.
 *
 * Detección:
 * 1. Si `window.self !== window.top` → embed mode (estamos dentro de un iframe)
 * 2. Si URL tiene query param `?embed=true` → embed mode (opt-in for testing)
 * 3. Cualquier otro caso → standalone mode
 *
 * El valor se computa UNA VEZ al inicializar el servicio y se cachea
 * (cached field). No se recomputa en cada llamada.
 *
 * Spec: `_bmad-output/planning-artifacts/epics.md` Story 3.2
 *      + `_bmad-output/implementation-artifacts/3-2-...md`
 */
@Injectable({ providedIn: 'root' })
export class EmbedModeService {
  private readonly document = inject(DOCUMENT);

  /** Cached value (computed once at service init). */
  private readonly cachedEmbedMode: boolean;

  constructor() {
    this.cachedEmbedMode = this.detectEmbedMode();
  }

  /**
   * Returns true if the app is running in embed mode (inside an iframe).
   */
  isEmbed(): boolean {
    return this.cachedEmbedMode;
  }

  private detectEmbedMode(): boolean {
    const win = this.document?.defaultView;
    if (!win) return false;

    // AC1: window.self !== window.top → embed mode (iframe)
    if (win.self !== win.top) {
      return true;
    }

    // AC1: query param ?embed=true → embed mode (testing opt-in)
    const params = new URLSearchParams(win.location.search);
    return params.get('embed') === 'true';
  }
}