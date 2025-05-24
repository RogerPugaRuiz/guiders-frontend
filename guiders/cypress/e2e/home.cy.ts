describe('Guiders App', () => {
  it('should visit the home page', () => {
    cy.visit('/');
    cy.contains('Hello, guiders');
  });
});
