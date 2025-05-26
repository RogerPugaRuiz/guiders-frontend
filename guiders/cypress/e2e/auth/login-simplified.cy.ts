/// <reference types="cypress" />

import { interceptAuthAPIs, interceptCommonAPIErrors } from '../../support/api-helpers';

describe('Login Page (Simplified Tests)', () => {
  // Visitar la página de login antes de cada test
  beforeEach(() => {
    cy.visit('/auth/login');
    // Esperar a que la aplicación se cargue completamente con un timeout mayor
    cy.get('form[data-cy="login-form"]', { timeout: 15000 }).should('be.visible');
  });
  
  describe('UI Validations', () => {
    it('should show all required login elements', () => {
      // Utiliza el comando personalizado para verificar elementos
      cy.verifyLoginPageElements();
    });
  });
  
  describe('Login Functionality', () => {
    it('should login successfully with valid credentials', () => {
      // Utiliza comandos personalizados para interceptar y realizar login
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 200,
        fixture: 'login-success.json',
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('loginSuccess');
      
      cy.get('input[data-cy="email-input"]').type('usuario@example.com');
      cy.get('input[data-cy="password-input"]').type('password123');
      
      // Verificar que el botón no está deshabilitado
      cy.get('button[type="submit"]').should('not.be.disabled');
      cy.get('button[type="submit"]').click();
      
      // Esperar respuesta y verificar redirección
      cy.wait('@loginSuccess', { timeout: 20000 });
      cy.url().should('include', '/dashboard', { timeout: 10000 });
    });
    
    it('should show error with incorrect credentials', () => {
      // Interceptar error de credenciales
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 401,
        body: { message: 'Credenciales incorrectas' },
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('loginError');
      
      // Realizar login con credenciales incorrectas
      cy.get('input[data-cy="email-input"]').type('wrong@example.com');
      cy.get('input[data-cy="password-input"]').type('wrongpassword');
      
      // Verificar que el botón no está deshabilitado
      cy.get('button[type="submit"]').should('not.be.disabled');
      cy.get('button[type="submit"]').click();
      
      // Esperar respuesta y verificar mensaje de error
      cy.wait('@loginError');
      cy.contains('Credenciales incorrectas').should('be.visible');
    });
  });
  
  describe('Form Validations', () => {
    it('should validate required fields', () => {
      // Clic en botón de login sin completar campos
      cy.get('button[type="submit"]').click({force: true});
      
      // Verificar mensajes de error
      cy.contains('No olvides escribir tu email').should('be.visible');
      cy.contains('Tu contraseña es necesaria para continuar').should('be.visible');
    });
    
    it('should validate email format', () => {
      // Ingresar email con formato incorrecto
      cy.get('input[data-cy="email-input"]').type('invalid-email');
      cy.get('button[type="submit"]').click({force: true});
      
      // Verificar mensaje de error
      cy.contains('Ese email no parece válido').should('be.visible');
    });
    
    it('should validate password minimum length', () => {
      // Ingresar contraseña corta
      cy.get('input[data-cy="email-input"]').type('test@example.com');
      cy.get('input[data-cy="password-input"]').type('12345');
      cy.get('button[type="submit"]').click({force: true});
      
      // Verificar mensaje de error
      cy.contains('Tu contraseña necesita al menos 6 caracteres').should('be.visible');
    });
  });
  
  describe('Password Toggle', () => {
    it('should toggle password visibility', () => {
      // Ingresar contraseña
      cy.get('input[data-cy="password-input"]').type('password123');
      
      // Verificar que inicialmente es tipo password
      cy.get('input[data-cy="password-input"]').should('have.attr', 'type', 'password');
      
      // Clic en botón toggle
      cy.get('.password-toggle').click();
      
      // Verificar que cambió a tipo text
      cy.get('input[data-cy="password-input"]').should('have.attr', 'type', 'text');
    });
  });
  
  describe('Error Scenarios', () => {
    it('should handle server errors gracefully', () => {
      // Interceptar error de servidor
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 500,
        body: { message: 'Error interno del servidor' },
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('serverError');
      
      // Realizar login
      cy.get('input[data-cy="email-input"]').type('test@example.com');
      cy.get('input[data-cy="password-input"]').type('password123');
      
      // Verificar que el botón no está deshabilitado
      cy.get('button[type="submit"]').should('not.be.disabled');
      cy.get('button[type="submit"]').click();
      
      // Verificar mensaje de error
      cy.wait('@serverError');
      cy.contains('Error interno del servidor').should('be.visible');
    });
    
    it('should handle network errors', () => {
      // Interceptar con error de red
      cy.intercept('POST', '**/user/auth/login', { forceNetworkError: true }).as('networkError');
      
      // Realizar login
      cy.get('input[data-cy="email-input"]').type('test@example.com');
      cy.get('input[data-cy="password-input"]').type('password123');
      
      // Verificar que el botón no está deshabilitado
      cy.get('button[type="submit"]').should('not.be.disabled');
      cy.get('button[type="submit"]').click();
      
      // Verificar manejo de error
      cy.wait('@networkError');
      // El comportamiento específico dependerá de cómo la aplicación maneje estos errores
      // Por ejemplo, podría mostrar un mensaje como:
      cy.contains(/error|conexión|red/i).should('exist');
    });
  });
});