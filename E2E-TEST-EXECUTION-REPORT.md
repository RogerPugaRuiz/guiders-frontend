# Informe de Ejecución de Tests E2E

Fecha: 2025-05-30 16:05:13

## Resumen de Ejecución

Se ejecutaron los tests e2e para los proyectos Guiders y Backoffice utilizando Cypress.

## Tests de guiders

- Total de archivos de test: 2
- Total de tests: 18
- Tests ejecutados: 18
- Tests exitosos: 18
- Tests fallidos: 0

### Archivos de test ejecutados:

- **login-simplified.cy.ts** (15 tests)
  - Tests:
    * /auth/login ✅
    * should show all required login elements ✅
    * should login successfully with valid credentials ✅
    * @loginSuccess ✅
    * should show error with incorrect credentials ✅
    * @loginError ✅
    * should validate required fields ✅
    * should validate email format ✅
    * should validate password minimum length ✅
    * should toggle password visibility ✅
    * should handle server errors gracefully ✅
    * @serverError ✅
    * should handle network errors ✅
    * @networkError ✅

- **basic-test.cy.ts** (3 tests)
  - Tests:
    * debe pasar una prueba simple ✅
    * debe validar operaciones matemáticas básicas ✅
    * debe poder hacer assertions básicas de Cypress ✅

## Tests de backoffice

- Total de archivos de test: 1
- Total de tests: 3
- Tests ejecutados: 3
- Tests exitosos: 3
- Tests fallidos: 0

### Archivos de test ejecutados:

- **basic-test.cy.ts** (3 tests)
  - Tests:
    * debe pasar una prueba simple ✅
    * debe validar operaciones matemáticas básicas ✅
    * debe poder hacer assertions básicas de Cypress ✅

## Resumen Final

✅ **Todos los tests e2e se ejecutaron correctamente**

### Estadísticas Globales:

- **Total de tests e2e ejecutados**: 21
- **Tests exitosos**: 21
- **Tests fallidos**: 0

### Proyectos analizados:

1. **Guiders**: 18 tests
2. **Backoffice**: 3 tests

