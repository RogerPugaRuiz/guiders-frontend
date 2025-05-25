// ***********************************************
// Comandos personalizados para Guiders - Sistema de Autenticación
// ***********************************************

/// <reference types="cypress" />

// Datos de prueba por defecto
const DEFAULT_TEST_CREDENTIALS = {
  email: 'test@guiders.com',
  password: 'password123'
};

const DEFAULT_TEST_TOKEN = 'mock-jwt-token-for-testing-purposes';

const DEFAULT_AUTH_DATA: AuthTestData = {
  token: DEFAULT_TEST_TOKEN,
  refreshToken: 'mock-refresh-token',
  user: {
    id: 'test-user-id',
    email: 'test@guiders.com',
    name: 'Usuario de Prueba'
  },
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
};

/**
 * Comando para login mediante formulario (para testear la lógica de login)
 */
Cypress.Commands.add('login', (email = DEFAULT_TEST_CREDENTIALS.email, password = DEFAULT_TEST_CREDENTIALS.password) => {
  cy.visit('/auth/login');
  
  // Esperar a que el formulario esté disponible
  cy.get('[data-cy=login-form]', { timeout: 10000 }).should('be.visible');
  
  // Llenar el formulario
  cy.get('[data-cy=email-input]').clear().type(email);
  cy.get('[data-cy=password-input]').clear().type(password);
  
  // Hacer clic en el botón de login
  cy.get('[data-cy=login-button]').click();
  
  // Esperar a que la navegación ocurra (indica login exitoso)
  cy.url().should('not.include', '/auth/login');
});

/**
 * Comando para autenticación automática via token (evita la UI del login)
 * Este es el comando principal para usar en tests que no necesiten probar el login
 */
Cypress.Commands.add('loginByToken', (token = DEFAULT_TEST_TOKEN) => {
  const authData = {
    ...DEFAULT_AUTH_DATA,
    token
  };
  
  cy.setAuthData(authData);
});

/**
 * Comando para hacer logout
 */
Cypress.Commands.add('logout', () => {
  cy.clearAuth();
  cy.visit('/auth/login');
  cy.url().should('include', '/auth/login');
});

/**
 * Comando para verificar que el usuario está autenticado
 */
Cypress.Commands.add('shouldBeAuthenticated', () => {
  cy.window().then((win) => {
    const session = win.localStorage.getItem('guiders_session');
    expect(session).to.not.be.null;
    
    if (session) {
      const sessionData = JSON.parse(session);
      expect(sessionData).to.have.property('token');
      expect(sessionData).to.have.property('user');
      expect(new Date(sessionData.expiresAt)).to.be.above(new Date());
    }
  });
});

/**
 * Comando para verificar que el usuario NO está autenticado
 */
Cypress.Commands.add('shouldNotBeAuthenticated', () => {
  cy.window().then((win) => {
    const session = win.localStorage.getItem('guiders_session');
    expect(session).to.be.null;
  });
});

/**
 * Comando para limpiar datos de autenticación
 */
Cypress.Commands.add('clearAuth', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('guiders_auth_token');
    win.localStorage.removeItem('guiders_refresh_token');
    win.localStorage.removeItem('guiders_user');
    win.localStorage.removeItem('guiders_session');
  });
});

/**
 * Comando para configurar datos de autenticación en localStorage
 */
Cypress.Commands.add('setAuthData', (authData: AuthTestData) => {
  cy.window().then((win) => {
    // Configurar todos los items necesarios en localStorage
    win.localStorage.setItem('guiders_auth_token', authData.token);
    win.localStorage.setItem('guiders_refresh_token', authData.refreshToken || '');
    win.localStorage.setItem('guiders_user', JSON.stringify(authData.user));
    win.localStorage.setItem('guiders_session', JSON.stringify({
      token: authData.token,
      refreshToken: authData.refreshToken,
      user: authData.user,
      expiresAt: authData.expiresAt
    }));
  });
});
