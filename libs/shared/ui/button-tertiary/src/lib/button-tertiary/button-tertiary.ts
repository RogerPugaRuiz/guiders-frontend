import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'guiders-button-tertiary',
  imports: [],
  templateUrl: './button-tertiary.html',
  styleUrl: './button-tertiary.scss',
})
export class ButtonTertiaryComponent {
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled) {
      this.clicked.emit();
    }
  }
}
