# 🧪 Sistema de Testing Automatizado - Guiders

## 📖 Descripción General

Este sistema de testing implementa una **estrategia híbrida** que combina tests con API mock y tests de integración con backend real, permitiendo:

- ✅ **Tests rápidos y consistentes** con datos mock
- ✅ **Validación completa de integración** con backend real  
- ✅ **Autenticación automática** sin repetir login en cada test
- ✅ **Flexibilidad** para elegir la estrategia según necesidad

## 🎯 Cuándo Usar Mock vs Backend Real

### 🔸 **Usar MOCK cuando:**
- Validar **lógica del frontend**
- Probar **manejo de errores** específicos
- Tests de **performance** y velocidad
- **Navegación** entre rutas protegidas
- Tests que se ejecutan **frecuentemente** (CI/CD)

### 🔸 **Usar BACKEND REAL cuando:**
- Validar **integración completa**
- Probar **contratos de API**
- Tests de **aceptación** end-to-end
- Validar **flujos críticos** antes de release

## 🚀 Scripts de Testing

```bash
# Tests con Mock (rápidos, para desarrollo)
npm run test:e2e:mock

# Tests de Integración (completos, con backend real)
npm run test:e2e:integration

# Tests Híbridos (combinación optimizada)
npm run test:e2e:hybrid

# Solo tests de autenticación
npm run test:e2e:auth-only

# Modo desarrollo (interfaz gráfica)
npm run test:e2e:dev
```

## 📁 Estructura de Tests

```
cypress/
├── e2e/
│   ├── auth/
│   │   ├── login.cy.ts              # ✅ Validación UI del login
│   │   ├── frontend-logic.cy.ts     # 🎭 Tests con mock
│   │   ├── authenticated-navigation.cy.ts # 🎭 Navegación con mock
│   │   └── integration-tests.cy.ts  # 🔗 Tests con backend real
│   └── other-features/
├── support/
│   ├── commands.ts         # Comandos personalizados
│   ├── api-helpers.ts      # Helpers mock/real
│   └── e2e.ts             # Configuración global
└── fixtures/              # Datos de prueba
```

## 🛠️ Comandos Personalizados

### Autenticación
```typescript
// Login automático con token (mock)
cy.loginByToken();

// Login manual por UI (validación)
cy.login('email@test.com', 'password');

// Verificar estado de autenticación
cy.shouldBeAuthenticated();
cy.shouldNotBeAuthenticated();

// Limpiar autenticación
cy.clearAuth();
```

### Configuración de Entorno
```typescript
// Configurar mock (por defecto)
cy.setupTestEnvironment({ useMock: true, scenario: 'success' });

// Configurar backend real
cy.setupTestEnvironment({ useMock: false });

// Simular errores específicos
cy.setupTestEnvironment({ 
  useMock: true, 
  scenario: 'invalidCredentials' 
});
```

## 📝 Ejemplos de Uso

### 1. Test de Lógica Frontend (Mock)
```typescript
describe('Frontend Logic', () => {
  beforeEach(() => {
    cy.setupTestEnvironment({ useMock: true });
  });

  it('debe procesar login exitoso', () => {
    cy.visit('/auth/login');
    cy.get('[data-cy=email-input]').type('test@email.com');
    cy.get('[data-cy=password-input]').type('password');
    cy.get('[data-cy=login-button]').click();
    
    cy.shouldBeAuthenticated();
  });
});
```

### 2. Test de Navegación (Mock + Token)
```typescript
describe('Authenticated Navigation', () => {
  beforeEach(() => {
    cy.loginByToken(); // Autenticación automática
    cy.setupTestEnvironment({ useMock: true });
  });

  it('debe permitir acceso a dashboard', () => {
    cy.visit('/dashboard');
    cy.shouldBeAuthenticated();
    cy.url().should('include', '/dashboard');
  });
});
```

### 3. Test de Integración (Backend Real)
```typescript
describe('Integration Tests', () => {
  beforeEach(() => {
    cy.setupTestEnvironment({ useMock: false });
  });

  it('debe hacer login real', () => {
    cy.visit('/auth/login');
    cy.login('real@user.com', 'realpassword');
    cy.shouldBeAuthenticated();
  });
});
```

## ⚙️ Configuración

### Variables de Entorno
```javascript
// cypress.config.ts
env: {
  USE_REAL_API: false,           // true para backend real
  RUN_INTEGRATION_TESTS: false,  // true para tests de integración
  API_BASE_URL: 'http://localhost:3000',
  testUser: {
    email: 'test@guiders.com',
    password: 'password123'
  }
}
```

### Selectores de Testing
Los componentes deben incluir atributos `data-cy`:

```html
<!-- ✅ Correcto -->
<form data-cy="login-form">
  <input data-cy="email-input" type="email">
  <input data-cy="password-input" type="password">
  <button data-cy="login-button">Login</button>
</form>
```

## 🔧 Configuración de Interceptores

### Mock Automático
```typescript
// Configura automáticamente todos los interceptores necesarios
cy.setupTestEnvironment({ useMock: true, scenario: 'success' });
```

### Backend Real
```typescript
// Permite llamadas reales, solo intercepta para logging
cy.setupTestEnvironment({ useMock: false });
```

### Errores Específicos
```typescript
// Simula diferentes tipos de errores
cy.setupTestEnvironment({ 
  useMock: true, 
  scenario: 'invalidCredentials' | 'networkError' | 'serverError'
});
```

## 📊 Estrategias por Tipo de Test

| Tipo de Test | Estrategia | Velocidad | Confiabilidad | Uso |
|--------------|------------|-----------|---------------|-----|
| **UI/Frontend** | Mock | ⚡ Rápido | ✅ Alta | Desarrollo diario |
| **Navegación** | Mock + Token | ⚡ Rápido | ✅ Alta | CI/CD frecuente |
| **Integración** | Backend Real | 🐌 Lento | 🔒 Máxima | Pre-release |
| **Híbrido** | Combinado | ⚖️ Medio | ⚖️ Balanceada | Testing completo |

## 🏃‍♂️ Ejecución de Tests

### Desarrollo Local
```bash
# Desarrollo rápido con interfaz gráfica
npm run test:e2e:dev

# Tests rápidos en terminal
npm run test:e2e:mock
```

### CI/CD Pipeline
```bash
# Tests principales (mock)
npm run test:e2e:hybrid

# Tests de integración (solo en staging/production)
npm run test:e2e:integration
```

## 🚨 Buenas Prácticas

### ✅ Do's
- Usar mock para tests frecuentes
- Usar backend real para validación crítica
- Mantener tests independientes
- Incluir atributos `data-cy` en componentes
- Limpiar estado entre tests

### ❌ Don'ts
- No usar backend real en todos los tests
- No hardcodear URLs o credenciales
- No hacer tests dependientes entre sí
- No usar selectores CSS frágiles
- No ignorar cleanup de datos

## 🔍 Debugging

### Ver Requests en Tests
```typescript
// Los interceptores automáticamente crean aliases
cy.wait('@loginMock');      // Para mock
cy.wait('@loginReal');      // Para backend real
```

### Logs Detallados
```bash
# Ejecutar con logs detallados
npx cypress run --config video=true,screenshotOnRunFailure=true
```

## 📈 Métricas y Performance

- **Tests Mock**: ~500ms por test
- **Tests Real**: ~2-5s por test
- **Tests con Token**: ~200ms para autenticación
- **Coverage**: Apuntar a >80% en flujos críticos

## 🔄 Mantenimiento

### Actualizar Mocks
Cuando la API cambie, actualizar `cypress/support/api-helpers.ts`:

```typescript
// Actualizar estructura de respuestas mock
const mockResponse = {
  // Nueva estructura según API real
};
```

### Sincronizar con Backend
Ejecutar tests de integración regularmente para detectar cambios en contratos de API.

---

**⚡ Recuerda**: Usa mock para desarrollo rápido, backend real para validación crítica. ¡La estrategia híbrida te da lo mejor de ambos mundos!
