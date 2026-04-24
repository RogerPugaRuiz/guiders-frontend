import {
  Component,
  input,
  output,
  computed,
  signal,
  ChangeDetectionStrategy,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Public types ─────────────────────────────────────────────────────────────

/** Context object passed to each cell ng-template */
export interface CellTemplateContext<T = object> {
  /** The full row data */
  $implicit: T;
  /** The resolved cell value */
  value: unknown;
  /** The column definition */
  column: TableColumn<T>;
}

export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  field: string;
  direction: SortDirection;
}

export interface TableColumn<T = object> {
  /** Unique field identifier used for sorting and column visibility */
  field: string;
  /** Header label displayed in the table */
  label: string;
  /** Whether the column can be sorted. Default: false */
  sortable?: boolean;
  /** Whether the column can be hidden by the user. Default: true */
  hideable?: boolean;
  /** Whether the column is visible initially. Default: true */
  visible?: boolean;
  /** Custom cell value resolver. If omitted, uses field as property key */
  value?: (row: T) => unknown;
  /** CSS class(es) to add to both <th> and <td> */
  cssClass?: string;
  /** Min width in pixels */
  minWidth?: number;
}

export interface DataTableConfig {
  /** Show a leading checkbox column for row selection. Default: false */
  selectable?: boolean;
  /** Allow selecting multiple rows. Default: false. Requires selectable: true */
  multiSelect?: boolean;
  /** Show a toolbar button to add a column (triggers addColumn output). Default: false */
  allowAddColumn?: boolean;
  /** Show a toolbar button to manage column visibility. Default: false */
  allowColumnVisibility?: boolean;
  /** Keep the header sticky on scroll. Default: true */
  stickyHeader?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'guiders-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrls: ['./data-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T extends object = object> {
  // ── Inputs ──────────────────────────────────────────────────────────────────

  readonly rows = input<T[]>([]);
  readonly columns = input<TableColumn<T>[]>([]);
  readonly config = input<DataTableConfig>({});
  readonly loading = input<boolean>(false);
  readonly sort = input<TableSort | null>(null);
  readonly selectedRowIds = input<string[]>([]);
  /** Field used as unique row identifier for selection. Default: 'id' */
  readonly rowIdField = input<string>('id');
  /** Empty state message */
  readonly emptyMessage = input<string>('No hay datos disponibles');
  /**
   * Optional map of column field → TemplateRef for custom cell rendering.
   * Each template receives a CellTemplateContext<T> as its implicit context.
   */
  readonly cellTemplates = input<Map<string, TemplateRef<CellTemplateContext<T>>>>(new Map());

  // ── Outputs ─────────────────────────────────────────────────────────────────

  readonly sortChange = output<TableSort>();
  readonly rowClick = output<T>();
  readonly selectionChange = output<T[]>();
  /** Emitted when user clicks "Add column" button */
  readonly addColumn = output<void>();

  // ── Internal state ──────────────────────────────────────────────────────────

  readonly internalSelectedIds = signal<Set<string>>(new Set());
  readonly hiddenFields = signal<Set<string>>(new Set());
  readonly showVisibilityPanel = signal<boolean>(false);
  readonly internalSort = signal<TableSort | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────────────

  readonly activeSort = computed(() => this.sort() ?? this.internalSort());

  readonly visibleColumns = computed(() => {
    const hidden = this.hiddenFields();
    return this.columns().filter((col) => {
      if (hidden.has(col.field)) return false;
      // respect initial visibility flag only before user explicitly changes anything
      return true;
    });
  });

  readonly allColumns = computed(() => this.columns());

  readonly selectedRows = computed(() => {
    const ids = this.internalSelectedIds();
    const idField = this.rowIdField();
    return this.rows().filter((row) => ids.has(String(this.getField(row, idField))));
  });

  readonly allSelected = computed(() => {
    const rows = this.rows();
    if (rows.length === 0) return false;
    const ids = this.internalSelectedIds();
    const idField = this.rowIdField();
    return rows.every((row) => ids.has(String(this.getField(row, idField))));
  });

  readonly someSelected = computed(() => {
    const rows = this.rows();
    const ids = this.internalSelectedIds();
    const idField = this.rowIdField();
    return rows.some((row) => ids.has(String(this.getField(row, idField)))) && !this.allSelected();
  });

  readonly cfg = computed<Required<DataTableConfig>>(() => ({
    selectable: false,
    multiSelect: false,
    allowAddColumn: false,
    allowColumnVisibility: false,
    stickyHeader: true,
    ...this.config(),
  }));

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Type-safe dynamic field accessor */
  getField(row: T, field: string): unknown {
    return (row as Record<string, unknown>)[field];
  }

  getCellValue(row: T, col: TableColumn<T>): unknown {
    if (col.value) return col.value(row);
    return this.getField(row, col.field);
  }

  getTemplate(field: string): TemplateRef<CellTemplateContext<T>> | null {
    return this.cellTemplates().get(field) ?? null;
  }

  getCellContext(row: T, col: TableColumn<T>): CellTemplateContext<T> {
    return { $implicit: row, value: this.getCellValue(row, col), column: col };
  }

  isRowSelected(row: T): boolean {
    return this.internalSelectedIds().has(String(this.getField(row, this.rowIdField())));
  }

  isColumnVisible(field: string): boolean {
    return !this.hiddenFields().has(field);
  }

  // ── Sort ────────────────────────────────────────────────────────────────────

  onHeaderClick(col: TableColumn<T>): void {
    if (!col.sortable) return;

    const current = this.activeSort();
    let direction: SortDirection = 'asc';

    if (current?.field === col.field) {
      direction = current.direction === 'asc' ? 'desc' : 'asc';
    }

    const newSort: TableSort = { field: col.field, direction };
    this.internalSort.set(newSort);
    this.sortChange.emit(newSort);
  }

  sortDirectionFor(field: string): SortDirection | null {
    const s = this.activeSort();
    return s?.field === field ? s.direction : null;
  }

  // ── Selection ────────────────────────────────────────────────────────────────

  onRowCheckboxChange(row: T, checked: boolean): void {
    const ids = new Set(this.internalSelectedIds());
    const id = String(this.getField(row, this.rowIdField()));

    if (checked) {
      if (!this.cfg().multiSelect) ids.clear();
      ids.add(id);
    } else {
      ids.delete(id);
    }

    this.internalSelectedIds.set(ids);
    this.selectionChange.emit(this.selectedRows());
  }

  onSelectAllChange(checked: boolean): void {
    if (!this.cfg().multiSelect) return;

    const idField = this.rowIdField();
    const ids = checked
      ? new Set(this.rows().map((r) => String(this.getField(r, idField))))
      : new Set<string>();

    this.internalSelectedIds.set(ids);
    this.selectionChange.emit(this.selectedRows());
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  // ── Column visibility ─────────────────────────────────────────────────────────

  toggleColumnVisibility(field: string): void {
    const hidden = new Set(this.hiddenFields());
    if (hidden.has(field)) {
      hidden.delete(field);
    } else {
      hidden.add(field);
    }
    this.hiddenFields.set(hidden);
  }

  toggleVisibilityPanel(): void {
    this.showVisibilityPanel.update((v) => !v);
  }

  onAddColumn(): void {
    this.addColumn.emit();
  }
}
