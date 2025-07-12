/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Comando personalizado para login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login');
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="login-button"]').click();
  cy.url().should('not.include', '/auth/login');
});

// Comando personalizado para logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="user-menu"]').click();
  cy.get('[data-cy="logout-button"]').click();
  cy.url().should('include', '/auth/login');
});

// Comando personalizado para seleccionar un chat
Cypress.Commands.add('selectChat', (chatId: string) => {
  cy.get(`[data-cy="chat-item-${chatId}"]`).click();
  cy.get('[data-cy="chat-messages"]').should('be.visible');
});

// Comando personalizado para enviar mensaje
Cypress.Commands.add('sendMessage', (message: string) => {
  cy.get('[data-cy="message-input"]').type(message);
  cy.get('[data-cy="send-button"]').click();
  cy.get('[data-cy="message-input"]').should('have.value', '');
});

// Declarar tipos para TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      selectChat(chatId: string): Chainable<void>;
      sendMessage(message: string): Chainable<void>;
    }
  }
}
