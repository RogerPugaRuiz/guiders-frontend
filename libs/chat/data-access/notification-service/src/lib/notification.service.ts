import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Message, Chat } from '@guiders-frontend/shared/types';

export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
}

export interface BrowserNotificationData {
  chatId: string;
  messageId: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly STORAGE_KEY = 'notification-preferences';
  private readonly DEFAULT_ICON = '/assets/icons/icon-192x192.png';

  // Estado de permisos
  private readonly permissionSubject = new BehaviorSubject<NotificationPermission>(
    this.getInitialPermission()
  );
  readonly permission$ = this.permissionSubject.asObservable();

  // Preferencias del usuario
  private readonly preferencesSubject = new BehaviorSubject<NotificationPreferences>(
    this.loadPreferences()
  );
  readonly preferences$ = this.preferencesSubject.asObservable();

  // Callback para cuando se hace clic en una notificación
  private onNotificationClick: ((chatId: string) => void) | null = null;

  // Track de notificaciones mostradas para evitar duplicados
  private shownNotifications = new Set<string>();

  constructor() {
    // Limpiar notificaciones antiguas periódicamente
    setInterval(() => this.cleanOldNotifications(), 60000);
  }

  /**
   * Obtener permiso inicial
   */
  private getInitialPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Cargar preferencias del localStorage
   */
  private loadPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[NotificationService] Error loading preferences:', error);
    }
    return {
      enabled: true,
      soundEnabled: true
    };
  }

  /**
   * Guardar preferencias
   */
  savePreferences(preferences: NotificationPreferences): void {
    this.preferencesSubject.next(preferences);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
  }

  /**
   * Obtener preferencias actuales
   */
  getPreferences(): NotificationPreferences {
    return this.preferencesSubject.value;
  }

  /**
   * Verificar si las notificaciones están soportadas
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Verificar si las notificaciones están habilitadas (permiso + preferencias)
   */
  isEnabled(): boolean {
    return (
      this.isSupported() &&
      this.permissionSubject.value === 'granted' &&
      this.preferencesSubject.value.enabled
    );
  }

  /**
   * Solicitar permiso de notificaciones
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('[NotificationService] Notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionSubject.next(permission);
      console.log('[NotificationService] Permission:', permission);
      return permission;
    } catch (error) {
      console.error('[NotificationService] Error requesting permission:', error);
      return 'denied';
    }
  }

  /**
   * Verificar si la pestaña está oculta
   */
  isTabHidden(): boolean {
    return document.hidden || document.visibilityState === 'hidden';
  }

  /**
   * Registrar callback para cuando se hace clic en una notificación
   */
  setOnNotificationClick(callback: (chatId: string) => void): void {
    this.onNotificationClick = callback;
  }

  /**
   * Mostrar notificación para un mensaje nuevo
   */
  showMessageNotification(
    message: Message,
    chat: Chat,
    activeChatId: string | null
  ): void {
    // Verificar si las notificaciones están habilitadas
    if (!this.isEnabled()) {
      return;
    }

    // No mostrar si la pestaña está activa
    if (!this.isTabHidden()) {
      return;
    }

    // No mostrar si el chat activo es el que recibe el mensaje
    if (activeChatId === message.chatId) {
      return;
    }

    // Evitar notificaciones duplicadas
    const notificationKey = `${message.chatId}-${message.messageId}`;
    if (this.shownNotifications.has(notificationKey)) {
      return;
    }
    this.shownNotifications.add(notificationKey);

    // Obtener nombre del remitente
    const senderName = this.getSenderName(message, chat);

    // Crear preview del mensaje
    const messagePreview = this.getMessagePreview(message);

    // Mostrar la notificación
    this.showNotification(
      senderName,
      messagePreview,
      {
        chatId: message.chatId,
        messageId: message.messageId
      }
    );
  }

  /**
   * Mostrar notificación del navegador
   */
  private showNotification(
    title: string,
    body: string,
    data: BrowserNotificationData
  ): void {
    try {
      const notification = new Notification(title, {
        body,
        icon: this.DEFAULT_ICON,
        badge: this.DEFAULT_ICON,
        tag: `chat-${data.chatId}`, // Agrupa notificaciones del mismo chat
        requireInteraction: false
      });

      // Manejar clic en la notificación
      notification.onclick = (event) => {
        event.preventDefault();

        // Enfocar la ventana/pestaña
        window.focus();

        // Llamar al callback para abrir el chat
        if (this.onNotificationClick) {
          this.onNotificationClick(data.chatId);
        }

        // Cerrar la notificación
        notification.close();
      };

      // Cerrar automáticamente después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log('[NotificationService] Notification shown:', title);
    } catch (error) {
      console.error('[NotificationService] Error showing notification:', error);
    }
  }

  /**
   * Obtener nombre del remitente
   */
  private getSenderName(message: Message, chat: Chat): string {
    // Buscar el participante que envió el mensaje
    const sender = chat.participants.find(p => p.id === message.senderId);

    if (sender) {
      return sender.name || sender.email || 'Visitante';
    }

    // Si el mensaje es de tipo VISITOR, usar el nombre del chat
    if (message.senderType === 'VISITOR') {
      return chat.name || 'Visitante';
    }

    return 'Nuevo mensaje';
  }

  /**
   * Obtener preview del mensaje
   */
  private getMessagePreview(message: Message): string {
    const maxLength = 100;

    switch (message.type) {
      case 'TEXT':
        if (message.content.length > maxLength) {
          return message.content.substring(0, maxLength) + '...';
        }
        return message.content;

      case 'IMAGE':
        return 'Imagen';

      case 'FILE':
        return `Archivo: ${message.metadata?.fileName || 'archivo'}`;

      case 'AUDIO':
        return 'Mensaje de voz';

      case 'VIDEO':
        return 'Video';

      case 'SYSTEM':
        return message.content;

      default:
        return 'Nuevo mensaje';
    }
  }

  /**
   * Limpiar notificaciones antiguas del tracking
   */
  private cleanOldNotifications(): void {
    // Mantener máximo 100 notificaciones en memoria
    if (this.shownNotifications.size > 100) {
      const entries = Array.from(this.shownNotifications);
      const toRemove = entries.slice(0, entries.length - 50);
      toRemove.forEach(key => this.shownNotifications.delete(key));
    }
  }

  /**
   * Habilitar/deshabilitar notificaciones
   */
  setEnabled(enabled: boolean): void {
    const current = this.getPreferences();
    this.savePreferences({ ...current, enabled });
  }

  /**
   * Habilitar/deshabilitar sonido
   */
  setSoundEnabled(enabled: boolean): void {
    const current = this.getPreferences();
    this.savePreferences({ ...current, soundEnabled: enabled });
  }
}
