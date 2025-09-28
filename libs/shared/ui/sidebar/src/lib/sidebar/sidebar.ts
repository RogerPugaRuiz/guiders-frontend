import { Component, computed, inject, input, output, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarItem, SidebarConfig } from './sidebar.types';
import { Button } from '@guiders-frontend/button';
import { IconComponent } from '@guiders-frontend/icon';
import { Badge } from '@guiders-frontend/badge';

@Component({
  selector: 'guiders-sidebar',
  imports: [CommonModule, Button, IconComponent, Badge],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly router = inject(Router);

  // Inputs usando signals API
  readonly items = input.required<SidebarItem[]>();
  readonly config = input<SidebarConfig>({
    collapsed: false,
    showToggle: true,
    theme: 'light',
    width: '280px',
    collapsedWidth: '64px'
  });

  // Outputs usando signals API
  readonly itemClick = output<SidebarItem>();
  readonly toggleSidebar = output<boolean>();

    // Estado interno con signals
  readonly isCollapsed = signal(false);
  private readonly expandedItems = signal<Set<string>>(new Set());
  private readonly popoverItem = signal<SidebarItem | null>(null);
  private elementPositions = new Map<string, DOMRect>();
  private currentPopoverItem: SidebarItem | null = null;

  // Computed values
  readonly sidebarWidth = computed(() => 
    this.isCollapsed() ? this.config().collapsedWidth : this.config().width
  );

  readonly sidebarClasses = computed(() => ({
    'sidebar': true,
    'sidebar--collapsed': this.isCollapsed(),
    [`sidebar--${this.config().theme}`]: true
  }));

  constructor() {
    // Effect para expandir automáticamente elementos padre cuando sus hijos están activos
    // SOLO se ejecuta en la inicialización, no interfiere con expansiones manuales
    let isInitialized = false;
    
    effect(() => {
      const items = this.items();
      
      // Solo auto-expandir en la primera carga o cuando cambian los items
      if (!isInitialized) {
        const expanded = new Set(this.expandedItems());
        
        items.forEach(item => {
          if (item.children && item.children.length > 0) {
            const hasActiveChild = item.children.some(child => this.isItemActive(child));
            if (hasActiveChild) {
              expanded.add(item.id);
            }
          }
        });
        
        this.expandedItems.set(expanded);
        isInitialized = true;
        console.log('Auto-expansión inicial completada:', Array.from(expanded));
      }
    });
  }



  // Métodos
  onItemClick(item: SidebarItem): void {
    console.log(`Click en item: ${item.label}`, {
      isCollapsed: this.isCollapsed(),
      hasChildren: item.children && item.children.length > 0,
      hasRoute: !!item.route,
      isExpanded: this.isItemExpanded(item.id),
      isActive: this.isItemActive(item)
    });
    
    this.itemClick.emit(item);
    
    // Si el sidebar está colapsado y el item tiene hijos, mostrar popover
    if (this.isCollapsed() && item.children && item.children.length > 0) {
      console.log(`Mostrando popover para: ${item.label}`);
      this.currentPopoverItem = item;
      // Capturar posición precisa al momento del clic
      this.captureElementPosition(item);
      this.togglePopover(item);
      return;
    }
    
    // Si el sidebar no está colapsado, manejar expansión/navegación
    if (item.children && item.children.length > 0) {
      // Si tiene hijos, expandir/contraer SIEMPRE
      console.log(`Toggling expansión para: ${item.label}`);
      this.toggleItemExpansion(item.id);
    } else if (item.route) {
      // Si tiene ruta, navegar
      console.log(`Navegando a: ${item.route}`);
      this.navigateToRoute(item.route);
      this.closePopover(); // Cerrar popover si está abierto
    } else {
      console.log(`Item sin ruta: ${item.label}`);
      this.closePopover(); // Cerrar popover si está abierto
    }
  }

  private captureElementPosition(item: SidebarItem): void {
    setTimeout(() => {
      // Buscar el elemento específico por su posición en la lista
      const itemIndex = this.items().findIndex(i => i.id === item.id);
      const navItems = document.querySelectorAll('.sidebar__nav-item');
      
      if (itemIndex >= 0 && navItems[itemIndex]) {
        const navItem = navItems[itemIndex];
        const button = navItem.querySelector('.sidebar__nav-link');
        
        if (button) {
          const rect = button.getBoundingClientRect();
          this.elementPositions.set(item.id, rect);
          console.log(`Posición capturada para ${item.label}:`, {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            height: rect.height
          });
        }
      }
    }, 10); // Pequeño delay para asegurar que el DOM esté actualizado
  }

  toggleItemExpansion(itemId: string): void {
    const expanded = this.expandedItems();
    const newExpanded = new Set(expanded);
    
    const wasExpanded = newExpanded.has(itemId);
    if (wasExpanded) {
      newExpanded.delete(itemId);
      console.log(`Colapsando item: ${itemId}`);
    } else {
      newExpanded.add(itemId);
      console.log(`Expandiendo item: ${itemId}`);
    }
    
    console.log(`Estado expansión antes:`, Array.from(expanded));
    console.log(`Estado expansión después:`, Array.from(newExpanded));
    this.expandedItems.set(newExpanded);
  }

  isItemExpanded(itemId: string): boolean {
    return this.expandedItems().has(itemId);
  }

  togglePopover(item: SidebarItem): void {
    const currentPopover = this.popoverItem();
    if (currentPopover && currentPopover.id === item.id) {
      // Si el mismo item está abierto, cerrarlo
      this.closePopover();
    } else {
      // Abrir popover para este item
      this.popoverItem.set(item);
    }
  }

  closePopover(): void {
    this.popoverItem.set(null);
    this.currentPopoverItem = null;
    // Limpiar posiciones capturadas después de un tiempo para evitar acumulación
    setTimeout(() => {
      this.elementPositions.clear();
    }, 1000);
  }

  handlePopoverKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closePopover();
    }
  }

  onPopoverItemClick(item: SidebarItem, event?: Event): void {
    console.log(`Click en subelemento: ${item.label}`);
    
    // Prevenir propagación del evento
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    
    // Cerrar el popover inmediatamente
    this.closePopover();
    
    // Ejecutar la lógica del item con un pequeño delay para asegurar que el popover se cierre
    setTimeout(() => {
      this.itemClick.emit(item);
      
      if (item.route) {
        console.log(`Navegando a: ${item.route}`);
        this.navigateToRoute(item.route);
      } else {
        console.log(`Item sin ruta: ${item.label}`);
      }
    }, 10);
  }

  private navigateToRoute(route: string): void {
    // Parsear la ruta para separar path y query parameters
    const [path, queryString] = route.split('?');
    
    if (queryString) {
      // Parsear query parameters
      const queryParams: { [key: string]: string } = {};
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          queryParams[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
      
      console.log('Navegando con queryParams:', { path, queryParams });
      this.router.navigate([path], { queryParams });
    } else {
      console.log('Navegando sin queryParams:', path);
      this.router.navigate([path]);
    }
  }

  isPopoverOpen(item: SidebarItem): boolean {
    const currentPopover = this.popoverItem();
    return currentPopover !== null && currentPopover.id === item.id;
  }

  onToggleSidebar(): void {
    const newCollapsedState = !this.isCollapsed();
    this.isCollapsed.set(newCollapsedState);
    this.toggleSidebar.emit(newCollapsedState);
  }

  isItemActive(item: SidebarItem): boolean {
    // Verificar si el item actual está activo
    if (item.route && this.router.url === item.route) {
      return true;
    }
    
    if (item.isActive) {
      return true;
    }
    
    // Si tiene hijos, verificar si alguno de sus hijos está activo
    if (item.children && item.children.length > 0) {
      return item.children.some(child => this.isItemActive(child));
    }
    
    return false;
  }

  getItemAriaLabel(item: SidebarItem): string {
    let label = item.label;
    
    if (item.badge) {
      label += ` (${item.badge.text})`;
    }
    
    if (item.children && item.children.length > 0) {
      const expandedState = this.isItemExpanded(item.id) ? 'expandido' : 'contraído';
      label += ` - Submenu ${expandedState}`;
    }
    
    if (this.isItemActive(item)) {
      label += ' - Página actual';
    }
    
    return label;
  }

  getPopoverPosition(item: SidebarItem): { top: number } {
    try {
      // Intentar usar la posición capturada del elemento
      const capturedRect = this.elementPositions.get(item.id);
      if (capturedRect) {
        const position = capturedRect.top; // Alinear con el top del elemento
        console.log(`Usando posición capturada para ${item.label}:`, position);
        return { top: position };
      }
      
      // Fallback: buscar el elemento en tiempo real
      const itemElements = document.querySelectorAll('.sidebar__nav-item');
      const itemIndex = this.items().findIndex(i => i.id === item.id);
      
      if (itemIndex >= 0 && itemElements[itemIndex]) {
        const button = itemElements[itemIndex].querySelector('.sidebar__nav-link');
        if (button) {
          const rect = button.getBoundingClientRect();
          const position = rect.top; // Alinear con el top del elemento
          console.log(`Posición calculada en tiempo real para ${item.label}:`, position);
          return { top: position };
        }
      }
      
      // Último fallback: cálculo matemático
      const headerHeight = 88; // Header + padding
      const itemHeight = 52;   // Altura estimada por item
      const calculatedTop = headerHeight + (itemIndex * itemHeight);
      
      console.log(`Usando cálculo matemático para ${item.label}:`, calculatedTop);
      return { top: calculatedTop };
      
    } catch (error) {
      console.error('Error calculating popover position:', error);
      return { top: 120 };
    }
  }
}
