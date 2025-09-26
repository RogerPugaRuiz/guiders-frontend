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

export type CheckboxSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'guiders-checkbox',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Checkbox),
      multi: true,
    },
  ],
})
export class Checkbox implements ControlValueAccessor {
  // === INPUTS ===
  readonly id = input<string>('');
  readonly name = input<string>('');
  readonly label = input<string>('');
  readonly helperText = input<string>('');
  readonly errorMessage = input<string>('');
  readonly size = input<CheckboxSize>('medium');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly indeterminate = input<boolean>(false);
  readonly ariaLabel = input<string>('');
  readonly ariaLabelledBy = input<string>('');
  readonly ariaDescribedBy = input<string>('');

  // === OUTPUTS ===
  readonly checkedChange = output<boolean>();

  // === STATE ===
  private readonly _checked = signal<boolean>(false);
  private readonly _focused = signal<boolean>(false);
  private readonly _touched = signal<boolean>(false);

  // === VIEW CHILDREN ===
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('input');

  // === COMPUTED VALUES ===
  readonly checked = this._checked.asReadonly();
  readonly focused = this._focused.asReadonly();
  readonly touched = this._touched.asReadonly();

  readonly hasError = computed(() => {
    return !!this.errorMessage() && this.touched();
  });

  readonly effectiveId = computed(() => {
    return this.id() || `guiders-checkbox-${Math.random().toString(36).substring(2, 9)}`;
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
      'guiders-checkbox': true,
      [`guiders-checkbox--${this.size()}`]: true,
      'guiders-checkbox--disabled': this.disabled(),
      'guiders-checkbox--focused': this.focused(),
      'guiders-checkbox--error': this.hasError(),
      'guiders-checkbox--checked': this.checked(),
      'guiders-checkbox--indeterminate': this.indeterminate(),
    };
  });

  // === CONTROL VALUE ACCESSOR ===
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  private onChange = (value: boolean) => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched = () => {};

  writeValue(value: boolean): void {
    this._checked.set(!!value);
    this.updateIndeterminate();
  }

  registerOnChange(fn: (value: boolean) => void): void {
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
    const newValue = target.checked;
    
    this._checked.set(newValue);
    this.checkedChange.emit(newValue);
    this.onChange(newValue);
    this.updateIndeterminate();
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
    if (event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }

  // === PUBLIC METHODS ===
  toggle(): void {
    if (this.disabled()) return;

    const newValue = !this.checked();
    this._checked.set(newValue);
    this.checkedChange.emit(newValue);
    this.onChange(newValue);
    this.updateIndeterminate();
  }

  focus(): void {
    this.inputElement()?.nativeElement.focus();
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }

  // === PRIVATE METHODS ===
  private updateIndeterminate(): void {
    const input = this.inputElement()?.nativeElement;
    if (input) {
      input.indeterminate = this.indeterminate();
    }
  }
}
