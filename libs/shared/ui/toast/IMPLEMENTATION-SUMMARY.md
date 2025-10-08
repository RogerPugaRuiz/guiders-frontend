# Toast Component Library - Resumen de Implementación

## 📦 Librería Creada

**Ubicación**: `libs/shared/ui/toast`  
**Importación**: `@guiders-frontend/shared/ui/toast`  
**Tags**: `scope:shared`, `type:ui`

## 🏗️ Estructura de Archivos

```
libs/shared/ui/toast/
├── src/
│   ├── index.ts                          # Barrel exports
│   ├── lib/
│   │   ├── toast.types.ts                # Tipos TypeScript
│   │   ├── toast.service.ts              # Servicio de gestión
│   │   ├── toast/                        # Componente individual
│   │   │   ├── toast.ts
│   │   │   ├── toast.html
│   │   │   ├── toast.scss
│   │   │   └── toast.spec.ts
│   │   └── toast-container/              # Contenedor con posicionamiento
│   │       ├── toast-container.ts
│   │       ├── toast-container.html
│   │       └── toast-container.scss
│   └── test-setup.ts
├── README.md                              # Documentación completa
├── USAGE-EXAMPLES.md                      # Ejemplos de integración
├── project.json
├── tsconfig.json
├── vite.config.mts
└── eslint.config.mjs
```

## ✨ Características Implementadas

### 1. Tipos de Toast
- ✅ Success (verde)
- ✅ Error (rojo)
- ✅ Warning (amarillo)
- ✅ Info (azul)

### 2. Posicionamiento Flexible
Soporta 6 posiciones:
- `top-left`, `top-center`, `top-right`
- `bottom-left`, `bottom-center`, `bottom-right`

### 3. Servicio de Gestión (`ToastService`)
- **Métodos de conveniencia**: `success()`, `error()`, `warning()`, `info()`
- **Método principal**: `show(config: ToastConfig)`
- **Control manual**: `remove(id)`, `clear()`
- **Posicionamiento**: `setPosition()`, `getPosition()`
- **Observables**: `toasts$`, `position$`

### 4. Auto-dismiss Configurable
- Duración por defecto: 3000ms (3 segundos)
- Personalizable por toast
- Soporte para toasts persistentes (duration: 0)

### 5. Diseño con Design Tokens
Utiliza tokens del sistema de diseño:
- **Spacing**: `$spacing-sm`, `$spacing-md`
- **Typography**: mixins `typography()`
- **Colors**: `$color-success-600`, `$color-error-600`, etc.
- **Borders**: `$border-radius-md`
- **Shadows**: `$shadow-lg`
- **Animations**: `$easing-entrance`, `$duration-normal`

### 6. Accesibilidad
- ✅ `role="alert"` para lectores de pantalla
- ✅ `aria-label` en botón de cerrar
- ✅ Navegación por teclado
- ✅ Focus visible

### 7. Responsive
- Adaptación automática para mobile (< 768px)
- Padding optimizado
- Ancho completo en centrado para dispositivos pequeños

## 🎨 Patrón BEM en Estilos

```scss
.toast { }                    // Bloque
.toast__content { }           // Elemento
.toast__icon { }             // Elemento
.toast__message { }          // Elemento
.toast__close { }            // Elemento
.toast--success { }          // Modificador
.toast--error { }            // Modificador
.toast--warning { }          // Modificador
.toast--info { }             // Modificador
```

## 📝 API Pública Exportada

```typescript
// Componentes
export { ToastComponent }
export { ToastContainerComponent }

// Servicio
export { ToastService }

// Tipos
export { Toast, ToastConfig, ToastType, ToastPosition }
```

## 🚀 Cómo Usar

### Paso 1: Agregar el contenedor
```html
<!-- app.component.html -->
<router-outlet />
<guiders-toast-container />
```

### Paso 2: Importar el contenedor
```typescript
// app.component.ts
import { ToastContainerComponent } from '@guiders-frontend/shared/ui/toast';

@Component({
  imports: [RouterOutlet, ToastContainerComponent],
  // ...
})
```

### Paso 3: Usar el servicio
```typescript
import { inject } from '@angular/core';
import { ToastService } from '@guiders-frontend/shared/ui/toast';

export class MyComponent {
  private readonly toastService = inject(ToastService);

  showToast() {
    this.toastService.success('¡Operación exitosa!');
  }
}
```

## 🎯 Casos de Uso

1. **Confirmación de acciones**: Guardar, eliminar, actualizar
2. **Notificaciones de error**: Validaciones, errores de API
3. **Mensajes informativos**: Estado de carga, actualizaciones
4. **Alertas de advertencia**: Precauciones, límites alcanzados
5. **Eventos en tiempo real**: Mensajes de WebSocket, notificaciones push

## 🧪 Testing

- Archivo de spec generado: `toast.spec.ts`
- Comando: `nx test toast`
- Framework: Vitest con `@analogjs/vitest-angular`

## 📚 Documentación

- **README.md**: Documentación completa con API y mejores prácticas
- **USAGE-EXAMPLES.md**: Ejemplos de integración en diferentes contextos

## 🔗 Dependencias

- `@angular/core`: Componentes standalone
- `@angular/common`: CommonModule
- `rxjs`: BehaviorSubject y Observables
- Design tokens: `@guiders-frontend/shared/design-tokens`

## ✅ Cumplimiento con Estándares del Proyecto

- ✅ Componentes standalone (no NgModules)
- ✅ Inyección con `inject()` function
- ✅ Change Detection: `OnPush`
- ✅ Prefijo: `guiders-*`
- ✅ Patrón BEM en SCSS
- ✅ Uso de design tokens
- ✅ Exportaciones via barrel (`index.ts`)
- ✅ Tags correctos en Nx: `scope:shared`, `type:ui`

## 🎉 Listo para Usar

La librería está completa y lista para ser integrada en cualquier aplicación del monorepo (`admin` o `console`).

**Import path**: `@guiders-frontend/shared/ui/toast`
