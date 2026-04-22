# Architecture Document — guiders-frontend MVP

**Author:** Winston (BMad Architect)  
**Date:** 2026-04-22  
**Status:** Draft — ready for team review  
**PRD Reference:** `_bmad-output/planning-artifacts/prd.md`

---

## 1. System Context

guiders-frontend operates as the operator-facing UI layer within a multi-component SaaS system. Understanding the full data flow is essential to making correct frontend architectural decisions.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEALERSHIP WEBSITE                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  guiders SDK (v1.5.3) — DO NOT MODIFY FOR MVP                │   │
│  │  - Emits PRODUCT_VIEW events with {productId, name, url}     │   │
│  │  - Manages visitor fingerprint + session lifecycle            │   │
│  │  - POST /tracking-v2/events  →  NestJS Backend               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS / WSS
┌─────────────────────────────────────────────────────────────────────┐
│                     NestJS BACKEND (existing)                        │
│                                                                      │
│  tracking-v2 module  ──► MongoDB (events store)                      │
│  visitors module     ──► Visitor search, activity, sessions          │
│  leadcars module     ──► LeadCars CRM integration + sync-records     │
│  auth module         ──► JWT + tenant-scoped session                 │
│                                                                      │
│  🆕 NEW ENDPOINT NEEDED:                                             │
│     GET /visitors/:id/products  (MVP blocker — see §6)               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  CONSOLE APP     │  │  ADMIN APP        │
         │  (port 4200)     │  │  (port 4201)      │
         │  Agent UX        │  │  Supervisor UX    │
         │  - Visitor list  │  │  - LeadCars panel │
         │  - Heat index    │  │  - Sync records   │
         │  - Product hist. │  │  - Config/test    │
         └──────────────────┘  └──────────────────┘
                    │
                    ▼ API (via guiders backend)
┌─────────────────────────────────────────────────────────────────────┐
│                       LeadCars CRM                                   │
│  apisandbox.leadcars.es  |  api.leadcars.es                         │
│  Lead creation, concesionario/sede/campaña data                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Constraints From Context

1. **SDK is read-only for MVP** — `PRODUCT_VIEW` events already fire; we consume them, we do not change them.
2. **Backend owns the heat index computation** — The frontend only displays the value. Any scoring logic on the frontend side would be a duplication of truth.
3. **LeadCars credentials never touch the frontend** — `clienteToken` is stored and proxied exclusively through the backend. The admin UI sends configuration to the backend, not directly to LeadCars.
4. **Multi-tenancy is enforced at the API layer** — The frontend's responsibility is to never construct cross-tenant requests. The backend rejects them regardless.

---

## 2. Frontend Architecture Overview

### 2.1 Nx Monorepo Structure

```
apps/
├── console/          # Agent console (port 4200) — Angular 20
└── admin/            # Admin panel (port 4201) — Angular 20

libs/
├── auth/
│   ├── features/login/          # OAuth2 PKCE flow
│   ├── data-access/session/     # SessionService, JWT, ENVIRONMENT_TOKEN
│   └── ui/                      # Login form, profile modal
│
├── chat/
│   ├── features/
│   │   ├── visitors/            # Main visitor list + profile (console)
│   │   ├── inbox/               # Chat messaging
│   │   ├── contacts/
│   │   └── escalations/
│   ├── data-access/
│   │   ├── visitors-data-service/   # HTTP layer for visitors
│   │   ├── chat-service/
│   │   └── websocket-service/
│   └── ui/
│       ├── visitors-list/
│       ├── visitor-detail-panel/
│       └── ...
│
├── admin/
│   ├── features/
│   │   ├── integrations/        # Contains leadcars-config (existing, MVP extends)
│   │   ├── dashboard/
│   │   └── users/
│   └── data-access/
│       └── leads-service/       # LeadCars config HTTP layer (existing)
│
├── analytics/
│   └── features/admin-dashboard/
│
└── shared/
    ├── types/                   # All TypeScript interfaces
    ├── ui/                      # Presentational components (badge, button, etc.)
    ├── design-tokens/           # SCSS variables
    ├── config/                  # USE_MOCK_DATA token
    └── data-access/theme/
```

### 2.2 Angular 20 Patterns In Use

| Pattern | Implementation | Where Used |
|---------|---------------|------------|
| Standalone components | `standalone: true` always | All components |
| Signal state | `signal<T>()`, `computed()`, `effect()` | Feature components |
| OnPush change detection | `ChangeDetectionStrategy.OnPush` | All components |
| Signal inputs | `input<T>()`, `input.required<T>()` | UI components |
| `inject()` DI | Instead of constructor params | All services/components |
| `takeUntilDestroyed` | RxJS cleanup via `DestroyRef` | All subscriptions |
| Lazy-loaded routes | `loadComponent()` | App routing |

### 2.3 State Management Approach

The project uses a **two-tier state approach** — no NgRx, no Akita, keeping things boring and predictable:

**Tier 1 — Component-local signals** (for UI state):
```typescript
readonly loading = signal<boolean>(false);
readonly visitors = signal<Visitor[]>([]);
readonly heatIndex = signal<number | null>(null);
```

**Tier 2 — Service-level BehaviorSubject + Observable** (for shared/async state):
```typescript
// In services like LeadsService:
private readonly _config = new BehaviorSubject<LeadCarsCompanyConfig | null>(null);
readonly config$ = this._config.asObservable();
```

**Polling** is managed via `window.setInterval` in feature components, with configurable intervals persisted in `localStorage`. The current default is 30s — which directly satisfies NFR3.

---

## 3. New Libraries Required for MVP

The MVP introduces two new capabilities: **visitor product history** (console) and an **enhanced LeadCars status panel** (admin). Below is the complete library plan.

### 3.1 `libs/chat/data-access/visitor-products-service`

| Property | Value |
|----------|-------|
| **Path** | `libs/chat/data-access/visitor-products-service` |
| **Alias** | `@guiders-frontend/chat/data-access/visitor-products-service` |
| **Tags** | `scope:chat type:data-access` |
| **Purpose** | HTTP client for the new `GET /visitors/:id/products` endpoint |

**Key Exports:**
```typescript
// visitor-products.service.ts
export interface ProductView {
  productId: string;
  productName: string;
  productUrl: string;
  viewCount: number;
  firstViewedAt: string;   // ISO 8601
  lastViewedAt: string;    // ISO 8601
  sessionId: string;       // To distinguish current vs. previous sessions
  thumbnailUrl?: string;
}

export interface VisitorProductsResponse {
  visitorId: string;
  currentSessionId: string;        // For FR5: distinguish current vs. prior sessions
  products: ProductView[];
  totalEvents: number;
}

@Injectable({ providedIn: 'root' })
export class VisitorProductsService {
  getVisitorProducts(visitorId: string): Observable<VisitorProductsResponse>;
}
```

**Why a new library vs. adding to `visitors-data-service`?**  
`visitors-data-service` is already 865+ lines. The product history endpoint has distinct semantics (tracking domain, not visitor management domain) and will grow in Phase 2 with more complex queries. Separating now costs 30 minutes; merging later costs a refactor.

---

### 3.2 `libs/chat/ui/visitor-product-history`

| Property | Value |
|----------|-------|
| **Path** | `libs/chat/ui/visitor-product-history` |
| **Alias** | `@guiders-frontend/chat/ui/visitor-product-history` |
| **Tags** | `scope:chat type:ui` |
| **Purpose** | Presentational component for the product history section in the visitor profile |

**Key Exports:**
```typescript
// visitor-product-history.component.ts
@Component({ selector: 'guiders-visitor-product-history', ... })
export class VisitorProductHistoryComponent {
  // Inputs
  readonly products = input.required<ProductView[]>();
  readonly currentSessionId = input.required<string>();
  readonly loading = input<boolean>(false);
  readonly hasError = input<boolean>(false);

  // Derived
  readonly currentSessionProducts = computed(() =>
    this.products().filter(p => p.sessionId === this.currentSessionId())
  );
  readonly previousSessionProducts = computed(() =>
    this.products().filter(p => p.sessionId !== this.currentSessionId())
  );
  readonly isEmpty = computed(() => this.products().length === 0);
}
```

This component handles the empty state (FR6), fallback display (FR7), and the current vs. previous session separation (FR5). It has **no service dependencies** — pure presentation.

---

### 3.3 `libs/chat/ui/heat-index-badge`

| Property | Value |
|----------|-------|
| **Path** | `libs/chat/ui/heat-index-badge` |
| **Alias** | `@guiders-frontend/chat/ui/heat-index-badge` |
| **Tags** | `scope:chat type:ui` |
| **Purpose** | Visual heat index badge (0–100 score, color-coded tier) |

**Key Exports:**
```typescript
@Component({ selector: 'guiders-heat-index-badge', ... })
export class HeatIndexBadgeComponent {
  readonly score = input<number | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  // tier: cold (0-29) | warm (30-69) | hot (70-100)
  readonly tier = computed<'cold' | 'warm' | 'hot' | 'unknown'>(() => {
    const s = this.score();
    if (s === null) return 'unknown';
    if (s < 30) return 'cold';
    if (s < 70) return 'warm';
    return 'hot';
  });
}
```

This is a **pure UI primitive** reusable in both `VisitorCard` (list) and `VisitorProfileComponent` (detail panel). Extracting it avoids duplicating the tier-classification logic in two places.

---

### 3.4 `libs/admin/data-access/leadcars-status-service`

| Property | Value |
|----------|-------|
| **Path** | `libs/admin/data-access/leadcars-status-service` |
| **Alias** | `@guiders-frontend/admin/data-access/leadcars-status-service` |
| **Tags** | `scope:admin type:data-access` |
| **Purpose** | HTTP client for LeadCars operational status and sync record management |

**Key Exports:**
```typescript
export interface LeadCarsStatus {
  connected: boolean;
  environment: 'sandbox' | 'production';
  lastSyncAt: string | null;
  failedRecordsCount: number;
  totalSynced: number;
}

@Injectable({ providedIn: 'root' })
export class LeadCarsStatusService {
  getStatus(): Observable<LeadCarsStatus>;
  getFailedSyncRecords(page?: number, limit?: number): Observable<LeadCarsSyncRecordsResponse>;
  retrySync(recordId: string): Observable<{ success: boolean }>;
  retryAllFailed(): Observable<{ queued: number }>;
}
```

**Why separate from existing `leads-service`?**  
`leads-service` handles configuration CRUD (create/update/delete/test). Status monitoring and sync-record operations are operational concerns — different refresh cadence (polling every 60s), different role requirements (Supervisor only), different failure semantics. Keeping them separate respects SRP.

---

### 3.5 `libs/admin/ui/leadcars-status-panel`

| Property | Value |
|----------|-------|
| **Path** | `libs/admin/ui/leadcars-status-panel` |
| **Alias** | `@guiders-frontend/admin/ui/leadcars-status-panel` |
| **Tags** | `scope:admin type:ui` |
| **Purpose** | Status dashboard for LeadCars — connection state, last sync, failed records list |

**Key Exports:**
```typescript
@Component({ selector: 'guiders-leadcars-status-panel', ... })
export class LeadCarsStatusPanelComponent {
  readonly status = input<LeadCarsStatus | null>(null);
  readonly failedRecords = input<LeadCarsSyncRecord[]>([]);
  readonly loading = input<boolean>(false);

  // Outputs
  readonly retryRecord = output<string>();    // recordId
  readonly retryAll = output<void>();
}
```

Presentational only — the admin integrations feature page wires up service calls.

---

### 3.6 Shared Types Additions (no new library — extend existing)

Add to `libs/shared/types/src/lib/` the following new type files:

**`product-tracking.types.ts`** — New types for PRODUCT_VIEW:
```typescript
export interface ProductView { ... }
export interface VisitorProductsResponse { ... }
export interface HeatIndexData {
  score: number;                      // 0-100
  tier: 'cold' | 'warm' | 'hot';
  signals: HeatIndexSignals;
  computedAt: string;
}
export interface HeatIndexSignals {
  productViewCount: number;
  uniqueProductsViewed: number;
  totalTimeOnProductPages: number;    // seconds
  visitFrequency: number;             // sessions in last 30 days
  currentSessionDuration: number;     // seconds
}
```

**`leadcars-status.types.ts`** — New types for operational status:
```typescript
export interface LeadCarsStatus { ... }
export interface LeadCarsSyncRecordsResponse {
  records: LeadCarsSyncRecord[];
  pagination: { total: number; page: number; limit: number };
}
```

---

## 4. Data Flow Architecture

### 4.1 Tracking Events → Visitor Profile Display

```
Visitor browses dealership website
        │
        ▼ PRODUCT_VIEW event
guiders SDK (v1.5.3)
        │  POST /tracking-v2/events
        │  { type: "PRODUCT_VIEW", visitorId, sessionId,
        │    metadata: { productId, productName, productUrl } }
        ▼
NestJS Backend — tracking-v2 module
        │  Stores in MongoDB
        │  Updates heat index (computed server-side)
        ▼
MongoDB (events collection)
        
[30s polling trigger in console]
        │
        ▼ GET /visitors/search  (existing endpoint)
        │  Returns: visitors with heatIndex field populated
        ▼
VisitorsDataService.searchVisitors()
        │  Maps VisitorSearchResult → Visitor (adds heatIndex)
        ▼
VisitorsComponent.state signal
        │  visitors array updated
        ▼
VisitorsListComponent  →  VisitorCard  →  HeatIndexBadge
                                           (displays score)

[Agent clicks visitor card]
        │
        ▼ GET /visitors/:id/products   (🆕 NEW ENDPOINT — MVP blocker)
VisitorProductsService.getVisitorProducts(visitorId)
        │
        ▼
visitor-detail-panel  →  VisitorProductHistoryComponent
                           (current session | previous sessions)
```

### 4.2 Polling Strategy (NFR3: ≤30s update interval)

The existing `VisitorsComponent` already implements configurable polling via `window.setInterval`. The MVP locks the default to **30 seconds** (already the current default in `localStorage` key `visitors_auto_refresh_interval`).

**Polling cadence by data type:**

| Data | Polling Interval | Trigger | Component |
|------|-----------------|---------|-----------|
| Visitor list + heat index | 30s (configurable 10s–5m) | `setInterval` | `VisitorsComponent` |
| Visitor product history | On-demand (panel open) | User action | `visitor-detail-panel` |
| LeadCars status | 60s | `setInterval` | LeadCars status section |
| LeadCars sync records | On-demand + after retry | User action | `LeadCarsStatusPanelComponent` |

**Presence (connection status)** is already handled via WebSocket through `PresenceService` — this is real-time and does not need polling.

**Design principle:** Polling is fine for MVP. When Phase 2 adds WebSocket for product history, the `VisitorProductsService` interface stays the same — only the internal implementation changes. The component never knows.

### 4.3 LeadCars Sync Flow (FR17, FR18)

```
Backend auto-sync (no frontend involvement):
  Visitor lifecycle → LEAD
        │ (backend trigger: lifecycle_to_lead event)
        ▼
  NestJS leadcars module
        │  POST to api.leadcars.es/api/v2/leads
        ▼
  Success: LeadCarsSyncRecord.status = 'synced'
  Failure: LeadCarsSyncRecord.status = 'failed', lastError populated

[Admin opens LeadCars status panel — polling 60s]
        │  GET /leadcars/status
        │  GET /leadcars/sync-records?status=failed
        ▼
LeadCarsStatusService → LeadCarsStatusPanelComponent
        │  Shows: connected ✓/✗, last sync date, failed count
        │
[Admin clicks "Retry" on failed record]
        │  POST /leadcars/sync-records/:id/retry
        ▼
        Optimistic UI: record shows "retrying..."
        On success: record removed from failed list
```

---

## 5. Key Technical Decisions

### 5.1 Heat Index: Frontend vs. Backend Computation

**Decision: Backend computes, frontend displays.**

The PRD establishes the heat index as a deterministic, auditable scoring engine. Putting any scoring logic on the frontend would:
- Create divergence between what the agent sees and what the backend-triggered sync sends to LeadCars
- Require frontend access to all raw event data (expensive payload)
- Make Phase 2 configurability (tenant-specific weights) impossible without a frontend deploy

**Implementation:** The `VisitorSearchResult` type already has a `leadScore` concept via `VisitorActivity.leadScore`. For MVP, `GET /visitors/search` will include a `heatIndex: number` field in each visitor result. The frontend maps this directly to the `HeatIndexBadgeComponent`.

**Fallback when heatIndex is null:** The badge renders a neutral "—" state (unknown tier). This handles Journey 2's graceful degradation requirement.

---

### 5.2 Polling vs. WebSocket (MVP)

**Decision: Polling for visitor list and LeadCars status. WebSocket only for presence (already implemented).**

Rationale:
- PRD explicitly scopes WebSocket to Phase 2
- Polling at 30s satisfies NFR3 with zero added complexity
- The `PresenceService` WebSocket already handles the highest-frequency data (who is online right now)
- Product history is loaded on demand — no polling needed

**Risk acknowledged:** If the backend emits product events faster than 30s polling, the agent may miss the "moment of contact" window. Mitigation: the heat index in the list updates on each poll — the agent prioritises by score, not by individual events.

---

### 5.3 Visitor Product History Endpoint Consumption

**Decision: Dedicated service (`VisitorProductsService`), loaded lazily when the visitor profile opens.**

Pattern:
```typescript
// In visitor-detail-panel component:
onVisitorSelected(visitor: Visitor): void {
  this.productsLoading.set(true);
  this.productsService.getVisitorProducts(visitor.id).pipe(
    catchError(() => of({ products: [], currentSessionId: '', totalEvents: 0 })),
    finalize(() => this.productsLoading.set(false))
  ).subscribe(data => {
    this.productHistory.set(data);
  });
}
```

**Do not load product history for all visitors in the list** — this would multiply API calls by the page size on every poll. Load on profile open only.

---

### 5.4 Multi-Tenant Data Isolation in Frontend

**Decision: Trust the backend; frontend defends against accidental cross-tenant URL construction only.**

The backend validates tenant scope on every authenticated request via the JWT claim. The frontend's role:

1. Never construct API URLs with hardcoded tenant IDs — always derive from `SessionService.getCurrentUser().companyId`
2. Never cache visitor data across sessions or in `localStorage`
3. Never expose `companyId` / `tenantId` in URL query params (use headers/body)
4. On logout: clear all in-memory signals and flush `BehaviorSubject` streams

The `SessionService` is the single source of truth for the current tenant context.

---

### 5.5 LeadCars Status Polling — Failure Isolation (NFR20)

**Decision: LeadCars panel uses an independent polling chain, isolated from the visitor list.**

If `GET /leadcars/status` fails:
- The error is shown in the status panel
- The visitor list, profiles, and chat continue unaffected
- No shared error state between the two features

This satisfies NFR20: a LeadCars failure does not degrade the core chat/visitor experience.

---

## 6. API Contracts

These are the **expected shapes** that the frontend will program against. The backend team must implement or confirm these contracts before frontend development of the relevant features can complete.

### 6.1 `GET /visitors/search` — Visitor List with Heat Index

**Status:** Existing endpoint — requires `heatIndex` field addition.

**Request body (existing POST pattern):**
```json
{
  "filters": { "connectionStatus": ["online", "chatting"] },
  "sort": { "field": "heatIndex", "direction": "DESC" },
  "page": 1,
  "limit": 20
}
```

**Response — `VisitorSearchResult` addition:**
```typescript
interface VisitorSearchResult {
  // ... all existing fields ...
  heatIndex: number | null;   // 🆕 0-100 or null if insufficient data
  heatIndexTier: 'cold' | 'warm' | 'hot' | null;  // 🆕 pre-computed tier
  heatIndexSignals?: HeatIndexSignals;  // 🆕 optional — for FR8 (agent sees signals)
}
```

**Sort field addition:** `heatIndex` must be accepted as a valid `VisitorSortField`. Frontend will send `sort: { field: 'heatIndex', direction: 'DESC' }` when agent requests heat-sorted list.

---

### 6.2 `GET /visitors/:id/products` — Product View History 🆕 MVP BLOCKER

**Status:** Does not exist. Backend must create this endpoint before frontend can implement FR4.

```
GET /visitors/:visitorId/products
Authorization: Bearer <token>
```

**Response:**
```json
{
  "visitorId": "uuid",
  "currentSessionId": "session-uuid",
  "products": [
    {
      "productId": "seat-ateca-2024",
      "productName": "Seat Ateca 2.0 TDI",
      "productUrl": "/vehiculos/seat-ateca-2024",
      "viewCount": 5,
      "firstViewedAt": "2026-04-21T09:00:00Z",
      "lastViewedAt": "2026-04-22T09:17:00Z",
      "sessionId": "session-uuid",
      "thumbnailUrl": null
    }
  ],
  "totalEvents": 12
}
```

**Grouping logic:** Backend aggregates `PRODUCT_VIEW` events by `productId`, counts views, returns the latest `sessionId` per product (for current-session differentiation). Products from the current session appear with `sessionId === currentSessionId`.

**Performance target:** < 500ms (NFR2). This must be indexed on `(visitorId, type='PRODUCT_VIEW')` in MongoDB.

---

### 6.3 `GET /leadcars/status` — Integration Status

**Status:** Needs confirmation / may need creation.

```
GET /leadcars/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "connected": true,
  "environment": "production",
  "lastSyncAt": "2026-04-22T06:00:00Z",
  "failedRecordsCount": 14,
  "totalSynced": 347,
  "configId": "uuid"
}
```

---

### 6.4 `GET /leadcars/sync-records?status=failed` — Failed Sync Records

**Status:** Existing endpoint (`LeadCarsSyncRecord` type already exists in shared/types).

```
GET /leadcars/sync-records?status=failed&page=1&limit=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "records": [
    {
      "id": "uuid",
      "visitorId": "uuid",
      "status": "failed",
      "lastError": "concesionario_id inválido",
      "retryCount": 3,
      "lastSyncAt": "2026-04-19T10:00:00Z",
      "contactData": {
        "nombre": "Miguel",
        "email": "miguel@example.com"
      },
      "createdAt": "2026-04-19T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 14, "page": 1, "limit": 20, "totalPages": 1
  }
}
```

---

### 6.5 `POST /leadcars/config` — Update Configuration

**Status:** Existing endpoint (`CreateLeadCarsConfigRequest` type exists, `LeadsService.saveConfig()` exists).

No changes needed for MVP. The existing `LeadCarsConfigComponent` already implements FR22.

---

### 6.6 `POST /leadcars/test-connection` — Test Connection

**Status:** Existing endpoint (`LeadsService.testConnection()` exists).

No changes needed for MVP. FR23 is already implemented in `LeadCarsConfigComponent.onTestConnection()`.

---

### 6.7 `POST /leadcars/sync-records/:id/retry` — Retry Failed Record 🆕

**Status:** Needs creation for FR21.

```
POST /leadcars/sync-records/:recordId/retry
Authorization: Bearer <token>
```

**Response:**
```json
{ "success": true, "message": "Sync queued for retry" }
```

---

## 7. Component Architecture

### 7.1 VisitorCard — Heat Index Badge Integration

The `VisitorCard` is rendered inside `VisitorsListComponent`. The heat index addition is a **non-breaking enhancement** to the existing card:

```
┌─────────────────────────────────────────────┐
│  [●] Visitor anonymous-a3f2              🔥  │
│  SUV ficha • 8 min • Google Ads              │
│                                              │
│  [ENGAGED]                    Score: 87/100  │
│                              ████████░░ HOT  │
│                                              │
│  [Iniciar chat]                              │
└─────────────────────────────────────────────┘
```

**Implementation approach:**

1. Extend `VisitorSearchResult` interface with `heatIndex: number | null`
2. In the existing `mapSearchResultToVisitor()` in `VisitorsComponent`, map `heatIndex` to the `Visitor` model
3. Pass `heatIndex` as an input to `VisitorsListComponent` → `VisitorCard`
4. Add `<guiders-heat-index-badge>` to the card template
5. Add `heatIndex` as a valid sort field in the UI sort selector

**No new routing required.** The card renders within the existing visitors list layout.

---

### 7.2 VisitorProfile Panel — Product History Section

The product history section is added to the existing `visitor-detail-panel` component:

```
┌─────────────────────────────────────────────┐
│  VISITANTE: anonymous-a3f2                  │
│  Lifecycle: ENGAGED  │  Score: 87/100 🔥    │
│  URL: /vehiculos/seat-ateca → 8 min         │
├─────────────────────────────────────────────┤
│  ESTA SESIÓN                                 │
│  ┌──────────────────────────────────────┐   │
│  │ 🚗 Seat Ateca 2.0 TDI   ×5 views    │   │
│  │    Última vez: hace 2 min            │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  SESIONES ANTERIORES                        │
│  ┌──────────────────────────────────────┐   │
│  │ 🚗 BMW X5 sDrive18d     ×3 views    │   │
│  │    Última vez: hace 2 días           │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ 🚗 Seat León 1.5 TSI    ×1 view     │   │
│  │    Última vez: hace 2 días           │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  [Empty state when no products tracked]     │
│  "Sin datos de tracking de vehículos"       │
│  URL actual: /vehiculos/seat-ateca          │
│  Origen: Google Ads                         │
└─────────────────────────────────────────────┘
```

**Loading sequence:**
1. Agent clicks visitor in list
2. `visitor-detail-panel` receives `visitor` input
3. Panel immediately shows heat index and lifecycle data (from list payload — no additional call)
4. `VisitorProductsService.getVisitorProducts()` called in parallel
5. Skeleton loader shown during fetch
6. Products populate into `VisitorProductHistoryComponent`

**Where the load happens:** The feature component (`visitors.ts`) or `visitor-detail-panel` (as a smart-light component) triggers the API call. The `VisitorProductHistoryComponent` itself is dumb.

---

### 7.3 LeadCars Admin Panel

The LeadCars section in `libs/admin/features/integrations` expands from **configuration-only** to **configuration + status monitoring**:

```
┌─────────────────────────────────────────────┐
│  LeadCars CRM Integration                   │
├─────────────────────────────────────────────┤
│  STATUS                                     │
│  ● Conectado (producción)                   │
│  Último sync: hace 3 días                   │
│  Registros fallidos: 14                     │
│                                [Refrescar]  │
├─────────────────────────────────────────────┤
│  REGISTROS FALLIDOS                         │
│  ┌──────────────────────────────────────┐   │
│  │ Miguel García  │ concesionario_id    │   │
│  │ 19 abr 10:00   │ inválido  [Reinten]│   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ Ana López      │ timeout             │   │
│  │ 19 abr 09:30   │ [Reintentar]       │   │
│  └──────────────────────────────────────┘   │
│                           [Reintentar todos]│
├─────────────────────────────────────────────┤
│  CONFIGURACIÓN (existing LeadCarsConfig)    │
│  clienteToken: ●●●●●●●●●●                  │
│  Concesionario: Uto Car Madrid (ID: 42)     │
│  Sede: Alcalá de Henares                    │
│  Entorno: ○ Sandbox  ● Producción           │
│  [Probar conexión]         [Guardar cambios]│
└─────────────────────────────────────────────┘
```

**Route structure** (within `libs/admin/features/integrations`):
```
/admin/integrations/crm/leadcars
  ├── <guiders-leadcars-status-panel>    (new component from new lib)
  └── <lib-leadcars-config>              (existing component, unchanged)
```

The integration route component orchestrates both: polls status, passes data as inputs to presentational children.

---

## 8. Security & Multi-Tenancy Frontend Enforcement

### 8.1 API Call Patterns — Tenant Isolation

```typescript
// ✅ CORRECT: Always derive tenantId from session
getVisitorProducts(visitorId: string): Observable<VisitorProductsResponse> {
  return this.http.get<VisitorProductsResponse>(
    `${this.environment.api.baseUrl}/visitors/${visitorId}/products`,
    { withCredentials: true }   // Session cookie carries tenant context
  );
}

// ❌ WRONG: Never accept tenantId as function parameter from UI
getVisitorProducts(visitorId: string, tenantId: string): Observable<...>
```

The backend validates tenant scope from the JWT. The `withCredentials: true` pattern on all HTTP calls ensures the session cookie is sent.

### 8.2 LeadCars Credentials — Never in Frontend

The `clienteToken` field in the admin form:
- Renders as `type="password"` in the HTML
- On `populateForm()`, the backend returns a **masked** token (e.g., `"●●●●●●●●●●"` or omits it)
- The frontend sends it back only when the user explicitly changes it
- **Never stored in localStorage, sessionStorage, or Angular state beyond the reactive form**

```typescript
// In leadcars-config.ts — NFR7 enforcement
clienteToken: ['', Validators.required],  // Form only, never persisted
```

### 8.3 RBAC Enforcement in Frontend

For MVP (simplified to Agent + Supervisor):

```typescript
// Route guard pattern for admin features
export const supervisorGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const user = session.getCurrentUser();
  if (user?.role === 'SUPERVISOR' || user?.role === 'SUPER_ADMIN') {
    return true;
  }
  return inject(Router).createUrlTree(['/console']);
};
```

The `admin` app should already have route-level protection. The console app's visitor features are available to all authenticated users (Agent and Supervisor both).

**Important:** Frontend RBAC is UX-only. The backend enforces it on every API call. The frontend guard is for clean navigation, not security.

### 8.4 Session Expiry Handling

All HTTP calls go through `HttpClient`. A global HTTP interceptor should catch `401 Unauthorized` and redirect to login. If not already implemented, this is a prerequisite for MVP:

```typescript
// shared interceptor
if (error.status === 401) {
  sessionService.clearSession();
  router.navigate(['/login']);
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests — Library Type Matrix

| Library Type | What to Test | Tools |
|-------------|-------------|-------|
| `data-access` | HTTP calls (mock `HttpClient`), error handling, response mapping | Vitest + `HttpClientTestingModule` |
| `ui` | Component rendering, input/output bindings, computed signals, empty states | Vitest + Angular Testing Library |
| `features` | Service integration, polling setup/teardown, state transitions, routing | Vitest + `TestBed` |
| `util` | Pure function logic | Vitest (no Angular) |

### 9.2 Key Test Cases for New Libraries

**`VisitorProductsService`:**
```typescript
it('should map product view response correctly')
it('should return empty products array on 404 (visitor has no tracked products)')
it('should handle 500 gracefully with error observable')
```

**`VisitorProductHistoryComponent`:**
```typescript
it('should separate current session products from previous session products')
it('should show empty state when products array is empty')
it('should show fallback context (currentUrl, source) in empty state')
it('should show loading skeleton when loading=true')
```

**`HeatIndexBadgeComponent`:**
```typescript
it('should render "cold" tier for score < 30')
it('should render "warm" tier for 30 ≤ score < 70')
it('should render "hot" tier for score ≥ 70')
it('should render unknown state when score is null')
```

**`LeadCarsStatusPanelComponent`:**
```typescript
it('should emit retryRecord event with correct recordId')
it('should emit retryAll event')
it('should show "0 failed records" message when list is empty')
it('should display last sync date in human-readable format')
```

### 9.3 E2E Tests (Playwright)

Priority E2E scenarios for MVP:

```typescript
// console-e2e
test('agent sees heat index on visitor card')
test('agent can sort visitor list by heat index')
test('agent opens visitor profile and sees product history')
test('agent sees empty state when no product tracking data')
test('agent sees fallback data (URL, source) in empty state')
test('product history separates current session from previous')

// admin-e2e
test('supervisor sees LeadCars connection status')
test('supervisor sees list of failed sync records with error details')
test('supervisor retries a failed sync record')
test('supervisor updates LeadCars credentials and tests connection')
```

### 9.4 Mock Data Strategy

The project uses `USE_MOCK_DATA` token (set via `VITE_USE_MOCK_DATA=true` env var). MVP adds:

- `visitors-mock-data.ts` — extend existing mock to include `heatIndex` and `heatIndexTier` fields
- `visitor-products-mock-data.ts` — new file with sample product history (3 products, mixed sessions)
- `leadcars-status-mock-data.ts` — new file with status + 3 failed records

All mock data lives in the respective `data-access` or `features` library, never in `shared`.

---

## Appendix A: New Path Aliases

Add to `tsconfig.base.json` `paths`:

```json
"@guiders-frontend/chat/data-access/visitor-products-service": [
  "libs/chat/data-access/visitor-products-service/src/index.ts"
],
"@guiders-frontend/chat/ui/visitor-product-history": [
  "libs/chat/ui/visitor-product-history/src/index.ts"
],
"@guiders-frontend/chat/ui/heat-index-badge": [
  "libs/chat/ui/heat-index-badge/src/index.ts"
],
"@guiders-frontend/admin/data-access/leadcars-status-service": [
  "libs/admin/data-access/leadcars-status-service/src/index.ts"
],
"@guiders-frontend/admin/ui/leadcars-status-panel": [
  "libs/admin/ui/leadcars-status-panel/src/index.ts"
]
```

---

## Appendix B: Nx Project Tags Summary

| New Library | Tags |
|-------------|------|
| `chat/data-access/visitor-products-service` | `scope:chat type:data-access` |
| `chat/ui/visitor-product-history` | `scope:chat type:ui` |
| `chat/ui/heat-index-badge` | `scope:chat type:ui` |
| `admin/data-access/leadcars-status-service` | `scope:admin type:data-access` |
| `admin/ui/leadcars-status-panel` | `scope:admin type:ui` |

**Boundary rules apply:**
- `type:ui` libs → only import other `ui` and `util` libs
- `type:data-access` libs → import `shared/types`, `auth/data-access/session`
- `type:feature` libs → import any of the above, within their scope

---

## Appendix C: Risks & Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `GET /visitors/:id/products` endpoint not ready at sprint start | High (confirmed does not exist) | High — blocks FR4, FR5, FR6, FR7 | Treat as Sprint Day 1 backend task; use mock data until available |
| `heatIndex` field missing from `/visitors/search` response | Medium | High — blocks FR2, FR3 | Coordinate backend field addition in same sprint; fallback renders `null` gracefully |
| `POST /leadcars/sync-records/:id/retry` not available | Medium | Medium — blocks FR21 | Deferrable to Sprint 2 if status visibility (FR19, FR20) lands first |
| LeadCars integration bug deeper than config issue | Medium | High — may require backend investigation | Timebox diagnosis to 1 day; document findings if not resolved |
| `visitor-detail-panel` becomes a "god component" with product history addition | Medium | Low | Strict input/output boundary on `VisitorProductHistoryComponent`; no service injection in UI lib |

### Open Questions

1. **Heat index field name in API:** Will the backend field be `heatIndex`, `heat_index`, `score`, or `leadScore`? The existing `VisitorActivity.leadScore` uses a different structure. Alignment needed before type definition.

2. **Product history grouping granularity:** Should the frontend group products by `productId` across all sessions, or show raw event list? The proposed contract groups by `productId` — confirm with backend.

3. **Retry all failed records:** Is there a bulk retry endpoint, or must the frontend iterate and fire individual retry calls? (FR21 + Journey 3 implies bulk)

4. **LeadCars status polling authentication:** The status endpoint — does it require the `companyId` as a path param or is it derived from the JWT? Important for the service URL construction.

5. **`clienteToken` masking on GET:** Does the backend currently mask the token on `GET /leadcars/config`? If not, the form will display the real token — a security concern (NFR7).

6. **Sort by `heatIndex` backend support:** Is `heatIndex` indexable as a sort field in the existing MongoDB visitor query? If sorting is expensive, the backend team needs to know before the sprint starts.
