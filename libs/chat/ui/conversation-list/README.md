# guiders-frontend/chat/ui/conversation-list

Componente UI standalone para mostrar la lista de conversaciones en el chat, usando ConversationItem.

- **Dominio:** chat
- **Tipo:** UI
- **Stack:** Angular standalone, SCSS, Signals
- **Accesibilidad:** Soporta navegación por teclado y roles semánticos

## Uso

```html
<guiders-conversation-list
  [conversations]="conversations"
  [selectedConversationId]="selectedId"
  (conversationSelected)="onSelect($event)"
></guiders-conversation-list>
```

## Inputs
- `conversations: Conversation[]` — Lista de conversaciones
- `selectedConversationId: string | null` — ID de la conversación seleccionada

## Outputs
- `conversationSelected: Conversation` — Evento al seleccionar una conversación

## Dependencias
- `@guiders-frontend/chat/ui/conversation-item`
- `@guiders-frontend/shared/types`
