import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'guiders-button-secondary',
  imports: [],
  templateUrl: './button-secondary.html',
  styleUrl: './button-secondary.scss',
})
export class ButtonSecondaryComponent {
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled) {
      this.clicked.emit();
    }
  }
}
