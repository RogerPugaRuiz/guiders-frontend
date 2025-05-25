/// <reference types="cypress" />

/**
 * Helpers para manejo de API en tests
 * Permite alternar entre mock y backend real
 */

// Configuración de entornos
export const API_CONFIG = {
  // Usar backend real o mock
  USE_REAL_API: Cypress.env('USE_REAL_API') || false,
  
  // URLs base
  MOCK_API_BASE: 'http://localhost:4200',
  REAL_API_BASE: Cypress.env('API_BASE_URL') || 'http://localhost:3000',
  
  // Credenciales para backend real
  REAL_TEST_USER: {
    email: Cypress.env('TEST_USER_EMAIL') || 'test@guiders.com',
    password: Cypress.env('TEST_USER_PASSWORD') || 'password123'
  }
};

/**
 * Configurar interceptores para autenticación
 * Puede usar mock o permitir llamadas reales
 */
export function setupAuthInterceptors(useMock: boolean = true) {
  if (useMock) {
    // Interceptores Mock - usando patrones que capturan cualquier URL
    cy.intercept('POST', '**/user/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        session: {
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'test-user-id',
            email: 'test@guiders.com',
            name: 'Usuario de Prueba',
            role: 'user',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      }
    }).as('loginMock');

    cy.intercept('GET', '**/user/auth/me', {
      statusCode: 200,
      body: {
        id: 'test-user-id',
        email: 'test@guiders.com',
        name: 'Usuario de Prueba',
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }).as('getCurrentUserMock');

    cy.intercept('GET', '**/user/auth/validate', {
      statusCode: 200,
      body: { valid: true }
    }).as('validateTokenMock');

    cy.intercept('POST', '**/user/auth/logout', {
      statusCode: 200,
      body: { success: true, message: 'Logout exitoso' }
    }).as('logoutMock');

  } else {
    // Permitir llamadas reales al backend
    // Solo interceptar para logging/debugging
    cy.intercept('POST', '**/user/auth/login').as('loginReal');
    cy.intercept('GET', '**/user/auth/me').as('getCurrentUserReal');
    cy.intercept('GET', '**/user/auth/validate').as('validateTokenReal');
    cy.intercept('POST', '**/user/auth/logout').as('logoutReal');
  }
}

/**
 * Configurar interceptores para errores específicos
 */
export function setupErrorInterceptors() {
  return {
    // Error de credenciales inválidas
    invalidCredentials: () => {
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 401,
        body: {
          success: false,
          message: 'El email o la contraseña no son correctos'
        }
      }).as('loginInvalidCredentials');
    },

    // Error de conexión
    networkError: () => {
      cy.intercept('POST', '**/user/auth/login', {
        forceNetworkError: true
      }).as('loginNetworkError');
    },

    // Error del servidor
    serverError: () => {
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 500,
        body: { 
          success: false,
          message: 'Algo salió mal en nuestros servidores. Ya estamos trabajando para solucionarlo. Inténtalo en unos minutos.' 
        }
      }).as('loginServerError');
    },

    // Token expirado
    expiredToken: () => {
      cy.intercept('GET', '**/user/auth/validate', {
        statusCode: 401,
        body: { valid: false, message: 'Token expired' }
      }).as('expiredToken');
    },

    // Error de validación
    validationError: () => {
      cy.intercept('POST', '**/user/auth/login', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Datos de entrada inválidos',
          field: 'email'
        }
      }).as('loginValidationError');
    }
  };
}

/**
 * Comando personalizado para configurar el entorno de pruebas
 */
Cypress.Commands.add('setupTestEnvironment', (options: {
  useMock?: boolean;
  scenario?: 'success' | 'invalidCredentials' | 'networkError' | 'serverError';
} = {}) => {
  const { useMock = true, scenario = 'success' } = options;
  
  if (scenario === 'success') {
    setupAuthInterceptors(useMock);
  } else {
    const errorInterceptors = setupErrorInterceptors();
    errorInterceptors[scenario]?.();
  }
});

// Extender tipos de Cypress
declare global {
  namespace Cypress {
    interface Chainable {
      setupTestEnvironment(options?: {
        useMock?: boolean;
        scenario?: 'success' | 'invalidCredentials' | 'networkError' | 'serverError';
      }): Chainable<void>;
    }
  }
}
