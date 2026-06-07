import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderSlotComponent } from './header-slot.component';

@Component({
  selector: 'guiders-test-host',
  standalone: true,
  imports: [HeaderSlotComponent],
  template: `
    <guiders-header-slot [variant]="variant()" [showBackButton]="showBack()">
      <div header-content>Test Header Content</div>
    </guiders-header-slot>
  `,
})
class TestHostComponent {
  readonly variant = signal<'default' | 'leadcars'>('default');
  readonly showBack = signal<boolean>(false);
}

describe(HeaderSlotComponent.name, () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('renders projected content for default variant', () => {
      fixture.detectChanges();
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Test Header Content');
    });

    it('renders projected content for leadcars variant', () => {
      hostComponent.variant.set('leadcars');
      fixture.detectChanges();
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Test Header Content');
    });
  });

  describe('ARIA roles', () => {
    it('has role="banner" on host', () => {
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('guiders-header-slot');
      expect(host.getAttribute('role')).toBe('banner');
    });

    it('has aria-label="Encabezado de la aplicación" on host', () => {
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('guiders-header-slot');
      expect(host.getAttribute('aria-label')).toBe('Encabezado de la aplicación');
    });
  });

  describe('variant input', () => {
    it('applies header-slot--default class on host for default variant', () => {
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('guiders-header-slot');
      expect(host.classList.contains('header-slot--default')).toBe(true);
      expect(host.classList.contains('header-slot--leadcars')).toBe(false);
    });

    it('applies header-slot--leadcars class on host for leadcars variant', () => {
      hostComponent.variant.set('leadcars');
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('guiders-header-slot');
      expect(host.classList.contains('header-slot--leadcars')).toBe(true);
      expect(host.classList.contains('header-slot--default')).toBe(false);
    });
  });

  describe('showBackButton input', () => {
    it('does not render back button when showBackButton is false', () => {
      hostComponent.showBack.set(false);
      fixture.detectChanges();
      const backBtn = fixture.nativeElement.querySelector('.header-slot__back-btn');
      expect(backBtn).toBeFalsy();
    });

    it('renders back button when showBackButton is true', () => {
      hostComponent.showBack.set(true);
      fixture.detectChanges();
      const backBtn = fixture.nativeElement.querySelector('.header-slot__back-btn');
      expect(backBtn).toBeTruthy();
    });
  });

  describe('backClick output', () => {
    it('emits backClick when back button is clicked', () => {
      hostComponent.showBack.set(true);
      fixture.detectChanges();
      const slot = fixture.debugElement.query(
        (el) => el.nativeElement.tagName === 'GUIDERS-HEADER-SLOT',
      );
      const headerSlot = slot.componentInstance as HeaderSlotComponent;
      const backBtn = fixture.nativeElement.querySelector('.header-slot__back-btn');
      let emitted = false;
      headerSlot.backClick.subscribe(() => {
        emitted = true;
      });
      backBtn.click();
      expect(emitted).toBe(true);
    });
  });
});