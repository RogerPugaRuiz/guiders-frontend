import {
  Component,
  computed,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PresenceStatus } from '@guiders-frontend/shared/types';

export type AvatarSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'guiders-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Avatar {
  // === INPUTS ===
  /**
   * Unique identifier for the user/visitor (used for color generation)
   */
  readonly userId = input.required<string>();

  /**
   * User/visitor name (used for initial generation)
   */
  readonly name = input<string | undefined>(undefined);

  /**
   * User/visitor email (used for initial generation if name is not available)
   */
  readonly email = input<string | undefined>(undefined);

  /**
   * Presence status (optional)
   */
  readonly presenceStatus = input<PresenceStatus | undefined>(undefined);

  /**
   * Avatar size
   */
  readonly size = input<AvatarSize>('medium');

  // === COMPUTED VALUES ===
  /**
   * Generate unique color based on user ID
   */
  readonly avatarColor = computed(() => {
    return this.generateColorFromId(this.userId());
  });

  /**
   * Get initial from name or email
   */
  readonly initial = computed(() => {
    const name = this.name();
    const email = this.email();

    if (name && name.trim()) {
      return name.trim().charAt(0).toUpperCase();
    }

    if (email && email.trim()) {
      return email.trim().charAt(0).toUpperCase();
    }

    return 'V';
  });

  /**
   * Show presence badge
   */
  readonly showPresenceBadge = computed(() => {
    return this.presenceStatus() !== undefined;
  });

  /**
   * CSS classes for avatar container
   */
  readonly avatarClasses = computed(() => ({
    'guiders-avatar': true,
    [`guiders-avatar--${this.size()}`]: true,
  }));

  // === PRIVATE METHODS ===
  /**
   * Generates a consistent color based on the hash of the ID
   * Uses a carefully curated palette optimized for:
   * - Good contrast with white text
   * - Visual distinction between colors
   * - Professional appearance in both light and dark modes
   */
  private generateColorFromId(id: string): string {
    // Paleta profesional con colores saturados pero elegantes
    // Todos los colores tienen buen contraste con texto blanco (WCAG AA)
    const colors = [
      '#6366f1', // Índigo vibrante
      '#8b5cf6', // Violeta
      '#a855f7', // Púrpura
      '#d946ef', // Fucsia
      '#ec4899', // Rosa
      '#f43f5e', // Rosa rojo
      '#ef4444', // Rojo
      '#f97316', // Naranja
      '#f59e0b', // Ámbar
      '#84cc16', // Lima
      '#22c55e', // Verde
      '#10b981', // Esmeralda
      '#14b8a6', // Teal
      '#06b6d4', // Cyan
      '#0ea5e9', // Azul cielo
      '#3b82f6', // Azul
    ];

    // Generar hash del ID para obtener índice consistente
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir a 32bit integer
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
