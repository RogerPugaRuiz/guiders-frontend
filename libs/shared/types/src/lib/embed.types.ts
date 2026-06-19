/**
 * Tipos del protocolo postMessage para el handshake iframe ↔ parent.
 *
 * Story 3.1 — Epic 3: Cross-Frame Auth Handshake.
 *
 * Eventos versionados (prefijo `v1:`):
 * - `guiders:v1:ready`  → iframe → parent (bootstrap signal)
 * - `leadcars:v1:auth`  → parent → iframe (auth credentials)
 * - `leadcars:v1:logout`→ parent → iframe (logout signal)
 *
 * Spec: `_bmad-output/planning-artifacts/epics.md` Story 3.1
 */

/** Versión actual del protocolo. Incrementar en breaking changes. */
export const EMBED_PROTOCOL_VERSION = '1.0.0' as const;

/** Tipos de mensajes conocidos. Cualquier otro `type` es silenciosamente ignorado. */
export type EmbedMessageType =
  | 'guiders:v1:ready'
  | 'leadcars:v1:auth'
  | 'leadcars:v1:logout';

/** iframe → parent: el iframe está listo para recibir credenciales. */
export interface EmbedReadyMessage {
  type: 'guiders:v1:ready';
  payload: {
    version: typeof EMBED_PROTOCOL_VERSION;
  };
}

/** parent → iframe: credenciales de autenticación. */
export interface EmbedAuthMessage {
  type: 'leadcars:v1:auth';
  payload: {
    token: string;
    userId?: string;
  };
}

/** parent → iframe: signal de logout. */
export interface EmbedLogoutMessage {
  type: 'leadcars:v1:logout';
  payload: Record<string, never>;
}

/** Discriminated union de todos los mensajes válidos. */
export type EmbedMessage =
  | EmbedReadyMessage
  | EmbedAuthMessage
  | EmbedLogoutMessage;

/** Type guard: ¿el evento es un EmbedMessage válido? */
export function isEmbedMessage(event: MessageEvent): event is MessageEvent<EmbedMessage> {
  const data = event.data;
  if (!data || typeof data !== 'object') return false;
  const type = (data as { type?: unknown }).type;
  return (
    type === 'guiders:v1:ready' ||
    type === 'leadcars:v1:auth' ||
    type === 'leadcars:v1:logout'
  );
}