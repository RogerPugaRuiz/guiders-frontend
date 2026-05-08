/**
 * Paleta de colores para avatares de usuario.
 * Colores muted/desaturados adaptados a temas dark — buen contraste para texto blanco.
 */
const AVATAR_COLORS = [
  '#8c4a62', // Pink apagado
  '#7c4fa0', // Purple apagado
  '#5a3a8c', // Deep Purple apagado
  '#2a4a80', // Indigo apagado
  '#1e5070', // Blue apagado
  '#1e6070', // Light Blue apagado
  '#1e6070', // Cyan apagado
  '#2a6462', // Teal apagado
  '#2a6a3a', // Green apagado
  '#4a6820', // Light Green apagado
  '#8c5a2a', // Orange apagado
  '#8c3a2a', // Deep Orange apagado
  '#5a3a2a', // Brown apagado
  '#3a4a52', // Blue Grey apagado
] as const;

/**
 * Genera un hash simple a partir de un string.
 * Utiliza el algoritmo de hash DJB2 para consistencia.
 * 
 * @param str - El string del cual generar el hash
 * @returns Un número hash basado en el string
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Obtiene un color consistente para las iniciales de un usuario.
 * El mismo string de iniciales siempre devolverá el mismo color.
 * 
 * @param initials - Las iniciales del usuario (ej: "JP", "MA")
 * @returns Un color hexadecimal de la paleta predefinida
 * 
 * @example
 * ```typescript
 * getAvatarColor('JP') // Siempre devuelve el mismo color para 'JP'
 * getAvatarColor('MA') // Devuelve un color diferente pero consistente para 'MA'
 * ```
 */
export function getAvatarColor(initials: string): string {
  if (!initials || initials.trim().length === 0) {
    return AVATAR_COLORS[0];
  }

  const normalizedInitials = initials.toUpperCase().trim();
  const hash = hashString(normalizedInitials);
  const colorIndex = hash % AVATAR_COLORS.length;
  
  return AVATAR_COLORS[colorIndex];
}
