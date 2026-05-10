import { TourStepConfig } from '../tour-step.interface';

export const consoleTour: TourStepConfig[] = [
  // --- Sidebar ---
  {
    element: '[data-tour="sidebar-header"]',
    route: '/inbox',
    popover: {
      title: 'Bienvenido a Guiders',
      description:
        'Esta es tu consola de trabajo. Desde aquí gestionas todas las conversaciones con tus clientes en tiempo real.',
      side: 'right',
      align: 'start',
    },
  },
  // --- Status (first critical action) ---
  {
    element: '[data-tour="status-trigger"]',
    route: '/inbox',
    popover: {
      title: 'Activa tu disponibilidad primero',
      description:
        'Importante: mientras estés en modo "Ausente" no recibirás nuevos chats. Ponlo en "Disponible" para empezar a atender.',
      side: 'right',
      align: 'end',
    },
  },
  // --- Inbox ---
  {
    element: '[data-tour="inbox-sidebar"]',
    route: '/inbox',
    popover: {
      title: 'Aquí llegan tus chats en vivo',
      description:
        'Cada nueva conversación aparece aquí al instante. Las no leídas se marcan en negrita.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="inbox-main"]',
    route: '/inbox',
    popover: {
      title: 'Lee y responde en este panel',
      description:
        'Haz clic en cualquier conversación para abrirla y escribir tu respuesta.',
      side: 'left',
      align: 'start',
    },
  },
  // --- Visitors ---
  {
    element: '[data-tour="visitors-panel"]',
    route: '/visitors',
    popover: {
      title: 'Personas navegando ahora mismo',
      description:
        'Ves en tiempo real a cada persona que está en tu sitio antes de que escriba. Puedes iniciar tú la conversación.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="visitors-filters"]',
    route: '/visitors',
    popover: {
      title: 'Encuentra al visitante que necesitas',
      description:
        'Filtra por página visitada, tiempo en el sitio o canal de entrada para priorizar quién necesita ayuda.',
      side: 'bottom',
      align: 'start',
    },
  },
  // --- Contacts ---
  {
    element: '[data-tour="contacts-container"]',
    route: '/contacts',
    popover: {
      title: 'Historial de todos tus clientes',
      description:
        'Cada persona que ha hablado contigo queda aquí con su historial completo de conversaciones y datos.',
      side: 'right',
      align: 'start',
    },
  },
  // --- Escalations ---
  {
    element: '[data-tour="escalations-list"]',
    route: '/escalations',
    popover: {
      title: 'Conversaciones que necesitan atención urgente',
      description:
        'Cuando una conversación supera el tiempo de respuesta o requiere un supervisor, aparece aquí. Actúa rápido.',
      side: 'right',
      align: 'start',
    },
  },
  // --- Settings ---
  {
    element: '[data-tour="settings-profile"]',
    route: '/settings/profile',
    popover: {
      title: 'Tu identidad frente al cliente',
      description:
        'Tu nombre y foto son lo primero que ven tus clientes. Mantenlos actualizados para generar confianza.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-notifications"]',
    route: '/settings/notifications',
    popover: {
      title: 'No pierdas ni un chat',
      description:
        'Activa las notificaciones ahora. Si no lo haces, puedes perder conversaciones cuando no tengas la app abierta.',
      side: 'right',
      align: 'start',
    },
  },
];
