// Mock for @libs/feature/auth
export class AuthRepositoryPort {
  login = jest.fn();
  logout = jest.fn();
  refreshToken = jest.fn();
  validateToken = jest.fn();
}

export class LoginUseCase {
  execute = jest.fn();
}

export class LogoutUseCase {
  execute = jest.fn();
}

export class RefreshTokenUseCase {
  execute = jest.fn();
}

export class ValidateTokenUseCase {
  execute = jest.fn();
}