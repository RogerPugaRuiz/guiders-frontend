# Ejemplo de URLs generadas por ChatService

## URLs que genera el servicio:

### Desarrollo (localhost):
```
Base URL: http://localhost:3000/api/v2

Obtener chats de comercial:
http://localhost:3000/api/v2/chats/commercial/d9b32cfd-f838-4764-b03f-465ed59ce245?limit=50&sort=%7B%22field%22%3A%22lastMessageDate%22%2C%22direction%22%3A%22DESC%22%7D

Obtener chat específico:
http://localhost:3000/api/v2/chats/{chatId}

Crear chat:
POST http://localhost:3000/api/v2/chats

Obtener mensajes:
http://localhost:3000/api/v2/messages/chat/{chatId}

Enviar mensaje:
POST http://localhost:3000/api/v2/messages
```

### Producción (guiders.es):
```
Base URL: https://guiders.es/api/v2

Obtener chats de comercial:
https://guiders.es/api/v2/chats/commercial/d9b32cfd-f838-4764-b03f-465ed59ce245?limit=50&sort=%7B%22field%22%3A%22lastMessageDate%22%2C%22direction%22%3A%22DESC%22%7D

Obtener chat específico:
https://guiders.es/api/v2/chats/{chatId}

Crear chat:
POST https://guiders.es/api/v2/chats

Obtener mensajes:
https://guiders.es/api/v2/messages/chat/{chatId}

Enviar mensaje:
POST https://guiders.es/api/v2/messages
```

## Ejemplo de uso del servicio:

```typescript
// Obtener chats con ordenamiento por última fecha de mensaje
this.chatService.getCommercialChats('d9b32cfd-f838-4764-b03f-465ed59ce245', {
  limit: 50,
  sort: {
    field: 'lastMessageDate',
    direction: 'DESC'
  }
}).subscribe(chats => {
  console.log('Chats obtenidos:', chats);
});
```

El parámetro `sort` se serializará automáticamente como JSON:
`sort=%7B%22field%22%3A%22lastMessageDate%22%2C%22direction%22%3A%22DESC%22%7D`