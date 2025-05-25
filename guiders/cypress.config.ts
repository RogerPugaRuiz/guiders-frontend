import { defineConfig } from 'cypress';

// Obtener el puerto de la variable de entorno o usar 4200 por defecto
const port = process.env['PORT'] || '4200';

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${port}`,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    
    // Configuraciones para tests de autenticación
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    
    // Timeouts optimizados
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    
    // Variables de entorno para tests
    env: {
      // URLs de API para tests
      apiUrl: 'http://localhost:3000',
      mockServerUrl: 'http://localhost:3000',
      
      // Estrategias de Testing
      USE_REAL_API: false, // Por defecto usar mock
      USE_MOCK_SERVER: true, // Usar servidor mock por defecto
      RUN_INTEGRATION_TESTS: false, // Activar solo cuando sea necesario
      RUN_PERFORMANCE_TESTS: true, // Tests de performance con mock
      
      // Configuración de Backend Real
      API_BASE_URL: 'http://localhost:3000',
      
      // Credenciales de prueba
      testUser: {
        email: 'test@guiders.com',
        password: 'password123'
      },
      
      // Configuración de autenticación
      auth: {
        tokenKey: 'guiders_auth_token',
        sessionKey: 'guiders_session',
        userKey: 'guiders_user'
      }
    },
    
    // Configuración específica por tipo de test
    setupNodeEvents(on, config) {
      // Configurar diferentes entornos según variables
      if (config.env['USE_REAL_API']) {
        config.env['TEST_MODE'] = 'integration';
      } else {
        config.env['TEST_MODE'] = 'mock';
      }
      
      return config;
    }
  },
  
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.{js,jsx,ts,tsx}'
  },
});
