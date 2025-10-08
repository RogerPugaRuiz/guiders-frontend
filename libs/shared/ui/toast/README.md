# Toast Component Library

Librería de componentes toast para notificaciones y mensajes temporales en la aplicación.

## Características

- ✅ **Tipos de toast**: Success, Error, Warning, Info
- ✅ **Posicionamiento flexible**: 6 posiciones disponibles (top/bottom, left/center/right)
- ✅ **Auto-dismiss**: Configuración de duración personalizada
- ✅ **Diseño consistente**: Usa tokens de diseño del sistema
- ✅ **Accesibilidad**: Roles ARIA y soporte de teclado
- ✅ **Animaciones fluidas**: Transiciones suaves con tokens de movimiento
- ✅ **Responsive**: Optimizado para mobile y desktop

## Instalación

Esta librería ya está disponible en el monorepo. Importa desde:

```typescript
import { ToastService, ToastContainerComponent } from '@guiders-frontend/shared/ui/toast';
```

## Uso Básico

### 1. Agregar el contenedor al template principal

En tu componente principal de la app (ej: `app.component.html`):

```html
<router-outlet />
<guiders-toast-container />
```

### 2. Inyectar y usar el servicio

```typescript
import { Component, inject } from '@angular/core';
import { ToastService } from '@guiders-frontend/shared/ui/toast';

@Component({
  selector: 'app-my-component',
  template: `
    <button (click)="showSuccess()">Show Success</button>
    <button (click)="showError()">Show Error</button>
  `
})
export class MyComponent {
  private readonly toastService = inject(ToastService);

  showSuccess() {
    this.toastService.success('Operación completada exitosamente');
  }

  showError() {
    this.toastService.error('Ocurrió un error', 5000); // 5 segundos
  }
}
```

## API del Servicio

### Métodos de Conveniencia

```typescript
// Toast de éxito
toastService.success(message: string, duration?: number): string

// Toast de error
toastService.error(message: string, duration?: number): string

// Toast de advertencia
toastService.warning(message: string, duration?: number): string

// Toast de información
toastService.info(message: string, duration?: number): string
```

### Método Principal

```typescript
toastService.show(config: ToastConfig): string

interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info'; // default: 'info'
  duration?: number; // milisegundos, default: 3000, 0 = sin auto-dismiss
}
```

### Control Manual

```typescript
// Remover un toast específico por ID
const toastId = toastService.success('Message');
toastService.remove(toastId);

// Limpiar todos los toasts
toastService.clear();
```

### Posicionamiento

```typescript
// Cambiar posición de los toasts
toastService.setPosition('top-right'); // default

// Posiciones disponibles:
type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

// Obtener posición actual
const position = toastService.getPosition();
```

## Ejemplos Avanzados

### Toast sin auto-dismiss

```typescript
// Mostrar un toast que permanezca hasta que el usuario lo cierre
toastService.error('Error crítico que requiere atención', 0);
```

### Cambiar posición dinámicamente

```typescript
// En un componente de configuración
changeToastPosition(position: ToastPosition) {
  this.toastService.setPosition(position);
}
```

### Encadenar múltiples toasts

```typescript
async saveData() {
  try {
    const toastId = this.toastService.info('Guardando...', 0);
    
    await this.apiService.save(data);
    
    this.toastService.remove(toastId);
    this.toastService.success('Datos guardados exitosamente');
  } catch (error) {
    this.toastService.error('Error al guardar los datos');
  }
}
```

### Suscribirse a cambios de toasts

```typescript
ngOnInit() {
  this.toastService.toasts$.subscribe(toasts => {
    console.log(`Hay ${toasts.length} toasts activos`);
  });
}
```

## Personalización de Estilos

Los estilos usan los tokens de diseño del sistema. Si necesitas personalizar:

1. Los colores y espaciados están en `libs/shared/design-tokens/src/lib/tokens-vars.scss`
2. Las animaciones usan `$easing-entrance` y `$duration-normal`
3. Los toasts usan `$shadow-lg` para elevación

## Accesibilidad

- ✅ Los toasts tienen `role="alert"` para lectores de pantalla
- ✅ El botón de cerrar tiene `aria-label="Cerrar notificación"`
- ✅ Soporte completo de navegación por teclado
- ✅ Focus visible en el botón de cerrar

## Responsive

En dispositivos móviles (< 768px):
- Los toasts centrados ocupan todo el ancho
- Padding reducido para optimizar espacio
- Tamaño de fuente ajustado para legibilidad

## Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { ToastService } from '@guiders-frontend/shared/ui/toast';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should create a toast', () => {
    const id = service.success('Test message');
    expect(id).toBeDefined();
  });

  it('should remove toast after duration', (done) => {
    service.success('Test', 100);
    
    setTimeout(() => {
      service.toasts$.subscribe(toasts => {
        expect(toasts.length).toBe(0);
        done();
      });
    }, 150);
  });
});
```

## Mejores Prácticas

1. **Duración apropiada**: 
   - Success/Info: 3000ms (default)
   - Warning: 4000-5000ms
   - Error: 5000ms o sin auto-dismiss para errores críticos

2. **Mensajes concisos**: Máximo 1-2 líneas, mensajes claros y accionables

3. **Posicionamiento**: 
   - `top-right` para notificaciones generales (default)
   - `top-center` para avisos importantes
   - `bottom-*` para no obstruir contenido superior

4. **No abusar**: Evita múltiples toasts simultáneos, el usuario podría perderse información

## Running unit tests

Run `nx test toast` to execute the unit tests.

## Licencia

Parte del proyecto Guiders Frontend
