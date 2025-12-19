# UI Patterns

## Description

Common user interface patterns: forms, modals, lists, loading states, and error handling.

## Forms with Reactive Forms

### Basic Structure

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'lib-visitor-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './visitor-form.html',
})
export class VisitorForm {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    notes: ['', Validators.maxLength(500)],
  });

  readonly isSubmitting = signal(false);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    // ... submit logic
  }

  // Helper for errors
  getError(field: string): string | null {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return null;

    if (control.errors['required']) return 'This field is required';
    if (control.errors['email']) return 'Invalid email';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    return null;
  }
}
```

### Form Template

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <div class="form-field">
    <label for="name">Name *</label>
    <input
      id="name"
      formControlName="name"
      [attr.aria-invalid]="form.get('name')?.invalid && form.get('name')?.touched"
      [attr.aria-describedby]="getError('name') ? 'name-error' : null"
    />
    @if (getError('name')) {
      <span id="name-error" class="form-error" role="alert">
        {{ getError('name') }}
      </span>
    }
  </div>

  <div class="form-actions">
    <button type="button" (click)="onCancel()">Cancel</button>
    <button type="submit" [disabled]="isSubmitting()">
      @if (isSubmitting()) {
        <guiders-spinner size="small" />
      } @else {
        Save
      }
    </button>
  </div>
</form>
```

## Modals/Dialogs

### Modal Component

```typescript
@Component({
  selector: 'guiders-modal',
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="guiders-modal__backdrop" (click)="onBackdropClick()">
        <div
          class="guiders-modal__content"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          (click)="$event.stopPropagation()"
        >
          <header class="guiders-modal__header">
            <h2 [id]="titleId">{{ title() }}</h2>
            <button
              type="button"
              class="guiders-modal__close"
              aria-label="Close"
              (click)="close.emit()"
            >
              ×
            </button>
          </header>
          <div class="guiders-modal__body">
            <ng-content />
          </div>
          <footer class="guiders-modal__footer">
            <ng-content select="[footer]" />
          </footer>
        </div>
      </div>
    }
  `,
})
export class Modal {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('');
  readonly closeOnBackdrop = input<boolean>(true);
  readonly close = output<void>();

  readonly titleId = `modal-title-${crypto.randomUUID()}`;

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close.emit();
    }
  }
}
```

### Modal Usage

```html
<guiders-modal
  [isOpen]="showModal()"
  title="Confirm action"
  (close)="showModal.set(false)"
>
  <p>Are you sure you want to continue?</p>

  <div footer>
    <button (click)="showModal.set(false)">Cancel</button>
    <button (click)="onConfirm()">Confirm</button>
  </div>
</guiders-modal>
```

## Lists with Pagination

### List Component

```typescript
@Component({
  selector: 'lib-visitor-list',
  template: `
    <!-- Loading state -->
    @if (loading()) {
      <div class="list-loading">
        <guiders-spinner />
        <span>Loading visitors...</span>
      </div>
    }

    <!-- Empty state -->
    @else if (visitors().length === 0) {
      <div class="list-empty">
        <span class="list-empty__icon">👥</span>
        <p>No visitors</p>
        <button (click)="refresh.emit()">Reload</button>
      </div>
    }

    <!-- List -->
    @else {
      <ul class="visitor-list" role="list">
        @for (visitor of visitors(); track visitor.id) {
          <li>
            <guiders-visitor-card
              [visitor]="visitor"
              [selected]="visitor.id === selectedId()"
              (click)="select.emit(visitor)"
            />
          </li>
        }
      </ul>

      <!-- Pagination -->
      @if (hasMore()) {
        <button
          class="list-load-more"
          [disabled]="loadingMore()"
          (click)="loadMore.emit()"
        >
          @if (loadingMore()) {
            Loading...
          } @else {
            Load more
          }
        </button>
      }
    }
  `,
})
export class VisitorList {
  readonly visitors = input<Visitor[]>([]);
  readonly loading = input<boolean>(false);
  readonly loadingMore = input<boolean>(false);
  readonly hasMore = input<boolean>(false);
  readonly selectedId = input<string | null>(null);

  readonly select = output<Visitor>();
  readonly loadMore = output<void>();
  readonly refresh = output<void>();
}
```

## Loading States

### Skeleton Loader

```typescript
@Component({
  selector: 'guiders-skeleton',
  template: `
    <div
      class="guiders-skeleton"
      [style.width]="width()"
      [style.height]="height()"
      [class.guiders-skeleton--circle]="circle()"
    ></div>
  `,
  styles: [`
    .guiders-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;

      &--circle {
        border-radius: 50%;
      }
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class Skeleton {
  readonly width = input<string>('100%');
  readonly height = input<string>('20px');
  readonly circle = input<boolean>(false);
}
```

### Skeleton Usage

```html
@if (loading()) {
  <div class="card-skeleton">
    <guiders-skeleton width="48px" height="48px" [circle]="true" />
    <div class="card-skeleton__content">
      <guiders-skeleton width="60%" height="16px" />
      <guiders-skeleton width="40%" height="14px" />
    </div>
  </div>
} @else {
  <guiders-visitor-card [visitor]="visitor()" />
}
```

## Error Handling

### Error Boundary Component

```typescript
@Component({
  selector: 'guiders-error-state',
  template: `
    <div class="guiders-error" role="alert">
      <span class="guiders-error__icon">⚠️</span>
      <h3 class="guiders-error__title">{{ title() }}</h3>
      <p class="guiders-error__message">{{ message() }}</p>
      @if (showRetry()) {
        <button
          class="guiders-error__retry"
          (click)="retry.emit()"
        >
          Retry
        </button>
      }
    </div>
  `,
})
export class ErrorState {
  readonly title = input<string>('An error occurred');
  readonly message = input<string>('Please try again later.');
  readonly showRetry = input<boolean>(true);
  readonly retry = output<void>();
}
```

### Try-Catch Pattern in Services

```typescript
loadVisitors(): void {
  this.loading.set(true);
  this.error.set(null);

  this.visitorsService.getVisitors().pipe(
    takeUntilDestroyed(this.destroyRef),
    finalize(() => this.loading.set(false))
  ).subscribe({
    next: (visitors) => {
      this.visitors.set(visitors);
    },
    error: (error) => {
      console.error('Error loading visitors:', error);
      this.error.set('Could not load visitors');
    },
  });
}
```

## Toast Notifications

### Toast Service

```typescript
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts.asObservable();

  show(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const toast: Toast = {
      id: crypto.randomUUID(),
      message,
      type,
    };

    this._toasts.next([...this._toasts.getValue(), toast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => this.dismiss(toast.id), 5000);
  }

  dismiss(id: string): void {
    this._toasts.next(
      this._toasts.getValue().filter(t => t.id !== id)
    );
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }
}
```

### Usage

```typescript
private readonly toast = inject(ToastService);

onSave(): void {
  this.service.save(data).subscribe({
    next: () => this.toast.success('Saved successfully'),
    error: () => this.toast.error('Error saving'),
  });
}
```

## Anti-patterns

- Forms without visual validation
- Modals without focus trap
- Lists without empty states
- Loading states without visual feedback
- Errors without retry option
- Toast without auto-dismiss
- Components without proper ARIA roles
