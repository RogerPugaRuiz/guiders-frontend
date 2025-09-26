import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarItem, SidebarConfig } from './sidebar.types';

@Component({
  selector: 'guiders-sidebar',
  imports: [CommonModule],
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
  readonly isCollapsed = signal<boolean>(false);
  readonly expandedItems = signal<Set<string>>(new Set());

  // Computed values
  readonly sidebarWidth = computed(() => 
    this.isCollapsed() ? this.config().collapsedWidth : this.config().width
  );

  readonly sidebarClasses = computed(() => ({
    'sidebar': true,
    'sidebar--collapsed': this.isCollapsed(),
    [`sidebar--${this.config().theme}`]: true
  }));

  // Métodos
  onItemClick(item: SidebarItem): void {
    if (item.route) {
      // Usar navigateByUrl para URLs completas con query parameters
      this.router.navigateByUrl(item.route);
    }
    
    if (item.children && item.children.length > 0) {
      this.toggleItemExpansion(item.id);
    }

    this.itemClick.emit(item);
  }

  toggleItemExpansion(itemId: string): void {
    const expanded = this.expandedItems();
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    
    this.expandedItems.set(newExpanded);
  }

  isItemExpanded(itemId: string): boolean {
    return this.expandedItems().has(itemId);
  }

  onToggleSidebar(): void {
    const newCollapsedState = !this.isCollapsed();
    this.isCollapsed.set(newCollapsedState);
    this.toggleSidebar.emit(newCollapsedState);
  }

  isItemActive(item: SidebarItem): boolean {
    if (item.route) {
      // Comparar la URL completa
      return this.router.url === item.route;
    }
    return item.isActive || false;
  }
}
