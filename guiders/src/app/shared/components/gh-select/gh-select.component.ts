import { Component, ElementRef, EventEmitter, HostListener, Input, Output, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface GhSelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'gh-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gh-select.component.html',
  styleUrls: ['./gh-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GhSelectComponent),
      multi: true
    }
  ]
})
export class GhSelectComponent implements OnInit, ControlValueAccessor {
  @Input() options: GhSelectOption[] = [];
  @Input() placeholder: string = 'Seleccionar';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Output() selectionChange = new EventEmitter<any>();

  isOpen = false;
  selectedOption: GhSelectOption | null = null;
  disabled = false;

  // Para ControlValueAccessor
  private onChange: any = () => {};
  private onTouched: any = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Seleccionar la primera opción por defecto si no hay seleccionada
    if (!this.selectedOption && this.options.length > 0) {
      this.selectedOption = this.options[0];
      this.onChange(this.selectedOption.value);
    }
  }

  toggleDropdown() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    
    // Agregamos la clase "active" cuando está abierto
    const controlElement = this.elementRef.nativeElement.querySelector('.gh-select__control');
    if (controlElement) {
      if (this.isOpen) {
        controlElement.classList.add('active');
      } else {
        controlElement.classList.remove('active');
      }
    }
  }

  selectOption(option: GhSelectOption) {
    this.selectedOption = option;
    this.isOpen = false;
    this.selectionChange.emit(option.value);
    this.onChange(option.value);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  // Implementación de ControlValueAccessor
  writeValue(value: any): void {
    if (value === null || value === undefined) {
      this.selectedOption = null;
      return;
    }
    
    const foundOption = this.options.find(option => option.value === value);
    if (foundOption) {
      this.selectedOption = foundOption;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
