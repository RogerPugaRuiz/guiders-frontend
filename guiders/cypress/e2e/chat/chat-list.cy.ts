/// <reference types="cypress" />

describe('Chat Component - Lista de Chats', () => {
  beforeEach(() => {
    // Mock the chat service responses
    cy.intercept('GET', '**/api/chats**', {
      fixture: 'chats-response.json'
    }).as('getChats');
    
    // Visit the chat page
    cy.visit('/chat');
  });

  it('should display the chat list correctly', () => {
    // Wait for the API call to complete
    cy.wait('@getChats');

    // Check that the page header is displayed
    cy.get('.gh-page-header__title').should('contain.text', 'Chat en Tiempo Real');
    
    // Check that chat items are displayed
    cy.get('[data-cy=chat-list]').should('exist');
    cy.get('[data-cy=chat-item]').should('have.length.greaterThan', 0);
    
    // Check first chat item content
    cy.get('[data-cy=chat-item]').first().within(() => {
      cy.get('.chat-item__name').should('be.visible');
      cy.get('.chat-item__time').should('be.visible');
      cy.get('.chat-item__preview').should('be.visible');
      cy.get('.chat-item__avatar span').should('be.visible');
      cy.get('.chat-item__status').should('be.visible');
    });
  });

  it('should show loading state while fetching chats', () => {
    // Mock a delayed response
    cy.intercept('GET', '**/api/chats**', {
      delay: 1000,
      fixture: 'chats-response.json'
    }).as('getChatsDelayed');

    cy.visit('/chat');

    // Check loading state is shown
    cy.get('[data-cy=chat-loading]').should('be.visible');
    cy.get('[data-cy=chat-loading]').should('contain.text', 'Cargando chats...');

    // Wait for the response and check loading disappears
    cy.wait('@getChatsDelayed');
    cy.get('[data-cy=chat-loading]').should('not.exist');
  });

  it('should handle error state correctly', () => {
    // Mock error response
    cy.intercept('GET', '**/api/chats**', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('getChatsError');

    cy.visit('/chat');
    cy.wait('@getChatsError');

    // Check error state is shown
    cy.get('[data-cy=chat-error]').should('be.visible');
    cy.get('[data-cy=chat-error]').should('contain.text', 'Error al cargar los chats');
    cy.get('[data-cy=retry-button]').should('be.visible');
  });

  it('should allow retrying after error', () => {
    // First request fails
    cy.intercept('GET', '**/api/chats**', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('getChatsError');

    cy.visit('/chat');
    cy.wait('@getChatsError');

    // Mock successful retry
    cy.intercept('GET', '**/api/chats**', {
      fixture: 'chats-response.json'
    }).as('getChatsRetry');

    // Click retry button
    cy.get('[data-cy=retry-button]').click();
    cy.wait('@getChatsRetry');

    // Check that chats are now displayed
    cy.get('[data-cy=chat-error]').should('not.exist');
    cy.get('[data-cy=chat-item]').should('have.length.greaterThan', 0);
  });

  it('should show empty state when no chats are available', () => {
    // Mock empty response
    cy.intercept('GET', '**/api/chats**', {
      body: {
        data: [],
        pagination: { hasMore: false, limit: 50 }
      }
    }).as('getEmptyChats');

    cy.visit('/chat');
    cy.wait('@getEmptyChats');

    // Check empty state is shown
    cy.get('[data-cy=chat-empty]').should('be.visible');
    cy.get('[data-cy=chat-empty]').should('contain.text', 'No hay chats disponibles');
    cy.get('[data-cy=chat-item]').should('not.exist');
  });

  it('should filter chats correctly', () => {
    cy.wait('@getChats');

    // Test filter functionality
    cy.get('[data-cy=chat-filter]').should('exist');
    
    // Select "Activas" filter
    cy.get('[data-cy=chat-filter]').click();
    cy.get('[data-value="active"]').click();
    
    // Check that filtering works (assuming test data has different statuses)
    cy.get('[data-cy=chat-item]').should('exist');
    
    // Select "Cerradas" filter
    cy.get('[data-cy=chat-filter]').click();
    cy.get('[data-value="closed"]').click();
    
    // Select "Todas" filter to reset
    cy.get('[data-cy=chat-filter]').click();
    cy.get('[data-value="all"]').click();
  });

  it('should display participant status correctly', () => {
    cy.wait('@getChats');

    // Check that online/offline status is displayed
    cy.get('[data-cy=chat-item]').first().within(() => {
      cy.get('.chat-item__status').should('have.class')
        .and('satisfy', ($el) => {
          const classes = $el[0].className;
          return classes.includes('chat-item__status--online') || 
                 classes.includes('chat-item__status--offline');
        });
    });
  });

  it('should format message timestamps correctly', () => {
    cy.wait('@getChats');

    // Check that timestamps are displayed and not empty
    cy.get('[data-cy=chat-item]').each(($item) => {
      cy.wrap($item).find('.chat-item__time').should('not.be.empty');
    });
  });

  it('should display participant initials correctly', () => {
    cy.wait('@getChats');

    // Check that initials are displayed and are 1-2 characters
    cy.get('[data-cy=chat-item]').each(($item) => {
      cy.wrap($item).find('.chat-item__avatar span').first()
        .should('not.be.empty')
        .and('satisfy', ($el) => {
          const text = $el.text();
          return text.length >= 1 && text.length <= 2;
        });
    });
  });

  it('should handle long message previews correctly', () => {
    cy.wait('@getChats');

    // Check that message previews are displayed
    cy.get('[data-cy=chat-item]').each(($item) => {
      cy.wrap($item).find('.chat-item__preview').should('not.be.empty');
    });
  });

  it('should have accessible chat items with proper attributes', () => {
    cy.wait('@getChats');

    // Check that chat items have proper data attributes for testing
    cy.get('[data-cy=chat-item]').each(($item) => {
      cy.wrap($item).should('have.attr', 'data-chat-id');
    });
  });
});