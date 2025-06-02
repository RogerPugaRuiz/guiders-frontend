export class ChatError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

export class ChatNotFoundError extends ChatError {
  constructor(chatIdOrMessage: string) {
    // Detectar si es un ID de chat o un mensaje completo
    const message = chatIdOrMessage.includes('not found') 
      ? chatIdOrMessage 
      : `Chat with ID ${chatIdOrMessage} not found`;
    
    super(message, 'CHAT_NOT_FOUND', 404);
    this.name = 'ChatNotFoundError';
  }
}

export class ChatAccessDeniedError extends ChatError {
  constructor(chatIdOrMessage: string) {
    // Detectar si es un ID de chat o un mensaje completo
    const message = chatIdOrMessage.includes('acceso') || chatIdOrMessage.includes('permisos')
      ? chatIdOrMessage 
      : `Access denied to chat ${chatIdOrMessage}`;
    
    super(message, 'CHAT_ACCESS_DENIED', 403);
    this.name = 'ChatAccessDeniedError';
  }
}

export class MessageNotFoundError extends ChatError {
  constructor(messageId: string) {
    super(`Message with ID ${messageId} not found`, 'MESSAGE_NOT_FOUND', 404);
    this.name = 'MessageNotFoundError';
  }
}

export class PaginationEndError extends ChatError {
  constructor(message: string = 'No more messages available') {
    super(message, 'PAGINATION_END', 204);
    this.name = 'PaginationEndError';
  }
}

export class ValidationError extends ChatError {
  constructor(field: string, message: string) {
    super(`Validation error on ${field}: ${message}`, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ChatError {
  constructor(message: string = 'User is not authenticated') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class NetworkError extends ChatError {
  constructor(originalError?: Error | string) {
    super(
      typeof originalError === 'string' 
        ? originalError
        : `Network error: ${originalError?.message || 'Connection failed'}`,
      'NETWORK_ERROR',
      500
    );
    this.name = 'NetworkError';
  }
}