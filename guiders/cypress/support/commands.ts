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
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  
  // Esperamos a que el botón esté habilitado
  cy.get('button[type="submit"]').should('not.be.disabled');
  
  // Hacemos clic en el botón
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  // Usar enfoque y desenfoque directamente en lugar de tab
  cy.wrap(subject).blur();
  return cy.wrap(subject).next().focus();
});

Cypress.Commands.add('verifyLoginPageElements', () => {
  // Verificar elementos del branding
  cy.contains('Guiders').should('be.visible');
  cy.get('.brand-subtitle').should('be.visible');
  
  // Verificar elementos del formulario - usar selectores más generales
  cy.get('form').should('exist');
  cy.get('input[type="email"]').should('be.visible');
  cy.get('input[type="password"]').should('be.visible');
  cy.get('button[type="submit"]').should('be.visible');
  
  // Verificar elementos de la interfaz
  cy.get('.logo-svg').should('be.visible');
});

Cypress.Commands.add('interceptLoginSuccess', () => {
  cy.intercept('POST', '**/user/auth/login', { fixture: 'login-success.json' }).as('loginSuccess');
});

Cypress.Commands.add('interceptLoginError', (statusCode: number, message: string) => {
  cy.intercept('POST', '**/user/auth/login', {
    statusCode,
    body: { message }
  }).as('loginError');
});

export {};
