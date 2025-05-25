// ***********************************************
// This file contains custom commands and overrides
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Comando personalizado para hacer login
       * @example cy.login('usuario@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Comando personalizado para navegar con Tab
       */
      tab(): Chainable<JQuery<HTMLElement>>
      
      /**
       * Comando personalizado para verificar elementos de login visibles
       */
      verifyLoginPageElements(): Chainable<void>
      
      /**
       * Comando personalizado para interceptar login exitoso
       */
      interceptLoginSuccess(): Chainable<void>
      
      /**
       * Comando personalizado para interceptar login con error
       */
      interceptLoginError(statusCode: number, message: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.get('[data-cy="email-input"]').clear().type(email);
  cy.get('[data-cy="password-input"]').clear().type(password);
  cy.get('[data-cy="login-button"]').click();
});

Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', { key: 'Tab' });
});

Cypress.Commands.add('verifyLoginPageElements', () => {
  // Verificar elementos del branding
  cy.contains('Guiders').should('be.visible');
  cy.contains('Conecta, interactúa y convierte visitantes en tiempo real').should('be.visible');
  
  // Verificar elementos del formulario
  cy.get('[data-cy="login-form"]').should('be.visible');
  cy.get('[data-cy="email-input"]').should('be.visible');
  cy.get('[data-cy="password-input"]').should('be.visible');
  cy.get('[data-cy="login-button"]').should('be.visible');
  
  // Verificar elementos adicionales
  cy.contains('¡Bienvenido de vuelta!').should('be.visible');
  cy.contains('Inicia sesión para continuar tu viaje').should('be.visible');
});

Cypress.Commands.add('interceptLoginSuccess', () => {
  cy.intercept('POST', '/api/auth/login', { fixture: 'login-success.json' }).as('loginSuccess');
});

Cypress.Commands.add('interceptLoginError', (statusCode: number, message: string) => {
  cy.intercept('POST', '/api/auth/login', {
    statusCode,
    body: { message }
  }).as('loginError');
});

export {};
