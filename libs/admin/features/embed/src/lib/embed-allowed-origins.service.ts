import { Injectable, signal, computed } from '@angular/core';

/**
 * Servicio singleton que mantiene la lista de origins permitidos para el
 * handshake postMessage (Story 3.1 — Epic 3).
 *
 * Por defecto, la lista está vacía (todos los origins rechazados).
 * En producción, Story 4.x carga los origins desde `white_label_configs.embedAllowedOrigins`.
 * Para tests/dev, se puede setAllowed() manualmente.
 *
 * La validación es **estricta**: comparación exacta case-sensitive.
 * NO acepta wildcards, regex, ni subdominios implícitos.
 */
@Injectable({ providedIn: 'root' })
export class EmbedAllowedOriginsService {
  private readonly allowedOriginsSignal = signal<string[]>([]);

  /** Lista actual de origins permitidos (readonly signal). */
  readonly allowedOrigins = this.allowedOriginsSignal.asReadonly();

  /** Set computado para lookup O(1). */
  private readonly allowedSet = computed(() => new Set(this.allowedOriginsSignal()));

  /**
   * Establece la lista de origins permitidos. Llamado por:
   * - Story 4.x: al cargar white-label config
   * - Story 3.1 (test/dev): manualmente con query param
   */
  setAllowed(origins: string[]): void {
    this.allowedOriginsSignal.set([...origins]);
  }

  /**
   * Verifica si un origin está permitido.
   *
   * @param origin - El origin a validar (e.g., 'https://leadcars.com')
   * @returns true si el origin está exactamente en la lista
   */
  isAllowed(origin: string | null | undefined): boolean {
    if (!origin || typeof origin !== 'string') return false;
    return this.allowedSet().has(origin);
  }
}