import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { LlmConfigService } from './llm-config.service';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { Environment } from '@guiders-frontend/shared/types';

const mockEnvironment: Environment = {
  production: false,
  auth: {
    authority: 'https://test.com',
    clientId: 'test-client',
    scope: 'openid',
    secureRoutes: []
  },
  api: {
    baseUrl: 'https://test-api.com'
  }
};

describe('LlmConfigService', () => {
  let service: LlmConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment }
      ]
    });

    service = TestBed.inject(LlmConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get current config from cache', () => {
    expect(service.getCurrentConfig()).toBeNull();
  });

  it('should clear state', () => {
    service.clearState();
    expect(service.getCurrentConfig()).toBeNull();
  });
});