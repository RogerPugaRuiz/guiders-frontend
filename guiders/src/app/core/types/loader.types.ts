/**
 * Configuración y tipos para el sistema de loading de Guiders
 */

export interface LoaderState {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
  progress?: number;
  type?: LoaderType;
}

export interface LoaderConfig {
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  size?: LoaderSize;
  theme?: LoaderTheme;
  timeout?: number;
  position?: LoaderPosition;
  backdrop?: boolean;
  dismissible?: boolean;
}

export type LoaderSize = 'small' | 'medium' | 'large';
export type LoaderTheme = 'primary' | 'secondary' | 'dark' | 'light' | 'success' | 'warning' | 'error';
export type LoaderType = 'spinner' | 'dots' | 'pulse' | 'skeleton';
export type LoaderPosition = 'center' | 'top' | 'bottom' | 'inline';

export interface LoaderAnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
}

/**
 * Configuración global del sistema de loading
 */
export interface GlobalLoaderConfig {
  defaultMessage: string;
  defaultSubMessage: string;
  defaultTheme: LoaderTheme;
  defaultSize: LoaderSize;
  autoHideTimeout: number;
  showProgressByDefault: boolean;
  enableAnimations: boolean;
  responsiveBreakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

/**
 * Eventos del loader
 */
export interface LoaderEvents {
  onShow?: () => void;
  onHide?: () => void;
  onProgress?: (progress: number) => void;
  onTimeout?: () => void;
  onError?: (error: any) => void;
}

/**
 * Métricas del loader para análisis
 */
export interface LoaderMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  component: string;
  operation: string;
  success: boolean;
}

/**
 * Configuración por defecto del sistema
 */
export const DEFAULT_LOADER_CONFIG: GlobalLoaderConfig = {
  defaultMessage: 'Cargando...',
  defaultSubMessage: 'Por favor espera',
  defaultTheme: 'primary',
  defaultSize: 'medium',
  autoHideTimeout: 30000, // 30 segundos
  showProgressByDefault: false,
  enableAnimations: true,
  responsiveBreakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024
  }
};

/**
 * Constantes para los iconos de loading
 */
export const LOADER_ICONS = {
  guiders: {
    viewBox: '0 0 140 140',
    path: 'M70 70m-65 0a65 65 0 1 1 130 0a65 65 0 1 1-130 0'
  },
  spinner: {
    viewBox: '0 0 24 24',
    path: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83'
  },
  dots: {
    viewBox: '0 0 120 30',
    path: 'M15 15m-15 0a15 15 0 1 1 30 0a15 15 0 1 1-30 0'
  }
} as const;

/**
 * Utilidades para el sistema de loading
 */
export class LoaderUtils {
  /**
   * Convierte duración en ms a formato legible
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  /**
   * Calcula el progreso entre 0 y 100
   */
  static calculateProgress(current: number, total: number): number {
    return Math.min(100, Math.max(0, (current / total) * 100));
  }

  /**
   * Valida la configuración del loader
   */
  static validateConfig(config: LoaderConfig): boolean {
    if (config.timeout && config.timeout < 0) return false;
    if (config.progress && (config.progress < 0 || config.progress > 100)) return false;
    return true;
  }

  /**
   * Combina configuraciones (merge)
   */
  static mergeConfigs(base: LoaderConfig, override: Partial<LoaderConfig>): LoaderConfig {
    return { ...base, ...override };
  }

  /**
   * Genera un ID único para el loader
   */
  static generateLoaderId(): string {
    return `loader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detecta si el dispositivo es móvil
   */
  static isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= DEFAULT_LOADER_CONFIG.responsiveBreakpoints.mobile;
  }

  /**
   * Detecta si el dispositivo es tablet
   */
  static isTablet(): boolean {
    return typeof window !== 'undefined' && 
           window.innerWidth > DEFAULT_LOADER_CONFIG.responsiveBreakpoints.mobile &&
           window.innerWidth <= DEFAULT_LOADER_CONFIG.responsiveBreakpoints.tablet;
  }

  /**
   * Obtiene la configuración responsiva
   */
  static getResponsiveConfig(baseConfig: LoaderConfig): LoaderConfig {
    const config = { ...baseConfig };
    
    if (this.isMobile()) {
      config.size = config.size === 'large' ? 'medium' : config.size;
    }
    
    return config;
  }
}

/**
 * Tokens de inyección de dependencias
 */
export const LOADER_CONFIG_TOKEN = 'LOADER_CONFIG';
export const LOADER_METRICS_TOKEN = 'LOADER_METRICS';

/**
 * Decorador para agregar loading automático a métodos
 */
export function WithLoader(config?: Partial<LoaderConfig>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const loaderService = this.loaderService || this.injector?.get('LoaderService');
      
      if (!loaderService) {
        console.warn('LoaderService no encontrado para el decorador @WithLoader');
        return originalMethod.apply(this, args);
      }

      const loaderId = LoaderUtils.generateLoaderId();
      const startTime = Date.now();

      try {
        loaderService.show(config?.message || 'Procesando...', 0);
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        console.error(`Error en método ${propertyKey}:`, error);
        throw error;
      } finally {
        loaderService.hide();
        
        // Métricas opcionales
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.debug(`Método ${propertyKey} completado en ${LoaderUtils.formatDuration(duration)}`);
      }
    };

    return descriptor;
  };
}

/**
 * Interface para componentes que implementan loading
 */
export interface LoaderAware {
  loaderConfig?: LoaderConfig;
  isLoading?: boolean;
  showLoader(config?: LoaderConfig): void;
  hideLoader(): void;
  updateProgress?(progress: number, message?: string): void;
}

/**
 * Mixin para agregar funcionalidad de loading a componentes
 */
export function withLoaderCapability<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base implements LoaderAware {
    loaderConfig: LoaderConfig = {};
    isLoading: boolean = false;

    showLoader(config?: LoaderConfig): void {
      this.isLoading = true;
      this.loaderConfig = config || {};
    }

    hideLoader(): void {
      this.isLoading = false;
    }

    updateProgress(progress: number, message?: string): void {
      this.loaderConfig = {
        ...this.loaderConfig,
        progress,
        message: message || this.loaderConfig.message
      };
    }
  };
}
