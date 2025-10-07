import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { SidebarItem } from './sidebar.types';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  const mockSidebarItems: SidebarItem[] = [
    {
      id: 'test-item',
      label: 'Test Item',
      icon: '🧪',
      route: '/test'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    
    // Proporcionar el input requerido
    fixture.componentRef.setInput('items', mockSidebarItems);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display sidebar items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Item');
  });

  it('should toggle sidebar when button is clicked', () => {
    expect(component.isCollapsed()).toBe(false);
    component.onToggleSidebar();
    expect(component.isCollapsed()).toBe(true);
  });
});
