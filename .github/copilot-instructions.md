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

---
### Context7 Documentation Retrieval Protocol (Cuándo y Cómo Usarlo)
Objetivo: Obtener documentación externa SOLO cuando la info no esté ya en el repo y sea necesaria para decisiones de implementación.

Usar context7 si (todas o varias aplican):
1. Necesitas una firma, comportamiento o cambio de versión de una librería externa (p.ej. Angular 20 APIs nuevas, RxJS interop, WebSocket estándar, Jest config) que no aparece en el código local.
2. Hay ambigüedad sobre un decorador, opción de configuración, o API (ej: nueva sintaxis de `provideHttpClient`, signals advanced patterns) y la implementación correcta impacta arquitectura.
3. Requieres confirmar si una API está deprecada antes de introducirla.
4. Vas a proponer optimización dependiente de opciones oficiales (build, test, SSR) y no aparece documentada en el repo.

NO usar context7 cuando:
- La respuesta se deduce leyendo archivos locales (prioriza búsqueda interna primero).
- Es simple sintaxis TypeScript / estándar ECMAScript.
- Sería para copiar ejemplos genéricos no alineados al patrón del repo.

Procedimiento:
1. Intentar primero `semantic_search` o lectura directa de archivos locales.
2. Si falta info externa, llamar a `resolve-library-id` con nombre (ej: "angular", "rxjs", "jest").
3. Luego `get-library-docs` con:
	- `topic` específico (ej: `signals`, `dependency-injection`, `testing`, `ws`).
	- `tokens` conservador (<=6000) para evitar ruido; subir solo si sigue faltando contexto.
4. Resumir extractando SOLO lo relevante al cambio que estás implementando; no pegar dumps largos.
5. Aplicar la decisión en código siguiendo reglas locales (pureza dominio, adapters, tokens DI) y referenciar la sección consultada brevemente ("Context7: Angular DI providers").

Buenas prácticas:
- Preferir un único fetch bien focalizado a múltiples consultas amplias.
- Cache mental de lo obtenido durante la sesión: no repetir la misma llamada salvo cambio de versión.
- Si la docs contradice estilos del proyecto, seguir estilos del proyecto y mencionar la discrepancia.
- Nunca introducir dependencia nueva solo porque aparece en la docs sin justificar valor claro.

Ejemplos de disparadores válidos:
- "¿Existe un provider tree-shakable alternativo para X en Angular 20?" → context7 topic: dependency-injection.
- "Cómo usar señales para reemplazar BehaviorSubject" → context7 topic: signals.
- "Método correcto de jest para mocks de timers en versión actual" → context7 topic: jest timers.

Evitar:
- Llamar para recordar sintaxis básica de `Array.map` o `Promise.all`.
- Descarga masiva de docs sin pregunta concreta.
 - Descarga masiva de docs sin pregunta concreta.

---
### Playwright MCP
No obligatorio, pero mejora precisión y reduce pasos innecesarios. Mantenerlo ≤8 líneas.

Formato sugerido:
Objetivo: (una frase clara)
URL inicial: (http/https)
Pasos clave: 1) … 2) …
Selectores críticos: (css o data-testid, separados por coma)
Datos a capturar: (texto|screenshot|html|requests|console)
Criterio de éxito: (condición verificable)
Límites: (máx clicks N, timeout Xs, no salir del dominio)

Ejemplo mínimo:
Objetivo: Validar login correcto
URL inicial: http://localhost:4200/login
Pasos clave: 1) Rellenar #email y #password 2) Click button[type=submit]
Selectores críticos: h1.welcome, .user-menu
Datos a capturar: screenshot, texto h1.welcome
Criterio de éxito: h1.welcome contiene "Bienvenido"
Límites: timeout 15s, máx clicks 3

Notas:
- Preferir data-testid para estabilidad.
- Pedir sólo artefactos necesarios (evita sobrecarga).
- Un prompt conciso evita exploración irrelevante.