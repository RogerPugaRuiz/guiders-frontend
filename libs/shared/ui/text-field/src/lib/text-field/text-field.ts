import { Component, computed, input, output, signal, ChangeDetectionStrategy, ElementRef, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type TextFieldType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
export type TextFieldSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'guiders-text-field',
  imports: [CommonModule, FormsModule],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextField {
  // Referencias a elementos del DOM
  private readonly inputElement = viewChild.required<ElementRef<HTMLInputElement>>('input');

  // Inputs usando signals API
  readonly label = input<string>();
  readonly placeholder = input<string>('');
  readonly helperText = input<string>();
  readonly errorMessage = input<string>();
  readonly type = input<TextFieldType>('text');
  readonly size = input<TextFieldSize>('medium');
  readonly value = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly maxLength = input<number>();
  readonly minLength = input<number>();
  readonly pattern = input<string>();
  readonly autocomplete = input<string>();
  readonly ariaLabel = input<string>();
  readonly ariaDescribedBy = input<string>();

  // Outputs usando signals API
  readonly valueChange = output<string>();
  readonly inputFocus = output<FocusEvent>();
  readonly inputBlur = output<FocusEvent>();
  readonly inputKeydown = output<KeyboardEvent>();

  // Estado interno
  readonly isFocused = signal<boolean>(false);
  readonly internalValue = signal<string>('');

  // IDs únicos para accesibilidad
  private readonly uniqueId = Math.random().toString(36).substring(2, 9);
  readonly inputId = `guiders-text-field-${this.uniqueId}`;
  readonly helperId = `guiders-text-field-helper-${this.uniqueId}`;
  readonly errorId = `guiders-text-field-error-${this.uniqueId}`;

  // Computed values
  readonly hasError = computed(() => Boolean(this.errorMessage()));
  readonly hasHelperText = computed(() => Boolean(this.helperText()));
  readonly showPasswordToggle = computed(() => this.type() === 'password');

  readonly fieldClasses = computed(() => ({
    'guiders-text-field': true,
    [`guiders-text-field--${this.size()}`]: true,
    'guiders-text-field--focused': this.isFocused(),
    'guiders-text-field--disabled': this.disabled(),
    'guiders-text-field--readonly': this.readonly(),
    'guiders-text-field--error': this.hasError(),
    'guiders-text-field--required': this.required(),
  }));

  readonly inputClasses = computed(() => ({
    'guiders-text-field__input': true,
    'guiders-text-field__input--has-error': this.hasError(),
  }));

  readonly describedByIds = computed(() => {
    const ids: string[] = [];
    if (this.hasHelperText()) ids.push(this.helperId);
    if (this.hasError()) ids.push(this.errorId);
    const ariaDescribedBy = this.ariaDescribedBy();
    if (ariaDescribedBy) ids.push(ariaDescribedBy);
    return ids.join(' ') || undefined;
  });

  // Effect para sincronizar valor inicial
  constructor() {
    effect(() => {
      this.internalValue.set(this.value());
    });
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    this.internalValue.set(newValue);
    this.valueChange.emit(newValue);
  }

  onInputFocus(event: FocusEvent): void {
    this.isFocused.set(true);
    this.inputFocus.emit(event);
  }

  onInputBlur(event: FocusEvent): void {
    this.isFocused.set(false);
    this.inputBlur.emit(event);
  }

  onInputKeydown(event: KeyboardEvent): void {
    this.inputKeydown.emit(event);
  }

  // Métodos públicos para control programático
  focus(): void {
    this.inputElement().nativeElement.focus();
  }

  blur(): void {
    this.inputElement().nativeElement.blur();
  }

  select(): void {
    this.inputElement().nativeElement.select();
  }

  clear(): void {
    this.internalValue.set('');
    this.valueChange.emit('');
    this.inputElement().nativeElement.value = '';
  }
}
