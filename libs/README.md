# Biblioteca compartida (Libs)

Este directorio contiene código compartido entre las aplicaciones Guiders y Backoffice, siguiendo principios de arquitectura hexagonal.

## Estructura

- `/domain`: Contiene entidades, modelos de dominio y casos de uso puros. Es la capa más interna y no debe depender de frameworks externos.
- `/data-access`: Implementaciones concretas de repositorios y servicios de acceso a datos (adaptadores).
- `/feature`: Módulos de características compartidas entre aplicaciones.
- `/ui`: Componentes de UI reutilizables.
- `/utils`: Utilidades, helpers y funciones comunes.
