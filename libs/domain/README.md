# Domain

Este directorio implementa el núcleo de la lógica de negocio siguiendo los principios de arquitectura hexagonal estricta.

## Contenido

- `/entities`: Modelos y entidades de dominio puras.
- `/use-cases`: Reglas de negocio e interacciones específicas (sin dependencias de infraestructura).
- `/ports`: Interfaces que definen cómo el dominio interactúa con el mundo exterior (sin RxJS).
- `/value-objects`: Objetos de valor inmutables.

**Nota sobre Puertos**: Los puertos (interfaces) son parte de la capa de dominio en la arquitectura hexagonal. Definen los contratos que el dominio necesita de la infraestructura, pero no conocen las implementaciones específicas.

## Principios clave

- **Independencia total de frameworks**: El código aquí debe ser completamente independiente de Angular, RxJS o cualquier otro framework de infraestructura.
- **Sin dependencias de infraestructura**: Los casos de uso y puertos no pueden usar RxJS, HTTP, etc. Solo JavaScript/TypeScript puro.
- **Reglas de negocio centralizadas**: Toda la lógica de negocio reside aquí usando promesas nativas o callbacks.
- **Inversión de dependencias**: Las capas externas (adaptadores en cada app) implementan los puertos definidos aquí.
- **Reutilización cross-platform**: Este código puede ser reutilizado en cualquier plataforma (web, mobile, server) sin modificaciones.

## Arquitectura de Features

Para características complejas como auth, chat, etc., el dominio y aplicación se organizan por feature en `/libs/feature/[feature-name]/`:

```bash
/libs/feature/auth/           # Dominio + Aplicación puros
├── domain/                   # Entidades y puertos específicos de auth
└── application/              # Servicios y orquestadores (sin frameworks)

/libs/feature/chat/           # Dominio + Aplicación puros  
├── domain/                   # Entidades y puertos específicos de chat
└── application/              # Servicios y orquestadores (sin frameworks)
```

Solo las implementaciones de infraestructura están en cada aplicación:

```bash
/guiders/src/app/features/auth/
├── infrastructure/           # Componentes y adaptadores Angular
└── index.ts

/backoffice/src/app/features/auth/  
├── infrastructure/           # Componentes y adaptadores Angular
└── index.ts
```
