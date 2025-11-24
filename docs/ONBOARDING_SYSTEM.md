# Sistema de Onboarding y Guías de Usuario

Sistema completo de guías interactivas para usuarios nuevos, similar a Jira, con tours paso a paso que resaltan elementos específicos de la interfaz.

## 📋 Características

- ✅ Tours interactivos paso a paso
- ✅ Spotlight que resalta elementos específicos
- ✅ Persistencia en localStorage por usuario
- ✅ Auto-inicio para usuarios nuevos
- ✅ Navegación (siguiente, anterior, saltar)
- ✅ Multi-tour support
- ✅ Responsive y accesible
- ✅ Usa design tokens del sistema

## 🏗️ Arquitectura

### Componentes Principales

```
libs/
├── shared/
│   ├── types/
│   │   └── onboarding.types.ts          # Interfaces y tipos
│   └── ui/
│       ├── onboarding-spotlight/        # Componente que resalta elementos
│       ├── onboarding-tour/             # Panel con pasos del tour
│       └── onboarding-container/        # Contenedor que orquesta todo
└── auth/
    └── data-access/
        └── session/
            └── onboarding.service.ts    # Servicio de gestión de estado
```

### Flujo de Funcionamiento

1. **Registro de Tours**: La aplicación registra tours al iniciarse
2. **Detección**: El servicio detecta si el usuario es nuevo (localStorage)
3. **Auto-inicio**: Tours con `autoStart: true` se inician automáticamente
4. **Navegación**: Usuario navega entre pasos con botones
5. **Persistencia**: Progreso se guarda en localStorage
6. **Completado**: Tour se marca como completado al finalizar

## 🚀 Uso Básico

### 1. Definir un Tour

```typescript
import { OnboardingTour } from '@guiders-frontend/shared/types';

export const myTour: OnboardingTour = {
  id: 'my-feature-tour',
  name: 'Guía de Mi Funcionalidad',
  description: 'Aprende a usar esta funcionalidad',
  route: '/my-route',
  autoStart: true,
  priority: 1,
  steps: [
    {
      id: 'step-1',
      title: 'Bienvenido',
      description: 'Este es el primer paso del tour',
      position: 'center', // No target = modal centrado
    },
    {
      id: 'step-2',
      title: 'Botón Principal',
      description: 'Aquí puedes hacer X acción',
      target: '[data-tour="main-button"]', // CSS selector
      position: 'bottom',
    },
  ],
};
```

### 2. Registrar Tours en la App

```typescript
import { OnboardingService } from '@guiders-frontend/auth/data-access/session';
import { OnboardingContainer } from '@guiders-frontend/onboarding-container';
import { myTours } from './tours/my-tours';

@Component({
  imports: [OnboardingContainer, /* other imports */],
  // ...
})
export class App {
  private readonly onboardingService = inject(OnboardingService);

  constructor() {
    // Registrar todos los tours
    this.onboardingService.registerTours(myTours);

    // Auto-iniciar tours para la ruta actual
    setTimeout(() => {
      this.onboardingService.autoStartToursForRoute('/current-route');
    }, 1000);
  }
}
```

### 3. Agregar el Contenedor al Template

```html
<!-- En tu app.component.html -->
<guiders-onboarding-container />
```

### 4. Marcar Elementos con data-tour

```html
<!-- Elementos que quieres resaltar -->
<button data-tour="main-button">Click me</button>
<nav data-tour="sidebar">...</nav>
<div data-tour="user-menu">...</div>
```

## 📝 API del OnboardingService

### Métodos Principales

```typescript
// Registrar tours
registerTour(tour: OnboardingTour): void
registerTours(tours: OnboardingTour[]): void

// Gestionar tours
startTour(tourId: string): Promise<boolean>
skipTour(): void
pauseTour(): void
resumeTour(): void
completeTour(): void

// Navegación
nextStep(): Promise<void>
previousStep(): Promise<void>

// Estado
isTourCompleted(tourId: string): boolean
isTourSkipped(tourId: string): boolean

// Preferencias
updatePreferences(prefs: { showHints?: boolean; autoStartTours?: boolean }): void
resetOnboarding(): void // Para testing
completeInitialSetup(): void

// Auto-start
autoStartToursForRoute(route: string): void
```

### Signals Disponibles

```typescript
// Acceder al estado reactivo
const isActive = onboardingService.isActive(); // boolean
const currentStep = onboardingService.currentStep(); // OnboardingStep | null
const activeTour = onboardingService.activeTour(); // OnboardingTour | null
const progress = onboardingService.progress(); // number (0-100)
const totalSteps = onboardingService.totalSteps(); // number
```

## 🎨 Personalización de Steps

### Posiciones del Tooltip

- `'center'` - Modal centrado en pantalla (sin target)
- `'top'` - Arriba del elemento
- `'bottom'` - Abajo del elemento
- `'left'` - Izquierda del elemento
- `'right'` - Derecha del elemento

### Opciones Avanzadas

```typescript
{
  id: 'advanced-step',
  title: 'Paso Avanzado',
  description: 'Con opciones especiales',
  target: '[data-tour="element"]',
  position: 'bottom',
  actionLabel: 'Continuar', // Texto del botón (default: "Siguiente")
  skippable: true, // Permite saltar (default: true)
  delay: 500, // Espera antes de mostrar (ms)

  // Hooks
  beforeShow: async () => {
    // Ejecutar antes de mostrar el paso
    await fetchData();
  },
  afterComplete: async () => {
    // Ejecutar después de completar el paso
    console.log('Step completed!');
  }
}
```

## 💾 Persistencia en localStorage

El sistema guarda automáticamente:

```typescript
// Key: 'guiders-onboarding-state'
{
  userId: string,
  hasCompletedInitialSetup: boolean,
  completedTours: string[],
  skippedTours: string[],
  completedSteps: Record<string, string[]>, // tourId -> stepIds[]
  showHints: boolean,
  autoStartTours: boolean,
  lastUpdated: Date
}
```

## 🧪 Testing y Desarrollo

### Resetear Onboarding en Consola

```javascript
// En browser console
const service = document.querySelector('console-root').__ngContext__[8].onboardingService;
service.resetOnboarding();
```

### Iniciar Tour Manualmente

```typescript
// En tu componente
onboardingService.startTour('console-welcome');
```

### Desactivar Auto-start

```typescript
onboardingService.updatePreferences({ autoStartTours: false });
```

## 📚 Tours Existentes

### Console App

- **console-welcome** - Tour de bienvenida (auto-start)
- **console-inbox** - Guía de la bandeja de entrada
- **console-visitors** - Guía de gestión de visitantes
- **console-contacts** - Guía de contactos

Ver: `apps/console/src/app/tours/console-tours.ts`

## 🎯 Mejores Prácticas

1. **Selectores Únicos**: Usa `data-tour` attributes específicos
2. **Tours Cortos**: 5-7 pasos máximo por tour
3. **Descripción Clara**: Explica el "por qué", no solo el "qué"
4. **Testing**: Prueba con sidebar colapsado/expandido
5. **Mobile**: Considera vista móvil (tours se adaptan automáticamente)
6. **Delay**: Usa `delay` para contenido asíncrono
7. **Hooks**: Usa `beforeShow` para preparar el estado

## 🔧 Extensión Futura

### Agregar Nuevo Tour

1. Crear definición en `apps/[app]/src/app/tours/`
2. Agregar a array de tours exportado
3. Marcar elementos con `data-tour` attributes
4. El servicio lo auto-registra al iniciar

### Integrar en Nueva App

```typescript
// En app.ts
import { OnboardingService } from '@guiders-frontend/auth/data-access/session';
import { OnboardingContainer } from '@guiders-frontend/onboarding-container';

@Component({
  imports: [OnboardingContainer],
  // ...
})
export class App {
  constructor() {
    inject(OnboardingService).registerTours(myTours);
  }
}
```

## 📖 Referencias

- **Inspiración**: Sistema de tours de Jira
- **Design System**: Usa tokens de `@guiders-frontend/design-tokens`
- **Accesibilidad**: Soporta navegación por teclado y screen readers
- **Responsive**: Se adapta a móvil automáticamente

---

**Nota**: El sistema se inicializa automáticamente cuando hay un usuario autenticado. El estado es específico por usuario usando su ID.
