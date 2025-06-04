import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ChatListComponent } from './chat-list';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../../../core/services/websocket.service';

// Mock services
class MockChatService {
  getChats() {
    return Promise.resolve({ data: [] });
  }
}

class MockWebSocketService {
  getMessagesByType() {
    return Promise.resolve();
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
      imports: [ChatListComponent, HttpClientTestingModule],
      providers: [
        provideHttpClient(),
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
