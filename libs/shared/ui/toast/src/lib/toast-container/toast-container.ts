import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastComponent } from '../toast/toast';
import { ToastService } from '../toast.service';
import { Toast, ToastPosition } from '../toast.types';

@Component({
  selector: 'guiders-toast-container',
  imports: [CommonModule, ToastComponent],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent implements OnInit {
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  toasts: Toast[] = [];
  position: ToastPosition = 'top-right';

  ngOnInit(): void {
    // Suscribirse a los cambios de toasts
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
      this.cdr.detectChanges();
    });

    // Suscribirse a los cambios de posición
    this.toastService.position$.subscribe(position => {
      this.position = position;
      this.cdr.detectChanges();
    });
  }

  onToastClosed(id: string): void {
    this.toastService.remove(id);
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }
}
