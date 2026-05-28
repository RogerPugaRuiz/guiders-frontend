import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ChatWidgetService } from './chat-widget.service';
import { Visitor } from '@guiders-frontend/shared/types';

describe('ChatWidgetService', () => {
  let service: ChatWidgetService;

  const mockVisitor: Visitor = {
    id: 'visitor-123',
    name: 'Test Visitor',
    email: 'test@example.com',
    companyId: 'company-1',
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    status: 'online'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [ChatWidgetService]
    });

    service = TestBed.inject(ChatWidgetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with closed state', () => {
    const data = service.getWidgetData();
    expect(data.state).toBe('closed');
    expect(data.visitor).toBeNull();
    expect(data.chatId).toBeNull();
  });

  it('should open widget with visitor', () => {
    service.openWidget(mockVisitor);

    const data = service.getWidgetData();
    expect(data.state).toBe('open');
    expect(data.visitor).toEqual(mockVisitor);
    expect(data.isPending).toBe(false);
  });

  it('should open widget with chat', () => {
    service.openWithChat('chat-456', mockVisitor);

    const data = service.getWidgetData();
    expect(data.state).toBe('open');
    expect(data.chatId).toBe('chat-456');
    expect(data.visitor).toEqual(mockVisitor);
  });

  it('should open pending chat', () => {
    service.openPendingChat('chat-789', mockVisitor);

    const data = service.getWidgetData();
    expect(data.state).toBe('open');
    expect(data.chatId).toBe('chat-789');
    expect(data.isPending).toBe(true);
  });

  it('should mark chat as assigned', () => {
    service.openPendingChat('chat-789', mockVisitor);
    service.markChatAsAssigned();

    const data = service.getWidgetData();
    expect(data.isPending).toBe(false);
  });

  it('should minimize widget', () => {
    service.openWidget(mockVisitor);
    service.minimizeWidget();

    const data = service.getWidgetData();
    expect(data.state).toBe('minimized');
  });

  it('should restore widget from minimized', () => {
    service.openWidget(mockVisitor);
    service.minimizeWidget();
    service.restoreWidget();

    const data = service.getWidgetData();
    expect(data.state).toBe('open');
  });

  it('should close widget', () => {
    service.openWidget(mockVisitor);
    service.closeWidget();

    const data = service.getWidgetData();
    expect(data.state).toBe('closed');
    expect(data.visitor).toBeNull();
    expect(data.chatId).toBeNull();
  });

  it('should toggle minimize', () => {
    service.openWidget(mockVisitor);
    expect(service.getWidgetData().state).toBe('open');

    service.toggleMinimize();
    expect(service.getWidgetData().state).toBe('minimized');

    service.toggleMinimize();
    expect(service.getWidgetData().state).toBe('open');
  });

  it('should update chat id', () => {
    service.openWidget(mockVisitor);
    service.updateChatId('new-chat-123');

    const data = service.getWidgetData();
    expect(data.chatId).toBe('new-chat-123');
  });

  it('should check if active', () => {
    expect(service.isActive()).toBe(false);

    service.openWidget(mockVisitor);
    expect(service.isActive()).toBe(true);

    service.closeWidget();
    expect(service.isActive()).toBe(false);
  });
});