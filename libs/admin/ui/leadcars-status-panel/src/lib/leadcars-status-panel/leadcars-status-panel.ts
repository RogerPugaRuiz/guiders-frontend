import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SkeletonBlockComponent } from '@guiders-frontend/shared/ui/skeleton';

/**
 * Placeholder types until Story 4.1 defines the full LeadCars data interfaces.
 * Will be replaced by the shared types in Story 4.2.
 */
export interface LeadCarsStatus {
  connected: boolean;
  lastSync?: string;
  message?: string;
}

export interface LeadCarsSyncRecord {
  id: string;
  status: 'failed' | 'pending' | 'success';
  errorMessage?: string;
  createdAt: string;
}

/**
 * Displays LeadCars integration status with skeleton loading state.
 * Stories 4.1 and 4.2 will provide the full data layer.
 */
@Component({
  selector: 'lib-leadcars-status-panel',
  standalone: true,
  imports: [SkeletonBlockComponent],
  templateUrl: './leadcars-status-panel.html',
  styleUrl: './leadcars-status-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadCarsStatusPanelComponent {
  readonly loading = input<boolean>(false);
  readonly status = input<LeadCarsStatus | null>(null);
  readonly failedRecords = input<LeadCarsSyncRecord[]>([]);

  readonly retryRecord = output<string>();
  readonly retryAll = output<void>();
}
