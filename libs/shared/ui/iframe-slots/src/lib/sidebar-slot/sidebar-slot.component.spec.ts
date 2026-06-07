import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarSlotComponent } from './sidebar-slot.component';

@Component({
  selector: 'guiders-test-host',
  standalone: true,
  imports: [SidebarSlotComponent],
  template: `
    <guiders-sidebar-slot [variant]="variant()">
      <div sidebar-content>Test Sidebar Content</div>
    </guiders-sidebar-slot>
  `,
})
class TestHostComponent {
  readonly variant = signal<'default' | 'icon-only'>('default');
}

describe(SidebarSlotComponent.name, () => {
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
      expect(content).toContain('Test Sidebar Content');
    });

    it('renders projected content for icon-only variant', () => {
      hostComponent.variant.set('icon-only');
      fixture.detectChanges();
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Test Sidebar Content');
    });
  });

  describe('ARIA roles', () => {
    it('has role="complementary" on host', () => {
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('guiders-sidebar-slot');
      expect(host.getAttribute('role')).toBe('complementary');
    });

    it('has aria-label="Navegación principal" on host', () => {
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('guiders-sidebar-slot');
      expect(host.getAttribute('aria-label')).toBe('Navegación principal');
    });
  });

  describe('variant input', () => {
    it('applies sidebar-slot--default class on host for default variant', () => {
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('guiders-sidebar-slot');
      expect(host.classList.contains('sidebar-slot--default')).toBe(true);
      expect(host.classList.contains('sidebar-slot--icon-only')).toBe(false);
    });

    it('applies sidebar-slot--icon-only class on host for icon-only variant', () => {
      hostComponent.variant.set('icon-only');
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('guiders-sidebar-slot');
      expect(host.classList.contains('sidebar-slot--icon-only')).toBe(true);
      expect(host.classList.contains('sidebar-slot--default')).toBe(false);
    });
  });

  describe('collapsed input', () => {
    it('accepts collapsed input without error', () => {
      fixture.detectChanges();
      const slot = fixture.nativeElement.querySelector('guiders-sidebar-slot');
      expect(slot).toBeTruthy();
    });
  });
});