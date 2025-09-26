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
import { TextField } from '@guiders-frontend/text-field';
import { Select } from '@guiders-frontend/select';
import { Checkbox } from '@guiders-frontend/checkbox';

export interface CreateChatModalConfig {
  departments: Array<{ id: string; name: string; }>;
  priorities: Array<{ id: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; name: string; color: string; }>;
  defaultDepartment?: string;
  defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requireMessage: boolean;
  maxMessageLength: number;
}

export interface CreateChatFormData {
  message: string;
  department: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  updateVisitorInfo: boolean;
}

@Component({
  selector: 'lib-create-chat-modal',
  imports: [CommonModule, ReactiveFormsModule, Button, TextField, Select, Checkbox],
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
    departments: [
      { id: 'sales', name: 'Ventas' },
      { id: 'support', name: 'Soporte' },
      { id: 'general', name: 'General' }
    ],
    priorities: [
      { id: 'LOW', name: 'Baja', color: '#6b7280' },
      { id: 'MEDIUM', name: 'Media', color: '#f59e0b' },
      { id: 'HIGH', name: 'Alta', color: '#ef4444' },
      { id: 'URGENT', name: 'Urgente', color: '#dc2626' }
    ],
    defaultDepartment: 'sales',
    defaultPriority: 'MEDIUM',
    requireMessage: true,
    maxMessageLength: 500
  });

  // Outputs
  readonly modalClose = output<void>();
  readonly createChat = output<CreateChatWithVisitorRequest>();

  // Internal state
  private readonly fb = new FormBuilder();
  readonly chatForm = signal<FormGroup>(this.createForm());
  readonly showAdvancedOptions = signal<boolean>(false);

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

  readonly selectedPriority = computed(() => {
    const form = this.chatForm();
    const priorityId = form.get('priority')?.value;
    return this.config().priorities.find(p => p.id === priorityId);
  });

  readonly departmentOptions = computed(() => {
    return this.config().departments.map(dept => ({ 
      value: dept.id, 
      label: dept.name 
    }));
  });

  readonly priorityOptions = computed(() => {
    return this.config().priorities.map(priority => ({ 
      value: priority.id, 
      label: priority.name 
    }));
  });

  constructor() {
    // Effect para reinicializar el formulario cuando cambie el visitante
    effect(() => {
      const visitor = this.visitor();
      if (visitor) {
        this.initializeFormForVisitor(visitor);
      }
    });

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
      message: ['', config.requireMessage ? [Validators.required, Validators.maxLength(config.maxMessageLength)] : [Validators.maxLength(config.maxMessageLength)]],
      department: [config.defaultDepartment || '', Validators.required],
      priority: [config.defaultPriority || 'MEDIUM', Validators.required],
      visitorName: [''],
      visitorEmail: ['', Validators.email],
      visitorPhone: [''],
      updateVisitorInfo: [false]
    });
  }

  private initializeFormForVisitor(visitor: Visitor): void {
    const config = this.config();
    const form = this.fb.group({
      message: ['', config.requireMessage ? [Validators.required, Validators.maxLength(config.maxMessageLength)] : [Validators.maxLength(config.maxMessageLength)]],
      department: [config.defaultDepartment || '', Validators.required],
      priority: [config.defaultPriority || 'MEDIUM', Validators.required],
      visitorName: [visitor.name || ''],
      visitorEmail: [visitor.email || '', visitor.email ? Validators.email : ''],
      visitorPhone: [visitor.phone || ''],
      updateVisitorInfo: [false]
    });

    this.chatForm.set(form);
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
    this.showAdvancedOptions.set(false);
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
      visitorInfo: formData.updateVisitorInfo ? {
        name: formData.visitorName || undefined,
        email: formData.visitorEmail || undefined,
        phone: formData.visitorPhone || undefined
      } : {
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone
      },
      metadata: {
        department: formData.department,
        source: 'proactive_chat',
        priority: formData.priority
      }
    };

    this.createChat.emit(request);
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions.update(current => !current);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      this.onSubmit();
    }
  }

  getPriorityColor(priorityId: string): string {
    const priority = this.config().priorities.find(p => p.id === priorityId);
    return priority?.color || '#6b7280';
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
