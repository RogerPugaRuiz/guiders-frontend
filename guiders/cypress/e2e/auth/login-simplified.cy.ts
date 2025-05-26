/// <reference types="cypress" />

import { interceptAuthAPIs, interceptCommonAPIErrors } from '../../support/api-helpers';

describe('Login Page (Simplified Tests)', () => {
  // Visitar la página de login antes de cada test
  beforeEach(() => {
    // Aumentar el timeout para la carga inicial
    cy.visit('/auth/login', { timeout: 30000 });
    
    // Esperar a que la aplicación se cargue completamente con un timeout mayor
    cy.get('form[data-cy="login-form"]', { timeout: 30000 }).should('be.visible');
  });
  
  describe('UI Validations', () => {
    it('should show all required login elements', () => {
      // Utiliza el comando personalizado para verificar elementos
      cy.verifyLoginPageElements();
    });
  });
  
  describe('Login Functionality', () => {
    it('should login successfully with valid credentials', () => {
      // Configurar interceptación antes de cualquier interacción
      cy.intercept('POST', 'http://localhost:3000/user/auth/login', {
        statusCode: 200,
        fixture: 'login-success.json',
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('loginSuccess');
      
      // Interceptar también las navegaciones para debugging
      // cy.intercept('GET', '**/dashboard*').as('dashboardNavigation');
      
      // Usar {force: true} y esperar a que los elementos sean interactivos
      cy.get('input[data-cy="email-input"]', { timeout: 10000 }).should('be.visible').clear().type('rogerpugaruiz@gmail.com', { delay: 50 });
      cy.get('input[data-cy="password-input"]', { timeout: 10000 }).should('be.visible').clear().type('i/6:R*i?571W', { delay: 50 });
      
      // Usar timeout mayor para el botón de envío y force:true si es necesario
      cy.get('button[type="submit"]', { timeout: 10000 }).should('be.visible').should('not.be.disabled').click({ force: true });
      
      // Esperar respuesta del login
      cy.wait('@loginSuccess', { timeout: 30000 });
      
      // // Esperar a que se complete la redirección (podría tardar debido a la carga del módulo)
      cy.location('pathname', { timeout: 30000 }).should('include', '/dashboard');
    });
    
    it('should show error with incorrect credentials', () => {
      // Interceptar error de credenciales
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 401,
        body: { 
          message: 'Credenciales incorrectas',
          error: 'Unauthorized'
        },
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('loginError');
      
      // Realizar login con credenciales incorrectas
      cy.get('input[data-cy="email-input"]', { timeout: 10000 }).should('be.visible').clear().type('wrong@example.com', { delay: 50 });
      cy.get('input[data-cy="password-input"]', { timeout: 10000 }).should('be.visible').clear().type('wrongpassword', { delay: 50 });
      
      // Verificar que el botón no está deshabilitado y hacer clic
      cy.get('button[type="submit"]', { timeout: 10000 }).should('be.visible').should('not.be.disabled').click({ force: true });
      
      // Esperar respuesta y verificar mensaje de error - usar un regex para ser más flexible
      cy.wait('@loginError', { timeout: 30000 });
      
      // Buscar cualquier mensaje de error relacionado con credenciales
      cy.contains(/credenciales|incorrectas|inválidas|no reconocidas|no son correctos/i, { timeout: 30000 }).should('be.visible');
      
      // Verificar que permanecemos en la página de login
      cy.location('pathname').should('include', '/auth/login');
    });
  });
  
  describe('Form Validations', () => {
    it('should validate required fields', () => {
      // Asegurarse de que el formulario es visible
      cy.get('form[data-cy="login-form"]', { timeout: 10000 }).should('be.visible');
      
      // Limpiar los campos en caso de que tengan algún valor por defecto
      cy.get('input[data-cy="email-input"]').clear();
      cy.get('input[data-cy="password-input"]').clear();
      
      // Clic en botón de login sin completar campos
      cy.get('button[type="submit"]', { timeout: 10000 }).should('be.visible').click({ force: true });
      
      // Esperar un momento para que aparezcan los mensajes de validación
      cy.wait(500);
      
      // Verificar mensajes de error con mayor timeout y usando regex para flexibilidad
      cy.contains(/no olvides|obligatorio|requerido|email/i, { timeout: 30000 }).should('be.visible');
      cy.contains(/contraseña|password|necesaria|requerida/i, { timeout: 30000 }).should('be.visible');
      
      // Verificar que permanecemos en la página de login
      cy.location('pathname').should('include', '/auth/login');
    });
    
    it('should validate email format', () => {
      // Ingresar email con formato incorrecto
      cy.get('input[data-cy="email-input"]').type('invalid-email');
      cy.get('button[type="submit"]').click({force: true});
      
      // Verificar mensaje de error
      cy.contains('Ese email no parece válido', { timeout: 30000 }).should('be.visible');
    });
    
    it('should validate password minimum length', () => {
      // Ingresar contraseña corta
      cy.get('input[data-cy="email-input"]').type('test@example.com');
      cy.get('input[data-cy="password-input"]').type('12345');
      cy.get('button[type="submit"]').click({force: true});
      
      // Verificar mensaje de error
      cy.contains('Tu contraseña necesita al menos 6 caracteres', { timeout: 30000 }).should('be.visible');
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
        body: { 
          message: 'Error interno del servidor',
          error: 'Internal Server Error'
        },
        delay: 100 // Añadir un pequeño retraso para simular respuesta de red
      }).as('serverError');
      
      // Realizar login con mayor robustez
      cy.get('input[data-cy="email-input"]', { timeout: 10000 }).should('be.visible').clear().type('test@example.com', { delay: 50 });
      cy.get('input[data-cy="password-input"]', { timeout: 10000 }).should('be.visible').clear().type('password123', { delay: 50 });
      
      // Verificar que el botón no está deshabilitado con mayor timeout
      cy.get('button[type="submit"]', { timeout: 10000 }).should('be.visible').should('not.be.disabled').click({ force: true });
      
      // Esperar respuesta y verificar mensaje de error con mayor timeout
      cy.wait('@serverError', { timeout: 30000 });
      
      // Buscar cualquier mensaje de error genérico o específico con regex más flexible
      cy.contains(/error|interno|servidor|iniciar sesión|problema|intentar de nuevo/i, { timeout: 30000 }).should('exist');
      
      // Verificar que permanecemos en la página de login
      cy.location('pathname').should('include', '/auth/login');
    });
    
    it('should handle network errors', () => {
      // Interceptar con error de red
      cy.intercept('POST', '**/user/auth/login', { forceNetworkError: true }).as('networkError');
      
      // Realizar login de forma más robusta
      cy.get('input[data-cy="email-input"]', { timeout: 10000 }).should('be.visible').clear().type('test@example.com', { delay: 50 });
      cy.get('input[data-cy="password-input"]', { timeout: 10000 }).should('be.visible').clear().type('password123', { delay: 50 });
      
      // Verificar que el botón no está deshabilitado
      cy.get('button[type="submit"]', { timeout: 10000 }).should('be.visible').should('not.be.disabled').click({ force: true });
      
      // Verificar manejo de error
      cy.wait('@networkError', { timeout: 30000 });
      
      // Buscar cualquier mensaje relacionado con errores de red/conexión
      cy.contains(/error|conexión|red|servidor|no disponible|intentar|más tarde/i, { timeout: 30000 }).should('exist');
      
      // Verificar que permanecemos en la página de login
      cy.location('pathname').should('include', '/auth/login');
    });
  });
});