# Domain

Este directorio implementa el núcleo de la lógica de negocio siguiendo los principios de arquitectura hexagonal.

## Contenido

- `/entities`: Modelos y entidades de dominio puras.
- `/use-cases`: Reglas de negocio e interacciones específicas.
- `/ports`: Interfaces que definen cómo el dominio interactúa con el mundo exterior.
- `/value-objects`: Objetos de valor inmutables.

## Principios clave

- **Independencia de frameworks**: El código aquí debe ser independiente de Angular o cualquier otro framework.
- **Reglas de negocio centralizadas**: Toda la lógica de negocio reside aquí.
- **Inversión de dependencias**: Las capas externas dependen de esta capa, no al revés.
