describe('Guiders App - Basic Tests', () => {
  beforeEach(() => {
    // Interceptar llamadas a la API para testing
    cy.intercept('GET', '/api/health', { status: 'ok' }).as('healthCheck');
  });

  it('should load the application', () => {
    cy.visit('/');
    cy.contains('Guiders', { timeout: 10000 }).should('be.visible');
  });

  it('should redirect to login when not authenticated', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should display login form', () => {
    cy.visit('/login');
    cy.get('form').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });
});
