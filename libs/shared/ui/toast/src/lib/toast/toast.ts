import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast as ToastModel, ToastType } from '../toast.types';

@Component({
  selector: 'guiders-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  toast = input.required<ToastModel>();
  closed = output<string>();

  onClose(): void {
    this.closed.emit(this.toast().id);
  }

  getIconClass(): string {
    const iconMap: Record<ToastType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return iconMap[this.toast().type] || '';
  }
}

