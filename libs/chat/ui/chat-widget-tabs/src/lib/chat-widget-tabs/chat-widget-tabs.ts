import { Component, input, output, computed, signal } from '@angular/core';
import { ChatTab } from '@guiders-frontend/shared/types';

@Component({
  selector: 'guiders-chat-widget-tabs',
  imports: [],
  templateUrl: './chat-widget-tabs.html',
  styleUrl: './chat-widget-tabs.scss',
})
export class ChatWidgetTabs {
  /** Lista de pestañas */
  tabs = input.required<ChatTab[]>();

  /** Máximo de pestañas visibles antes de mostrar overflow */
  maxVisibleTabs = input<number>(5);

  /** Emite cuando se selecciona una pestaña */
  tabSelect = output<string>();

  /** Emite cuando se cierra una pestaña */
  tabClose = output<string>();

  /** Emite cuando se cierra todo el widget */
  widgetClose = output<void>();

  /** Estado del dropdown de overflow */
  overflowOpen = signal<boolean>(false);

  /** Pestañas visibles (máximo según maxVisibleTabs) */
  visibleTabs = computed(() => {
    const allTabs = this.tabs();
    const max = this.maxVisibleTabs();
    return allTabs.slice(0, max);
  });

  /** Pestañas en overflow */
  overflowTabs = computed(() => {
    const allTabs = this.tabs();
    const max = this.maxVisibleTabs();
    return allTabs.slice(max);
  });

  /** Cantidad de pestañas en overflow */
  overflowCount = computed(() => this.overflowTabs().length);

  /** Indica si hay pestañas en overflow */
  hasOverflow = computed(() => this.overflowCount() > 0);

  /** Total de mensajes no leídos en overflow */
  overflowUnreadCount = computed(() => {
    return this.overflowTabs().reduce((sum, tab) => sum + tab.unreadCount, 0);
  });

  onTabClick(chatId: string): void {
    this.tabSelect.emit(chatId);
    this.overflowOpen.set(false);
  }

  onTabClose(event: MouseEvent, chatId: string): void {
    event.stopPropagation();
    this.tabClose.emit(chatId);
  }

  onWidgetClose(): void {
    this.widgetClose.emit();
  }

  toggleOverflow(): void {
    this.overflowOpen.update(v => !v);
  }

  closeOverflow(): void {
    this.overflowOpen.set(false);
  }

  /** Trunca el título si es muy largo */
  truncateTitle(title: string, maxLength: number = 12): string {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  }

  /** Obtiene el título de la pestaña con contador de no leídos si aplica */
  getTabDisplayTitle(tab: ChatTab): string {
    if (tab.unreadCount > 0) {
      const count = tab.unreadCount > 99 ? '99+' : tab.unreadCount.toString();
      return `(${count}) ${tab.title}`;
    }
    return tab.title;
  }
}
