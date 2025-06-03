import { Injectable } from '@angular/core';
import multiavatar from '@multiavatar/multiavatar';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {

  /**
   * Genera un avatar SVG usando Multiavatar
   * @param seed - String único para generar el avatar (nombre, email, ID, etc.)
   * @param size - Tamaño del avatar en píxeles (opcional, se aplica vía CSS)
   * @returns SVG string del avatar generado
   */
  generateAvatar(seed: string, size: number = 40): string {
    try {
      if (!seed) {
        seed = 'default-user';
      }

      // Limpiar el seed para evitar caracteres problemáticos
      const cleanSeed = this.cleanSeed(seed);
      
      // Generar el SVG usando Multiavatar
      const svgCode = multiavatar(cleanSeed);
      
      // Convertir el SVG a data URL para usar como src en img
      return `data:image/svg+xml;base64,${btoa(svgCode)}`;
    } catch (error) {
      console.error('Error generando avatar con Multiavatar:', error);
      return this.generateFallbackAvatar(seed, size);
    }
  }

  /**
   * Genera un avatar específicamente para visitantes
   */
  generateVisitorAvatar(visitorName: string, size: number = 40): string {
    return this.generateAvatar(visitorName, size);
  }

  /**
   * Genera un avatar específicamente para agentes/comerciales
   */
  generateAgentAvatar(agentName: string, size: number = 40): string {
    return this.generateAvatar(agentName, size);
  }

  /**
   * Limpia y normaliza el seed para generar avatares consistentes
   */
  private cleanSeed(seed: string): string {
    if (!seed) return 'default';
    
    // Si es un UUID, usamos solo los primeros 8 caracteres para mayor variedad
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seed)) {
      return seed.substring(0, 8);
    }
    
    // Para nombres, normalizamos eliminando espacios y caracteres especiales
    return seed
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20); // Limitamos la longitud
  }

  /**
   * Genera un avatar de respaldo en caso de error
   */
  private generateFallbackAvatar(seed: string, size: number): string {
    const initials = this.getInitials(seed);
    const colors = [
      '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', 
      '#F59E0B', '#10B981', '#06B6D4', '#8B5A2B'
    ];
    const colorIndex = this.hashCode(seed) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    const svgFallback = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}" rx="${size * 0.1}"/>
        <text 
          x="50%" 
          y="50%" 
          text-anchor="middle" 
          dy="0.35em" 
          font-family="Arial, sans-serif" 
          font-size="${size * 0.4}" 
          font-weight="600"
          fill="white"
        >${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svgFallback)}`;
  }

  /**
   * Obtiene las iniciales de un nombre
   */
  private getInitials(name: string): string {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Genera un hash numérico simple a partir de un string
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}