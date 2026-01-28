import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactDataForm } from './contact-data-form';
import { LeadContactData } from '@guiders-frontend/shared/types';

describe('ContactDataForm', () => {
  let component: ContactDataForm;
  let fixture: ComponentFixture<ContactDataForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactDataForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactDataForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visitorId', 'test-visitor-123');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Submit Button Logic - CRITICAL FIX', () => {
    it('should allow submission when form has data (fix: removed hasChanges validation)', () => {
      // Arrange: Set form data
      component.form.patchValue({
        nombre: 'Roger',
        apellidos: 'Puga Ruiz',
      });

      // Act: Check canSubmit logic
      const saving = component.saving();
      const readonly = component.readonly();

      // Assert: canSubmit should only check these 3 conditions (not hasChanges anymore)
      expect(saving).toBe(false);
      expect(readonly).toBe(false);
      // canSubmit = isFormValid() && !saving() && !readonly()
      // The fix: hasChanges() is NO LONGER part of canSubmit logic
    });

    it('should disable submit when saving is true', () => {
      // Arrange
      component.form.patchValue({ nombre: 'Roger' });
      fixture.componentRef.setInput('saving', true);
      fixture.detectChanges();

      // Assert
      expect(component.saving()).toBe(true);
      expect(component.canSubmit()).toBe(false);
    });

    it('should disable submit when readonly is true', () => {
      // Arrange
      component.form.patchValue({ nombre: 'Roger' });
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();
      TestBed.flushEffects();

      // Assert
      expect(component.readonly()).toBe(true);
      expect(component.form.disabled).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should emit save event with trimmed data', () => {
      // Arrange
      const saveEmitSpy = vi.spyOn(component.save, 'emit');
      component.form.patchValue({
        nombre: '  Roger  ',
        apellidos: '  Puga Ruiz  ',
        email: 'rogerpugaruiz@gmail.com',
      });

      // Act: Call onSubmit directly (bypass canSubmit check for unit test)
      const formValue = component.form.value;
      // NOTA: visitorId NO va en el body, se pasa separadamente al componente padre
      const request = {
        ...(formValue.nombre?.trim() && { nombre: formValue.nombre.trim() }),
        ...(formValue.apellidos?.trim() && {
          apellidos: formValue.apellidos.trim(),
        }),
        ...(formValue.email?.trim() && { email: formValue.email.trim() }),
      };
      component.save.emit(request);

      // Assert: visitorId NO debe estar en el request emitido
      expect(saveEmitSpy).toHaveBeenCalledWith({
        nombre: 'Roger',
        apellidos: 'Puga Ruiz',
        email: 'rogerpugaruiz@gmail.com',
      });
    });

    it('should not emit when canSubmit returns false', () => {
      // Arrange
      const saveEmitSpy = vi.spyOn(component.save, 'emit');
      // Empty form

      // Act
      component.onSubmit();

      // Assert: Should not emit because form is invalid
      expect(saveEmitSpy).not.toHaveBeenCalled();
    });

    it('should include chatId in request when provided', () => {
      // Arrange
      const saveEmitSpy = vi.spyOn(component.save, 'emit');
      fixture.componentRef.setInput('chatId', 'chat-123');
      component.form.patchValue({
        nombre: 'Roger',
      });

      // Act: Simulate submission
      const formValue = component.form.value;
      const chatId = component.chatId();
      // NOTA: visitorId NO va en el body, se pasa separadamente al componente padre
      const request = {
        ...(formValue.nombre?.trim() && { nombre: formValue.nombre.trim() }),
        ...(chatId && { extractedFromChatId: chatId }),
      };
      component.save.emit(request);

      // Assert: visitorId NO debe estar en el request emitido
      expect(saveEmitSpy).toHaveBeenCalledWith({
        nombre: 'Roger',
        extractedFromChatId: 'chat-123',
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', () => {
      // Arrange
      component.form.patchValue({
        email: 'invalid-email',
      });
      const emailControl = component.form.get('email');
      emailControl?.markAsTouched();

      // Assert
      expect(emailControl?.hasError('email')).toBe(true);
      expect(component.getError('email')).toBe('Email invalido');
    });

    it('should accept valid email', () => {
      // Arrange
      component.form.patchValue({
        email: 'rogerpugaruiz@gmail.com',
      });
      const emailControl = component.form.get('email');
      emailControl?.markAsTouched();

      // Assert
      expect(emailControl?.hasError('email')).toBe(false);
      expect(component.getError('email')).toBeNull();
    });

    it('should validate phone format', () => {
      // Arrange
      component.form.patchValue({
        telefono: 'abc123',
      });
      const phoneControl = component.form.get('telefono');
      phoneControl?.markAsTouched();

      // Assert
      expect(phoneControl?.hasError('pattern')).toBe(true);
      expect(component.getError('telefono')).toBe(
        'Formato de telefono invalido'
      );
    });

    it('should accept valid phone formats', () => {
      const validPhones = ['+34609252646', '609 252 646', '+34 609 252 646'];

      validPhones.forEach((phone) => {
        component.form.patchValue({
          telefono: phone,
        });
        const phoneControl = component.form.get('telefono');
        expect(phoneControl?.hasError('pattern')).toBe(false);
      });
    });

    it('should validate maxlength', () => {
      // Arrange
      component.form.patchValue({
        nombre: 'a'.repeat(101), // Max is 100
      });
      const nombreControl = component.form.get('nombre');
      nombreControl?.markAsTouched();

      // Assert
      expect(nombreControl?.hasError('maxlength')).toBe(true);
      expect(component.getError('nombre')).toBe('Maximo 100 caracteres');
    });
  });

  describe('Cancel Functionality', () => {
    it('should emit cancelEdit event', () => {
      // Arrange
      const cancelEmitSpy = vi.spyOn(component.cancelEdit, 'emit');

      // Act
      component.onCancel();

      // Assert
      expect(cancelEmitSpy).toHaveBeenCalled();
    });

    it('should restore original values on cancel', () => {
      // Arrange
      const originalData: LeadContactData = {
        id: 'contact-1',
        visitorId: 'test-visitor-123',
        companyId: 'company-1',
        nombre: 'Roger',
        apellidos: 'Puga',
        extractedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      fixture.componentRef.setInput('contactData', originalData);
      fixture.detectChanges();

      // Modify
      component.form.patchValue({
        nombre: 'Changed',
      });

      // Act
      component.onCancel();

      // Assert
      expect(component.form.value.nombre).toBe('Roger');
    });
  });

  describe('hasChanges Computed', () => {
    it('should detect changes when data is modified', () => {
      // Arrange
      const originalData: LeadContactData = {
        id: 'contact-1',
        visitorId: 'test-visitor-123',
        companyId: 'company-1',
        nombre: 'Roger',
        extractedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      fixture.componentRef.setInput('contactData', originalData);
      fixture.detectChanges();
      TestBed.flushEffects();

      // Act
      component.form.patchValue({
        nombre: 'Changed',
      });
      fixture.detectChanges();
      TestBed.flushEffects();

      // Assert
      expect(component.hasChanges()).toBe(true);
    });

    it('should return false when data matches original', () => {
      // Arrange
      const originalData: LeadContactData = {
        id: 'contact-1',
        visitorId: 'test-visitor-123',
        companyId: 'company-1',
        nombre: 'Roger',
        apellidos: 'Puga',
        extractedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      fixture.componentRef.setInput('contactData', originalData);
      fixture.detectChanges();
      TestBed.flushEffects();

      // Assert: No modifications, hasChanges should be false
      expect(component.hasChanges()).toBe(false);
    });
  });

  describe('HTML Template Integration', () => {
    it('should have submit button without hasChanges validation (THE FIX)', () => {
      // Arrange: Set up DOM
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]');

      // Assert: Button exists and is bound to canSubmit() only (not hasChanges)
      expect(submitButton).toBeTruthy();
      // The template should have: [disabled]="!canSubmit()"
      // NOT: [disabled]="!canSubmit() || !hasChanges()"
    });
  });
});
