import { Component, signal, inject, computed, ElementRef, viewChild, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommercialPresenceService, ConnectionStatus } from '@guiders-frontend/commercial-presence';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Opción de estado con metadata visual
 */
interface StatusOption {
  value: ConnectionStatus;
  label: string;
  icon: string;
  description: string;
  color: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
}

/**
 * StatusSelector Component
 *
 * Componente para que los comerciales cambien manualmente su estado de presencia.
 * Muestra un dropdown con las opciones disponibles y el estado actual.
 *
 * @example
 * ```html
 * <guiders-status-selector />
 * ```
 */
@Component({
  selector: 'guiders-status-selector',
  imports: [CommonModule],
  templateUrl: './status-selector.html',
  styleUrl: './status-selector.scss',
})
export class StatusSelector {
  private readonly presenceService = inject(CommercialPresenceService);
  private readonly destroyRef = inject(DestroyRef);

  // Referencias a elementos del DOM
  private readonly triggerElement = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  // Estado del componente
  readonly isDropdownOpen = signal<boolean>(false);
  readonly currentStatus = signal<ConnectionStatus>('offline');
  readonly isUpdating = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Posición del dropdown (para posicionamiento absoluto)
  readonly dropdownPosition = signal<{ top: number; left: number } | null>(null);

  // Opciones de estado disponibles
  readonly statusOptions: StatusOption[] = [
    {
      value: 'online',
      label: 'Conectado',
      icon: '🟢',
      description: 'Disponible para atender chats',
      color: 'success'
    },
    {
      value: 'away',
      label: 'Ausente',
      icon: '🟡',
      description: 'Ausente temporalmente',
      color: 'warning'
    },
    {
      value: 'busy',
      label: 'Ocupado',
      icon: '🔴',
      description: 'No disponible para nuevos chats',
      color: 'danger'
    },
    {
      value: 'chatting',
      label: 'En conversación',
      icon: '💬',
      description: 'Atendiendo chats activos',
      color: 'info'
    },
    {
      value: 'offline',
      label: 'Desconectado',
      icon: '⚫',
      description: 'No conectado',
      color: 'neutral'
    }
  ];

  // Computed: opción actual seleccionada
  readonly currentOption = computed(() => {
    const status = this.currentStatus();
    return this.statusOptions.find(opt => opt.value === status) || this.statusOptions[4]; // default offline
  });

  constructor() {
    // Suscribirse al estado de conexión del servicio
    this.presenceService.connectionStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        this.currentStatus.set(status);
      });
  }

  /**
   * Toggle del dropdown
   */
  toggleDropdown(): void {
    if (this.isDropdownOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Abrir dropdown y calcular posición
   */
  openDropdown(): void {
    const trigger = this.triggerElement()?.nativeElement;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();

    this.dropdownPosition.set({
      top: rect.bottom + 8, // 8px gap
      left: rect.left
    });

    this.isDropdownOpen.set(true);
    this.error.set(null);
  }

  /**
   * Cerrar dropdown
   */
  closeDropdown(): void {
    this.isDropdownOpen.set(false);
    this.dropdownPosition.set(null);
  }

  /**
   * Seleccionar un nuevo estado
   */
  selectStatus(status: ConnectionStatus): void {
    // No hacer nada si ya es el estado actual
    if (status === this.currentStatus()) {
      this.closeDropdown();
      return;
    }

    this.isUpdating.set(true);
    this.error.set(null);

    console.log(`[StatusSelector] 🔄 Cambiando estado a: ${status}`);

    this.presenceService.updateStatus(status).subscribe({
      next: (commercial) => {
        console.log(`[StatusSelector] ✅ Estado actualizado a: ${commercial.connectionStatus}`);
        this.currentStatus.set(commercial.connectionStatus);
        this.isUpdating.set(false);
        this.closeDropdown();
      },
      error: (error) => {
        console.error('[StatusSelector] ❌ Error al actualizar estado:', error);
        this.error.set(error.message || 'Error al actualizar estado');
        this.isUpdating.set(false);
      }
    });
  }

  /**
   * Obtener la clase CSS para el color del estado
   */
  getStatusColorClass(color: string): string {
    return `status-selector__option--${color}`;
  }
}
