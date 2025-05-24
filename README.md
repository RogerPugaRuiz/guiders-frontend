# Guiders Frontend

Este repositorio contiene dos aplicaciones Angular en una estructura de monorepo:

## Sobre la Plataforma

Guiders es una plataforma innovadora diseñada para equipos comerciales, permitiéndoles conectar y gestionar a visitantes de sitios web en tiempo real. Esta herramienta profesional es utilizada por los agentes comerciales para monitorizar la actividad de los visitantes, interactuar con ellos y convertirlos en leads cualificados.

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

La carpeta `libs` contiene código reutilizable entre ambas aplicaciones, siguiendo principios de arquitectura hexagonal:

- **[Domain](/libs/domain/README.md)**: El núcleo de la aplicación con entidades, casos de uso y puertos.
- **[Data Access](/libs/data-access/README.md)**: Implementaciones concretas de repositorios y servicios de datos.
- **[Feature](/libs/feature/README.md)**: Módulos funcionales completos compartidos.
- **[UI](/libs/ui/README.md)**: Componentes de UI reutilizables organizados siguiendo principios de diseño atómico.
- **[Utils](/libs/utils/README.md)**: Utilidades, helpers y funciones comunes.

### Principios Arquitectónicos

1. **Independencia de frameworks**: La lógica de negocio es independiente de Angular o cualquier otro framework.
2. **Dependencias hacia el interior**: Las capas externas dependen de las internas, no al revés.
3. **Separación clara de responsabilidades**: Cada directorio tiene una responsabilidad única y claramente definida.
4. **Reutilización de código**: Componentes y módulos diseñados para ser compartidos entre aplicaciones.
5. **Testabilidad**: Estructura que facilita la escritura de pruebas unitarias y e2e.

Para más detalles sobre cada módulo compartido, consulta los README específicos en cada carpeta de la biblioteca.
