import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
  ChangeDetectionStrategy,
  input,
  inject,
  OnDestroy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PresenceService } from '@guiders-frontend/presence-service';

@Component({
  selector: 'guiders-message-input',
  imports: [FormsModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageInput implements AfterViewInit, OnDestroy {
  @Output() messageSent = new EventEmitter<string>();

  @ViewChild('textarea') textareaRef?: ElementRef<HTMLTextAreaElement>;

  // Input para el chatId (puede ser null antes de crear el chat)
  readonly chatId = input<string | null>(null);

  messageText = ''; // Usar propiedad normal para mejor compatibilidad con ngModel
  readonly isSending = signal(false);
  private sendingTimestamp = 0;
  private readonly SEND_DEBOUNCE_MS = 500; // Prevenir envíos duplicados dentro de 500ms

  // Servicio de presencia para typing indicators
  private readonly presenceService = inject(PresenceService);

  ngAfterViewInit(): void {
    this.adjustTextareaHeight();

    // Hacer foco en el textarea después de la inicialización
    setTimeout(() => {
      this.textareaRef?.nativeElement.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    // Detener typing al destruir el componente
    const chatId = this.chatId();
    if (chatId) {
      this.presenceService.stopTyping(chatId);
    }
  }

  onInput(): void {
    // Ajustar altura del textarea
    this.adjustTextareaHeight();

    const chatId = this.chatId();
    if (!chatId) return; // No enviar typing si no hay chat

    // Enviar evento de typing si hay texto
    if (this.messageText.trim().length > 0) {
      this.presenceService.startTyping(chatId);
    } else {
      // Si borra todo el texto, detener typing
      this.presenceService.stopTyping(chatId);
    }
  }

  onBlur(): void {
    // Detener typing cuando pierde el foco
    const chatId = this.chatId();
    if (chatId) {
      this.presenceService.stopTyping(chatId);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Enviar con Enter (sin Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const text = this.messageText.trim();
    if (!text || this.isSending()) {
      return;
    }

    // Prevenir envíos duplicados
    const now = Date.now();
    if (now - this.sendingTimestamp < this.SEND_DEBOUNCE_MS) {
      console.warn('[MessageInput] Envío bloqueado por debounce');
      return;
    }

    this.sendingTimestamp = now;
    this.isSending.set(true);

    // Detener typing antes de enviar
    const chatId = this.chatId();
    if (chatId) {
      this.presenceService.stopTyping(chatId);
    }

    console.log('[MessageInput] Enviando mensaje:', text);
    this.messageSent.emit(text);

    // Limpiar después de enviar
    this.messageText = '';
    this.adjustTextareaHeight();
    
    // Estrategia de refocus múltiple para asegurar que el foco se mantiene
    // Primer intento inmediato
    setTimeout(() => {
      this.textareaRef?.nativeElement.focus();
      console.log('[MessageInput] Foco restaurado (intento 1)');
    }, 0);
    
    // Segundo intento después del ciclo de Angular
    setTimeout(() => {
      this.textareaRef?.nativeElement.focus();
      console.log('[MessageInput] Foco restaurado (intento 2)');
      this.isSending.set(false);
    }, 50);
    
    // Tercer intento como fallback
    setTimeout(() => {
      this.textareaRef?.nativeElement.focus();
      console.log('[MessageInput] Foco restaurado (intento 3 - fallback)');
    }, 150);
  }

  adjustTextareaHeight(): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) {
      return;
    }

    // Reset height para calcular scrollHeight correctamente
    textarea.style.height = 'auto';
    
    // Calcular altura necesaria (máximo 120px ~ 5 líneas)
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  }
}
