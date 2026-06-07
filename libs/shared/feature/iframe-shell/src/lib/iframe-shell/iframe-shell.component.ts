import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { IframeBootstrapComponent } from '@guiders-frontend/shared/ui/iframe-bootstrap';
import { SidebarSlotComponent } from '@guiders-frontend/shared/ui/iframe-slots';
import { HeaderSlotComponent } from '@guiders-frontend/shared/ui/iframe-slots';
import { SessionExpiredModalComponent } from '@guiders-frontend/shared/ui/session-expired-modal';
import { PostMessageHandler } from '@guiders-frontend/shared/data-access/iframe';
import { IframeInitService } from '@guiders-frontend/shared/data-access/iframe';
import { ThemeService } from '@guiders-frontend/shared/data-access/theme';
import { IFRAME_CONFIG_TOKEN } from '@guiders-frontend/shared/data-access/iframe';
import type { EmbedConfig } from '@guiders-frontend/shared/types/iframe';
import type { IframeInitResult } from '@guiders-frontend/shared/types/iframe';

type ShellState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'guiders-iframe-shell',
  standalone: true,
  imports: [
    IframeBootstrapComponent,
    SidebarSlotComponent,
    HeaderSlotComponent,
    SessionExpiredModalComponent,
  ],
  template: `
    @switch (shellState()) {
      @case ('loading') {
        <guiders-iframe-bootstrap
          [state]="bootstrapState()"
          [loginUrl]="loginUrl()"
          (retry)="onRetry()"
          (timeout)="onTimeout()"
        />
      }
      @case ('ready') {
        <guiders-sidebar-slot [variant]="sidebarVariant()">
          <ng-content slot="sidebar-content"></ng-content>
        </guiders-sidebar-slot>
        <guiders-header-slot [variant]="headerVariant()" [showBackButton]="false">
          <ng-content slot="header-content"></ng-content>
        </guiders-header-slot>
        <guiders-session-expired-modal
          [visible]="sessionExpiredVisible()"
          [reason]="'expired'"
          [loginUrl]="loginUrl()"
          (navigateToLogin)="onNavigateToLogin()"
          (dismissed)="onSessionExpiredDismissed()"
        />
      }
      @case ('error') {
        <guiders-iframe-bootstrap
          [state]="bootstrapState()"
          [loginUrl]="loginUrl()"
          (retry)="onRetry()"
          (timeout)="onTimeout()"
        />
      }
    }
  `,
  styleUrl: './iframe-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IframeShellComponent {
  private readonly postMessageHandler = inject(PostMessageHandler);
  private readonly iframeInitService = inject(IframeInitService);
  private readonly themeService = inject(ThemeService);
  private readonly config = inject(IFRAME_CONFIG_TOKEN, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private readonly _postMessageUnsubscribers: (() => void)[] = [];

  protected readonly _shellState = signal<ShellState>('loading');
  protected readonly _embedConfig = signal<EmbedConfig | null>(null);
  protected readonly _sessionExpiredVisible = signal(false);
  protected readonly _bootstrapState = signal<ReturnType<typeof this.computeBootstrapState>>({
    kind: 'initiating',
  });

  readonly shellState = this._shellState.asReadonly();
  readonly embedConfig = this._embedConfig.asReadonly();
  readonly sessionExpiredVisible = this._sessionExpiredVisible.asReadonly();

  readonly loginUrl = computed(() => {
    const base = this.config?.baseUrl ?? '';
    const normalized = base.endsWith('/api') ? base.replace('/api', '') : base;
    return normalized ? `${normalized}/login` : 'https://leadcars.com/login';
  });

  readonly bootstrapState = computed(() => this._bootstrapState());

  readonly sidebarVariant = computed(() => {
    const config = this._embedConfig();
    if (!config?.features) {
      return 'default';
    }
    return config.features.includes('visitorsEnabled') ? 'default' : 'icon-only';
  });

  readonly headerVariant = computed((): 'default' | 'leadcars' => {
    const config = this._embedConfig();
    return config?.variant === 'leadcars' ? 'leadcars' : 'default';
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const unsub of this._postMessageUnsubscribers) {
        unsub();
      }
      this._postMessageUnsubscribers.length = 0;
      this.postMessageHandler.stop();
    });

    effect(() => {
      const config = this._embedConfig();
      if (config?.primaryColor) {
        document.documentElement.style.setProperty('--guiders-color-accent', config.primaryColor);
      }
    });

    this.setupPostMessageListeners();
    this.initialize();
  }

  private setupPostMessageListeners(): void {
    this._postMessageUnsubscribers.push(
      this.postMessageHandler.listen('LEADCARS_EMBED_CONFIG', (payload) => {
        const config = payload as EmbedConfig;
        this._embedConfig.set(config);
      }),
    );

    this._postMessageUnsubscribers.push(
      this.postMessageHandler.listen('LEADCARS_USER_INFO', () => {
        // No-op for MVP - UI hints are optional
      }),
    );

    this._postMessageUnsubscribers.push(
      this.postMessageHandler.listen('LEADCARS_REAUTH_COMPLETE', (payload) => {
        const reauthPayload = payload as { success: boolean };
        if (reauthPayload.success) {
          this._sessionExpiredVisible.set(false);
        }
      }),
    );

    this._postMessageUnsubscribers.push(
      this.postMessageHandler.listen('LEADCARS_SESSION_EXPIRED', () => {
        this._sessionExpiredVisible.set(true);
      }),
    );
  }

  private initialize(): void {
    this.postMessageHandler.start();

    this.iframeInitService.initialize().subscribe({
      next: (result) => this.handleInitResult(result),
      error: () => {
        this._shellState.set('error');
        this._bootstrapState.set({
          kind: 'error',
          code: 'network',
          retryable: true,
        });
      },
    });
  }

  private handleInitResult(result: IframeInitResult): void {
    if (result.ok) {
      this._shellState.set('ready');
      this._bootstrapState.set({ kind: 'ready' });
    } else {
      this._shellState.set('error');
      const reason = result.error.reason;
      let code: 'auth' | 'network' | 'timeout' | 'protocol' = 'network';
      if (reason === 'expired' || reason === 'missing' || reason === 'invalid') {
        code = 'auth';
      } else if (reason === 'timeout') {
        code = 'timeout';
      } else if (reason === 'protocol_mismatch') {
        code = 'protocol';
      }
      this._bootstrapState.set({
        kind: 'error',
        code,
        retryable: reason !== 'expired' && reason !== 'missing' && reason !== 'invalid',
      });
    }
  }

  onRetry(): void {
    this._shellState.set('loading');
    this._bootstrapState.set({ kind: 'initiating' });
    this.iframeInitService.retry().subscribe({
      next: (result) => this.handleInitResult(result),
      error: () => {
        this._shellState.set('error');
        this._bootstrapState.set({
          kind: 'error',
          code: 'network',
          retryable: true,
        });
      },
    });
  }

  onTimeout(): void {
    // Bootstrap component handles timeout state internally
  }

  onNavigateToLogin(): void {
    const url = this.loginUrl();
    this.postMessageHandler.send('GUIDERS_SESSION_EXPIRED', {
      sessionId: '',
      reAuthCallback: url,
      timestamp: Date.now(),
    });
    setTimeout(() => {
      window.location.href = url;
    }, 0);
  }

  onSessionExpiredDismissed(): void {
    this._sessionExpiredVisible.set(false);
  }
}
