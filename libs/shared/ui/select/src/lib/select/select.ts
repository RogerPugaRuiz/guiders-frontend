import { Component, computed, input, output, signal, ChangeDetectionStrategy, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export type SelectSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'guiders-select',
  imports: [CommonModule, FormsModule],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Select {
  // Referencias a elementos del DOM
  private readonly selectElement = viewChild.required<ElementRef<HTMLSelectElement>>('select');

  // Inputs usando signals API
  readonly label = input<string>();
  readonly placeholder = input<string>('Selecciona una opción');
  readonly helperText = input<string>();
  readonly errorMessage = input<string>();
  readonly options = input.required<SelectOption[]>();
  readonly size = input<SelectSize>('medium');
  readonly value = input<string | number>();
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly multiple = input<boolean>(false);
  readonly ariaLabel = input<string>();
  readonly ariaDescribedBy = input<string>();

  // Outputs usando signals API
  readonly valueChange = output<string | number | (string | number)[]>();
  readonly selectionChange = output<SelectOption | SelectOption[]>();
  readonly selectFocus = output<FocusEvent>();
  readonly selectBlur = output<FocusEvent>();

  // Estado interno
  readonly isFocused = signal<boolean>(false);
  readonly isOpen = signal<boolean>(false);

  // IDs únicos para accesibilidad
  private readonly uniqueId = Math.random().toString(36).substring(2, 9);
  readonly selectId = `guiders-select-${this.uniqueId}`;
  readonly helperId = `guiders-select-helper-${this.uniqueId}`;
  readonly errorId = `guiders-select-error-${this.uniqueId}`;

  // Computed values
  readonly hasError = computed(() => Boolean(this.errorMessage()));
  readonly hasHelperText = computed(() => Boolean(this.helperText()));
  readonly hasPlaceholder = computed(() => Boolean(this.placeholder()) && !this.value());

  readonly fieldClasses = computed(() => ({
    'guiders-select': true,
    [`guiders-select--${this.size()}`]: true,
    'guiders-select--focused': this.isFocused(),
    'guiders-select--disabled': this.disabled(),
    'guiders-select--error': this.hasError(),
    'guiders-select--required': this.required(),
    'guiders-select--multiple': this.multiple(),
  }));

  readonly selectClasses = computed(() => ({
    'guiders-select__control': true,
    'guiders-select__control--has-error': this.hasError(),
    'guiders-select__control--placeholder': this.hasPlaceholder(),
  }));

  readonly describedByIds = computed(() => {
    const ids: string[] = [];
    if (this.hasHelperText()) ids.push(this.helperId);
    if (this.hasError()) ids.push(this.errorId);
    const ariaDescribedBy = this.ariaDescribedBy();
    if (ariaDescribedBy) ids.push(ariaDescribedBy);
    return ids.join(' ') || undefined;
  });

  // Agrupar opciones por grupo
  readonly groupedOptions = computed(() => {
    const options = this.options();
    const groups: Record<string, SelectOption[]> = {};
    const ungrouped: SelectOption[] = [];

    options.forEach(option => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = [];
        }
        groups[option.group].push(option);
      } else {
        ungrouped.push(option);
      }
    });

    return { groups, ungrouped };
  });

  onSelectionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(target.selectedOptions);
    
    if (this.multiple()) {
      const values = selectedOptions.map(option => {
        const numericValue = Number(option.value);
        return isNaN(numericValue) ? option.value : numericValue;
      });
      
      const selectedOptionObjects = selectedOptions
        .map(option => this.options().find(opt => String(opt.value) === option.value))
        .filter((option): option is SelectOption => option !== undefined);
      
      this.valueChange.emit(values);
      this.selectionChange.emit(selectedOptionObjects);
    } else {
      const value = target.value;
      const numericValue = Number(value);
      const finalValue = isNaN(numericValue) ? value : numericValue;
      
      const selectedOption = this.options().find(opt => String(opt.value) === value);
      
      this.valueChange.emit(finalValue);
      if (selectedOption) {
        this.selectionChange.emit(selectedOption);
      }
    }
  }

  onSelectFocus(event: FocusEvent): void {
    this.isFocused.set(true);
    this.selectFocus.emit(event);
  }

  onSelectBlur(event: FocusEvent): void {
    this.isFocused.set(false);
    this.selectBlur.emit(event);
  }

  // Métodos públicos para control programático
  focus(): void {
    this.selectElement().nativeElement.focus();
  }

  blur(): void {
    this.selectElement().nativeElement.blur();
  }

  clear(): void {
    const selectEl = this.selectElement().nativeElement;
    selectEl.selectedIndex = this.hasPlaceholder() ? 0 : -1;
    
    if (this.multiple()) {
      this.valueChange.emit([]);
      this.selectionChange.emit([]);
    } else {
      this.valueChange.emit('');
      this.selectionChange.emit(undefined as unknown as SelectOption);
    }
  }
}
