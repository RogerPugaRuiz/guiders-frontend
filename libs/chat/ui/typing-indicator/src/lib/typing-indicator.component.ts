import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente Typing Indicator
 *
 * Muestra un indicador animado cuando un usuario está escribiendo,
 * diseñado como una burbuja de mensaje temporal en la lista de mensajes.
 *
 * Features:
 * - Burbuja de mensaje con animación de puntos
 * - Muestra nombre del usuario escribiendo
 * - Diferenciación por tipo de usuario (commercial/visitor)
 * - Animación CSS pulsante
 * - Estilos basados en design tokens
 *
 * @example
 * ```html
 * <guiders-typing-indicator
 *   [userName]="'Juan Pérez'"
 *   [userType]="'commercial'"
 * />
 * ```
 */
@Component({
  selector: 'guiders-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typing-indicator.component.html',
  styleUrl: './typing-indicator.component.scss',
})
export class TypingIndicator {
  // ===== INPUTS =====

  /**
   * Nombre del usuario escribiendo
   */
  readonly userName = input<string>('Usuario');

  /**
   * Tipo de usuario: 'commercial' | 'visitor'
   */
  readonly userType = input<'commercial' | 'visitor'>('visitor');

  /**
   * Mostrar nombre del usuario
   */
  readonly showName = input<boolean>(true);

  /**
   * Variante de estilo: 'bubble' (burbuja) | 'inline' (texto simple)
   */
  readonly variant = input<'bubble' | 'inline'>('bubble');

  // ===== COMPUTED VALUES =====

  /**
   * Clases CSS dinámicas para el indicador
   */
  readonly indicatorClasses = computed(() => {
    return {
      'typing-indicator': true,
      [`typing-indicator--${this.variant()}`]: true,
      [`typing-indicator--${this.userType()}`]: true,
    };
  });

  /**
   * Texto a mostrar
   */
  readonly displayText = computed(() => {
    const name = this.userName();
    return this.showName() ? `${name} está escribiendo` : 'Escribiendo';
  });

  /**
   * Aria label para accesibilidad
   */
  readonly ariaLabel = computed(() => {
    return `${this.userName()} está escribiendo un mensaje`;
  });
}
