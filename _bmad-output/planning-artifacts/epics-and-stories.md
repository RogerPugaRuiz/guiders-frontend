# Epics and Stories — guiders-frontend MVP

**Author:** Bob (BMad Scrum Master)  
**Date:** 2026-04-22  
**Scope:** MVP — FR1–FR23, FR29–FR36  
**PRD Reference:** `_bmad-output/planning-artifacts/prd.md`  
**Architecture Reference:** `_bmad-output/planning-artifacts/architecture.md`  
**UX Reference:** `_bmad-output/planning-artifacts/ux-design.md`

---

## Overview

| Epic | Title | Stories | Estimated Points |
|------|-------|---------|-----------------|
| 1 | Visitor Heat Index & Sorting | 4 | 18 |
| 2 | Visitor Product History Profile Panel | 6 | 31 |
| 3 | Proactive Chat from Profile | 3 | 13 |
| 4 | LeadCars Integration Panel | 6 | 26 |
| 5 | Authentication & Access Control | 3 | 10 |
| 6 | Foundation & Observability | 5 | 16 |
| **Total** | | **27** | **114** |

> Point scale: S=2, M=5, L=8, XL=13

---

## Epic 1: Visitor Heat Index & Sorting

**Goal:** Give agents an at-a-glance purchase-intent signal on every visitor card and the ability to sort by it, so they can identify the highest-intent visitor in under 10 seconds without opening any profile.

**MVP Scope:** FR1, FR2, FR3, FR34

---

### Story 1.1: Create `HeatIndexBadge` UI Component

**As an** agent, **I want** to see a color-coded numeric heat score on every visitor card, **so that** I can instantly identify the highest-intent visitor without reading text or opening profiles.

**Acceptance Criteria:**
- [ ] A new `HeatIndexBadgeComponent` exists at `libs/chat/ui/heat-index-badge` with selector `guiders-heat-index-badge`
- [ ] Accepts `score: input<number | null>()` and `size: input<'sm' | 'md' | 'lg'>('md')`
- [ ] Computed `tier` signal classifies: `null → 'unknown'`, `0–29 → 'cold'`, `30–69 → 'warm'`, `70–100 → 'hot'`
- [ ] Color mapping uses design tokens: hot → `color-error`, warm → `color-warning`, cold → `color-info`, unknown → `color-text-secondary`
- [ ] `score === null` renders "—" with gray styling and tooltip "Sin eventos de comportamiento registrados"
- [ ] Partial data variant: accepts `isPartial: input<boolean>(false)` → renders `~{score}` with ⚠ icon
- [ ] Interactive: has `role="button"`, `aria-label="Puntuación de intención: {N} de 100. Haz clic para ver el desglose."` (WCAG 2.2 AA)
- [ ] Score breakdown tooltip/popover shows signals breakdown when clicked: product views, recurring visits, time on page
- [ ] Color is never the only differentiator — numeric score always shown
- [ ] Vitest unit tests: cold tier for score < 30, warm 30–69, hot ≥ 70, unknown for null, partial variant renders `~` prefix
- [ ] Loading state: gray skeleton shimmer pill

**Technical Notes:**
- Pure UI component — no service dependencies
- Reusable in both `VisitorCard` (list, size `sm`) and visitor profile header (size `lg`)
- Path alias: `@guiders-frontend/chat/ui/heat-index-badge`
- Tags: `scope:chat type:ui`
- Register path alias in `tsconfig.base.json`
- Tooltip/popover must receive score signals as input (not computed internally) — parent passes breakdown data

**Dependencies:** None  
**Size:** M (5 pts)

---

### Story 1.2: Extend Shared Types for Heat Index

**As a** developer, **I want** typed interfaces for `HeatIndexData` and `HeatIndexSignals`, **so that** all components and services use a consistent contract for the backend-computed heat index.

**Acceptance Criteria:**
- [ ] New file `libs/shared/types/src/lib/product-tracking.types.ts` created
- [ ] Exports: `HeatIndexData { score: number; tier: 'cold' | 'warm' | 'hot'; signals: HeatIndexSignals; computedAt: string }`
- [ ] Exports: `HeatIndexSignals { productViewCount: number; uniqueProductsViewed: number; totalTimeOnProductPages: number; visitFrequency: number; currentSessionDuration: number }`
- [ ] `VisitorSearchResult` type (in existing shared/types) extended with: `heatIndex: number | null`, `heatIndexTier: 'cold' | 'warm' | 'hot' | null`, `heatIndexSignals?: HeatIndexSignals`
- [ ] TypeScript compilation passes without errors after changes
- [ ] Existing `Visitor` model in `visitors-data-service` mapper updated to include `heatIndex` field

**Technical Notes:**
- Extend existing `libs/shared/types/src/lib/` — no new library needed
- The `heatIndex` field name must be coordinated with backend (open question: `heatIndex` vs `leadScore` — default to `heatIndex`, use optional chaining fallback)
- ⚠️ **Backend dependency:** `GET /visitors/search` response must include `heatIndex` field

**Dependencies:** None  
**Size:** S (2 pts)

---

### Story 1.3: Display Heat Index Badge on `VisitorCard`

**As an** agent, **I want** to see the heat index badge on each visitor row in the list, **so that** I can identify high-intent visitors at a glance without opening their profiles.

**Acceptance Criteria:**
- [ ] `VisitorCard` component imports and renders `<guiders-heat-index-badge>` with visitor's `heatIndex` value
- [ ] Badge is rightmost and prominent on the card (per UX spec §4.1)
- [ ] When `heatIndex` is null, badge renders in unknown/gray state — card does NOT appear broken
- [ ] When `heatIndex` is partial (from `heatIndexTier` returned as null but other signals exist), badge renders partial variant with `~` prefix
- [ ] Vehicle preview row (1–2 vehicle model names) appears on the card below session context (UX §4.1 addition — reduces clicks to identify)
- [ ] `VisitorCard` Vitest tests updated: heat badge renders with correct tier for score 87, badge renders unknown state when `heatIndex` is null
- [ ] Mock data in `visitors-mock-data.ts` extended with `heatIndex` and `heatIndexTier` fields

**Technical Notes:**
- Extend existing `VisitorCard` component — non-breaking enhancement
- Map `heatIndex` in `mapSearchResultToVisitor()` inside `VisitorsComponent`
- Pass down chain: `VisitorsComponent` → `VisitorsListComponent` → `VisitorCard` → `HeatIndexBadge`
- ⚠️ **Backend dependency:** `GET /visitors/search` must include `heatIndex: number | null` per architecture §6.1

**Dependencies:** Story 1.1, Story 1.2  
**Size:** M (5 pts)

---

### Story 1.4: Sort Visitor List by Heat Index

**As an** agent, **I want** to sort the visitor list by heat index descending (default), **so that** the highest-intent visitor is always at the top of my list.

**Acceptance Criteria:**
- [ ] Visitor list defaults to sort by `heatIndex DESC` on initial load
- [ ] Sort selector in the list header includes "Heat Index ↓" as the default selected option
- [ ] User can toggle between "Heat Index" and "Última visita" sort options
- [ ] Sort preference persisted to `localStorage` key `visitors_sort_field`
- [ ] On sort change, list reloads immediately (does not wait for next auto-refresh cycle)
- [ ] `GET /visitors/search` request body includes `"sort": { "field": "heatIndex", "direction": "DESC" }` when heat index sort is active
- [ ] Visitors with `heatIndex: null` sort to the bottom when sorting by heat index
- [ ] Vitest test: sort selector emits correct API payload for `heatIndex` sort
- [ ] E2E test (`console-e2e`): `test('agent can sort visitor list by heat index')`

**Technical Notes:**
- Add `heatIndex` as valid `VisitorSortField` in the type definitions
- Use existing `VisitorsDataService.searchVisitors()` — just add sort field to payload
- ⚠️ **Backend dependency:** Backend must accept `heatIndex` as a valid sort field in `VisitorSortField` enum and have MongoDB index for it (open question from architecture §Appendix C)

**Dependencies:** Story 1.2, Story 1.3  
**Size:** M (5 pts) + ⚠️ Backend dependency blocker

---

## Epic 2: Visitor Product History Profile Panel

**Goal:** Give agents the full behavioral context of a visitor — which vehicles they've viewed, how many times, and in which session — before sending the first message, so they can open the conversation from a position of advantage.

**MVP Scope:** FR4, FR5, FR6, FR7, FR8

---

### Story 2.1: Create `VisitorProductsService` Data-Access Library

**As a** developer, **I want** a dedicated HTTP service for the visitor product history endpoint, **so that** the product tracking data has a clean, testable, isolated layer separated from the general visitors service.

**Acceptance Criteria:**
- [ ] New library created: `libs/chat/data-access/visitor-products-service`
- [ ] Path alias registered: `@guiders-frontend/chat/data-access/visitor-products-service` in `tsconfig.base.json`
- [ ] Tags: `scope:chat type:data-access`
- [ ] `VisitorProductsService` injectable with `providedIn: 'root'` — method: `getVisitorProducts(visitorId: string): Observable<VisitorProductsResponse>`
- [ ] Exports `ProductView` and `VisitorProductsResponse` interfaces (from shared types)
- [ ] HTTP call: `GET /visitors/:visitorId/products` with `{ withCredentials: true }`
- [ ] On `404` (visitor has no tracked products): returns observable with `{ products: [], currentSessionId: '', totalEvents: 0, visitorId }`
- [ ] On `500`: returns error observable (caller handles with `catchError`)
- [ ] Mock implementation: when `USE_MOCK_DATA=true`, returns `visitor-products-mock-data.ts` fixture with 3 products across 2 sessions
- [ ] Vitest unit tests: correct URL construction, 404 returns empty gracefully, 500 propagates error
- [ ] `nx lint chat-data-access-visitor-products-service` passes

**Technical Notes:**
- `ProductView` and `VisitorProductsResponse` types live in `libs/shared/types/src/lib/product-tracking.types.ts` (Story 2.2)
- Use `ENVIRONMENT_TOKEN` from `@guiders-frontend/auth/data-access/session` for base URL
- `tenantId` is NEVER passed as function parameter — derived from session cookie via `withCredentials: true`
- ⚠️ **Backend dependency — MVP BLOCKER:** `GET /visitors/:id/products` endpoint does not exist yet (architecture §6.2). Use mock data until available.

**Dependencies:** Story 1.2 (for shared types)  
**Size:** M (5 pts) + ⚠️ Backend blocker

---

### Story 2.2: Extend Shared Types for Product Tracking

**As a** developer, **I want** typed interfaces for `ProductView` and `VisitorProductsResponse`, **so that** both the service and the UI component share a single source of truth for product tracking data shapes.

**Acceptance Criteria:**
- [ ] `ProductView` interface exported from `libs/shared/types`: `{ productId, productName, productUrl, viewCount, firstViewedAt, lastViewedAt, sessionId, thumbnailUrl? }`
- [ ] `VisitorProductsResponse` interface exported: `{ visitorId, currentSessionId, products: ProductView[], totalEvents }`
- [ ] `LeadCarsStatus` interface exported from new `libs/shared/types/src/lib/leadcars-status.types.ts`: `{ connected, environment, lastSyncAt, failedRecordsCount, totalSynced }`
- [ ] `LeadCarsSyncRecord` and `LeadCarsSyncRecordsResponse` types exported
- [ ] TypeScript build passes with no errors after additions
- [ ] All new types have JSDoc comments in English

**Technical Notes:**
- Extend existing `libs/shared/types` — no new library
- Group product tracking types in `product-tracking.types.ts`, LeadCars operational types in `leadcars-status.types.ts`

**Dependencies:** None  
**Size:** S (2 pts)

---

### Story 2.3: Create `VisitorProductHistoryComponent` UI Library

**As a** developer, **I want** a pure presentational component for product history, **so that** the vehicle history section renders correctly in all states (enriched, fallback, loading) without any service dependencies.

**Acceptance Criteria:**
- [ ] New library: `libs/chat/ui/visitor-product-history` with selector `guiders-visitor-product-history`
- [ ] Path alias registered in `tsconfig.base.json`
- [ ] Tags: `scope:chat type:ui`
- [ ] Signal inputs: `products: input.required<ProductView[]>()`, `currentSessionId: input.required<string>()`, `loading: input<boolean>(false)`, `hasError: input<boolean>(false)`, `fallbackContext: input<VisitorFallbackContext | null>(null)`
- [ ] Computed signals: `currentSessionProducts`, `previousSessionProducts`, `isEmpty`
- [ ] Renders three empty state variants per UX spec §5.3:
  - **Variant A** (no events at all): shown when `products.length === 0` and `fallbackContext` provided — displays current URL, source, session duration, lifecycle
  - **Variant B** (consent blocked): shown when `hasError === true` with consent-specific message
  - **Variant C** (history exists, no current session): shown when `currentSessionProducts.length === 0` but `previousSessionProducts.length > 0`
- [ ] "Esta sesión" section shows vehicles from current session, sorted by `lastViewedAt DESC`
- [ ] "Historial (sesiones anteriores)" section groups by session date, collapsed by default for returning visitors
- [ ] Each vehicle card shows: model name, view count bar, "last seen" timestamp, `[ACTIVO AHORA]` badge when appropriate
- [ ] Loading state: skeleton shimmer for vehicle cards; no layout shift
- [ ] No service injection — purely presentational (enforced by `type:ui` boundary rule)
- [ ] Vitest tests: current vs previous session separation, Variant A empty state, Variant B empty state, Variant C empty state, loading skeleton renders, fallback context displayed

**Technical Notes:**
- `VisitorFallbackContext` type: `{ currentUrl: string; trafficSource: string; sessionDuration: number; lifecycle: string }`
- `[ACTIVO AHORA]` badge: shown when a product's `sessionId === currentSessionId` AND the product's `productUrl` matches the visitor's `currentUrl` (passed via `fallbackContext.currentUrl`)
- Per UX §5.2: frequency bar max = 10 views = full bar
- Accessibility: `role="list"` / `role="listitem"` for vehicle cards; descriptive `aria-label` per card

**Dependencies:** Story 2.2  
**Size:** L (8 pts)

---

### Story 2.4: Integrate Product History into `visitor-detail-panel`

**As an** agent, **I want** to see the vehicle history section when I open a visitor profile, **so that** I have full behavioral context before starting the conversation.

**Acceptance Criteria:**
- [ ] `visitor-detail-panel` component calls `VisitorProductsService.getVisitorProducts(visitor.id)` when a visitor is selected
- [ ] Loading state: skeleton shown in vehicle history section immediately (< 200ms visual response, NFR5)
- [ ] Heat index and lifecycle data from the list payload displayed immediately without waiting for the products call
- [ ] Products call uses `catchError` to return empty gracefully — panel never shows a broken/error state
- [ ] `productsLoading` signal gates the skeleton display; `finalize()` clears it
- [ ] `VisitorProductHistoryComponent` receives: `products`, `currentSessionId`, `loading`, `fallbackContext` derived from the `Visitor` object (URL, source, session)
- [ ] If product history API returns empty, fallback context (current URL, source, session duration, lifecycle) is passed to show Variant A empty state
- [ ] Profile panel has three tabs: **Vehículos** (default), **Comportamiento**, **Chats** — keyboard accessible
- [ ] "Comportamiento" tab shows heat index breakdown using `heatIndexSignals` from visitor search result
- [ ] "Chats" tab shows previous chat history (may be empty state "Primera visita")
- [ ] E2E tests (`console-e2e`):
  - `test('agent opens visitor profile and sees product history')`
  - `test('agent sees empty state when no product tracking data')`
  - `test('product history separates current session from previous')`
  - `test('agent sees fallback data (URL, source) in empty state')`

**Technical Notes:**
- Load pattern from architecture §5.3: `onVisitorSelected()` triggers `VisitorProductsService`, wrapped in `catchError` + `finalize`
- Do NOT load product history for all visitors in the list — only on profile open
- Panel uses `role="dialog"` with `aria-modal="true"` (WCAG, UX §6.2)
- Focus moves to `[Iniciar Chat]` CTA on panel open; returns to triggering row on close
- ⚠️ **Backend dependency:** requires Story 2.1 service + `GET /visitors/:id/products` endpoint

**Dependencies:** Story 2.1, Story 2.3, Story 1.3  
**Size:** L (8 pts)

---

### Story 2.5: Heat Index Behavior Breakdown Tab

**As an** agent, **I want** to see which behavioral events produced a visitor's heat index score, **so that** I trust and understand the score before acting on it (P2 — Trust Through Transparency).

**Acceptance Criteria:**
- [ ] "Comportamiento" tab in visitor profile panel shows heat index breakdown
- [ ] Displays breakdown: product view count (×weight), recurring visits (×weight), time on product pages (×weight), sum = total score
- [ ] Example display: `"87 puntos = 5 vistas de producto (×15) + 3 visitas recurrentes (×12) + 8min en ficha (×10)"`
- [ ] Data comes from `heatIndexSignals` field already in the visitor list payload — no additional API call
- [ ] When `heatIndexSignals` is absent (optional field), tab shows "Desglose no disponible" gracefully
- [ ] `HeatIndexBadge` in profile header is clickable and scrolls to / activates "Comportamiento" tab
- [ ] Vitest test: breakdown renders correctly for given `HeatIndexSignals` input; graceful when signals absent

**Technical Notes:**
- `heatIndexSignals` is optional on `VisitorSearchResult` per architecture §6.1
- Weight multipliers displayed in UI are for transparency only — actual weights are backend-computed
- This tab is a UX requirement for P2 (Trust Through Transparency) and FR8

**Dependencies:** Story 2.4, Story 1.2  
**Size:** M (5 pts) + ⚠️ Backend dependency (`heatIndexSignals` optional field in visitor search response)

---

### Story 2.6: Mock Data for Product History (Developer Enablement)

**As a** developer, **I want** realistic mock data for product history, **so that** frontend development and testing can proceed independently before the backend endpoint is ready.

**Acceptance Criteria:**
- [ ] New file `libs/chat/data-access/visitor-products-service/src/lib/visitor-products-mock-data.ts` with 3 products across 2 sessions
- [ ] Mock includes: 1 product in "current session" (ACTIVO AHORA), 2 products in "previous session"
- [ ] Mock covers: a product with `viewCount: 5` and a product with `viewCount: 1` for frequency bar variation
- [ ] `VisitorProductsService` returns mock when `USE_MOCK_DATA=true` (using `USE_MOCK_DATA` token from `shared/config`)
- [ ] `visitors-mock-data.ts` extended with `heatIndex: 87`, `heatIndexTier: 'hot'`, `heatIndexSignals` fields
- [ ] `npm run serve:mock` runs without errors and shows product history panel with mock data

**Technical Notes:**
- Mock data files live in their respective `data-access` library, never in `shared`
- Follow existing mock pattern from `visitors-mock-data.ts`

**Dependencies:** Story 2.1  
**Size:** S (2 pts)

---

## Epic 3: Proactive Chat from Profile

**Goal:** Enable agents to initiate a conversation with a visitor directly from the profile panel with behavioral context already loaded, closing the gap between identifying intent and making contact.

**MVP Scope:** FR14, FR15, FR16

---

### Story 3.1: "Iniciar Chat" CTA on Visitor Profile

**As an** agent, **I want** a prominent "Iniciar Chat" button in the visitor profile panel, **so that** I can start a proactive conversation with a single click without navigating away.

**Acceptance Criteria:**
- [ ] "Iniciar Chat" primary button renders in the identity header area of the visitor profile panel (per UX §4.2)
- [ ] Button is sticky — always visible even when scrolling through the profile
- [ ] Button is rendered in disabled state during the initial profile loading skeleton phase; enabled once visitor data is available
- [ ] Clicking the button triggers `createChatWithVisitor(visitor.id)` on the existing `ChatService`
- [ ] Optimistic UI: button text changes to "Abriendo..." immediately (< 200ms, NFR5) without waiting for the API response
- [ ] On success: chat widget opens with the visitor pre-selected; profile panel stays open to maintain context
- [ ] On error: button reverts to "Iniciar Chat" + toast error message "No se pudo iniciar el chat. Inténtalo de nuevo."
- [ ] Button is accessible: `aria-label="Iniciar chat con visitante {visitorName}"` 
- [ ] E2E test: `test('agent initiates proactive chat from visitor profile')`

**Technical Notes:**
- Use existing `ChatService.createChatWithVisitor()` — no new service needed
- Profile panel must NOT navigate away — chat widget opens as overlay
- Quick chat `[Chat ▶]` on list row also triggers this same flow (without opening profile first)

**Dependencies:** Story 2.4  
**Size:** M (5 pts)

---

### Story 3.2: Visitor Context Pre-Loaded in Chat Widget

**As an** agent, **I want** to see the visitor's heat index and key vehicle context in the chat header when I start a conversation, **so that** I have all the information I need to write an effective first message without switching views.

**Acceptance Criteria:**
- [ ] Chat widget header/context bar displays visitor's heat index score and tier when opening a proactive chat
- [ ] Vehicle(s) currently being viewed (from `currentSessionProducts`) shown in chat context bar — at minimum the most recent/active vehicle
- [ ] If no product history available, context bar shows current URL and traffic source (fallback context, FR7)
- [ ] Context data is passed from the visitor profile signal — no additional API call from the chat widget
- [ ] Context bar is read-only (not editable by agent)
- [ ] Vitest test: context bar renders heat index and vehicle name from visitor data

**Technical Notes:**
- Context data flows: `VisitorsComponent.productHistory` signal → `ChatService.openChatWithContext(visitor, context)` → chat widget context bar
- This avoids a second API call from the chat layer
- Context bar is a UI enhancement to the existing inbox/chat widget component

**Dependencies:** Story 3.1, Story 2.4  
**Size:** M (5 pts)

---

### Story 3.3: Chat History Tab in Visitor Profile

**As an** agent, **I want** to see the previous conversation history with a visitor in their profile panel, **so that** I know if we've spoken before and can provide continuity in the conversation.

**Acceptance Criteria:**
- [ ] "Chats" tab in visitor profile panel shows list of previous conversations chronologically
- [ ] Each conversation shows: date, first message snippet, status (open/closed), assigned agent name
- [ ] Empty state when no previous chats: "Primera visita registrada de este visitante. No hay conversaciones previas."
- [ ] Conversations are loaded when the "Chats" tab is activated (lazy load — not on panel open)
- [ ] Loading state: skeleton rows while fetching
- [ ] Error state: "No se pudieron cargar los chats anteriores. [Reintentar]"
- [ ] Clicking a previous conversation shows a read-only view or navigates to inbox

**Technical Notes:**
- Use existing `ChatService` or `visitors-data-service` to fetch conversation history for a visitor
- Lazy load on tab activation using `effect()` or click handler — avoid loading on panel open

**Dependencies:** Story 2.4  
**Size:** S (3 pts)

---

## Epic 4: LeadCars Integration Panel

**Goal:** Give supervisors complete visibility and control over the LeadCars sync pipeline — including diagnosing failures, retrying records, and updating configuration — without needing to open support tickets or access backend logs.

**MVP Scope:** FR17, FR18, FR19, FR20, FR21, FR22, FR23

---

### Story 4.1: Create `LeadCarsStatusService` Data-Access Library

**As a** developer, **I want** a dedicated HTTP service for LeadCars operational status and sync-record management, **so that** status monitoring is cleanly separated from the existing configuration service.

**Acceptance Criteria:**
- [ ] New library: `libs/admin/data-access/leadcars-status-service`
- [ ] Path alias registered: `@guiders-frontend/admin/data-access/leadcars-status-service`
- [ ] Tags: `scope:admin type:data-access`
- [ ] Methods: `getStatus(): Observable<LeadCarsStatus>`, `getFailedSyncRecords(page?, limit?): Observable<LeadCarsSyncRecordsResponse>`, `retrySync(recordId: string): Observable<{ success: boolean }>`, `retryAllFailed(): Observable<{ queued: number }>`
- [ ] All calls include `{ withCredentials: true }`
- [ ] Endpoints: `GET /leadcars/status`, `GET /leadcars/sync-records?status=failed`, `POST /leadcars/sync-records/:id/retry`
- [ ] Mock implementation: `leadcars-status-mock-data.ts` with `connected: true`, `failedRecordsCount: 14`, 3 failed records in list
- [ ] Vitest unit tests: `getStatus()` maps response correctly; `retrySync()` sends POST to correct URL; `getFailedSyncRecords()` handles pagination params

**Technical Notes:**
- Separate from existing `leads-service` (which handles config CRUD) per architecture §3.4 — different refresh cadence and role requirements
- `LeadCarsStatus` and `LeadCarsSyncRecordsResponse` types from Story 2.2 (shared types)
- ⚠️ **Backend dependency:** `GET /leadcars/status` needs confirmation/creation (architecture §6.3); `POST /leadcars/sync-records/:id/retry` needs creation (architecture §6.7)

**Dependencies:** Story 2.2  
**Size:** M (5 pts) + ⚠️ Backend dependencies

---

### Story 4.2: Create `LeadCarsStatusPanel` UI Component

**As a** developer, **I want** a presentational component for the LeadCars status and failed records section, **so that** the status panel is testable in isolation from the data-fetching orchestration.

**Acceptance Criteria:**
- [ ] New library: `libs/admin/ui/leadcars-status-panel` with selector `guiders-leadcars-status-panel`
- [ ] Path alias registered in `tsconfig.base.json`
- [ ] Tags: `scope:admin type:ui`
- [ ] Signal inputs: `status: input<LeadCarsStatus | null>(null)`, `failedRecords: input<LeadCarsSyncRecord[]>([])`, `loading: input<boolean>(false)`, `retryingId: input<string | null>(null)`
- [ ] Outputs: `retryRecord = output<string>()` (recordId), `retryAll = output<void>()`, `refresh = output<void>()`
- [ ] Status banner variants per UX §4.3: green (active, 0 errors), amber (active with errors), red (disconnected)
- [ ] Failed records list: each row shows visitor ID (truncated), error message, date, `[Reintentar]` button
- [ ] `[Reintentar todos]` button at section header — emits `retryAll` event
- [ ] Empty state for failed records: "✓ Sin registros fallidos. Todos los leads se han sincronizado correctamente."
- [ ] `retryingId` input disables/shows spinner on the specific record being retried
- [ ] Status banner uses `role="status"` and `aria-live="polite"` (UX §6.3)
- [ ] Vitest tests: green/amber/red banner states, `retryRecord` event emits correct recordId, empty failed records state, retry all button emits event

**Technical Notes:**
- Pure presentational — no service injection
- Pagination for failed records: component accepts `totalPages` input, emits `pageChange` output

**Dependencies:** Story 2.2  
**Size:** M (5 pts)

---

### Story 4.3: LeadCars Status Page in Admin Integrations Feature

**As a** supervisor, **I want** to see the LeadCars connection status and failed sync records when I navigate to the integrations panel, **so that** I can diagnose sync failures without needing external tools or log access.

**Acceptance Criteria:**
- [ ] Route `/admin/integrations/leadcars` renders `LeadCarsStatusPanelComponent` above the existing `LeadCarsConfigComponent`
- [ ] `LeadCarsStatusService.getStatus()` called on page init; result bound to `<guiders-leadcars-status-panel [status]="...">`
- [ ] `LeadCarsStatusService.getFailedSyncRecords()` called on page init; result bound to `[failedRecords]="..."`
- [ ] Status polling: `setInterval` at 60s — independent from visitor list polling (architecture §5.5, NFR19)
- [ ] Polling is cleared `takeUntilDestroyed` on component destroy
- [ ] Page loads in < 2 seconds (NFR4)
- [ ] `[Refrescar]` button triggers manual reload of both status and failed records
- [ ] Error handling: if `getStatus()` fails, shows error banner in the status section only — does NOT affect the config form below
- [ ] E2E tests (`admin-e2e`):
  - `test('supervisor sees LeadCars connection status')`
  - `test('supervisor sees list of failed sync records with error details')`

**Technical Notes:**
- Architecture §7.3: route component orchestrates both `<guiders-leadcars-status-panel>` and `<lib-leadcars-config>` as siblings
- Independent polling chain — failure of `GET /leadcars/status` must not break any other feature (NFR20)
- ⚠️ **Backend dependency:** `GET /leadcars/status` endpoint

**Dependencies:** Story 4.1, Story 4.2  
**Size:** M (5 pts)

---

### Story 4.4: Manual Retry of Failed Sync Records

**As a** supervisor, **I want** to manually retry individual failed sync records or retry all at once, **so that** I can recover leads that failed to sync to LeadCars without filing a support ticket.

**Acceptance Criteria:**
- [ ] Clicking `[Reintentar]` on a failed record calls `LeadCarsStatusService.retrySync(recordId)`
- [ ] Optimistic UI: the record row shows a spinner and "Reintentando..." state while the call is in flight
- [ ] On success: record is removed from the failed list; success toast "Registro reintentado correctamente"
- [ ] On failure: record stays in list; error toast "No se pudo reintentar. [Ver detalle]"
- [ ] `[Reintentar todos]` button calls `LeadCarsStatusService.retryAllFailed()`
- [ ] While retrying all: button shows progress "Reintentando 14 registros..." with spinner
- [ ] On complete: success banner "14/14 registros sincronizados ✓"; failed records section updates
- [ ] Individual retry is independent — retrying one record does NOT block retrying another
- [ ] E2E test: `test('supervisor retries a failed sync record')`

**Technical Notes:**
- Optimistic UI pattern: use `retryingId` signal to track in-flight record ID; pass to `LeadCarsStatusPanelComponent` as input
- `retryAllFailed()` response: `{ queued: number }` — show count in progress message
- ⚠️ **Backend dependency:** `POST /leadcars/sync-records/:id/retry` endpoint needs creation (architecture §6.7)

**Dependencies:** Story 4.3  
**Size:** M (5 pts) + ⚠️ Backend dependency

---

### Story 4.5: LeadCars Configuration Form (Verify & Harden Existing)

**As a** supervisor, **I want** to update LeadCars credentials (token, concesionario ID, sede, environment), **so that** I can correct configuration errors like a wrong `concesionarioId` without developer involvement.

**Acceptance Criteria:**
- [ ] Existing `LeadCarsConfigComponent` (`libs/admin/features/integrations`) reviewed against UX spec §4.3 — gaps identified and filled
- [ ] `useSandbox` toggle shows persistent amber badge "⚠️ SANDBOX — los leads NO se enviarán a producción" above config form header (always visible while sandbox active, UX §5.4)
- [ ] When `useSandbox` toggled ON: amber warning `role="alert"` announces to screen readers
- [ ] `clienteToken` field renders as `type="password"` with show/hide toggle (`aria-pressed`, `aria-label="Mostrar/ocultar token"`)
- [ ] Token field: on page load, shows masked value (●●●●●●●●●●) — does NOT pre-populate with real token (NFR7)
- [ ] Token is only sent in the save payload when the user actively changes it (empty = do not update)
- [ ] All form fields have `<label>` with `for` attribute; required fields have `aria-required="true"` (WCAG §6.3)
- [ ] Form validation: `clienteToken` and `concesionarioId` are required; `[Guardar]` is disabled until valid
- [ ] `[Probar conexión]` button available on existing configuration AND after form changes (not only after save)
- [ ] E2E test: `test('supervisor updates LeadCars credentials and tests connection')`

**Technical Notes:**
- Use existing `LeadsService.saveConfig()` and `LeadsService.testConnection()` — FR22 and FR23 are already partially implemented per architecture §6.5 and §6.6
- Audit `clienteToken` handling: confirm backend returns masked token on GET (open question architecture §Appendix C Q5)
- Security note (NFR7): token must never be in localStorage, sessionStorage, or Angular state beyond the reactive form

**Dependencies:** Story 4.3  
**Size:** M (5 pts)

---

### Story 4.6: LeadCars Error Badge in Admin Sidebar

**As a** supervisor, **I want** to see the count of failed LeadCars sync records in the admin sidebar, **so that** I notice integration failures without having to actively navigate to the integrations panel.

**Acceptance Criteria:**
- [ ] Admin sidebar "Integraciones" navigation item shows an amber badge with the count of `failedRecordsCount` when > 0
- [ ] Badge disappears when `failedRecordsCount === 0`
- [ ] Badge count is sourced from the same `LeadCarsStatusService.getStatus()` call used by the status panel (shared observable, not a separate polling call)
- [ ] Badge updates on the 60s polling interval (same as status panel)
- [ ] Badge accessible: `aria-label="Integraciones — {N} errores de sincronización"` on the nav item
- [ ] Vitest test: badge renders when failedRecordsCount > 0, hidden when 0

**Technical Notes:**
- UX spec §2.2: "secondary badge in admin sidebar as error count when `sync-records/failed` > 0"
- Sidebar component receives `failedRecordsCount` via signal from the admin shell or a shared status service stream
- Do NOT create a second polling interval — reuse the observable from `LeadCarsStatusService`

**Dependencies:** Story 4.1, Story 4.3  
**Size:** S (2 pts)

---

## Epic 5: Authentication & Access Control

**Goal:** Ensure every user can authenticate securely and that the system enforces role-based access, preventing agents from accessing configuration and ensuring tenant data isolation.

**MVP Scope:** FR29, FR30, FR31

---

### Story 5.1: Verify and Complete Login Flow (OAuth2 PKCE)

**As a** user, **I want** to log in with my credentials and be taken to the correct app (console or admin) based on my role, **so that** I have access to the features relevant to my job.

**Acceptance Criteria:**
- [ ] Login flow tested end-to-end: navigate to `/login`, enter credentials, redirect to `/visitors` (agent) or `/dashboard` (supervisor)
- [ ] OAuth2 PKCE flow works against the real backend auth endpoint
- [ ] JWT token stored correctly (session cookie) — never in localStorage (NFR6)
- [ ] Failed login shows error message "Credenciales incorrectas. Inténtalo de nuevo."
- [ ] After successful login, `SessionService.getCurrentUser()` returns the authenticated user with `role` field
- [ ] Session expiry: `401` responses from any API trigger session clear + redirect to `/login` (HTTP interceptor)
- [ ] Session expiry announced via `role="alert"` before redirect (WCAG §6.4)
- [ ] E2E test: `test('user logs in and is redirected to correct app based on role')`

**Technical Notes:**
- Existing `libs/auth/features/login` — audit and verify completeness
- HTTP 401 interceptor: verify it's implemented globally in both console and admin apps (architecture §8.4)
- If not yet implemented, add interceptor to `app.config.ts` in both apps

**Dependencies:** None  
**Size:** M (5 pts)

---

### Story 5.2: Supervisor Route Guard for Admin Features

**As a** system, **I want** to block agents from accessing admin configuration routes, **so that** LeadCars credentials and tenant configuration cannot be changed by non-supervisors.

**Acceptance Criteria:**
- [ ] `supervisorGuard: CanActivateFn` implemented at `libs/auth/features/login` or `auth/data-access/session`
- [ ] Guard allows access if `user.role === 'SUPERVISOR' || user.role === 'SUPER_ADMIN'`
- [ ] Guard redirects agents to `/console` (not `/login`) when attempting to access admin routes
- [ ] All admin app routes gated by `supervisorGuard` in `app.routes.ts`
- [ ] `/integrations/**`, `/users/**`, `/ai/**` routes confirmed as protected
- [ ] Vitest test: guard returns `true` for supervisor, returns `UrlTree` redirect for agent role
- [ ] E2E test: agent navigating directly to `/admin/integrations` is redirected to console

**Technical Notes:**
- Frontend guard is UX-only — backend enforces RBAC on every API call (architecture §8.3)
- Use `inject(SessionService).getCurrentUser()` pattern — never constructor injection
- If guard already exists, verify it covers all admin routes

**Dependencies:** Story 5.1  
**Size:** S (2 pts)

---

### Story 5.3: Tenant Data Isolation — Frontend Enforcement Audit

**As a** developer, **I want** to audit all HTTP service calls to ensure they never construct cross-tenant requests, **so that** no visitor data from one concesionario is ever accessible from another tenant's session.

**Acceptance Criteria:**
- [ ] All HTTP service calls in `VisitorProductsService`, `LeadCarsStatusService`, and existing services use `{ withCredentials: true }` — no hardcoded `tenantId` in URLs
- [ ] No `tenantId` or `companyId` accepted as function parameters in services (derivation from session cookie only)
- [ ] `SessionService.clearSession()` called on logout — clears all in-memory signals and flushes BehaviorSubject streams
- [ ] No visitor data persisted in `localStorage` or `sessionStorage` between sessions
- [ ] Code review checklist item: PR description for any new service must confirm `withCredentials: true` on all HTTP calls
- [ ] Unit test: verify `VisitorProductsService.getVisitorProducts()` does NOT accept `tenantId` as a parameter

**Technical Notes:**
- Architecture §5.4 and §8.1: frontend defends against accidental cross-tenant URL construction
- Backend validates tenant scope from JWT on every request — this story ensures frontend is a clean collaborator
- Review `mapSearchResultToVisitor()` — confirm no tenant info leaked into URL params

**Dependencies:** Story 5.1  
**Size:** S (3 pts)

---

## Epic 6: Foundation & Observability

**Goal:** Ensure the product meets its non-functional requirements — polling intervals, performance budgets, graceful error handling, and infrastructure for running the new libraries — so the MVP is stable enough for real-user testing with a live dealership.

**MVP Scope:** NFR1–NFR5, NFR6–NFR10, NFR11–NFR20, FR32, FR33, FR35, FR36

---

### Story 6.1: Nx Library Scaffolding for All New Libraries

**As a** developer, **I want** all new MVP libraries properly scaffolded in the Nx monorepo, **so that** path aliases, tags, lint boundaries, and build targets are correctly configured before feature development begins.

**Acceptance Criteria:**
- [ ] 5 new libraries created with `nx generate @nx/angular:library`:
  - `libs/chat/data-access/visitor-products-service` (tags: `scope:chat type:data-access`)
  - `libs/chat/ui/visitor-product-history` (tags: `scope:chat type:ui`)
  - `libs/chat/ui/heat-index-badge` (tags: `scope:chat type:ui`)
  - `libs/admin/data-access/leadcars-status-service` (tags: `scope:admin type:data-access`)
  - `libs/admin/ui/leadcars-status-panel` (tags: `scope:admin type:ui`)
- [ ] All 5 path aliases added to `tsconfig.base.json` (per architecture §Appendix A)
- [ ] `eslint.config.mjs` boundary rules verified: `type:ui` libs do NOT import `data-access` or `feature` libs
- [ ] `nx build` passes for all new empty libraries
- [ ] `nx lint` passes for all new empty libraries
- [ ] `nx graph` correctly shows new nodes and their dependencies

**Technical Notes:**
- Scaffold before writing any feature code — path aliases must exist for imports to work
- Use `standalone: true` and `changeDetection: OnPush` in Nx generator defaults (`nx.json`)

**Dependencies:** None  
**Size:** S (2 pts)

---

### Story 6.2: Visitor List Polling at ≤30s (NFR3 Validation)

**As a** developer, **I want** to verify and lock the visitor list polling interval at ≤30 seconds, **so that** the heat index and visitor status update frequently enough for agents to act in the moment.

**Acceptance Criteria:**
- [ ] Default polling interval is 30s (already `visitors_auto_refresh_interval` in localStorage defaults)
- [ ] Minimum configurable interval: 10s; maximum: 5 minutes
- [ ] Auto-refresh dropdown in visitor list header: options 10s / 30s / 1min / 5min / off (per UX §4.1)
- [ ] Selected interval persisted to `localStorage` key `visitors_auto_refresh_interval`
- [ ] Auto-refresh status announced via `aria-live="polite"` region: "Lista actualizada. N visitantes activos." (UX §6.1)
- [ ] Auto-refresh animation respects `prefers-reduced-motion` media query
- [ ] `setInterval` is cleared in `ngOnDestroy` / `takeUntilDestroyed` — no memory leaks
- [ ] Vitest test: polling triggers `searchVisitors()` at configured interval; interval cleared on component destroy
- [ ] Performance: a 30s poll with 20 visitors does NOT block the UI thread (polling in background, `OnPush` change detection)

**Technical Notes:**
- Architecture §4.2: existing `VisitorsComponent` already implements `window.setInterval` polling
- Audit current implementation; fix or lock if the default is not 30s
- `LeadCars status` polling is separate (60s) — this story is console visitor list only

**Dependencies:** Story 1.3  
**Size:** S (2 pts)

---

### Story 6.3: Global HTTP Error Boundary & Performance Skeleton Loaders

**As an** agent, **I want** loading skeletons and graceful error states across all new profile sections, **so that** the interface feels fast (< 200ms visual response) and never shows broken or empty panels without explanation (NFR1, NFR5).

**Acceptance Criteria:**
- [ ] Visitor profile panel: identity header renders from list payload immediately (no skeleton); vehicle history section shows skeleton shimmer < 200ms after panel opens
- [ ] `VisitorProductHistoryComponent` loading state: 2–3 skeleton vehicle card rows with shimmer animation
- [ ] LeadCars status panel: skeleton for status banner and records list while `getStatus()` is in flight
- [ ] Skeleton elements marked with `aria-hidden="true"` (UX §6.4)
- [ ] Global HTTP interceptor catches `401` → clear session → redirect to `/login` (architecture §8.4); verify works in both console and admin apps
- [ ] HTTP interceptor catches `500` / network errors → does NOT crash the app; logs error to console
- [ ] Profile panel CTA button renders immediately in disabled state (not hidden) during loading (UX §4.2)
- [ ] Vitest test: loading=true on `VisitorProductHistoryComponent` shows skeleton, not empty state

**Technical Notes:**
- Skeleton shimmer: use existing design token `animation` values or CSS `@keyframes`
- Interceptor must be provided in `app.config.ts` `provideHttpClient(withInterceptors([...]))` pattern
- Do NOT use deprecated `HttpInterceptor` class pattern — use functional interceptor

**Dependencies:** Story 2.3, Story 4.2  
**Size:** M (5 pts)

---

### Story 6.4: End-to-End Test Coverage for MVP Critical Paths

**As a** QA engineer, **I want** Playwright E2E tests covering the MVP critical user flows, **so that** regressions in the most important journeys are caught automatically.

**Acceptance Criteria:**
- [ ] Console E2E (`apps/console-e2e`) — 6 tests passing:
  - `test('agent sees heat index on visitor card')`
  - `test('agent can sort visitor list by heat index')`
  - `test('agent opens visitor profile and sees product history')`
  - `test('agent sees empty state when no product tracking data')`
  - `test('agent sees fallback data (URL, source) in empty state')`
  - `test('product history separates current session from previous')`
- [ ] Admin E2E (`apps/admin-e2e`) — 4 tests passing:
  - `test('supervisor sees LeadCars connection status')`
  - `test('supervisor sees list of failed sync records with error details')`
  - `test('supervisor retries a failed sync record')`
  - `test('supervisor updates LeadCars credentials and tests connection')`
- [ ] All E2E tests run against `npm run serve:mock` (mock data mode) — no backend required for CI
- [ ] `nx e2e console-e2e` and `nx e2e admin-e2e` both pass in CI

**Technical Notes:**
- All E2E tests run against mock data server (`VITE_USE_MOCK_DATA=true`) for repeatability
- Use Playwright page object model pattern matching existing `console-e2e` test structure
- Tests are created alongside Stories 1–5 — this story ensures they're wired and passing together

**Dependencies:** All stories in Epics 1–5  
**Size:** M (5 pts)

---

### Story 6.5: Mock Data Completeness Audit and `serve:mock` Validation

**As a** developer, **I want** `npm run serve:mock` to run the full console and admin apps with realistic mock data for all MVP features, **so that** frontend development is unblocked even when backend endpoints are not yet available.

**Acceptance Criteria:**
- [ ] `npm run serve:mock` starts without errors on port 4200 (console) and port 4201 (admin)
- [ ] Visitor list shows 5+ mock visitors with `heatIndex`, `heatIndexTier`, and `heatIndexSignals` populated
- [ ] Opening a visitor profile shows product history: at least 1 current-session vehicle and 2 historical vehicles
- [ ] Opening a visitor with no product events shows the Variant A empty state with fallback context
- [ ] LeadCars admin panel shows: connection status `connected: true`, 3 failed records with error details
- [ ] `[Reintentar]` in mock mode shows optimistic UI and clears the record (mock mutation)
- [ ] Mock data for all new services: `visitor-products-mock-data.ts`, `leadcars-status-mock-data.ts`
- [ ] All existing mock data files updated with new `heatIndex` and `heatIndexTier` fields

**Technical Notes:**
- This story is a validation checkpoint — it depends on mock data created across Epics 1–4
- Use existing `USE_MOCK_DATA` token injection pattern
- `serve:mock` should be runnable by anyone on the team without backend setup

**Dependencies:** Stories 2.6, 4.1 (mock data files)  
**Size:** S (2 pts)

---

## Dependency Map and Critical Path

```
Story 6.1 (Nx scaffolding)
    ├── Story 1.1 (HeatIndexBadge component)
    │       └── Story 1.3 (badge on VisitorCard)
    │               └── Story 1.4 (sort by heat index) ⚠️ backend
    │               └── Story 6.2 (polling validation)
    │
    ├── Story 1.2 + 2.2 (shared types)
    │       └── Story 2.1 (VisitorProductsService) ⚠️ backend BLOCKER
    │       └── Story 2.3 (VisitorProductHistoryComponent)
    │               └── Story 2.4 (integrate into profile panel)
    │                       └── Story 2.5 (behavior breakdown tab)
    │                       └── Story 3.1 (Iniciar Chat CTA)
    │                               └── Story 3.2 (context in chat widget)
    │                       └── Story 3.3 (chat history tab)
    │
    ├── Story 4.1 (LeadCarsStatusService) ⚠️ backend
    │       └── Story 4.2 (LeadCarsStatusPanel component)
    │               └── Story 4.3 (status page in admin)
    │                       └── Story 4.4 (retry records) ⚠️ backend
    │                       └── Story 4.5 (config form hardening)
    │                       └── Story 4.6 (sidebar error badge)
    │
    └── Story 5.1 (login flow)
            └── Story 5.2 (supervisor guard)
            └── Story 5.3 (tenant isolation audit)

Story 6.3 (error boundaries) → depends on 2.3, 4.2
Story 6.4 (E2E tests) → depends on all epics 1–5
Story 6.5 (mock validation) → depends on 2.6, 4.1
```

---

## Backend Dependencies Summary

| Endpoint | Status | Blocks | Priority |
|----------|--------|--------|----------|
| `GET /visitors/:id/products` | ❌ Does not exist | Stories 2.1, 2.4, 2.5, 3.2 (entire Epic 2) | **CRITICAL — Sprint Day 1** |
| `GET /visitors/search` → `heatIndex` field | ⚠️ Field addition needed | Stories 1.3, 1.4 (entire Epic 1) | **HIGH** |
| `GET /leadcars/status` | ⚠️ Needs confirmation/creation | Stories 4.3, 4.6 | **HIGH** |
| `POST /leadcars/sync-records/:id/retry` | ❌ Does not exist | Story 4.4 | **MEDIUM** |
| `heatIndex` as MongoDB sort field (index) | ⚠️ Performance concern | Story 1.4 | **MEDIUM** |
| `GET /visitors/search` → `heatIndexSignals` (optional) | ⚠️ Optional enhancement | Story 2.5 | **LOW** |
| `clienteToken` masking on `GET /leadcars/config` | ⚠️ Security verification | Story 4.5 | **MEDIUM** |

---

*End of Epics and Stories document*
