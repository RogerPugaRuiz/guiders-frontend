/**
 * Configuración para el comportamiento de la API de Chat
 * Permite controlar qué versión de la API usar y el comportamiento de fallback
 */

export interface ChatApiConfig {
  /**
   * Usar API V2 por defecto cuando esté disponible
   * Si es false, se usará siempre la API V1 legacy
   */
  useV2ByDefault: boolean;
  
  /**
   * Habilitar fallback automático a V1 si V2 falla
   * Si es false, los errores de V2 se propagan sin fallback
   */
  enableV1Fallback: boolean;
  
  /**
   * Tiempo de timeout para las peticiones V2 en milisegundos
   * Después de este tiempo, se usará V1 si el fallback está habilitado
   */
  v2TimeoutMs: number;
  
  /**
   * Logs de debugging para el comportamiento de la API
   */
  enableDebugLogs: boolean;
  
  /**
   * Experimentos/features flags para funcionalidades específicas
   */
  experiments: {
    /**
     * Usar paginación cursor V2 en lugar de offset V1
     */
    useCursorPagination: boolean;
    
    /**
     * Usar filtros avanzados V2
     */
    useAdvancedFilters: boolean;
    
    /**
     * Usar métricas en tiempo real V2
     */
    useRealTimeMetrics: boolean;
  };
}

/**
 * Configuración por defecto para desarrollo
 */
export const defaultChatApiConfig: ChatApiConfig = {
  useV2ByDefault: true,
  enableV1Fallback: true,
  v2TimeoutMs: 5000,
  enableDebugLogs: true,
  experiments: {
    useCursorPagination: true,
    useAdvancedFilters: true,
    useRealTimeMetrics: false
  }
};

/**
 * Configuración para producción
 */
export const productionChatApiConfig: ChatApiConfig = {
  useV2ByDefault: true,
  enableV1Fallback: true,
  v2TimeoutMs: 3000,
  enableDebugLogs: false,
  experiments: {
    useCursorPagination: true,
    useAdvancedFilters: true,
    useRealTimeMetrics: true
  }
};

/**
 * Configuración conservadora (solo V1)
 * Útil para rollback o debugging
 */
export const conservativeChatApiConfig: ChatApiConfig = {
  useV2ByDefault: false,
  enableV1Fallback: false,
  v2TimeoutMs: 1000,
  enableDebugLogs: true,
  experiments: {
    useCursorPagination: false,
    useAdvancedFilters: false,
    useRealTimeMetrics: false
  }
};

/**
 * Token de inyección para la configuración de Chat API
 */
import { InjectionToken } from '@angular/core';
export const CHAT_API_CONFIG_TOKEN = new InjectionToken<ChatApiConfig>('ChatApiConfig');
