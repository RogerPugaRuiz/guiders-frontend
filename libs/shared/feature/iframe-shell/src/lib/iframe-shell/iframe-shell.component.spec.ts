import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IframeShellComponent } from './iframe-shell.component';
import { PostMessageHandler } from '@guiders-frontend/shared/data-access/iframe';
import { IframeInitService } from '@guiders-frontend/shared/data-access/iframe';
import { IFRAME_CONFIG_TOKEN } from '@guiders-frontend/shared/data-access/iframe';
import type { IframeInitResult } from '@guiders-frontend/shared/types/iframe';
import type { EmbedConfig } from '@guiders-frontend/shared/types/iframe';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

const ALLOWED_ORIGIN = 'https://leadcars.com';

@Component({
  selector: 'guiders-test-host',
  standalone: true,
  imports: [IframeShellComponent],
  template: `<guiders-iframe-shell />`,
})
class TestHostComponent {}

describe(IframeShellComponent.name, () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let postMessageHandler: PostMessageHandler;
  let iframeInitService: IframeInitService;
  let parentMock: Window;
  let postSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    parentMock = { postMessage: vi.fn() } as unknown as Window;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      get: () => parentMock,
    });

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: IFRAME_CONFIG_TOKEN,
          useValue: {
            token: 'test-token',
            tenantId: 'test-tenant',
            baseUrl: 'https://api.example.com',
            allowedOrigins: [ALLOWED_ORIGIN],
          },
        },
        PostMessageHandler,
        IframeInitService,
      ],
    }).compileComponents();

    postMessageHandler = TestBed.inject(PostMessageHandler);
    iframeInitService = TestBed.inject(IframeInitService);

    postSpy = vi.spyOn(parentMock, 'postMessage');

    postMessageHandler.start();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    Object.defineProperty(window, 'parent', {
      configurable: true,
      get: () => window,
    });
    postMessageHandler.stop();
    vi.restoreAllMocks();
  });

  function getShell(): IframeShellComponent {
    return fixture.debugElement.children[0].componentInstance as IframeShellComponent;
  }

  function getBootstrap(): HTMLElement {
    return fixture.nativeElement.querySelector('guiders-iframe-bootstrap');
  }

  function createSuccessResult(): IframeInitResult {
    return {
      ok: true,
      response: {
        company: { id: 'c1', name: 'Test', subdomain: 'test', logo: { url: '', alt: '' }, supportEmail: '' },
        theme: null,
        features: {
          chatEnabled: true,
          escalationsEnabled: true,
          contactsEnabled: true,
          visitorsEnabled: true,
          inboxEnabled: true,
          fileAttachments: true,
          readReceipts: true,
          typingIndicators: true,
          aiSuggestions: true,
        },
        user: { id: 'u1', name: 'Test', role: 'operator', avatar: '', permissions: [] },
        config: { sessionTimeout: 3600, maxFileSize: 10000000, acceptedMimeTypes: [], maxAttachments: 5 },
        version: '1.0.0',
      },
    };
  }

  describe('initial state', () => {
    it('shellState starts as loading', () => {
      const shell = getShell();
      expect(shell.shellState()).toBe('loading');
    });

    it('renders bootstrap component when loading', () => {
      const bootstrap = getBootstrap();
      expect(bootstrap).toBeTruthy();
    });
  });

  describe('init success', () => {
    it('shellState transitions to ready after init success', async () => {
      vi.spyOn(iframeInitService, 'initialize').mockReturnValue(of(createSuccessResult()));

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      expect(shell.shellState()).toBe('ready');
    });
  });

  describe('init failure', () => {
    it('shellState transitions to error after init failure', async () => {
      vi.spyOn(iframeInitService, 'initialize').mockReturnValue(
        throwError(() => new Error('network error')),
      );

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      expect(shell.shellState()).toBe('error');
    });

    it('error state shows bootstrap component', async () => {
      vi.spyOn(iframeInitService, 'initialize').mockReturnValue(
        throwError(() => new Error('network error')),
      );

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      expect(shell.shellState()).toBe('error');
      const bootstrap = newFixture.nativeElement.querySelector('guiders-iframe-bootstrap');
      expect(bootstrap).toBeTruthy();
    });
  });

  describe('embedConfig', () => {
    it('embedConfig is null initially', () => {
      const shell = getShell();
      expect(shell.embedConfig()).toBeNull();
    });

    it('embedConfig is set when LEADCARS_EMBED_CONFIG is received', async () => {
      const config: EmbedConfig = {
        timestamp: Date.now(),
        language: 'es',
        features: ['chatEnabled', 'visitorsEnabled'],
      };

      const shell = getShell();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test access to protected signal
      (shell as any)._embedConfig.set(config);
      fixture.detectChanges();

      expect(shell.embedConfig()).toEqual(config);
    });
  });

  describe('sidebar-slot variant', () => {
    it('variant is icon-only when visitorsEnabled is absent', async () => {
      const configWithoutVisitors: EmbedConfig = {
        timestamp: Date.now(),
        features: ['chatEnabled'],
      };

      vi.spyOn(iframeInitService, 'initialize').mockReturnValue(of(createSuccessResult()));

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test access to protected signal
      (shell as any)._embedConfig.set(configWithoutVisitors);
      await newFixture.detectChanges(true);

      expect(shell.shellState()).toBe('ready');
      expect(shell.sidebarVariant()).toBe('icon-only');
    });

    it('variant is default when visitorsEnabled is present', async () => {
      const configWithVisitors: EmbedConfig = {
        timestamp: Date.now(),
        features: ['chatEnabled', 'visitorsEnabled'],
      };

      vi.spyOn(iframeInitService, 'initialize').mockReturnValue(of(createSuccessResult()));

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test access to protected signal
      (shell as any)._embedConfig.set(configWithVisitors);
      await newFixture.detectChanges(true);

      expect(shell.shellState()).toBe('ready');
      expect(shell.sidebarVariant()).toBe('default');
    });
  });

  describe('header-slot variant', () => {
    it('variant is default', async () => {
      vi.spyOn(iframeInitService, 'initialize').mockReturnValue(of(createSuccessResult()));

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      expect(shell.headerVariant()).toBe('default');
    });

    it('variant is leadcars when config.variant is leadcars', async () => {
      vi.spyOn(iframeInitService, 'initialize').mockReturnValue(of(createSuccessResult()));

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test access to protected signal
      (shell as any)._embedConfig.set({ variant: 'leadcars', timestamp: Date.now(), features: [] });
      await newFixture.detectChanges(true);

      expect(shell.headerVariant()).toBe('leadcars');
    });
  });

  describe('retry', () => {
    it('retry calls IframeInitService.retry()', async () => {
      const retrySpy = vi.spyOn(iframeInitService, 'retry').mockReturnValue(of(createSuccessResult()));

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      shell.onRetry();
      await newFixture.detectChanges(true);

      expect(retrySpy).toHaveBeenCalled();
    });
  });

  describe('navigateToLogin', () => {
    it('sends GUIDERS_SESSION_EXPIRED postMessage', async () => {
      vi.spyOn(iframeInitService, 'initialize').mockReturnValue(of(createSuccessResult()));

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      shell.onNavigateToLogin();

      expect(postSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GUIDERS_SESSION_EXPIRED',
          payload: expect.objectContaining({
            sessionId: '',
            reAuthCallback: expect.any(String),
            timestamp: expect.any(Number),
          }),
        }),
        ALLOWED_ORIGIN,
      );
    });
  });

  describe('session expired modal', () => {
    it('modal is not visible when session is active', async () => {
      vi.spyOn(iframeInitService, 'initialize').mockReturnValue(of(createSuccessResult()));

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      expect(shell.sessionExpiredVisible()).toBe(false);
    });

    it('LEADCARS_SESSION_EXPIRED handler sets modal visible', async () => {
      vi.spyOn(iframeInitService, 'initialize').mockReturnValue(of(createSuccessResult()));

      const newFixture = TestBed.createComponent(TestHostComponent);
      await newFixture.detectChanges(true);

      const shell = newFixture.debugElement.children[0].componentInstance as IframeShellComponent;
      await newFixture.detectChanges(true);

      expect(shell.sessionExpiredVisible()).toBe(false);

      const handlers = (postMessageHandler as any).handlers.get('LEADCARS_SESSION_EXPIRED');
      const handlerArray = Array.from(handlers);
      expect(handlerArray.length).toBeGreaterThan(0);
      const handler = handlerArray[handlerArray.length - 1];
      handler({});
      newFixture.detectChanges();

      expect(shell.sessionExpiredVisible()).toBe(true);
    });

    it('dismissed closes the modal', () => {
      const shell = getShell();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test access to protected signal
      (shell as any)._sessionExpiredVisible.set(true);
      fixture.detectChanges();

      expect(shell.sessionExpiredVisible()).toBe(true);

      shell.onSessionExpiredDismissed();
      fixture.detectChanges();

      expect(shell.sessionExpiredVisible()).toBe(false);
    });
  });

  describe('loginUrl', () => {
    it('loginUrl is derived from config baseUrl', () => {
      const shell = getShell();
      expect(shell.loginUrl()).toBe('https://api.example.com/login');
    });
  });
});