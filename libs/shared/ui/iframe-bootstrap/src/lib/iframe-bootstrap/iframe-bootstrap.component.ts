import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { SkeletonBlockComponent } from '@guiders-frontend/shared/ui/skeleton';
import { IconComponent } from '@guiders-frontend/icon';
import { ButtonSecondaryComponent } from '@guiders-frontend/button-secondary';
import type { IframeThemeSummary } from '@guiders-frontend/shared/types/iframe';

export type BootstrapState =
  | { kind: 'initiating' }
  | { kind: 'themed'; theme: IframeThemeSummary }
  | { kind: 'ready' }
  | { kind: 'error'; code: 'auth' | 'network' | 'timeout' | 'protocol'; retryable: boolean }
  | { kind: 'timeout-warning'; elapsed: number };

@Component({
  selector: 'guiders-iframe-bootstrap',
  standalone: true,
  imports: [SkeletonBlockComponent, IconComponent, ButtonSecondaryComponent],
  template: `
    @if (displayState().kind !== 'ready') {
      <div class="guiders-bootstrap"
           role="status"
           [attr.aria-label]="ariaLabel()"
           [attr.aria-live]="displayState().kind === 'error' ? 'assertive' : 'polite'">

        @switch (displayState().kind) {
          @case ('initiating') {
            <div class="guiders-bootstrap__neutral">
              <lib-skeleton-block width="80px" height="32px" />
              <lib-skeleton-block width="200px" height="1rem" />
              <lib-skeleton-block width="160px" height="1rem" />
              <p class="guiders-bootstrap__text">Cargando panel...</p>
            </div>
          }
          @case ('themed') {
            <div class="guiders-bootstrap__themed">
              @if (displayState().theme.config.logos.header.url) {
                <img [src]="displayState().theme.config.logos.header.url"
                     [alt]="displayState().theme.name + ' logo'"
                     class="guiders-bootstrap__logo" />
              }
              <lib-skeleton-block width="80px" height="32px" />
              <lib-skeleton-block width="200px" height="1rem" />
              <lib-skeleton-block width="160px" height="1rem" />
              <p class="guiders-bootstrap__text">Cargando...</p>
            </div>
          }
          @case ('timeout-warning') {
            <div class="guiders-bootstrap__warning">
              <guiders-icon name="loading" size="lg" />
              <p class="guiders-bootstrap__text">Tardando más de lo esperado...</p>
            </div>
          }
          @case ('error') {
            <div class="guiders-bootstrap__error" role="alert">
              <guiders-icon name="alert-triangle" size="lg" />
              <h3 class="guiders-bootstrap__error-title">{{ errorTitle() }}</h3>
              @if (displayState().retryable) {
                <guiders-button-secondary
                  (clicked)="retry.emit()"
                  [ariaLabel]="'Reintentar carga del panel'">
                  Reintentar
                </guiders-button-secondary>
              } @else {
                <a [href]="loginUrl()"
                   rel="noopener noreferrer"
                   target="_top"
                   class="guiders-bootstrap__login-link">
                  Ir a login completo
                </a>
              }
            </div>
          }
        }
      </div>
    }
  `,
  styleUrl: './iframe-bootstrap.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--guiders-color-primary]': 'themedPrimary()',
    '[style.--guiders-color-background]': 'themedBackground()',
    '[style.--guiders-color-text-primary]': 'themedTextPrimary()',
    '[style.--guiders-font-family]': 'themedFontFamily()',
  },
})
export class IframeBootstrapComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly state = input.required<BootstrapState>();
  readonly loginUrl = input<string>('https://leadcars.com/login');
  readonly retry = output<void>();
  readonly timeout = output<void>();

  private readonly warningMs = 5_000;
  private readonly timeoutMs = 12_000;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private hasTimedOut = false;
  private _internalState = signal<BootstrapState>({ kind: 'initiating' });

  readonly displayState = computed(() => {
    const input = this.state();
    return input.kind === 'initiating' ? this._internalState() : input;
  });

  readonly themedPrimary = computed(() => {
    const s = this.displayState();
    return s.kind === 'themed' ? s.theme.config.colors.primary : null;
  });

  readonly themedBackground = computed(() => {
    const s = this.displayState();
    return s.kind === 'themed' ? s.theme.config.colors.background : null;
  });

  readonly themedTextPrimary = computed(() => {
    const s = this.displayState();
    return s.kind === 'themed' ? s.theme.config.colors.textPrimary : null;
  });

  readonly themedFontFamily = computed(() => {
    const s = this.displayState();
    return s.kind === 'themed' ? s.theme.config.typography.fontFamily : null;
  });

  readonly ariaLabel = computed(() => {
    const s = this.displayState();
    if (s.kind === 'error') {
      return this.errorTitle();
    }
    if (s.kind === 'timeout-warning') {
      return 'Carga tardando más de lo esperado';
    }
    if (s.kind === 'themed') {
      return `Cargando panel de ${s.theme.name}`;
    }
    return 'Cargando panel';
  });

  readonly errorTitle = computed(() => {
    const s = this.displayState();
    if (s.kind !== 'error') {
      return '';
    }
    switch (s.code) {
      case 'auth':
        return 'Error de autenticación';
      case 'network':
        return 'Error de conexión';
      case 'timeout':
        return 'La carga está tardando demasiado';
      case 'protocol':
        return 'Versión incompatible';
      default: {
        const _exhaustive: never = s.code;
        return _exhaustive;
      }
    }
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearTimer();
    });

    effect(() => {
      const s = this.state();
      if (s.kind === 'initiating') {
        this._internalState.set({ kind: 'initiating' });
        this.hasTimedOut = false;
        this.startTimer();
      } else {
        this._internalState.set(s);
        this.clearTimer();
      }
    });
  }

  private startTimer(): void {
    this.clearTimer();
    if (this.intervalId !== null) {
      return;
    }
    let elapsed = 0;
    this.intervalId = setInterval(() => {
      elapsed += 100;
      if (elapsed >= this.timeoutMs) {
        if (!this.hasTimedOut) {
          this.hasTimedOut = true;
          this.timeout.emit();
        }
        this._internalState.set({ kind: 'error', code: 'timeout', retryable: true });
        this.clearTimer();
      } else if (elapsed >= this.warningMs) {
        this._internalState.set({ kind: 'timeout-warning', elapsed });
      }
    }, 100);
  }

  private clearTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
