import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '@guiders-frontend/button';

@Component({
  selector: 'guiders-chat-welcome-state',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './chat-welcome-state.html',
  styleUrl: './chat-welcome-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidersChatWelcomeStateComponent {
  @Input() title = 'Selecciona una conversación';
  @Input() description = 'Elige una conversación de la lista para comenzar a chatear';
  @Input() showNewChatButton = false;
  @Input() newChatButtonText = 'Nueva conversación';

  @Output() newChatClicked = new EventEmitter<void>();

  onNewChatClick() {
    this.newChatClicked.emit();
  }
}