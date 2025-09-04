import { Injectable, inject, InjectionToken } from '@angular/core';
import { OidcConfig } from '../interfaces/oidc.interface';

/**
 * Injection token for OIDC configuration
 */
export const OIDC_CONFIG = new InjectionToken<OidcConfig>('OIDC_CONFIG');

/**
 * OIDC Configuration Service
 * Manages OIDC provider configurations
 */
@Injectable({
  providedIn: 'root'
})
export class OidcConfigService {
  private config?: OidcConfig;

  /**
   * Set OIDC configuration
   */
  setConfig(config: OidcConfig): void {
    this.config = this.validateAndNormalizeConfig(config);
  }

  /**
   * Get current OIDC configuration
   */
  getConfig(): OidcConfig | undefined {
    return this.config;
  }

  /**
   * Validate and normalize configuration
   */
  private validateAndNormalizeConfig(config: OidcConfig): OidcConfig {
    // Validate required fields
    if (!config.issuer) {
      throw new Error('OIDC issuer is required');
    }
    if (!config.clientId) {
      throw new Error('OIDC clientId is required');
    }
    if (!config.redirectUri) {
      throw new Error('OIDC redirectUri is required');
    }

    // Normalize issuer URL (remove trailing slash)
    const normalizedIssuer = config.issuer.replace(/\/$/, '');

    // Set defaults
    return {
      ...config,
      issuer: normalizedIssuer,
      scope: config.scope || 'openid profile email',
      responseType: config.responseType || 'code',
      usePkce: config.usePkce !== false, // Default to true for OAuth 2.1
      additionalParams: config.additionalParams || {}
    };
  }

  /**
   * Create configuration for common providers
   */
  static createAuth0Config(domain: string, clientId: string, redirectUri: string): OidcConfig {
    return {
      issuer: `https://${domain}`,
      clientId,
      redirectUri,
      scope: 'openid profile email',
      additionalParams: {
        audience: `https://${domain}/api/v2/`
      }
    };
  }

  static createAzureAdConfig(tenantId: string, clientId: string, redirectUri: string): OidcConfig {
    return {
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      clientId,
      redirectUri,
      scope: 'openid profile email'
    };
  }

  static createGoogleConfig(clientId: string, redirectUri: string): OidcConfig {
    return {
      issuer: 'https://accounts.google.com',
      clientId,
      redirectUri,
      scope: 'openid profile email'
    };
  }

  static createKeycloakConfig(
    baseUrl: string, 
    realm: string, 
    clientId: string, 
    redirectUri: string
  ): OidcConfig {
    return {
      issuer: `${baseUrl}/realms/${realm}`,
      clientId,
      redirectUri,
      scope: 'openid profile email'
    };
  }

  static createOktaConfig(domain: string, clientId: string, redirectUri: string): OidcConfig {
    return {
      issuer: `https://${domain}`,
      clientId,
      redirectUri,
      scope: 'openid profile email'
    };
  }
}