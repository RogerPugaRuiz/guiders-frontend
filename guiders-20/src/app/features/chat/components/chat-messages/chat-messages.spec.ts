import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';

import { ChatMessages } from './chat-messages';
import { MOCK_CHAT_PROVIDERS, MockChatStateService } from '../../../../core/testing/chat.mocks';

describe('ChatMessages', () => {
  let component: ChatMessages;
  let fixture: ComponentFixture<ChatMessages>;
  let mockChatStateService: MockChatStateService;

  beforeEach(async () => {
    mockChatStateService = new MockChatStateService();

    await TestBed.configureTestingModule({
      imports: [ChatMessages],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: 'ChatStateService', useValue: mockChatStateService },
        ...MOCK_CHAT_PROVIDERS
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatMessages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
