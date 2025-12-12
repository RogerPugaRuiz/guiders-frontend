# Patrones Vitest

## Descripción

Patrones de testing unitario con Vitest para componentes Angular standalone.

## Referencia

`libs/shared/ui/badge/src/lib/badge/badge.spec.ts`

## Estructura de Test

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Badge, BadgeVariant } from './badge';

describe('Badge', () => {
  let component: Badge;
  let fixture: ComponentFixture<Badge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Badge], // Componente standalone
    }).compileComponents();

    fixture = TestBed.createComponent(Badge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('inputs', () => {
    it('should have default variant', () => {
      expect(component.variant()).toBe('default');
    });

    it('should accept variant input', () => {
      fixture.componentRef.setInput('variant', 'primary');
      fixture.detectChanges();
      expect(component.variant()).toBe('primary');
    });
  });

  describe('computed values', () => {
    it('should compute badge classes', () => {
      fixture.componentRef.setInput('variant', 'success');
      fixture.componentRef.setInput('size', 'large');
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes['guiders-badge']).toBe(true);
      expect(classes['guiders-badge--success']).toBe(true);
      expect(classes['guiders-badge--large']).toBe(true);
    });
  });

  describe('rendering', () => {
    it('should render text', () => {
      fixture.componentRef.setInput('text', 'Test Badge');
      fixture.detectChanges();

      const element = fixture.nativeElement;
      expect(element.textContent).toContain('Test Badge');
    });

    it('should apply variant class', () => {
      fixture.componentRef.setInput('variant', 'danger');
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.guiders-badge');
      expect(badge.classList.contains('guiders-badge--danger')).toBe(true);
    });
  });
});
```

## Testing con Signal Inputs

```typescript
describe('Component with signal inputs', () => {
  it('should update when input changes', () => {
    // Establecer input
    fixture.componentRef.setInput('count', 5);
    fixture.detectChanges();

    expect(component.count()).toBe(5);

    // Cambiar input
    fixture.componentRef.setInput('count', 10);
    fixture.detectChanges();

    expect(component.count()).toBe(10);
  });

  it('should compute derived values', () => {
    fixture.componentRef.setInput('count', 150);
    fixture.componentRef.setInput('maxCount', 99);
    fixture.detectChanges();

    expect(component.displayText()).toBe('99+');
  });
});
```

## Testing de Outputs

```typescript
describe('outputs', () => {
  it('should emit clicked event', () => {
    const clickedSpy = vi.fn();

    // Subscribirse al output
    component.clicked.subscribe(clickedSpy);

    // Simular click
    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(clickedSpy).toHaveBeenCalled();
  });

  it('should emit with data', () => {
    const selectedSpy = vi.fn();
    component.selected.subscribe(selectedSpy);

    fixture.componentRef.setInput('item', { id: '1', name: 'Test' });
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('.item');
    item.click();

    expect(selectedSpy).toHaveBeenCalledWith({ id: '1', name: 'Test' });
  });

  it('should not emit when disabled', () => {
    const clickedSpy = vi.fn();
    component.clicked.subscribe(clickedSpy);

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(clickedSpy).not.toHaveBeenCalled();
  });
});
```

## Mock de Dependencias

```typescript
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/shared/types';

describe('ComponentWithDeps', () => {
  const mockEnvironment = {
    production: false,
    api: { baseUrl: 'http://test-api.com' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment },
      ],
    }).compileComponents();
  });
});
```

## Testing Async

```typescript
import { fakeAsync, tick, flush } from '@angular/core/testing';

describe('async operations', () => {
  it('should handle async with fakeAsync', fakeAsync(() => {
    component.loadData();

    tick(1000); // Avanzar tiempo simulado
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.data()).toBeDefined();
  }));

  it('should handle promises', async () => {
    await component.loadData();
    fixture.detectChanges();

    expect(component.data()).toBeDefined();
  });
});
```

## Testing de Template

```typescript
describe('template rendering', () => {
  it('should show loading state', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('guiders-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should render list items', () => {
    fixture.componentRef.setInput('items', [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ]);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('li');
    expect(items.length).toBe(2);
  });

  it('should show empty state', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty).toBeTruthy();
  });
});
```

## Vitest Matchers

```typescript
// Básicos
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Strings
expect(string).toContain('substring');
expect(string).toMatch(/pattern/);

// Objects
expect(object).toHaveProperty('key');
expect(object).toMatchObject({ partial: 'match' });

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(2);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow('error');
```

## Spies y Mocks

```typescript
import { vi } from 'vitest';

// Spy en método
const spy = vi.spyOn(service, 'method');
expect(spy).toHaveBeenCalled();

// Mock de función
const mock = vi.fn().mockReturnValue('value');
const mockAsync = vi.fn().mockResolvedValue('async value');

// Mock de módulo
vi.mock('@angular/router', () => ({
  Router: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

// Limpiar mocks
afterEach(() => {
  vi.clearAllMocks();
});
```

## Configuración de Test

```typescript
// vite.config.ts (parcial)
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.spec.ts'],
    setupFiles: ['./src/test-setup.ts'],
  },
});

// test-setup.ts
import '@analogjs/vite-plugin-angular/setup-vitest';
```

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Archivo | `{name}.spec.ts` | `badge.spec.ts` |
| describe | Nombre del componente/servicio | `describe('Badge', ...)` |
| it | Comportamiento esperado | `it('should render text', ...)` |

## Checklist

- [ ] Importar componente en `imports` (standalone)
- [ ] `fixture.detectChanges()` después de cambiar inputs
- [ ] `fixture.componentRef.setInput()` para signals
- [ ] Cleanup de subscripciones
- [ ] Mock de dependencias externas
- [ ] Tests para estados edge-case

## Anti-patrones

- No llamar `detectChanges()` después de cambios
- Tests que dependen del orden de ejecución
- Mocks globales que afectan otros tests
- Tests sin assertions
- Ignorar estados de error y edge-cases
