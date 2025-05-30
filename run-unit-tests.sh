#!/bin/bash

# Script para ejecutar solo los tests unitarios en los proyectos

# Colores para mejorar la legibilidad
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Ejecutando tests unitarios para el proyecto Guiders ===${NC}"
cd /home/runner/work/guiders-frontend/guiders-frontend/guiders && npx jest --no-cache
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests unitarios de Guiders fallaron${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Tests unitarios de Guiders completados correctamente${NC}"
fi

echo -e "${YELLOW}=== Ejecutando tests unitarios para el proyecto Backoffice ===${NC}"
cd /home/runner/work/guiders-frontend/guiders-frontend/backoffice && npx jest --no-cache
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests unitarios de Backoffice fallaron${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Tests unitarios de Backoffice completados correctamente${NC}"
fi

echo -e "${GREEN}✅ ¡Todos los tests unitarios completados correctamente!${NC}"