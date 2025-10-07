# guiders-frontend/chat/ui/chat-welcome-state

Componente UI standalone para el estado de bienvenida del chat cuando no hay conversación seleccionada.

- **Dominio:** chat
- **Tipo:** UI  
- **Stack:** Angular standalone, SCSS, Animaciones CSS
- **Accesibilidad:** Soporta navegación por teclado, prefers-reduced-motion

## Uso

```html
<guiders-chat-welcome-state
  [title]="'Selecciona una conversación'"
  [description]="'Elige una conversación de la lista para comenzar a chatear'"
  [iconName]="'message-circle'"
  [showNewChatButton]="false"
  [newChatButtonText]="'Nueva conversación'"
  (newChatClicked)="onNewChat()"
></guiders-chat-welcome-state>
```

## Inputs

- `title: string` — Título del estado de bienvenida (default: 'Selecciona una conversación')
- `description: string` — Descripción explicativa (default: texto por defecto)  
- `iconName: string` — Nombre del ícono a mostrar (default: 'message-circle')
- `showNewChatButton: boolean` — Mostrar botón de nueva conversación (default: false)
- `newChatButtonText: string` — Texto del botón (default: 'Nueva conversación')

## Outputs

- `newChatClicked: void` — Evento al hacer clic en nueva conversación

## Características

- **Responsive:** Se adapta a diferentes tamaños de pantalla
- **Animación sutil:** El ícono tiene una animación suave (respeta prefers-reduced-motion)
- **Centrado:** Contenido centrado vertical y horizontalmente
- **Configurable:** Todos los textos e ícono son personalizables

## Dependencias

- `@guiders-frontend/icon`
- `@guiders-frontend/button`