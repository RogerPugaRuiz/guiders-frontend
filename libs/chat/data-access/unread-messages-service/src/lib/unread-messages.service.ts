import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, BehaviorSubject, catchError, map, of, filter } from 'rxjs';
import {
  Message,
  UnreadCountMap,
  UnreadMessagesResponse,
  MarkAsReadResponse
} from '@guiders-frontend/shared/types';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { WebSocketService } from '@guiders-frontend/chat/data-access/websocket-service';

/**
 * UnreadMessagesService
 *
 * Servicio dedicado para gestionar el estado de mensajes no leídos en tiempo real.
 *
 * Características:
 * - Signals para estado reactivo
 * - Integración con WebSocket para actualizaciones en tiempo real
 * - API REST para obtener y marcar mensajes como leídos
 * - Notificaciones del navegador
 * - Contadores de mensajes no leídos por chat
 *
 * Basado en la arquitectura del backend:
 * - GET /v2/messages/chat/:chatId/unread
 * - PUT /v2/messages/mark-as-read
 * - WebSocket: message:new
 */
@Injectable({
  providedIn: 'root'
})
export class UnreadMessagesService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly webSocket = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly baseUrl = `${this.environment.api.baseUrl}/v2`;

  // ===== SIGNALS (ESTADO REACTIVO) =====

  /**
   * Mapa de contadores de mensajes no leídos por chatId
   * { 'chat-uuid-1': 3, 'chat-uuid-2': 0, ... }
   */
  readonly unreadCountMap = signal<UnreadCountMap>({});

  /**
   * Mapa de mensajes no leídos por chatId
   * { 'chat-uuid-1': [Message, Message], ... }
   */
  readonly unreadMessagesMap = signal<Record<string, Message[]>>({});

  /**
   * Total de mensajes no leídos en todos los chats
   */
  readonly totalUnreadCount = computed(() => {
    const counts = this.unreadCountMap();
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  });

  /**
   * Indica si hay mensajes no leídos
   */
  readonly hasUnreadMessages = computed(() => this.totalUnreadCount() > 0);

  /**
   * Estado de carga
   */
  readonly isLoading = signal<boolean>(false);

  /**
   * Error actual
   */
  readonly error = signal<string | null>(null);

  // ===== SUBJECTS (PARA COMPATIBILIDAD CON OBSERVABLES) =====
  private readonly unreadCountSubject = new BehaviorSubject<UnreadCountMap>({});
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  // ===== CONFIGURACIÓN =====
  private currentUserId: string | null = null;
  private notificationsEnabled = false;
  private soundEnabled = true; // Sonido habilitado por defecto
  private activeChatId: string | null = null; // Chat actualmente seleccionado

  // Audio para notificación (usamos un tono de notificación corto)
  private notificationSound: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private audioResumed = false;

  constructor() {
    console.log('[UnreadMessagesService] 🚀 === SERVICIO INICIALIZADO ===');
    console.log('[UnreadMessagesService] 📋 BaseUrl:', this.baseUrl);
    this.initializeWebSocketListeners();
    this.requestNotificationPermission();
    this.initializeNotificationSound();
    this.setupAudioContextResume();
  }

  // ===== CONFIGURACIÓN =====

  /**
   * Configurar usuario actual
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Establecer el chat activo (seleccionado)
   * Esto evita que se incrementen contadores y se muestren notificaciones
   * para mensajes del chat activo
   */
  setActiveChat(chatId: string | null): void {
    const previousChatId = this.activeChatId;
    this.activeChatId = chatId;

    console.log(`[UnreadMessagesService] 🔄 ===== CAMBIO DE CHAT ACTIVO =====`);
    console.log(`[UnreadMessagesService] 📋 Chat anterior: ${previousChatId || 'ninguno'}`);
    console.log(`[UnreadMessagesService] 📋 Chat nuevo: ${chatId || 'ninguno'}`);
    console.log(`[UnreadMessagesService] 📊 activeChatId ACTUALIZADO A: ${this.activeChatId}`);
    console.log(`[UnreadMessagesService] 📊 Estado actual de contadores:`, {
      ...this.unreadCountMap()
    });

    // Si se activó un chat, marcar sus mensajes no leídos como leídos automáticamente
    if (chatId) {
      console.log(`[UnreadMessagesService] ✅ Iniciando markActiveChatAsRead para: ${chatId}`);
      this.markActiveChatAsRead(chatId);
    } else {
      console.log(`[UnreadMessagesService] ⚠️ Chat desactivado (cerrado), no hay chat activo`);
    }

    console.log(`[UnreadMessagesService] 🎯 ===== FIN CAMBIO DE CHAT ACTIVO =====`);

    // Mostrar estado completo después del cambio
    this.debugState();
  }

  /**
   * Obtener el chat activo actual
   */
  getActiveChat(): string | null {
    return this.activeChatId;
  }

  /**
   * Método de debugging para ver el estado completo del servicio
   */
  debugState(): void {
    console.log('[UnreadMessagesService] 🐛 ===== ESTADO ACTUAL DEL SERVICIO =====');
    console.log('[UnreadMessagesService] 📋 activeChatId:', this.activeChatId);
    console.log('[UnreadMessagesService] 📋 currentUserId:', this.currentUserId);
    console.log('[UnreadMessagesService] 📋 notificationsEnabled:', this.notificationsEnabled);
    console.log('[UnreadMessagesService] 📊 unreadCountMap:', { ...this.unreadCountMap() });
    console.log('[UnreadMessagesService] 📨 unreadMessagesMap keys:', Object.keys(this.unreadMessagesMap()));
    console.log('[UnreadMessagesService] 📊 totalUnreadCount:', this.totalUnreadCount());
    console.log('[UnreadMessagesService] 🐛 ===== FIN ESTADO =====');
  }

  /**
   * Marcar automáticamente los mensajes del chat activo como leídos
   * Siguiendo el flujo correcto:
   * 1. Obtener mensajes no leídos del servidor (no solo locales)
   * 2. Extraer IDs
   * 3. Marcar como leídos en el servidor
   * 4. Actualizar badge a 0
   */
  private markActiveChatAsRead(chatId: string): void {
    console.log(`[UnreadMessagesService] 🔄 === INICIANDO RESETEO DE CONTADOR ===`);
    console.log(`[UnreadMessagesService] 📋 ChatId a resetear: ${chatId}`);
    console.log(`[UnreadMessagesService] 📊 Contador actual ANTES: ${this.unreadCountMap()[chatId] || 0}`);
    console.log(`[UnreadMessagesService] 📨 Mensajes locales no leídos:`, this.unreadMessagesMap()[chatId]?.length || 0);

    // ✅ RESETEAR CONTADOR INMEDIATAMENTE en la UI (feedback instantáneo)
    this.unreadCountMap.update(map => {
      const newMap = { ...map, [chatId]: 0 };
      console.log(`[UnreadMessagesService] ✅ unreadCountMap actualizado:`, newMap);
      return newMap;
    });

    // Limpiar mensajes no leídos localmente
    this.unreadMessagesMap.update(map => {
      const newMap = { ...map };
      delete newMap[chatId];
      console.log(`[UnreadMessagesService] ✅ unreadMessagesMap limpiado para chat ${chatId}`);
      return newMap;
    });

    // Actualizar subject
    this.unreadCountSubject.next(this.unreadCountMap());
    console.log(`[UnreadMessagesService] ✅ BehaviorSubject actualizado`);
    console.log(`[UnreadMessagesService] 📊 Contador actual DESPUÉS: ${this.unreadCountMap()[chatId] || 0}`);

    // ✅ OBTENER MENSAJES NO LEÍDOS DEL SERVIDOR (no solo locales)
    // Esto es crítico porque puede haber mensajes no leídos que llegaron
    // mientras el comercial estaba desconectado
    // IMPORTANTE: Usar método privado que NO actualiza el estado local
    console.log(`[UnreadMessagesService] 🌐 Consultando servidor para mensajes no leídos (sin actualizar estado)...`);
    this.getUnreadMessagesWithoutStateUpdate(chatId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (unreadMessages) => {
          console.log(`[UnreadMessagesService] 📥 Respuesta del servidor recibida`);

          if (unreadMessages.length === 0) {
            console.log(`[UnreadMessagesService] ✅ No hay mensajes sin leer en el servidor para chat ${chatId}`);
            return;
          }

          console.log(`[UnreadMessagesService] 📋 ${unreadMessages.length} mensajes no leídos encontrados en servidor:`);
          console.log(`[UnreadMessagesService] 📋 Estructura del primer mensaje:`, unreadMessages[0]);

          // IMPORTANTE: El servidor puede devolver 'id' o 'messageId'
          // Intentar ambos campos para compatibilidad
          const messageIds = unreadMessages.map(m => (m as any).id || m.messageId);

          console.log(`[UnreadMessagesService] 📋 IDs extraídos:`, messageIds);
          const validIds = messageIds.filter(id => id !== undefined && id !== null);
          console.log(`[UnreadMessagesService] 📋 IDs válidos:`, validIds.length);

          if (validIds.length === 0) {
            console.warn(`[UnreadMessagesService] ⚠️ No se pudieron extraer IDs válidos de los mensajes`);
            console.warn(`[UnreadMessagesService] ⚠️ Verificar estructura del mensaje del servidor`);
            return;
          }

          // Esperar 1 segundo antes de marcar en el servidor
          console.log(`[UnreadMessagesService] ⏱️ Esperando 1 segundo antes de marcar como leídos...`);
          setTimeout(() => {
            console.log(`[UnreadMessagesService] 🚀 Enviando solicitud para marcar ${validIds.length} mensajes como leídos`);
            this.markAsRead(validIds).subscribe({
              next: (response) => {
                if (response.success) {
                  console.log(`✅ [UnreadMessagesService] ${response.markedCount} mensajes marcados como leídos en el servidor`);
                  console.log(`[UnreadMessagesService] 🎉 === RESETEO COMPLETADO ===`);
                } else {
                  console.warn(`⚠️ [UnreadMessagesService] Respuesta del servidor: success=false`);
                }
              },
              error: (error) => {
                console.error('[UnreadMessagesService] ❌ Error al marcar mensajes como leídos:', error);
              }
            });
          }, 1000);
        },
        error: (error) => {
          console.error('[UnreadMessagesService] ❌ Error al obtener mensajes no leídos del servidor:', error);
          console.error('[UnreadMessagesService] Error details:', error);
        }
      });
  }

  // ===== MÉTODOS PRINCIPALES =====

  /**
   * Obtener mensajes no leídos SIN actualizar el estado local
   * Usado internamente por markActiveChatAsRead para evitar incrementar el contador
   */
  private getUnreadMessagesWithoutStateUpdate(chatId: string): Observable<Message[]> {
    console.log(`[UnreadMessagesService] 🌐 === LLAMANDO GET /v2/messages/chat/${chatId}/unread (SIN ACTUALIZAR ESTADO) ===`);

    const url = `${this.baseUrl}/messages/chat/${chatId}/unread`;
    console.log(`[UnreadMessagesService] 📋 URL completa:`, url);

    return this.http.get<Message[]>(
      url,
      this.getHttpOptions()
    ).pipe(
      map(messages => {
        console.log(`[UnreadMessagesService] 📥 Respuesta del servidor (sin actualizar estado):`, messages);

        // Transformar fechas de string a Date pero NO actualizar estado local
        const transformedMessages = messages.map(msg => ({
          ...msg,
          sentAt: new Date(msg.sentAt),
          readAt: msg.readAt ? new Date(msg.readAt) : null,
          editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined
        }));

        console.log(`[UnreadMessagesService] 🔄 Mensajes transformados (sin tocar estado):`, transformedMessages.length);
        return transformedMessages;
      }),
      catchError(error => {
        console.error('[UnreadMessagesService] ❌ Error al obtener mensajes no leídos:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener mensajes no leídos para un chat específico
   * GET /v2/messages/chat/:chatId/unread
   */
  getUnreadMessages(chatId: string): Observable<Message[]> {
    console.log(`[UnreadMessagesService] 🌐 === LLAMANDO GET /v2/messages/chat/${chatId}/unread ===`);
    this.isLoading.set(true);
    this.error.set(null);

    const url = `${this.baseUrl}/messages/chat/${chatId}/unread`;
    console.log(`[UnreadMessagesService] 📋 URL completa:`, url);

    return this.http.get<Message[]>(
      url,
      this.getHttpOptions()
    ).pipe(
      map(messages => {
        console.log(`[UnreadMessagesService] 📥 Respuesta del servidor:`, messages);
        console.log(`[UnreadMessagesService] 📊 Total de mensajes no leídos:`, messages.length);

        // Transformar fechas de string a Date
        const transformedMessages = messages.map(msg => ({
          ...msg,
          sentAt: new Date(msg.sentAt),
          readAt: msg.readAt ? new Date(msg.readAt) : null,
          editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined
        }));

        console.log(`[UnreadMessagesService] 🔄 Mensajes transformados:`, transformedMessages.length);

        // Actualizar estado local
        this.updateUnreadMessagesForChat(chatId, transformedMessages);
        this.isLoading.set(false);

        console.log(`[UnreadMessagesService] ✅ getUnreadMessages completado`);
        return transformedMessages;
      }),
      catchError(error => {
        console.error('[UnreadMessagesService] ❌ Error al obtener mensajes no leídos:', error);
        console.error('[UnreadMessagesService] ❌ Status:', error.status);
        console.error('[UnreadMessagesService] ❌ Message:', error.message);
        console.error('[UnreadMessagesService] ❌ Full error:', error);
        this.error.set('Error al cargar mensajes no leídos');
        this.isLoading.set(false);
        return of([]);
      })
    );
  }

  /**
   * Marcar mensajes como leídos
   * PUT /v2/messages/mark-as-read
   */
  markAsRead(messageIds: string[]): Observable<MarkAsReadResponse> {
    if (messageIds.length === 0) {
      return of({ success: true, markedCount: 0 });
    }

    return this.http.put<MarkAsReadResponse>(
      `${this.baseUrl}/messages/mark-as-read`,
      { messageIds },
      this.getHttpOptions()
    ).pipe(
      map(response => {
        console.log(`[UnreadMessagesService] ${response.markedCount} mensajes marcados como leídos`);

        // Actualizar estado local: remover mensajes marcados
        this.removeMarkedMessages(messageIds);

        return response;
      }),
      catchError(error => {
        console.error('[UnreadMessagesService] Error al marcar mensajes como leídos:', error);
        this.error.set('Error al marcar mensajes como leídos');
        return of({ success: false, markedCount: 0 });
      })
    );
  }

  /**
   * Refrescar contadores de mensajes no leídos para todos los chats
   * IMPORTANTE: NO refresca el contador del chat activo para evitar conflictos
   */
  refreshUnreadCounts(chatIds: string[]): void {
    console.log('[UnreadMessagesService] 🔄 Refrescando contadores para', chatIds.length, 'chats');
    console.log('[UnreadMessagesService] 📋 Chat activo actual:', this.activeChatId);

    chatIds.forEach(chatId => {
      // ✅ IMPORTANTE: NO refrescar el contador del chat activo
      // porque ya se está reseteando automáticamente con markActiveChatAsRead()
      if (chatId === this.activeChatId) {
        console.log(`[UnreadMessagesService] ⏭️ Saltando refresh para chat activo: ${chatId}`);
        return;
      }

      console.log(`[UnreadMessagesService] 🔄 Refrescando contador para chat: ${chatId}`);
      this.getUnreadMessages(chatId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    });
  }

  /**
   * Obtener contador de mensajes no leídos para un chat específico
   */
  getUnreadCount(chatId: string): number {
    return this.unreadCountMap()[chatId] || 0;
  }

  /**
   * Obtener mensajes no leídos locales para un chat
   */
  getUnreadMessagesLocal(chatId: string): Message[] {
    return this.unreadMessagesMap()[chatId] || [];
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Inicializar listeners de WebSocket
   */
  private initializeWebSocketListeners(): void {
    console.log('[UnreadMessagesService] 🎧 Inicializando listeners de WebSocket');

    // Escuchar mensajes nuevos del WebSocket
    this.webSocket.messageReceived$
      .pipe(
        filter((message): message is Message => message !== null),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(message => {
        console.log('[UnreadMessagesService] 📨 === NUEVO MENSAJE RECIBIDO POR WEBSOCKET ===');
        console.log('[UnreadMessagesService] 📋 MessageId:', message.messageId);
        console.log('[UnreadMessagesService] 📋 ChatId:', message.chatId);
        console.log('[UnreadMessagesService] 📋 SenderId:', message.senderId);
        console.log('[UnreadMessagesService] 📋 Content:', message.content.substring(0, 50) + '...');

        // Solo procesar si no es mensaje propio
        if (message.senderId === this.currentUserId) {
          console.log('[UnreadMessagesService] ⏭️ Mensaje propio ignorado (senderId === currentUserId)');
          console.log('[UnreadMessagesService] 📋 CurrentUserId:', this.currentUserId);
          return;
        }

        console.log('[UnreadMessagesService] ✅ Mensaje de otro usuario, procesando...');

        // ✅ VERIFICAR SI ES DEL CHAT ACTIVO
        const isFromActiveChat = message.chatId === this.activeChatId;
        console.log('[UnreadMessagesService] 🔍 ===== VERIFICACIÓN DE CHAT ACTIVO =====');
        console.log('[UnreadMessagesService] 📋 message.chatId:', message.chatId);
        console.log('[UnreadMessagesService] 📋 this.activeChatId:', this.activeChatId);
        console.log('[UnreadMessagesService] 📋 Son iguales?:', message.chatId === this.activeChatId);
        console.log('[UnreadMessagesService] 📋 isFromActiveChat:', isFromActiveChat);
        console.log('[UnreadMessagesService] 🔍 ===== FIN VERIFICACIÓN =====');

        if (isFromActiveChat) {
          console.log('[UnreadMessagesService] ✅ Mensaje del chat activo - NO incrementar contador ni notificar');

          // Marcar como leído inmediatamente (chat activo visible)
          console.log('[UnreadMessagesService] ⏱️ Esperando 1 segundo para marcar como leído...');
          setTimeout(() => {
            console.log('[UnreadMessagesService] 🚀 Marcando mensaje del chat activo como leído');

            // IMPORTANTE: Usar el mismo fallback que en markActiveChatAsRead
            const messageId = (message as any).id || message.messageId;
            console.log('[UnreadMessagesService] 📋 MessageId extraído:', messageId);

            if (!messageId) {
              console.error('[UnreadMessagesService] ❌ No se pudo extraer messageId del mensaje del chat activo');
              console.error('[UnreadMessagesService] ❌ Estructura del mensaje:', message);
              return;
            }

            this.markAsRead([messageId]).subscribe({
              next: (response) => {
                if (response.success) {
                  console.log(`✅ Mensaje del chat activo marcado como leído automáticamente`);
                }
              },
              error: (error) => {
                console.error('[UnreadMessagesService] ❌ Error al marcar mensaje del chat activo:', error);
              }
            });
          }, 1000);

          return; // NO incrementar contador ni mostrar notificación
        }

        // Solo si NO es del chat activo:
        console.log('[UnreadMessagesService] ⚠️ Mensaje de chat INACTIVO - Incrementando contador');

        // 1. Incrementar contador
        const currentCount = this.unreadCountMap()[message.chatId] || 0;
        console.log('[UnreadMessagesService] 📊 Contador ANTES:', currentCount);
        this.incrementUnreadCount(message.chatId);
        console.log('[UnreadMessagesService] 📊 Contador DESPUÉS:', this.unreadCountMap()[message.chatId]);

        // 2. Agregar a lista de mensajes no leídos
        this.addUnreadMessage(message);
        console.log('[UnreadMessagesService] 📨 Mensaje agregado a lista de no leídos');

        // 3. Mostrar notificación del navegador si está habilitado
        // IMPORTANTE: Mostrar notificación incluso si la app está activa,
        // porque el usuario está mirando OTRO chat (no el que recibió el mensaje)
        if (this.notificationsEnabled) {
          console.log('[UnreadMessagesService] 🔔 Mostrando notificación del navegador para chat inactivo');
          this.showBrowserNotification(message);
        } else {
          console.log('[UnreadMessagesService] 🔕 No mostrar notificación (notificationsEnabled:', this.notificationsEnabled, ')');
        }

        console.log(`[UnreadMessagesService] 📊 === PROCESAMIENTO COMPLETADO ===`);
      });
  }

  /**
   * Actualizar mensajes no leídos para un chat
   */
  private updateUnreadMessagesForChat(chatId: string, messages: Message[]): void {
    this.unreadMessagesMap.update(map => ({
      ...map,
      [chatId]: messages
    }));

    this.unreadCountMap.update(map => ({
      ...map,
      [chatId]: messages.length
    }));

    this.unreadCountSubject.next(this.unreadCountMap());
  }

  /**
   * Incrementar contador de mensajes no leídos para un chat
   */
  private incrementUnreadCount(chatId: string): void {
    console.log(`[UnreadMessagesService] ➕ Incrementando contador para chat ${chatId}`);
    const currentCount = this.unreadCountMap()[chatId] || 0;

    this.unreadCountMap.update(map => {
      const newMap = {
        ...map,
        [chatId]: currentCount + 1
      };
      console.log(`[UnreadMessagesService] 📊 Contador actualizado: ${currentCount} -> ${newMap[chatId]}`);
      console.log(`[UnreadMessagesService] 📊 Mapa completo de contadores:`, newMap);
      return newMap;
    });

    this.unreadCountSubject.next(this.unreadCountMap());
    console.log(`[UnreadMessagesService] ✅ BehaviorSubject notificado con nuevos contadores`);
  }

  /**
   * Agregar mensaje no leído a la lista
   */
  private addUnreadMessage(message: Message): void {
    this.unreadMessagesMap.update(map => {
      const currentMessages = map[message.chatId] || [];
      // Verificar que no exista duplicado
      const exists = currentMessages.some(m => m.messageId === message.messageId);
      if (exists) {
        return map;
      }

      return {
        ...map,
        [message.chatId]: [...currentMessages, message]
      };
    });
  }

  /**
   * Remover mensajes marcados como leídos del estado local
   */
  private removeMarkedMessages(messageIds: string[]): void {
    // Actualizar mensajes no leídos
    this.unreadMessagesMap.update(map => {
      const newMap: Record<string, Message[]> = {};

      Object.entries(map).forEach(([chatId, messages]) => {
        // Filtrar mensajes que no están en la lista de marcados
        const filteredMessages = messages.filter(
          msg => !messageIds.includes(msg.messageId)
        );

        if (filteredMessages.length > 0) {
          newMap[chatId] = filteredMessages;
        }
      });

      return newMap;
    });

    // Actualizar contadores
    this.unreadCountMap.update(map => {
      const newMap: UnreadCountMap = {};
      const messagesMap = this.unreadMessagesMap();

      Object.keys(map).forEach(chatId => {
        const count = messagesMap[chatId]?.length || 0;
        if (count > 0) {
          newMap[chatId] = count;
        }
      });

      return newMap;
    });

    this.unreadCountSubject.next(this.unreadCountMap());
  }

  /**
   * Configuración de headers HTTP
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // El token se maneja automáticamente por las cookies con withCredentials
    const token = localStorage.getItem('access-token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Opciones HTTP con credenciales
   */
  private getHttpOptions(): { headers: HttpHeaders; withCredentials: boolean } {
    return {
      headers: this.getHeaders(),
      withCredentials: true
    };
  }

  // ===== NOTIFICACIONES DEL NAVEGADOR =====

  /**
   * Inicializar sonido de notificación
   * Usamos la API Web Audio para generar un tono corto
   */
  private initializeNotificationSound(): void {
    try {
      // Crear sonido usando data URL (tono de notificación simple)
      // Este es un tono corto y agradable generado sintéticamente
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar el tono (800Hz, suena como una notificación)
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      // Crear envelope para que suene más natural
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);  // Sustain
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2);    // Release

      console.log('[UnreadMessagesService] 🔔 Sonido de notificación inicializado');
    } catch (error) {
      console.warn('[UnreadMessagesService] No se pudo inicializar el sonido de notificación:', error);
    }
  }

  /**
   * Reproducir sonido de notificación
   */
  private playNotificationSound(): void {
    if (!this.soundEnabled) {
      console.log('[UnreadMessagesService] 🔇 Sonido deshabilitado');
      return;
    }

    try {
      // Crear un nuevo contexto de audio para cada notificación
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Tono de notificación (dos beeps cortos)
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      const now = audioContext.currentTime;

      // Primer beep
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.1);

      // Segundo beep
      gainNode.gain.setValueAtTime(0, now + 0.15);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.16);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.25);

      oscillator.start(now);
      oscillator.stop(now + 0.3);

      console.log('[UnreadMessagesService] 🔊 Reproduciendo sonido de notificación');
    } catch (error) {
      console.error('[UnreadMessagesService] Error al reproducir sonido:', error);
    }
  }

  /**
   * Solicitar permiso para notificaciones del navegador
   */
  private requestNotificationPermission(): void {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          this.notificationsEnabled = permission === 'granted';
          console.log('[UnreadMessagesService] Permiso de notificaciones:', permission);
        });
      } else {
        this.notificationsEnabled = Notification.permission === 'granted';
        console.log('[UnreadMessagesService] Estado de notificaciones:', this.notificationsEnabled ? 'habilitadas' : 'deshabilitadas');
      }
    }
  }

  /**
   * Mostrar notificación del navegador
   */
  private showBrowserNotification(message: Message): void {
    if (!this.notificationsEnabled || !('Notification' in window)) {
      console.log('[UnreadMessagesService] Notificaciones del navegador deshabilitadas');
      return;
    }

    // Reproducir sonido de notificación
    this.playNotificationSound();

    // Preparar título de la notificación
    const title = '💬 Nuevo mensaje de chat';

    // Preparar contenido
    const body = message.content.length > 100
      ? `${message.content.substring(0, 100)}...`
      : message.content;

    console.log('[UnreadMessagesService] 🔔 Mostrando notificación del navegador:', {
      title,
      body,
      chatId: message.chatId
    });

    try {
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico', // Usar favicon como icono por defecto
        badge: '/favicon.ico',
        tag: message.chatId, // Agrupa notificaciones del mismo chat
        requireInteraction: false, // No requiere interacción del usuario
        silent: false, // Permitir que el navegador reproduzca su sonido también
      });

      // Navegar al chat al hacer click
      notification.onclick = () => {
        window.focus();
        // TODO: Implementar navegación al chat
        // this.router.navigate(['/inbox'], { queryParams: { chat: message.chatId } });
        notification.close();
      };

      // Auto-cerrar después de 6 segundos
      setTimeout(() => {
        try {
          notification.close();
        } catch (e) {
          // Ignorar errores si la notificación ya fue cerrada
        }
      }, 6000);

      console.log('[UnreadMessagesService] ✅ Notificación del navegador mostrada correctamente');
    } catch (error) {
      console.error('[UnreadMessagesService] Error al mostrar notificación del navegador:', error);
    }
  }

  /**
   * Habilitar/deshabilitar notificaciones del navegador
   */
  enableNotifications(enabled: boolean): void {
    this.notificationsEnabled = enabled && Notification.permission === 'granted';
    console.log('[UnreadMessagesService] Notificaciones', enabled ? 'habilitadas' : 'deshabilitadas');
  }

  /**
   * Verificar si las notificaciones están habilitadas
   */
  areNotificationsEnabled(): boolean {
    return this.notificationsEnabled;
  }

  /**
   * Habilitar/deshabilitar sonido de notificación
   */
  enableSound(enabled: boolean): void {
    this.soundEnabled = enabled;
    console.log('[UnreadMessagesService] Sonido', enabled ? 'habilitado' : 'deshabilitado');
  }

  /**
   * Verificar si el sonido está habilitado
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Reproducir sonido de prueba
   */
  playTestSound(): void {
    console.log('[UnreadMessagesService] Reproduciendo sonido de prueba...');
    this.playNotificationSound();
  }

  /**
   * Configurar reanudación del AudioContext después de gesto del usuario
   * Necesario para evitar el error de autoplay policy de Chrome
   */
  private setupAudioContextResume(): void {
    const resumeAudio = () => {
      if (this.audioResumed) return;

      try {
        // Intentar crear y reanudar el AudioContext
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().then(() => {
            this.audioResumed = true;
            console.log('[UnreadMessagesService] ✅ AudioContext reanudado después de gesto del usuario');

            // Limpiar listeners después de reanudar
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
          });
        } else {
          this.audioResumed = true;
        }
      } catch (error) {
        console.warn('[UnreadMessagesService] Error al reanudar AudioContext:', error);
      }
    };

    // Escuchar primer gesto del usuario
    document.addEventListener('click', resumeAudio, { once: false });
    document.addEventListener('keydown', resumeAudio, { once: false });
    document.addEventListener('touchstart', resumeAudio, { once: false });

    console.log('[UnreadMessagesService] 🎧 Listeners de gesto de usuario configurados para reanudar audio');
  }

  // ===== CLEANUP =====

  /**
   * Limpiar estado
   */
  clear(): void {
    this.unreadCountMap.set({});
    this.unreadMessagesMap.set({});
    this.error.set(null);
    this.isLoading.set(false);
  }
}
