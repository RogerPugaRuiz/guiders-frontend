/**
 * Helpers para manejo de APIs en tests de Cypress
 */

/**
 * Intercepta todas las llamadas de autenticación
 */
export const interceptAuthAPIs = () => {
  // Login exitoso
  cy.intercept("POST", "**/user/auth/login", { fixture: "login-success.json" }).as("loginAPI");
  
  // Logout
  cy.intercept("POST", "**/user/auth/logout", { statusCode: 200, body: { success: true } }).as("logoutAPI");
  
  // Refresh token
  cy.intercept("POST", "**/user/auth/refresh", { fixture: "login-success.json" }).as("refreshAPI");
  
  // Verificación de token
  cy.intercept("GET", "**/user/auth/validate", { 
    statusCode: 200, 
    body: { valid: true, user: { id: "123", email: "usuario@example.com" } } 
  }).as("verifyAPI");
};

/**
 * Simula un usuario ya autenticado
 * 
 * Nota: Estos helpers utilizan localStorage directamente en lugar de StorageService porque:
 * 1. Son herramientas de prueba que no forman parte del código de producción
 * 2. Necesitan manipular el estado de prueba directamente en el contexto del navegador de Cypress
 * 3. No tienen acceso a los servicios inyectados de Angular
 */
export const setAuthenticatedUser = () => {
  cy.window().then((win) => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidXN1YXJpb0BleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiY29tcGFueUlkIjoiY29tcGFueS0xMjMiLCJpZCI6InVzZXItMTIzIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE4OTYyMzkwMjJ9";
    const refreshToken = "refreshToken123456";
    
    win.localStorage.setItem("guiders_auth_token", token);
    win.localStorage.setItem("guiders_refresh_token", refreshToken);
    
    const user = {
      id: "user-123",
      email: "usuario@example.com",
      name: "Usuario Prueba",
      role: "user",
      companyId: "company-123",
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const session = {
      token,
      refreshToken,
      expiresAt: new Date(new Date().getTime() + 86400000).toISOString(), // 24 horas
      user
    };
    
    win.localStorage.setItem("guiders_user", JSON.stringify(user));
    win.localStorage.setItem("guiders_session", JSON.stringify(session));
  });
};

/**
 * Limpia la sesión de usuario
 * 
 * Nota: Usa localStorage directamente por las mismas razones explicadas en setAuthenticatedUser
 */
export const clearUserSession = () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
};

/**
 * Intercepta errores comunes de API
 */
export const interceptCommonAPIErrors = () => {
  // Error 401 - No autorizado
  cy.intercept("POST", "**/user/auth/login", {
    statusCode: 401,
    body: { message: "Credenciales incorrectas" }
  }).as("unauthorizedError");
  
  // Error 422 - Validación
  cy.intercept("POST", "**/user/auth/login", {
    statusCode: 422,
    body: { 
      field: "email",
      message: "El email no está registrado en nuestro sistema"
    }
  }).as("validationError");
  
  // Error 500 - Servidor
  cy.intercept("POST", "**/user/auth/login", {
    statusCode: 500,
    body: { message: "Error interno del servidor" }
  }).as("serverError");
  
  // Error de red
  cy.intercept("POST", "**/user/auth/login", { forceNetworkError: true }).as("networkError");
};
