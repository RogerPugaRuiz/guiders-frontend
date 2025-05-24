# Guiders Frontend

Este repositorio contiene dos aplicaciones Angular en una estructura de monorepo:

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
Aplicación principal para los usuarios finales.

Para ejecutar el proyecto individualmente:
```bash
cd guiders
npm start
```

## Backoffice
Aplicación de administración.

Para ejecutar el proyecto individualmente:
```bash
cd backoffice
npm start
```