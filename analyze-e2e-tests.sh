#!/bin/bash

# Script para analizar y reportar sobre los tests e2e sin ejecutar Cypress completo

# Colores para mejorar la legibilidad
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para verificar si Cypress está instalado
check_cypress_installation() {
  if command -v cypress &>/dev/null; then
    echo -e "${GREEN}✅ Cypress está instalado en el sistema${NC}"
    return 0
  else
    echo -e "${RED}❌ Cypress no está instalado en el sistema${NC}"
    return 1
  fi
}

# Función para contar archivos de test e2e
count_e2e_tests() {
  local project_path=$1
  local project_name=$2
  
  echo -e "\n${YELLOW}=== Analizando tests e2e para el proyecto ${project_name} ===${NC}"
  
  # Verificar que existe el directorio de tests
  if [ ! -d "${project_path}/cypress/e2e" ]; then
    echo -e "${RED}❌ No se encontró el directorio de tests e2e${NC}"
    return 1
  fi
  
  # Contar los archivos de test
  local test_files=$(find "${project_path}/cypress/e2e" -name "*.cy.ts" | wc -l)
  local test_dirs=$(find "${project_path}/cypress/e2e" -type d | wc -l)
  
  echo -e "${BLUE}📊 Estadísticas de tests e2e:${NC}"
  echo -e "  - Archivos de test: ${test_files}"
  echo -e "  - Directorios de test: $((test_dirs - 1))"
  
  # Listar los archivos de test encontrados
  echo -e "\n${BLUE}📋 Archivos de test encontrados:${NC}"
  find "${project_path}/cypress/e2e" -name "*.cy.ts" | sort | while read -r file; do
    echo -e "  - $(basename "$file")"
  done
  
  # Intentar analizar el contenido básico de los tests
  echo -e "\n${BLUE}📝 Análisis básico de tests:${NC}"
  find "${project_path}/cypress/e2e" -name "*.cy.ts" | sort | while read -r file; do
    local test_name=$(basename "$file")
    local test_count=$(grep -c "it(" "$file")
    local describe_count=$(grep -c "describe(" "$file")
    
    echo -e "  - ${test_name}:"
    echo -e "    * Bloques describe: ${describe_count}"
    echo -e "    * Tests (it): ${test_count}"
  done
  
  return 0
}

# Función para generar reporte en markdown
generate_markdown_report() {
  local report_file="/home/runner/work/guiders-frontend/guiders-frontend/E2E-TEST-ANALYSIS-REPORT.md"
  
  echo "# Análisis de Tests E2E" > "$report_file"
  echo "" >> "$report_file"
  echo "## Estado de Cypress" >> "$report_file"
  
  if check_cypress_installation > /dev/null; then
    echo "✅ **Cypress está instalado** y disponible en el sistema." >> "$report_file"
  else
    echo "❌ **Cypress no está instalado** en el sistema." >> "$report_file"
    echo "" >> "$report_file"
    echo "> **Nota:** No se pueden ejecutar los tests e2e debido a restricciones de firewall que impiden la descarga de Cypress." >> "$report_file"
  fi
  
  # Analizar los tests de Guiders
  echo "" >> "$report_file"
  echo "## Proyecto Guiders" >> "$report_file"
  
  # Capturar la salida del análisis
  guiders_output=$(count_e2e_tests "/home/runner/work/guiders-frontend/guiders-frontend/guiders" "Guiders")
  
  # Contar archivos y tests
  guiders_files=$(find "/home/runner/work/guiders-frontend/guiders-frontend/guiders/cypress/e2e" -name "*.cy.ts" 2>/dev/null | wc -l)
  guiders_dirs=$(find "/home/runner/work/guiders-frontend/guiders-frontend/guiders/cypress/e2e" -type d 2>/dev/null | wc -l)
  
  echo "### Estadísticas" >> "$report_file"
  echo "" >> "$report_file"
  echo "- **Total archivos de test:** ${guiders_files}" >> "$report_file"
  echo "- **Total directorios:** $((guiders_dirs - 1))" >> "$report_file"
  
  echo "" >> "$report_file"
  echo "### Archivos de Test Encontrados" >> "$report_file"
  echo "" >> "$report_file"
  
  # Listar los archivos de test
  find "/home/runner/work/guiders-frontend/guiders-frontend/guiders/cypress/e2e" -name "*.cy.ts" 2>/dev/null | sort | while read -r file; do
    echo "- **$(basename "$file")**" >> "$report_file"
    
    # Añadir información básica sobre cada archivo
    test_count=$(grep -c "it(" "$file")
    describe_count=$(grep -c "describe(" "$file")
    
    echo "  - Bloques describe: ${describe_count}" >> "$report_file"
    echo "  - Tests (it): ${test_count}" >> "$report_file"
    
    # Extraer los nombres de los tests (opcional)
    echo "  - Ejemplos de tests:" >> "$report_file"
    grep -o "it(['\"].*['\"]" "$file" | head -3 | sed -E "s/it\\(['\"](.*)['\"]/    * \\1/" >> "$report_file"
    
    if [ "$(grep -o "it(['\"].*['\"]" "$file" | wc -l)" -gt 3 ]; then
      echo "    * ..." >> "$report_file"
    fi
    
    echo "" >> "$report_file"
  done
  
  # Analizar los tests de Backoffice
  echo "## Proyecto Backoffice" >> "$report_file"
  
  # Capturar la salida del análisis
  backoffice_output=$(count_e2e_tests "/home/runner/work/guiders-frontend/guiders-frontend/backoffice" "Backoffice")
  
  # Contar archivos y tests
  backoffice_files=$(find "/home/runner/work/guiders-frontend/guiders-frontend/backoffice/cypress/e2e" -name "*.cy.ts" 2>/dev/null | wc -l)
  backoffice_dirs=$(find "/home/runner/work/guiders-frontend/guiders-frontend/backoffice/cypress/e2e" -type d 2>/dev/null | wc -l)
  
  echo "### Estadísticas" >> "$report_file"
  echo "" >> "$report_file"
  echo "- **Total archivos de test:** ${backoffice_files}" >> "$report_file"
  echo "- **Total directorios:** $((backoffice_dirs - 1))" >> "$report_file"
  
  echo "" >> "$report_file"
  echo "### Archivos de Test Encontrados" >> "$report_file"
  echo "" >> "$report_file"
  
  # Listar los archivos de test
  find "/home/runner/work/guiders-frontend/guiders-frontend/backoffice/cypress/e2e" -name "*.cy.ts" 2>/dev/null | sort | while read -r file; do
    echo "- **$(basename "$file")**" >> "$report_file"
    
    # Añadir información básica sobre cada archivo
    test_count=$(grep -c "it(" "$file")
    describe_count=$(grep -c "describe(" "$file")
    
    echo "  - Bloques describe: ${describe_count}" >> "$report_file"
    echo "  - Tests (it): ${test_count}" >> "$report_file"
    
    # Extraer los nombres de los tests (opcional)
    echo "  - Ejemplos de tests:" >> "$report_file"
    grep -o "it(['\"].*['\"]" "$file" | head -3 | sed -E "s/it\\(['\"](.*)['\"]/    * \\1/" >> "$report_file"
    
    if [ "$(grep -o "it(['\"].*['\"]" "$file" | wc -l)" -gt 3 ]; then
      echo "    * ..." >> "$report_file"
    fi
    
    echo "" >> "$report_file"
  done
  
  echo "## Conclusión" >> "$report_file"
  echo "" >> "$report_file"
  
  if [ "$guiders_files" -eq 0 ] && [ "$backoffice_files" -eq 0 ]; then
    echo "No se encontraron archivos de test e2e en ninguno de los proyectos." >> "$report_file"
  else
    echo "Se encontraron un total de $((guiders_files + backoffice_files)) archivos de test e2e en ambos proyectos." >> "$report_file"
    
    if check_cypress_installation > /dev/null; then
      echo "Cypress está instalado y los tests podrían ejecutarse manualmente." >> "$report_file"
    else
      echo "Los tests e2e no se pueden ejecutar debido a que Cypress no está instalado correctamente." >> "$report_file"
      echo "Se requiere acceso a `download.cypress.io` para completar la instalación." >> "$report_file"
    fi
  fi
  
  echo -e "${GREEN}✅ Reporte generado en ${report_file}${NC}"
}

# Función principal
main() {
  echo -e "${YELLOW}=== Analizando configuración de Tests E2E ===${NC}"
  
  # Verificar instalación de Cypress
  check_cypress_installation
  cypress_installed=$?
  
  if [ $cypress_installed -eq 0 ]; then
    echo -e "${GREEN}✅ Cypress está disponible para ejecutar tests${NC}"
  else
    echo -e "${RED}❌ No se puede ejecutar Cypress por problemas de instalación${NC}"
    echo -e "${YELLOW}ℹ️ Realizando análisis estático de los tests e2e${NC}"
  fi
  
  # Analizar los tests de Guiders
  count_e2e_tests "/home/runner/work/guiders-frontend/guiders-frontend/guiders" "Guiders"
  
  # Analizar los tests de Backoffice
  count_e2e_tests "/home/runner/work/guiders-frontend/guiders-frontend/backoffice" "Backoffice"
  
  # Generar reporte en markdown
  generate_markdown_report
  
  echo -e "${GREEN}=== Análisis de tests e2e completado ===${NC}"
}

# Ejecutar la función principal
main