import { defineConfig } from 'cypress';

// Obtener el puerto de la variable de entorno o usar 4201 por defecto
const port = process.env.PORT || '4201';

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${port}`,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
  },
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.{js,jsx,ts,tsx}'
  },
});
