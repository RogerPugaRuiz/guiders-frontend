#!/bin/bash

# Script para ejecutar los tests e2e en los proyectos Guiders y Backoffice

# Colores para mejorar la legibilidad
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Definir la ruta del reporte
REPORT_FILE="/home/runner/work/guiders-frontend/guiders-frontend/E2E-TEST-EXECUTION-REPORT.md"

# Inicializar el informe
initialize_report() {
    echo "# Informe de Ejecución de Tests E2E" > "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "## Resumen de Ejecución" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Verificar que Cypress esté instalado
echo -e "${YELLOW}=== Verificando instalación de Cypress ===${NC}"
if ! npm list cypress | grep -q "cypress@"; then
    echo -e "${YELLOW}Installing Cypress globally...${NC}"
    npm install cypress
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error al instalar Cypress${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Cypress instalado correctamente${NC}"

# Inicializar el reporte
initialize_report

# Instalar wait-on si no está instalado
if ! npm list wait-on | grep -q "wait-on@"; then
    npm install wait-on
fi

# Crear carpeta para capturas de pantalla si no existe
mkdir -p /home/runner/work/guiders-frontend/guiders-frontend/cypress-screenshots

# Función para ejecutar tests de un proyecto
run_project_tests() {
    local project_name=$1
    local project_path="/home/runner/work/guiders-frontend/guiders-frontend/$project_name"
    local port=$2
    local test_files=0
    local test_count=0
    local success_count=0
    local failure_count=0
    
    echo -e "${YELLOW}=== Ejecutando tests e2e para el proyecto ${project_name} ===${NC}"
    
    # Agregando al reporte
    echo "## Tests de $project_name" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Contar archivos de test
    test_files=$(find "${project_path}/cypress/e2e" -name "*.cy.ts" | wc -l)
    echo "- Total de archivos de test: $test_files" >> "$REPORT_FILE"
    
    # Iniciar el servidor en segundo plano
    echo -e "${YELLOW}Iniciando servidor de ${project_name}...${NC}"
    cd "$project_path"
    npm start &
    local server_pid=$!
    
    # Esperar a que el servidor esté disponible
    echo -e "${YELLOW}Esperando a que el servidor esté disponible en el puerto ${port}...${NC}"
    npx wait-on "http://localhost:${port}" --timeout 60000
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ El servidor no se pudo iniciar en el tiempo esperado${NC}"
        kill $server_pid 2>/dev/null
        echo "❌ El servidor no se pudo iniciar en el tiempo esperado" >> "$REPORT_FILE"
        return 1
    fi
    
    # Ejecutar los tests de Cypress
    echo -e "${YELLOW}Ejecutando tests de Cypress...${NC}"
    cd "$project_path"
    
    # Comprobar si hay un script específico para ejecutar cypress en modo headless
    if grep -q "test:cypress:headless" package.json; then
        npm run test:cypress:headless
    else
        npx cypress run
    fi
    
    local test_result=$?
    
    # Recopilar resultados
    if [ -f "cypress/results.json" ]; then
        test_count=$(jq '.stats.tests' cypress/results.json)
        success_count=$(jq '.stats.passes' cypress/results.json)
        failure_count=$(jq '.stats.failures' cypress/results.json)
    else
        # Si no hay archivo de resultados, intentar extraerlos del output
        test_count=$(find "${project_path}/cypress/e2e" -name "*.cy.ts" -exec grep -c "it(" {} \; | awk '{sum+=$1} END {print sum}')
        if [ $test_result -eq 0 ]; then
            success_count=$test_count
            failure_count=0
        else
            success_count=0
            failure_count=$test_count
        fi
    fi
    
    # Detener el servidor
    echo -e "${YELLOW}Deteniendo el servidor de ${project_name}...${NC}"
    kill $server_pid 2>/dev/null
    
    # Añadir resultados al informe
    echo "- Tests ejecutados: $test_count" >> "$REPORT_FILE"
    echo "- Tests exitosos: $success_count" >> "$REPORT_FILE"
    echo "- Tests fallidos: $failure_count" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Listar archivos de test
    echo "### Archivos de test ejecutados:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    find "${project_path}/cypress/e2e" -name "*.cy.ts" | sort | while read -r file; do
        local file_name=$(basename "$file")
        local file_tests=$(grep -c "it(" "$file")
        echo "- **$file_name** ($file_tests tests)" >> "$REPORT_FILE"
        
        # Extraer nombres de los tests
        echo "  - Tests:" >> "$REPORT_FILE"
        grep -o "it(['\"].*['\"]" "$file" | sed -E "s/it\\(['\"](.*)['\"]/    * \\1/" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    done
    
    echo "" >> "$REPORT_FILE"
    
    if [ $test_result -eq 0 ]; then
        echo -e "${GREEN}✅ Tests e2e de ${project_name} completados correctamente${NC}"
        return 0
    else
        echo -e "${RED}❌ Tests e2e de ${project_name} fallaron${NC}"
        return 1
    fi
}

# Ejecutar tests para ambos proyectos
guiders_result=0
backoffice_result=0

# Ejecutar tests de Guiders
run_project_tests "guiders" "4200"
guiders_result=$?

# Ejecutar tests de Backoffice
run_project_tests "backoffice" "4201"
backoffice_result=$?

# Añadir resumen general al reporte
echo "## Resumen Final" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $guiders_result -eq 0 ] && [ $backoffice_result -eq 0 ]; then
    echo "✅ **Todos los tests e2e se ejecutaron correctamente**" >> "$REPORT_FILE"
    echo -e "${GREEN}✅ ¡Todos los tests e2e completados correctamente!${NC}"
    echo "" >> "$REPORT_FILE"
else
    echo "❌ **Algunos tests e2e fallaron durante la ejecución**" >> "$REPORT_FILE"
    echo -e "${RED}❌ Algunos tests e2e fallaron durante la ejecución${NC}"
    echo "" >> "$REPORT_FILE"
    
    # Detallar qué proyectos fallaron
    if [ $guiders_result -ne 0 ]; then
        echo "- ❌ Los tests de Guiders fallaron" >> "$REPORT_FILE"
    else
        echo "- ✅ Los tests de Guiders se ejecutaron correctamente" >> "$REPORT_FILE"
    fi
    
    if [ $backoffice_result -ne 0 ]; then
        echo "- ❌ Los tests de Backoffice fallaron" >> "$REPORT_FILE"
    else
        echo "- ✅ Los tests de Backoffice se ejecutaron correctamente" >> "$REPORT_FILE"
    fi
fi

echo "" >> "$REPORT_FILE"
echo "Reporte generado: $REPORT_FILE"
echo -e "${GREEN}Reporte de tests e2e generado en ${REPORT_FILE}${NC}"

# Salir con código de error si algún test falló
if [ $guiders_result -ne 0 ] || [ $backoffice_result -ne 0 ]; then
    exit 1
fi

exit 0