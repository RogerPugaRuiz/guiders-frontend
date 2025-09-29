import { 
  ChangeDetectionStrategy, 
  Component, 
  computed, 
  effect,
  input, 
  output, 
  signal 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { 
  Visitor, 
  CreateChatWithVisitorRequest 
} from '@guiders-frontend/shared/types';
import { Button } from '@guiders-frontend/button';

export interface CreateChatModalConfig {
  requireMessage: boolean;
  maxMessageLength: number;
}

export interface CreateChatFormData {
  message: string;
}

@Component({
  selector: 'lib-create-chat-modal',
  imports: [CommonModule, ReactiveFormsModule, Button],
  standalone: true,
  templateUrl: './create-chat-modal.html',
  styleUrl: './create-chat-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateChatModal {
  // Inputs
  readonly visitor = input.required<Visitor>();
  readonly isOpen = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly config = input<CreateChatModalConfig>({
    requireMessage: true,
    maxMessageLength: 500
  });

  // Outputs
  readonly modalClose = output<void>();
  readonly createChat = output<CreateChatWithVisitorRequest>();

  // Internal state
  private readonly fb = new FormBuilder();
  readonly chatForm = signal<FormGroup>(this.createForm());

  // Computed values
  readonly isFormValid = computed(() => {
    const form = this.chatForm();
    return form.valid && !this.loading();
  });

  readonly visitorDisplayName = computed(() => {
    const visitor = this.visitor();
    return visitor.name || visitor.email || 'Visitante Anónimo';
  });

  readonly visitorStatusText = computed(() => {
    const visitor = this.visitor();
    switch (visitor.status) {
      case 'online': return 'En línea';
      case 'offline': return 'Desconectado';
      case 'idle': return 'Inactivo';
      default: return 'Desconocido';
    }
  });

  readonly messageCharacterCount = computed(() => {
    const form = this.chatForm();
    const message = form.get('message')?.value || '';
    return message.length;
  });

  readonly remainingCharacters = computed(() => {
    const config = this.config();
    const count = this.messageCharacterCount();
    return config.maxMessageLength - count;
  });

  constructor() {


    // Effect para manejar el estado del modal
    effect(() => {
      const isOpen = this.isOpen();
      if (isOpen) {
        this.onModalOpen();
      } else {
        this.onModalClose();
      }
    });
  }

  private createForm(): FormGroup {
    const config = this.config();
    return this.fb.group({
      message: ['', config.requireMessage ? [Validators.required, Validators.maxLength(config.maxMessageLength)] : [Validators.maxLength(config.maxMessageLength)]]
    });
  }



  private onModalOpen(): void {
    // Focus en el primer campo del formulario
    setTimeout(() => {
      const firstInput = document.querySelector('.create-chat-modal input, .create-chat-modal textarea') as HTMLElement;
      firstInput?.focus();
    }, 100);
  }

  private onModalClose(): void {
    // Resetear el formulario al cerrar
    this.chatForm().reset();
  }

  // Event handlers
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onCancel(): void {
    this.modalClose.emit();
  }

  onSubmit(): void {
    const form = this.chatForm();
    if (!form.valid || this.loading()) return;

    const formData = form.value as CreateChatFormData;
    const visitor = this.visitor();

    const request: CreateChatWithVisitorRequest = {
      visitorId: visitor.id,
      firstMessage: formData.message ? {
        content: formData.message,
        type: 'TEXT'
      } : undefined,
      visitorInfo: {
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone
      },
      metadata: {
        source: 'proactive_chat'
      }
    };

    this.createChat.emit(request);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      this.onSubmit();
    }
  }

  // Validación helpers
  isFieldInvalid(fieldName: string): boolean {
    const form = this.chatForm();
    const field = form.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string): string | null {
    const form = this.chatForm();
    const field = form.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return 'Este campo es obligatorio';
      if (field.errors['email']) return 'Ingresa un email válido';
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      return 'Campo inválido';
    }
    return null;
  }
}
