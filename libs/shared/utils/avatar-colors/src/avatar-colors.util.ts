/**
 * Paleta de colores para avatares de usuario.
 * Colores accesibles y agradables visualmente que cumplen con WCAG AA
 * para texto blanco sobre estos fondos.
 */
const AVATAR_COLORS = [
  '#E91E63', // Pink 500
  '#9C27B0', // Purple 500
  '#673AB7', // Deep Purple 500
  '#3F51B5', // Indigo 500
  '#2196F3', // Blue 500
  '#03A9F4', // Light Blue 500
  '#00BCD4', // Cyan 500
  '#009688', // Teal 500
  '#4CAF50', // Green 500
  '#8BC34A', // Light Green 500
  '#FF9800', // Orange 500
  '#FF5722', // Deep Orange 500
  '#795548', // Brown 500
  '#607D8B', // Blue Grey 500
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
