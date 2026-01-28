/**
 * Escalation types for LLM assistance requests
 */

export type EscalationReason =
  | 'cannot_answer'
  | 'visitor_requested'
  | 'complex_topic'
  | 'other';

export interface EscalationEvent {
  chatId: string;
  visitorId: string;
  companyId: string;
  message: string;
  reason: EscalationReason;
  chatUrl: string;
  timestamp: string;
}

export const ESCALATION_REASON_LABELS: Record<EscalationReason, string> = {
  cannot_answer: 'La IA no puede responder',
  visitor_requested: 'El visitante solicitó un humano',
  complex_topic: 'Tema complejo detectado',
  other: 'Asistencia requerida'
};
