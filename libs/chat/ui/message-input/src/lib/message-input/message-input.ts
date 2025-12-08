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
  OnDestroy,
  effect,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PresenceService } from '@guiders-frontend/presence-service';
import { ChatService } from '@guiders-frontend/chat-service';
import { take } from 'rxjs';

@Component({
  selector: 'guiders-message-input',
  imports: [FormsModule, CommonModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageInput implements AfterViewInit, OnDestroy {
  @Output() messageSent = new EventEmitter<string>();

  @ViewChild('textarea') textareaRef?: ElementRef<HTMLTextAreaElement>;

  // Input para el chatId (puede ser null antes de crear el chat)
  readonly chatId = input<string | null>(null);

  // Input para el siteId (requerido para sugerencias de IA)
  readonly siteId = input<string | null>(null);

  // Input para el último mensaje del visitante (para sugerencias contextuales)
  readonly lastVisitorMessage = input<string | undefined>(undefined);

  messageText = ''; // Usar propiedad normal para mejor compatibilidad con ngModel
  readonly isSending = signal(false);
  private sendingTimestamp = 0;
  private readonly SEND_DEBOUNCE_MS = 500; // Prevenir envíos duplicados dentro de 500ms

  // Servicio de presencia para typing indicators
  private readonly presenceService = inject(PresenceService);

  // Servicio de chat para sugerencias
  private readonly chatService = inject(ChatService);

  // Estado de sugerencias
  readonly suggestions = signal<string[]>([]);
  readonly isLoadingSuggestions = signal(false);
  readonly showSuggestions = signal(false);

  // Estado de mejora de texto
  readonly isImprovingText = signal(false);

  // Computed para verificar si hay sugerencias disponibles
  readonly hasSuggestions = computed(() => this.suggestions().length > 0);

  constructor() {
    // Efecto para cargar sugerencias cuando cambia el chatId
    effect(() => {
      const chatId = this.chatId();
      if (chatId) {
        // Resetear sugerencias cuando cambia el chat
        this.suggestions.set([]);
        this.showSuggestions.set(false);
      }
    });
  }

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

  /**
   * Carga sugerencias de IA para el chat actual
   */
  loadSuggestions(): void {
    const chatId = this.chatId();
    const siteId = this.siteId();

    if (!chatId || !siteId || this.isLoadingSuggestions()) {
      if (!siteId) {
        console.warn('[MessageInput] No se puede cargar sugerencias: falta siteId');
      }
      return;
    }

    this.isLoadingSuggestions.set(true);
    this.showSuggestions.set(true);

    const lastMessage = this.lastVisitorMessage();

    this.chatService.getSuggestions(chatId, siteId, lastMessage)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          console.log('[MessageInput] Sugerencias recibidas:', response);
          this.suggestions.set(response.suggestions);
          this.isLoadingSuggestions.set(false);
        },
        error: (error) => {
          console.error('[MessageInput] Error al cargar sugerencias:', error);
          this.suggestions.set([]);
          this.isLoadingSuggestions.set(false);
        }
      });
  }

  /**
   * Selecciona una sugerencia y la inserta en el textarea
   */
  selectSuggestion(suggestion: string): void {
    this.messageText = suggestion;
    this.showSuggestions.set(false);

    // Ajustar altura y hacer foco después de que Angular actualice el DOM
    setTimeout(() => {
      this.adjustTextareaHeight();
      this.textareaRef?.nativeElement.focus();
    }, 0);

    // Notificar typing
    const chatId = this.chatId();
    if (chatId) {
      this.presenceService.startTyping(chatId);
    }
  }

  /**
   * Oculta las sugerencias
   */
  hideSuggestions(): void {
    this.showSuggestions.set(false);
  }

  /**
   * Toggle inteligente: sugerencias o mejora según contenido del input
   */
  toggleSuggestions(): void {
    if (this.showSuggestions()) {
      this.hideSuggestions();
      return;
    }

    const currentText = this.messageText.trim();

    if (currentText.length > 0) {
      // Hay texto → mejorar
      this.improveCurrentText(currentText);
    } else {
      // Sin texto → sugerencias
      this.loadSuggestions();
    }
  }

  /**
   * Mejora el texto actual usando IA
   */
  private improveCurrentText(text: string): void {
    const siteId = this.siteId();

    if (!siteId || this.isImprovingText()) {
      if (!siteId) {
        console.warn('[MessageInput] No se puede mejorar texto: falta siteId');
      }
      return;
    }

    this.isImprovingText.set(true);

    this.chatService.improveText(siteId, text)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          console.log('[MessageInput] Texto mejorado:', response);
          this.messageText = response.improvedText;
          this.isImprovingText.set(false);

          // Ajustar altura del textarea y hacer foco
          setTimeout(() => {
            this.adjustTextareaHeight();
            this.textareaRef?.nativeElement.focus();
          }, 0);
        },
        error: (error) => {
          console.error('[MessageInput] Error al mejorar texto:', error);
          this.isImprovingText.set(false);
        }
      });
  }
}
