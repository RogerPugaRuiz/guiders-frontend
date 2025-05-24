# Feature Auth - Guiders

Esta feature contiene toda la funcionalidad relacionada con autenticación de usuarios en Guiders.

## 📁 Estructura

```
auth/
├── infrastructure/
│   ├── components/
│   │   └── login.component.*     # Componente de inicio de sesión
│   ├── repositories/
│   │   └── http-auth.repository.ts
│   └── auth-config.providers.ts
├── index.ts                      # Barrel exports
└── README.md                     # Este archivo
```

## 🎯 Componentes

### LoginComponent

Componente standalone que maneja el inicio de sesión de usuarios.

**Características:**
- ✅ Formulario reactivo con validaciones
- ✅ Manejo de errores específicos del dominio
- ✅ UI moderna y responsive
- ✅ Animaciones y estados de carga
- ✅ Integración con la arquitectura hexagonal

**Ubicación:** `infrastructure/components/login.component.*`

**Ruta:** `/auth/login`

## 🔧 Configuración

La feature utiliza la arquitectura hexagonal implementada en `@libs/feature/auth`:

- **Casos de uso:** Login, logout, validación de tokens, etc.
- **Repositorio:** Implementación HTTP para la API
- **Entidades:** User, AuthSession, LoginCredentials, etc.

## 🚀 Uso

El componente login se carga automáticamente en la ruta `/auth/login` y también es accesible desde `/login` (redirect por compatibilidad).

### Importación

```typescript
import { LoginComponent } from './features/auth';
```

### Navegación

```typescript
this.router.navigate(['/auth/login']);
```

## 📋 Próximos Pasos

- [ ] Agregar componente de registro
- [ ] Implementar recuperación de contraseña
- [ ] Agregar autenticación con proveedores externos (Google, GitHub, etc.)
- [ ] Implementar componente de perfil de usuario
