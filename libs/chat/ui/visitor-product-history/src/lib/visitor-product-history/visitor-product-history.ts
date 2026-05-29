import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonBlockComponent } from '@guiders-frontend/shared/ui/skeleton';

/**
 * Placeholder type until Story 2.2 defines the full ProductView interface.
 * Will be replaced by the shared type in Story 2.3.
 */
export interface ProductView {
  id: string;
  sessionId: string;
  name: string;
  url?: string;
}

/**
 * Displays visitor product history with skeleton loading state.
 * Stories 2.2 and 2.3 will provide the full data layer.
 */
@Component({
  selector: 'lib-visitor-product-history',
  standalone: true,
  imports: [SkeletonBlockComponent],
  templateUrl: './visitor-product-history.html',
  styleUrl: './visitor-product-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitorProductHistoryComponent {
  readonly loading = input<boolean>(false);
  readonly hasError = input<boolean>(false);
  readonly products = input<ProductView[]>([]);
  readonly currentSessionId = input<string>('');
}
