/// <reference types="cypress" />

// Tipos para los datos de autenticación
interface AuthTestData {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  expiresAt: string;
}

declare namespace Cypress {
  interface Chainable {
    /**
     * Comando para hacer login automático mediante UI
     * @param email - Email del usuario
     * @param password - Contraseña del usuario
     */
    login(email?: string, password?: string): Chainable<void>;
    
    /**
     * Comando para autenticación automática mediante token (evita UI)
     * @param token - Token de autenticación (opcional, usa uno por defecto)
     */
    loginByToken(token?: string): Chainable<void>;
    
    /**
     * Comando para hacer logout
     */
    logout(): Chainable<void>;
    
    /**
     * Comando para verificar que el usuario está autenticado
     */
    shouldBeAuthenticated(): Chainable<void>;
    
    /**
     * Comando para verificar que el usuario NO está autenticado
     */
    shouldNotBeAuthenticated(): Chainable<void>;
    
    /**
     * Comando para limpiar el almacenamiento local de autenticación
     */
    clearAuth(): Chainable<void>;
    
    /**
     * Comando para configurar datos de usuario mock en localStorage
     */
    setAuthData(authData: AuthTestData): Chainable<void>;
  }
}
