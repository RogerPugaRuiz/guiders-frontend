# Feature Auth - Implementación de Autenticación con Arquitectura Hexagonal

Esta implementación sigue la **arquitectura hexagonal estricta**, separando claramente las capas de dominio, aplicación e infraestructura. Los tokens de inyección de dependencias están definidos en la aplicación específica (Guiders), no en la librería.

## 🏗️ Arquitectura

### Principios Aplicados

- **Separación de responsabilidades**: Cada capa tiene un propósito específico
- **Inversión de dependencias**: El dominio no depende de la infraestructura
- **Independencia de frameworks**: La lógica de negocio es agnóstica a Angular
- **Testabilidad**: Fácil mockeo e inyección de dependencias
- **Reutilización**: La librería puede usarse en diferentes aplicaciones

## 📁 Estructura

```text
/libs/feature/auth/
├── domain/                          # Capa de Dominio (lógica de negocio pura)
│   ├── entities/                    # Entidades de dominio
│   │   ├── user.entity.ts          # User, AuthSession, LoginCredentials, AuthResponse
│   │   └── auth-error.entity.ts    # Errores específicos del dominio
│   └── ports/                       # Interfaces/Contratos
│       └── auth-repository.port.ts # Interface del repositorio (Puerto)
├── application/                     # Capa de Aplicación (casos de uso)
│   └── use-cases/                   # Casos de uso del dominio
│       ├── login.use-case.ts
│       ├── logout.use-case.ts
│       ├── get-current-user.use-case.ts
│       ├── get-session.use-case.ts
│       ├── is-authenticated.use-case.ts
│       └── validate-token.use-case.ts
└── index.ts                        # Barrel exports

/guiders/src/app/features/auth/      # Implementación específica de Guiders
└── infrastructure/                  # Capa de Infraestructura (Angular)
    ├── repositories/
    │   └── http-auth.repository.ts  # Implementación HTTP del repositorio
    ├── auth-config.providers.ts     # Configuración de proveedores Angular
    └── index.ts                     # Barrel exports
```

## 🔧 Implementación de Casos de Uso

### Casos de Uso Disponibles

| Caso de Uso | Descripción | Entrada | Salida |
|-------------|-------------|---------|--------|
| `LoginUseCase` | Autenticar usuario | `LoginCredentials` | `AuthResponse` |
| `LogoutUseCase` | Cerrar sesión | - | `void` |
| `GetCurrentUserUseCase` | Obtener usuario actual | - | `User \| null` |
| `GetSessionUseCase` | Obtener sesión actual | - | `AuthSession \| null` |
| `IsAuthenticatedUseCase` | Verificar autenticación | - | `boolean` |
| `ValidateTokenUseCase` | Validar token actual | - | `boolean` |

### Entidades de Dominio

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthSession {
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  user: User;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  session?: AuthSession;
  message?: string;
}
```

## 🚀 Configuración e Implementación

### 1. Configuración en app.config.ts

```typescript
import { GUIDERS_AUTH_PROVIDERS } from './features/auth/infrastructure/auth-config.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros proveedores
    ...GUIDERS_AUTH_PROVIDERS,
  ]
};
```

### 2. Configuración de Tokens de Inyección

En `auth-config.providers.ts` (aplicación específica):

```typescript
// Tokens de inyección para los casos de uso
export const LOGIN_USE_CASE_TOKEN = new InjectionToken<LoginUseCase>('LoginUseCase');
export const LOGOUT_USE_CASE_TOKEN = new InjectionToken<LogoutUseCase>('LogoutUseCase');
export const GET_CURRENT_USER_USE_CASE_TOKEN = new InjectionToken<GetCurrentUserUseCase>('GetCurrentUserUseCase');
export const GET_SESSION_USE_CASE_TOKEN = new InjectionToken<GetSessionUseCase>('GetSessionUseCase');
export const IS_AUTHENTICATED_USE_CASE_TOKEN = new InjectionToken<IsAuthenticatedUseCase>('IsAuthenticatedUseCase');
export const VALIDATE_TOKEN_USE_CASE_TOKEN = new InjectionToken<ValidateTokenUseCase>('ValidateTokenUseCase');

// Configuración de proveedores
export const GUIDERS_AUTH_PROVIDERS: Provider[] = [
  {
    provide: AUTH_REPOSITORY_TOKEN,
    useClass: HttpAuthRepository
  },
  {
    provide: LOGIN_USE_CASE_TOKEN,
    useFactory: (repo: AuthRepositoryPort) => new LoginUseCase(repo),
    deps: [AUTH_REPOSITORY_TOKEN]
  },
  // ... otros use cases
];
```

### 3. Inyección Directa en AuthService

```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUseCase: LoginUseCase = inject(LOGIN_USE_CASE_TOKEN);
  private logoutUseCase: LogoutUseCase = inject(LOGOUT_USE_CASE_TOKEN);
  private getCurrentUserUseCase: GetCurrentUserUseCase = inject(GET_CURRENT_USER_USE_CASE_TOKEN);
  private getSessionUseCase: GetSessionUseCase = inject(GET_SESSION_USE_CASE_TOKEN);
  private isAuthenticatedUseCase: IsAuthenticatedUseCase = inject(IS_AUTHENTICATED_USE_CASE_TOKEN);
  private validateTokenUseCase: ValidateTokenUseCase = inject(VALIDATE_TOKEN_USE_CASE_TOKEN);

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(this.loginUseCase.execute(credentials));
  }

  logout(): Observable<void> {
    return from(this.logoutUseCase.execute());
  }

  getCurrentUser(): Observable<User | null> {
    return from(this.getCurrentUserUseCase.execute());
  }

  // ... otros métodos
}
```

### 4. Uso en Componentes

```typescript
@Component({
  selector: 'app-auth-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-example">
      <div class="user-info" *ngIf="currentUser">
        <h4>Usuario Actual:</h4>
        <p>Email: {{ currentUser.email }}</p>
        <p>Nombre: {{ currentUser.name }}</p>
        <p>Rol: {{ currentUser.role }}</p>
      </div>
      
      <div class="auth-status">
        <p>Autenticado: {{ isAuthenticated ? 'Sí' : 'No' }}</p>
        <p>Token válido: {{ isTokenValid ? 'Sí' : 'No' }}</p>
      </div>
      
      <div class="actions">
        <button (click)="refreshUserData()" [disabled]="loading">
          {{ loading ? 'Cargando...' : 'Actualizar Datos' }}
        </button>
        <button (click)="logout()" [disabled]="loading">
          Cerrar Sesión
        </button>
      </div>
    </div>
  `
})
export class AuthExampleComponent implements OnInit {
  private authService = inject(AuthService);
  
  currentUser: User | null = null;
  isAuthenticated = false;
  isTokenValid = false;
  loading = false;
  async loadAuthData() {
    this.loading = true;
    try {
      const [user, authenticated, tokenValid] = await Promise.all([
        this.authService.getCurrentUser().toPromise(),
        this.authService.isAuthenticated().toPromise(),
        this.authService.validateToken().toPromise()
      ]);
      
      this.currentUser = user || null;
      this.isAuthenticated = authenticated || false;
      this.isTokenValid = tokenValid || false;
    } catch (error: any) {
      this.error = error.message || 'Error al cargar datos';
    } finally {
      this.loading = false;
    }
  }
}
```

## 💡 Beneficios de esta Arquitectura

### 1. **Inversión de Dependencias**

- El dominio define interfaces (puertos) que la infraestructura implementa
- Los casos de uso dependen de abstracciones, no de implementaciones concretas

### 2. **Portabilidad**

- El dominio y aplicación son independientes de Angular/RxJS
- Pueden reutilizarse en aplicaciones móviles, Node.js, etc.

### 3. **Testabilidad**

- Los casos de uso se pueden testear con mocks simples
- No requieren mocks complejos de Angular o RxJS

### 4. **Flexibilidad de Implementación**

- Cada aplicación (Guiders, Backoffice) puede tener su propia implementación
- Fácil intercambio de implementaciones (HTTP, WebSocket, etc.)

### 5. **Separación Clara de Responsabilidades**

- **Dominio**: Reglas de negocio y validaciones
- **Aplicación**: Casos de uso específicos
- **Infraestructura**: Detalles técnicos (HTTP, localStorage, etc.)

## 🎯 Implementación por Aplicación

### Guiders

- `HttpAuthRepository`: Implementación HTTP con localStorage
- Endpoints: `/api/auth/*`
- Prefijos de almacenamiento: `guiders_*`
- Tokens de inyección definidos en `auth-config.providers.ts`

### Backoffice (futuro)

- Podría tener su propia implementación con diferentes endpoints
- Diferentes estrategias de almacenamiento
- Lógica específica para el backoffice
- Sus propios tokens de inyección

## ⚠️ Manejo de Errores

La implementación incluye errores específicos del dominio:

- `AuthenticationError`: Credenciales inválidas
- `ValidationError`: Errores de validación de campos
- `SessionExpiredError`: Sesión expirada
- `UnauthorizedError`: Acceso no autorizado

## 🔄 Casos de Uso Implementados

### 1. LoginUseCase

**Validaciones de dominio incluidas:**

- Email requerido y formato válido
- Contraseña requerida (mínimo 6 caracteres)
- Delegación al repositorio para autenticación

### 2. LogoutUseCase

- Limpieza de sesión y tokens
- Notificación al servidor si es necesario

### 3. GetCurrentUserUseCase

- Obtención del usuario desde la sesión actual
- Manejo de casos donde no hay usuario autenticado

### 4. GetSessionUseCase

- Gestión de sesiones activas
- Verificación de validez de sesión

### 5. IsAuthenticatedUseCase

- Verificación rápida de estado de autenticación
- Útil para guards y componentes

### 6. ValidateTokenUseCase

- Validación de tokens con el servidor
- Manejo de tokens expirados

## 📋 Próximos Pasos

1. **Testing**: Implementar tests unitarios para casos de uso
2. **Refresh Token**: Implementar lógica automática de renovación
3. **Interceptor**: El AuthInterceptor ya está actualizado
4. **Guards**: El AuthGuard ya es compatible
5. **Backoffice**: Crear implementación específica para Backoffice
6. **Documentación API**: Documentar endpoints esperados
7. **Validaciones avanzadas**: Añadir más validaciones de dominio

## 🔍 Ejemplo de Flujo Completo

```text
Component → AuthService → LoginUseCase → AuthRepositoryPort → HttpAuthRepository → API Backend
                                    ↓
                             Domain Validations
                                    ↓
                         (Email format + Password length)
                                    ↓
                          AuthResponse → AuthSession → localStorage
```

## 📚 Referencias

- [Arquitectura Hexagonal (Ports & Adapters)](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection in Angular](https://angular.io/guide/dependency-injection)
