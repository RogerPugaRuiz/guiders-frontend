# Reporte de Ejecución de Tests

## Resumen de Ejecución

Se ejecutaron los tests unitarios de los proyectos Guiders y Backoffice con éxito.

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

## Detalles de los Tests Ejecutados

### Tests Guiders

- `src/app/core/actions/actions.jest.spec.ts`
- `src/app/core/actions/actions.spec.ts`
- `src/app/core/interceptors/__tests__/auth.interceptor.spec.ts`
- `src/app/core/services/__tests__/token-refresh.service.spec.ts`

### Tests Backoffice

- `src/app/core/actions/actions.jest.spec.ts`
- `src/app/core/actions/actions.spec.ts`
- `src/app/app.component.jest.spec.ts`
- `src/app/app.component.spec.ts`

## Limitaciones

No se pudieron ejecutar los tests e2e (Cypress) debido a restricciones de conexión que impiden la descarga del binario de Cypress.

## Comandos Utilizados

Para ejecutar los tests unitarios:

```bash
# Desde la raíz del monorepo
npm run test:all

# O utilizando el script personalizado
./run-unit-tests.sh
```

## Conclusión

Los tests unitarios para ambos proyectos se ejecutan correctamente y todos pasan. Se recomienda ejecutar también los tests e2e en un entorno donde se pueda instalar Cypress correctamente.