// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import './api-helpers';

// Configuración global para los tests
beforeEach(() => {
  // Interceptar llamadas a analytics para evitar errores en tests
  cy.intercept('POST', '**/analytics/**', { statusCode: 200, body: {} });
  cy.intercept('GET', '**/analytics/**', { statusCode: 200, body: {} });
  
  // Interceptar llamadas a servicios externos
  cy.intercept('GET', '**/api/health', { statusCode: 200, body: { status: 'ok' } });
});
