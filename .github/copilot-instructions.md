## Guiders Frontend – AI Quick Guide (≈45 líneas)
Objetivo: que un agente pueda añadir/editar features sin romper la arquitectura hexagonal ni patrones establecidos.

1) Big Picture: Monorepo Angular 20. Capas puras en `libs/feature/*` (dominio + application casos de uso con Promises). UI + infraestructura (Angular, HTTP, WS, storage, DI providers) en `guiders-20/`. Diferenciales: Chat real‑time (WebSocket con dedupe) y Auth con tokens y refresh futuro.
2) Separación estricta: 
   - Dominio: `domain/{entities,ports,use-cases,value-objects}` (sin Angular/RxJS).
   - Application (dentro de feature): `application/use-cases` (solo casos de uso, no servicios Angular).
   - Infra (app): `src/app/core/adapters` (HTTP/WS/storage) + servicios Angular en `core/services` que convierten Promise→Observable via `from()`.
3) Caso de Uso: archivo `verb-noun.use-case.ts`, clase con `execute(input?): Promise<Output>`. Constructor solo recibe puertos de `domain/ports`. Sin efectos secundarios ni acceso directo a localStorage, fetch, etc.
4) Flujo típico Auth: `LoginUseCase` → `AuthRepositoryPort` → `HttpAuthRepository` (`core/adapters/http-auth.repository.ts`) → API. Servicio Angular `AuthService` inyecta token `LOGIN_USE_CASE_TOKEN` y expone `login()` como Observable (`from(login.execute(creds))`).
5) DI Tokens: Definir `X_USE_CASE_TOKEN = new InjectionToken<XUseCase>('XUseCase')`. Providers en archivo de config (`auth-config.providers.ts`, `adapter-providers.ts`, etc.) con factory `useFactory: (repo) => new XUseCase(repo)`. Nunca instanciar casos de uso directamente en componentes.
6) Creación de nueva Feature: (a) entidades + puertos (b) casos de uso (c) actualizar barrel `index.ts` (d) crear adaptador(s) en `core/adapters` (e) definir tokens/providers (f) servicio Angular orquestador en `core/services` (g) tests de casos de uso en la lib.
7) WebSocket Chat: Servicio (cuando exista) debe soportar reconexión exponencial, auth JWT, deduplicación por `messageId + listenerId`. Antes de registrar listener comprobar existencia para evitar duplicados. Flujo: Component → ChatService → UseCase → Port → Adapter (HTTP/WS) → Backend → Estado (signals).
8) Estado: Preferir Angular Signals en servicios de estado; no introducir nuevos `BehaviorSubject`. Derivar flags con `computed` evitando lógica en componentes.
9) Errores: Adaptadores traducen HTTP/WS a errores de dominio (`UnauthorizedError`, `ChatNotFoundError`, etc.). El dominio nunca ve status codes. Mapear siempre antes de propagar.
10) Validaciones: En casos de uso o value objects. Si input inválido, lanzar error de dominio antes de llamar al puerto.
11) Naming: `*.entity.ts`, `*.port.ts`, `*.use-case.ts`, `*.service.ts`. Barriles `index.ts` exponen solo API limpia (evitar fugas de internos).
12) Entornos/API: Usar `src/environments/*` para URLs. Dev: API `http://localhost:3000/api` WS `ws://localhost:3000`. Prod: `https://guiders.ancoradual.com/api` / `wss://guiders.ancoradual.com`. Nunca hardcode en adaptadores o casos de uso.
13) Tests: 
	- Unit Jest: `npm run test:jest:guiders-20`. Specs junto a caso de uso: `send-message.use-case.spec.ts` mockeando puerto a mano.
	- E2E Cypress: `npm run test:cypress:headless:guiders-20`.
	- Full suite: ejecutar ambos comandos secuencialmente.
14) WebSocket Testing: Mock de interfaz socket; no abrir conexión real. Probar dedupe inyectando mensajes con mismo `messageId` y verificando una única invocación de callback.
15) Convenciones de Ports: Puertos definen métodos asincrónicos Promise. No devolver Observables ni usar `inject()` dentro de libs.
16) Adaptadores HTTP: Encapsular fetch/HttpClient, traducir códigos → errores dominio, mapear DTO → entidades antes de devolver. No exponer DTO crudo a componentes.
17) Seguridad/Auth: Utilidad `core/utils/jwt.utils.ts:isTokenExpired` para checks. Interceptor (si existe) maneja añadir token y refrescar futuro; no repetir lógica en servicios.
18) Diagnóstico: Para chat duplicado usar método `diagnostics` del WebSocketService (cuando esté). Para DI roto verificar providers en `app.config.ts` y tokens exportados.
19) Pitfalls comunes: (a) usar RxJS o `inject()` dentro de libs (b) listeners WS duplicados (c) imports circulares entre casos de uso (d) exponer DTOs crudos (e) olvidar `from()` al exponer Promises (f) hardcode de URLs.
20) Checklist PR: Dominio puro ✔ Adaptador mínimo ✔ Tokens DI ✔ Servicio convierte Promise→Observable ✔ Tests básicos use-cases ✔ Sin URLs hardcoded ✔ Errores mapeados a dominio ✔ Signals en estado ✔ Sin servicios en libs ✔.
21) Scripts útiles raíz: `deploy-cleanup-script.sh`. Para análisis local de builds, usar directamente npm scripts del proyecto correspondiente.
22) Añadir nuevo patrón transversal (caching, tracing, feature flags): documentar aquí primero con sección corta antes de uso masivo.

---
### Conversational Memory Protocol (Experimental – solo si el agente soporta graph memory)
Follow these steps for each interaction:

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
	  c) Store facts about them as observations

Nota: Este protocolo no debe interferir con las reglas de pureza de dominio ni modificar código; solo guía interacción conversacional cuando proceda.