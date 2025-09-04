import { TestBed } from '@angular/core/testing';
import { JwtService } from './jwt.service';
import { IdTokenClaims } from '../interfaces/oidc.interface';

describe('JwtService', () => {
  let service: JwtService;

  const mockIdToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoiMTIzNDU2Nzg5MCIsImF1ZCI6InRlc3QtY2xpZW50LWlkIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE2MDk0NTkyMDAsIm5vbmNlIjoidGVzdC1ub25jZSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIifQ.signature';
  
  const mockClaims: IdTokenClaims = {
    iss: 'https://example.com',
    sub: '1234567890',
    aud: 'test-client-id',
    exp: 9999999999,
    iat: 1609459200,
    nonce: 'test-nonce',
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwtService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should decode JWT token', () => {
    const decoded = service.decodeToken(mockIdToken);
    
    expect(decoded).toBeDefined();
    expect(decoded?.iss).toBe('https://example.com');
    expect(decoded?.sub).toBe('1234567890');
    expect(decoded?.aud).toBe('test-client-id');
    expect(decoded?.email).toBe('test@example.com');
    expect(decoded?.name).toBe('Test User');
  });

  it('should return null for invalid JWT', () => {
    const decoded1 = service.decodeToken('invalid-token');
    const decoded2 = service.decodeToken('invalid.token');
    const decoded3 = service.decodeToken('invalid.token.with.extra.parts');
    
    expect(decoded1).toBeNull();
    expect(decoded2).toBeNull();
    expect(decoded3).toBeNull();
  });

  it('should check token expiration correctly', () => {
    // Create a token that expires far in the future
    const futureToken = mockIdToken;
    expect(service.isTokenExpired(futureToken)).toBe(false);
    
    // Test with offset
    expect(service.isTokenExpired(futureToken, 100)).toBe(false);
  });

  it('should get token expiration date', () => {
    const expiration = service.getTokenExpiration(mockIdToken);
    
    expect(expiration).toBeInstanceOf(Date);
    expect(expiration?.getTime()).toBe(9999999999 * 1000);
  });

  it('should validate ID token with correct parameters', () => {
    const isValid = service.validateIdToken(
      mockIdToken,
      'https://example.com', // issuer
      'test-client-id', // clientId
      'test-nonce' // nonce
    );
    
    expect(isValid).toBe(true);
  });

  it('should reject ID token with wrong issuer', () => {
    const isValid = service.validateIdToken(
      mockIdToken,
      'https://wrong-issuer.com',
      'test-client-id',
      'test-nonce'
    );
    
    expect(isValid).toBe(false);
  });

  it('should reject ID token with wrong audience', () => {
    const isValid = service.validateIdToken(
      mockIdToken,
      'https://example.com',
      'wrong-client-id',
      'test-nonce'
    );
    
    expect(isValid).toBe(false);
  });

  it('should reject ID token with wrong nonce', () => {
    const isValid = service.validateIdToken(
      mockIdToken,
      'https://example.com',
      'test-client-id',
      'wrong-nonce'
    );
    
    expect(isValid).toBe(false);
  });

  it('should extract user information', () => {
    const userId = service.getUserId(mockIdToken);
    const userEmail = service.getUserEmail(mockIdToken);
    const claims = service.getClaims(mockIdToken);
    
    expect(userId).toBe('1234567890');
    expect(userEmail).toBe('test@example.com');
    expect(claims).toBeDefined();
    expect(claims?.name).toBe('Test User');
  });
});