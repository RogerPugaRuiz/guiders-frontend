import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConversationItem } from './conversation-item';
import { Chat } from '@guiders-frontend/shared/types';

describe('ConversationItem', () => {
  let fixture: ComponentFixture<ConversationItem>;
  let component: ConversationItem;

  function buildChat(overrides: Partial<Chat> = {}): Chat {
    return {
      chatId: 'real-chat',
      status: 'ACTIVE',
      priority: 'NORMAL',
      visitorId: 'visitor-1',
      unreadCount: 0,
      isTyping: false,
      typingUsers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: [],
      name: 'Visitante',
      archived: false,
      muted: false,
      pinned: false,
      ...overrides,
    } as Chat;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationItem],
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationItem);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('conversation', buildChat());
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('TourSandbox demo badge', () => {
    it('renders DEMO badge when conversation chatId matches demo prefix', () => {
      fixture.componentRef.setInput(
        'conversation',
        buildChat({ chatId: 'tour-demo-chat-1' })
      );
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector(
        '[data-testid="conversation-demo-badge"]'
      );
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('DEMO');
    });

    it('does not render DEMO badge for real conversations', () => {
      fixture.componentRef.setInput(
        'conversation',
        buildChat({ chatId: 'real-chat-99' })
      );
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector(
        '[data-testid="conversation-demo-badge"]'
      );
      expect(badge).toBeFalsy();
    });
  });
});
