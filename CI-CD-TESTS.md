# CI/CD Configuration - Tests

Este documento describe la configuración de CI/CD para la ejecución de tests en GitHub Actions.

## 📋 Configuración Actual

### GitHub Actions Workflow: `tests.yml`

El workflow ejecuta dos tipos de tests:

1. **Tests Unitarios (Jest)**: Valida la lógica de negocio y componentes
2. **Tests E2E (Cypress)**: Valida la funcionalidad completa de la aplicación

### 🔧 Mejoras Implementadas

#### Para Tests de Cypress:

1. **Servidor de Desarrollo**: Usa `ng serve` en lugar de build estático
2. **Cacheo de Cypress**: Mejora el rendimiento del CI
3. **Validación de Servidor**: Verifica que el servidor responda antes de ejecutar tests
4. **Timeout Extendido**: 180 segundos para mayor confiabilidad
5. **Limpieza de Procesos**: Termina correctamente el servidor

#### Scripts de npm:

- `test:jest:guiders-20`: Ejecuta tests unitarios
- `test:cypress:headless:guiders-20`: Ejecuta tests E2E en modo headless
- `start:guiders-20`: Inicia el servidor de desarrollo

## 🚀 Ejecución Local

### Validar configuración antes de commit:

```bash
# Ejecutar script de validación
./validate-ci-tests.sh
```

### Ejecutar tests manualmente:

```bash
# Tests unitarios
npm run test:jest:guiders-20

# Tests E2E (requiere servidor corriendo)
npm run start:guiders-20 &
npm run test:cypress:headless:guiders-20
```

## 📊 Cobertura de Tests

### Jest Tests (Unitarios):
- **38 tests** - 100% passing
- Componentes, servicios y casos de uso
- Mocks para dependencias externas

### Cypress Tests (E2E):
- **12 tests** - 100% passing
- Navegación y rutas
- Autenticación
- Funcionalidad básica de chat

## 🔍 Troubleshooting

### Errores Comunes:

1. **Cypress binary not found**:
   - Solución: El cacheo de Cypress está configurado
   - Backup: Se reinstala automáticamente

2. **Server timeout**:
   - Timeout configurado a 180 segundos
   - Verificación con `curl` antes de ejecutar tests

3. **Port conflicts**:
   - Puerto 4200 configurado específicamente
   - Verificación de disponibilidad

### Logs de Debugging:

El workflow incluye logs detallados para cada paso:
- Verificación de estructura del proyecto
- Inicio del servidor
- Validación de respuesta del servidor
- Ejecución de tests
- Limpieza de procesos

## 🛠️ Configuración de Entorno

### Variables de Entorno:

```yaml
env:
  CYPRESS_baseUrl: http://localhost:4200
  CYPRESS_RUN_BINARY: /home/runner/.cache/Cypress/14.5.1/Cypress/Cypress
```

### Dependencias del Sistema:

```bash
# Dependencias de Cypress para Ubuntu
sudo apt-get install -y \
  libgtk2.0-0 \
  libgtk-3-0 \
  libgbm-dev \
  libnotify-dev \
  libnss3 \
  libxss1 \
  libxtst6 \
  xauth \
  xvfb
```

## 📝 Próximos Pasos

1. **Ampliar cobertura**: Agregar más tests E2E para funcionalidades específicas
2. **Paralelización**: Ejecutar tests en paralelo para mejorar velocidad
3. **Reportes**: Generar reportes de cobertura y resultados
4. **Notificaciones**: Configurar notificaciones de fallos

## 🎯 Resultados Esperados

- **Tests Unitarios**: 100% passing (38/38)
- **Tests E2E**: 100% passing (12/12)
- **Tiempo de ejecución**: < 10 minutos
- **Confiabilidad**: > 95% success rate
