import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ChatComponent } from './chat.component';
import { ChatService } from './services/chat.service';
import { of, throwError } from 'rxjs';
import { Chat, ChatListResponse, Participant, Message } from '@libs/feature/chat';
import { expect } from '@jest/globals';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let chatServiceSpy: jest.Mocked<ChatService>;

  const mockParticipants: Participant[] = [
    {
      id: '1',
      name: 'Ana Rodríguez',
      role: 'visitor',
      isOnline: true,
      joinedAt: new Date()
    },
    {
      id: '2',
      name: 'Agent Smith',
      role: 'commercial',
      isOnline: true,
      joinedAt: new Date()
    }
  ];

  const mockMessage: Message = {
    id: 'msg1',
    chatId: 'chat1',
    senderId: '1',
    senderName: 'Ana Rodríguez',
    content: 'Hola, ¿podrían ayudarme con información sobre los servicios de guía turística?',
    type: 'text',
    timestamp: new Date(),
    isRead: false
  };

  const mockChats: Chat[] = [
    {
      id: 'chat1',
      participants: mockParticipants,
      status: 'active',
      lastMessage: mockMessage,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'chat2',
      participants: [
        {
          id: '3',
          name: 'José López',
          role: 'visitor',
          isOnline: false,
          joinedAt: new Date()
        }
      ],
      status: 'closed',
      lastMessage: {
        ...mockMessage,
        id: 'msg2',
        chatId: 'chat2',
        senderId: '3',
        senderName: 'José López',
        content: 'Muchas gracias por la información.',
        timestamp: new Date(Date.now() - 86400000) // Ayer
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockChatListResponse: ChatListResponse = {
    data: mockChats,
    pagination: {
      hasMore: false,
      limit: 50
    }
  };

  beforeEach(async () => {
    const chatSpy = {
      getChats: jest.fn().mockReturnValue(of(mockChatListResponse))
    };

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: ChatService, useValue: chatSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    chatServiceSpy = TestBed.inject(ChatService) as jest.Mocked<ChatService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load chats on initialization', () => {
    component.ngOnInit();

    expect(chatServiceSpy.getChats).toHaveBeenCalledWith({ include: ['participants', 'lastMessage'] });
    expect(component.chats).toEqual(mockChats);
    expect(component.isLoading).toBe(false);
    expect(component.error).toBeNull();
  });

  it('should handle loading state correctly', () => {
    // Mock delayed response
    chatServiceSpy.getChats.mockReturnValue(of(mockChatListResponse));
    
    component.ngOnInit();
    
    // Initially loading should be true, then false after response
    expect(component.isLoading).toBe(false); // Jest executes synchronously for of()
    expect(component.chats).toEqual(mockChats);
  });

  it('should handle errors when loading chats', () => {
    const errorMessage = 'Network error';
    chatServiceSpy.getChats.mockReturnValue(throwError(() => new Error(errorMessage)));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.ngOnInit();

    expect(component.error).toBe('Error al cargar los chats. Por favor, intente nuevamente.');
    expect(component.isLoading).toBe(false);
    expect(component.chats).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Error loading chats:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('should handle empty chat list', () => {
    const emptyResponse: ChatListResponse = {
      data: [],
      pagination: { hasMore: false, limit: 50 }
    };
    
    chatServiceSpy.getChats.mockReturnValue(of(emptyResponse));

    component.ngOnInit();

    expect(component.chats).toEqual([]);
    expect(component.filteredChats).toEqual([]);
  });

  describe('Chat utility methods', () => {
    beforeEach(() => {
      component.chats = mockChats;
    });

    it('should get participant initials correctly', () => {
      const initials = component.getParticipantInitials(mockChats[0]);
      expect(initials).toBe('AR');
    });

    it('should handle single name for initials', () => {
      const chatWithSingleName = {
        ...mockChats[0],
        participants: [
          { ...mockParticipants[0], name: 'Ana' }
        ]
      };
      const initials = component.getParticipantInitials(chatWithSingleName);
      expect(initials).toBe('AN'); // Takes first 2 characters if only one word
    });

    it('should return default initials for missing visitor', () => {
      const chatWithNoVisitor = {
        ...mockChats[0],
        participants: [mockParticipants[1]] // Only commercial
      };
      const initials = component.getParticipantInitials(chatWithNoVisitor);
      expect(initials).toBe('VS');
    });

    it('should get visitor name correctly', () => {
      const name = component.getVisitorName(mockChats[0]);
      expect(name).toBe('Ana Rodríguez');
    });

    it('should return default name for missing visitor', () => {
      const chatWithNoVisitor = {
        ...mockChats[0],
        participants: [mockParticipants[1]]
      };
      const name = component.getVisitorName(chatWithNoVisitor);
      expect(name).toBe('Visitante');
    });

    it('should detect online participants', () => {
      expect(component.hasOnlineParticipant(mockChats[0])).toBe(true);
      expect(component.hasOnlineParticipant(mockChats[1])).toBe(false);
    });

    it('should get correct status class', () => {
      expect(component.getParticipantStatusClass(mockChats[0])).toBe('chat-item__status--online');
      expect(component.getParticipantStatusClass(mockChats[1])).toBe('chat-item__status--offline');
    });

    it('should format message time correctly', () => {
      const now = new Date();
      const todayChat = {
        ...mockChats[0],
        lastMessage: { ...mockMessage, timestamp: now }
      };
      
      const timeString = component.formatLastMessageTime(todayChat);
      expect(timeString).toMatch(/^\d{2}:\d{2}$/); // Should be HH:MM format

      const yesterdayChat = mockChats[1];
      expect(component.formatLastMessageTime(yesterdayChat)).toBe('Ayer');
    });

    it('should handle missing last message for time formatting', () => {
      const chatWithoutMessage = {
        ...mockChats[0],
        lastMessage: undefined
      };
      expect(component.formatLastMessageTime(chatWithoutMessage)).toBe('');
    });

    it('should get last message preview correctly', () => {
      const preview = component.getLastMessagePreview(mockChats[0]);
      expect(preview).toBe('Hola, ¿podrían ayudarme con información sobre los servicios de guía turística?');
    });

    it('should truncate long messages', () => {
      const longMessage = 'A'.repeat(70);
      const chatWithLongMessage = {
        ...mockChats[0],
        lastMessage: { ...mockMessage, content: longMessage }
      };
      
      const preview = component.getLastMessagePreview(chatWithLongMessage);
      expect(preview).toBe(longMessage.substring(0, 60) + '...');
    });

    it('should handle missing last message for preview', () => {
      const chatWithoutMessage = {
        ...mockChats[0],
        lastMessage: undefined
      };
      expect(component.getLastMessagePreview(chatWithoutMessage)).toBe('Sin mensajes');
    });

    it('should track chats by id', () => {
      const trackId = component.trackByChat(0, mockChats[0]);
      expect(trackId).toBe('chat1');
    });
  });

  describe('Filter functionality', () => {
    beforeEach(() => {
      component.chats = [
        { ...mockChats[0], status: 'active' },
        { ...mockChats[1], status: 'closed' },
        { ...mockChats[0], id: 'chat3', status: 'waiting' }
      ];
    });

    it('should filter chats by status', () => {
      component.selectedFilterValue = 'active';
      expect(component.filteredChats).toHaveLength(1);
      expect(component.filteredChats[0].status).toBe('active');

      component.selectedFilterValue = 'closed';
      expect(component.filteredChats).toHaveLength(1);
      expect(component.filteredChats[0].status).toBe('closed');

      component.selectedFilterValue = 'unassigned';
      expect(component.filteredChats).toHaveLength(1);
      expect(component.filteredChats[0].status).toBe('waiting');
    });

    it('should show all chats when filter is "all"', () => {
      component.selectedFilterValue = 'all';
      expect(component.filteredChats).toHaveLength(3);
    });

    it('should handle onFilterChange', () => {
      component.onFilterChange('active');
      expect(component.selectedFilterValue).toBe('active');
    });
  });

  describe('Error handling and retry', () => {
    it('should allow retrying after error', () => {
      // First call fails
      chatServiceSpy.getChats.mockReturnValueOnce(throwError(() => new Error('Network error')));
      // Second call succeeds
      chatServiceSpy.getChats.mockReturnValueOnce(of(mockChatListResponse));

      component.ngOnInit();
      expect(component.error).toBeTruthy();

      // Retry
      component.loadChats();
      expect(component.error).toBeNull();
      expect(component.chats).toEqual(mockChats);
    });
  });
});