/// <reference types="cypress" />

/**
 * Tests para validar la lógica de autenticación/login
 * Estos tests verifican que el sistema de login funcione correctamente
 */
describe('Sistema de Autenticación - Login', () => {
  beforeEach(() => {
    // Limpiar estado de autenticación antes de cada test
    cy.clearAuth();
  });

  describe('Validación del Formulario', () => {
    beforeEach(() => {
      cy.visit('/auth/login');
    });

    it('debe mostrar el formulario de login correctamente', () => {
      cy.get('[data-cy=login-form]').should('be.visible');
      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=password-input]').should('be.visible');
      cy.get('[data-cy=login-button]').should('be.visible');
    });

    it('debe requerir email y contraseña', () => {
      // Intentar enviar formulario vacío
      cy.get('[data-cy=login-button]').should('be.disabled');
      
      // Llenar solo email
      cy.get('[data-cy=email-input]').type('test@example.com');
      cy.get('[data-cy=login-button]').should('be.disabled');
      
      // Limpiar email y llenar solo contraseña
      cy.get('[data-cy=email-input]').clear();
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').should('be.disabled');
      
      // Llenar ambos campos
      cy.get('[data-cy=email-input]').type('test@example.com');
      cy.get('[data-cy=login-button]').should('not.be.disabled');
    });

    it('debe validar formato de email', () => {
      // Email inválido
      cy.get('[data-cy=email-input]').type('email-invalido');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').should('be.disabled');
      
      // Email válido
      cy.get('[data-cy=email-input]').clear().type('test@example.com');
      cy.get('[data-cy=login-button]').should('not.be.disabled');
    });

    it('debe validar longitud mínima de contraseña', () => {
      cy.get('[data-cy=email-input]').type('test@example.com');
      
      // Contraseña muy corta
      cy.get('[data-cy=password-input]').type('12345');
      cy.get('[data-cy=login-button]').should('be.disabled');
      
      // Contraseña válida (6+ caracteres)
      cy.get('[data-cy=password-input]').clear().type('123456');
      cy.get('[data-cy=login-button]').should('not.be.disabled');
    });
  });

  describe('Proceso de Login', () => {
    beforeEach(() => {
      cy.visit('/auth/login');
    });

    it('debe hacer login exitoso con credenciales válidas', () => {
      // Llenar formulario
      cy.get('[data-cy=email-input]').type('test@guiders.com');
      cy.get('[data-cy=password-input]').type('password123');
      
      // Enviar formulario
      cy.get('[data-cy=login-button]').click();
      
      // Verificar redirección (ya no debería estar en login)
      cy.url().should('not.include', '/auth/login');
      cy.url().should('include', '/dashboard');
      
      // Verificar que se guardaron los datos de autenticación
      cy.shouldBeAuthenticated();
    });

    it('debe mostrar error con credenciales inválidas', () => {
      // Llenar formulario con credenciales incorrectas que el mock server reconoce
      cy.get('[data-cy=email-input]').type('wrong@email.com');
      cy.get('[data-cy=password-input]').type('wrongpassword');
      cy.get('[data-cy=login-button]').click();
      
      // Verificar que se muestra el error
      cy.contains('El email o la contraseña no son correctos').should('be.visible');
      
      // Verificar que sigue en la página de login
      cy.url().should('include', '/auth/login');
      
      // Verificar que NO se guardaron datos de autenticación
      cy.shouldNotBeAuthenticated();
    });

    it('debe mostrar estado de carga durante el login', () => {
      cy.get('[data-cy=email-input]').type('test@guiders.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').click();
      
      // Verificar estado de carga (puede ser muy rápido con mock server)
      cy.get('[data-cy=login-button]').should('be.disabled');
    });
    });
  });

  describe('Manejo de Errores', () => {
    beforeEach(() => {
      cy.visit('/auth/login');
    });

    it('debe manejar errores de conexión', () => {
      // Usar credenciales especiales que el mock server reconoce para simular error de red
      cy.get('[data-cy=email-input]').type('network@error.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').click();
      
      // Verificar mensaje de error de conexión
      cy.contains('No pudimos conectarnos con el servidor').should('be.visible');
    });

    it('debe manejar errores del servidor (500)', () => {
      // Usar credenciales especiales que el mock server reconoce para simular error 500
      cy.get('[data-cy=email-input]').type('server@error.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').click();
      
      // Verificar mensaje de error genérico
      cy.contains('Ocurrió algo inesperado').should('be.visible');
    });
  });

  describe('Navegación y Redirección', () => {
    it('debe redirigir al dashboard después del login exitoso', () => {
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 200,
        body: {
          token: 'mock-jwt-token',
          user: { 
            id: 'user-123', 
            email: 'test@guiders.com',
            name: 'Usuario Test'
          }
        }
      }).as('loginSuccess');
      
      cy.visit('/auth/login');
      cy.get('[data-cy=email-input]').type('test@guiders.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').click();
      
      cy.wait('@loginSuccess');
      
      // Verificar redirección al dashboard
      cy.url().should('include', '/dashboard');
    });

    it('debe permitir acceso directo si ya está autenticado', () => {
      // Configurar usuario ya autenticado
      cy.loginByToken();
      
      // Intentar acceder a login
      cy.visit('/auth/login');
      
      // Debería redirigir automáticamente
      cy.url().should('not.include', '/auth/login');
    });
  });
});
