import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  afterNextRender,
  HostListener,
  ElementRef,
  DestroyRef,
} from '@angular/core';
import { ButtonSecondaryComponent } from '@guiders-frontend/button-secondary';
import { IconComponent } from '@guiders-frontend/icon';

export type SessionExpiredReason = 'expired' | 'invalid' | 'forced' | 'unknown';

interface ReasonConfig {
  icon: 'alert-triangle' | 'x-circle' | 'lock';
  title: string;
  body: string;
}

const REASON_CONFIGS: Record<SessionExpiredReason, ReasonConfig> = {
  expired: {
    icon: 'alert-triangle',
    title: 'Sesión expirada',
    body: 'Tu sesión ha expirado por inactividad. Puedes reintentar la sesión para continuar sin perder tu progreso.',
  },
  invalid: {
    icon: 'alert-triangle',
    title: 'Sesión inválida',
    body: 'Tu sesión no es válida. Por favor, inicia sesión nuevamente.',
  },
  forced: {
    icon: 'lock',
    title: 'Sesión cerrada',
    body: 'Tu sesión ha sido cerrada por otro dispositivo. Puedes reintentar la sesión o iniciar una nueva.',
  },
  unknown: {
    icon: 'x-circle',
    title: 'Error de sesión',
    body: 'Hubo un problema con tu sesión. Por favor, intenta nuevamente.',
  },
};

let instanceCounter = 0;

@Component({
  selector: 'guiders-session-expired-modal',
  standalone: true,
  imports: [ButtonSecondaryComponent, IconComponent],
  templateUrl: './session-expired-modal.component.html',
  styleUrl: './session-expired-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--guiders-color-primary]': 'themedPrimary()',
    '[style.--guiders-color-background]': 'themedBackground()',
    '[style.--guiders-color-text-primary]': 'themedTextPrimary()',
    '[style.--guiders-font-family]': 'themedFontFamily()',
  },
})
export class SessionExpiredModalComponent {
  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly keydownHandler = (event: KeyboardEvent) => this.trapFocus(event);

  readonly visible = input<boolean>(false);
  readonly reason = input<SessionExpiredReason>('expired');
  readonly sessionId = input<string>('');
  readonly loginUrl = input<string>('');

  readonly reAuthenticate = output<void>();
  readonly navigateToLogin = output<void>();
  readonly dismissed = output<void>();

  readonly config = computed(() => REASON_CONFIGS[this.reason()]);

  private readonly instanceId = `session-expired-modal-${++instanceCounter}`;
  readonly titleId = `${this.instanceId}-title`;
  readonly bodyId = `${this.instanceId}-body`;

  private readonly _primary = signal<string | null>(null);
  private readonly _background = signal<string | null>(null);
  private readonly _textPrimary = signal<string | null>(null);
  private readonly _fontFamily = signal<string | null>(null);

  readonly themedPrimary = computed(() => this._primary());
  readonly themedBackground = computed(() => this._background());
  readonly themedTextPrimary = computed(() => this._textPrimary());
  readonly themedFontFamily = computed(() => this._fontFamily());

  private previousFocus: HTMLElement | null = null;
  private bodyOverflowCache: string | null = null;

  constructor() {
    document.addEventListener('keydown', this.keydownHandler);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('keydown', this.keydownHandler);
    });

    afterNextRender(() => {
      const style = getComputedStyle(document.documentElement);
      const setIfPresent = (signalRef: { set: (v: string | null) => void }, value: string) => {
        const trimmed = value.trim();
        if (trimmed) signalRef.set(trimmed);
      };
      setIfPresent(this._primary, style.getPropertyValue('--guiders-color-primary'));
      setIfPresent(this._background, style.getPropertyValue('--guiders-color-background'));
      setIfPresent(this._textPrimary, style.getPropertyValue('--guiders-color-text-primary'));
      setIfPresent(this._fontFamily, style.getPropertyValue('--guiders-font-family'));
    });

    effect(() => {
      if (this.visible()) {
        this.previousFocus = document.activeElement as HTMLElement | null;
        this.bodyOverflowCache = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      } else if (this.bodyOverflowCache !== null) {
        document.body.style.overflow = this.bodyOverflowCache;
        this.bodyOverflowCache = null;
        this.previousFocus = null;
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target instanceof HTMLElement && event.target.classList.contains('modal-overlay')) {
      this.dismissed.emit();
    }
  }

  onCloseClick(): void {
    this.dismissed.emit();
  }

  onReAuthenticate(): void {
    this.reAuthenticate.emit();
  }

  onNavigateToLogin(event: MouseEvent): void {
    event.preventDefault();
    this.navigateToLogin.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) {
      this.dismissed.emit();
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    if (!this.visible() || event.key !== 'Tab') return;

    const modal = this.el.nativeElement.querySelector('[data-modal-card]');
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
