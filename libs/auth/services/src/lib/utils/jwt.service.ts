import { Injectable } from '@angular/core';
import { IdTokenClaims } from '../interfaces/oidc.interface';

/**
 * JWT Utility Service
 * Handles JWT parsing and basic validation (without signature verification)
 * Note: For production, implement proper signature verification using JWKS
 */
@Injectable({
  providedIn: 'root'
})
export class JwtService {

  /**
   * Decode JWT token without verification
   * WARNING: This does not verify the signature. Use only for extracting claims.
   */
  decodeToken(token: string): IdTokenClaims | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const decoded = this.base64URLDecode(payload);
      return JSON.parse(decoded) as IdTokenClaims;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string, offsetSeconds: number = 0): boolean {
    const claims = this.decodeToken(token);
    if (!claims?.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return (claims.exp - offsetSeconds) < now;
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    const claims = this.decodeToken(token);
    if (!claims?.exp) {
      return null;
    }

    return new Date(claims.exp * 1000);
  }

  /**
   * Validate basic JWT structure and required claims
   */
  validateIdToken(token: string, issuer: string, clientId: string, nonce?: string): boolean {
    const claims = this.decodeToken(token);
    if (!claims) {
      return false;
    }

    // Check required claims
    if (!claims.iss || !claims.sub || !claims.aud || !claims.exp || !claims.iat) {
      console.error('Missing required claims in ID token');
      return false;
    }

    // Validate issuer
    if (claims.iss !== issuer) {
      console.error(`Invalid issuer. Expected: ${issuer}, Got: ${claims.iss}`);
      return false;
    }

    // Validate audience
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(clientId)) {
      console.error(`Invalid audience. Expected: ${clientId}, Got: ${claims.aud}`);
      return false;
    }

    // Check expiration
    if (this.isTokenExpired(token)) {
      console.error('ID token is expired');
      return false;
    }

    // Validate nonce if provided
    if (nonce && claims.nonce !== nonce) {
      console.error(`Invalid nonce. Expected: ${nonce}, Got: ${claims.nonce}`);
      return false;
    }

    // Check issued at time (not too far in the future)
    const now = Math.floor(Date.now() / 1000);
    const maxSkew = 300; // 5 minutes
    if (claims.iat > (now + maxSkew)) {
      console.error('ID token issued in the future');
      return false;
    }

    return true;
  }

  /**
   * Base64-URL decode
   */
  private base64URLDecode(str: string): string {
    // Add padding if needed
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    return atob(base64);
  }

  /**
   * Extract user identifier from token
   */
  getUserId(token: string): string | null {
    const claims = this.decodeToken(token);
    return claims?.sub || null;
  }

  /**
   * Extract user email from token
   */
  getUserEmail(token: string): string | null {
    const claims = this.decodeToken(token);
    return claims?.email || null;
  }

  /**
   * Get all claims from token
   */
  getClaims(token: string): IdTokenClaims | null {
    return this.decodeToken(token);
  }
}