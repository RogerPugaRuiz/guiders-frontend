import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SaveFilterData {
  name: string;
  description?: string;
}

@Component({
  selector: 'guiders-save-filter-dialog',
  imports: [FormsModule],
  templateUrl: './save-filter-dialog.html',
  styleUrl: './save-filter-dialog.scss',
})
export class SaveFilterDialog {
  /** Si el diálogo está abierto */
  isOpen = input<boolean>(false);

  /** Número actual de filtros guardados */
  currentFilterCount = input<number>(0);

  /** Límite máximo de filtros */
  maxFilters = input<number>(20);

  /** Emite cuando se confirma el guardado */
  saveFilter = output<SaveFilterData>();

  /** Emite cuando se cancela */
  cancelDialog = output<void>();

  // Estado del formulario
  name = signal<string>('');
  description = signal<string>('');

  get isLimitReached(): boolean {
    return this.currentFilterCount() >= this.maxFilters();
  }

  get isValid(): boolean {
    return this.name().trim().length > 0 && !this.isLimitReached;
  }

  onSave(): void {
    if (!this.isValid) return;

    this.saveFilter.emit({
      name: this.name().trim(),
      description: this.description().trim() || undefined
    });

    this.resetForm();
  }

  onCancel(): void {
    this.cancelDialog.emit();
    this.resetForm();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('save-filter-dialog__backdrop')) {
      this.onCancel();
    }
  }

  private resetForm(): void {
    this.name.set('');
    this.description.set('');
  }
}
