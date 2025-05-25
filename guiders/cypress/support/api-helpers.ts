/**
 * Helpers para manejo de APIs en tests de Cypress
 */

/**
 * Intercepta todas las llamadas de autenticación
 */
export const interceptAuthAPIs = () => {
  // Login exitoso
  cy.intercept('POST', '/api/auth/login', { fixture: 'login-success.json' }).as('loginAPI');
  
  // Logout
  cy.intercept('POST', '/api/auth/logout', { statusCode: 200, body: { success: true } }).as('logoutAPI');
  
  // Refresh token
  cy.intercept('POST', '/api/auth/refresh', { fixture: 'login-success.json' }).as('refreshAPI');
  
  // Verificación de token
  cy.intercept('GET', '/api/auth/verify', { 
    statusCode: 200, 
    body: { valid: true, user: { id: '123', email: 'usuario@example.com' } } 
  }).as('verifyAPI');
};

/**
 * Simula un usuario ya autenticado
 */
export const setAuthenticatedUser = () => {
  cy.window().then((win) => {
    win.localStorage.setItem('token', 'jwt-token-example');
    win.localStorage.setItem('user', JSON.stringify({
      id: '123',
      email: 'usuario@example.com',
      name: 'Usuario de Prueba',
      role: 'user'
    }));
  });
};

/**
 * Limpia la sesión de usuario
 */
export const clearUserSession = () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
};

/**
 * Intercepta errores comunes de API
 */
export const interceptCommonAPIErrors = () => {
  // Error 401 - No autorizado
  cy.intercept('POST', '/api/auth/login', {
    statusCode: 401,
    body: { message: 'Credenciales incorrectas' }
  }).as('unauthorizedError');
  
  // Error 422 - Validación
  cy.intercept('POST', '/api/auth/login', {
    statusCode: 422,
    body: { 
      field: 'email',
      message: 'El email no está registrado en nuestro sistema'
    }
  }).as('validationError');
  
  // Error 500 - Servidor
  cy.intercept('POST', '/api/auth/login', {
    statusCode: 500,
    body: { message: 'Error interno del servidor' }
  }).as('serverError');
  
  // Error de red
  cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('networkError');
};
