# Feature Chat - Implementación de Chat con Arquitectura Hexagonal

Esta biblioteca implementa la funcionalidad de chat siguiendo los principios de arquitectura hexagonal, manteniendo la lógica de negocio independiente de frameworks específicos.

## 🏗️ Estructura

```bash
./libs/feature/chat/
├── domain/                  # Entidades y puertos (sin Angular/RxJS)
│   ├── entities/           # Chat, Message, PaginatedResponse, etc.
│   └── ports/              # ChatRepositoryPort
├── application/            # SOLO casos de uso (sin servicios)
│   └── use-cases/          # GetChatsUseCase, GetMessagesUseCase, etc.
└── index.ts               # Exportaciones públicas
```

> **⚠️ IMPORTANTE**: Los **servicios son específicos de Angular** y deben ir en los proyectos `guiders/` o `backoffice/`, **NO en libs**.
> La capa de aplicación en libs **SOLO puede contener casos de uso**.

## 🚀 Funcionalidades Implementadas

### Casos de Uso (Application Layer)

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

### Guiders ✅ IMPLEMENTADO

**Angular Services (capa de presentación):**
- `guiders/src/app/core/services/chat.service.ts` - Servicio Angular que orquesta los casos de uso

**Infrastructure (capa de infraestructura):**
- `guiders/src/app/features/chat/infrastructure/repositories/http-chat.repository.ts` - Implementación HTTP
- `guiders/src/app/features/chat/infrastructure/chat-config.providers.ts` - Configuración de tokens de inyección
- Endpoints: `/api/chat/*`

### Backoffice (futuro)

**Deberá implementar su propia infraestructura:**
- `backoffice/src/app/core/services/chat.service.ts` - Servicio Angular específico
- `backoffice/src/app/features/chat/infrastructure/` - Su propia implementación de repositorio
- Podría tener diferentes endpoints o lógica específica para backoffice

## ⚠️ Manejo de Errores

La implementación incluye errores específicos del dominio:

- `ChatNotFoundError`: Chat no encontrado (404)
- `ChatAccessDeniedError`: Acceso denegado (403)
- `MessageNotFoundError`: Mensaje no encontrado (404)
- `PaginationEndError`: No hay más mensajes (204)
- `ValidationError`: Errores de validación (400)
- `UnauthorizedError`: Usuario no autenticado (401)
- `NetworkError`: Errores de red (500)

## 💡 Uso Correcto

### En libs (SOLO casos de uso)
```typescript
// ❌ INCORRECTO - No crear servicios en libs
export class ChatService { ... }

// ✅ CORRECTO - Solo casos de uso
export class GetChatsUseCase {
  constructor(private chatRepository: ChatRepositoryPort) {}
  async execute(params?: GetChatsParams): Promise<ChatListResponse> { ... }
}
```

### En guiders/backoffice (Servicios Angular)
```typescript
// ✅ CORRECTO - Servicios Angular en aplicaciones específicas
@Injectable({ providedIn: 'root' })
export class ChatService {
  private getChatsUseCase = inject(GET_CHATS_USE_CASE_TOKEN);
  
  getChats(params?: GetChatsParams): Observable<ChatListResponse> {
    return from(this.getChatsUseCase.execute(params));
  }
}
```

### Implementación de repositorio
```typescript
// En guiders/infrastructure/repositories/
@Injectable()
export class HttpChatRepository implements ChatRepositoryPort {
  async getChats(params?: GetChatsParams): Promise<ChatListResponse> {
    // Implementación HTTP específica de Guiders
  }
}
```

## 📋 Próximos Pasos

1. **Testing**: Implementar tests unitarios para casos de uso
2. **Integración**: Integrar con componentes de chat existentes
3. **WebSocket**: Añadir soporte para mensajes en tiempo real
4. **Backoffice**: Implementar infraestructura para backoffice cuando sea necesario
5. **Validaciones avanzadas**: Mejorar validaciones de dominio
6. **Documentación API**: Documentar endpoints esperados

## 🔍 Beneficios de esta Arquitectura

1. **Separación clara**: 
   - **libs**: Solo lógica de negocio pura (casos de uso, entidades, puertos)
   - **guiders/backoffice**: Implementaciones específicas (servicios Angular, repositorios HTTP)

2. **Independencia de frameworks**: Lógica pura sin dependencias de Angular/RxJS en libs
3. **Portabilidad**: Casos de uso pueden reutilizarse en aplicaciones móviles, Node.js, etc.
4. **Testabilidad**: Tests simples sin mocks complejos para casos de uso
5. **Flexibilidad**: Cada app puede tener su implementación específica de repositorio y servicios