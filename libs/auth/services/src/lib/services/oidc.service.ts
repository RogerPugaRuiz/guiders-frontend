import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

import {
  OidcConfig,
  OidcDiscoveryDocument,
  TokenResponse,
  IdTokenClaims,
  UserInfo,
  AuthState,
  PkceChallenge,
  AuthorizationParams,
  TokenParams
} from '../interfaces/oidc.interface';
import { PkceService } from '../utils/pkce.service';
import { JwtService } from '../utils/jwt.service';

/**
 * OIDC Service
 * Implements OpenID Connect over OAuth 2.1 with PKCE
 */
@Injectable({
  providedIn: 'root'
})
export class OidcService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private pkceService = inject(PkceService);
  private jwtService = inject(JwtService);

  // Authentication state management using signals
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    isLoading: false
  });

  // Public signals for reactive state
  readonly authState$ = this.authStateSubject.asObservable();
  readonly authState = signal<AuthState>({
    isAuthenticated: false,
    isLoading: false
  });

  // Computed signals
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly isLoading = computed(() => this.authState().isLoading);
  readonly user = computed(() => this.authState().userInfo);
  readonly accessToken = computed(() => this.authState().accessToken);

  private config?: OidcConfig;
  private discoveryDocument?: OidcDiscoveryDocument;

  // Storage keys
  private readonly STORAGE_PREFIX = 'oidc_';
  private readonly ACCESS_TOKEN_KEY = `${this.STORAGE_PREFIX}access_token`;
  private readonly ID_TOKEN_KEY = `${this.STORAGE_PREFIX}id_token`;
  private readonly REFRESH_TOKEN_KEY = `${this.STORAGE_PREFIX}refresh_token`;
  private readonly EXPIRES_AT_KEY = `${this.STORAGE_PREFIX}expires_at`;
  private readonly STATE_KEY = `${this.STORAGE_PREFIX}state`;
  private readonly NONCE_KEY = `${this.STORAGE_PREFIX}nonce`;
  private readonly CODE_VERIFIER_KEY = `${this.STORAGE_PREFIX}code_verifier`;

  /**
   * Initialize OIDC with configuration
   */
  async initialize(config: OidcConfig): Promise<void> {
    this.config = {
      scope: 'openid profile email',
      responseType: 'code',
      usePkce: true,
      ...config
    };

    try {
      // Load discovery document
      this.discoveryDocument = await this.loadDiscoveryDocument();
      
      // Check for existing authentication
      await this.checkExistingAuth();
      
      // Handle callback if present
      await this.handleCallbackIfPresent();
    } catch (error) {
      console.error('OIDC initialization error:', error);
      this.updateAuthState({ 
        isAuthenticated: false, 
        isLoading: false, 
        error: 'Initialization failed' 
      });
    }
  }

  /**
   * Load OIDC discovery document
   */
  private loadDiscoveryDocument(): Promise<OidcDiscoveryDocument> {
    if (!this.config) {
      throw new Error('OIDC configuration not set');
    }

    const discoveryUrl = `${this.config.issuer}/.well-known/openid_configuration`;
    
    return this.http.get<OidcDiscoveryDocument>(discoveryUrl).pipe(
      tap(doc => console.log('Loaded discovery document:', doc)),
      catchError(error => {
        console.error('Failed to load discovery document:', error);
        return throwError(() => new Error('Failed to load OIDC discovery document'));
      })
    ).toPromise() as Promise<OidcDiscoveryDocument>;
  }

  /**
   * Start OAuth 2.1 + OIDC authentication flow
   */
  async startAuthentication(additionalParams?: Record<string, string>): Promise<void> {
    if (!this.config || !this.discoveryDocument) {
      throw new Error('OIDC not initialized');
    }

    this.updateAuthState({ isLoading: true });

    try {
      // Generate PKCE challenge for OAuth 2.1
      const pkceChallenge = await this.pkceService.generatePkceChallenge();
      
      // Generate state and nonce for security
      const state = this.pkceService.generateRandomString();
      const nonce = this.pkceService.generateRandomString();

      // Store PKCE verifier, state, and nonce
      sessionStorage.setItem(this.CODE_VERIFIER_KEY, pkceChallenge.codeVerifier);
      sessionStorage.setItem(this.STATE_KEY, state);
      sessionStorage.setItem(this.NONCE_KEY, nonce);

      // Build authorization URL
      const authParams: AuthorizationParams = {
        response_type: this.config.responseType!,
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        scope: this.config.scope!,
        state,
        nonce,
        code_challenge: pkceChallenge.codeChallenge,
        code_challenge_method: pkceChallenge.codeChallengeMethod,
        ...this.config.additionalParams,
        ...additionalParams
      };

      const authUrl = this.buildAuthorizationUrl(authParams);
      
      // Redirect to authorization server
      window.location.href = authUrl;
    } catch (error) {
      console.error('Authentication start error:', error);
      this.updateAuthState({ 
        isLoading: false, 
        error: 'Failed to start authentication' 
      });
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(callbackUrl?: string): Promise<void> {
    if (!this.config || !this.discoveryDocument) {
      throw new Error('OIDC not initialized');
    }

    this.updateAuthState({ isLoading: true });

    try {
      const url = callbackUrl || window.location.href;
      const urlParams = new URL(url).searchParams;

      // Check for errors
      const error = urlParams.get('error');
      if (error) {
        const errorDescription = urlParams.get('error_description');
        throw new Error(`OAuth error: ${error} - ${errorDescription}`);
      }

      // Get authorization code and state
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Validate state
      const storedState = sessionStorage.getItem(this.STATE_KEY);
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code);
      
      // Process tokens
      await this.processTokenResponse(tokenResponse);

      // Clean up session storage
      this.cleanupSessionStorage();

      // Redirect to original destination or home
      const returnUrl = sessionStorage.getItem('oidc_return_url') || '/';
      sessionStorage.removeItem('oidc_return_url');
      this.router.navigateByUrl(returnUrl);

    } catch (error) {
      console.error('Callback handling error:', error);
      this.updateAuthState({ 
        isAuthenticated: false,
        isLoading: false, 
        error: `Authentication failed: ${error}` 
      });
      this.router.navigate(['/login'], { 
        queryParams: { error: 'auth_failed' } 
      });
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    if (!this.config || !this.discoveryDocument) {
      throw new Error('OIDC not initialized');
    }

    const codeVerifier = sessionStorage.getItem(this.CODE_VERIFIER_KEY);
    if (!codeVerifier) {
      throw new Error('No code verifier found');
    }

    const tokenParams: TokenParams = {
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      code,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier
    };

    const body = new HttpParams({ fromObject: tokenParams as any });
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<TokenResponse>(
      this.discoveryDocument.token_endpoint,
      body.toString(),
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Token exchange error:', error);
        return throwError(() => new Error('Failed to exchange code for tokens'));
      })
    ).toPromise() as Promise<TokenResponse>;
  }

  /**
   * Process token response and update auth state
   */
  private async processTokenResponse(tokenResponse: TokenResponse): Promise<void> {
    if (!this.config) {
      throw new Error('OIDC not initialized');
    }

    // Calculate expiration time
    const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);

    // Store tokens
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokenResponse.access_token);
    localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
    
    if (tokenResponse.refresh_token) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
    }

    let idTokenClaims: IdTokenClaims | undefined;
    let userInfo: UserInfo | undefined;

    // Process ID token if present
    if (tokenResponse.id_token) {
      localStorage.setItem(this.ID_TOKEN_KEY, tokenResponse.id_token);
      
      const nonce = sessionStorage.getItem(this.NONCE_KEY);
      const isValid = this.jwtService.validateIdToken(
        tokenResponse.id_token,
        this.config.issuer,
        this.config.clientId,
        nonce || undefined
      );

      if (!isValid) {
        throw new Error('Invalid ID token');
      }

      idTokenClaims = this.jwtService.decodeToken(tokenResponse.id_token) || undefined;
    }

    // Fetch user info
    try {
      userInfo = await this.fetchUserInfo(tokenResponse.access_token);
    } catch (error) {
      console.warn('Failed to fetch user info:', error);
    }

    // Update auth state
    this.updateAuthState({
      isAuthenticated: true,
      isLoading: false,
      accessToken: tokenResponse.access_token,
      idToken: tokenResponse.id_token,
      refreshToken: tokenResponse.refresh_token,
      idTokenClaims,
      userInfo,
      expiresAt,
      error: undefined
    });
  }

  /**
   * Fetch user information from UserInfo endpoint
   */
  private async fetchUserInfo(accessToken: string): Promise<UserInfo> {
    if (!this.discoveryDocument) {
      throw new Error('Discovery document not loaded');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });

    return this.http.get<UserInfo>(
      this.discoveryDocument.userinfo_endpoint,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('UserInfo fetch error:', error);
        return throwError(() => new Error('Failed to fetch user info'));
      })
    ).toPromise() as Promise<UserInfo>;
  }

  /**
   * Logout user
   */
  async logout(returnUrl?: string): Promise<void> {
    this.updateAuthState({ isLoading: true });

    // Clear local storage
    this.clearTokenStorage();

    // Update auth state
    this.updateAuthState({
      isAuthenticated: false,
      isLoading: false,
      accessToken: undefined,
      idToken: undefined,
      refreshToken: undefined,
      idTokenClaims: undefined,
      userInfo: undefined,
      expiresAt: undefined,
      error: undefined
    });

    // Perform end session if supported
    if (this.config && this.discoveryDocument?.end_session_endpoint) {
      const logoutUrl = this.buildLogoutUrl(returnUrl);
      window.location.href = logoutUrl;
    } else {
      // Simple redirect
      this.router.navigateByUrl(returnUrl || '/login');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken || !this.config || !this.discoveryDocument) {
      return false;
    }

    try {
      const tokenParams: TokenParams = {
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        refresh_token: refreshToken
      };

      const body = new HttpParams({ fromObject: tokenParams as any });
      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      const tokenResponse = await this.http.post<TokenResponse>(
        this.discoveryDocument.token_endpoint,
        body.toString(),
        { headers }
      ).toPromise() as TokenResponse;

      await this.processTokenResponse(tokenResponse);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokenStorage();
      this.updateAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Token refresh failed'
      });
      return false;
    }
  }

  /**
   * Check for existing authentication
   */
  private async checkExistingAuth(): Promise<void> {
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);

    if (!accessToken || !expiresAt) {
      return;
    }

    // Check if token is expired
    if (Date.now() >= parseInt(expiresAt)) {
      // Try to refresh
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        this.clearTokenStorage();
      }
      return;
    }

    // Token is valid, restore auth state
    const idToken = localStorage.getItem(this.ID_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    let idTokenClaims: IdTokenClaims | undefined;
    let userInfo: UserInfo | undefined;

    if (idToken) {
      idTokenClaims = this.jwtService.decodeToken(idToken) || undefined;
    }

    try {
      userInfo = await this.fetchUserInfo(accessToken);
    } catch (error) {
      console.warn('Failed to fetch user info during auth check:', error);
    }

    this.updateAuthState({
      isAuthenticated: true,
      isLoading: false,
      accessToken,
      idToken: idToken || undefined,
      refreshToken: refreshToken || undefined,
      idTokenClaims,
      userInfo,
      expiresAt: parseInt(expiresAt)
    });
  }

  /**
   * Handle callback if present in URL
   */
  private async handleCallbackIfPresent(): Promise<void> {
    const url = new URL(window.location.href);
    if (url.searchParams.has('code') || url.searchParams.has('error')) {
      await this.handleCallback();
    }
  }

  /**
   * Build authorization URL
   */
  private buildAuthorizationUrl(params: AuthorizationParams): string {
    if (!this.discoveryDocument) {
      throw new Error('Discovery document not loaded');
    }

    const url = new URL(this.discoveryDocument.authorization_endpoint);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value);
      }
    });
    
    return url.toString();
  }

  /**
   * Build logout URL
   */
  private buildLogoutUrl(returnUrl?: string): string {
    if (!this.discoveryDocument?.end_session_endpoint || !this.config) {
      throw new Error('End session endpoint not available');
    }

    const url = new URL(this.discoveryDocument.end_session_endpoint);
    
    const idToken = localStorage.getItem(this.ID_TOKEN_KEY);
    if (idToken) {
      url.searchParams.append('id_token_hint', idToken);
    }

    const postLogoutUri = returnUrl || this.config.postLogoutRedirectUri || `${window.location.origin}/login`;
    url.searchParams.append('post_logout_redirect_uri', postLogoutUri);

    return url.toString();
  }

  /**
   * Update authentication state
   */
  private updateAuthState(newState: Partial<AuthState>): void {
    const currentState = this.authState();
    const updatedState = { ...currentState, ...newState };
    
    this.authState.set(updatedState);
    this.authStateSubject.next(updatedState);
  }

  /**
   * Clear token storage
   */
  private clearTokenStorage(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.ID_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  /**
   * Clean up session storage
   */
  private cleanupSessionStorage(): void {
    sessionStorage.removeItem(this.STATE_KEY);
    sessionStorage.removeItem(this.NONCE_KEY);
    sessionStorage.removeItem(this.CODE_VERIFIER_KEY);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Check if token will expire soon
   */
  willTokenExpireSoon(offsetSeconds: number = 300): boolean {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    if (!expiresAt) {
      return true;
    }

    const expirationTime = parseInt(expiresAt);
    const now = Date.now();
    return (expirationTime - (offsetSeconds * 1000)) <= now;
  }
}