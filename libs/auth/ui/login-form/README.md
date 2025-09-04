# Login Form Component

Este componente ha sido modernizado para usar las mejores prácticas de **Angular 20**, incluyendo:

## 🚀 Características de Angular 20 Implementadas

### 1. Signal Inputs
- `disabled`: Controla si el formulario está deshabilitado
- `showRememberMe`: Controla si mostrar la opción "Recordarme" (para futuras expansiones)

### 2. Output Events (Nueva API)
- `loginSubmit`: Emite las credenciales cuando se envía el formulario
- `forgotPassword`: Emite cuando se hace clic en "¿Olvidaste tu contraseña?"

### 3. Signals para Estado del Componente
- `isLoading`: Estado de carga del componente
- `errorMessage`: Mensaje de error global

### 4. Control Flow Moderno
- Usa `@if` en lugar de `*ngIf`
- Sintaxis más limpia y performante

### 5. Reactive Forms con Signals
- FormControls tipados estrictamente
- Signals computados para estados del formulario
- Validación reactiva mejorada

## 📝 Ejemplo de Uso

```typescript
import { Component } from '@angular/core';
import { LoginForm } from '@guiders-frontend/auth/login-form';

@Component({
  selector: 'app-login-page',
  template: `
    <guiders-login-form
      [disabled]="isProcessing()"
      (loginSubmit)="onLogin($event)"
      (forgotPassword)="onForgotPassword()"
    />
  `,
  imports: [LoginForm]
})
export class LoginPageComponent {
  isProcessing = signal(false);

  onLogin(credentials: LoginCredentials) {
    this.isProcessing.set(true);
    // Lógica de autenticación
    console.log('Credentials:', credentials);
  }

  onForgotPassword() {
    // Navegar a página de recuperación
    console.log('Forgot password clicked');
  }
}
```

## 🔧 API del Componente

### Inputs (Signals)
| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Deshabilita el formulario |
| `showRememberMe` | `boolean` | `true` | Muestra opción recordarme |

### Outputs
| Evento | Tipo | Descripción |
|--------|------|-------------|
| `loginSubmit` | `LoginCredentials` | Emitido al enviar credenciales válidas |
| `forgotPassword` | `void` | Emitido al hacer clic en recuperar contraseña |

### Métodos Públicos
| Método | Descripción |
|--------|-------------|
| `setError(message: string)` | Establece un mensaje de error |
| `setLoading(loading: boolean)` | Controla el estado de carga |

## 📦 Interface LoginCredentials

```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

## 🎨 Estilos

El componente incluye estilos CSS completamente funcionales con:
- Diseño responsive
- Estados de validación visual
- Animaciones de carga
- Tema moderno y accesible

## 🧪 Testing

El componente incluye pruebas unitarias que verifican:
- Creación del componente
- Validación de formularios
- Emisión de eventos
- Estados de carga y error

Para ejecutar las pruebas:
```bash
npx nx test login-form
```

## 🔍 Linting

Para verificar la calidad del código:
```bash
npx nx lint login-form
```
