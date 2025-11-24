import { OnboardingTour } from '@guiders-frontend/shared/types';

/**
 * Welcome Tour - First-time user introduction
 * Shows the main features and navigation of the Console app
 */
export const welcomeTour: OnboardingTour = {
  id: 'console-welcome',
  name: 'Bienvenida a Guiders Console',
  description: 'Una guía rápida para conocer las funcionalidades principales',
  route: '/inbox',
  autoStart: true,
  priority: 1,
  steps: [
    {
      id: 'welcome-intro',
      title: '¡Bienvenido a Guiders Console! 👋',
      description:
        'Esta es tu herramienta para gestionar conversaciones con visitantes. Te mostraremos las funciones principales para que puedas empezar rápidamente.',
      position: 'center',
    },
    {
      id: 'welcome-sidebar',
      title: 'Navegación Principal',
      description:
        'Desde este menú lateral puedes acceder a todas las funcionalidades: conversaciones, visitantes y contactos.',
      target: '[data-tour="sidebar"]',
      position: 'right',
    },
    {
      id: 'welcome-inbox',
      title: 'Bandeja de Entrada',
      description:
        'Aquí encontrarás todas tus conversaciones activas. Puedes ver y responder mensajes en tiempo real.',
      target: '[data-tour="sidebar-inbox"]',
      position: 'right',
    },
    {
      id: 'welcome-visitors',
      title: 'Gestión de Visitantes',
      description:
        'Accede a la lista completa de visitantes de tu sitio web. Puedes filtrarlos, ver su información y comenzar conversaciones.',
      target: '[data-tour="sidebar-visitors"]',
      position: 'right',
    },
    {
      id: 'welcome-contacts',
      title: 'Contactos',
      description:
        'Organiza y gestiona tus contactos. Encuentra conversaciones recientes y busca personas específicas.',
      target: '[data-tour="sidebar-contacts"]',
      position: 'right',
    },
    {
      id: 'welcome-user-menu',
      title: 'Tu Perfil',
      description:
        'Desde aquí puedes configurar tu cuenta, ajustar preferencias y cerrar sesión.',
      target: '[data-tour="user-menu"]',
      position: 'bottom',
    },
    {
      id: 'welcome-complete',
      title: '¡Listo para empezar! 🚀',
      description:
        'Ya conoces lo básico. Puedes volver a ver esta guía en cualquier momento desde el menú de ayuda. ¡Comienza a chatear con tus visitantes!',
      position: 'center',
    },
  ],
};

/**
 * Inbox Tour - Detailed guide for the inbox/chat feature
 */
export const inboxTour: OnboardingTour = {
  id: 'console-inbox',
  name: 'Guía de Bandeja de Entrada',
  description: 'Aprende a gestionar tus conversaciones eficientemente',
  route: '/inbox',
  autoStart: false,
  priority: 2,
  steps: [
    {
      id: 'inbox-intro',
      title: 'Bandeja de Entrada',
      description:
        'Aquí se muestran todas tus conversaciones. Vamos a explorar las funcionalidades principales.',
      position: 'center',
    },
    {
      id: 'inbox-sidebar',
      title: 'Lista de Conversaciones',
      description:
        'Todas tus conversaciones aparecen aquí. Las nuevas mensajes se destacan automáticamente.',
      target: '[data-tour="inbox-sidebar"]',
      position: 'right',
    },
    {
      id: 'inbox-search',
      title: 'Buscar Conversaciones',
      description:
        'Usa este campo para buscar conversaciones específicas por nombre o contenido.',
      target: '[data-tour="inbox-search"]',
      position: 'bottom',
    },
    {
      id: 'inbox-filters',
      title: 'Filtros Rápidos',
      description:
        'Filtra conversaciones por estado: todas, activas, pendientes o resueltas.',
      target: '[data-tour="inbox-filters"]',
      position: 'bottom',
    },
    {
      id: 'inbox-chat-area',
      title: 'Área de Chat',
      description:
        'Aquí verás los mensajes de la conversación seleccionada. Puedes enviar texto, imágenes y archivos.',
      target: '[data-tour="chat-area"]',
      position: 'left',
    },
    {
      id: 'inbox-message-input',
      title: 'Enviar Mensajes',
      description:
        'Escribe tu mensaje aquí. Puedes usar Markdown para dar formato y adjuntar archivos.',
      target: '[data-tour="message-input"]',
      position: 'top',
    },
    {
      id: 'inbox-visitor-info',
      title: 'Información del Visitante',
      description:
        'Aquí puedes ver detalles del visitante: ubicación, navegador, páginas visitadas y más.',
      target: '[data-tour="visitor-info"]',
      position: 'left',
    },
  ],
};

/**
 * Visitors Tour - Guide for the visitors management feature
 */
export const visitorsTour: OnboardingTour = {
  id: 'console-visitors',
  name: 'Guía de Visitantes',
  description: 'Aprende a gestionar y contactar a los visitantes de tu sitio',
  route: '/visitors',
  autoStart: false,
  priority: 3,
  steps: [
    {
      id: 'visitors-intro',
      title: 'Gestión de Visitantes',
      description:
        'Desde aquí puedes ver todos los visitantes de tu sitio web y comenzar conversaciones con ellos.',
      position: 'center',
    },
    {
      id: 'visitors-list',
      title: 'Lista de Visitantes',
      description:
        'Todos los visitantes de tu sitio aparecen aquí con información en tiempo real sobre su actividad.',
      target: '[data-tour="visitors-list"]',
      position: 'top',
    },
    {
      id: 'visitors-filters',
      title: 'Filtros',
      description:
        'Filtra visitantes por estado: activos, todos, asignados a ti o sin asignar. Útil para priorizar tu trabajo.',
      target: '[data-tour="visitors-filters"]',
      position: 'bottom',
    },
    {
      id: 'visitors-search',
      title: 'Buscar Visitantes',
      description:
        'Busca visitantes específicos por nombre, email o cualquier otro dato.',
      target: '[data-tour="visitors-search"]',
      position: 'bottom',
    },
    {
      id: 'visitors-sort',
      title: 'Ordenar Resultados',
      description:
        'Ordena la lista por última actividad, nombre, número de visitas o tiempo en el sitio.',
      target: '[data-tour="visitors-sort"]',
      position: 'bottom',
    },
    {
      id: 'visitors-card',
      title: 'Tarjeta de Visitante',
      description:
        'Cada visitante muestra información clave: ubicación, páginas visitadas, dispositivo y más.',
      target: '[data-tour="visitor-card"]:first-child',
      position: 'right',
    },
    {
      id: 'visitors-action',
      title: 'Iniciar Conversación',
      description:
        'Haz clic en cualquier visitante para ver su perfil completo e iniciar una conversación.',
      target: '[data-tour="visitor-card"]:first-child [data-tour="visitor-action"]',
      position: 'left',
    },
  ],
};

/**
 * Contacts Tour - Guide for the contacts feature
 */
export const contactsTour: OnboardingTour = {
  id: 'console-contacts',
  name: 'Guía de Contactos',
  description: 'Organiza y encuentra tus contactos fácilmente',
  route: '/contacts',
  autoStart: false,
  priority: 4,
  steps: [
    {
      id: 'contacts-intro',
      title: 'Gestión de Contactos',
      description:
        'Aquí puedes organizar todos tus contactos y acceder rápidamente a conversaciones anteriores.',
      position: 'center',
    },
    {
      id: 'contacts-tabs',
      title: 'Vistas de Contactos',
      description:
        'Cambia entre diferentes vistas: Mis contactos, Recientes o Buscar para encontrar lo que necesitas.',
      target: '[data-tour="contacts-tabs"]',
      position: 'bottom',
    },
    {
      id: 'contacts-mine',
      title: 'Mis Contactos',
      description:
        'Todos los contactos que has guardado o con los que has interactuado aparecen aquí.',
      target: '[data-tour="contacts-tab-mine"]',
      position: 'bottom',
    },
    {
      id: 'contacts-recent',
      title: 'Recientes',
      description:
        'Accede rápidamente a las personas con las que has conversado recientemente.',
      target: '[data-tour="contacts-tab-recent"]',
      position: 'bottom',
    },
    {
      id: 'contacts-search',
      title: 'Buscar',
      description:
        'Busca cualquier contacto por nombre, email o empresa. La búsqueda es instantánea.',
      target: '[data-tour="contacts-tab-search"]',
      position: 'bottom',
    },
  ],
};

/**
 * All tours for the Console app
 * Exported as an array for easy registration
 */
export const consoleTours: OnboardingTour[] = [
  welcomeTour,
  inboxTour,
  visitorsTour,
  contactsTour,
];
