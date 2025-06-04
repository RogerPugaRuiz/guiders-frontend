import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { signal } from '@angular/core';

import { ChatListComponent } from './chat-list';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { Chat } from '../../../../../../../libs/feature/chat/domain/entities/chat.entity';
import { 
  WebSocketMessage,
  ChatStatusUpdatedData,
  ParticipantOnlineStatusUpdatedData,
  ChatLastMessageUpdatedData,
  SuccessResponse
} from '../../../../core/models/websocket.models';

describe('ChatListComponent - WebSocket Integration', () => {
  let component: ChatListComponent;
  let fixture: ComponentFixture<ChatListComponent>;
  let mockWebSocketService: jasmine.SpyObj<WebSocketService>;
  let mockChatService: jasmine.SpyObj<ChatService>;
  let websocketMessageSubject: Subject<WebSocketMessage>;

  const mockChats: Chat[] = [
    {
      id: 'chat-1',
      participants: [
        {
          id: 'participant-1',
          name: 'Test User',
          role: 'visitor',
          isOnline: false,
          joinedAt: new Date()
        }
      ],
      status: 'active',
      lastMessage: {
        id: 'msg-1',
        chatId: 'chat-1',
        senderId: 'participant-1',
        senderName: 'Test User',
        content: 'Hello',
        type: 'text',
        timestamp: new Date(),
        isRead: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(async () => {
    websocketMessageSubject = new Subject<WebSocketMessage>();
    
    mockWebSocketService = jasmine.createSpyObj('WebSocketService', [
      'getMessagesByType',
      'connect',
      'disconnect',
      'isConnected'
    ]);

    mockChatService = jasmine.createSpyObj('ChatService', ['getChats']);

    // Configure mocks
    mockWebSocketService.getMessagesByType.and.returnValue(websocketMessageSubject.asObservable());
    mockChatService.getChats.and.returnValue(of({ data: mockChats, pagination: { hasMore: false, limit: 50 } }));

    await TestBed.configureTestingModule({
      imports: [ChatListComponent],
      providers: [
        { provide: WebSocketService, useValue: mockWebSocketService },
        { provide: ChatService, useValue: mockChatService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    websocketMessageSubject.complete();
  });

  it('should listen to chat status updates via WebSocket', () => {
    // Arrange
    const statusUpdateData: SuccessResponse<ChatStatusUpdatedData> = {
      type: 'chat:status-updated',
      message: 'Chat status updated',
      timestamp: Date.now(),
      data: {
        chatId: 'chat-1',
        status: 'closed'
      }
    };

    // Act
    websocketMessageSubject.next({
      type: 'chat:status-updated',
      data: statusUpdateData,
      timestamp: Date.now()
    });

    // Assert
    const updatedChats = component.chats();
    expect(updatedChats[0].status).toBe('closed');
  });

  it('should listen to participant online status updates via WebSocket', () => {
    // Arrange
    const onlineStatusData: SuccessResponse<ParticipantOnlineStatusUpdatedData> = {
      type: 'participant:online-status-updated',
      message: 'Participant online status updated',
      timestamp: Date.now(),
      data: {
        participantId: 'participant-1',
        isOnline: true
      }
    };

    // Act
    websocketMessageSubject.next({
      type: 'participant:online-status-updated',
      data: onlineStatusData,
      timestamp: Date.now()
    });

    // Assert
    const updatedChats = component.chats();
    const participant = updatedChats[0].participants?.find(p => p.id === 'participant-1');
    expect(participant?.isOnline).toBe(true);
  });

  it('should listen to last message updates via WebSocket', () => {
    // Arrange
    const lastMessageData: SuccessResponse<ChatLastMessageUpdatedData> = {
      type: 'chat:last-message-updated',
      message: 'Last message updated',
      timestamp: Date.now(),
      data: {
        chatId: 'chat-1',
        lastMessage: 'New message content',
        lastMessageAt: new Date().toISOString(),
        senderId: 'participant-1'
      }
    };

    // Act
    websocketMessageSubject.next({
      type: 'chat:last-message-updated',
      data: lastMessageData,
      timestamp: Date.now()
    });

    // Assert
    const updatedChats = component.chats();
    expect(updatedChats[0].lastMessage?.content).toBe('New message content');
  });

  it('should handle WebSocket error responses gracefully', () => {
    // Arrange
    spyOn(console, 'error');
    const errorResponse = {
      error: 'Chat update failed',
      timestamp: Date.now()
    };

    // Act
    websocketMessageSubject.next({
      type: 'chat:status-updated',
      data: errorResponse,
      timestamp: Date.now()
    });

    // Assert
    expect(console.error).toHaveBeenCalledWith('Error in chat status update:', 'Chat update failed');
  });

  it('should call WebSocket service setup methods during initialization', () => {
    expect(mockWebSocketService.getMessagesByType).toHaveBeenCalledWith('chat:status-updated');
    expect(mockWebSocketService.getMessagesByType).toHaveBeenCalledWith('participant:online-status-updated');
    expect(mockWebSocketService.getMessagesByType).toHaveBeenCalledWith('chat:last-message-updated');
  });

  it('should maintain filtered chats after WebSocket updates', () => {
    // Set a filter
    component.selectedFilter.set('active');
    
    // Trigger a status update that changes the chat to closed
    const statusUpdateData: SuccessResponse<ChatStatusUpdatedData> = {
      type: 'chat:status-updated',
      message: 'Chat status updated',
      timestamp: Date.now(),
      data: {
        chatId: 'chat-1',
        status: 'closed'
      }
    };

    websocketMessageSubject.next({
      type: 'chat:status-updated',
      data: statusUpdateData,
      timestamp: Date.now()
    });

    // The chat should be filtered out since it's now closed but filter is active
    const filteredChats = component.filteredChats();
    expect(filteredChats.length).toBe(0);
  });
});