import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente Badge para mostrar contador de mensajes no leídos
 *
 * Features:
 * - Muestra contador solo si hay mensajes no leídos
 * - Formato "99+" para números > 99
 * - Animación de pulse para llamar la atención
 * - Accesibilidad con aria-label y aria-live
 * - Estilos basados en design tokens
 *
 * @example
 * ```html
 * <lib-unread-badge [count]="5" />
 * <lib-unread-badge [count]="150" /> <!-- Muestra "99+" -->
 * <lib-unread-badge [count]="0" />  <!-- No muestra nada -->
 * ```
 */
@Component({
  selector: 'lib-unread-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unread-badge.html',
  styleUrl: './unread-badge.scss',
})
export class UnreadBadge {
  // ===== INPUTS =====

  /**
   * Número de mensajes no leídos
   */
  readonly count = input<number>(0);

  /**
   * Tamaño del badge: 'small' | 'medium' | 'large'
   */
  readonly size = input<'small' | 'medium' | 'large'>('medium');

  /**
   * Color del badge: 'primary' | 'danger' | 'warning' | 'success'
   */
  readonly variant = input<'primary' | 'danger' | 'warning' | 'success'>('danger');

  /**
   * Desactivar animación de pulse
   */
  readonly noPulse = input<boolean>(false);

  // ===== COMPUTED VALUES =====

  /**
   * Determina si debe mostrar el badge (count > 0)
   */
  readonly shouldShow = computed(() => this.count() > 0);

  /**
   * Texto a mostrar en el badge
   * Si count > 99, muestra "99+"
   * Si count <= 99, muestra el número
   */
  readonly displayText = computed(() => {
    const count = this.count();
    return count > 99 ? '99+' : count.toString();
  });

  /**
   * Clases CSS dinámicas para el badge
   */
  readonly badgeClasses = computed(() => {
    return {
      'unread-badge': true,
      [`unread-badge--${this.size()}`]: true,
      [`unread-badge--${this.variant()}`]: true,
      'unread-badge--pulse': !this.noPulse() && this.count() > 0,
    };
  });

  /**
   * Texto para aria-label (accesibilidad)
   */
  readonly ariaLabel = computed(() => {
    const count = this.count();
    if (count === 0) return '';
    if (count === 1) return '1 mensaje no leído';
    if (count > 99) return 'Más de 99 mensajes no leídos';
    return `${count} mensajes no leídos`;
  });
}
