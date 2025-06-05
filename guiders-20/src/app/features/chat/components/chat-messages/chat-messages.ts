import { Component, input } from '@angular/core';
import { ChatData } from '../../models/chat.models';

@Component({
  selector: 'app-chat-messages',
  imports: [],
  standalone: true,
  templateUrl: './chat-messages.html',
  styleUrl: './chat-messages.scss'
})
export class ChatMessages {
  // Input usando signals (Angular 20)
  selectedChat = input<ChatData | null>(null);
}
