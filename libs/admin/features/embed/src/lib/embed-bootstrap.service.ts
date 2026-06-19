import { Injectable, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  EmbedMessage,
  EMBED_PROTOCOL_VERSION,
  isEmbedMessage,
} from '@guiders-frontend/types';
import { EmbedAllowedOriginsService } from './embed-allowed-origins.service';

const TARGET_PATH_AFTER_AUTH = '/embed/dashboard';

/**
 * Servicio que orquesta el handshake postMessage con el parent window
 * (Story 3.1 — Epic 3: Cross-Frame Auth Handshake).
 *
 * Flujo:
 * 1. bootstrap() se llama una vez al startup de Angular
 * 2. Envía `guiders:v1:ready` al parent (con la versión del protocolo)
 * 3. Registra un listener de `message` events
 * 4. Para cada mensaje entrante:
 *    - Valida que sea un EmbedMessage válido (type guard)
 *    - Valida origin contra la allowlist
 *    - Si pasa: procesa el mensaje según su tipo
 *    - Si falla: silent rejection + WARN log (NUNCA token en log)
 *
 * Spec: `_bmad-output/planning-artifacts/epics.md` Story 3.1
 */
@Injectable({ providedIn: 'root' })
export class EmbedBootstrapService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly originsService = inject(EmbedAllowedOriginsService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Inicializa el handshake. Idempotente — llamar múltiples veces
   * solo registra UN listener de `message`.
   */
  bootstrap(): void {
    this.sendReadyMessage();
    this.registerMessageListener();
  }

  private sendReadyMessage(): void {
    const message: EmbedMessage = {
      type: 'guiders:v1:ready',
      payload: { version: EMBED_PROTOCOL_VERSION },
    };
    window.parent.postMessage(message, '*');
  }

  private registerMessageListener(): void {
    const listener = (event: MessageEvent): void => {
      this.handleMessage(event);
    };
    window.addEventListener('message', listener);

    // Cleanup: unregister on Angular destroy (previene memory leak)
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('message', listener);
    });
  }

  private handleMessage(event: MessageEvent): void {
    // AC3 + AC4: silent rejection of invalid messages
    if (!isEmbedMessage(event)) {
      return;
    }

    const message = event.data;

    if (message.type === 'guiders:v1:ready') {
      // Ignore echoes of our own ready message from other iframes
      return;
    }

    // AC3: origin validation — silent rejection if invalid
    if (!this.originsService.isAllowed(event.origin)) {
      console.warn(
        `[EmbedBootstrap] Message from unauthorized origin rejected: ${event.origin}`,
      );
      return;
    }

    if (message.type === 'leadcars:v1:auth') {
      this.authenticate(message.payload.token, message.payload.userId);
      return;
    }

    if (message.type === 'leadcars:v1:logout') {
      // Story 3.2 scope: implement logout signal handling
      // For now: silent no-op (logout already implemented in BFF logout endpoint)
      return;
    }
  }

  private authenticate(token: string, userId?: string): void {
    this.http
      .post<{ sessionEstablished: boolean; expiresAt: string }>(
        '/api/embed/authenticate-session',
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Origin: window.location.origin,
          },
        },
      )
      .subscribe({
        next: this.navigateAfterAuth,
        error: this.handleAuthError,
      });
  }

  private readonly navigateAfterAuth = (): void => {
    this.router.navigate([TARGET_PATH_AFTER_AUTH]);
  };

  private readonly handleAuthError = (err: unknown): void => {
    console.warn('[EmbedBootstrap] Authentication failed', err);
  };
}