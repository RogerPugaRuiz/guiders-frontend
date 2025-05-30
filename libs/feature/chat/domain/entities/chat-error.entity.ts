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
  constructor(chatId: string) {
    super(`Chat with ID ${chatId} not found`, 'CHAT_NOT_FOUND', 404);
    this.name = 'ChatNotFoundError';
  }
}

export class ChatAccessDeniedError extends ChatError {
  constructor(chatId: string) {
    super(`Access denied to chat ${chatId}`, 'CHAT_ACCESS_DENIED', 403);
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
  constructor() {
    super('No more messages available', 'PAGINATION_END', 204);
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
  constructor() {
    super('User is not authenticated', 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class NetworkError extends ChatError {
  constructor(originalError?: Error) {
    super(
      `Network error: ${originalError?.message || 'Connection failed'}`,
      'NETWORK_ERROR',
      500
    );
    this.name = 'NetworkError';
  }
}