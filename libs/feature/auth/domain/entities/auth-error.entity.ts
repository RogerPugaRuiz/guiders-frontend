export class AuthenticationError extends Error {
  constructor(message: string = 'Error de autenticación') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  public readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class SessionExpiredError extends Error {
  constructor(message: string = 'La sesión ha expirado') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'No autorizado') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
