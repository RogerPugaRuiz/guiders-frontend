import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  pageSizeOptions?: number[];
}

@Component({
  selector: 'guiders-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrls: ['./pagination.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  // Inputs
  readonly config = input.required<PaginationConfig>();
  readonly disabled = input<boolean>(false);

  // Outputs
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  // Computed values
  readonly totalPages = computed(() => 
    Math.ceil(this.config().totalCount / this.config().pageSize)
  );

  readonly hasNextPage = computed(() => 
    this.config().currentPage < this.totalPages()
  );

  readonly hasPreviousPage = computed(() => 
    this.config().currentPage > 1
  );

  readonly startRecord = computed(() => {
    const config = this.config();
    return (config.currentPage - 1) * config.pageSize + 1;
  });

  readonly endRecord = computed(() => {
    const config = this.config();
    return Math.min(config.currentPage * config.pageSize, config.totalCount);
  });

  readonly pageSizeOptions = computed(() => 
    this.config().pageSizeOptions || [10, 20, 50, 100]
  );

  readonly displayInfo = computed(() => {
    const config = this.config();
    if (config.totalCount === 0) {
      return 'No hay registros';
    }
    return `Mostrando ${this.startRecord()}-${this.endRecord()} de ${config.totalCount}`;
  });

  // Methods
  goToPage(page: number): void {
    if (this.disabled()) return;
    
    const validPage = Math.max(1, Math.min(page, this.totalPages()));
    if (validPage !== this.config().currentPage) {
      this.pageChange.emit(validPage);
    }
  }

  firstPage(): void {
    this.goToPage(1);
  }

  previousPage(): void {
    this.goToPage(this.config().currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.config().currentPage + 1);
  }

  lastPage(): void {
    this.goToPage(this.totalPages());
  }

  onPageSizeChange(event: Event): void {
    if (this.disabled()) return;
    
    const select = event.target as HTMLSelectElement;
    const newPageSize = Number(select.value);
    this.pageSizeChange.emit(newPageSize);
  }

  // Helper para páginas visibles en paginador numérico
  getVisiblePages(): number[] {
    const current = this.config().currentPage;
    const total = this.totalPages();
    const visible: number[] = [];

    // Mostrar máximo 7 páginas: [1] ... [n-1] [n] [n+1] ... [total]
    if (total <= 7) {
      // Mostrar todas las páginas
      for (let i = 1; i <= total; i++) {
        visible.push(i);
      }
    } else {
      // Siempre mostrar primera página
      visible.push(1);

      // Calcular rango alrededor de la página actual
      const startPage = Math.max(2, current - 1);
      const endPage = Math.min(total - 1, current + 1);

      // Agregar "..." si hay gap
      if (startPage > 2) {
        visible.push(-1); // -1 representa "..."
      }

      // Páginas alrededor de la actual
      for (let i = startPage; i <= endPage; i++) {
        visible.push(i);
      }

      // Agregar "..." si hay gap
      if (endPage < total - 1) {
        visible.push(-1);
      }

      // Siempre mostrar última página
      visible.push(total);
    }

    return visible;
  }
}
