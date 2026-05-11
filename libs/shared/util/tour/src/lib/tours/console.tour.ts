import { TourStepConfig } from '../tour-step.interface';

/**
 * Console interactive tour.
 *
 * Mixes informational steps with action steps that auto-advance when the user
 * performs the real interaction in the UI. Action steps:
 *  - Hide the Next button (the user must do the action to continue).
 *  - Keep the highlighted element interactive.
 *  - Listen for a click (or custom event) on the target.
 *
 * If a target element is missing in the DOM (e.g. empty inbox / empty visitors
 * list), no listener is attached and the standard Next button is shown as a
 * fallback so the user is never stuck.
 */
export const consoleTour: TourStepConfig[] = [
  // 1. Welcome
  {
    element: '[data-tour="sidebar-header"]',
    route: '/inbox',
    popover: {
      title: 'Bienvenido a Guiders',
      description:
        'Esta es tu consola de trabajo. En menos de un minuto verás cómo atender a tus clientes en tiempo real.',
      side: 'right',
      align: 'start',
    },
  },
  // 2. Inbox overview
  {
    element: '[data-tour="inbox-sidebar"]',
    route: '/inbox',
    popover: {
      title: 'Tus conversaciones en vivo',
      description:
        'Aquí aparece cada chat que entra. Las conversaciones con mensajes sin leer muestran un contador numérico en azul para que no se te escape ninguna.',
      side: 'right',
      align: 'start',
    },
  },
  // 3. ACTION: open a conversation
  {
    element: '[data-tour="conversation-item-first"]',
    route: '/inbox',
    mode: 'action',
    awaitClick: true,
    popover: {
      title: 'Abre una conversación',
      description:
        'Solo para practicar — haz clic en cualquier conversación para abrirla. El tour avanza automáticamente y no enviará nada.',
      side: 'right',
      align: 'center',
    },
  },
  // 4. ACTION: send a demo message in the sandbox conversation
  {
    element: '[data-tour="message-input"]',
    route: '/inbox',
    mode: 'action',
    awaitEvent: { event: 'message-sent-demo' },
    popover: {
      title: 'Envía tu primer mensaje',
      description:
        'Escribe una respuesta y pulsa Enter (o el botón de enviar). Estás en una conversación de práctica con un visitante ficticio: nada se enviará a un cliente real. El tour avanzará automáticamente cuando envíes el mensaje.',
      side: 'top',
      align: 'center',
    },
  },
  // 5. Visitors overview (info)
  {
    element: '[data-tour="visitors-panel"]',
    route: '/visitors',
    popover: {
      title: 'Personas navegando ahora mismo',
      description:
        'Ves en tiempo real a cada visitante en tu sitio antes de que escriba. Puedes iniciar tú la conversación.',
      side: 'bottom',
      align: 'start',
    },
  },
  // 6. ACTION: open advanced filters
  {
    element: '[data-tour="visitors-advanced-btn"]',
    route: '/visitors',
    mode: 'action',
    awaitClick: true,
    popover: {
      title: 'Filtra para encontrar al visitante clave',
      description:
        'Pulsa "Filtros avanzados" para acotar por página, tiempo en el sitio o canal. El tour avanza al hacer clic.',
      side: 'bottom',
      align: 'start',
    },
  },
  // 7. ACTION: click a visitor to start a chat
  {
    element: '[data-tour="visitor-item-first"]',
    route: '/visitors',
    mode: 'action',
    awaitClick: true,
    popover: {
      title: 'Abre el panel de un visitante',
      description:
        'Solo para practicar — haz clic en cualquier visitante para ver su panel. El tour avanza y no iniciará ningún chat real.',
      side: 'top',
      align: 'center',
    },
  },
  // 8. Wrap-up
  {
    element: '[data-tour="sidebar-header"]',
    route: '/inbox',
    popover: {
      title: 'Listo para atender',
      description:
        'Ya conoces lo esencial. Recuerda que puedes volver a lanzar este tour desde el botón "Tour de la app" del menú lateral.',
      side: 'right',
      align: 'start',
    },
  },
];
