/// <reference types="cypress" />

import { interceptAuthAPIs, interceptCommonAPIErrors } from '../../support/api-helpers';

describe('Login Page Tests', () => {
  // Visitar la página de login antes de cada test
  beforeEach(() => {
    cy.visit('/auth/login');
    // Esperar a que la aplicación se cargue completamente
    cy.get('form[data-cy="login-form"]').should('be.visible');
  });

  describe('UI Elements and Branding', () => {
    it('should display all required login elements', () => {
      // Verificar elementos de branding
      cy.contains('Guiders').should('be.visible');
      cy.contains('¡Bienvenido de vuelta!').should('be.visible');

      // Verificar elementos del formulario
      cy.get('form[data-cy="login-form"]').should('exist');
      cy.get('input[data-cy="email-input"]').should('be.visible');
      cy.get('input[data-cy="password-input"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      
      // Verificar elementos adicionales de la UI
      cy.contains('Iniciar sesión para continuar tu viaje').should('be.visible');
      cy.contains('Email').should('be.visible');
      cy.contains('Contraseña').should('be.visible');
    });

    it('should have the correct input attributes and placeholders', () => {
      cy.get('input[data-cy="email-input"]')
        .should('have.attr', 'type', 'email')
        .and('have.attr', 'placeholder', 'Introduce tu email');
      
      cy.get('input[data-cy="password-input"]')
        .should('have.attr', 'type', 'password')
        .and('have.attr', 'placeholder', 'Introduce tu contraseña');
    });
  });

  describe('Form Validations', () => {
    it('should validate required fields when submitting empty form', () => {
      // Intentar enviar el formulario sin datos
      cy.get('button[type="submit"]').click({force: true});
      
      // Verificar mensajes de error para campos requeridos
      cy.contains('No olvides escribir tu email').should('be.visible');
      cy.contains('Tu contraseña es necesaria para continuar').should('be.visible');
    });

    it('should validate email format', () => {
      // Tipo email inválido
      cy.get('input[data-cy="email-input"]').type('invalid-email');
      cy.get('input[data-cy="password-input"]').type('password123');
      cy.get('button[type="submit"]').click({force: true});
      
      // Verificar mensaje de error de formato
      cy.contains('Ese email no parece válido').should('be.visible');
    });

    it('should validate password minimum length', () => {
      // Tipo contraseña demasiado corta
      cy.get('input[data-cy="email-input"]').type('test@example.com');
      cy.get('input[data-cy="password-input"]').type('12345');
      cy.get('button[type="submit"]').click({force: true});
      
      // Verificar mensaje de error de longitud
      cy.contains('Tu contraseña necesita al menos 6 caracteres').should('be.visible');
    });

    it('should clear errors when user corrects input', () => {
      // Provocar error
      cy.get('button[type="submit"]').click();
      cy.contains('No olvides escribir tu email').should('be.visible');
      
      // Corregir input
      cy.get('input[data-cy="email-input"]').type('test@example.com');
      
      // Verificar que el error desaparece
      cy.contains('No olvides escribir tu email').should('not.exist');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when clicking the eye icon', () => {
      // Inicialmente el tipo es "password"
      cy.get('input[data-cy="password-input"]')
        .should('have.attr', 'type', 'password')
        .type('mysecretpassword');
      
      // Hacer clic en el botón para mostrar contraseña
      cy.get('.password-toggle').click();
      
      // Verificar que ahora es tipo "text"
      cy.get('input[data-cy="password-input"]').should('have.attr', 'type', 'text');
      
      // Hacer clic nuevamente para ocultar
      cy.get('.password-toggle').click();
      
      // Verificar que volvió a tipo "password"
      cy.get('input[data-cy="password-input"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Successful Login', () => {
    it('should redirect after successful login', () => {
      // Interceptar la llamada API para simular login exitoso
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 200,
        fixture: 'login-success.json',
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('loginSuccess');
      
      // Completar formulario con credenciales válidas
      cy.get('input[data-cy="email-input"]').type('usuario@example.com');
      cy.get('input[data-cy="password-input"]').type('password123');
      
      // Verificar que el botón no está deshabilitado
      cy.get('button[type="submit"]').should('not.be.disabled');
      
      // Enviar formulario
      cy.get('button[type="submit"]').click();
      
      // Esperar la respuesta del interceptor
      cy.wait('@loginSuccess');
      
      // Dar tiempo para que ocurra la redirección y verificar
      cy.url().should('include', '/dashboard', { timeout: 5000 });
    });
  });

  describe('Login Error Handling', () => {
    it('should show error message with invalid credentials (401)', () => {
      // Interceptar error de credenciales inválidas
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 401,
        body: { message: 'Credenciales incorrectas' },
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('loginError');
      
      // Completar formulario
      cy.get('input[data-cy="email-input"]').type('wrong@example.com');
      cy.get('input[data-cy="password-input"]').type('wrongpassword');
      
      // Verificar que el botón no está deshabilitado
      cy.get('button[type="submit"]').should('not.be.disabled');
      
      // Enviar formulario
      cy.get('button[type="submit"]').click();
      
      // Esperar la respuesta del interceptor
      cy.wait('@loginError');
      
      // Verificar mensaje de error
      cy.contains('Credenciales incorrectas').should('be.visible');
    });
    
    it('should handle validation error from server (422)', () => {
      // Interceptar error de validación
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 422,
        body: { message: 'El email no está registrado en nuestro sistema' },
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('loginError');
      
      // Completar formulario
      cy.get('input[data-cy="email-input"]').type('notregistered@example.com');
      cy.get('input[data-cy="password-input"]').type('password123');
      
      // Verificar que el botón no está deshabilitado
      cy.get('button[type="submit"]').should('not.be.disabled');
      
      // Enviar formulario
      cy.get('button[type="submit"]').click();
      
      // Esperar la respuesta del interceptor
      cy.wait('@loginError');
      
      // Verificar mensaje de error
      cy.contains('El email no está registrado en nuestro sistema').should('be.visible');
    });
    
    it('should handle server error (500)', () => {
      // Interceptar error de servidor
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 500,
        body: { message: 'Error interno del servidor' },
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('loginError');
      
      // Completar formulario
      cy.get('input[data-cy="email-input"]').type('test@example.com');
      cy.get('input[data-cy="password-input"]').type('password123');
      
      // Verificar que el botón no está deshabilitado
      cy.get('button[type="submit"]').should('not.be.disabled');
      
      // Enviar formulario
      cy.get('button[type="submit"]').click();
      
      // Esperar la respuesta del interceptor
      cy.wait('@loginError');
      
      // Verificar mensaje de error
      cy.contains('Error interno del servidor').should('be.visible');
    });
  });

  describe('Keyboard Navigation and Accessibility', () => {
    it('should allow form submission with Enter key', () => {
      // Interceptar para simular login exitoso
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 200,
        fixture: 'login-success.json',
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('loginSuccess');
      
      // Escribir credenciales
      cy.get('input[data-cy="email-input"]').type('usuario@example.com');
      cy.get('input[data-cy="password-input"]').type('password123');
      
      // Presionar Enter en el ultimo campo
      cy.get('input[data-cy="password-input"]').type('{enter}', { force: true });
      
      // Esperar la respuesta del interceptor
      cy.wait('@loginSuccess');
      
      // Verificar redirección con un timeout adecuado
      cy.url().should('include', '/dashboard', { timeout: 5000 });
    });

    it('should navigate between inputs using Tab key', () => {
      // Enfocar el primer input
      cy.get('input[data-cy="email-input"]').focus();
      cy.focused().should('have.attr', 'data-cy', 'email-input');
      
      // Presionar Tab
      cy.get('input[data-cy="email-input"]').type('{tab}');
      
      // Verificar que el foco pasó al password
      cy.focused().should('have.attr', 'data-cy', 'password-input');
    });
  });
});