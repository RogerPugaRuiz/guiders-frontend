# guiders-frontend/chat/ui/chat-placeholder

Componente UI standalone para el placeholder mostrado cuando hay un chat seleccionado pero la interfaz real no está disponible.

- **Dominio:** chat
- **Tipo:** UI  
- **Stack:** Angular standalone, SCSS, Estados visuales
- **Accesibilidad:** Soporta navegación por teclado, roles semánticos

## Uso

```html
<guiders-chat-placeholder
  [selectedChat]="currentChat"
  [showActions]="true"
  [placeholderMessage]="'Interfaz de chat en desarrollo'"
  (settingsClicked)="onChatSettings()"
  (closeChat)="onCloseChat()"
></guiders-chat-placeholder>
```

## Inputs

- `selectedChat: Chat` — Chat seleccionado (requerido)
- `showActions: boolean` — Mostrar botones de acción en header (default: true)
- `placeholderMessage: string` — Mensaje informativo personalizado

## Outputs

- `settingsClicked: void` — Evento al hacer clic en configuración
- `closeChat: void` — Evento al hacer clic en cerrar chat

## Características

- **Header dinámico:** Muestra nombre del chat y estado visual
- **Estados de chat:** Colores diferentes por estado (ACTIVE, PENDING, CLOSED, etc.)
- **Acciones opcionales:** Botones de configuración y cerrar (configurables)
- **Información de debug:** Muestra ID del chat para desarrollo
- **Responsive:** Se adapta a diferentes tamaños de pantalla

## Estados visuales

- **ACTIVE:** Verde con ícono de círculo
- **PENDING:** Amarillo con ícono de reloj  
- **CLOSED:** Gris con ícono X
- **TRANSFERRED/ASSIGNED:** Azul con íconos específicos

## Dependencias

- `@guiders-frontend/button`
- `@guiders-frontend/icon`
- `@guiders-frontend/shared/types`