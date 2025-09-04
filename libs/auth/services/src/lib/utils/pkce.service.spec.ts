import { TestBed } from '@angular/core/testing';
import { PkceService } from './pkce.service';

describe('PkceService', () => {
  let service: PkceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PkceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate valid PKCE challenge', async () => {
    const challenge = await service.generatePkceChallenge();
    
    expect(challenge).toBeDefined();
    expect(challenge.codeVerifier).toBeDefined();
    expect(challenge.codeChallenge).toBeDefined();
    expect(challenge.codeChallengeMethod).toBe('S256');
    
    // Code verifier should be valid format
    expect(service.isValidCodeVerifier(challenge.codeVerifier)).toBe(true);
    
    // Code challenge should be different from verifier
    expect(challenge.codeChallenge).not.toBe(challenge.codeVerifier);
  });

  it('should generate random strings of correct length', () => {
    const str1 = service.generateRandomString(32);
    const str2 = service.generateRandomString(32);
    const str3 = service.generateRandomString(16);
    
    expect(str1.length).toBe(32);
    expect(str2.length).toBe(32);
    expect(str3.length).toBe(16);
    
    // Should be different each time
    expect(str1).not.toBe(str2);
  });

  it('should validate code verifier format correctly', () => {
    // Valid verifiers
    expect(service.isValidCodeVerifier('a'.repeat(43))).toBe(true);
    expect(service.isValidCodeVerifier('a'.repeat(128))).toBe(true);
    expect(service.isValidCodeVerifier('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~')).toBe(true);
    
    // Invalid verifiers
    expect(service.isValidCodeVerifier('a'.repeat(42))).toBe(false); // Too short
    expect(service.isValidCodeVerifier('a'.repeat(129))).toBe(false); // Too long
    expect(service.isValidCodeVerifier('abc@def')).toBe(false); // Invalid character
    expect(service.isValidCodeVerifier('')).toBe(false); // Empty
  });
});