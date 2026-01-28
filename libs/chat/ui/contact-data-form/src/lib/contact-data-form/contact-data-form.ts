import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
  effect,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LeadContactData,
  SaveContactDataRequest,
} from '@guiders-frontend/shared/types';

export interface ContactDataFormValue {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni: string;
  poblacion: string;
}

@Component({
  selector: 'guiders-contact-data-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-data-form.html',
  styleUrl: './contact-data-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactDataForm implements OnInit {
  private readonly fb = inject(FormBuilder);

  // === INPUTS ===
  /** ID del visitante (requerido para guardar) */
  readonly visitorId = input.required<string>();

  /** Datos de contacto existentes (para edición) */
  readonly contactData = input<LeadContactData | null>(null);

  /** Si el formulario está en modo solo lectura */
  readonly readonly = input<boolean>(false);

  /** Si el formulario está guardando */
  readonly saving = input<boolean>(false);

  /** ID del chat actual (para extraer contexto) */
  readonly chatId = input<string | undefined>(undefined);

  // === OUTPUTS ===
  /** Emite cuando se guarda el formulario */
  readonly save = output<SaveContactDataRequest>();

  /** Emite cuando se cancela la edición */
  readonly cancelEdit = output<void>();

  // === FORM ===
  readonly form = this.fb.group({
    nombre: ['', [Validators.maxLength(100)]],
    apellidos: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
    telefono: [
      '',
      [Validators.pattern(/^[+]?[\d\s\-()]{6,20}$/), Validators.maxLength(20)],
    ],
    dni: ['', [Validators.maxLength(20)]],
    poblacion: ['', [Validators.maxLength(100)]],
  });

  // === STATE ===
  /**
   * Tracks form validity reactively.
   * Signal that indicates if the form has at least one field with a value.
   */
  private readonly _isFormValid = signal<boolean>(false);
  readonly isFormValid = this._isFormValid.asReadonly();

  /**
   * Determines if the form can be submitted.
   * The submit button will be enabled when:
   * - The form has at least one field with a value (isFormValid)
   * - The form is not currently saving (saving)
   * - The form is not in readonly mode (readonly)
   */
  readonly canSubmit = computed(() => {
    return this.isFormValid() && !this.saving() && !this.readonly();
  });

  /**
   * Detects if there are changes compared to the original contact data.
   * NOTE: This computed is currently not used to disable the submit button,
   * but is maintained for potential future UX improvements (e.g., showing a visual indicator).
   *
   * Returns true when form values differ from the original contactData.
   */
  readonly hasChanges = computed(() => {
    const current = this.contactData();
    const formValue = this.form.value;

    if (!current) {
      // Si no hay datos previos, hay cambios si hay algún valor
      return this.isFormValid();
    }

    // Comparar con datos existentes
    return (
      (formValue.nombre?.trim() || '') !== (current.nombre || '') ||
      (formValue.apellidos?.trim() || '') !== (current.apellidos || '') ||
      (formValue.email?.trim() || '') !== (current.email || '') ||
      (formValue.telefono?.trim() || '') !== (current.telefono || '') ||
      (formValue.dni?.trim() || '') !== (current.dni || '') ||
      (formValue.poblacion?.trim() || '') !== (current.poblacion || '')
    );
  });

  constructor() {
    // Sincronizar datos existentes con el formulario
    effect(() => {
      const data = this.contactData();
      if (data) {
        this.form.patchValue(
          {
            nombre: data.nombre || '',
            apellidos: data.apellidos || '',
            email: data.email || '',
            telefono: data.telefono || '',
            dni: data.dni || '',
            poblacion: data.poblacion || '',
          },
          { emitEvent: true }
        );
      }
    });

    // Deshabilitar formulario si es readonly
    effect(() => {
      if (this.readonly()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });

    // Subscribe to form changes to update isFormValid signal
    this.form.valueChanges.subscribe(() => {
      this.updateFormValiditySignal();
    });
  }

  /**
   * Updates the form validity signal based on current form values.
   * Called whenever form values change.
   */
  private updateFormValiditySignal(): void {
    const formValue = this.form.value;
    const isValid = !!(
      formValue.nombre?.trim() ||
      formValue.apellidos?.trim() ||
      formValue.email?.trim() ||
      formValue.telefono?.trim() ||
      formValue.dni?.trim() ||
      formValue.poblacion?.trim()
    );
    this._isFormValid.set(isValid);
  }

  ngOnInit(): void {
    // Cargar datos existentes si los hay
    const data = this.contactData();
    if (data) {
      this.form.patchValue({
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        email: data.email || '',
        telefono: data.telefono || '',
        dni: data.dni || '',
        poblacion: data.poblacion || '',
      });
    }

    // Initial validation check
    this.updateFormValiditySignal();
  }

  // === METHODS ===
  onSubmit(): void {
    if (!this.canSubmit()) return;

    const formValue = this.form.value;

    // NOTA: visitorId NO va en el body, se pasa separadamente al componente padre
    // El padre (Inbox) lo usará en la URL del endpoint
    // NOTA: extractedFromChatId NO se envía en edición manual, solo en extracción automática (IA)
    const request: SaveContactDataRequest = {
      ...(formValue.nombre?.trim() && { nombre: formValue.nombre.trim() }),
      ...(formValue.apellidos?.trim() && {
        apellidos: formValue.apellidos.trim(),
      }),
      ...(formValue.email?.trim() && { email: formValue.email.trim() }),
      ...(formValue.telefono?.trim() && {
        telefono: formValue.telefono.trim(),
      }),
      ...(formValue.dni?.trim() && { dni: formValue.dni.trim() }),
      ...(formValue.poblacion?.trim() && {
        poblacion: formValue.poblacion.trim(),
      }),
      // extractedFromChatId se omite en edición manual
      // Solo se enviaría en un flujo de extracción automática
    };

    this.save.emit(request);
  }

  onCancel(): void {
    // Restaurar valores originales
    const data = this.contactData();
    if (data) {
      this.form.patchValue({
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        email: data.email || '',
        telefono: data.telefono || '',
        dni: data.dni || '',
        poblacion: data.poblacion || '',
      });
    } else {
      this.form.reset();
    }
    this.cancelEdit.emit();
  }

  getError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return null;

    if (control.errors['email']) return 'Email invalido';
    if (control.errors['maxlength']) {
      return `Maximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.errors['pattern']) {
      if (fieldName === 'telefono') return 'Formato de telefono invalido';
      return 'Formato invalido';
    }

    return null;
  }
}
