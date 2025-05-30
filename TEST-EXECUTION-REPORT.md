# Reporte de Ejecución de Tests

## Resumen de Ejecución

Se ejecutaron los tests unitarios de los proyectos Guiders y Backoffice con éxito. Los tests e2e se analizaron pero no pudieron ejecutarse.

### Tests Unitarios Guiders

✅ **Resultado**: EXITOSO
- Tests totales: 12
- Tests ejecutados: 12
- Tests pasados: 12
- Tests fallidos: 0
- Archivos de test: 4

### Tests Unitarios Backoffice

✅ **Resultado**: EXITOSO
- Tests totales: 10
- Tests ejecutados: 10
- Tests pasados: 10
- Tests fallidos: 0
- Archivos de test: 4

### Tests E2E Guiders

❌ **Resultado**: NO EJECUTADO
- Tests encontrados: 18 (en 2 archivos)
- Archivos de test: 2
- Directorios de test: 1

### Tests E2E Backoffice

❌ **Resultado**: NO EJECUTADO
- Tests encontrados: 3 (en 1 archivo)
- Archivos de test: 1
- Directorios de test: 0

## Detalles de los Tests Ejecutados

### Tests Unitarios Guiders

- `src/app/core/actions/actions.jest.spec.ts`
- `src/app/core/actions/actions.spec.ts`
- `src/app/core/interceptors/__tests__/auth.interceptor.spec.ts`
- `src/app/core/services/__tests__/token-refresh.service.spec.ts`

### Tests Unitarios Backoffice

- `src/app/core/actions/actions.jest.spec.ts`
- `src/app/core/actions/actions.spec.ts`
- `src/app/app.component.jest.spec.ts`
- `src/app/app.component.spec.ts`

### Tests E2E Guiders

- **login-simplified.cy.ts**
  - 15 tests distribuidos en 6 bloques describe
  - Tests incluyen: login flow, validaciones de formulario y manejo de errores

- **basic-test.cy.ts**
  - 3 tests en 1 bloque describe
  - Tests básicos de funcionalidad

### Tests E2E Backoffice

- **basic-test.cy.ts**
  - 3 tests en 1 bloque describe
  - Tests básicos de funcionalidad

## Limitaciones

No se pudieron ejecutar los tests e2e (Cypress) debido a restricciones de firewall que impiden la descarga del binario de Cypress desde `download.cypress.io`. Se ha realizado un análisis estático de los tests disponibles.

## Comandos Utilizados

Para ejecutar los tests unitarios:

```bash
# Desde la raíz del monorepo
npm run test:all

# O utilizando el script personalizado
./run-unit-tests.sh
```

Para analizar los tests e2e (sin ejecutarlos):

```bash
# Desde la raíz del monorepo
./analyze-e2e-tests.sh
```

## Nuevos Scripts Añadidos

1. **run-e2e-tests.sh**: Script para ejecutar los tests e2e cuando Cypress esté disponible.

2. **analyze-e2e-tests.sh**: Script para analizar los tests e2e sin ejecutarlos, generando un reporte de los archivos y tests encontrados.

## Conclusión

Los tests unitarios para ambos proyectos se ejecutan correctamente y todos pasan. Se han identificado 21 tests e2e en total entre ambos proyectos, pero no se pudieron ejecutar debido a las restricciones de firewall. Se recomienda ejecutar los tests e2e en un entorno donde se pueda instalar Cypress correctamente utilizando el script `run-e2e-tests.sh` proporcionado.