/**
 * OIDC Configuration Interface
 * Represents the configuration needed for an OIDC provider
 */
export interface OidcConfig {
  /** OIDC Provider URL (issuer) */
  issuer: string;
  /** Client ID registered with the provider */
  clientId: string;
  /** Redirect URI after authentication */
  redirectUri: string;
  /** Post logout redirect URI */
  postLogoutRedirectUri?: string;
  /** Scopes to request (default: openid profile email) */
  scope?: string;
  /** Response type (default: code) */
  responseType?: string;
  /** Whether to use PKCE (default: true for OAuth 2.1) */
  usePkce?: boolean;
  /** Additional parameters for authorization request */
  additionalParams?: Record<string, string>;
}

/**
 * OIDC Discovery Document
 * Well-known configuration from /.well-known/openid_configuration
 */
export interface OidcDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
  scopes_supported: string[];
  response_types_supported: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  code_challenge_methods_supported?: string[];
}

/**
 * OAuth 2.1 Token Response
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

/**
 * OIDC ID Token Claims
 */
export interface IdTokenClaims {
  iss: string; // Issuer
  sub: string; // Subject
  aud: string | string[]; // Audience
  exp: number; // Expiration time
  iat: number; // Issued at
  auth_time?: number; // Authentication time
  nonce?: string; // Nonce
  acr?: string; // Authentication Context Class Reference
  amr?: string[]; // Authentication Methods References
  azp?: string; // Authorized party
  // Additional claims
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  [key: string]: any; // Additional custom claims
}

/**
 * User Info Response
 */
export interface UserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  [key: string]: any; // Additional claims
}

/**
 * OIDC Authentication State
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  idTokenClaims?: IdTokenClaims;
  userInfo?: UserInfo;
  expiresAt?: number;
  error?: string;
}

/**
 * PKCE (Proof Key for Code Exchange) parameters
 */
export interface PkceChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256' | 'plain';
}

/**
 * Authorization Request Parameters
 */
export interface AuthorizationParams {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  nonce?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  [key: string]: string | undefined;
}

/**
 * Token Request Parameters
 */
export interface TokenParams {
  grant_type: 'authorization_code' | 'refresh_token';
  client_id: string;
  code?: string;
  redirect_uri?: string;
  code_verifier?: string;
  refresh_token?: string;
}