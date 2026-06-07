# Plan de Migración Angular 20 → Angular 22

## Información del Proyecto

- **Versión actual:** Angular 20.1.0
- **Versión objetivo:** Angular 22.0.0
- **Nx versión:** 21.4.1
- **Node version requerida:** v20.19+ / v22.12+ (TS 6 support)
- **Tipo de migración:** Paso a paso (20 → 21 → 22)

## Fuentes Oficiales

- [Angular v21 Release Blog](https://blog.angular.dev/announcing-angular-v21-57946c34f14b)
- [Angular v22 Release Blog](https://blog.angular.dev/announcing-angular-v22-c52bb83a4664)
- [Angular Update Guide](https://angular.dev/update-guide?v=20.0-22.0&l=3)
- [Angular Release Schedule](https://angular.dev/reference/releases)

---

## Angular v21 - Cambios Requeridos (Nov 2025)

### 🎯 Nuevas Características Estables

| Feature | Estado | Descripción |
|---------|--------|-------------|
| **Vitest como test runner default** | Stable | Reemplaza Karma (deprecado 2023). Tu proyecto ya usa Vitest con `@analogjs/vitest-angular` |
| **Zoneless como default** | Default en nuevos proyectos | `zone.js` ya no se incluye por defecto |
| **Angular Aria** | Developer Preview | 8 patrones accesibles (Accordion, Combobox, Grid, Listbox, Menu, Tabs, Toolbar, Tree) |
| **Angular MCP Server** | Stable | 7 herramientas para AI agents (stable + experimental) |
| **SimpleChanges genérico** | Stable | Mejor type checking |

### 🧪 Nuevas Características Experimentales

| Feature | Descripción |
|---------|-------------|
| **Signal Forms** | API de formularios basada en Signals con validación schema-based |
| **Forms declarativos** | Binding con `[field]` directive en lugar de `[formControl]` |
| **`@let` con regex** | `/\\d+/.test(value)` en templates |

### ⚠️ Cambios Importantes (No Breaking)

- **`@defer` con `on viewport`** ahora acepta `rootMargin` y `trigger` personalizados
- **Built-in Signals formatter** para DevTools (Chrome/Firefox)
- **CDK overlays usan popovers nativos del browser**
- **CLDR actualizado** de v41 a v47
- **Angular 20** features incluidas: Animations enter/leave, Drag&Drop copy, DevTools signal graph

### 📋 Migrations Automáticas Disponibles (v21)

- `standalone` migration con CommonModule support
- `RouterTestingModule` migration
- `NgClass` → class bindings
- `NgStyle` → style bindings
- Schematics para Vitest: `ng g @schematics/angular:refactor-jasmine-vitest`

### 🔧 Lo que NO es Breaking en v21

- NgModules siguen funcionando (solo se deprecaron en algunos lugares)
- `zone.js` sigue funcionando (ya no es default en nuevos)
- Karma + Jasmine siguen soportados

---

## Angular v22 - Cambios Requeridos (Jun 2026)

### 🎯 Nuevas Características Estables (Production Ready)

| Feature | Descripción |
|---------|-------------|
| **Signal Forms** | API completa: validación schema-based, tipado fuerte, soporta Material y Aria |
| **Angular Aria** | 12 patrones accesibles production-ready con test harnesses |
| **`resource()` y `httpResource()`** | Async signals para fetch de datos, reactivos |
| **`@Service` decorator** | Reemplaza `@Injectable({providedIn: 'root'})` con sintaxis más limpia |
| **`injectAsync()`** | Lazy loading de servicios con code splitting automático |
| **`@boundary`** (developer preview Q3 2026) | Error boundaries en templates con `@error` |
| **TypeScript 6 Support** | Completa compatibilidad con TS 6 |

### ⚠️ BREAKING CHANGES (Importantes)

1. **OnPush es ahora el default para nuevos componentes**
   - `ChangeDetectionStrategy.Default` se renombra a `ChangeDetectionStrategy.Eager`
   - Migración automática agrega `Eager` a componentes existentes
   - **Acción:** Actualizar manualmente a `OnPush` cuando sea posible

2. **`paramsInheritanceStrategy: 'always'` es default en Router**
   - Las rutas hijas heredan params de padres automáticamente
   - **Acción:** Verificar `route.parent?.parent?.snapshot.params` chains
   - **Fix si necesitas el comportamiento anterior:**
     ```typescript
     provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'emptyOnly' }))
     ```

3. **Web Test Runner y Jest deprecados** (eliminarán en próxima release)
   - **Acción:** Tu proyecto ya usa Vitest ✓

4. **Webpack, `@angular-devkit/build-angular`, `@ngtools/webpack` deprecados**
   - **Acción:** Migrar a `@angular/build` (ya lo tienes ✓)

### 🆕 Nuevas Características de Templates

| Feature | Sintaxis |
|---------|----------|
| **Comentarios en HTML elements** | `<!-- comment -->` entre atributos |
| **Spread syntax** | `<div [class]="{...styles, active: isActive}">` |
| **Arrow functions** | `(click)="item.update(p => ({...p, stock: p.stock-1}))"` |
| **`@switch` con casos múltiples** | `@case ('A') @case ('B') { ... }` |
| **`@switch` exhaustivo** | `@default never;` para union types |
| **Host Directive de-duplication** | Auto-merge, error en duplicados |

### 🔒 Mejoras de Seguridad (No requieren acción)

- **SSRF protections** en `platform-server`
- **Sanitización** más estricta de `href`/`xlink:href` en SVG `<a>`
- **`TransferCache`** skip cookies/credentials por default
- **`zone.js` valida `__Zone_symbol_prefix`** (anti DOM-clobbering)
- **Max buffer size** en fetch SSR

### 🧪 Características Experimentales

| Feature | Descripción |
|---------|-------------|
| **WebMCP** | Exponer app/forms como tools para AI agents en el browser |
| **`linkedSignal` con `set` option** | Sincronización bidireccional entre signals |
| **`@boundary`** | Error boundaries en templates (Q3 2026) |
| **`onIdle` prefetch** | Para `injectAsync` con timeout |

### 📦 Migrations Automáticas Disponibles (v22)

- **OnPush → Eager migration** automática para componentes legacy
- **Schematics de Vitest** completas
- **MCP `onpush_zoneless_migration`** tool
- **MCP `modernize` tool** (experimental)

---

## Plan de Migración Detallado

### Epic 1: Preparación y Auditoría

**Objetivo:** Evaluar el estado actual antes de tocar versiones.

#### Story 1.1: Audit de Estado del Proyecto

**Criterios de aceptación:**
- [ ] Documentar versión actual de TODAS las dependencias Angular
- [ ] Listar componentes que NO usan `OnPush`
- [ ] Identificar uso de `Zone.js` y side effects
- [ ] Evaluar SSR/hydration si está habilitado
- [ ] Revisar `Web Test Runner` o `Jest` (ya tienes Vitest ✓)
- [ ] Confirmar uso de `@angular/build` (ya lo tienes ✓)

#### Story 1.2: Audit de Patrones RxJS vs Signals

**Criterios de aceptación:**
- [ ] Componentes con `BehaviorSubject` para UI state → candidatos a `signal()`
- [ ] Pipes `async` con subscriptions → candidatos a `async signals`
- [ ] Servicios con `@Injectable({providedIn: 'root'})` → candidatos a `@Service()`
- [ ] Servicios grandes que pueden usar `injectAsync()`

#### Story 1.3: Plan de Migración con Prioridades

**Criterios de aceptación:**
- [ ] Definir orden: 20 → 21 → 22 (no saltar versiones)
- [ ] Documentar riesgos por dominio (chat, auth, admin, etc.)
- [ ] Identificar componentes que requieren OnPush manual
- [ ] Crear branch de migración dedicado

---

### Epic 2: Migración a Angular 21

**Objetivo:** Ejecutar upgrade a v21 con todas sus nuevas features.

#### Story 2.1: Actualización de Dependencias Core

**Criterios de aceptación:**
- [ ] Ejecutar `ng update @angular/core@21 @angular/cli@21`
- [ ] Todos los paquetes `@angular/*` actualizados a `~21.0.0`
- [ ] `nx` y `@nx/angular` compatibles con v21
- [ ] `@analogjs/vite-plugin-angular` compatible
- [ ] `@angular/material` y `@angular/cdk` actualizados a `~21.0.0`
- [ ] Build pasa: `npm run build:all`
- [ ] Tests pasan: `npm run test`

#### Story 2.2: Verificar Vitest Setup

**Criterios de aceptación:**
- [ ] Confirmar que `@analogjs/vitest-angular` soporta v21
- [ ] Actualizar a versión compatible si es necesario
- [ ] Tests unitarios pasan con Vitest
- [ ] Coverage reports funcionan

#### Story 2.3: Adoptar Signal Forms (Experimental)

**Criterios de aceptación:**
- [ ] Forms reactivos migrados a `form()` + `[formField]`
- [ ] Validación schema-based con `required()`, `email()`, etc.
- [ ] Type safety completo en forms
- [ ] Forms legacy (Reactive Forms) siguen funcionando
- [ ] Tests actualizados

**Ejemplo:**
```typescript
import { form, FormField, required, email } from '@angular/forms/signals';

@Component({
  imports: [FormField],
  template: `
    <input type="email" [formField]="loginForm.email" />
    <input type="password" [formField]="loginForm.password" />
  `
})
export class LoginForm {
  login = signal({ email: '', password: '' });
  loginForm = form(this.login, (f) => {
    required(f.email, { message: 'Email required' });
    email(f.email, { message: 'Valid email' });
  });
}
```

#### Story 2.4: Evaluar Migración a Zoneless

**Criterios de aceptación:**
- [ ] Identificar side effects que dependen de Zone.js
- [ ] Auditar `setTimeout`/`setInterval` para UI updates
- [ ] Documentar componentes que rompen sin Zone.js
- [ ] Plan de remediación para problemas encontrados

#### Story 2.5: Explorar Angular Aria

**Criterios de aceptación:**
- [ ] Instalar `@angular/aria@21`
- [ ] Evaluar uso de Aria vs componentes actuales
- [ ] Documentar decisión: migrar o mantener componentes propios
- [ ] Plan de adopción gradual (ej: Accordion primero)

#### Story 2.6: Configurar Angular MCP Server

**Criterios de aceptación:**
- [ ] MCP server estable disponible en v21
- [ ] Configurar en tu editor/AI assistant
- [ ] Validar herramientas: `get_best_practices`, `search_documentation`, `onpush_zoneless_migration`

---

### Epic 3: Migración a Angular 22

**Objetivo:** Ejecutar upgrade a v22 con adopción de features estables.

#### Story 3.1: Actualización de Dependencias

**Criterios de aceptación:**
- [ ] Ejecutar `ng update @angular/core@22 @angular/cli@22`
- [ ] Todos los paquetes `@angular/*` actualizados a `~22.0.0`
- [ ] TypeScript actualizado a `~6.0.0`
- [ ] `@analogjs/*` compatibles con v22
- [ ] `@nx/angular` actualizado a versión compatible
- [ ] Build pasa: `npm run build:all`

#### Story 3.2: Manejar Breaking Changes de Router

**Criterios de aceptación:**
- [ ] Auditar `route.parent?.parent?.snapshot.params` en código
- [ ] Testear nested routes con nuevo `paramsInheritanceStrategy: 'always'`
- [ ] Si necesitas el comportamiento anterior:
  ```typescript
  provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'emptyOnly' }))
  ```
- [ ] E2E tests de routing pasando

#### Story 3.3: Manejar Cambio de Change Detection Default

**Criterios de aceptación:**
- [ ] Revisar componentes con `ChangeDetectionStrategy.Default`
- [ ] Migrar manualmente a `OnPush` cuando sea posible
- [ ] Componentes legacy pueden quedar con `Eager` (migración automática)
- [ ] Buscar `Eager` en codebase para identificar candidatos a modernizar
- [ ] Tests pasando con nueva estrategia

#### Story 3.4: Adoptar `@Service` Decorator

**Criterios de aceptación:**
- [ ] Servicios con `@Injectable({providedIn: 'root'})` migrados a `@Service()`
- [ ] Tests pasando después de la migración
- [ ] Lint pasa sin warnings

**Ejemplo:**
```typescript
// Antes
@Injectable({ providedIn: 'root' })
export class UserStore { }

// Después
@Service()
export class UserStore { }
```

#### Story 3.5: Adoptar Signal Forms Estables

**Criterios de aceptación:**
- [ ] Forms experimentales de v21 ahora production-ready
- [ ] Remover warnings de experimental
- [ ] Actualizar a sintaxis estable (si hubo cambios)
- [ ] Documentar patrones de uso interno

#### Story 3.6: Adoptar `resource()` y `httpResource()`

**Criterios de aceptación:**
- [ ] Servicios HTTP migrados a `httpResource()` donde aplique
- [ ] RxJS usado solo para async flows complejos
- [ ] Loading/error states manejados con async signals
- [ ] Memory leaks resueltos (rxResource ya no leaks)

**Ejemplo:**
```typescript
import { httpResource } from '@angular/common/http';

@Component({ /* ... */ })
export class UserComponent {
  userId = signal(1);
  user = httpResource<User>(() => `/api/users/${this.userId()}`);
}
```

#### Story 3.7: Evaluar `injectAsync()` para Servicios Grandes

**Criterios de aceptación:**
- [ ] Identificar servicios grandes candidatos a lazy loading
- [ ] Implementar `injectAsync` con prefetch opcional
- [ ] Medir mejora en bundle size
- [ ] Bundle separado correctamente

#### Story 3.8: Adoptar Nuevas Features de Templates

**Criterios de aceptación:**
- [ ] Usar spread syntax en templates donde aplique
- [ ] Aprovechar `@switch` con casos múltiples
- [ ] Adoptar arrow functions en event handlers simples
- [ ] Agregar comentarios en elementos HTML donde mejore legibilidad

#### Story 3.9: Explorar Angular Aria Estables

**Criterios de aceptación:**
- [ ] Aria estable con 12 patrones + test harnesses
- [ ] Migrar al menos 1 patrón a Angular Aria (ej: Tabs o Accordion)
- [ ] Validar accesibilidad con screen readers
- [ ] Audit de accesibilidad pasa

#### Story 3.10: Configurar `withExperimentalPlatformNavigation()`

**Criterios de aceptación:**
- [ ] Habilitar Navigation API del browser en el router
- [ ] Testear scroll behavior nativo
- [ ] Validar loading indicators globales
- [ ] A11y announcements durante navegación

---

### Epic 4: Estabilización y Mejora Continua

**Objetivo:** Calidad, performance y mantenimiento post-migración.

#### Story 4.1: Evaluar WebMCP (Experimental)

**Criterios de aceptación:**
- [ ] Documentar capacidades de WebMCP
- [ ] Evaluar si aplica al dominio del proyecto
- [ ] Plan de adopción cuando salga de experimental
- [ ] PoC de Signal Forms como AI tool

#### Story 4.2: Performance Profiling

**Criterios de aceptación:**
- [ ] Bundle size no aumenta significativamente
- [ ] Time to Interactive mejora (gracias a Zoneless)
- [ ] Change detection cycles reducidos
- [ ] Memory usage estable
- [ ] Core Web Vitals mejorados

#### Story 4.3: Evaluar `@boundary` (Q3 2026)

**Criterios de aceptación:**
- [ ] Esperar a que salga de developer preview
- [ ] Identificar componentes críticos para error boundaries
- [ ] Plan de implementación post-stable

#### Story 4.4: Actualizar Documentación Interna

**Criterios de aceptación:**
- [ ] Guía de migración Angular 20→22 documentada
- [ ] Patrones de signals documentados
- [ ] Best practices de Zoneless documentados
- [ ] Uso de `@Service` vs `@Injectable` documentado
- [ ] Signal Forms patterns documentados
- [ ] OnPush como default documentado
- [ ] Tests patterns actualizados

#### Story 4.5: Testing Exhaustivo

**Criterios de aceptación:**
- [ ] Unit tests: 100% pasando con Vitest
- [ ] Integration tests: pasando
- [ ] E2E tests: pasando con Playwright
- [ ] Coverage se mantiene o mejora
- [ ] Performance tests pasan

#### Story 4.6: Monitoreo Post-Migración

**Criterios de aceptación:**
- [ ] Métricas de bundle size trackeadas
- [ ] Métricas de TTI/LCP trackeadas
- [ ] Error rate en producción monitoreado
- [ ] Feedback de usuarios recopilado

---

## Resumen de Acciones Requeridas

### Acción Inmediata (Pre-Migración)

1. ✅ **Verificar Vitest**: Tu proyecto ya usa `@analogjs/vitest-angular` ✓
2. ✅ **Verificar `@angular/build`**: Tu proyecto ya lo usa ✓
3. ⚠️ **Auditar OnPush**: Identificar componentes que no lo usan
4. ⚠️ **Auditar Zone.js**: Identificar side effects

### Migración a v21 (Acciones Críticas)

1. ⚡ Ejecutar `ng update @angular/core@21 @angular/cli@21`
2. ⚡ Actualizar `@angular/material` y `@angular/cdk` a `~21.0.0`
3. ⚡ Actualizar `@analogjs/*` a versión compatible
4. ⚡ Adoptar Vitest estable (ya lo tienes)
5. 📋 Evaluar Signal Forms (experimental)
6. 📋 Evaluar Angular Aria (developer preview)

### Migración a v22 (Acciones Críticas)

1. ⚡ Ejecutar `ng update @angular/core@22 @angular/cli@22`
2. ⚡ Actualizar TypeScript a `~6.0.0`
3. ⚡ Auditar Router para `paramsInheritanceStrategy: 'always'`
4. ⚡ Auditar componentes para OnPush
5. 📋 Adoptar `@Service` decorator
6. 📋 Adoptar `resource()` y `httpResource()`
7. 📋 Adoptar Signal Forms estables
8. 📋 Evaluar `injectAsync()` para servicios grandes

---

## Orden de Migración Sugerido

```
Fase 1: Epic 1 (Audit)              → 1 sprint
Fase 2: Epic 2 (Angular 21)         → 2-3 sprints
Fase 3: Epic 3 (Angular 22)         → 2-3 sprints
Fase 4: Epic 4 (Estabilización)     → 1-2 sprints
─────────────────────────────────────────
Total estimado:                      6-9 sprints
```

### Desglose por Fase

**Fase 1 - Audit (1 sprint):**
- Inventario de componentes y patrones
- Identificación de riesgos
- Plan de remediación

**Fase 2 - Angular 21 (2-3 sprints):**
- Sprint 1: Update dependencies, build verde
- Sprint 2: Signal Forms experimental + Aria preview
- Sprint 3: MCP server + cleanup

**Fase 3 - Angular 22 (2-3 sprints):**
- Sprint 1: Update dependencies, breaking changes
- Sprint 2: `@Service`, `resource()`, `httpResource()`
- Sprint 3: Templates nuevos, Router migration

**Fase 4 - Estabilización (1-2 sprints):**
- Sprint 1: Performance, testing
- Sprint 2: Documentación, monitoreo

---

## Recursos Adicionales

- [Angular v21 Release Blog](https://blog.angular.dev/announcing-angular-v21-57946c34f14b)
- [Angular v22 Release Blog](https://blog.angular.dev/announcing-angular-v22-c52bb83a4664)
- [Angular 22 Key Features](https://angular.love/angular-22-key-features-and-changes)
- [Angular Update Guide](https://angular.dev/update-guide?v=20.0-22.0&l=3)
- [Signal Forms Guide](https://angular.dev/guide/forms/signals/overview)
- [Zoneless Guide](https://angular.dev/guide/zoneless)
- [Angular Aria Guide](https://angular.dev/guide/aria/)
- [Angular MCP Server](https://angular.dev/ai/mcp)
- [Angular Skills GitHub](https://github.com/angular/skills)
