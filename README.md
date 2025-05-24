# Guiders Frontend

Este repositorio contiene dos aplicaciones Angular en una estructura de monorepo:

## Sobre la Plataforma

Guiders es una plataform### Arquitectura de Features

Las características complejas (auth, chat, etc.) se organizan en `/libs/feature/` con **dominio + aplicación puros**, sin dependencias de frameworks.

**Características principales:**

- **Chat en Tiempo Real**: Permite a los comerciales interactuar directamente con los visitantes mientras navegan por el sitio web.
- **Seguimiento de Acciones**: Monitoriza el comportamiento y las acciones de los usuarios, proporcionando datos valiosos para personalizar la experiencia.
- **Gestión de Leads**: Captura y organiza la información de contactos potenciales para facilitar su seguimiento.
- **Analítica Avanzada**: Proporciona estadísticas y métricas detalladas sobre las interacciones y conversiones.

Esta plataforma transforma la manera en que las empresas conectan con sus clientes potenciales al proporcionar una experiencia personalizada basada en el comportamiento en tiempo real de los visitantes.

## Gestión centralizada

Este proyecto utiliza un sistema de scripts centralizados que te permite gestionar ambos proyectos desde la raíz:

```bash
# Instalar todas las dependencias
npm run install:all

# Iniciar aplicaciones
npm run start:guiders
npm run start:backoffice

# Construir aplicaciones
npm run build:guiders
npm run build:backoffice

# Ejecutar tests
npm run test:guiders
npm run test:backoffice

# Ejecutar linting
npm run lint:guiders
npm run lint:backoffice
```

## Guiders

Aplicación principal utilizada por los equipos comerciales para gestionar y conectar con los visitantes de sitios web. Proporciona una interfaz profesional que permite a los agentes monitorizar la actividad de los usuarios, comunicarse mediante chat en tiempo real y convertir visitantes en leads cualificados.

Para ejecutar el proyecto individualmente:

```bash
cd guiders
npm start
```

## Backoffice

Aplicación de administración para configurar y gestionar el sistema Guiders. Permite a los administradores configurar equipos comerciales, analizar el rendimiento global, gestionar integraciones y personalizar el comportamiento de la plataforma.

Para ejecutar el proyecto individualmente:

```bash
cd backoffice
npm start
```

## Arquitectura del Proyecto

El proyecto está estructurado siguiendo los principios de la **Arquitectura Hexagonal** (también conocida como Puertos y Adaptadores), lo que permite una clara separación de responsabilidades y un alto nivel de desacoplamiento entre componentes.

### Estructura de Carpetas

```bash
guiders-frontend/
├── guiders/          # Aplicación principal para usuarios finales
├── backoffice/       # Aplicación de administración
└── libs/             # Código compartido entre aplicaciones
    ├── domain/       # Entidades de dominio y casos de uso
    ├── data-access/  # Adaptadores y repositorios
    ├── feature/      # Módulos de características compartidas
    ├── ui/           # Componentes de UI reutilizables
    └── utils/        # Utilidades compartidas
```

### Estructura Interna de las Aplicaciones

#### Aplicación Guiders

La aplicación principal para usuarios finales sigue una estructura por funcionalidades:

```bash
guiders/
├── angular.json         # Configuración del proyecto Angular
├── package.json         # Dependencias y scripts del proyecto
├── tsconfig.json        # Configuración de TypeScript
├── cypress/             # Tests end-to-end con Cypress
├── public/              # Archivos estáticos públicos
└── src/                 # Código fuente de la aplicación
    ├── app/             # Componentes y módulos principales
    │   ├── features/    # Componentes organizados por funcionalidad
    │   │   ├── guides/  # Funcionalidad relacionada con guías
    │   │   ├── profile/ # Gestión de perfiles
    │   │   └── search/  # Funcionalidad de búsqueda
    │   ├── core/        # Servicios, guardias y modelos centrales
    │   │   ├── auth/    # Autenticación y autorización
    │   │   ├── http/    # Interceptores HTTP y configuración
    │   │   └── layout/  # Componentes de diseño base
    │   └── shared/      # Componentes compartidos específicos
    │       ├── components/ # Componentes reutilizables
    │       └── directives/ # Directivas reutilizables
    ├── assets/          # Recursos estáticos (imágenes, fuentes)
    └── environments/    # Configuración por entorno
```

#### Aplicación Backoffice

La aplicación de administración sigue una estructura similar, pero enfocada en funcionalidades administrativas:

```bash
backoffice/
├── angular.json         # Configuración del proyecto Angular
├── package.json         # Dependencias y scripts del proyecto
├── tsconfig.json        # Configuración de TypeScript
├── cypress/             # Tests end-to-end con Cypress
├── public/              # Archivos estáticos públicos
└── src/                 # Código fuente de la aplicación
    ├── app/             # Componentes y módulos principales
    │   ├── features/    # Componentes organizados por funcionalidad
    │   │   ├── dashboard/    # Panel de control principal
    │   │   ├── user-management/ # Gestión de usuarios
    │   │   ├── content-manager/ # Gestión de contenidos
    │   │   └── analytics/    # Estadísticas y reportes
    │   ├── core/        # Servicios, guardias y modelos centrales
    │   │   ├── auth/    # Autenticación y autorización
    │   │   ├── http/    # Interceptores HTTP y configuración
    │   │   └── layout/  # Componentes de diseño base
    │   └── shared/      # Componentes compartidos específicos
    │       ├── components/ # Componentes reutilizables
    │       └── directives/ # Directivas reutilizables
    ├── assets/          # Recursos estáticos (imágenes, fuentes)
    └── environments/    # Configuración por entorno
```

### Bibliotecas Compartidas (libs)

La carpeta `libs` contiene código reutilizable entre ambas aplicaciones, siguiendo principios de arquitectura hexagonal estricta:

- **[Domain](/libs/domain/README.md)**: El núcleo puro de la aplicación con entidades, casos de uso y puertos (sin dependencias de infraestructura como RxJS).
- **[Data Access](/libs/data-access/README.md)**: Configuraciones y utilidades compartidas para acceso a datos (los adaptadores están en cada app).
- **[Feature](/libs/feature/README.md)**: Módulos funcionales de dominio compartidos (sin Angular/RxJS).
- **[UI](/libs/ui/README.md)**: Componentes de UI reutilizables organizados siguiendo principios de diseño atómico.
- **[Utils](/libs/utils/README.md)**: Utilidades, helpers y funciones comunes.

### Arquitectura de Features

Para características complejas (auth, chat, etc.), el dominio + aplicación puros se ubican en `/libs/feature/`:

```bash
/libs/feature/auth/          # Dominio + Aplicación puros
├── domain/                  # Entidades, casos de uso y puertos (interfaces)
├── application/             # Servicios y orquestadores (sin frameworks)
└── value-objects/           # Objetos de valor

/libs/feature/chat/          # Dominio + Aplicación puros  
├── domain/                  # Entidades, casos de uso y puertos (interfaces)
├── application/             # Servicios y orquestadores (sin frameworks)
└── value-objects/           # Objetos de valor
```

### Implementaciones por Aplicación

Solo las implementaciones de infraestructura están en cada aplicación:

```bash
# Guiders
/guiders/src/app/features/auth/
├── infrastructure/          # Componentes y adaptadores Angular
└── index.ts

# Backoffice
/backoffice/src/app/features/auth/  
├── infrastructure/          # Componentes y adaptadores Angular
└── index.ts
```

### Principios Arquitectónicos

1. **Independencia total de frameworks**: La lógica de negocio (domain) es completamente independiente de Angular, RxJS o cualquier framework.
2. **Dependencias hacia el interior**: Las capas externas dependen de las internas, no al revés.
3. **Separación estricta de responsabilidades**: Domain puro, adaptadores por app, bibliotecas compartidas solo para código reutilizable.
4. **Adaptadores específicos por contexto**: Cada aplicación implementa sus propios adaptadores según sus necesidades específicas.
5. **Reutilización cross-platform**: El dominio puede ser reutilizado en cualquier plataforma sin modificaciones.
6. **Testabilidad**: Estructura que facilita la escritura de pruebas unitarias y e2e con mocks simples.

Para más detalles sobre cada módulo compartido, consulta los README específicos en cada carpeta de la biblioteca.

## 🔐 Sistema de Autenticación con Arquitectura Hexagonal

El proyecto implementa un sistema de autenticación robusto siguiendo **arquitectura hexagonal estricta**, con dominio y aplicación completamente puros e implementaciones específicas por aplicación.

### Estructura de Autenticación

```text
/libs/feature/auth/                  # ⚡ Dominio + Aplicación puros
├── domain/                          # Entidades y puertos (sin frameworks)
│   ├── entities/
│   │   ├── user.entity.ts          # User, AuthSession, LoginCredentials
│   │   └── auth-error.entity.ts    # Errores específicos del dominio
│   └── ports/
│       └── auth-repository.port.ts # Interface del repositorio (Puerto)
└── application/                     # Casos de uso puros (sin Angular/RxJS)
    └── use-cases/
        ├── login.use-case.ts
        ├── logout.use-case.ts
        ├── get-current-user.use-case.ts
        ├── get-session.use-case.ts
        ├── is-authenticated.use-case.ts
        └── validate-token.use-case.ts

/guiders/src/app/features/auth/      # 🎯 Implementación Guiders
└── infrastructure/
    ├── repositories/
    │   └── http-auth.repository.ts  # Implementación HTTP específica
    ├── components/
    │   └── auth-example.component.ts # Componente demo/ejemplo
    └── auth-config.providers.ts     # Tokens de inyección Guiders

/backoffice/src/app/features/auth/   # 🎯 Implementación Backoffice (futuro)
└── infrastructure/
    ├── repositories/
    │   └── admin-auth.repository.ts # Implementación específica admin
    └── auth-config.providers.ts     # Tokens de inyección Backoffice
```

### Características Principales

- **Dominio Puro**: Sin dependencias de Angular, RxJS o cualquier framework
- **Casos de Uso Independientes**: Cada funcionalidad es un caso de uso específico
- **Tokens por Aplicación**: Los tokens de inyección están definidos en cada app
- **Implementaciones Específicas**: Cada aplicación puede tener sus propios adapters
- **Validaciones de Dominio**: Reglas de negocio en el dominio (email válido, password mínimo, etc.)
- **Manejo de Errores Tipados**: Errores específicos del dominio
- **Portabilidad Total**: El dominio puede usarse en móvil, Node.js, etc.

### Flujo de Arquitectura

```text
Component (Angular) → AuthService → LoginUseCase (Pure) → AuthRepositoryPort → HttpAuthRepository → API
                                           ↓
                                    Domain Validations
                                           ↓
                               (Email format + Password length)
                                           ↓
                                  AuthResponse → AuthSession
```

### Casos de Uso Implementados

| Caso de Uso | Responsabilidad | Validaciones |
|-------------|-----------------|--------------|
| `LoginUseCase` | Autenticar usuario | Email válido, password mínimo 6 chars |
| `LogoutUseCase` | Cerrar sesión | Limpieza de tokens y estado |
| `GetCurrentUserUseCase` | Obtener usuario actual | Verificación de sesión válida |
| `GetSessionUseCase` | Gestión de sesiones | Validación de expiración |
| `IsAuthenticatedUseCase` | Estado de autenticación | Verificación rápida |
| `ValidateTokenUseCase` | Validar token | Comunicación con servidor |

### Implementación en Guiders

```typescript
// Configuración en app.config.ts
import { GUIDERS_AUTH_PROVIDERS } from './features/auth/infrastructure/auth-config.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    ...GUIDERS_AUTH_PROVIDERS, // Incluye todos los tokens y factories
  ]
};

// AuthService usando inyección directa de casos de uso
@Injectable({ providedIn: 'root' })
export class AuthService {
  private loginUseCase = inject(LOGIN_USE_CASE_TOKEN);
  private logoutUseCase = inject(LOGOUT_USE_CASE_TOKEN);
  // ... otros use cases

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(this.loginUseCase.execute(credentials)); // Pure → Observable
  }
}
```

### Tokens de Inyección por Aplicación

**Guiders** (`auth-config.providers.ts`):
```typescript
export const LOGIN_USE_CASE_TOKEN = new InjectionToken<LoginUseCase>('LoginUseCase');
export const LOGOUT_USE_CASE_TOKEN = new InjectionToken<LogoutUseCase>('LogoutUseCase');
// ... otros tokens

export const GUIDERS_AUTH_PROVIDERS: Provider[] = [
  { provide: AUTH_REPOSITORY_TOKEN, useClass: HttpAuthRepository },
  { provide: LOGIN_USE_CASE_TOKEN, useFactory: createLoginUseCase, deps: [AUTH_REPOSITORY_TOKEN] },
  // ... otros providers
];
```

**Backoffice** (futuro - tendrá sus propios tokens):
```typescript
export const ADMIN_LOGIN_USE_CASE_TOKEN = new InjectionToken<LoginUseCase>('AdminLoginUseCase');
// ... tokens específicos para admin

export const BACKOFFICE_AUTH_PROVIDERS: Provider[] = [
  { provide: AUTH_REPOSITORY_TOKEN, useClass: AdminAuthRepository }, // Diferente implementación
  // ... providers específicos
];
```

### Beneficios de esta Arquitectura

1. **🔄 Reutilización Total**: El dominio funciona en cualquier plataforma
2. **🧪 Testabilidad**: Tests simples sin mocks complejos de Angular
3. **🔧 Flexibilidad**: Cada app puede tener implementaciones diferentes
4. **📦 Separación Clara**: Dominio, aplicación e infraestructura bien definidos
5. **🚀 Evolución**: Fácil añadir nuevas funcionalidades sin romper existentes
6. **🎯 Especialización**: Guiders para usuarios, Backoffice para administradores

Para más detalles, consulta:
- [Documentación completa de Auth](/libs/feature/auth/README.md)
- [Implementación específica de Guiders](/guiders/README.md#-sistema-de-autenticación)
