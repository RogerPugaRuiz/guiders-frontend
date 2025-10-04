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

  messageText = ''; // Usar propiedad normal para mejor compatibilidad con ngModel
  readonly isSending = signal(false);
  private sendingTimestamp = 0;
  private readonly SEND_DEBOUNCE_MS = 500; // Prevenir envíos duplicados dentro de 500ms

  ngAfterViewInit(): void {
    this.adjustTextareaHeight();
    
    // Hacer foco en el textarea después de la inicialización
    setTimeout(() => {
      this.textareaRef?.nativeElement.focus();
    }, 100);
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
