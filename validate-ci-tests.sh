#!/bin/bash

# Script para validar que los tests funcionan correctamente en GitHub Actions
# Simula el entorno de CI para detectar problemas antes del commit

echo "🔍 Validando configuración de tests para GitHub Actions..."

# Verificar que existen los scripts necesarios
echo "📦 Verificando scripts en package.json..."

if ! grep -q "test:cypress:headless:guiders-20" package.json; then
    echo "❌ Error: No se encuentra el script test:cypress:headless:guiders-20"
    exit 1
fi

if ! grep -q "start:guiders-20" package.json; then
    echo "❌ Error: No se encuentra el script start:guiders-20"
    exit 1
fi

echo "✅ Scripts encontrados correctamente"

# Verificar estructura del proyecto
echo "🏗️ Verificando estructura del proyecto..."

if [ ! -d "guiders-20" ]; then
    echo "❌ Error: No se encuentra el directorio guiders-20"
    exit 1
fi

if [ ! -f "guiders-20/package.json" ]; then
    echo "❌ Error: No se encuentra guiders-20/package.json"
    exit 1
fi

if [ ! -f "guiders-20/cypress.config.ts" ]; then
    echo "❌ Error: No se encuentra la configuración de Cypress"
    exit 1
fi

echo "✅ Estructura del proyecto correcta"

# Verificar dependencias
echo "🔧 Verificando dependencias..."

cd guiders-20

if ! npm list cypress > /dev/null 2>&1; then
    echo "❌ Error: Cypress no está instalado en guiders-20"
    exit 1
fi

if ! npm list @angular/cli > /dev/null 2>&1; then
    echo "❌ Error: Angular CLI no está instalado en guiders-20"
    exit 1
fi

echo "✅ Dependencias verificadas"

cd ..

# Simular la ejecución de tests (sin servidor real)
echo "🧪 Simulando ejecución de tests..."

# Verificar que los comandos existen
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx no está disponible"
    exit 1
fi

# Verificar la configuración de Cypress
echo "⚙️ Validando configuración de Cypress..."

cd guiders-20

# Verificar que Cypress puede iniciarse
if ! npx cypress verify > /dev/null 2>&1; then
    echo "❌ Error: Cypress no está correctamente configurado"
    exit 1
fi

echo "✅ Cypress configurado correctamente"

cd ..

echo ""
echo "🎉 ¡Validación completada exitosamente!"
echo "📝 Resumen:"
echo "   ✅ Scripts de npm correctos"
echo "   ✅ Estructura del proyecto válida"
echo "   ✅ Dependencias instaladas"
echo "   ✅ Configuración de Cypress válida"
echo ""
echo "🚀 El proyecto está listo para ejecutar tests en GitHub Actions"
