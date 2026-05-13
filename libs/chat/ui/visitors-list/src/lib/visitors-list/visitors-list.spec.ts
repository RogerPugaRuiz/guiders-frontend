import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorsListComponent } from './visitors-list';
import { Visitor } from '@guiders-frontend/types';
import { DEMO_VISITOR_ID } from '@guiders-frontend/tour-sandbox';

describe('VisitorsListComponent', () => {
  let component: VisitorsListComponent;
  let fixture: ComponentFixture<VisitorsListComponent>;

  function buildVisitor(overrides: Partial<Visitor> = {}): Visitor {
    return {
      id: '1',
      name: 'Test Visitor 1',
      email: 'test1@example.com',
      phone: '+1234567890',
      lifecycle: 'ANON',
      isNewVisitor: true,
      status: 'online',
      domain: 'example.com',
      siteId: 'test-site',
      tenantId: 'test-tenant',
      firstVisit: new Date(),
      lastVisit: new Date(),
      totalSessions: 1,
      totalPageViews: 5,
      averageSessionDuration: 300,
      hasActiveChat: false,
      totalChats: 0,
      ...overrides,
    } as Visitor;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorsListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('visitors', [buildVisitor()]);
    fixture.componentRef.setInput('loading', false);
    expect(component).toBeTruthy();
  });

  describe('TourSandbox demo badge', () => {
    it('renders DEMO badge for the demo visitor row', () => {
      fixture.componentRef.setInput('visitors', [
        buildVisitor({ id: DEMO_VISITOR_ID, name: 'María García (DEMO)' }),
      ]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector(
        '[data-testid="visitor-demo-badge"]'
      );
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('DEMO');
    });

    it('does not render DEMO badge for regular visitors', () => {
      fixture.componentRef.setInput('visitors', [
        buildVisitor({ id: 'visitor-real-1' }),
      ]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector(
        '[data-testid="visitor-demo-badge"]'
      );
      expect(badge).toBeFalsy();
    });
  });
});
