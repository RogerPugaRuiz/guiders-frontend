describe('Login Component', () => {
  beforeEach(() => {
    // Visitar la página de login
    cy.visit('/login');
  });

  describe('Elementos de la interfaz', () => {
    it('debe mostrar todos los elementos visuales correctamente', () => {
      // Verificar el branding
      cy.contains('Guiders').should('be.visible');
      cy.contains('Conecta, interactúa y convierte visitantes en tiempo real').should('be.visible');
      
      // Verificar el título del formulario
      cy.contains('¡Bienvenido de vuelta!').should('be.visible');
      cy.contains('Inicia sesión para continuar tu viaje').should('be.visible');
      
      // Verificar que el formulario existe
      cy.get('[data-cy="login-form"]').should('be.visible');
      
      // Verificar que los campos existen
      cy.get('[data-cy="email-input"]').should('be.visible');
      cy.get('[data-cy="password-input"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('be.visible');
      
      // Verificar enlaces adicionales
      cy.contains('Recordarme').should('be.visible');
      cy.contains('¿Olvidaste tu contraseña?').should('be.visible');
      cy.contains('¿No tienes cuenta?').should('be.visible');
      cy.contains('Solicitar acceso').should('be.visible');
    });

    it('debe mostrar las ilustraciones SVG correctamente', () => {
      // Verificar logo SVG
      cy.get('.logo-svg').should('be.visible');
      
      // Verificar ilustración principal
      cy.get('.main-illustration').should('be.visible');
      
      // Verificar elementos animados de fondo
      cy.get('.background-shapes').should('be.visible');
      cy.get('.shape').should('have.length', 4);
    });
  });

  describe('Validación de formulario', () => {
    it('debe mostrar errores de validación para campos vacíos', () => {
      // Intentar enviar formulario vacío
      cy.get('[data-cy="login-button"]').click();
      
      // Verificar que aparecen los mensajes de error
      cy.contains('No olvides escribir tu email').should('be.visible');
      cy.contains('Tu contraseña es necesaria para continuar').should('be.visible');
      
      // Verificar que los campos tienen la clase de error
      cy.get('[data-cy="email-input"]').should('have.class', 'error');
      cy.get('[data-cy="password-input"]').should('have.class', 'error');
    });

    it('debe validar formato de email incorrecto', () => {
      // Escribir email inválido
      cy.get('[data-cy="email-input"]').type('email-invalido');
      cy.get('[data-cy="password-input"]').type('123456');
      cy.get('[data-cy="login-button"]').click();
      
      // Verificar mensaje de error de email
      cy.contains('Ese email no parece válido. ¿Podrías revisarlo?').should('be.visible');
      cy.get('[data-cy="email-input"]').should('have.class', 'error');
    });

    it('debe validar contraseña muy corta', () => {
      // Escribir contraseña muy corta
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('123');
      cy.get('[data-cy="login-button"]').click();
      
      // Verificar mensaje de error de contraseña
      cy.contains('Tu contraseña necesita al menos 6 caracteres para ser segura').should('be.visible');
      cy.get('[data-cy="password-input"]').should('have.class', 'error');
    });

    it('debe habilitar el botón solo cuando el formulario es válido', () => {
      // Inicialmente el botón debe estar deshabilitado
      cy.get('[data-cy="login-button"]').should('be.disabled');
      
      // Completar email válido
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="login-button"]').should('be.disabled');
      
      // Completar contraseña válida
      cy.get('[data-cy="password-input"]').type('123456');
      cy.get('[data-cy="login-button"]').should('not.be.disabled');
    });
  });

  describe('Funcionalidad de mostrar/ocultar contraseña', () => {
    it('debe alternar la visibilidad de la contraseña', () => {
      // Escribir contraseña
      cy.get('[data-cy="password-input"]').type('micontraseña123');
      
      // Verificar que inicialmente es tipo password
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
      
      // Hacer clic en el botón de mostrar contraseña
      cy.get('.password-toggle').click();
      
      // Verificar que cambió a tipo text
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'text');
      
      // Hacer clic nuevamente para ocultar
      cy.get('.password-toggle').click();
      
      // Verificar que volvió a tipo password
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Proceso de login', () => {
    beforeEach(() => {
      // Interceptar la llamada de login
      cy.intercept('POST', '/api/auth/login', { fixture: 'login-success.json' }).as('loginRequest');
    });

    it('debe realizar login exitoso con credenciales válidas', () => {
      // Completar formulario
      cy.get('[data-cy="email-input"]').type('usuario@example.com');
      cy.get('[data-cy="password-input"]').type('contraseña123');
      
      // Enviar formulario
      cy.get('[data-cy="login-button"]').click();
      
      // Verificar que se muestra el estado de carga
      cy.contains('Iniciando sesión...').should('be.visible');
      cy.get('.loading-spinner').should('be.visible');
      
      // Verificar que se hizo la llamada a la API
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.request.body).to.deep.include({
          email: 'usuario@example.com',
          password: 'contraseña123'
        });
      });
      
      // Verificar redirección al dashboard
      cy.url().should('include', '/dashboard');
    });

    it('debe manejar errores de autenticación del servidor', () => {
      // Interceptar error de autenticación
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { message: 'Credenciales incorrectas' }
      }).as('loginError');
      
      // Completar formulario
      cy.get('[data-cy="email-input"]').type('usuario@example.com');
      cy.get('[data-cy="password-input"]').type('contraseñaincorrecta');
      
      // Enviar formulario
      cy.get('[data-cy="login-button"]').click();
      
      // Esperar la respuesta del servidor
      cy.wait('@loginError');
      
      // Verificar que se muestra el mensaje de error
      cy.get('.error-message').should('be.visible');
      cy.contains('No pudimos iniciar tu sesión. ¿Podrías intentarlo de nuevo?').should('be.visible');
      
      // Verificar que el botón vuelve al estado normal
      cy.contains('Iniciar sesión').should('be.visible');
      cy.get('.loading-spinner').should('not.exist');
    });

    it('debe manejar errores de validación del servidor', () => {
      // Interceptar error de validación
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 422,
        body: { 
          field: 'email',
          message: 'El email no está registrado en nuestro sistema'
        }
      }).as('validationError');
      
      // Completar formulario
      cy.get('[data-cy="email-input"]').type('noexiste@example.com');
      cy.get('[data-cy="password-input"]').type('123456');
      
      // Enviar formulario
      cy.get('[data-cy="login-button"]').click();
      
      // Esperar la respuesta del servidor
      cy.wait('@validationError');
      
      // Verificar que se muestra el error en el campo específico
      cy.get('[data-cy="email-input"]').should('have.class', 'error');
      cy.contains('El email no está registrado en nuestro sistema').should('be.visible');
    });

    it('debe manejar errores de red', () => {
      // Interceptar error de red
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('networkError');
      
      // Completar formulario
      cy.get('[data-cy="email-input"]').type('usuario@example.com');
      cy.get('[data-cy="password-input"]').type('123456');
      
      // Enviar formulario
      cy.get('[data-cy="login-button"]').click();
      
      // Esperar el error de red
      cy.wait('@networkError');
      
      // Verificar mensaje de error genérico
      cy.get('.error-message').should('be.visible');
      cy.contains('No pudimos iniciar tu sesión. ¿Podrías intentarlo de nuevo?').should('be.visible');
    });
  });

  describe('Interacciones del usuario', () => {
    it('debe funcionar correctamente la navegación con teclado', () => {
      // Navegar con Tab
      cy.get('body').tab();
      cy.get('[data-cy="email-input"]').should('be.focused');
      
      cy.get('[data-cy="email-input"]').tab();
      cy.get('[data-cy="password-input"]').should('be.focused');
      
      cy.get('[data-cy="password-input"]').tab();
      cy.get('[data-cy="login-button"]').should('be.focused');
    });

    it('debe permitir enviar el formulario con Enter', () => {
      // Interceptar la llamada de login
      cy.intercept('POST', '/api/auth/login', { fixture: 'login-success.json' }).as('loginRequest');
      
      // Completar formulario
      cy.get('[data-cy="email-input"]').type('usuario@example.com');
      cy.get('[data-cy="password-input"]').type('contraseña123{enter}');
      
      // Verificar que se envió el formulario
      cy.wait('@loginRequest');
    });

    it('debe limpiar errores al escribir en los campos', () => {
      // Generar error primero
      cy.get('[data-cy="login-button"]').click();
      cy.contains('No olvides escribir tu email').should('be.visible');
      
      // Escribir en el campo email
      cy.get('[data-cy="email-input"]').type('test@example.com');
      
      // Verificar que el error desaparece
      cy.get('[data-cy="email-input"]').should('not.have.class', 'error');
      cy.contains('No olvides escribir tu email').should('not.exist');
    });
  });

  describe('Responsive y accesibilidad', () => {
    it('debe funcionar correctamente en dispositivos móviles', () => {
      // Cambiar a vista móvil
      cy.viewport('iphone-x');
      
      // Verificar que los elementos siguen siendo visibles
      cy.get('[data-cy="login-form"]').should('be.visible');
      cy.get('[data-cy="email-input"]').should('be.visible');
      cy.get('[data-cy="password-input"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('be.visible');
      
      // Verificar que el logo sigue visible
      cy.contains('Guiders').should('be.visible');
    });

    it('debe tener etiquetas accesibles', () => {
      // Verificar labels asociados
      cy.get('label[for="email"]').should('exist');
      cy.get('label[for="password"]').should('exist');
      
      // Verificar placeholders
      cy.get('[data-cy="email-input"]').should('have.attr', 'placeholder', 'Introduce tu email');
      cy.get('[data-cy="password-input"]').should('have.attr', 'placeholder', 'Introduce tu contraseña');
    });
  });

  describe('Características de UX', () => {
    it('debe mantener el foco después de mostrar errores de validación', () => {
      // Completar email válido y contraseña inválida
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('123').blur();
      
      // El campo con error debe mantener el foco disponible
      cy.get('[data-cy="password-input"]').focus();
      cy.get('[data-cy="password-input"]').should('be.focused');
    });

    it('debe recordar el estado del checkbox "Recordarme"', () => {
      // Marcar checkbox
      cy.get('#remember-me').check();
      cy.get('#remember-me').should('be.checked');
      
      // Desmarcar checkbox
      cy.get('#remember-me').uncheck();
      cy.get('#remember-me').should('not.be.checked');
    });

    it('debe tener animaciones fluidas', () => {
      // Verificar que las animaciones CSS están presentes
      cy.get('.logo-svg').should('be.visible');
      cy.get('.main-illustration').should('be.visible');
      cy.get('.shape').should('have.length.greaterThan', 0);
    });
  });
});