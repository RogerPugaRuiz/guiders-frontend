import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { UserService } from '@guiders-frontend/auth/data-access/session';
import { WebSocketService } from '@guiders-frontend/chat/data-access/websocket-service';
import {
  ChatPresence,
  Participant,
  PresenceChangedEvent,
  TypingStartEvent,
  TypingStopEvent,
  PresenceConfig,
  UserType,
  PresenceStatus,
} from '@guiders-frontend/shared/types';

/**
 * Estado de presencia para un chat específico
 */
interface ChatPresenceState {
  chatId: string;
  participants: Map<string, Participant>;
  typingUsers: Set<string>;
  lastUpdated: Date;
}

/**
 * Servicio de presencia y typing indicators
 *
 * Funcionalidades:
 * - Obtener estado de presencia de participantes de un chat
 * - Enviar/recibir eventos de typing (escribiendo)
 * - Escuchar cambios de presencia en tiempo real
 * - Debounce automático para typing events
 * - Auto-stop de typing después de 2 segundos
 *
 * Integración:
 * - HTTP REST API para estado inicial
 * - WebSocket para eventos en tiempo real
 * - Autenticación automática vía cookies (UserService)
 */
@Injectable({
  providedIn: 'root',
})
export class PresenceService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly userService = inject(UserService);
  private readonly websocketService = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);

  // ===== CONFIGURACIÓN =====
  private readonly config: PresenceConfig = {
    typingDebounceMs: 300,
    typingAutoStopMs: 2000,
    debug: false,
  };

  // ===== ESTADO INTERNO =====
  // Mapa de presencia por chatId
  private readonly presenceStates = new Map<string, ChatPresenceState>();

  // Timers para auto-stop de typing por chatId
  private readonly typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // ===== SIGNALS REACTIVOS =====
  // Signal para forzar re-renders cuando cambie el estado
  private readonly presenceUpdateTrigger = signal<number>(0);

  // ===== SUBJECTS PARA EVENTOS =====
  private readonly presenceChangedSubject = new Subject<PresenceChangedEvent>();
  private readonly typingStartSubject = new Subject<TypingStartEvent>();
  private readonly typingStopSubject = new Subject<TypingStopEvent>();

  // Subject para typing input con debounce
  private readonly typingInputSubject = new Subject<{
    chatId: string;
    userId: string;
    userType: UserType;
  }>();

  // ===== OBSERVABLES PÚBLICOS =====
  readonly presenceChanged$ = this.presenceChangedSubject.asObservable();
  readonly typingStart$ = this.typingStartSubject.asObservable();
  readonly typingStop$ = this.typingStopSubject.asObservable();

  constructor() {
    this.setupWebSocketListeners();
    this.setupTypingDebounce();

    // Auto-cleanup al destruir el servicio
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Obtener estado de presencia de un chat (HTTP)
   * Endpoint: GET /api/presence/chat/:chatId
   */
  getChatPresence(chatId: string): Observable<ChatPresence> {
    const url = `${this.environment.api.baseUrl}/presence/chat/${chatId}`;

    return this.http
      .get<ChatPresence>(url, { withCredentials: true })
      .pipe(
        tap((presence) => {
          this.updatePresenceState(chatId, presence);
          if (this.config.debug) {
            console.log('[PresenceService] Presencia obtenida para chat:', chatId, presence);
          }
        })
      );
  }

  /**
   * Comenzar a escribir en un chat
   * Endpoint: POST /api/presence/chat/:chatId/typing/start
   */
  startTyping(chatId: string): void {
    const user = this.userService.currentUser();
    if (!user) {
      console.warn('[PresenceService] Usuario no autenticado');
      return;
    }

    const userId = user.sub;
    const userType = this.getUserType(user.roles);

    // Emitir al subject para debounce
    this.typingInputSubject.next({ chatId, userId, userType });
  }

  /**
   * Dejar de escribir en un chat
   * Endpoint: POST /api/presence/chat/:chatId/typing/stop
   */
  stopTyping(chatId: string): void {
    const user = this.userService.currentUser();
    if (!user) return;

    const userId = user.sub;
    const userType = this.getUserType(user.roles);

    // Cancelar timer si existe
    this.clearTypingTimer(chatId);

    // Enviar evento al servidor
    this.emitTypingStop(chatId, userId, userType);
  }

  /**
   * Obtener estado de presencia de un chat desde el estado local (reactivo)
   */
  getChatPresenceState(chatId: string): ChatPresenceState | null {
    // Trigger reactivity
    this.presenceUpdateTrigger();
    return this.presenceStates.get(chatId) || null;
  }

  /**
   * Obtener participantes de un chat (computed)
   */
  getParticipants(chatId: string): Participant[] {
    const state = this.getChatPresenceState(chatId);
    return state ? Array.from(state.participants.values()) : [];
  }

  /**
   * Obtener usuarios escribiendo en un chat (computed)
   */
  getTypingUsers(chatId: string): string[] {
    const state = this.getChatPresenceState(chatId);
    return state ? Array.from(state.typingUsers) : [];
  }

  /**
   * Verificar si un usuario está escribiendo
   */
  isUserTyping(chatId: string, userId: string): boolean {
    const state = this.getChatPresenceState(chatId);
    return state?.typingUsers.has(userId) ?? false;
  }

  /**
   * Obtener estado de presencia de un participante específico
   */
  getParticipantPresence(chatId: string, userId: string): Participant | null {
    const state = this.getChatPresenceState(chatId);
    return state?.participants.get(userId) || null;
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Configurar listeners de WebSocket
   */
  private setupWebSocketListeners(): void {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[PresenceService] 🎧 Configurando listeners de WebSocket');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   🔌 WebSocket conectado:', this.websocketService.connected);
    console.log('   🆔 Socket ID:', this.websocketService.socketId);
    console.log('═══════════════════════════════════════════════════════════');

    // Evento: presence:changed
    this.websocketService.on('presence:changed', (...args: unknown[]) => {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔔 [PresenceService] EVENTO PRESENCE:CHANGED RECIBIDO!!!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('   📋 Args completos:', args);
      console.log('   📋 Args[0]:', args[0]);
      console.log('═══════════════════════════════════════════════════════════');

      const event = args[0] as PresenceChangedEvent;
      console.log('[PresenceService] 📋 Evento parseado:', event);

      this.handlePresenceChanged(event);
      this.presenceChangedSubject.next(event);
    });

    // Evento: typing:start
    this.websocketService.on('typing:start', (...args: unknown[]) => {
      const event = args[0] as TypingStartEvent;
      if (this.config.debug) {
        console.log('[PresenceService] Usuario escribiendo:', event);
      }

      this.handleTypingStart(event);
      this.typingStartSubject.next(event);
    });

    // Evento: typing:stop
    this.websocketService.on('typing:stop', (...args: unknown[]) => {
      const event = args[0] as TypingStopEvent;
      if (this.config.debug) {
        console.log('[PresenceService] Usuario dejó de escribir:', event);
      }

      this.handleTypingStop(event);
      this.typingStopSubject.next(event);
    });

    console.log('[PresenceService] ✅ Listeners configurados: presence:changed, typing:start, typing:stop');
  }

  /**
   * Configurar debounce para eventos de typing
   */
  private setupTypingDebounce(): void {
    this.typingInputSubject
      .pipe(
        debounceTime(this.config.typingDebounceMs || 300),
        distinctUntilChanged(
          (prev, curr) => prev.chatId === curr.chatId && prev.userId === curr.userId
        )
      )
      .subscribe(({ chatId, userId, userType }) => {
        // Cancelar timer previo
        this.clearTypingTimer(chatId);

        // Enviar evento al servidor
        this.emitTypingStart(chatId, userId, userType);

        // Programar auto-stop
        this.scheduleAutoStop(chatId, userId, userType);
      });
  }

  /**
   * Emitir evento typing:start al servidor (WebSocket)
   */
  private emitTypingStart(chatId: string, userId: string, userType: UserType): void {
    this.websocketService.emit('typing:start', {
      chatId,
      userId,
      userType,
    });
  }

  /**
   * Emitir evento typing:stop al servidor (WebSocket)
   */
  private emitTypingStop(chatId: string, userId: string, userType: UserType): void {
    this.websocketService.emit('typing:stop', {
      chatId,
      userId,
      userType,
    });
  }

  /**
   * Programar auto-stop de typing
   */
  private scheduleAutoStop(chatId: string, userId: string, userType: UserType): void {
    const timeout = setTimeout(() => {
      if (this.config.debug) {
        console.log('[PresenceService] Auto-stop de typing para chat:', chatId);
      }
      this.emitTypingStop(chatId, userId, userType);
    }, this.config.typingAutoStopMs || 2000);

    this.typingTimers.set(chatId, timeout);
  }

  /**
   * Limpiar timer de typing
   */
  private clearTypingTimer(chatId: string): void {
    const timer = this.typingTimers.get(chatId);
    if (timer) {
      clearTimeout(timer);
      this.typingTimers.delete(chatId);
    }
  }

  /**
   * Actualizar estado de presencia desde respuesta HTTP
   */
  private updatePresenceState(chatId: string, presence: ChatPresence): void {
    const participants = new Map<string, Participant>();
    presence.participants.forEach((p) => {
      participants.set(p.userId, p);
    });

    this.presenceStates.set(chatId, {
      chatId,
      participants,
      typingUsers: new Set(
        presence.participants.filter((p) => p.isTyping).map((p) => p.userId)
      ),
      lastUpdated: new Date(presence.timestamp),
    });

    // Trigger reactivity
    this.presenceUpdateTrigger.update((v) => v + 1);
  }

  /**
   * Manejar evento presence:changed
   */
  private handlePresenceChanged(event: PresenceChangedEvent): void {
    console.log('[PresenceService] 🔄 Procesando cambio de presencia:', {
      userId: event.userId,
      userType: event.userType,
      newStatus: event.status,
      previousStatus: event.previousStatus
    });

    // Actualizar estado en todos los chats donde participe este usuario
    let updatedChats = 0;
    this.presenceStates.forEach((state, chatId) => {
      const participant = state.participants.get(event.userId);
      if (participant) {
        console.log(`[PresenceService] ✅ Actualizando presencia en chat ${chatId}:`, {
          previousStatus: participant.connectionStatus,
          newStatus: event.status
        });
        participant.connectionStatus = event.status;
        this.presenceUpdateTrigger.update((v) => v + 1);
        updatedChats++;
      }
    });

    console.log(`[PresenceService] 📊 Chats actualizados: ${updatedChats} de ${this.presenceStates.size}`);
  }

  /**
   * Manejar evento typing:start
   */
  private handleTypingStart(event: TypingStartEvent): void {
    const state = this.presenceStates.get(event.chatId);
    if (!state) return;

    // No mostrar typing del usuario actual
    const currentUserId = this.userService.currentUser()?.sub;
    if (event.userId === currentUserId) return;

    state.typingUsers.add(event.userId);

    // Actualizar isTyping en participant
    const participant = state.participants.get(event.userId);
    if (participant) {
      participant.isTyping = true;
    }

    this.presenceUpdateTrigger.update((v) => v + 1);
  }

  /**
   * Manejar evento typing:stop
   */
  private handleTypingStop(event: TypingStopEvent): void {
    const state = this.presenceStates.get(event.chatId);
    if (!state) return;

    state.typingUsers.delete(event.userId);

    // Actualizar isTyping en participant
    const participant = state.participants.get(event.userId);
    if (participant) {
      participant.isTyping = false;
    }

    this.presenceUpdateTrigger.update((v) => v + 1);
  }

  /**
   * Determinar userType desde roles
   */
  private getUserType(roles: string[]): UserType {
    return roles.includes('commercial') ? 'commercial' : 'visitor';
  }

  /**
   * Cleanup al destruir el servicio
   */
  private cleanup(): void {
    // Limpiar todos los timers
    this.typingTimers.forEach((timer) => clearTimeout(timer));
    this.typingTimers.clear();

    // Limpiar listeners de WebSocket
    this.websocketService.off('presence:changed');
    this.websocketService.off('typing:start');
    this.websocketService.off('typing:stop');

    if (this.config.debug) {
      console.log('[PresenceService] Limpieza completada');
    }
  }
}
