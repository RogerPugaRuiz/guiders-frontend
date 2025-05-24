# Guiders

## Descripción de la Plataforma

Guiders es una aplicación profesional **diseñada específicamente para equipos comerciales**, que les permite gestionar y conectar con visitantes de sitios web en tiempo real. Esta es la plataforma que utilizan los agentes comerciales para monitorizar, interactuar y convertir a los visitantes en clientes potenciales.

La aplicación ofrece:

- **Chat en Tiempo Real**: Permite a los comerciales interactuar directamente con los visitantes mientras navegan por el sitio web, ofreciendo asistencia personalizada y resolviendo dudas al instante.

- **Seguimiento de Acciones**: Monitoriza el comportamiento y las acciones de los usuarios en el sitio web (páginas visitadas, tiempo de permanencia, interacciones con elementos), proporcionando datos valiosos para personalizar la experiencia.

- **Gestión de Leads**: Captura y organiza la información de los contactos potenciales, facilitando el seguimiento y la conversión.

- **Análisis de Interacciones**: Ofrece estadísticas y métricas detalladas sobre las interacciones, tasas de conversión y efectividad de las comunicaciones.

**Nota importante**: Esta aplicación es la interfaz del comercial/agente y no debe confundirse con el widget que se integra en los sitios web de los clientes para los visitantes finales.

Guiders transforma la forma en que las empresas conectan con sus clientes potenciales, cerrando la brecha entre la experiencia digital y la atención personalizada.

## Desarrollo

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Licencias y Atribuciones

### Lucide Icons

Este proyecto utiliza iconos de [Lucide](https://lucide.dev/), un fork de Feather Icons.

**Licencia de Lucide:**
```
The MIT License (MIT)

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Para más información sobre Lucide, visite [lucide.dev](https://lucide.dev/).

## 🔐 Sistema de Autenticación

Guiders implementa un sistema de autenticación robusto basado en **arquitectura hexagonal** que utiliza la librería compartida `@libs/feature/auth`.

### Características Principales

- **Arquitectura Hexagonal**: Separación clara entre dominio, aplicación e infraestructura
- **Inyección de Dependencias**: Tokens específicos para cada caso de uso
- **Observable Pattern**: Integración completa con RxJS
- **Gestión de Estados**: Manejo centralizado del estado de autenticación
- **Persistencia Local**: Almacenamiento seguro en localStorage
- **Interceptores HTTP**: Inyección automática de tokens de autorización

### Estructura de Implementación

```text
/guiders/src/app/
├── core/
│   ├── services/
│   │   └── auth.service.ts           # Servicio principal de autenticación
│   ├── interceptors/
│   │   └── auth.interceptor.ts       # Interceptor para tokens HTTP
│   └── guards/
│       └── auth.guard.ts             # Guard de protección de rutas
├── features/auth/infrastructure/
│   ├── repositories/
│   │   └── http-auth.repository.ts   # Implementación HTTP del repositorio
│   ├── components/
│   │   └── auth-example.component.ts # Componente de ejemplo/demostración
│   └── auth-config.providers.ts      # Configuración de inyección de dependencias
└── app.config.ts                     # Configuración principal de la aplicación
```

### Configuración

El sistema está configurado en `app.config.ts`:

```typescript
import { GUIDERS_AUTH_PROVIDERS } from './features/auth/infrastructure/auth-config.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros proveedores
    ...GUIDERS_AUTH_PROVIDERS,
  ]
};
```

### Casos de Uso Implementados

| Funcionalidad | Descripción | Endpoint |
|---------------|-------------|----------|
| **Login** | Autenticación de usuarios | `POST /api/auth/login` |
| **Logout** | Cierre de sesión | `POST /api/auth/logout` |
| **Usuario Actual** | Obtener datos del usuario autenticado | `GET /api/auth/me` |
| **Sesión Activa** | Verificar sesión activa | `GET /api/auth/session` |
| **Validar Token** | Validar token actual | `POST /api/auth/validate` |

### Ejemplo de Uso

```typescript
@Component({...})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  
  currentUser$ = this.authService.getCurrentUser();
  isAuthenticated$ = this.authService.isAuthenticated();

  async ngOnInit() {
    // Verificar autenticación
    const isAuth = await this.authService.isAuthenticated().toPromise();
    if (!isAuth) {
      // Redirigir al login
    }
  }

  async logout() {
    await this.authService.logout().toPromise();
    // Redirigir al login
  }
}
```

### Interceptor HTTP

El sistema incluye un interceptor que automáticamente:

- Añade el token de autorización a las peticiones HTTP
- Maneja la renovación automática de tokens
- Gestiona errores de autenticación (401, 403)
- Redirige al login cuando es necesario

### Guards de Protección

```typescript
// Proteger rutas que requieren autenticación
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard]
}
```

### Almacenamiento Local

El sistema utiliza localStorage con prefijos específicos:

- `guiders_auth_token`: Token de acceso
- `guiders_auth_refresh_token`: Token de renovación  
- `guiders_auth_user`: Datos del usuario actual
- `guiders_auth_session`: Información de sesión

### Manejo de Errores

El sistema gestiona diferentes tipos de errores:

- **ValidationError**: Errores de validación de campos
- **AuthenticationError**: Credenciales inválidas
- **SessionExpiredError**: Sesión expirada
- **UnauthorizedError**: Acceso no autorizado

### Componente de Demostración

Incluye un componente de ejemplo (`AuthExampleComponent`) que demuestra:

- Estado de autenticación en tiempo real
- Información del usuario actual
- Validación de tokens
- Manejo de errores
- Interfaz de usuario reactiva

Para más detalles sobre la implementación, consulte la [documentación de la librería auth](../libs/feature/auth/README.md).
