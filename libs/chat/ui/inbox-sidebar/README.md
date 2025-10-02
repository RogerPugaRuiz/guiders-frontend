# guiders-frontend/chat/ui/inbox-sidebar

Componente UI standalone para el panel lateral completo del inbox, incluyendo header y lista de conversaciones.

- **Dominio:** chat
- **Tipo:** UI  
- **Stack:** Angular standalone, SCSS, Signals
- **Accesibilidad:** Soporta navegación por teclado y roles semánticos

## Uso

```html
<guiders-inbox-sidebar
  [conversations]="conversations"
  [selectedConversationId]="selectedId"
  [title]="'Mis Conversaciones'"
  [showNewChatButton]="true"
  (conversationSelected)="onConversationSelect($event)"
  (newChatClicked)="onNewChat()"
></guiders-inbox-sidebar>
```

## Inputs

- `conversations: Chat[]` — Lista de conversaciones a mostrar
- `selectedConversationId: string | null` — ID de la conversación seleccionada  
- `title: string` — Título del panel lateral (default: 'Conversaciones')
- `showNewChatButton: boolean` — Mostrar botón de nueva conversación (default: true)

## Outputs

- `conversationSelected: Chat` — Evento al seleccionar una conversación
- `newChatClicked: void` — Evento al hacer clic en nueva conversación

## Dependencias

- `@guiders-frontend/chat/ui/conversation-list`
- `@guiders-frontend/button` 
- `@guiders-frontend/icon`
- `@guiders-frontend/shared/types`