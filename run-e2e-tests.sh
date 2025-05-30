#!/bin/bash

# Script para ejecutar los tests e2e en los proyectos

# Colores para mejorar la legibilidad
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si Cypress está instalado
if ! command -v cypress &>/dev/null; then
    echo -e "${RED}❌ Cypress no está instalado. Intentando instalar...${NC}"
    
    # Intentar instalar Cypress en guiders
    echo -e "${YELLOW}=== Instalando Cypress en el proyecto Guiders ===${NC}"
    cd /home/runner/work/guiders-frontend/guiders-frontend/guiders
    npm install cypress --save-dev
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ No se pudo instalar Cypress. Verificando el error...${NC}"
        
        # Ejecutar el script de análisis
        echo -e "${YELLOW}=== Ejecutando análisis de tests e2e ===${NC}"
        cd /home/runner/work/guiders-frontend/guiders-frontend
        ./analyze-e2e-tests.sh
        exit 1
    fi
fi

# Iniciar el servidor de Guiders en segundo plano
echo -e "${YELLOW}=== Iniciando servidor de Guiders para tests e2e ===${NC}"
cd /home/runner/work/guiders-frontend/guiders-frontend/guiders
npm start &
GUIDERS_PID=$!
cd ..

# Esperar a que el servidor esté disponible
echo "Esperando a que el servidor de Guiders esté disponible..."
npx wait-on http://localhost:4200 --timeout 60000

# Ejecutar tests e2e de Guiders
echo -e "${YELLOW}=== Ejecutando tests e2e para el proyecto Guiders ===${NC}"
cd guiders && npm run test:cypress:headless
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
cd /home/runner/work/guiders-frontend/guiders-frontend/backoffice
npm start &
BACKOFFICE_PID=$!
cd ..

# Esperar a que el servidor esté disponible
echo "Esperando a que el servidor de Backoffice esté disponible..."
npx wait-on http://localhost:4201 --timeout 60000

# Ejecutar tests e2e de Backoffice
echo -e "${YELLOW}=== Ejecutando tests e2e para el proyecto Backoffice ===${NC}"
cd backoffice && npm run test:cypress:headless
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

echo -e "${GREEN}✅ ¡Todos los tests e2e completados correctamente!${NC}"