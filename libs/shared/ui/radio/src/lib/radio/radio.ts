import { 
  Component, 
  computed, 
  input, 
  output, 
  signal, 
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type RadioSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'guiders-radio',
  imports: [CommonModule, FormsModule],
  templateUrl: './radio.html',
  styleUrl: './radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Radio),
      multi: true,
    },
  ],
})
export class Radio implements ControlValueAccessor {
  // === INPUTS ===
  readonly id = input<string>('');
  readonly name = input<string>('');
  readonly value = input<string | number>('');
  readonly label = input<string>('');
  readonly helperText = input<string>('');
  readonly errorMessage = input<string>('');
  readonly size = input<RadioSize>('medium');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly ariaLabel = input<string>('');
  readonly ariaLabelledBy = input<string>('');
  readonly ariaDescribedBy = input<string>('');

  // === OUTPUTS ===
  readonly selectedChange = output<string | number>();

  // === STATE ===
  private readonly _selected = signal<string | number | null>(null);
  private readonly _focused = signal<boolean>(false);
  private readonly _touched = signal<boolean>(false);

  // === VIEW CHILDREN ===
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('input');

  // === COMPUTED VALUES ===
  readonly selected = this._selected.asReadonly();
  readonly focused = this._focused.asReadonly();
  readonly touched = this._touched.asReadonly();

  readonly isChecked = computed(() => {
    return this.selected() === this.value();
  });

  readonly hasError = computed(() => {
    return !!this.errorMessage() && this.touched();
  });

  readonly effectiveId = computed(() => {
    return this.id() || `guiders-radio-${Math.random().toString(36).substring(2, 9)}`;
  });

  readonly helperId = computed(() => {
    return this.helperText() ? `${this.effectiveId()}-helper` : undefined;
  });

  readonly errorId = computed(() => {
    return this.hasError() ? `${this.effectiveId()}-error` : undefined;
  });

  readonly effectiveAriaDescribedBy = computed(() => {
    const describedBy = this.ariaDescribedBy();
    const helperId = this.helperId();
    const errorId = this.errorId();
    
    return [describedBy, helperId, errorId].filter(Boolean).join(' ') || undefined;
  });

  readonly cssClasses = computed(() => {
    return {
      'guiders-radio': true,
      [`guiders-radio--${this.size()}`]: true,
      'guiders-radio--disabled': this.disabled(),
      'guiders-radio--focused': this.focused(),
      'guiders-radio--error': this.hasError(),
      'guiders-radio--checked': this.isChecked(),
    };
  });

  // === CONTROL VALUE ACCESSOR ===
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  private onChange = (value: string | number) => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched = () => {};

  writeValue(value: string | number | null): void {
    this._selected.set(value);
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setDisabledState(isDisabled: boolean): void {
    // El estado disabled se maneja via input()
  }

  // === EVENT HANDLERS ===
  onInputChange(event: Event): void {
    if (this.disabled()) return;

    const target = event.target as HTMLInputElement;
    if (target.checked) {
      const newValue = this.value();
      this._selected.set(newValue);
      this.selectedChange.emit(newValue);
      this.onChange(newValue);
    }
  }

  onInputFocus(): void {
    this._focused.set(true);
  }

  onInputBlur(): void {
    this._focused.set(false);
    this._touched.set(true);
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent): void {
    // Permitir navegación por teclado
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.select();
    }
  }

  // === PUBLIC METHODS ===
  select(): void {
    if (this.disabled()) return;

    const newValue = this.value();
    this._selected.set(newValue);
    this.selectedChange.emit(newValue);
    this.onChange(newValue);
  }

  focus(): void {
    this.inputElement()?.nativeElement.focus();
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }
}
