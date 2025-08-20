# Guiders Frontend - AI Agent Instructions

## 🏗️ Architecture Overview

This is a **real-time chat platform** built with **Angular 20** using **strict hexagonal architecture** and **monorepo structure**. The platform enables commercial agents to chat with website visitors in real-time.

### Key Components
- **Real-time Chat**: WebSocket-based messaging with duplicate detection
- **Lead Management**: Visitor tracking and conversion
- **Analytics**: User behavior and interaction metrics
- **Authentication**: JWT-based auth with automatic token refresh

## 📁 Project Structure

```
guiders-frontend/
├── guiders-20/           # Main Angular 20 application
│   ├── src/app/
│   │   ├── core/         # Infrastructure layer (Angular-specific)
│   │   ├── features/     # Feature modules (UI + infrastructure)
│   │   └── shared/       # Shared components
└── libs/                 # Domain + Application layers (framework-agnostic)
    └── feature/
        ├── auth/         # Authentication domain
        └── chat/         # Chat domain
```

## 🔧 Development Commands

### Starting the application
```bash
# Root level (recommended)
npm run start:guiders-20

# Or with HMR
npm run start:guiders-20:hmr

# Or from app directory
cd guiders-20 && npm start
```

### Building
```bash
# Development build
npm run build:guiders-20

# Production build
npm run build:guiders-20:prod
```

### Testing
```bash
# Jest Unit Tests (Primary testing framework)
npm run test:jest:guiders-20

# Cypress E2E Tests
npm run test:cypress:guiders-20              # Interactive mode
npm run test:cypress:headless:guiders-20     # Headless mode
npm run test:cypress:open:guiders-20         # Open Cypress test runner

# Shell scripts for comprehensive testing
./run-all-tests.sh      # All tests (unit + e2e)
./run-unit-tests.sh     # Unit tests only
./run-e2e-tests.sh      # E2E tests
```

### Code Quality
```bash
# ESLint
npm run lint:guiders-20
```

### Available Root Scripts
All scripts are defined in the root `package.json` and delegate to the `guiders-20` application:

- `start:guiders-20` - Start development server
- `start:guiders-20:hmr` - Start with Hot Module Replacement
- `build:guiders-20` - Development build
- `build:guiders-20:prod` - Production build
- `test:jest:guiders-20` - **Jest unit tests** (primary testing framework)
- `test:cypress:guiders-20` - Cypress E2E tests
- `test:cypress:headless:guiders-20` - Headless Cypress tests
- `test:cypress:open:guiders-20` - Open Cypress test runner
- `lint:guiders-20` - ESLint code quality check

## 🏛️ Hexagonal Architecture Rules

### ❌ What NOT to do:
- **Never put Angular services in `libs/`** - they belong in `guiders-20/src/app/`
- **Never import RxJS/Angular in `libs/domain/` or `libs/application/`**
- **Never put framework-specific code in use cases**

### ✅ What TO do:
- **Domain entities**: `libs/feature/*/domain/entities/`
- **Use cases**: `libs/feature/*/application/use-cases/`
- **Ports (interfaces)**: `libs/feature/*/domain/ports/`
- **Angular services**: `guiders-20/src/app/core/services/`
- **Infrastructure**: `guiders-20/src/app/core/adapters/`

### Example: Adding a new feature
1. Create domain entities in `libs/feature/myfeature/domain/entities/`
2. Define ports in `libs/feature/myfeature/domain/ports/`
3. Create use cases in `libs/feature/myfeature/application/use-cases/`
4. Implement adapters in `guiders-20/src/app/core/adapters/`
5. Create Angular service in `guiders-20/src/app/core/services/`
6. Configure DI tokens in `guiders-20/src/app/core/config/`

## 💬 Real-time Chat Implementation

### WebSocket Service (`guiders-20/src/app/core/services/websocket.service.ts`)
- **Automatic reconnection** with exponential backoff
- **JWT authentication** via multiple methods (auth, query, headers)
- **Duplicate message protection** with message ID tracking
- **Event-specific listeners** to prevent duplicate processing

### Message Flow
```
Component → ChatService → UseCase → Port → Adapter → WebSocket
                                                      ↓
         Messages are processed through duplicate detection
```

### Key Integration Points
- **Authentication**: Token injection via `auth.interceptor.ts`
- **State Management**: `ChatStateService` using Angular signals
- **Real-time Updates**: WebSocket events trigger state updates

## 🔐 Authentication System

### JWT Token Management
- **Automatic refresh** when token is near expiration
- **Token validation** using `jwt.utils.ts`
- **Interceptor-based** auth header injection
- **SSR-safe** with platform detection

### Implementation Pattern
```typescript
// Use case in libs/
export class LoginUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}
  async execute(credentials: LoginCredentials): Promise<AuthResponse> {
    // Pure business logic only
  }
}

// Service in guiders-20/
@Injectable()
export class AuthService {
  private loginUseCase = inject(LOGIN_USE_CASE_TOKEN);
  
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(this.loginUseCase.execute(credentials));
  }
}
```

## 🧪 Testing Conventions

### Jest Unit Tests (Primary Framework)
- **Framework**: Jest is the primary testing framework for unit tests
- **Command**: `npm run test:jest:guiders-20` (runs from root)
- **Configuration**: `jest.config.js` in both root and `guiders-20/`
- **Setup**: Custom Jest setup in `guiders-20/src/setup-jest.ts`

### Test Organization
- **Use cases**: Test with mock repositories in `libs/feature/*/application/use-cases/`
- **Services**: Test Angular-specific behavior in `guiders-20/src/app/core/services/`
- **Components**: Test UI interactions and state changes
- **Adapters**: Test infrastructure adapters with mocked dependencies

### E2E Tests (Cypress)
- **Framework**: Cypress for end-to-end testing
- **Commands**: 
  - `npm run test:cypress:guiders-20` - Interactive mode
  - `npm run test:cypress:headless:guiders-20` - Headless execution
  - `npm run test:cypress:open:guiders-20` - Open test runner
- **Location**: E2E tests and configurations in project root
- **Mock services**: Available for isolated testing scenarios
- **Database cleanup**: Automated cleanup scripts included

### Testing Best Practices
- **Isolation**: Each test should be independent and not rely on others
- **Mocking**: Use Jest mocks for external dependencies
- **Coverage**: Aim for high test coverage, especially for business logic
- **WebSocket testing**: Mock WebSocket connections for unit tests

## 🔄 State Management

### Angular 20 Signals
- **Reactive state** using `signal()` and `computed()`
- **Effects** for side effects and WebSocket listeners
- **State services** for shared state across components

### Example Pattern
```typescript
// In component
selectedChat = signal<ChatData | null>(null);
canSendMessage = computed(() => 
  this.selectedChat() !== null && 
  this.messageText().trim().length > 0
);

// Effects for WebSocket
effect(() => {
  if (this.isConnected()) {
    this.setupWebSocketListeners();
  }
});
```

## 🌍 Environment Configuration

### Development
- API: `http://localhost:3000/api`
- WebSocket: `ws://localhost:3000`

### Production
- API: `https://guiders.ancoradual.com/api`
- WebSocket: `wss://guiders.ancoradual.com`

## 🚨 Common Pitfalls to Avoid

1. **Circular dependencies**: Follow the dependency flow from domain → application → infrastructure
2. **WebSocket duplicates**: Always check if listeners are already registered
3. **Memory leaks**: Use `takeUntil(destroy$)` for subscriptions
4. **SSR issues**: Use `isPlatformBrowser()` for browser-only code
5. **Token expiration**: The interceptor handles this automatically

## 📝 Code Style Guidelines

### File Naming
- **Entities**: `*.entity.ts`
- **Use cases**: `*.use-case.ts`
- **Services**: `*.service.ts`
- **Components**: `*.component.ts` (or just `.ts` for standalone)

### Component Structure
```typescript
@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [...],
  template: '...'
})
export class FeatureComponent {
  // Dependencies
  private service = inject(ServiceName);
  
  // Signals
  state = signal(initialValue);
  
  // Computed
  derivedState = computed(() => this.state().someProperty);
  
  // Methods
  onAction() { ... }
}
```

## 🔍 Debugging Tips

### WebSocket Issues
```typescript
// Check connection state
this.webSocketService.getConnectionDiagnostics()

// Monitor duplicate protection
this.webSocketService.getDuplicateProtectionStats()
```

### Authentication Issues
```typescript
// Check token expiration
import { isTokenExpired } from './core/utils/jwt.utils';
console.log(isTokenExpired(token));
```

This architecture ensures clean separation of concerns, testability, and maintainability while supporting real-time features and modern Angular patterns.

### Context7 para Documentación
Si te preguntan sobre documentación de lenguajes, frameworks o librerías, usa la herramienta `context7` para buscar la documentación oficial y proporcionar un resumen claro y conciso.

### Memoria
1. User Identification:
   - You should assume that you are interacting with default_user
   - If you have not identified default_user, proactively try to do so.

2. Memory Retrieval:
   - Always begin your chat by saying only "Remembering..." and retrieve all relevant information from your knowledge graph
   - Always refer to your knowledge graph as your "memory"

3. Memory
   - While conversing with the user, be attentive to any new information that falls into these categories:
     a) Basic Identity (age, gender, location, job title, education level, etc.)
     b) Behaviors (interests, habits, etc.)
     c) Preferences (communication style, preferred language, etc.)
     d) Goals (goals, targets, aspirations, etc.)
     e) Relationships (personal and professional relationships up to 3 degrees of separation)

4. Memory Update:
   - If any new information was gathered during the interaction, update your memory as follows:
     a) Create entities for recurring organizations, people, and significant events
     b) Connect them to the current entities using relations
     b) Store facts about them as observations