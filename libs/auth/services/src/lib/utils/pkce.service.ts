import { Injectable } from '@angular/core';
import { PkceChallenge } from '../interfaces/oidc.interface';

/**
 * PKCE (Proof Key for Code Exchange) Utility Service
 * Implements RFC 7636 for OAuth 2.1 security
 */
@Injectable({
  providedIn: 'root'
})
export class PkceService {

  /**
   * Generate a random code verifier
   * Base64-URL encoded string, 43-128 characters
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Generate code challenge from verifier using SHA256
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(digest));
  }

  /**
   * Base64-URL encode without padding
   */
  private base64URLEncode(bytes: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate PKCE challenge pair
   */
  async generatePkceChallenge(): Promise<PkceChallenge> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  }

  /**
   * Generate cryptographically secure random string
   */
  generateRandomString(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array).substring(0, length);
  }

  /**
   * Validate code verifier format
   */
  isValidCodeVerifier(verifier: string): boolean {
    // RFC 7636: 43-128 characters, URL-safe chars
    return /^[A-Za-z0-9\-._~]{43,128}$/.test(verifier);
  }
}