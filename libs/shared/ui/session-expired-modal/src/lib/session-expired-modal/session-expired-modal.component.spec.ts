import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionExpiredModalComponent, SessionExpiredReason } from './session-expired-modal.component';

describe(SessionExpiredModalComponent.name, () => {
  let fixture: ComponentFixture<SessionExpiredModalComponent>;
  let component: SessionExpiredModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionExpiredModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionExpiredModalComponent);
    component = fixture.componentInstance;
  });

  function setVisible(value: boolean): void {
    fixture.componentRef.setInput('visible', value);
    fixture.detectChanges();
  }

  function setReason(value: SessionExpiredReason): void {
    fixture.componentRef.setInput('reason', value);
    fixture.detectChanges();
  }

  describe('visible=false', () => {
    it('renders nothing', () => {
      setVisible(false);
      const overlay = fixture.nativeElement.querySelector('.modal-overlay');
      expect(overlay).toBeFalsy();
    });
  });

  describe('visible=true with reason=expired', () => {
    it('renders overlay with correct title and body text', () => {
      setVisible(true);
      setReason('expired');
      const iconEl = fixture.nativeElement.querySelector('guiders-icon');
      const titleEl = fixture.nativeElement.querySelector('.modal-title');
      const bodyEl = fixture.nativeElement.querySelector('.modal-body');

      expect(iconEl).toBeTruthy();
      expect(titleEl.textContent.trim()).toBe('Sesión expirada');
      expect(bodyEl.textContent.trim()).toBe(
        'Tu sesión ha expirado por inactividad. Puedes reintentar la sesión para continuar sin perder tu progreso.',
      );
    });

    it('overlay has role="dialog" and aria-modal="true"', () => {
      setVisible(true);
      const overlay = fixture.nativeElement.querySelector('.modal-overlay');
      expect(overlay.getAttribute('role')).toBe('dialog');
      expect(overlay.getAttribute('aria-modal')).toBe('true');
    });

    it('uses unique title and body ids per instance', () => {
      setVisible(true);
      const overlay = fixture.nativeElement.querySelector('.modal-overlay');
      const titleEl = fixture.nativeElement.querySelector('.modal-title');
      const bodyEl = fixture.nativeElement.querySelector('.modal-body');

      const labelledBy = overlay.getAttribute('aria-labelledby');
      const describedBy = overlay.getAttribute('aria-describedby');
      expect(labelledBy).toBeTruthy();
      expect(describedBy).toBeTruthy();
      expect(titleEl.getAttribute('id')).toBe(labelledBy);
      expect(bodyEl.getAttribute('id')).toBe(describedBy);
    });
  });

  describe('reason variants', () => {
    it('reason=invalid renders correct text variant', () => {
      setVisible(true);
      setReason('invalid');
      const iconEl = fixture.nativeElement.querySelector('guiders-icon');
      const titleEl = fixture.nativeElement.querySelector('.modal-title');
      const bodyEl = fixture.nativeElement.querySelector('.modal-body');

      expect(iconEl).toBeTruthy();
      expect(titleEl.textContent.trim()).toBe('Sesión inválida');
      expect(bodyEl.textContent.trim()).toBe('Tu sesión no es válida. Por favor, inicia sesión nuevamente.');
    });

    it('reason=forced renders correct text variant', () => {
      setVisible(true);
      setReason('forced');
      const iconEl = fixture.nativeElement.querySelector('guiders-icon');
      const titleEl = fixture.nativeElement.querySelector('.modal-title');
      const bodyEl = fixture.nativeElement.querySelector('.modal-body');

      expect(iconEl).toBeTruthy();
      expect(titleEl.textContent.trim()).toBe('Sesión cerrada');
      expect(bodyEl.textContent.trim()).toBe(
        'Tu sesión ha sido cerrada por otro dispositivo. Puedes reintentar la sesión o iniciar una nueva.',
      );
    });

    it('reason=unknown renders correct text variant', () => {
      setVisible(true);
      setReason('unknown');
      const iconEl = fixture.nativeElement.querySelector('guiders-icon');
      const titleEl = fixture.nativeElement.querySelector('.modal-title');
      const bodyEl = fixture.nativeElement.querySelector('.modal-body');

      expect(iconEl).toBeTruthy();
      expect(titleEl.textContent.trim()).toBe('Error de sesión');
      expect(bodyEl.textContent.trim()).toBe('Hubo un problema con tu sesión. Por favor, intenta nuevamente.');
    });
  });

  describe('output emissions', () => {
    it('clicking "Reintentar sesión" emits reAuthenticate', () => {
      setVisible(true);
      const spy = vi.fn();
      component.reAuthenticate.subscribe(() => spy());

      const btnHost = fixture.nativeElement.querySelector('guiders-button-secondary');
      const innerButton = btnHost.shadowRoot?.querySelector('button') ?? btnHost.querySelector('button');
      innerButton.click();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('clicking "Ir a login completo" emits navigateToLogin (parent handles navigation)', () => {
      setVisible(true);
      const spy = vi.fn();
      component.navigateToLogin.subscribe(() => spy());

      const link = fixture.nativeElement.querySelector('.login-link');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(clickEvent);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('clicking close button emits dismissed (not reAuthenticate/navigateToLogin)', () => {
      setVisible(true);
      const reAuthSpy = vi.fn();
      const navSpy = vi.fn();
      const dismissSpy = vi.fn();
      component.reAuthenticate.subscribe(() => reAuthSpy());
      component.navigateToLogin.subscribe(() => navSpy());
      component.dismissed.subscribe(() => dismissSpy());

      const closeBtn = fixture.nativeElement.querySelector('.close-btn');
      closeBtn.click();

      expect(reAuthSpy).not.toHaveBeenCalled();
      expect(navSpy).not.toHaveBeenCalled();
      expect(dismissSpy).toHaveBeenCalledTimes(1);
    });

    it('pressing Escape emits dismissed (not reAuthenticate/navigateToLogin)', () => {
      setVisible(true);
      const reAuthSpy = vi.fn();
      const navSpy = vi.fn();
      const dismissSpy = vi.fn();
      component.reAuthenticate.subscribe(() => reAuthSpy());
      component.navigateToLogin.subscribe(() => navSpy());
      component.dismissed.subscribe(() => dismissSpy());

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(reAuthSpy).not.toHaveBeenCalled();
      expect(navSpy).not.toHaveBeenCalled();
      expect(dismissSpy).toHaveBeenCalledTimes(1);
    });

    it('Escape is ignored when modal is not visible', () => {
      setVisible(false);
      const dismissSpy = vi.fn();
      component.dismissed.subscribe(() => dismissSpy());

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(dismissSpy).not.toHaveBeenCalled();
    });

    it('clicking backdrop emits dismissed', () => {
      setVisible(true);
      const spy = vi.fn();
      component.dismissed.subscribe(() => spy());

      const backdrop = fixture.nativeElement.querySelector('.modal-overlay');
      backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('loginUrl', () => {
    it('loginUrl input is used as the link href', () => {
      fixture.componentRef.setInput('loginUrl', 'https://example.com/custom-login');
      setVisible(true);
      const link = fixture.nativeElement.querySelector('.login-link');
      expect(link.getAttribute('href')).toBe('https://example.com/custom-login');
    });
  });

  describe('focus trap', () => {
    function getFocusable(): HTMLElement[] {
      const card = fixture.nativeElement.querySelector('[data-modal-card]');
      return Array.from(
        card.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    it('Tab on the last focusable element wraps to the first', () => {
      setVisible(true);
      const focusable = getFocusable();
      expect(focusable.length).toBeGreaterThan(1);
      const last = focusable[focusable.length - 1];
      const first = focusable[0];
      last.focus();
      expect(document.activeElement).toBe(last);

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);
    });

    it('Shift+Tab on the first focusable element wraps to the last', () => {
      setVisible(true);
      const focusable = getFocusable();
      expect(focusable.length).toBeGreaterThan(1);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      first.focus();
      expect(document.activeElement).toBe(first);

      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(last);
    });
  });

  describe('body scroll lock', () => {
    it('locks body scroll on open and restores on close', () => {
      const original = document.body.style.overflow;
      setVisible(true);
      expect(document.body.style.overflow).toBe('hidden');
      setVisible(false);
      expect(document.body.style.overflow).toBe(original);
    });
  });
});