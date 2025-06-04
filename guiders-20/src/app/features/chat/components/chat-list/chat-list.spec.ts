import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ChatListComponent } from './chat-list';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../../../core/services/websocket.service';

// Mock services
class MockChatService {
  getChats() {
    return of({ data: [], pagination: { hasMore: false, limit: 50 } });
  }
}

class MockWebSocketService {
  getMessagesByType() {
    return of();
  }
  connect() {}
  disconnect() {}
  isConnected() { return false; }
}

describe('ChatListComponent', () => {
  let component: ChatListComponent;
  let fixture: ComponentFixture<ChatListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatListComponent],
      providers: [
        { provide: ChatService, useClass: MockChatService },
        { provide: WebSocketService, useClass: MockWebSocketService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
