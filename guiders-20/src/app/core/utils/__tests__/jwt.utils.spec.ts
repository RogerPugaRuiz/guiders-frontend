import {
  decodeJwtPayload,
  isTokenExpired,
  isTokenNearExpiration,
  extractUserFromToken,
  getTokenTimeToExpiration,
  JwtPayload
} from '../jwt.utils';

describe('JWT Utils', () => {
  // Token válido de ejemplo (payload: {"sub":"user-123","email":"test@example.com","role":["user"],"companyId":"company-123","iat":1640995200,"exp":9999999999})
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOlsidXNlciJdLCJjb21wYW55SWQiOiJjb21wYW55LTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjo5OTk5OTk5OTk5fQ.F1xG7W8LkVNQ7KGGnVJ1vxZjYeZyYz6rYvYz6rYvYz6r';
  
  // Token expirado (exp: 1640995200 - aproximadamente 2022-01-01)
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOlsidXNlciJdLCJjb21wYW55SWQiOiJjb21wYW55LTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk1MjAwfQ.XYZ123ABC';

  describe('decodeJwtPayload', () => {
    it('should decode valid JWT token', () => {
      const payload = decodeJwtPayload<JwtPayload>(validToken);
      
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-123');
      expect(payload?.email).toBe('test@example.com');
      expect(payload?.role).toEqual(['user']);
      expect(payload?.companyId).toBe('company-123');
    });

    it('should return null for invalid token format', () => {
      const payload = decodeJwtPayload('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for empty token', () => {
      const payload = decodeJwtPayload('');
      expect(payload).toBeNull();
    });

    it('should return null for token with wrong number of parts', () => {
      const payload = decodeJwtPayload('header.payload');
      expect(payload).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const isExpired = isTokenExpired(validToken);
      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      const isExpired = isTokenExpired(expiredToken);
      expect(isExpired).toBe(true);
    });

    it('should return true for invalid token', () => {
      const isExpired = isTokenExpired('invalid-token');
      expect(isExpired).toBe(true);
    });

    it('should return true for empty token', () => {
      const isExpired = isTokenExpired('');
      expect(isExpired).toBe(true);
    });
  });

  describe('isTokenNearExpiration', () => {
    it('should return false for token far from expiration', () => {
      const isNearExpiration = isTokenNearExpiration(validToken);
      expect(isNearExpiration).toBe(false);
    });

    it('should return true for expired token', () => {
      const isNearExpiration = isTokenNearExpiration(expiredToken);
      expect(isNearExpiration).toBe(true);
    });

    it('should return true for invalid token', () => {
      const isNearExpiration = isTokenNearExpiration('invalid-token');
      expect(isNearExpiration).toBe(true);
    });

    it('should use custom buffer time', () => {
      // Con un buffer de 0 minutos, el token válido no debería estar cerca de expirar
      const isNearExpiration = isTokenNearExpiration(validToken, 0);
      expect(isNearExpiration).toBe(false);
    });
  });

  describe('extractUserFromToken', () => {
    it('should extract user info from valid token', () => {
      const userInfo = extractUserFromToken(validToken);
      
      expect(userInfo).not.toBeNull();
      expect(userInfo?.id).toBe('user-123');
      expect(userInfo?.email).toBe('test@example.com');
      expect(userInfo?.role).toBe('user');
      expect(userInfo?.companyId).toBe('company-123');
    });

    it('should return null for invalid token', () => {
      const userInfo = extractUserFromToken('invalid-token');
      expect(userInfo).toBeNull();
    });

    it('should return null for empty token', () => {
      const userInfo = extractUserFromToken('');
      expect(userInfo).toBeNull();
    });

    it('should handle token without role array', () => {
      // Token sin rol (se debería usar 'user' por defecto)
      const tokenWithoutRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImNvbXBhbnlJZCI6ImNvbXBhbnktMTIzIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjk5OTk5OTk5OTl9.XYZ';
      
      const userInfo = extractUserFromToken(tokenWithoutRole);
      expect(userInfo?.role).toBe('user');
    });
  });

  describe('getTokenTimeToExpiration', () => {
    it('should return positive time for valid token', () => {
      const timeToExpiration = getTokenTimeToExpiration(validToken);
      expect(timeToExpiration).toBeGreaterThan(0);
    });

    it('should return 0 for expired token', () => {
      const timeToExpiration = getTokenTimeToExpiration(expiredToken);
      expect(timeToExpiration).toBe(0);
    });

    it('should return 0 for invalid token', () => {
      const timeToExpiration = getTokenTimeToExpiration('invalid-token');
      expect(timeToExpiration).toBe(0);
    });

    it('should return 0 for empty token', () => {
      const timeToExpiration = getTokenTimeToExpiration('');
      expect(timeToExpiration).toBe(0);
    });
  });

  describe('Error handling', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should handle malformed base64 in token payload', () => {
      const malformedToken = 'header.invalid-base64!@#$%^&*().signature';
      const payload = decodeJwtPayload(malformedToken);
      
      expect(payload).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle invalid JSON in token payload', () => {
      // Token con payload que no es JSON válido
      const invalidJsonToken = 'header.aW52YWxpZC1qc29u.signature'; // "invalid-json" en base64
      const payload = decodeJwtPayload(invalidJsonToken);
      
      expect(payload).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
