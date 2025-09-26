import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateChatModal } from './create-chat-modal';
import { Visitor } from '@guiders-frontend/types';

describe('CreateChatModal', () => {
  let component: CreateChatModal;
  let fixture: ComponentFixture<CreateChatModal>;

  const mockVisitor: Visitor = {
    id: '1',
    name: 'Test Visitor',
    email: 'test@example.com',
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
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateChatModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateChatModal);
    component = fixture.componentInstance;
    
    // Set the required input
    fixture.componentRef.setInput('visitor', mockVisitor);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
