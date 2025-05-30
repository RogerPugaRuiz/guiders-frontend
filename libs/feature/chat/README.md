# Feature Chat - Implementación de Chat con Arquitectura Hexagonal

Esta biblioteca implementa la funcionalidad de chat siguiendo los principios de arquitectura hexagonal, manteniendo la lógica de negocio independiente de frameworks específicos.

## 🏗️ Estructura

```bash
/libs/feature/chat/
├── domain/                  # Casos de uso, entidades y puertos (sin Angular/RxJS)
│   ├── entities/           # Chat, Message, PaginatedResponse, etc.
│   ├── ports/              # ChatRepositoryPort
│   └── use-cases/          # GetChatsUseCase, GetMessagesUseCase, etc.
├── application/            # Servicios de aplicación y orquestadores
│   └── use-cases/          # ChatService
└── index.ts               # Exportaciones públicas
```

## 🚀 Funcionalidades Implementadas

### Casos de Uso del Dominio

1. **GetChatsUseCase**: Obtiene la lista de chats del usuario autenticado
2. **GetMessagesUseCase**: Obtiene mensajes paginados de un chat específico  
3. **GetChatByIdUseCase**: Obtiene información de un chat por ID
4. **StartChatUseCase**: Inicia un chat (para visitantes)

### Entidades del Dominio

- **Chat**: Representa una conversación con participantes, estado y metadatos
- **Message**: Representa un mensaje individual con contenido, remitente y timestamp
- **Participant**: Representa un participante del chat con rol y estado online
- **PaginatedResponse**: Estructura genérica para respuestas paginadas
- **Error Entities**: Errores específicos del dominio (ChatNotFoundError, ValidationError, etc.)

### Puerto del Repositorio

- **ChatRepositoryPort**: Interface que define las operaciones de chat que deben implementar las capas de infraestructura

## 📋 API Backend Referenciada

Basado en el controlador NestJS del backend:

- `GET /chats` - Lista chats del usuario autenticado (rol: commercial)
- `GET /chat/:chatId/messages` - Obtiene mensajes paginados (rol: visitor, commercial)
- `GET /chat/:chatId` - Obtiene información del chat (rol: visitor, commercial)
- `POST /chat/:chatId` - Inicia chat (rol: visitor)

## 🎯 Implementación por Aplicación

### Guiders (pendiente)

- Deberá implementar `HttpChatRepository` en `guiders/src/app/features/chat/infrastructure/`
- Configurar endpoints: `/api/chat/*`
- Definir tokens de inyección específicos

### Backoffice (futuro)

- Podría tener su propia implementación con diferentes endpoints
- Lógica específica para backoffice
- Sus propios tokens de inyección

## ⚠️ Manejo de Errores

La implementación incluye errores específicos del dominio:

- `ChatNotFoundError`: Chat no encontrado (404)
- `ChatAccessDeniedError`: Acceso denegado (403)
- `MessageNotFoundError`: Mensaje no encontrado (404)
- `PaginationEndError`: No hay más mensajes (204)
- `ValidationError`: Errores de validación (400)
- `UnauthorizedError`: Usuario no autenticado (401)
- `NetworkError`: Errores de red (500)

## 💡 Uso

```typescript
import { ChatService, ChatRepositoryPort } from '@libs/feature/chat';

// En la capa de infraestructura de cada app
class HttpChatRepository implements ChatRepositoryPort {
  // implementación específica
}

// Uso del servicio
const chatRepository = new HttpChatRepository();
const chatService = new ChatService(chatRepository);

// Obtener chats
const chats = await chatService.getChats({ limit: 20 });

// Obtener mensajes
const messages = await chatService.getMessages({ chatId: 'chat-id', limit: 10 });

// Obtener chat por ID
const chat = await chatService.getChatById({ chatId: 'chat-id' });
```

## 📋 Próximos Pasos

1. **Implementación Infrastructure**: Crear HttpChatRepository en guiders
2. **Testing**: Implementar tests unitarios para casos de uso
3. **Integración**: Integrar con componentes de chat existentes
4. **WebSocket**: Añadir soporte para mensajes en tiempo real
5. **Validaciones avanzadas**: Mejorar validaciones de dominio
6. **Documentación API**: Documentar endpoints esperados

## 🔍 Beneficios de esta Arquitectura

1. **Independencia de frameworks**: Lógica pura sin dependencias de Angular/RxJS
2. **Portabilidad**: Puede reutilizarse en aplicaciones móviles, Node.js, etc.
3. **Testabilidad**: Tests simples sin mocks complejos
4. **Flexibilidad**: Cada app puede tener su implementación específica
5. **Separación clara**: Dominio, aplicación e infraestructura bien definidos