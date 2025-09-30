import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Visitor } from '@guiders-frontend/shared/types';

@Component({
  selector: 'guiders-pending-chats-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-chats-modal.html',
  styleUrl: './pending-chats-modal.scss',
})
export class PendingChatsModal {
  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly data = input.required<{visitor: Visitor, pendingChatIds: string[]}>();
  readonly loading = input<boolean>(false);

  // Outputs
  readonly closeModal = output<void>();
  readonly takeChat = output<string>();
  readonly transferChat = output<{chatId: string, targetUserId: string}>();

  onClose(): void {
    this.closeModal.emit();
  }

  onTakeChat(chatId: string): void {
    this.takeChat.emit(chatId);
  }

  onTransferChat(chatId: string, targetUserId: string): void {
    this.transferChat.emit({ chatId, targetUserId });
  }
}
