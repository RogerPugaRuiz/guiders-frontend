/**
 * Visitor Display Name Utility
 *
 * Función centralizada para obtener el nombre de visualización de un visitante
 * siguiendo una estrategia de fallback consistente.
 */

export interface VisitorInfo {
  id?: string;
  name?: string;
  email?: string;
}

/**
 * Obtiene el nombre de visualización para un visitante.
 *
 * Estrategia de fallback:
 * 1. Si existe name y no está vacío ni es genérico → usar name
 * 2. Si existe email y no está vacío → usar email
 * 3. Si existe id → mostrar "Visitante #[últimos 8 caracteres del ID]"
 * 4. Si no hay nada → mostrar "Visitante anónimo"
 *
 * @param visitor - Información del visitante (id, name, email)
 * @returns Nombre de visualización del visitante
 *
 * @example
 * ```typescript
 * // Con nombre
 * getVisitorDisplayName({ name: 'Juan Pérez', id: '123' })
 * // => 'Juan Pérez'
 *
 * // Nombre genérico del backend
 * getVisitorDisplayName({ name: 'Visitante', id: 'abc123def456' })
 * // => 'Visitante #def456'
 *
 * // Sin nombre, con email
 * getVisitorDisplayName({ email: 'juan@example.com', id: '123' })
 * // => 'juan@example.com'
 *
 * // Solo ID
 * getVisitorDisplayName({ id: 'abc123def456' })
 * // => 'Visitante #def456' (últimos 8 caracteres)
 *
 * // Sin nada
 * getVisitorDisplayName({})
 * // => 'Visitante anónimo'
 * ```
 */
export function getVisitorDisplayName(visitor: VisitorInfo): string {
  // Nombres genéricos que deben ser ignorados (tratados como vacíos)
  const genericNames = ['Visitante', 'Chat sin título', 'visitante', 'Visitor', 'visitor'];

  // 1. Prioridad: nombre si existe, no está vacío y no es genérico
  if (visitor.name && visitor.name.trim()) {
    const trimmedName = visitor.name.trim();
    // Solo usar el nombre si no es uno de los valores genéricos
    if (!genericNames.includes(trimmedName)) {
      return trimmedName;
    }
  }

  // 2. Fallback: email si existe y no está vacío
  if (visitor.email && visitor.email.trim()) {
    return visitor.email.trim();
  }

  // 3. Fallback: ID con formato "Visitante #XXXXXXXX"
  if (visitor.id && visitor.id.trim()) {
    const shortId = visitor.id.slice(-8); // Últimos 8 caracteres
    return `Visitante #${shortId}`;
  }

  // 4. Fallback final: visitante anónimo
  return 'Visitante anónimo';
}

/**
 * Obtiene el nombre de visualización a partir de un participante de chat.
 * Wrapper para mantener compatibilidad con la interfaz Participant/User.
 *
 * @param participant - Participante del chat
 * @returns Nombre de visualización del visitante
 */
export function getParticipantDisplayName(
  participant: { id?: string; name?: string; email?: string } | undefined | null
): string {
  if (!participant) {
    return 'Visitante anónimo';
  }

  return getVisitorDisplayName({
    id: participant.id,
    name: participant.name,
    email: participant.email,
  });
}
