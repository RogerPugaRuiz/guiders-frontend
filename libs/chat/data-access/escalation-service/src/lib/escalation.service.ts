import {
  Injectable,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WebSocketService } from '@guiders-frontend/chat/data-access/websocket-service';
import { EscalationEvent } from '@guiders-frontend/shared/types';

@Injectable({ providedIn: 'root' })
export class EscalationService {
  private readonly webSocket = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);

  // State
  private readonly _escalations = signal<EscalationEvent[]>([]);
  readonly escalations = this._escalations.asReadonly();

  // Computed count for badge
  readonly escalationCount = computed(() => this._escalations().length);

  // Settings
  private soundEnabled = true;
  private browserNotificationsEnabled = false;

  constructor() {
    this.initializeListenerWhenConnected();
    this.requestNotificationPermission();
  }

  private initializeListenerWhenConnected(): void {
    if (this.webSocket.isConnected()) {
      this.initializeListener();
      return;
    }

    const connectionSubscription = this.webSocket.connectionState$.subscribe(
      (state) => {
        if (state === 'connected') {
          this.initializeListener();
          connectionSubscription.unsubscribe();
        }
      }
    );
  }

  /**
   * Initialize WebSocket listener for escalation events
   */
  private initializeListener(): void {
    this.webSocket.on('chat:escalation-requested', (data: unknown) => {
      const event = data as EscalationEvent;
      console.log('[EscalationService] Escalation received:', event);

      this.handleEscalation(event);
    });
  }

  /**
   * Handle incoming escalation event
   */
  private handleEscalation(event: EscalationEvent): void {
    // 1. Add to list
    this.addEscalation(event);

    // 2. Play sound
    if (this.soundEnabled) {
      this.playNotificationSound();
    }

    // 3. Browser notification (if tab is in background)
    if (this.browserNotificationsEnabled && document.hidden) {
      this.showBrowserNotification(event);
    }
  }

  /**
   * Add escalation to the list
   */
  addEscalation(event: EscalationEvent): void {
    // Avoid duplicates
    const exists = this._escalations().some((e) => e.chatId === event.chatId);
    if (exists) {
      console.warn(
        '[EscalationService] Escalation already exists:',
        event.chatId
      );
      return;
    }

    this._escalations.update((current) => [...current, event]);
  }

  /**
   * Remove escalation from the list
   */
  removeEscalation(chatId: string): void {
    this._escalations.update((current) =>
      current.filter((e) => e.chatId !== chatId)
    );
  }

  /**
   * Clear all escalations
   */
  clearAll(): void {
    this._escalations.set([]);
  }

  /**
   * Play notification sound (3 beeps)
   * Based on UnreadMessagesService pattern
   */
  private playNotificationSound(): void {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Higher frequency for urgency
      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';

      const now = audioContext.currentTime;
      // Three rapid beeps
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.15;
        gainNode.gain.setValueAtTime(0, now + offset);
        gainNode.gain.linearRampToValueAtTime(0.3, now + offset + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + offset + 0.08);
      }

      oscillator.start(now);
      oscillator.stop(now + 0.5);
    } catch (error) {
      console.warn('[EscalationService] Error playing sound:', error);
    }
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(event: EscalationEvent): void {
    // Check if Notification API is available (not available in tests)
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification('🤖 Escalación de IA', {
      body:
        event.message.substring(0, 100) +
        (event.message.length > 100 ? '...' : ''),
      icon: '/favicon.ico',
      tag: `escalation-${event.chatId}`,
      requireInteraction: true, // Don't auto-close
    });

    notification.onclick = () => {
      window.focus();
      // Navigate to escalations page
      window.location.href = '/escalations';
      notification.close();
    };
  }

  /**
   * Request notification permission
   */
  private requestNotificationPermission(): void {
    // Check if Notification API is available (not available in tests)
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.browserNotificationsEnabled = false;
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        this.browserNotificationsEnabled = permission === 'granted';
        console.log('[EscalationService] Notification permission:', permission);
      });
    } else {
      this.browserNotificationsEnabled = Notification.permission === 'granted';
    }
  }

  /**
   * Enable/disable sound
   */
  enableSound(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /**
   * Enable/disable browser notifications
   */
  enableBrowserNotifications(enabled: boolean): void {
    // Check if Notification API is available (not available in tests)
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.browserNotificationsEnabled = false;
      return;
    }

    this.browserNotificationsEnabled =
      enabled && Notification.permission === 'granted';
  }
}
