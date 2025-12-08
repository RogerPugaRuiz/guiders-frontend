import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CommercialPresenceService } from './commercial-presence.service';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { UserService } from '@guiders-frontend/auth/data-access/session';

describe('CommercialPresenceService', () => {
  let service: CommercialPresenceService;
  let httpMock: HttpTestingController;
  let userServiceMock: Partial<UserService>;

  const mockEnvironment = {
    api: {
      baseUrl: 'http://localhost:3000/api'
    }
  };

  beforeEach(() => {
    // Mock del UserService
    userServiceMock = {
      getUserId: vi.fn().mockReturnValue('test-user-123'),
      currentUser: vi.fn().mockReturnValue({
        sub: 'test-user-123',
        email: 'test@example.com',
        roles: ['commercial'],
        app: 'console',
        session: {
          exp: Date.now() + 3600000,
          iat: Date.now()
        }
      })
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CommercialPresenceService,
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment },
        { provide: UserService, useValue: userServiceMock }
      ]
    });

    service = TestBed.inject(CommercialPresenceService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('fake-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  afterEach(() => {
    // Verificar que no haya requests pendientes y hacer flush si las hay
    const requests = httpMock.match(() => true);
    requests.forEach(req => req.flush(null));
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('connect', () => {
    it('should connect commercial and start heartbeat', async () => {
      const mockResponse = {
        success: true,
        commercial: {
          id: 'test-user-123',
          name: 'test@example.com',
          connectionStatus: 'online',
          lastActivity: new Date().toISOString(),
          isActive: true
        }
      };

      const connectPromise = new Promise<void>((resolve) => {
        service.connect().subscribe({
          next: (commercial) => {
            expect(commercial.id).toBe('test-user-123');
            expect(commercial.connectionStatus).toBe('online');
            expect(userServiceMock.getUserId).toHaveBeenCalled();
            resolve();
          }
        });

        const req = httpMock.expectOne('http://localhost:3000/api/v2/commercials/connect');
        expect(req.request.method).toBe('POST');
        expect(req.request.body.id).toBe('test-user-123');
        expect(req.request.withCredentials).toBe(true);
        req.flush(mockResponse);
      });

      await connectPromise;
    });
  });

  describe('getCurrentStatus', () => {
    it('should return current status synchronously', () => {
      const status = service.getCurrentStatus();
      expect(status).toBeDefined();
      expect(status.isConnected).toBe(false);
      expect(status.status).toBe('offline');
    });
  });
});
