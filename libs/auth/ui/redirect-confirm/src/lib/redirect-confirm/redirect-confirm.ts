import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RedirectConfirmService } from '../redirect-confirm.service';

@Component({
  selector: 'guiders-redirect-confirm',
  imports: [],
  templateUrl: './redirect-confirm.html',
  styleUrl: './redirect-confirm.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedirectConfirm {
  protected readonly redirectService = inject(RedirectConfirmService);

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('redirect-confirm__backdrop')) {
      this.redirectService.cancel();
    }
  }

  onConfirm(): void {
    this.redirectService.confirm();
  }

  onCancel(): void {
    this.redirectService.cancel();
  }
}
