# Story 8.10: Add Iframe Init APP_INITIALIZER to App Config

Status: review

## Story

As an **embedded iframe application**,
I want the `/iframe/init` endpoint to be called during app startup via APP_INITIALIZER,
so that the iframe is fully initialized and ready before the first render.

## Context

Story 8-10 creates the APP_INITIALIZER factory that preloads iframe initialization data before the Angular app renders. This decouples the init call from the IframeShellComponent (story 8-9), making the init reusable and ensuring it's called at the earliest possible moment in the bootstrap sequence.

**Architecture alignment:**
- `iframe-init.initializer.ts` is listed in the architecture file at line 717 under `libs/shared/data-access/iframe/src/lib/iframe-init/`
- The APP_INITIALIZER pattern in `app.config.ts` follows the same pattern as `initializeApp()` and `initializeSessionGuardian()` already present in the console app

## Acceptance Criteria

1. [x] **APP_INITIALIZER factory created**: `libs/shared/data-access/iframe/src/lib/iframe-init/iframe-init.initializer.ts` with a factory function that calls `IframeInitService.initialize()`
2. [x] **Factory pattern**: Uses the same `() => { ... }` arrow function pattern as `initializeApp()` and `initializeSessionGuardian()` in `apps/console/src/app/app.config.ts`
3. [x] **Error handling**: Factory catches errors and logs them without blocking app startup (consistent with existing `initializeApp` behavior)
4. [x] **App config updated**: The `APP_INITIALIZER` is registered in `apps/console/src/app/app.config.ts` (MVP scope - console app only)
5. [x] **Exports**: The initializer factory is exported from `libs/shared/data-access/iframe/src/lib/iframe-init/index.ts`
6. [x] **Vitest unit tests**: Tests verify the factory handles success and error cases correctly
7. [x] **Lint**: `nx lint iframe-data-access` passes with 0 errors (or relevant library)

## Dev Notes

### Project Structure

```
libs/shared/data-access/iframe/src/lib/iframe-init/
├── iframe-init.service.ts           # (existing from story 8-5)
├── iframe-init.initializer.ts      # (NEW - this story)
├── iframe-init.service.spec.ts     # (existing from story 8-5)
└── index.ts                        # (update to export initializer)
```

### APP_INITIALIZER Pattern

The factory should follow the established pattern from `initializeApp()`:

```typescript
function initializeIframeInit() {
  const iframeInitService = inject(IframeInitService);

  return async () => {
    console.log('[AppInitializer] 🔧 Inicializando iframe...');
    try {
      const result = await firstValueFrom(iframeInitService.initialize());
      if (result.ok) {
        console.log('[AppInitializer] ✅ Iframe inicializado correctamente');
      } else {
        console.warn('[AppInitializer] ⚠️ Iframe init falló:', result.error.reason);
      }
    } catch (error) {
      console.error('[AppInitializer] ❌ Error al inicializar iframe:', error);
      // No lanzar error - permitir que la app continúe
    }
  };
}
```

### Registration in app.config.ts

```typescript
import { initializeIframeInit } from '@guiders-frontend/shared/data-access/iframe';

// In providers array:
{
  provide: APP_INITIALIZER,
  useFactory: initializeIframeInit,
  multi: true,
},
```

### Key Design Decisions

1. **No blocking on failure**: Unlike auth initialization which is critical, iframe init failure should not block the app. The IframeShellComponent handles the error state visually.
2. **firstValueFrom**: Use `firstValueFrom` to convert the Observable from `initialize()` to a Promise for the async factory.
3. **Multi provider**: The `multi: true` flag allows multiple APP_INITIALIZER factories to coexist.
4. **Console-only for MVP**: Admin app doesn't need iframe initialization (it's not embedded).

### Dependencies

- Story 8-5: `IframeInitService` - already created
- Story 8-9: `IframeShellComponent` - consumes the initialized state

### References

- [Source: architecture-whitelabel-iframe.md] APP_INITIALIZER requirement (lines 305, 717)
- [Source: apps/console/src/app/app.config.ts] Existing APP_INITIALIZER pattern (lines 34-262, 311-321)
- [Source: libs/shared/data-access/iframe/src/lib/iframe-init/iframe-init.service.ts] `initialize()` method
- [Source: _bmad-output/implementation-artifacts/8-5-create-iframe-data-access-library-iframe-init-service.md] Story 8-5 spec (for IframeInitService context)

## Dev Agent Record

### Agent Model Used

MiniMax-M2.7

### Debug Log References

### Completion Notes List

### File List

- libs/shared/data-access/iframe/src/lib/iframe-init/iframe-init.initializer.ts (new)
- libs/shared/data-access/iframe/src/lib/iframe-init/iframe-init.initializer.spec.ts (new)
- libs/shared/data-access/iframe/src/lib/iframe-init/index.ts (update)
- apps/console/src/app/app.config.ts (update)