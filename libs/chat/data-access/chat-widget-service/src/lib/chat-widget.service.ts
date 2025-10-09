import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Visitor } from '@guiders-frontend/shared/types';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export type WidgetState = 'closed' | 'open' | 'minimized';

export interface ChatWidgetData {
  visitor: Visitor | null;
  chatId: string | null;
  state: WidgetState;
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
    state: 'closed'
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
   * Abrir el widget con un nuevo chat para un visitante
   */
  openWidget(visitor: Visitor, chatId?: string): void {
    console.log('[ChatWidgetService] Abriendo widget para visitante:', visitor.id, 'chatId:', chatId);
    
    this.widgetDataSubject.next({
      visitor,
      chatId: chatId || null,
      state: 'open'
    });
  }

  /**
   * Abrir el widget con un chat existente
   */
  openWithChat(chatId: string, visitor: Visitor): void {
    console.log('[ChatWidgetService] Abriendo widget con chat:', chatId);
    
    this.widgetDataSubject.next({
      visitor,
      chatId,
      state: 'open'
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
      state: 'closed'
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
}
