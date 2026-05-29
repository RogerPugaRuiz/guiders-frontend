import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PresenceStatus } from '@guiders-frontend/shared/types';

/**
 * Componente Badge para mostrar estado de presencia
 *
 * Features:
 * - Dot circular con colores por estado
 * - Soporte para todos los estados: online, offline, away, busy, chatting
 * - Tamaños: small, medium, large
 * - Accesibilidad con aria-label
 * - Estilos basados en design tokens
 *
 * Estados y colores:
 * - online: verde (disponible)
 * - offline: gris (desconectado)
 * - away: amarillo (inactivo)
 * - busy: rojo (ocupado, solo comerciales)
 * - chatting: azul (conversando, solo visitantes)
 *
 * @example
 * ```html
 * <lib-presence-badge [status]="'online'" [size]="'medium'" />
 * <lib-presence-badge [status]="'away'" />
 * <lib-presence-badge [status]="'offline'" [size]="'small'" />
 * ```
 */
@Component({
  selector: 'lib-presence-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presence-badge.component.html',
  styleUrl: './presence-badge.component.scss',
})
export class PresenceBadge {
  // ===== INPUTS =====

  /**
   * Estado de presencia del usuario
   */
  readonly status = input.required<PresenceStatus>();

  /**
   * Tamaño del badge: 'sm' | 'md' | 'lg'
   */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /**
   * Mostrar texto descriptivo junto al dot
   */
  readonly showLabel = input<boolean>(false);

  /**
   * Animación de pulse para estado online
   */
  readonly pulse = input<boolean>(false);

  // ===== COMPUTED VALUES =====

  /**
   * Clases CSS dinámicas para el badge
   */
  readonly badgeClasses = computed(() => {
    return {
      'presence-badge': true,
      [`presence-badge--${this.status()}`]: true,
      [`presence-badge--${this.size()}`]: true,
      'presence-badge--pulse': this.pulse() && this.status() === 'online',
    };
  });

  /**
   * Texto descriptivo del estado (español)
   */
  readonly statusLabel = computed(() => {
    const status = this.status();
    const labels: Record<PresenceStatus, string> = {
      online: 'En línea',
      offline: 'Desconectado',
      away: 'Ausente',
      busy: 'Ocupado',
      chatting: 'Conversando',
    };
    return labels[status];
  });

  /**
   * Texto para aria-label (accesibilidad)
   */
  readonly ariaLabel = computed(() => {
    return `Estado: ${this.statusLabel()}`;
  });

  /**
   * Icono emoji opcional para cada estado
   */
  readonly statusEmoji = computed(() => {
    const status = this.status();
    const emojis: Record<PresenceStatus, string> = {
      online: '🟢',
      offline: '⚫',
      away: '🟡',
      busy: '🔴',
      chatting: '🔵',
    };
    return emojis[status];
  });
}
