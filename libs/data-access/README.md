# Data Access

Esta carpeta contiene adaptadores para acceder a fuentes de datos externas.

## Contenido

- `/api`: Servicios que se comunican con APIs externas.
- `/adapters`: Adaptadores que implementan los puertos definidos en el dominio.
- `/repositories`: Implementaciones concretas de los repositorios.
- `/mappers`: Funciones para mapear datos entre el dominio y fuentes externas.

## Principios clave

- **Adaptadores**: Implementan interfaces (puertos) definidos en la capa de dominio.
- **Mappers**: Traducen entre estructuras de datos externas y entidades de dominio.
- **Desacoplamiento**: Aíslan la lógica de negocio de los detalles de implementación de datos.
