import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
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
   */
  private generateColorFromId(id: string): string {
    // Paleta de colores vibrantes y distinguibles
    const colors = [
      '#FF6B6B', // Rojo coral
      '#4ECDC4', // Turquesa
      '#45B7D1', // Azul cielo
      '#FFA07A', // Salmón
      '#98D8C8', // Verde menta
      '#F7DC6F', // Amarillo
      '#BB8FCE', // Púrpura
      '#85C1E2', // Azul claro
      '#F8B739', // Naranja
      '#52C997', // Verde esmeralda
      '#FF8B94', // Rosa coral
      '#6C5CE7', // Índigo
      '#00B894', // Verde mar
      '#FDCB6E', // Amarillo mostaza
      '#E17055', // Terracota
      '#74B9FF', // Azul francia
    ];

    // Generar hash del ID para obtener índice consistente
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
