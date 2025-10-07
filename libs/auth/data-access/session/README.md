# UserService

Un servicio reactivo para manejar el estado del usuario autenticado en la aplicación.

## Características

- **Estado reactivo**: Utiliza Angular Signals para un manejo de estado moderno y eficiente
- **Almacenamiento centralizado**: Gestiona el usuario actual en un único lugar
- **Métodos de conveniencia**: Provee funciones útiles para verificar roles, autenticación, etc.
- **Verificación de expiración**: Comprueba automáticamente si la sesión ha expirado

## Interfaz del Usuario

```typescript
interface User {
  sub: string;           // ID único del usuario
  email: string;         // Email del usuario
  roles: string[];       // Lista de roles asignados
  app: string;           // Aplicación actual
  session: {
    exp: number;         // Timestamp de expiración
    iat: number;         // Timestamp de emisión
  };
}
```

## Uso Básico

### Inyección del Servicio

```typescript
import { Component, inject } from '@angular/core';
import { UserService } from '@guiders-frontend/auth/data-access/session';

@Component({...})
export class MyComponent {
  private readonly userService = inject(UserService);
}
```

### Obtener Usuario Actual

```typescript
// Signal de solo lectura
const currentUser = this.userService.currentUser();

// En templates
@if (userService.currentUser()) {
  <p>Bienvenido, {{ userService.currentUser()?.email }}</p>
}
```

### Verificar Autenticación

```typescript
// Computed signal
const isAuthenticated = this.userService.isAuthenticated();

// En templates
@if (userService.isAuthenticated()) {
  <div>Contenido para usuarios autenticados</div>
}
```

### Verificar Roles

```typescript
// Verificar un rol específico
if (this.userService.hasRole('admin')) {
  // Usuario es administrador
}

// Verificar múltiples roles
if (this.userService.hasAnyRole(['admin', 'moderator'])) {
  // Usuario tiene al menos uno de estos roles
}
```

### Verificar Expiración de Sesión

```typescript
// Computed signal
const isExpired = this.userService.isSessionExpired();

@if (userService.isSessionExpired()) {
  <div class="warning">Tu sesión ha expirado</div>
}
```

## Métodos Disponibles

### Gestión de Usuario

- `fetchUser()`: Observable<User> - Obtiene el usuario desde el BFF
- `setUser(user)`: void - Establece el usuario actual
- `clearUser()`: void - Limpia el usuario actual

### Verificaciones

- `hasRole(role)`: boolean - Verifica si tiene un rol específico
- `hasAnyRole(roles)`: boolean - Verifica si tiene alguno de los roles
- `getUserEmail()`: string | null - Obtiene el email del usuario
- `getUserId()`: string | null - Obtiene el ID del usuario (sub)
- `getUserApp()`: string | null - Obtiene la aplicación actual

### Signals

- `currentUser`: Signal<User | null> - Usuario actual (solo lectura)
- `isAuthenticated`: Signal<boolean> - Estado de autenticación
- `isSessionExpired`: Signal<boolean> - Estado de expiración

## Integración con SessionService

El `SessionService` existente ahora utiliza internamente el `UserService`, manteniendo compatibilidad hacia atrás:

```typescript
// Funciona igual que antes
this.sessionService.ensureSession$().subscribe(user => {
  console.log('Usuario:', user);
});

// Nuevos métodos de conveniencia
const user = this.sessionService.getCurrentUser();
const isAuth = this.sessionService.isAuthenticated();
```

## Running unit tests

Run `nx test session` to execute the unit tests.
