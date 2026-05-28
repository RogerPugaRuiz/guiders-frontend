import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatMessages } from './chat-messages';
import { Chat } from '@guiders-frontend/shared/types';

describe('ChatMessages', () => {
  let component: ChatMessages;
  let fixture: ComponentFixture<ChatMessages>;

  const mockChat: Chat = {
    chatId: 'test-chat-1',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    department: 'support',
    subject: 'Test Chat',
    visitorId: 'visitor-1',
    unreadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [
      { id: 'visitor-1', name: 'Test User', role: 'visitor', status: 'online' },
      { id: 'commercial-1', name: 'Agent', role: 'commercial', status: 'online' }
    ],
    name: 'Test Chat',
    archived: false,
    muted: false,
    pinned: false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatMessages],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatMessages);
    component = fixture.componentInstance;
    
    // Proporcionar valores requeridos para los inputs
    fixture.componentRef.setInput('chat', mockChat);
    fixture.componentRef.setInput('messages', []);
    fixture.componentRef.setInput('currentUserId', 'visitor-1');
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
