import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorCard } from './visitor-card';
import { Visitor } from '@guiders-frontend/types';

describe('VisitorCard', () => {
  let component: VisitorCard;
  let fixture: ComponentFixture<VisitorCard>;

  const mockVisitor: Visitor = {
    id: '1',
    name: 'Test Visitor',
    email: 'test@example.com',
    phone: '+1234567890',
    location: 'Test Location',
    device: 'Desktop',
    browser: 'Chrome',
    os: 'Windows',
    currentPage: '/test',
    timeOnSite: 300,
    pageViews: 5,
    status: 'online',
    lastActivity: new Date().toISOString(),
    firstVisit: new Date().toISOString(),
    sessions: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorCard],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorCard);
    component = fixture.componentInstance;
    
    // Set the required input
    fixture.componentRef.setInput('visitor', mockVisitor);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
