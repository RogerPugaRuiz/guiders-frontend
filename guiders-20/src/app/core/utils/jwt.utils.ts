/**
 * Utilidades para el manejo de tokens JWT
 */

/**
 * Interface que representa el payload de un token JWT
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string[];
  companyId: string;
  iat: number;
  exp: number;
}

/**
 * Decodifica un token JWT sin verificar su firma
 * @param token Token JWT a decodificar
 * @returns Payload decodificado o null si hay error
 */
export function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      // Solo mostrar error si no estamos en el entorno de testing
      if (typeof (global as any)?.jest === 'undefined' && typeof (window as any)?.jest === 'undefined') {
        console.error('Token JWT inválido: debe tener 3 partes');
      }
      return null;
    }

    // Decodificar la parte del payload (segunda parte)
    const payload = parts[1];
    
    // Añadir padding si es necesario
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decodificar de base64
    const decoded = atob(paddedPayload);
    
    return JSON.parse(decoded) as T;
  } catch (error) {
    // Solo mostrar error si no estamos en el entorno de testing
    if (typeof (global as any)?.jest === 'undefined' && typeof (window as any)?.jest === 'undefined') {
      console.error('Error al decodificar el token JWT:', error);
    }
    return null;
  }
}

/**
 * Verifica si un token JWT ha expirado
 * @param token Token JWT a verificar
 * @returns true si el token ha expirado, false si es válido
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload<JwtPayload>(token);
    if (!payload || !payload.exp) {
      return true;
    }

    // Comparar tiempo de expiración con tiempo actual
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error al verificar expiración del token:', error);
    return true;
  }
}

/**
 * Verifica si un token está próximo a expirar (dentro de los próximos 5 minutos)
 * @param token Token JWT a verificar
 * @param bufferMinutes Minutos de margen antes de la expiración (default: 5)
 * @returns true si el token está próximo a expirar
 */
export function isTokenNearExpiration(token: string, bufferMinutes: number = 5): boolean {
  try {
    const payload = decodeJwtPayload<JwtPayload>(token);
    if (!payload || !payload.exp) {
      return true;
    }

    // Calcular tiempo de expiración con buffer
    const expirationWithBuffer = payload.exp - (bufferMinutes * 60);
    const currentTime = Math.floor(Date.now() / 1000);
    
    return currentTime >= expirationWithBuffer;
  } catch (error) {
    console.error('Error al verificar proximidad de expiración del token:', error);
    return true;
  }
}

/**
 * Extrae la información del usuario desde un token JWT
 * @param token Token JWT del cual extraer la información
 * @returns Información del usuario o null si hay error
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

/**
 * Obtiene el tiempo restante hasta la expiración del token en segundos
 * @param token Token JWT a verificar
 * @returns Segundos hasta la expiración, o 0 si el token ha expirado
 */
export function getTokenTimeToExpiration(token: string): number {
  try {
    const payload = decodeJwtPayload<JwtPayload>(token);
    if (!payload || !payload.exp) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeToExpiration = payload.exp - currentTime;
    
    return Math.max(0, timeToExpiration);
  } catch (error) {
    console.error('Error al calcular tiempo de expiración del token:', error);
    return 0;
  }
}
