/// <reference types="cypress" />

/**
 * Tests de ejemplo para funcionalidades específicas
 * Demuestra cómo usar autenticación automática para testear features sin perder tiempo en login
 */
describe('Ejemplo: Funcionalidades del Usuario', () => {
  beforeEach(() => {
    // Autenticación automática - sin UI de login
    cy.loginByToken();
    
    // Mock de APIs que se usan en la aplicación
    cy.intercept('GET', '**/user/profile', {
      statusCode: 200,
      body: {
        id: 'test-user-id',
        email: 'test@guiders.com',
        name: 'Usuario de Prueba',
        role: 'user',
        preferences: {
          theme: 'light',
          notifications: true
        }
      }
    }).as('getUserProfile');
    
    cy.intercept('PUT', '**/user/profile', {
      statusCode: 200,
      body: { success: true, message: 'Profile updated' }
    }).as('updateProfile');
  });

  it('debe cargar el perfil del usuario', () => {
    cy.visit('/profile');
    
    // Verificar autenticación
    cy.shouldBeAuthenticated();
    
    // Verificar que se carga el perfil
    cy.wait('@getUserProfile');
    
    // Verificaciones específicas del perfil
    // cy.contains('Usuario de Prueba').should('be.visible');
    // cy.contains('test@guiders.com').should('be.visible');
  });

  it('debe permitir actualizar información del perfil', () => {
    cy.visit('/profile');
    cy.wait('@getUserProfile');
    
    // Simular edición de perfil
    // cy.get('[data-cy=edit-profile-button]').click();
    // cy.get('[data-cy=name-input]').clear().type('Nuevo Nombre');
    // cy.get('[data-cy=save-profile-button]').click();
    
    // cy.wait('@updateProfile');
    
    // Verificar mensaje de éxito
    // cy.contains('Perfil actualizado').should('be.visible');
  });
});

describe('Ejemplo: Configuraciones de Usuario', () => {
  beforeEach(() => {
    cy.loginByToken();
    
    cy.intercept('GET', '**/user/settings', {
      statusCode: 200,
      body: {
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        privacy: {
          profilePublic: true,
          showEmail: false
        }
      }
    }).as('getSettings');
    
    cy.intercept('PUT', '**/user/settings', {
      statusCode: 200,
      body: { success: true }
    }).as('updateSettings');
  });

  it('debe cargar configuraciones del usuario', () => {
    cy.visit('/settings');
    cy.shouldBeAuthenticated();
    
    cy.wait('@getSettings');
    
    // Verificar que se muestran las configuraciones
    // cy.get('[data-cy=email-notifications]').should('be.checked');
    // cy.get('[data-cy=push-notifications]').should('not.be.checked');
  });

  it('debe permitir cambiar configuraciones', () => {
    cy.visit('/settings');
    cy.wait('@getSettings');
    
    // Cambiar configuraciones
    // cy.get('[data-cy=push-notifications]').click();
    // cy.get('[data-cy=save-settings-button]').click();
    
    // cy.wait('@updateSettings');
    
    // Verificar éxito
    // cy.contains('Configuraciones guardadas').should('be.visible');
  });
});

describe('Ejemplo: Tests de Flujos Complejos', () => {
  beforeEach(() => {
    // Autenticación con datos específicos para este test
    const customAuthData = {
      token: 'admin-token',
      user: {
        id: 'admin-user-id',
        email: 'admin@guiders.com',
        name: 'Administrador',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    cy.setAuthData(customAuthData);
  });

  it('debe permitir acceso a funciones de administrador', () => {
    cy.visit('/admin/dashboard');
    cy.shouldBeAuthenticated();
    
    // Verificar acceso a funciones de admin
    // cy.contains('Panel de Administración').should('be.visible');
  });

  it('debe manejar múltiples operaciones autenticadas', () => {
    // Mock de múltiples APIs
    cy.intercept('GET', '**/admin/users', { fixture: 'users.json' }).as('getUsers');
    cy.intercept('POST', '**/admin/users', { statusCode: 201 }).as('createUser');
    cy.intercept('DELETE', '**/admin/users/*', { statusCode: 200 }).as('deleteUser');
    
    cy.visit('/admin/users');
    cy.shouldBeAuthenticated();
    
    // Operaciones secuenciales sin re-autenticación
    cy.wait('@getUsers');
    
    // Crear usuario
    // cy.get('[data-cy=add-user-button]').click();
    // cy.get('[data-cy=user-email]').type('newuser@example.com');
    // cy.get('[data-cy=submit-user]').click();
    // cy.wait('@createUser');
    
    // Eliminar usuario  
    // cy.get('[data-cy=delete-user-button]').first().click();
    // cy.get('[data-cy=confirm-delete]').click();
    // cy.wait('@deleteUser');
  });
});

describe('Ejemplo: Tests de Performance con Autenticación', () => {
  it('debe cargar rápidamente con autenticación automática', () => {
    const startTime = Date.now();
    
    // Autenticación instantánea
    cy.loginByToken();
    
    cy.visit('/dashboard');
    cy.shouldBeAuthenticated();
    
    // Verificar que la carga es rápida (sin tiempo de login)
    cy.then(() => {
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(3000); // Menos de 3 segundos
    });
  });

  it('debe manejar múltiples páginas sin re-autenticación', () => {
    cy.loginByToken();
    
    const pages = ['/dashboard', '/profile', '/settings'];
    
    pages.forEach(page => {
      cy.visit(page);
      cy.shouldBeAuthenticated();
      // Verificar que cada página carga correctamente
    });
  });
});

describe('Ejemplo: Tests de Integración con API', () => {
  beforeEach(() => {
    cy.loginByToken();
  });

  it('debe manejar respuestas reales de API', () => {
    // Este test podría usar la API real si está disponible
    // cy.request({
    //   method: 'GET',
    //   url: '/api/user/profile',
    //   headers: {
    //     'Authorization': 'Bearer mock-jwt-token'
    //   }
    // }).then((response) => {
    //   expect(response.status).to.eq(200);
    //   expect(response.body).to.have.property('email');
    // });
  });

  it('debe validar headers de autorización', () => {
    let requestHeaders: any;
    
    cy.intercept('GET', '**/user/profile', (req) => {
      requestHeaders = req.headers;
      req.reply({ statusCode: 200, body: { id: 'test' } });
    }).as('profileRequest');
    
    cy.visit('/profile');
    cy.wait('@profileRequest');
    
    // Verificar que se envió el header de autorización
    cy.then(() => {
      expect(requestHeaders).to.have.property('authorization');
      expect(requestHeaders.authorization).to.include('Bearer');
    });
  });
});
