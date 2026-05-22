// Tamaños estándar de iconos
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Nombres de iconos disponibles en el sistema
export type IconName = 
  // Navegación
  | 'arrow-left'
  | 'arrow-right' 
  | 'arrow-up'
  | 'arrow-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'sidebar-collapse'
  | 'sidebar-expand'
  | 'menu'
  | 'close'
  | 'home'
  
  // Acciones
  | 'plus'
  | 'minus'
  | 'edit'
  | 'trash'
  | 'save'
  | 'search'
  | 'filter'
  | 'refresh'
  | 'download'
  | 'upload'
  | 'copy'
  | 'external-link'
  
  // Estado
  | 'check'
  | 'check-circle'
  | 'x-circle'
  | 'alert-triangle'
  | 'info'
  | 'help-circle'
  | 'loading'
  | 'eye'
  | 'eye-off'
  
  // Comunicación
  | 'message-circle'
  | 'message-square'
  | 'inbox'
  | 'mail'
  | 'phone'
  | 'bell'
  | 'bell-off'
  | 'video'
  | 'microphone'
  | 'microphone-off'
  
  // Usuarios
  | 'user'
  | 'users'
  | 'user-plus'
  | 'user-minus'
  | 'settings'
  | 'profile'
  | 'shield'
  | 'lock'
  | 'unlock'
  
  // Archivos
  | 'file'
  | 'file-text'
  | 'folder'
  | 'folder-open'
  | 'image'
  | 'attachment'
  
  // Interface
  | 'dashboard'
  | 'calendar'
  | 'clock'
  | 'star'
  | 'star-filled'
  | 'heart'
  | 'bookmark'
  | 'tag'
  | 'flag'
  
  // Datos/Analytics
  | 'bar-chart'
  | 'pie-chart'
  | 'trending-up'
  | 'trending-down'
  | 'activity'
  
  // Sistema
  | 'power'
  | 'wifi'
  | 'bluetooth'
  | 'battery'
  | 'signal'
  
  // B2B Adicionales
  | 'building'
  | 'globe'
  | 'target'
  | 'leadcars'
  | 'layers'
  | 'monitor'
  | 'server'

  // Shapes
  | 'circle';

// Configuración de iconos
export interface IconConfig {
  /** Label para accesibilidad */
  ariaLabel?: string;
  /** Si el icono es puramente decorativo */
  decorative?: boolean;
  /** Rol ARIA personalizado */
  role?: string;
  /** Clases CSS adicionales */
  className?: string;
}

// Mapa de tamaños en píxeles
export const ICON_SIZES: Record<IconSize, number> = {
  'xs': 12,
  'sm': 16,
  'md': 20,
  'lg': 24,
  'xl': 32,
  '2xl': 48
};

// Categorías de iconos para organización
export const ICON_CATEGORIES = {
  navigation: [
    'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down',
    'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down',
    'sidebar-collapse', 'sidebar-expand',
    'menu', 'close', 'home'
  ],
  actions: [
    'plus', 'minus', 'edit', 'trash', 'save', 'search', 'filter',
    'refresh', 'download', 'upload', 'copy', 'external-link'
  ],
  status: [
    'check', 'check-circle', 'x-circle', 'alert-triangle', 'info',
    'help-circle', 'loading', 'eye', 'eye-off'
  ],
  communication: [
    'message-circle', 'message-square', 'inbox', 'mail', 'phone', 'bell', 'bell-off',
    'video', 'microphone', 'microphone-off'
  ],
  users: [
    'user', 'users', 'user-plus', 'user-minus', 'settings',
    'profile', 'shield', 'lock', 'unlock'
  ],
  files: [
    'file', 'file-text', 'folder', 'folder-open', 'image', 'attachment'
  ],
  interface: [
    'dashboard', 'calendar', 'clock', 'star', 'star-filled',
    'heart', 'bookmark', 'tag', 'flag'
  ],
  analytics: [
    'bar-chart', 'pie-chart', 'trending-up', 'trending-down', 'activity'
  ],
  system: [
    'power', 'wifi', 'bluetooth', 'battery', 'signal'
  ],
  business: [
    'building', 'globe', 'target', 'leadcars', 'layers', 'monitor', 'server'
  ]
} as const;
