#!/bin/bash

# Script para ejecutar todos los tests (unitarios y e2e) en los proyectos

# Colores para mejorar la legibilidad
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ejecutar tests unitarios
echo -e "${BLUE}===========================================${NC}"
echo -e "${YELLOW}=== EJECUTANDO TESTS UNITARIOS ===${NC}"
echo -e "${BLUE}===========================================${NC}"

./run-unit-tests.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests unitarios fallaron${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Tests unitarios completados correctamente${NC}"
fi

echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${YELLOW}=== EJECUTANDO TESTS E2E ===${NC}"
echo -e "${BLUE}===========================================${NC}"

# Ejecutar tests e2e
./run-e2e-tests.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests e2e fallaron${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Tests e2e completados correctamente${NC}"
fi

echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}✅ ¡TODOS LOS TESTS COMPLETADOS EXITOSAMENTE!${NC}"
echo -e "${BLUE}===========================================${NC}"

# Generar un resumen consolidado
echo -e "${YELLOW}Generando reporte consolidado...${NC}"

if [ -f "E2E-TEST-EXECUTION-REPORT.md" ]; then
    echo "El reporte E2E-TEST-EXECUTION-REPORT.md existe."
    # Aquí se podría añadir código para consolidar ambos reportes
fi

echo -e "${GREEN}✅ ¡Proceso de testing completado!${NC}"
