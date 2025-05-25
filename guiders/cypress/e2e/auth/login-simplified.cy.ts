import { interceptAuthAPIs, interceptCommonAPIErrors } from '../../support/api-helpers';

describe('Login Component - Casos de uso simplificados', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Happy Path', () => {
    it('debe permitir login exitoso con credenciales válidas', () => {
      // Usar el comando personalizado para interceptar APIs
      cy.interceptLoginSuccess();
      
      // Verificar elementos de la página
      cy.verifyLoginPageElements();
      
      // Realizar login usando comando personalizado
			cy.login('rogerpugaruiz@gmail.com', 'i/6:R*i?571W');
      
      // Verificar que se muestra el loading
      cy.contains('Iniciando sesión...').should('be.visible');
      
      // Verificar que se hizo la llamada a la API
      cy.wait('@loginSuccess');
      
      // Verificar redirección
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Casos de error', () => {
    it('debe manejar credenciales incorrectas', () => {
      cy.interceptLoginError(401, 'Credenciales incorrectas');
      
      cy.login('usuario@example.com', 'contraseñaincorrecta');
      
      cy.wait('@loginError');
      cy.get('.error-message').should('be.visible');
      cy.contains('No pudimos iniciar tu sesión. ¿Podrías intentarlo de nuevo?').should('be.visible');
    });

    it('debe manejar errores de validación del servidor', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 422,
        body: { 
          field: 'email',
          message: 'El email no está registrado'
        }
      }).as('validationError');
      
      cy.login('noexiste@example.com', '123456');
      
      cy.wait('@validationError');
      cy.get('[data-cy="email-input"]').should('have.class', 'error');
      cy.contains('El email no está registrado').should('be.visible');
    });
  });

  describe('Validaciones del formulario', () => {
    it('debe validar campos requeridos', () => {
      cy.get('[data-cy="login-button"]').click();
      
      cy.contains('No olvides escribir tu email').should('be.visible');
      cy.contains('Tu contraseña es necesaria para continuar').should('be.visible');
    });

    it('debe validar formato de email', () => {
      cy.get('[data-cy="email-input"]').type('email-invalido');
      cy.get('[data-cy="password-input"]').type('123456');
      cy.get('[data-cy="login-button"]').click();
      
      cy.contains('Ese email no parece válido. ¿Podrías revisarlo?').should('be.visible');
    });

    it('debe validar longitud mínima de contraseña', () => {
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('123');
      cy.get('[data-cy="login-button"]').click();
      
      cy.contains('Tu contraseña necesita al menos 6 caracteres para ser segura').should('be.visible');
    });
  });

  describe('Funcionalidad de UI', () => {
    it('debe alternar visibilidad de contraseña', () => {
      cy.get('[data-cy="password-input"]').type('micontraseña');
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
      
      cy.get('.password-toggle').click();
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'text');
      
      cy.get('.password-toggle').click();
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
    });

    it('debe enviar formulario con Enter', () => {
      cy.interceptLoginSuccess();
      
			cy.get('[data-cy="email-input"]').type('rogerpugaruiz@gmail.com');
			cy.get('[data-cy="password-input"]').type('i/6:R*i?571W{enter}');
      
      cy.wait('@loginSuccess');
    });

    it('debe funcionar en dispositivos móviles', () => {
      cy.viewport('iphone-x');
      cy.verifyLoginPageElements();
    });
  });
});
