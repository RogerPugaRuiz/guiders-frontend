import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat } from '@guiders-frontend/shared/types';
import { Button } from '@guiders-frontend/button';
import { IconComponent } from '@guiders-frontend/icon';
import { GuidersConversationListComponent } from '@guiders-frontend/chat/ui/conversation-list';

@Component({
  selector: 'guiders-inbox-sidebar',
  standalone: true,
  imports: [CommonModule, Button, IconComponent, GuidersConversationListComponent],
  templateUrl: './inbox-sidebar.html',
  styleUrl: './inbox-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidersInboxSidebarComponent {
  @Input({ required: true }) conversations: Chat[] = [];
  @Input() selectedConversationId: string | null = null;
  @Input() title = 'Conversaciones';
  @Input() showNewChatButton = true;
  
  @Output() conversationSelected = new EventEmitter<Chat>();
  @Output() newChatClicked = new EventEmitter<void>();

  onConversationSelect(conversation: Chat) {
    this.conversationSelected.emit(conversation);
  }

  onNewChatClick() {
    this.newChatClicked.emit();
  }
}