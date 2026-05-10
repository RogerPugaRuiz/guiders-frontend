import { TourStepConfig } from '../tour-step.interface';

export const consoleTour: TourStepConfig[] = [
  // --- Sidebar ---
  {
    element: '[data-tour="sidebar-header"]',
    route: '/inbox',
    popover: {
      title: 'Navegación principal',
      description:
        'Desde aquí accedes a todas las secciones de la plataforma. El menú se puede colapsar para ganar espacio.',
      side: 'right',
      align: 'start',
    },
  },
  // --- Inbox ---
  {
    element: '[data-tour="inbox-sidebar"]',
    route: '/inbox',
    popover: {
      title: 'Bandeja de entrada',
      description:
        'Aquí verás todas las conversaciones activas en tiempo real. Las nuevas aparecen automáticamente.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="inbox-main"]',
    route: '/inbox',
    popover: {
      title: 'Panel de conversación',
      description:
        'Selecciona una conversación para leer y responder mensajes directamente.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="status-trigger"]',
    route: '/inbox',
    popover: {
      title: 'Tu estado de disponibilidad',
      description:
        'Cambia aquí si estás disponible para recibir nuevas conversaciones.',
      side: 'right',
      align: 'end',
    },
  },
  // --- Visitors ---
  {
    element: '[data-tour="visitors-panel"]',
    route: '/visitors',
    popover: {
      title: 'Visitantes activos',
      description:
        'Visualiza en tiempo real quién está navegando por tu web ahora mismo.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="visitors-filters"]',
    route: '/visitors',
    popover: {
      title: 'Filtros de visitantes',
      description:
        'Segmenta por canal, estado o fuente para localizar rápidamente al visitante correcto.',
      side: 'bottom',
      align: 'start',
    },
  },
  // --- Contacts ---
  {
    element: '[data-tour="contacts-container"]',
    route: '/contacts',
    popover: {
      title: 'Contactos',
      description:
        'Gestiona el historial de tus clientes: conversaciones anteriores, datos de contacto y notas.',
      side: 'right',
      align: 'start',
    },
  },
  // --- Escalations ---
  {
    element: '[data-tour="escalations-list"]',
    route: '/escalations',
    popover: {
      title: 'Escalaciones',
      description:
        'Aquí aparecen las conversaciones que requieren atención urgente o han superado el tiempo de respuesta.',
      side: 'right',
      align: 'start',
    },
  },
  // --- Settings ---
  {
    element: '[data-tour="settings-profile"]',
    route: '/settings/profile',
    popover: {
      title: 'Tu perfil',
      description:
        'Edita tu nombre, foto y datos de contacto. Esta información es visible para tus clientes.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-notifications"]',
    route: '/settings/notifications',
    popover: {
      title: 'Notificaciones',
      description:
        'Configura cuándo y cómo quieres recibir alertas de nuevas conversaciones y escalaciones.',
      side: 'right',
      align: 'start',
    },
  },
];
