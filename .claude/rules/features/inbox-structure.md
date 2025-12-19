# Inbox Structure - Component Hierarchy

## Description

Mapa completo de componentes y flujo de datos de la funcionalidad **Inbox** (bandeja de entrada de chats).

**⚠️ CRITICAL**: Cuando el usuario reporte problemas en "/inbox" o mencione que algo "no funciona en inbox", SIEMPRE consultar este documento PRIMERO antes de asumir qué componente está fallando.

## File Locations

```
libs/chat/features/inbox/
└── src/lib/inbox/
    ├── inbox.ts              # Coordinador principal
    ├── inbox.html            # Template principal
    └── inbox.scss

Componentes UI utilizados:
- libs/chat/ui/inbox-sidebar/
- libs/chat/ui/conversation-list/
- libs/chat/ui/conversation-item/
- libs/chat/ui/chat-placeholder/
- libs/chat/ui/chat-welcome-state/
- libs/chat/ui/visitor-detail-panel/
```

## Component Hierarchy

```
Inbox (inbox.ts) - SMART COMPONENT
│
├─── [LEFT SIDEBAR] ────────────────────────────────────
│    GuidersInboxSidebarComponent (inbox-sidebar.ts)
│    │  Role: Container pasivo
│    │  Props IN: conversations, selectedConversationId, presenceMap
│    │  Events OUT: conversationSelected, newChatClicked
│    │
│    └─── GuidersConversationListComponent (conversation-list.ts)
│         │  Role: Iterador pasivo
│         │  Props IN: conversations[], selectedConversationId, presenceMap
│         │  Events OUT: conversationSelected
│         │
│         └─── ConversationItem (conversation-item.ts) [REPEATED]
│              │  Role: Item individual (DUMB COMPONENT)
│              │  Props IN: conversation, isSelected, participantPresenceStatus
│              │  Events OUT: conversationSelected
│              │
│              └─── RENDERS:
│                   - Avatar (guiders-avatar)
│                   - Chat name: getChatDisplayName() ← getVisitorDisplayName()
│                   - Preview: getChatPreview()
│                   - Unread badge: conversation().unreadCount
│                   - Time: formatChatTime()
│
├─── [CENTER - WELCOME STATE] ──────────────────────────
│    GuidersChatWelcomeStateComponent (chat-welcome-state.ts)
│    │  Visible: cuando NO hay chat seleccionado
│    │  Role: Estado vacío
│    │
│    └─── RENDERS:
│         - Mensaje de bienvenida
│         - Instrucciones
│
├─── [CENTER - CHAT VIEW] ──────────────────────────────
│    GuidersChatPlaceholderComponent (chat-placeholder.ts)
│    │  Visible: cuando HAY chat seleccionado
│    │  Role: Vista completa del chat (DUMB COMPONENT)
│    │  Props IN: selectedChat, messages[], currentUserId, isLoading,
│    │            hasMoreMessages, isLoadingMore, isPanelOpen, siteId
│    │  Events OUT: messageSent, settingsClicked, closeChat, loadMoreMessages
│    │
│    ├─── HEADER:
│    │    - Avatar (guiders-avatar)
│    │    - Chat name: getChatDisplayName() ← getVisitorDisplayName()
│    │    - Presence status: getParticipantPresenceStatus()
│    │    - Action buttons (settings, close)
│    │
│    ├─── MESSAGES AREA:
│    │    - Date separators: shouldShowDateSeparator()
│    │    - Message bubbles
│    │    - Sender labels: getSenderLabel() ← getVisitorDisplayName()
│    │    - Scroll infinito (IntersectionObserver)
│    │
│    └─── MESSAGE INPUT:
│         - MessageInput component
│         - AI suggestions (if siteId present)
│
└─── [RIGHT PANEL] ─────────────────────────────────────
     VisitorDetailPanel (visitor-detail-panel.ts)
     │  Visible: cuando isPanelOpen = true
     │  Role: Detalles del visitante
     │  Props IN: visitor, isOpen, savingContactData
     │  Events OUT: closePanel, saveContactData
     │
     └─── RENDERS:
          - Visitor info
          - Contact form
          - Activity history
```

## Data Flow

### Props Down (Top → Bottom)

```typescript
Inbox
├─ conversations: Chat[]               → InboxSidebar → ConversationList → ConversationItem
├─ selectedConversationId: string      → InboxSidebar → ConversationList → ConversationItem
├─ presenceMap: Record<string, Status> → InboxSidebar → ConversationList → ConversationItem
├─ selectedChat: Chat                  → ChatPlaceholder
├─ messages: Message[]                 → ChatPlaceholder
├─ currentUserId: string               → ChatPlaceholder
├─ isLoading: boolean                  → ChatPlaceholder
├─ hasMoreMessages: boolean            → ChatPlaceholder
├─ isLoadingMore: boolean              → ChatPlaceholder
├─ showVisitorPanel: boolean           → VisitorDetailPanel
├─ selectedVisitor: Visitor            → VisitorDetailPanel
└─ siteId: string                      → ChatPlaceholder → MessageInput
```

### Events Up (Bottom → Top)

```typescript
ConversationItem
└─ conversationSelected(chat) → ConversationList
   └─ conversationSelected(chat) → InboxSidebar
      └─ conversationSelected(chat) → Inbox.onUserSelected()

ChatPlaceholder
├─ messageSent(content) → Inbox.onSendMessage()
├─ settingsClicked() → Inbox.toggleVisitorPanel()
├─ closeChat() → Inbox.onCloseChat()
└─ loadMoreMessages() → Inbox.onLoadMoreMessages()

VisitorDetailPanel
├─ closePanel() → Inbox.onCloseVisitorPanel()
└─ saveContactData(data) → Inbox.onSaveContactData()
```

## Smart vs Dumb Components

### Smart (Business Logic)

| Component | Responsibilities |
|-----------|------------------|
| **Inbox** | - Cargar chats del backend<br>- Gestionar estado global<br>- Coordinar WebSocket<br>- Manejar selección de chat<br>- Sincronizar unread counts<br>- Gestionar presencia |

### Dumb (Presentational)

| Component | Responsibilities |
|-----------|------------------|
| **InboxSidebar** | Pasar props y eventos |
| **ConversationList** | Iterar conversaciones |
| **ConversationItem** | Renderizar item individual |
| **ChatPlaceholder** | Renderizar vista de chat |
| **ChatWelcomeState** | Mostrar estado vacío |
| **VisitorDetailPanel** | Mostrar detalles del visitante |

## Display Name Logic

**CRITICAL**: El nombre del visitante se obtiene mediante la función centralizada `getVisitorDisplayName()` de `@guiders-frontend/visitor-display-name`.

### Ubicaciones donde se renderiza el nombre:

1. **ConversationItem** (lista de conversaciones):
   - Método: `getChatDisplayName()`
   - Template: `conversation-item.html` línea 16
   - Llama a: `getVisitorDisplayName({ id, name, email })`

2. **ChatPlaceholder** (header del chat):
   - Método: `getChatDisplayName()`
   - Template: `chat-placeholder.html` líneas 15, 134
   - Llama a: `getVisitorDisplayName({ id, name, email })`

3. **ChatPlaceholder** (etiquetas de mensajes):
   - Método: `getSenderLabel(message)`
   - Template: dentro de message loop
   - Llama a: `getVisitorDisplayName({ id, name, email })`

### Lógica de Fallback:

```typescript
// 1. Nombre real (excluyendo genéricos)
if (name && !['Visitante', 'Chat sin título', ...].includes(name)) {
  return name;
}

// 2. Email
if (email) {
  return email;
}

// 3. ID del visitante
if (id) {
  return `Visitante #${id.slice(-8)}`; // Últimos 8 caracteres
}

// 4. Fallback final
return 'Visitante anónimo';
```

## Common Issues & Debugging

### Issue: "No veo el cambio en el nombre del visitante"

**Checklist**:
1. ✅ Verificar que `getVisitorDisplayName()` está importada en todos los componentes
2. ✅ Confirmar que los métodos `getChatDisplayName()` y `getSenderLabel()` usan la función
3. ✅ Revisar que el template HTML llama a estos métodos
4. ✅ Verificar en Network tab qué datos vienen del backend (participant.name)
5. ✅ Si `participant.name = "Visitante"`, confirmar que está en la lista de `genericNames`
6. ✅ Hard refresh del navegador (Ctrl+Shift+R)

### Issue: "La lista de conversaciones no se actualiza"

**Checklist**:
1. ✅ Verificar que `Inbox.conversations` signal está actualizado
2. ✅ Confirmar que InboxSidebar recibe las conversaciones: `[conversations]="conversations()"`
3. ✅ Verificar que ConversationList itera correctamente: `@for (conversation of conversations())`
4. ✅ Revisar ChangeDetectionStrategy (debe ser OnPush en todos)
5. ✅ Verificar que WebSocket está conectado: `chatService.webSocketService.connectionState$`

### Issue: "Los mensajes no se muestran"

**Checklist**:
1. ✅ Verificar que `Inbox.messagesMap` tiene datos para el chatId
2. ✅ Confirmar que `Inbox.currentMessages` computed retorna mensajes
3. ✅ Verificar que ChatPlaceholder recibe: `[messages]="currentMessages()"`
4. ✅ Revisar el template de chat-placeholder.html: `@for (message of messages)`
5. ✅ Verificar WebSocket listener: `chatService.messages$` subscription

## Services Used by Inbox

| Service | Purpose |
|---------|---------|
| `ChatService` | Obtener chats, mensajes, enviar mensajes, WebSocket |
| `SessionService` | Usuario actual, autenticación |
| `UnreadMessagesService` | Contadores de no leídos, active chat |
| `PresenceService` | Estado de presencia online/offline |
| `VisitorsDataService` | Actividad del visitante, URL actual, siteId |
| `LeadContactService` | Guardar datos de contacto |

## Quick Reference Commands

```bash
# Ver toda la estructura de inbox
find libs/chat/features/inbox -type f -name "*.ts" -o -name "*.html"

# Buscar dónde se renderiza texto
grep -r "Visitante" libs/chat/ui/ --include="*.html"

# Ver jerarquía de imports
grep "import.*from '@guiders-frontend" libs/chat/features/inbox/src/lib/inbox/inbox.ts

# Ver qué componentes usa ChatPlaceholder
grep "selector:" libs/chat/ui/chat-placeholder/src/lib/chat-placeholder/chat-placeholder.ts
```

## Anti-patterns

❌ **NEVER** asumir que el problema está en un componente sin verificar:
  1. Qué datos vienen del backend
  2. Qué componente renderiza el elemento visual problemático
  3. El flujo completo de datos desde Inbox hasta el componente

❌ **NEVER** modificar solo un componente sin trazar el flujo completo

✅ **ALWAYS** consultar este documento cuando el usuario mencione problemas en "/inbox"

✅ **ALWAYS** verificar los datos en Network tab antes de modificar código

✅ **ALWAYS** buscar el texto literal en templates HTML, no solo en TypeScript
