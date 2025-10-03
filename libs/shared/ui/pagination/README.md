# Componente de Paginación - guiders-pagination

Componente reutilizable de paginación para listas de datos en el sistema Guiders.

## Ubicación
`libs/shared/ui/pagination`

## Características

- **Navegación completa**: Primera, Anterior, Siguiente, Última página
- **Páginas numeradas**: Muestra páginas con ellipsis (...) para grandes conjuntos
- **Selector de tamaño**: Permite cambiar el número de registros por página
- **Información de registros**: Muestra "Mostrando X-Y de Z registros"
- **Estado disabled**: Puede deshabilitarse durante operaciones de carga
- **Diseño responsive**: Se adapta a móviles y tablets
- **Accesibilidad**: Botones con títulos descriptivos y estados disabled

## Uso

### Importación

```typescript
import { PaginationComponent } from '@guiders-frontend/pagination';

@Component({
  selector: 'mi-componente',
  standalone: true,
  imports: [PaginationComponent],
  // ...
})
```

### Template básico

```html
<guiders-pagination
  [config]="{
    currentPage: 1,
    pageSize: 20,
    totalCount: 234,
    pageSizeOptions: [10, 20, 50, 100]
  }"
  [disabled]="loading"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)"
/>
```

## Props

### config (required)

Objeto de tipo `PaginationConfig` con la configuración de paginación:

```typescript
interface PaginationConfig {
  currentPage: number;        // Página actual (1-based)
  pageSize: number;           // Registros por página
  totalCount: number;         // Total de registros
  pageSizeOptions?: number[]; // Opciones para selector de tamaño (default: [10, 20, 50, 100])
}
```

### disabled (optional)

- **Tipo**: `boolean`
- **Default**: `false`
- **Descripción**: Deshabilita todos los controles durante operaciones de carga

## Eventos

### pageChange

Emitido cuando el usuario cambia de página.

```typescript
onPageChange(page: number): void {
  // page es el número de página (1-based)
  console.log('Ir a página:', page);
}
```

### pageSizeChange

Emitido cuando el usuario cambia el tamaño de página.

```typescript
onPageSizeChange(size: number): void {
  // size es el nuevo número de registros por página
  console.log('Cambiar tamaño a:', size);
}
```

## Ejemplo completo con signals

```typescript
import { Component, signal, computed } from '@angular/core';
import { PaginationComponent } from '@guiders-frontend/pagination';

@Component({
  selector: 'mi-lista',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <div class="lista">
      <!-- Tu lista aquí -->
      @for (item of paginatedItems(); track item.id) {
        <div>{{ item.name }}</div>
      }

      <!-- Paginador -->
      <guiders-pagination
        [config]="paginationConfig()"
        [disabled]="loading()"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
      />
    </div>
  `
})
export class MiListaComponent {
  readonly allItems = signal<Item[]>([]);
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);

  readonly totalCount = computed(() => this.allItems().length);

  readonly paginationConfig = computed(() => ({
    currentPage: this.currentPage(),
    pageSize: this.pageSize(),
    totalCount: this.totalCount(),
    pageSizeOptions: [10, 20, 50, 100]
  }));

  readonly paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.allItems().slice(start, end);
  });

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1); // Volver a página 1
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    // Cargar datos...
  }
}
```

## Ejemplo con backend paginado

```typescript
import { Component, signal, computed } from '@angular/core';
import { PaginationComponent } from '@guiders-frontend/pagination';

@Component({
  selector: 'lista-visitantes',
  template: `
    <guiders-pagination
      [config]="{
        currentPage: currentPage(),
        pageSize: pageSize(),
        totalCount: totalCount(),
        pageSizeOptions: [10, 20, 50, 100]
      }"
      [disabled]="loading()"
      (pageChange)="onPageChange($event)"
      (pageSizeChange)="onPageSizeChange($event)"
    />
  `
})
export class ListaVisitantesComponent {
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly totalCount = signal(0);
  readonly loading = signal(false);

  onPageChange(page: number): void {
    this.loading.set(true);
    const offset = (page - 1) * this.pageSize();

    this.apiService.getVisitors(tenantId, {
      limit: this.pageSize(),
      offset: offset
    }).subscribe(response => {
      this.currentPage.set(page);
      this.totalCount.set(response.totalCount);
      this.loading.set(false);
    });
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.onPageChange(1); // Volver a primera página
  }
}
```

## Fórmulas útiles

### Calcular offset para backend

```typescript
const offset = (currentPage - 1) * pageSize;
// Ejemplo: Página 3, tamaño 20 → offset = 40
```

### Calcular total de páginas

```typescript
const totalPages = Math.ceil(totalCount / pageSize);
// Ejemplo: 234 registros, 20 por página → 12 páginas
```

### Calcular rango de registros

```typescript
const start = (currentPage - 1) * pageSize + 1;
const end = Math.min(currentPage * pageSize, totalCount);
// Ejemplo: Página 1, tamaño 20, total 234 → "1-20 de 234"
```

## Estilos

El componente utiliza los design tokens del sistema:

- **Colores**: Usa tokens de superficie, bordes y primarios
- **Espaciado**: Sigue la escala 4/8px del sistema
- **Tipografía**: Fuente Inter con tamaños del sistema
- **Transiciones**: Animaciones sutiles y consistentes

### Personalización

Si necesitas personalizar estilos específicos:

```scss
// En tu componente
::ng-deep .pagination {
  border-top: 2px solid tokens.$color-brand-primary;
  
  &__button--primary {
    background: tokens.$color-brand-primary;
  }
}
```

## Responsive

- **Desktop (>768px)**: Layout horizontal con todos los controles visibles
- **Mobile (<768px)**: Layout vertical apilado, páginas con wrap

## Accesibilidad

- Botones con `title` descriptivos
- Estados `disabled` correctos
- Navegación con teclado (Tab + Enter)
- Selector con `label` asociado

## Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from '@guiders-frontend/pagination';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  it('should calculate total pages correctly', () => {
    fixture.componentRef.setInput('config', {
      currentPage: 1,
      pageSize: 20,
      totalCount: 234
    });
    fixture.detectChanges();

    expect(component.totalPages()).toBe(12);
  });

  it('should emit pageChange event', () => {
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);

    component.goToPage(3);

    expect(spy).toHaveBeenCalledWith(3);
  });
});
```

## Casos de uso

### 1. Lista de visitantes (implementado)

Ver: `libs/chat/features/visitors`

```typescript
// Estado con paginación
readonly state = signal({
  pagination: {
    limit: 20,
    offset: 0,
    totalCount: 0,
    currentPage: 1
  }
});

// Métodos de navegación
onPageChange(page: number): void {
  const offset = (page - 1) * this.state().pagination.limit;
  this.updateState({
    pagination: {
      ...this.state().pagination,
      currentPage: page,
      offset
    }
  });
  this.loadVisitors();
}
```

### 2. Tabla de chats

```typescript
<guiders-pagination
  [config]="{
    currentPage: chatState.currentPage,
    pageSize: 50,
    totalCount: chatState.totalChats
  }"
  (pageChange)="loadChatsPage($event)"
/>
```

### 3. Lista de contactos

```typescript
<guiders-pagination
  [config]="{
    currentPage: 1,
    pageSize: 25,
    totalCount: contacts.length,
    pageSizeOptions: [25, 50, 100]
  }"
  (pageChange)="scrollToTop(); currentPage = $event"
  (pageSizeChange)="pageSize = $event; currentPage = 1"
/>
```

## Mejores prácticas

1. **Siempre resetear a página 1** cuando cambien filtros o búsquedas
2. **Mostrar loading state** deshabilitando el paginador durante cargas
3. **Persistir página actual** en query params para deep linking
4. **Scroll automático** al top al cambiar de página
5. **Validar límites** antes de emitir eventos

## Dependencias

- Angular 20+
- Design tokens (`@guiders-frontend/design-tokens`)
- CommonModule

## Compatibilidad

- ✅ Standalone components
- ✅ Signals API
- ✅ Change Detection OnPush
- ✅ SSR (Server-Side Rendering)
