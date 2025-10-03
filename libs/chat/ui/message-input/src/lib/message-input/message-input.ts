import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'guiders-message-input',
  imports: [FormsModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageInput implements AfterViewInit {
  @Output() messageSent = new EventEmitter<string>();

  @ViewChild('textarea') textareaRef?: ElementRef<HTMLTextAreaElement>;

  readonly messageText = signal('');
  readonly isSending = signal(false);
  private sendingTimestamp = 0;
  private readonly SEND_DEBOUNCE_MS = 500; // Prevenir envíos duplicados dentro de 500ms

  ngAfterViewInit(): void {
    this.adjustTextareaHeight();
  }

  onMessageChange(value: string): void {
    this.messageText.set(value);
    this.adjustTextareaHeight();
  }

  onKeyDown(event: KeyboardEvent): void {
    // Enviar con Enter (sin Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const text = this.messageText().trim();
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
    
    console.log('[MessageInput] Enviando mensaje:', text);
    this.messageSent.emit(text);

    // Limpiar después de enviar
    this.messageText.set('');
    this.adjustTextareaHeight();
    
    // Pequeño delay antes de permitir otro envío
    setTimeout(() => {
      this.isSending.set(false);
    }, 300);

    // Refocus en el textarea
    this.textareaRef?.nativeElement.focus();
  }

  private adjustTextareaHeight(): void {
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
