# User Menu Component

Componente de menú de usuario reutilizable que muestra información del usuario autenticado y proporciona acciones como cerrar sesión y configurar cuenta.

## Características

- **Avatar con iniciales**: Muestra las iniciales del nombre o email del usuario
- **Información del usuario**: Muestra el email y nombre (opcional) del usuario
- **Dropdown menu**: Menú desplegable con opciones de usuario
- **Accesibilidad**: Cumple con estándares ARIA y navegación por teclado
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Design tokens**: Usa los tokens de diseño del sistema

## Uso

### Importar el componente

```typescript
import { UserMenu } from '@guiders-frontend/user-menu';

@Component({
  imports: [UserMenu],
  // ...
})
export class MyComponent {}
```

### En el template

```html
<guiders-user-menu
  [userEmail]="user.email"
  [userName]="user.name"
  (logout)="onLogout()"
  (configureAccount)="onConfigureAccount()"
/>
```

## API

### Inputs

| Propiedad | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `userEmail` | `string` | Sí | Email del usuario (usado para mostrar y como fallback para iniciales) |
| `userName` | `string \| null` | No | Nombre completo del usuario (opcional) |

### Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `logout` | `void` | Se emite cuando el usuario hace clic en "Cerrar sesión" |
| `configureAccount` | `void` | Se emite cuando el usuario hace clic en "Configurar cuenta" |

## Ejemplo completo

```typescript
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserMenu } from '@guiders-frontend/user-menu';
import { UserService } from '@guiders-frontend/auth/data-access/session';

@Component({
  selector: 'app-header',
  imports: [UserMenu],
  template: `
    <header>
      <h1>Mi Aplicación</h1>
      @if (currentUser()) {
        <guiders-user-menu
          [userEmail]="currentUser()!.email"
          [userName]="null"
          (logout)="handleLogout()"
          (configureAccount)="handleConfigureAccount()"
        />
      }
    </header>
  `
})
export class HeaderComponent {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  
  readonly currentUser = this.userService.currentUser;
  
  handleLogout(): void {
    this.userService.clearUser();
    this.router.navigate(['/login']);
  }
  
  handleConfigureAccount(): void {
    this.router.navigate(['/settings']);
  }
}
```

## Estilos

El componente utiliza los design tokens del sistema para mantener consistencia visual:

- Espaciados: `tokens.$spacing-*`
- Colores: `tokens.$color-*`
- Tipografía: `tokens.$font-size-*`

## Accesibilidad

- Navegación por teclado completa
- Soporte para tecla ESC para cerrar el menú
- Atributos ARIA apropiados
- Roles semánticos correctos
- Estados de foco visibles

## Testing

El componente incluye tests unitarios que verifican:

- Renderizado correcto
- Interacciones del usuario
- Emisión de eventos
- Cálculo de iniciales

```bash
# Ejecutar tests
nx test user-menu
```

## Notas de implementación

- El componente usa Angular Signals para estado reactivo
- Change Detection Strategy: OnPush para mejor rendimiento
- El dropdown se cierra automáticamente al hacer clic fuera (backdrop)
- Responsive: en móvil oculta el texto y solo muestra el avatar
