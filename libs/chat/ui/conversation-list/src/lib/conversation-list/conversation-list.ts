import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat } from '@guiders-frontend/shared/types';
import { ConversationItem } from '@guiders-frontend/chat/ui/conversation-item';

@Component({
  selector: 'guiders-conversation-list',
  standalone: true,
  imports: [CommonModule, ConversationItem],
  templateUrl: './conversation-list.html',
  styleUrl: './conversation-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidersConversationListComponent implements OnChanges {
  @Input({ required: true }) conversations: Chat[] = [];
  @Input() selectedConversationId: string | null = null;
  @Output() conversationSelected = new EventEmitter<Chat>();

  @ViewChild('list', { static: true }) listRef?: ElementRef<HTMLDivElement>;

  scrollToSelected() {
    if (!this.listRef) return;
    const selected = this.listRef.nativeElement.querySelector('.is-selected');
    if (selected) {
      (selected as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  ngOnChanges(): void {
    this.scrollToSelected();
  }

  onSelect(conversation: Chat) {
    this.conversationSelected.emit(conversation);
  }
}
