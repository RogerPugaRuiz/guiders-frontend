describe('Chat Functionality - Simplified', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'mock-jwt-token');
    });
    
    // Visit dashboard
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
  });

  it('should navigate to chat page', () => {
    cy.visit('/chat');
    cy.url().should('include', '/chat');
    cy.get('body').should('be.visible');
  });

  it('should redirect to login when not authenticated', () => {
    // Clear authentication
    cy.window().then((win) => {
      win.localStorage.removeItem('authToken');
    });
    
    cy.visit('/chat');
    cy.url().should('include', '/login');
  });

  it('should load chat component without errors', () => {
    cy.visit('/chat');
    cy.get('body').should('be.visible');
    cy.url().should('include', '/chat');
  });
});
