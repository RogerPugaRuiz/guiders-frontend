import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';
import { DomSanitizer } from '@angular/platform-browser';

describe('IconComponent', () => {
  let component: IconComponent;
  let fixture: ComponentFixture<IconComponent>;
  let sanitizer: DomSanitizer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
    sanitizer = TestBed.inject(DomSanitizer);
  });

  describe('Renderizado básico', () => {
    it('debe crear el componente', () => {
      expect(component).toBeTruthy();
    });

    it('debe renderizar un icono válido', () => {
      // Arrange
      fixture.componentRef.setInput('name', 'search');
      
      // Act
      fixture.detectChanges();
      
      // Assert
      const element = fixture.nativeElement;
      expect(element.querySelector('span')).toBeTruthy();
      expect(element.innerHTML).toContain('svg');
    });

    it('debe aplicar la clase de tamaño correcta', () => {
      // Arrange
      fixture.componentRef.setInput('name', 'user');
      fixture.componentRef.setInput('size', 'lg');
      
      // Act
      fixture.detectChanges();
      
      // Assert
      const span = fixture.nativeElement.querySelector('span');
      expect(span.className).toContain('guiders-icon--lg');
    });
  });

  describe('Accesibilidad', () => {
    it('debe configurar aria-label cuando se proporciona', () => {
      // Arrange
      fixture.componentRef.setInput('name', 'check');
      fixture.componentRef.setInput('config', { ariaLabel: 'Completado' });
      
      // Act
      fixture.detectChanges();
      
      // Assert
      const span = fixture.nativeElement.querySelector('span');
      expect(span.getAttribute('aria-label')).toBe('Completado');
      expect(span.getAttribute('role')).toBe('img');
      expect(span.getAttribute('aria-hidden')).toBeNull();
    });

    it('debe marcar como decorativo cuando se especifica', () => {
      // Arrange
      fixture.componentRef.setInput('name', 'star');
      fixture.componentRef.setInput('config', { decorative: true });
      
      // Act
      fixture.detectChanges();
      
      // Assert
      const span = fixture.nativeElement.querySelector('span');
      expect(span.getAttribute('aria-hidden')).toBe('true');
      expect(span.getAttribute('aria-label')).toBeNull();
      expect(span.getAttribute('role')).toBeNull();
    });

    it('debe usar rol personalizado cuando se proporciona', () => {
      // Arrange
      fixture.componentRef.setInput('name', 'alert-triangle');
      fixture.componentRef.setInput('config', { 
        ariaLabel: 'Advertencia',
        role: 'alert' 
      });
      
      // Act
      fixture.detectChanges();
      
      // Assert
      const span = fixture.nativeElement.querySelector('span');
      expect(span.getAttribute('role')).toBe('alert');
      expect(span.getAttribute('aria-label')).toBe('Advertencia');
    });

    it('debe ocultar de lectores de pantalla cuando no hay label', () => {
      // Arrange
      fixture.componentRef.setInput('name', 'menu');
      
      // Act
      fixture.detectChanges();
      
      // Assert
      const span = fixture.nativeElement.querySelector('span');
      expect(span.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Tamaños', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
    
    sizes.forEach(size => {
      it(`debe aplicar la clase correcta para el tamaño ${size}`, () => {
        // Arrange
        fixture.componentRef.setInput('name', 'home');
        fixture.componentRef.setInput('size', size);
        
        // Act
        fixture.detectChanges();
        
        // Assert
        const span = fixture.nativeElement.querySelector('span');
        expect(span.className).toContain(`guiders-icon--${size}`);
      });
    });

    it('debe usar "md" como tamaño por defecto', () => {
      // Arrange
      fixture.componentRef.setInput('name', 'search');
      
      // Act
      fixture.detectChanges();
      
      // Assert
      const span = fixture.nativeElement.querySelector('span');
      expect(span.className).toContain('guiders-icon--md');
    });
  });

  describe('Clases CSS', () => {
    it('debe aplicar clases adicionales', () => {
      // Arrange
      fixture.componentRef.setInput('name', 'user');
      fixture.componentRef.setInput('class', 'custom-class another-class');
      
      // Act
      fixture.detectChanges();
      
      // Assert
      const span = fixture.nativeElement.querySelector('span');
      expect(span.className).toContain('custom-class');
      expect(span.className).toContain('another-class');
    });

    it('debe mantener las clases base del componente', () => {
      // Arrange
      fixture.componentRef.setInput('name', 'settings');
      fixture.componentRef.setInput('class', 'custom');
      
      // Act
      fixture.detectChanges();
      
      // Assert
      const span = fixture.nativeElement.querySelector('span');
      expect(span.className).toContain('guiders-icon');
      expect(span.className).toContain('custom');
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar icono de fallback para nombre inválido', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        // Mock implementation - silencing console warnings for test
      });
      fixture.componentRef.setInput('name', 'invalid-icon' as 'search');
      
      // Act
      fixture.detectChanges();
      
      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Icon "invalid-icon" not found in registry');
      const element = fixture.nativeElement;
      expect(element.innerHTML).toContain('svg'); // Debe mostrar el fallback
      
      consoleSpy.mockRestore();
    });
  });

  describe('Sanitización', () => {
    it('debe sanitizar el contenido SVG', () => {
      // Arrange
      const sanitizeSpy = vi.spyOn(sanitizer, 'bypassSecurityTrustHtml');
      fixture.componentRef.setInput('name', 'check');
      
      // Act
      fixture.detectChanges();
      
      // Assert
      expect(sanitizeSpy).toHaveBeenCalled();
    });
  });
});