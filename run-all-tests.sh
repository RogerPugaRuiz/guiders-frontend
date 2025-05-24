#!/bin/bash

# Script para ejecutar todos los tests (unitarios y e2e) en los proyectos

# Colores para mejorar la legibilidad
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Ejecutando tests unitarios para el proyecto Guiders ===${NC}"
npm run test:jest:guiders
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests unitarios de Guiders fallaron${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Tests unitarios de Guiders completados correctamente${NC}"
fi

echo -e "${YELLOW}=== Ejecutando tests unitarios para el proyecto Backoffice ===${NC}"
npm run test:jest:backoffice
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests unitarios de Backoffice fallaron${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Tests unitarios de Backoffice completados correctamente${NC}"
fi

# Iniciar el servidor de Guiders en segundo plano
echo -e "${YELLOW}=== Iniciando servidor de Guiders para tests e2e ===${NC}"
cd guiders && npm start &
GUIDERS_PID=$!
cd ..

# Esperar a que el servidor esté disponible
echo "Esperando a que el servidor de Guiders esté disponible..."
npx wait-on http://localhost:4200 --timeout 60000

# Ejecutar tests e2e de Guiders
echo -e "${YELLOW}=== Ejecutando tests e2e para el proyecto Guiders ===${NC}"
npm run test:cypress:headless:guiders
if [ $? -ne 0 ]; then
    # Detener el servidor
    kill $GUIDERS_PID
    echo -e "${RED}❌ Tests e2e de Guiders fallaron${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Tests e2e de Guiders completados correctamente${NC}"
fi

# Detener el servidor de Guiders
kill $GUIDERS_PID

# Iniciar el servidor de Backoffice en segundo plano
echo -e "${YELLOW}=== Iniciando servidor de Backoffice para tests e2e ===${NC}"
cd backoffice && npm start &
BACKOFFICE_PID=$!
cd ..

# Esperar a que el servidor esté disponible
echo "Esperando a que el servidor de Backoffice esté disponible..."
npx wait-on http://localhost:4201 --timeout 60000

# Ejecutar tests e2e de Backoffice
echo -e "${YELLOW}=== Ejecutando tests e2e para el proyecto Backoffice ===${NC}"
npm run test:cypress:headless:backoffice
if [ $? -ne 0 ]; then
    # Detener el servidor
    kill $BACKOFFICE_PID
    echo -e "${RED}❌ Tests e2e de Backoffice fallaron${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Tests e2e de Backoffice completados correctamente${NC}"
fi

# Detener el servidor de Backoffice
kill $BACKOFFICE_PID

echo -e "${GREEN}✅ ¡Todos los tests completados correctamente!${NC}"
