# Biblioteca compartida (Libs)

Este directorio contiene código compartido entre las aplicaciones Guiders y Backoffice, siguiendo principios de arquitectura hexagonal estricta.

## Estructura

- `/feature`: Módulos de características compartidas entre aplicaciones (solo dominio puro, sin Angular).
- `/shared`: Código reutilizable.

## Cambio Arquitectónico Importante

### Domain + Application en Features

Los módulos de `/libs/feature/` contienen dominio y aplicación puros:

```bash
/libs/feature/auth/
├── domain/              # Casos de uso, entidades y puertos (sin Angular/RxJS)
│   ├── entities/        # User, AuthSession, etc.
│   ├── use-cases/       # LoginUseCase, LogoutUseCase, etc.
│   └── ports/           # AuthRepositoryPort, etc.
├── application/         # Servicios y orquestadores (sin frameworks)
└── value-objects/       # Objetos de valor

/libs/feature/chat/
├── domain/              # Casos de uso, entidades y puertos (sin Angular/RxJS)
│   ├── entities/        # Message, Conversation, etc.
│   ├── use-cases/       # SendMessageUseCase, etc.
│   └── ports/           # ChatRepositoryPort, etc.
├── application/         # Servicios y orquestadores (sin frameworks)  
└── value-objects/       # Objetos de valor
```

**Los puertos** (interfaces) están dentro de la capa de dominio ya que definen los contratos que el dominio necesita de la infraestructura, sin conocer las implementaciones específicas.

### Implementaciones en Cada Aplicación

Solo las implementaciones de infraestructura están en cada app:

- **guiders/src/app/features/[feature-name]/infrastructure/**
- **backoffice/src/app/features/[feature-name]/infrastructure/**

### Domain Sin Dependencias de Infraestructura

El dominio ahora es completamente puro:

- Los casos de uso usan Promesas nativas en lugar de RxJS Observables
- Los puertos definen interfaces sin dependencias externas
- Todo el código del dominio puede ejecutarse en cualquier entorno JavaScript

## Beneficios

1. **Portabilidad**: El dominio puede ser reutilizado en aplicaciones móviles, servidores Node.js, etc.
2. **Testabilidad**: Testing más simple sin necesidad de mocks complejos de RxJS
3. **Independencia**: Cambios en frameworks no afectan la lógica de negocio
4. **Flexibilidad**: Cada aplicación puede usar su stack tecnológico preferido
5. **Sin conflictos de packages**: No hay problemas de dependencias entre libs y apps
