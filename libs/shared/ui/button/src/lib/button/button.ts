import {
  Component,
  computed,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'cancel'
  | 'unstyled'
  | 'sidebar';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'guiders-button',
  imports: [CommonModule],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  // Inputs usando signals API
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('medium');
  readonly type = input<ButtonType>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly active = input<boolean>(false);
  readonly ariaLabel = input<string>();
  readonly ariaExpanded = input<boolean | undefined>();
  readonly ariaCurrent = input<boolean | string | undefined>();

  // Outputs usando signals API
  readonly buttonClick = output<MouseEvent>();

  // Computed values para clases CSS
  readonly buttonClasses = computed(() => ({
    'guiders-button': true,
    [`guiders-button--${this.variant()}`]: true,
    [`guiders-button--${this.size()}`]: true,
    'guiders-button--disabled': this.disabled(),
    'guiders-button--loading': this.loading(),
    'guiders-button--full-width': this.fullWidth(),
    'guiders-button--active': this.active(),
  }));

  // Computed para determinar si el botón está interactivo
  readonly isInteractive = computed(() => !this.disabled() && !this.loading());

  onButtonClick(event: MouseEvent): void {
    if (this.isInteractive()) {
      this.buttonClick.emit(event);
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
