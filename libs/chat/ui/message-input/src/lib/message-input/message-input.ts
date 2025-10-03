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

    this.isSending.set(true);
    this.messageSent.emit(text);

    // Limpiar después de enviar
    this.messageText.set('');
    this.adjustTextareaHeight();
    this.isSending.set(false);

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
