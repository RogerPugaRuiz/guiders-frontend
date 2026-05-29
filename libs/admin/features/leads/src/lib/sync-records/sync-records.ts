import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LeadsService } from '@guiders-frontend/leads-service';
import {
  LeadCarsSyncRecord,
  SyncStatus,
  LeadCarsCompanyConfig,
} from '@guiders-frontend/shared/types';
import { Badge } from '@guiders-frontend/badge';

@Component({
  selector: 'guiders-sync-records',
  imports: [CommonModule, FormsModule, Badge],
  templateUrl: './sync-records.html',
  styleUrl: './sync-records.scss',
})
export class SyncRecords implements OnInit {
  private readonly leadsService = inject(LeadsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // Estado reactivo
  readonly records = signal<LeadCarsSyncRecord[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly onlyFailed = signal<boolean>(false);

  // CRM config state
  readonly crmConfig = signal<LeadCarsCompanyConfig | null>(null);
  readonly crmConfigLoaded = signal<boolean>(false);
  readonly hasCrmConfig = computed(() => this.crmConfig() !== null);

  // Computed
  readonly hasRecords = computed(() => this.records().length > 0);
  readonly totalRecords = computed(() => this.records().length);
  readonly failedCount = computed(
    () => this.records().filter((r) => r.status === 'failed').length
  );
  readonly syncedCount = computed(
    () => this.records().filter((r) => r.status === 'synced').length
  );
  readonly pendingCount = computed(
    () => this.records().filter((r) => r.status === 'pending').length
  );

  ngOnInit(): void {
    this.subscribeToObservables();
    this.loadCrmConfig();
    this.loadRecords();
  }

  private subscribeToObservables(): void {
    this.leadsService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => this.loading.set(loading));

    this.leadsService.error$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error) => this.error.set(error));

    this.leadsService.syncRecords$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((records) => this.records.set(records));

    this.leadsService.config$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        this.crmConfig.set(config);
        this.crmConfigLoaded.set(true);
      });
  }

  private loadCrmConfig(): void {
    this.leadsService
      .getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  goToCrmSetup(): void {
    this.router.navigate(['/integrations/leadcars']);
  }

  loadRecords(): void {
    this.leadsService
      .getSyncRecords(this.onlyFailed())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onFilterChange(): void {
    this.loadRecords();
  }

  refresh(): void {
    this.loadRecords();
  }

  getStatusLabel(status: SyncStatus): string {
    const labels: Record<SyncStatus, string> = {
      pending: 'Pendiente',
      synced: 'Sincronizado',
      failed: 'Fallido',
      partial: 'Parcial',
    };
    return labels[status] || status;
  }

  getStatusClass(status: SyncStatus): string {
    const classes: Record<SyncStatus, string> = {
      pending: 'status-badge--warning',
      synced: 'status-badge--success',
      failed: 'status-badge--error',
      partial: 'status-badge--info',
    };
    return classes[status] || '';
  }

  getStatusVariant(
    status: SyncStatus
  ): 'success' | 'warning' | 'danger' | 'info' {
    const variants: Record<
      SyncStatus,
      'success' | 'warning' | 'danger' | 'info'
    > = {
      pending: 'warning',
      synced: 'success',
      failed: 'danger',
      partial: 'info',
    };
    return variants[status] || 'info';
  }

  getCrmTypeLabel(type: string): string {
    if (type === 'leadcars') return 'LeadCars';
    return type;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  truncateId(id: string): string {
    if (id.length <= 12) return id;
    return `${id.substring(0, 8)}...`;
  }
}
