import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Visitor, Chat, ChatTab } from '@guiders-frontend/shared/types';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export type WidgetState = 'closed' | 'open' | 'minimized';

export interface ChatWidgetData {
  visitor: Visitor | null;
  chatId: string | null;
  state: WidgetState;
  tabs: ChatTab[];
  activeTabIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatWidgetService {
  private readonly router = inject(Router);

  // Estado del widget
  private readonly widgetDataSubject = new BehaviorSubject<ChatWidgetData>({
    visitor: null,
    chatId: null,
    state: 'closed',
    tabs: [],
    activeTabIndex: 0
  });

  // Observables públicos
  readonly widgetData$ = this.widgetDataSubject.asObservable();
  
  // Observable para saber si el widget debe estar visible según la ruta
  private readonly shouldShowSubject = new BehaviorSubject<boolean>(true);
  readonly shouldShow$ = this.shouldShowSubject.asObservable();

  constructor() {
    // Suscribirse a cambios de ruta para ocultar el widget en /inbox
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = (event as NavigationEnd).url;
        // Ocultar el widget si estamos en /inbox o /bandeja-de-entrada
        const shouldShow = !url.includes('/inbox') && !url.includes('/bandeja-de-entrada');
        this.shouldShowSubject.next(shouldShow);
        
        // Si navegamos a inbox, cerrar el widget
        if (!shouldShow && this.widgetDataSubject.value.state !== 'closed') {
          this.closeWidget();
        }
      });
  }

  /**
   * Obtener el estado actual del widget
   */
  getWidgetData(): ChatWidgetData {
    return this.widgetDataSubject.value;
  }

  /**
   * Abrir el widget con un nuevo chat para un visitante (sin pestañas)
   */
  openWidget(visitor: Visitor, chatId?: string): void {
    console.log('[ChatWidgetService] Abriendo widget para visitante:', visitor.id, 'chatId:', chatId);

    this.widgetDataSubject.next({
      visitor,
      chatId: chatId || null,
      state: 'open',
      tabs: [],
      activeTabIndex: 0
    });
  }

  /**
   * Abrir el widget con un chat existente (sin pestañas - modo simple)
   */
  openWithChat(chatId: string, visitor: Visitor): void {
    console.log('[ChatWidgetService] Abriendo widget con chat:', chatId);

    this.widgetDataSubject.next({
      visitor,
      chatId,
      state: 'open',
      tabs: [],
      activeTabIndex: 0
    });
  }

  /**
   * Minimizar el widget (mantiene el estado pero reduce la UI)
   */
  minimizeWidget(): void {
    const current = this.widgetDataSubject.value;
    if (current.state !== 'closed') {
      this.widgetDataSubject.next({
        ...current,
        state: 'minimized'
      });
    }
  }

  /**
   * Restaurar el widget desde minimizado
   */
  restoreWidget(): void {
    const current = this.widgetDataSubject.value;
    if (current.state === 'minimized') {
      this.widgetDataSubject.next({
        ...current,
        state: 'open'
      });
    }
  }

  /**
   * Cerrar el widget completamente (limpia el estado)
   */
  closeWidget(): void {
    console.log('[ChatWidgetService] Cerrando widget');

    this.widgetDataSubject.next({
      visitor: null,
      chatId: null,
      state: 'closed',
      tabs: [],
      activeTabIndex: 0
    });
  }

  /**
   * Alternar entre open y minimized
   */
  toggleMinimize(): void {
    const current = this.widgetDataSubject.value;
    if (current.state === 'open') {
      this.minimizeWidget();
    } else if (current.state === 'minimized') {
      this.restoreWidget();
    }
  }

  /**
   * Actualizar el chatId después de crear un chat
   */
  updateChatId(chatId: string): void {
    const current = this.widgetDataSubject.value;
    if (current.state !== 'closed') {
      this.widgetDataSubject.next({
        ...current,
        chatId
      });
    }
  }

  /**
   * Verificar si el widget está abierto o minimizado
   */
  isActive(): boolean {
    const state = this.widgetDataSubject.value.state;
    return state === 'open' || state === 'minimized';
  }

  /**
   * Verificar si el widget está visible según la ruta actual
   */
  shouldShowWidget(): boolean {
    return this.shouldShowSubject.value;
  }

  /**
   * Abrir el widget con múltiples chats como pestañas
   */
  openWithTabs(chats: Chat[], visitor: Visitor, activeIndex: number = 0): void {
    console.log('[ChatWidgetService] Abriendo widget con pestañas:', chats.length, 'chats');

    const tabs: ChatTab[] = chats.map((chat, index) => ({
      chatId: chat.chatId,
      title: chat.subject || chat.name || `Chat ${index + 1}`,
      unreadCount: chat.unreadCount || 0,
      isActive: index === activeIndex,
      lastMessage: chat.lastMessage?.content,
      createdAt: chat.createdAt
    }));

    const activeChat = chats[activeIndex];

    this.widgetDataSubject.next({
      visitor,
      chatId: activeChat?.chatId || null,
      state: 'open',
      tabs,
      activeTabIndex: activeIndex
    });
  }

  /**
   * Cambiar a una pestaña específica
   */
  switchTab(chatId: string): void {
    const current = this.widgetDataSubject.value;
    const tabIndex = current.tabs.findIndex(tab => tab.chatId === chatId);

    if (tabIndex === -1) {
      console.warn('[ChatWidgetService] Tab no encontrado:', chatId);
      return;
    }

    console.log('[ChatWidgetService] Cambiando a pestaña:', chatId);

    const updatedTabs = current.tabs.map((tab, index) => ({
      ...tab,
      isActive: index === tabIndex
    }));

    this.widgetDataSubject.next({
      ...current,
      chatId,
      tabs: updatedTabs,
      activeTabIndex: tabIndex
    });
  }

  /**
   * Cerrar una pestaña específica
   * Si es la última pestaña, cierra el widget
   */
  closeTab(chatId: string): void {
    const current = this.widgetDataSubject.value;
    const tabIndex = current.tabs.findIndex(tab => tab.chatId === chatId);

    if (tabIndex === -1) {
      console.warn('[ChatWidgetService] Tab no encontrado para cerrar:', chatId);
      return;
    }

    console.log('[ChatWidgetService] Cerrando pestaña:', chatId);

    const newTabs = current.tabs.filter(tab => tab.chatId !== chatId);

    // Si no quedan pestañas, cerrar el widget
    if (newTabs.length === 0) {
      this.closeWidget();
      return;
    }

    // Determinar la nueva pestaña activa
    let newActiveIndex = current.activeTabIndex;
    const wasActive = current.tabs[tabIndex].isActive;

    if (wasActive) {
      // Si la pestaña cerrada era la activa, activar la siguiente o la anterior
      newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
    } else if (tabIndex < current.activeTabIndex) {
      // Si la pestaña cerrada estaba antes de la activa, ajustar el índice
      newActiveIndex = current.activeTabIndex - 1;
    }

    // Actualizar isActive en las pestañas
    const updatedTabs = newTabs.map((tab, index) => ({
      ...tab,
      isActive: index === newActiveIndex
    }));

    this.widgetDataSubject.next({
      ...current,
      chatId: updatedTabs[newActiveIndex]?.chatId || null,
      tabs: updatedTabs,
      activeTabIndex: newActiveIndex
    });
  }

  /**
   * Actualizar el contador de no leídos de una pestaña
   */
  updateTabUnreadCount(chatId: string, count: number): void {
    const current = this.widgetDataSubject.value;
    const tabIndex = current.tabs.findIndex(tab => tab.chatId === chatId);

    if (tabIndex === -1) return;

    const updatedTabs = current.tabs.map(tab =>
      tab.chatId === chatId ? { ...tab, unreadCount: count } : tab
    );

    this.widgetDataSubject.next({
      ...current,
      tabs: updatedTabs
    });
  }

  /**
   * Obtener las pestañas actuales
   */
  getTabs(): ChatTab[] {
    return this.widgetDataSubject.value.tabs;
  }

  /**
   * Verificar si hay múltiples pestañas
   */
  hasMultipleTabs(): boolean {
    return this.widgetDataSubject.value.tabs.length > 1;
  }
}
