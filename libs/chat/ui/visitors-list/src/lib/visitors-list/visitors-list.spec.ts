import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorsListComponent } from './visitors-list';
import { Visitor } from '@guiders-frontend/types';

describe('VisitorsListComponent', () => {
  let component: VisitorsListComponent;
  let fixture: ComponentFixture<VisitorsListComponent>;

  const mockVisitors: Visitor[] = [
    {
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
      totalChats: 0
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorsListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorsListComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('visitors', mockVisitors);
    fixture.componentRef.setInput('loading', false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
