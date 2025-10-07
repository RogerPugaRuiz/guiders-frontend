import { Component, input, computed, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { IconName, IconSize, IconConfig } from './icon.types';
import { ICON_REGISTRY } from './icon-registry';

/**
 * Componente Icon
 * 
 * Sistema de iconografía SVG para interfaces B2B con soporte completo para
 * accesibilidad, múltiples tamaños y configuración flexible.
 * 
 * Características:
 * - 60+ iconos organizados en categorías
 * - 5 tamaños estándar (xs, sm, md, lg, xl)
 * - Soporte completo ARIA
 * - Colores personalizables vía CSS custom properties
 * - SVG inline para máximo rendimiento
 * - Type-safe con TypeScript
 * 
 * @example
 * ```html
 * <!-- Básico -->
 * <guiders-icon name="search" />
 * 
 * <!-- Con tamaño -->
 * <guiders-icon name="user" size="lg" />
 * 
 * <!-- Con configuración de accesibilidad -->
 * <guiders-icon 
 *   name="check-circle" 
 *   size="md" 
 *   [config]="{ ariaLabel: 'Tarea completada', role: 'img' }" />
 * 
 * <!-- Decorativo -->
 * <guiders-icon name="star" [config]="{ isDecorative: true }" />
 * ```
 * 
 * @example CSS personalizado
 * ```scss
 * .success-icon {
 *   --icon-color: var(--color-success-600);
 * }
 * 
 * .danger-icon {
 *   --icon-color: var(--color-danger-600);
 * }
 * ```
 */
@Component({
  selector: 'guiders-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      [class]="iconClasses()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-hidden]="isAriaHidden()"
      [attr.role]="iconRole()"
      [innerHTML]="sanitizedSvg()">
    </span>
  `,
  styleUrls: ['./icon.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class IconComponent {
  // === INPUTS ===
  
  /**
   * Nombre del icono a mostrar
   * Debe ser uno de los iconos disponibles en IconName
   */
  name = input.required<IconName>();
  
  /**
   * Tamaño del icono
   * @default 'md'
   */
  size = input<IconSize>('md');
  
  /**
   * Configuración adicional para accesibilidad y comportamiento
   */
  config = input<IconConfig>();
  
  /**
   * Clases CSS adicionales
   */
  class = input<string>('');

  // === COMPUTED SIGNALS ===
  
  /**
   * SVG sanitizado y listo para renderizar
   */
  sanitizedSvg = computed(() => {
    const iconName = this.name();
    const svgContent = ICON_REGISTRY[iconName];
    
    if (!svgContent) {
      console.warn(`Icon "${iconName}" not found in registry`);
      // Icono de fallback
      return this.sanitizer.bypassSecurityTrustHtml(ICON_REGISTRY['help-circle']);
    }
    
    return this.sanitizer.bypassSecurityTrustHtml(svgContent);
  });
  
  /**
   * Clases CSS computadas para el icono
   */
  iconClasses = computed(() => {
    const size = this.size();
    const customClass = this.class();
    const classes = [
      'guiders-icon',
      `guiders-icon--${size}`
    ];
    
    if (customClass) {
      classes.push(customClass);
    }
    
    return classes.join(' ');
  });
  
  /**
   * Label de accesibilidad computado
   */
  ariaLabel = computed(() => {
    const config = this.config();
    return config?.ariaLabel || null;
  });
  
  /**
   * Determina si el icono está oculto para lectores de pantalla
   */
  isAriaHidden = computed(() => {
    const config = this.config();
    const hasAriaLabel = !!config?.ariaLabel;
    const isDecorative = config?.decorative === true;
    
    // Si es decorativo o no tiene label, ocultarlo de lectores de pantalla
    return isDecorative || !hasAriaLabel ? 'true' : null;
  });
  
  /**
   * Rol ARIA computado
   */
  iconRole = computed(() => {
    const config = this.config();
    const hasAriaLabel = !!config?.ariaLabel;
    
    // Solo asignar role si tiene significado semántico
    if (config?.role) {
      return config.role;
    }
    
    if (hasAriaLabel && !config?.decorative) {
      return 'img';
    }
    
    return null;
  });

  private readonly sanitizer = inject(DomSanitizer);
}