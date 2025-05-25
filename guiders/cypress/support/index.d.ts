/// <reference types="cypress" />

// Definiciones de tipos para comandos personalizados de Cypress
declare namespace Cypress {
  interface Chainable {
    /**
     * Comando personalizado para hacer login
     * @param email - Email del usuario
     * @param password - Contraseña del usuario
     * @example cy.login('usuario@example.com', 'password123')
     */
    login(email: string, password: string): Chainable<void>
    
    /**
     * Comando personalizado para navegar con Tab
     * @example cy.get('input').tab()
     */
    tab(): Chainable<JQuery<HTMLElement>>
    
    /**
     * Comando personalizado para verificar elementos de login visibles
     * @example cy.verifyLoginPageElements()
     */
    verifyLoginPageElements(): Chainable<void>
    
    /**
     * Comando personalizado para interceptar login exitoso
     * @example cy.interceptLoginSuccess()
     */
    interceptLoginSuccess(): Chainable<void>
    
    /**
     * Comando personalizado para interceptar login con error
     * @param statusCode - Código de estado HTTP del error
     * @param message - Mensaje de error
     * @example cy.interceptLoginError(401, 'Credenciales incorrectas')
     */
    interceptLoginError(statusCode: number, message: string): Chainable<void>
  }
}

// Tipos para las fixtures
export interface LoginSuccessFixture {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  refreshToken: string;
}

export interface LoginErrorFixture {
  message: string;
  field?: string;
}
