import { Component, ElementRef, OnInit, OnDestroy, viewChild, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { ChatData, SelectOption } from '../../models/chat.models';
import { ChatListComponent, ChatSearchEvent, ChatFilterEvent, ChatSelectionEvent, ChatRetryEvent } from '../chat-list/chat-list';
import { ChatMessages } from '../chat-messages/chat-messages';
import { ChatSelectionService } from '../../services/chat-selection.service';
import { ChatWebSocketService } from '../../services/chat-websocket.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { AvatarService } from 'src/app/core/services/avatar.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, ChatListComponent, ChatMessages],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class ChatComponent {


  private avatarService = inject(AvatarService);

  // Referencias a elementos del template usando viewChild signal
  trackingInfoPanel = viewChild<ElementRef>('trackingInfoPanel');
  messageTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('messageTextarea');

  // Estado utilizando signals (nuevo en Angular 20)
  selectedChat = signal<ChatData | null>(null);
  currentMessageText = signal('');
  isTrackingPanelVisible = signal(false);
  textareaRows = signal(1);
  readonly maxTextareaRows = 5;

  // Métodos implementados con signals
  visitorStatus() {
    const chat = this.selectedChat();
    if (!chat) return 'Sin seleccionar';
    
    const visitor = chat.participants.find(p => p.isVisitor);
    if (!visitor) return 'Sin información';
    
    if (visitor.isOnline) return 'En línea';
    return 'Desconectado';
  }

  canSendMessage() {
    return this.selectedChat() !== null && this.currentMessageText().trim().length > 0;
  }

  onParticipantStatusUpdated($event: { participantId: string; isOnline: boolean; }) {
    console.log('🔄 [Chat] Participant status updated:', $event);
    this.selectedChat.update(chat => {
      if (!chat) return chat;
      const participant = chat.participants.find(p => p.id === $event.participantId);
      if (participant) {
        participant.isOnline = $event.isOnline;
      }
      return chat;
    });
  }

  getChatAvatarUrl(): string {
    const chat = this.selectedChat();
    if (!chat) return '';
    
    const visitor = chat.participants.find(p => p.isVisitor)?.name;
    return this.avatarService.generateVisitorAvatar(visitor || '');
  }

  onAvatarError($event: Event): void {
    const img = $event.target as HTMLImageElement;
    img.style.display = 'none';
    // El fallback text se mostrará automáticamente
  }

  sendMessage() {
    const message = this.currentMessageText().trim();
    const chat = this.selectedChat();
    
    if (!message || !chat) return;
    
    // Aquí se implementaría el envío del mensaje
    console.log('Enviando mensaje:', message, 'al chat:', chat.id);
    
    // Limpiar el campo de mensaje y resetear altura
    this.currentMessageText.set('');
    this.textareaRows.set(1);
  }

  onKeyDown($event: KeyboardEvent) {
    if ($event.key === 'Enter') {
      if (!$event.shiftKey) {
        // Enter sin Shift: enviar mensaje
        $event.preventDefault();
        this.sendMessage();
      } else {
        // Shift+Enter: nueva línea - el textarea se expandirá automáticamente con adjustTextareaHeight
        // No necesitamos prevenir el evento porque queremos que se agregue el salto de línea
        // La expansión se manejará en onMessageInput cuando se actualice el contenido
      }
    }
  }

  private adjustTextareaHeight() {
    const textarea = this.messageTextarea()?.nativeElement;
    if (!textarea) return;

    const text = this.currentMessageText();
    
    // Si el texto está completamente vacío (sin saltos de línea), resetear a 1 fila
    if (text === '') {
      this.textareaRows.set(1);
      return;
    }
    
    // Contar líneas basándose en saltos de línea, considerando líneas vacías
    const lines = text.split('\n').length;
    const newRows = Math.min(Math.max(1, lines), this.maxTextareaRows);
    
    this.textareaRows.set(newRows);
  }

  onMessageInput($event: Event) {
    const target = $event.target as HTMLTextAreaElement;
    this.currentMessageText.set(target.value);
    
    // Debug logging para verificar el comportamiento
    console.log('💬 Contenido textarea:', JSON.stringify(target.value));
    console.log('📏 Líneas detectadas:', target.value.split('\n').length);
    
    this.adjustTextareaHeight();
  }

  currentMessage() {
    return this.currentMessageText();
  }

  getCurrentTextareaRows() {
    return this.textareaRows();
  }

  closeTrackingInfo() {
    this.isTrackingPanelVisible.set(false);
  }

  visitor() {
    const chat = this.selectedChat();
    if (!chat) return 'Sin chat seleccionado';
    
    const visitor = chat.participants.find(p => p.isVisitor);
    return visitor?.name || 'Visitante anónimo';
  }

  selectedChatStatusClass() {
    const chat = this.selectedChat();
    if (!chat) return 'chat-contact__status--offline';
    
    const visitor = chat.participants.find(p => p.isVisitor);
    if (visitor?.isOnline) return 'chat-contact__status--online';
    return 'chat-contact__status--offline';
  }

  selectedChatInitials() {
    const chat = this.selectedChat();
    if (!chat) return '?';
    
    const visitor = chat.participants.find(p => p.isVisitor);
    if (!visitor) return '?';
    
    if (visitor.name) {
      const nameParts = visitor.name.split(' ');
      return nameParts.map(part => part.charAt(0).toUpperCase()).join('').substring(0, 2);
    }
    
    return 'AN'; // Anónimo
  }

  toggleTrackingInfo() {
    this.isTrackingPanelVisible.update(visible => !visible);
  }

  showTrackingPanel() {
    return this.isTrackingPanelVisible();
  }

  onChatSelected(event: ChatSelectionEvent) {
    this.selectedChat.set(event.chat);
    console.log('🎯 [Chat] Chat seleccionado desde chat-list:', event.chat.id, event.chat);
  }
}