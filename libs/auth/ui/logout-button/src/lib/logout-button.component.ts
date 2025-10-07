/**
 * Guiders Logout Button Component
 * Basado en la guía de diseño B2B Web Desktop
 * Cumple WCAG 2.2 AA
 */

import { 
  ChangeDetectionStrategy, 
  Component, 
  input, 
  output, 
  signal,
  computed
} from '@angular/core';
import { Button } from '@guiders-frontend/button';

@Component({
  selector: 'guiders-logout-button',
  imports: [Button],
  templateUrl: './logout-button.component.html',
  styleUrl: './logout-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutButtonComponent {
  // === INPUTS ===
  readonly variant = input<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'>('outline');
  readonly size = input<'small' | 'medium' | 'large'>('medium');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly showIcon = input<boolean>(true);
  readonly showText = input<boolean>(true);
  readonly confirmLogout = input<boolean>(true);

  // === OUTPUTS ===
  readonly logoutClick = output<void>();
  readonly confirmCancel = output<void>();

  // === STATE ===
  private readonly _showConfirmDialog = signal<boolean>(false);

  // === COMPUTED VALUES ===
  readonly showConfirmDialog = this._showConfirmDialog.asReadonly();

  readonly buttonText = computed(() => {
    if (this.loading()) return 'Cerrando sesión...';
    return 'Cerrar sesión';
  });

  readonly buttonVariant = computed(() => {
    return this.variant() === 'danger' ? 'danger' : this.variant();
  });

  // === EVENT HANDLERS ===
  onButtonClick(): void {
    if (this.disabled() || this.loading()) return;

    if (this.confirmLogout()) {
      this._showConfirmDialog.set(true);
    } else {
      this.performLogout();
    }
  }

  onConfirmLogout(): void {
    this._showConfirmDialog.set(false);
    this.performLogout();
  }

  onCancelLogout(): void {
    this._showConfirmDialog.set(false);
    this.confirmCancel.emit();
  }

  private performLogout(): void {
    this.logoutClick.emit();
  }
}
