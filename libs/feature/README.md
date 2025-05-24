# Feature Modules

Módulos de características compartidas entre aplicaciones.

## Propósito

Aquí se incluyen módulos funcionales completos que pueden ser reutilizados entre las aplicaciones Guiders y Backoffice.

## Estructura Recomendada

Cada módulo de características debe seguir la arquitectura hexagonal:

- `/[feature-name]/domain`: Modelos y casos de uso específicos de la característica.
- `/[feature-name]/application`: Servicios, controladores y orquestadores de la característica.
- `/[feature-name]/infrastructure`: Componentes Angular, servicios de UI y adaptadores.
