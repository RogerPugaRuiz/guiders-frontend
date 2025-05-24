describe('Backoffice App', () => {
  it('should visit the home page', () => {
    cy.visit('/');
    cy.contains('Hello, backoffice');
  });
});
