# Tests E2E para Login Component

Este directorio contiene los tests end-to-end para el componente de login de la aplicación Guiders.

## Archivos de Test

### `login.cy.ts`

Test completo y exhaustivo que cubre:

- ✅ Elementos de la interfaz y branding
- ✅ Validaciones de formulario (campos vacíos, formato email, longitud contraseña)
- ✅ Funcionalidad de mostrar/ocultar contraseña
- ✅ Proceso de login exitoso y manejo de errores
- ✅ Interacciones del usuario (teclado, Enter)
- ✅ Responsive design y accesibilidad
- ✅ Características de UX

### `login-simplified.cy.ts`

Test simplificado usando comandos personalizados que cubre:

- ✅ Happy path de login exitoso
- ✅ Manejo de errores comunes
- ✅ Validaciones básicas del formulario
- ✅ Funcionalidad básica de UI

## Comandos Personalizados

Los tests utilizan comandos personalizados definidos en `cypress/support/commands.ts`:

- `cy.login(email, password)` - Realiza login con credenciales
- `cy.verifyLoginPageElements()` - Verifica elementos visibles de la página
- `cy.interceptLoginSuccess()` - Intercepta login exitoso
- `cy.interceptLoginError(status, message)` - Intercepta errores de login

## Fixtures

### `login-success.json`

Contiene la respuesta mockeada para un login exitoso:

```json
{
  "success": true,
  "user": {
    "id": "123",
    "email": "usuario@example.com",
    "name": "Usuario de Prueba",
    "role": "user"
  },
  "token": "jwt-token-example",
  "refreshToken": "refresh-token-example"
}
```

## Ejecutar los Tests

⚠️ **IMPORTANTE**: Antes de ejecutar los tests de Cypress, necesitas tener el servidor de desarrollo corriendo.

### 1. Iniciar el servidor de desarrollo

```bash
# Desde la raíz del monorepo
npm run start:guiders

# O desde el directorio de guiders
cd guiders
npm start
```

El servidor estará disponible en <http://localhost:4200>

### 2. Ejecutar los tests (en otra terminal)

#### Desde la raíz del monorepo

```bash
# Ejecutar todos los tests de Cypress para Guiders
npm run test:cypress:guiders

# Ejecutar en modo headless
npm run test:cypress:headless:guiders

# Abrir interfaz de Cypress para desarrollo
npm run test:cypress:open:guiders
```

#### Desde el directorio de Guiders

```bash
cd guiders

# Ejecutar tests en modo headless
npm run test:cypress

# Abrir interfaz de Cypress
npm run test:cypress:open

# Ejecutar solo tests de login
npx cypress run --spec "cypress/e2e/auth/login*.cy.ts"

# Ejecutar un test específico
npx cypress run --spec "cypress/e2e/auth/login-simplified.cy.ts"
```

### 3. Comandos útiles para desarrollo

```bash
# Ejecutar tests con la interfaz gráfica (recomendado para desarrollo)
npm run test:cypress:open

# Ejecutar tests específicos con watch mode
npx cypress open --e2e

# Ejecutar tests con configuración específica
npx cypress run --browser chrome --headless
```

### 4. Automatización completa

Si quieres automatizar todo el proceso, puedes usar estos comandos:

```bash
# Terminal 1: Iniciar servidor
npm run start:guiders

# Terminal 2: Esperar a que el servidor esté listo y ejecutar tests
npm run test:cypress:guiders
```

### 5. Troubleshooting

#### Error: "Cypress failed to verify that your server is running"

- **Solución**: Asegúrate de que el servidor de desarrollo esté corriendo en <http://localhost:4200>
- Ejecuta `npm run start:guiders` y espera a que aparezca "Local: <http://localhost:4200>"

#### Error: "Cannot find module" o errores de TypeScript

- **Solución**: Verifica que todas las dependencias estén instaladas
- Ejecuta `npm install` en la raíz del monorepo y en el directorio `guiders/`

#### Tests fallan por elementos no encontrados

- **Solución**: Verifica que la aplicación esté completamente cargada
- Aumenta los timeouts en `cypress.config.ts` si es necesario

## Configuración

Los tests están configurados para:

- Interceptar llamadas a analytics automáticamente
- Manejar errores de red y API
- Soportar múltiples viewports (desktop y móvil)
- Usar data-cy attributes para selectores estables

## Selectores de Test

Los tests utilizan `data-cy` attributes para selectores estables:

- `data-cy="login-form"` - Formulario de login
- `data-cy="email-input"` - Campo de email
- `data-cy="password-input"` - Campo de contraseña
- `data-cy="login-button"` - Botón de login

## Escenarios Cubiertos

### ✅ Casos de Éxito

- Login con credenciales válidas
- Redirección correcta después del login
- Estados de loading durante el proceso

### ✅ Casos de Error

- Credenciales incorrectas (401)
- Errores de validación del servidor (422)
- Errores de red
- Errores internos del servidor (500)

### ✅ Validaciones del Frontend

- Campos requeridos
- Formato de email válido
- Longitud mínima de contraseña
- Estados de error en tiempo real

### ✅ Funcionalidad de UI

- Mostrar/ocultar contraseña
- Navegación con teclado (Tab)
- Envío de formulario con Enter
- Responsive design
- Accesibilidad (labels, placeholders)

### ✅ Experiencia de Usuario

- Animaciones y elementos visuales
- Mensajes de error claros en español
- Estados de loading informativos
- Limpieza de errores al corregir campos

## Notas Importantes

1. **API Mocking**: Los tests usan intercepts de Cypress para mockear las llamadas a la API
2. **Datos de Test**: Usa credenciales ficticias que no deben coincidir con datos reales
3. **Selectores**: Prefiere `data-cy` attributes sobre selectores CSS para estabilidad
4. **Responsive**: Los tests verifican la funcionalidad en diferentes tamaños de pantalla
5. **Accesibilidad**: Los tests incluyen verificaciones básicas de accesibilidad
