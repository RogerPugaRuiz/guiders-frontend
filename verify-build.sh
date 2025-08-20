#!/bin/bash

# Script para verificar el build de staging
echo "🔨 Verificando build de staging para Guiders Frontend"
echo "=================================================="

echo ""
echo "1. 🧹 Limpiando builds anteriores..."
rm -rf guiders-20/dist

echo ""
echo "2. 📦 Construyendo aplicación para staging..."
cd guiders-20
npm run build -- --configuration=staging

echo ""
echo "3. 🔍 Verificando archivos generados:"
if [ -d "dist" ]; then
    echo "✅ Directorio dist creado"
    echo ""
    echo "Estructura del build:"
    find dist -type f -name "*.mjs" -o -name "*.js" | head -20
    
    echo ""
    echo "Verificando server.mjs:"
    if [ -f "dist/guiders-20/server/server.mjs" ]; then
        echo "✅ server.mjs generado correctamente"
        echo "Tamaño: $(stat -c%s "dist/guiders-20/server/server.mjs" 2>/dev/null || stat -f%z "dist/guiders-20/server/server.mjs") bytes"
        echo ""
        echo "Primeras líneas del archivo:"
        head -10 "dist/guiders-20/server/server.mjs"
    else
        echo "❌ server.mjs NO fue generado"
        echo "Archivos en server/:"
        ls -la dist/guiders-20/server/ 2>/dev/null || echo "Directorio server no existe"
    fi
    
    echo ""
    echo "Verificando package.json del build:"
    if [ -f "dist/guiders-20/package.json" ]; then
        echo "✅ package.json del build existe"
        cat "dist/guiders-20/package.json"
    else
        echo "❌ package.json del build no existe"
    fi
else
    echo "❌ Directorio dist no fue creado"
fi

echo ""
echo "4. 🧪 Probando ejecución local del servidor:"
if [ -f "dist/guiders-20/server/server.mjs" ]; then
    echo "Intentando ejecutar servidor localmente por 5 segundos..."
    timeout 5s node dist/guiders-20/server/server.mjs &
    PID=$!
    sleep 2
    
    if ps -p $PID > /dev/null; then
        echo "✅ Servidor se inició correctamente"
        kill $PID 2>/dev/null
    else
        echo "❌ Servidor falló al iniciarse"
    fi
else
    echo "⏭️ Saltando prueba de ejecución (server.mjs no existe)"
fi

cd ..

echo ""
echo "Verificación completada."
