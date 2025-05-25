/**
 * Utilidades para el manejo de tokens JWT
 */

/**
 * Decodifica un token JWT sin verificar la firma
 * Solo extrae el payload para obtener la información del usuario
 */
export function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    // Un JWT tiene 3 partes separadas por puntos: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('Token JWT inválido: no tiene 3 partes');
      return null;
    }

    // El payload es la segunda parte (índice 1)
    const payload = parts[1];
    
    // Decodificar desde base64
    const decodedPayload = atob(payload);
    
    // Parsear como JSON
    return JSON.parse(decodedPayload) as T;
  } catch (error) {
    console.error('Error al decodificar JWT:', error);
    return null;
  }
}

/**
 * Interfaz que representa el payload del JWT del backend
 */
export interface JwtPayload {
  email: string;
  role: string[];
  companyId: string;
  typ: 'access' | 'refresh';
  iat: number;
  exp: number;
  sub: string; // user ID
}

/**
 * Verifica si un token ha expirado
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload<JwtPayload>(token);
    if (!payload || !payload.exp) {
      return true;
    }

    // exp está en segundos, Date.now() en milisegundos
    const expirationTime = payload.exp * 1000;
    return Date.now() >= expirationTime;
  } catch (error) {
    console.error('Error al verificar expiración del token:', error);
    return true;
  }
}

/**
 * Extrae la información del usuario desde un token JWT
 */
export function extractUserFromToken(token: string): { id: string; email: string; role: string; companyId: string } | null {
  try {
    const payload = decodeJwtPayload<JwtPayload>(token);
    if (!payload) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role?.[0] || 'user', // Tomar el primer rol o 'user' por defecto
      companyId: payload.companyId
    };
  } catch (error) {
    console.error('Error al extraer usuario del token:', error);
    return null;
  }
}
