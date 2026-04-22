# UX Design Specification — guiders-frontend

**Author:** Sally (UX Designer, BMad)  
**Date:** 2026-04-22  
**Scope:** MVP — FR1–FR23, FR29–FR36  
**Product:** guiders — Proactive Chat Platform for Automotive Dealerships  

---

## 1. UX Principles

### P1 — Sell in the Moment, Not After It
Every millisecond the agent spends searching for context is a millisecond Miguel spends considering the "Close Tab" button. The interface is designed around **zero-search context**: the agent should know what to say before clicking "Start Chat." Visitor intent signals must be visible at a glance, not buried inside a profile.

> *Implication: Heat index and vehicle history appear in the list row and in the profile header — not only on a separate detail tab.*

### P2 — Trust Through Transparency
Automotive B2B users are skeptical of AI scores. If Carlos doesn't understand why a visitor scored 87, he won't act on it. The heat index must be **legible, not magical**: the badge shows the score; one tap shows the events that produced it. The algorithm is a transparent rule engine, not a black box.

> *Implication: Heat index badge is always tappable/clickable and expands into an event breakdown.*

### P3 — Graceful Context, Never Hard Failure
When the SDK hasn't fired a `PRODUCT_VIEW` for a visitor, the agent must not see a broken panel. They must see **the best available context**: current URL, traffic source, session duration, lifecycle stage. Empty states carry actionable fallback data, not apologies.

> *Implication: Vehicle history panel has two modes: "enriched" (with product events) and "fallback" (with session context). Both feel intentional.*

### P4 — Configuration Is a Supervisor Task, Not an Accident
The LeadCars integration panel is the most technically risky screen in the product. A wrong `concesionarioId` silently drops leads. The admin UI must **prevent errors before they happen**: visual environment badge (Sandbox vs. Production), required field validation, and test-before-save flow.

> *Implication: The "Sandbox" toggle renders a persistent amber warning banner. The test connection button is the primary action when credentials change.*

### P5 — Speed Is a Feature
The agent's window of opportunity closes when the visitor navigates away. Performance constraints (NFR1 < 2s profile load, NFR5 < 200ms visual response) translate directly into UX decisions: skeleton loaders instead of spinners, optimistic UI for chat initiation, and data prefetching when the cursor hovers a visitor row.

> *Implication: Visitor profile opens with a skeleton immediately. Heat index and vehicle history populate progressively, not all-or-nothing.*

---

## 2. Information Architecture

### 2.1 Console App — Agent View (`/console`, port 4200)

```
Console App
│
├── /inbox                    ← Default route
│   └── Conversation list + chat widget overlay
│
├── /visitors                 ← PRIMARY MVP FOCUS
│   ├── Visitor List           (full-width panel, heat-indexed)
│   └── [visitor profile]      (side panel / modal — opens in context)
│       ├── Identity Header     (heat badge, lifecycle, online status)
│       ├── Vehicle History     (this session + previous sessions)
│       ├── Behavior Breakdown  (events composing heat index)
│       ├── Chat History        (previous conversations)
│       └── Actions Bar         (Start Chat CTA)
│
├── /escalations              ← Existing feature
│
└── /contacts                 ← Existing feature
```

**Navigation structure:** Left sidebar (existing `guiders-sidebar` component) with icon + label items. The **Visitors** item gets a live badge showing the count of online visitors with heat index ≥ 70.

**Deep link pattern:** `/visitors?highlight={visitorId}` — allows future alert notifications to land the agent directly on a specific visitor.

---

### 2.2 Admin App — Supervisor View (`/admin`, port 4201)

```
Admin App
│
├── /dashboard                ← Existing
│
├── /integrations             ← PRIMARY MVP FOCUS
│   ├── Integration Hub        (cards: LeadCars, future integrations)
│   └── /integrations/leadcars
│       ├── Connection Status Panel  (live badge, last sync, error count)
│       ├── Failed Records Panel     (list of sync-records/failed)
│       ├── Config Form              (token, concesionario, sede, env toggle)
│       └── Test Connection          (inline result, no navigation)
│
├── /users                    ← Existing
│
├── /leads                    ← Existing
│
└── /ai                       ← Existing
```

**Navigation note:** The LeadCars status indicator surfaces in the admin sidebar as a secondary badge (error count) when `sync-records/failed` > 0, so the supervisor notices failures without actively polling the panel.

---

## 3. Key User Flows

### Flow 1 — Agent Identifies High-Intent Visitor and Initiates Proactive Chat

```
TRIGGER: Carlos opens the console at 9:15am

Step 1 — Land on Visitor List
  → List loads with skeleton rows (< 200ms visual response)
  → Rows populate sorted by heat index DESC (default sort)
  → Row 1: Anonymous visitor, heat badge "87", 🔴 online, "3 visitas · SUV · 8min"
  → Carlos reads the signal in < 10 seconds without clicking anything

Step 2 — Open Visitor Profile (hover → prefetch, click → open)
  → Profile side panel slides in from the right
  → Identity header: heat badge 87, lifecycle "ENGAGED", online indicator
  → Vehicle history section: skeleton → populates in < 2s
    ┌─ Esta sesión ──────────────────────┐
    │ 🚗 BMW X5 2024 — 8min activo       │
    └────────────────────────────────────┘
    ┌─ Visitas anteriores ───────────────┐
    │ Visita 3 (hoy) — X5 ×3, A4 ×1    │
    │ Visita 2 (lunes) — X5 ×2, Tiguan │
    │ Visita 1 (viernes) — A4, X5, Q5  │
    └────────────────────────────────────┘
  → Behavior breakdown: expandable, collapsed by default
    "87 puntos = 5 vistas de producto (×15) + 3 visitas recurrentes (×12) + 8min en ficha (×10)"

Step 3 — Initiate Chat
  → Agent clicks "Iniciar chat" (primary CTA in action bar)
  → Optimistic UI: button shows "Abriendo..." immediately (< 200ms)
  → Chat widget opens with visitor context pre-loaded in header
  → Carlos types first message; visitor receives chat invitation

Step 4 — Post-Chat Lifecycle Transition
  → Agent marks conversation as "Convertido" or lifecycle auto-advances to LEAD
  → System triggers LeadCars sync automatically (no agent action)
  → Toast notification: "Lead sincronizado en LeadCars ✓"

COMPLETION CRITERIA:
  ✓ Agent contacted visitor while still on site (< 3min from list view)
  ✓ Agent had full vehicle context before sending first message
  ✓ LeadCars sync completed without manual intervention
```

---

### Flow 2 — Agent Views Visitor Profile with Vehicle History + Heat Index

```
TRIGGER: Carlos clicks visitor row #2 (heat 72, "ENGAGED")

Step 1 — Profile Opens
  → Side panel appears with identity header immediately
  → Skeleton shows in vehicle history section (data fetching)

Step 2a — ENRICHED STATE (SDK has PRODUCT_VIEW events)
  → Vehicle history populates:
    • Current session vehicles (tab/section: "Ahora")
    • Historical vehicles (tab/section: "Historial")
  → Each vehicle card shows: model name, view count, last seen timestamp
  → Heat index badge shows score; tap expands breakdown

Step 2b — FALLBACK STATE (no PRODUCT_VIEW events)
  → Vehicle history section shows empty state:
    ┌─────────────────────────────────────────────┐
    │  📡  Sin datos de producto                   │
    │  El SDK no ha registrado vehículos vistos    │
    │  en esta sesión.                             │
    │                                              │
    │  Contexto disponible:                        │
    │  • Página actual: /coches/tiguan-2024        │
    │  • Origen: Google Ads — "Tiguan precios"     │
    │  • Tiempo en sesión: 12 minutos              │
    │  • Lifecycle: ENGAGED                        │
    └─────────────────────────────────────────────┘
  → Agent reads fallback context and initiates chat with partial info
  → Heat index badge shows reduced score with "(datos parciales)" label

Step 3 — Chat History Tab
  → Agent taps "Historial de chats" tab
  → Previous conversations listed chronologically
  → Empty state if first-time visitor: "Primera visita de este visitante"

COMPLETION CRITERIA:
  ✓ Profile never shows a broken/empty panel without explanation
  ✓ Fallback context always provides actionable information
  ✓ Heat index badge always explains its own score
```

---

### Flow 3 — Supervisor Diagnoses and Fixes LeadCars Integration Failure

```
TRIGGER: Ana notices the sidebar badge shows "14 errores" next to Integrations

Step 1 — Navigate to Integration Panel
  → Ana clicks "Integraciones" in admin sidebar
  → Integration hub shows LeadCars card with ⚠️ error state
  → Card shows: "14 registros fallidos · Último sync: hace 3 días"
  → Ana clicks "Ver detalles"

Step 2 — Connection Status Panel
  → Page: /integrations/leadcars
  → Status banner (prominent, amber): 
    "⚠️ Integración con errores — 14 registros no sincronizados"
  → Last successful sync: "hace 3 días (19 abr 2026, 14:32)"
  → Connection status: "Error de autenticación"
  → CTA: "Ver registros fallidos" (anchor scroll to records section)

Step 3 — Failed Records Panel
  → List of 14 failed sync records:
    ┌─────────────────────────────────────────────────────┐
    │  Visitante: abc-123  │  Error: concesionario_id     │
    │  inválido            │  Fecha: 19 abr               │
    │  [Reintentar]                                       │
    ├─────────────────────────────────────────────────────┤
    │  Visitante: def-456  │  Error: concesionario_id     │
    │  inválido            │  Fecha: 19 abr               │
    │  [Reintentar]                                       │
    └─────────────────────────────────────────────────────┘
  → "Reintentar todos" button at section header

Step 4 — Fix Configuration
  → Ana scrolls to Config Form (or clicks "Editar configuración" CTA)
  → She sees: useSandbox toggle is ON (amber "Sandbox" badge visible)
  → She turns off useSandbox → amber badge disappears → green "Producción" badge
  → She updates concesionarioId field to correct production ID
  → She clicks "Probar conexión" (mandatory step before save)
  → Inline result: "✓ Conexión exitosa — LeadCars API responde correctamente"
  → She clicks "Guardar cambios"

Step 5 — Retry Failed Records
  → Ana clicks "Reintentar todos"
  → Progress indicator: "Reintentando 14 registros..."
  → Completion: "14/14 registros sincronizados ✓"
  → Status banner turns green: "Integración activa"

COMPLETION CRITERIA:
  ✓ Ana identified the problem without reading logs
  ✓ Ana fixed the configuration without opening a support ticket
  ✓ All failed records retried and confirmed
  ✓ Integration status panel reflects resolved state
```

---

## 4. Screen Specifications

### 4.1 Visitor List Screen

**Route:** `/visitors`  
**User:** Agent (primary), Supervisor (secondary)  
**Purpose:** Surface high-intent visitors so the agent can decide who to contact first, without any manual research.

#### Layout

```
┌─ Console App Shell ─────────────────────────────────────────────────┐
│  [Sidebar]  │  [Visitor List — Full Width Panel]                     │
│             │  ┌────────────────────────────────────────────────┐   │
│  📬 Inbox   │  │ Lista de Visitantes          [↻ Actualizado 5s] │   │
│  👥 Visitantes│  ├────────────────────────────────────────────────┤   │
│  ⬆ Escal.  │  │ [Quick Filters: En línea · Leads · Alta intención]│  │
│  👤 Contac. │  │ [Active Filter Chips]  [+ Filtros avanzados]    │   │
│             │  ├────────────────────────────────────────────────┤   │
│             │  │ SORT: Heat Index ↓  [también: Última visita]    │   │
│             │  ├────────────────────────────────────────────────┤   │
│             │  │ ┌─ Visitor Row ─────────────────────────────┐  │   │
│             │  │ │ [🔴] [Avatar] Visitante anónimo   [87🔥]  │  │   │
│             │  │ │ ENGAGED · /coches/bmw-x5 · 8min · 3 vis. │  │   │
│             │  │ │ 🚗 BMW X5, Audi A4              [Chat ▶] │  │   │
│             │  │ └──────────────────────────────────────────┘  │   │
│             │  │ ┌─ Visitor Row ─────────────────────────────┐  │   │
│             │  │ │ [🟡] [Avatar] María García       [72🔥]  │  │   │
│             │  │ │ LEAD · /contacto · 12min · 1 vis.        │  │   │
│             │  │ │ 🚗 Seat Tiguan               [Chat ▶]    │  │   │
│             │  │ └──────────────────────────────────────────┘  │   │
│             │  ├────────────────────────────────────────────────┤   │
│             │  │ [Pagination: ← 1 2 3 → | 10 por página]        │   │
│             │  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Elements and Priority Hierarchy

| Priority | Element | Description |
|---|---|---|
| 1 | **Heat Index Badge** | Numeric score (0–100) + flame icon, color-coded. Rightmost, large. |
| 2 | **Online Status Indicator** | 🔴 online / 🟡 idle / ⚫ offline — leftmost dot |
| 3 | **Vehicle Preview** | 1–2 vehicles currently being viewed. Mini car icon + model name. |
| 4 | **Lifecycle Badge** | NUEVO / ENGAGED / LEAD / CONVERTIDO — color-coded pill |
| 5 | **Session Context** | Current URL (truncated), time on site, visit count |
| 6 | **Quick Chat Button** | [Chat ▶] — appears on row hover (desktop), always visible (mobile) |
| 7 | **Visitor Identity** | Name (if known) or "Visitante anónimo" + avatar initials |

#### States

**Empty state (no active visitors):**
```
┌──────────────────────────────────────────┐
│          👁️  Sin visitantes activos       │
│   No hay visitantes en el sitio ahora.   │
│   La lista se actualiza cada 30 segundos │
│                                          │
│         [Configurar SDK →]               │
└──────────────────────────────────────────┘
```
> If `totalCount = 0` AND no SDK events in last 24h → surface SDK setup link.

**Loading state:**
- 5 skeleton rows with animated gradient shimmer
- Quick filters rendered immediately (not skeletonized)

**Error state:**
```
┌──────────────────────────────────────────┐
│  ⚠️  No se pudo cargar la lista          │
│  Error conectando con el servidor.       │
│                  [Reintentar]            │
└──────────────────────────────────────────┘
```

**Populated state (default):** As described in layout above, sorted by heat index DESC.

#### Interaction Patterns

- **Row click** → opens Visitor Profile side panel (does NOT navigate away)
- **[Chat ▶] button** → direct `createChatWithVisitor()` call without profile open; optimistic update
- **Heat badge click** → tooltip showing score breakdown (same as profile panel)
- **Sort toggle** → click column header "Heat Index" or "Última visita"
- **Auto-refresh** → dropdown selector (10s / 30s / 1min / 5min / off), persisted to localStorage
- **Filter chips** → lifecycle quick-filter pills at top; "Alta intención" = heat index ≥ 70

#### New Addition vs PRD
> **UX Decision:** Vehicle preview row (vehicles 1–2) is shown directly on the visitor list card. The PRD specifies heat index in the list (FR2) and vehicle history in the profile (FR4), but showing a 1-line vehicle hint in the row itself reduces the number of profile opens needed before deciding whom to contact — directly serving the < 10-second identification criterion (success metric).

---

### 4.2 Visitor Profile Panel

**Trigger:** Click on any visitor row  
**User:** Agent  
**Purpose:** Give the agent the full behavioral context of a single visitor so they can open the conversation from a position of advantage.

#### Layout

```
┌─ Profile Panel (side panel, 480px, overlay on list) ──────────────┐
│ [✕ Close]                                              [↗ Expand] │
├─────────────────────────────────────────────────────────────────────┤
│ IDENTITY HEADER                                                     │
│ ┌─────────────────────────────────────────────────────────────┐    │
│ │  [Avatar 48px]  Visitante anónimo · #abc-123        [87🔥]  │    │
│ │  🟢 En línea · ENGAGED · Google Ads · 3 visitas totales     │    │
│ │  📍 /coches/bmw-x5-2024 · Tiempo en sesión: 8min            │    │
│ └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐    │
│ │  [Iniciar Chat]                      [Ver en inbox →]       │    │
│ └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
├─ TABS ──────────────────────────────────────────────────────────────┤
│  [Vehículos ●]  [Comportamiento]  [Chats]                          │
│                                                                     │
│ ── Tab: Vehículos ─────────────────────────────────────────────────│
│                                                                     │
│  ESTA SESIÓN                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🚗 BMW X5 2024    ████████░░ 5 vistas · 8min · ACTIVO AHORA│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  HISTORIAL (sesiones anteriores)                          [▼ ver] │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Visita 2 · lun 20 abr ────────────────────────────────────  │   │
│  │  🚗 BMW X5 2024   ████░░░░░░ 2 vistas · 3min               │   │
│  │  🚗 Seat Tiguan   ██░░░░░░░░ 1 vista · 1min                │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Visita 1 · vie 18 abr ────────────────────────────────────  │   │
│  │  🚗 Audi A4       ████████░░ 4 vistas · 7min               │   │
│  │  🚗 BMW X5 2024   ██░░░░░░░░ 1 vista · 2min               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ── Tab: Comportamiento ─────────────────────────────────────────── │
│  HEAT INDEX: 87 / 100                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ● 5 vistas de producto    → +75 puntos (×15 c/u)           │   │
│  │ ● 3 visitas recurrentes   → +36 puntos (×12 c/u)           │   │
│  │ ● 8min en ficha activa    → +8 puntos  (×1/min)            │   │
│  │ ─────────────────────────────────────────────────────────  │   │
│  │ Total: 87 / 100                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ── Tab: Chats ──────────────────────────────────────────────────── │
│  [Lista de chats anteriores o empty state]                         │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Elements and Priority Hierarchy

| Priority | Element | Notes |
|---|---|---|
| 1 | **[Iniciar Chat] CTA** | Primary button, full-width or prominent. Always visible — sticky to bottom if scrolling. |
| 2 | **Heat Index Badge (header)** | Large, color-coded. Tappable → behavior breakdown tab |
| 3 | **Vehicle History — Current Session** | Shown immediately; most recent/active model at top |
| 4 | **Online Status + Session Duration** | Time-critical context for deciding to act NOW vs. later |
| 5 | **Vehicle History — Previous Sessions** | Collapsed by default for first-time profile view; expanded if returning visitor |
| 6 | **Behavior Breakdown** | Second tab; explains the score |
| 7 | **Chat History** | Third tab |

#### States per Section

**Vehicle history — Enriched state:** As shown above.

**Vehicle history — Fallback state (no PRODUCT_VIEW events):**
```
┌─────────────────────────────────────────────────────────────────┐
│ 📡  Sin datos de producto para esta sesión                      │
│                                                                  │
│ Usa el contexto disponible:                                      │
│  • Página actual: /coches/seat-tiguan-2024                      │
│  • Origen: Google Ads · "tiguan precio 2024"                    │
│  • Tiempo en sesión: 12 min · ENGAGED                           │
│  • Primera visita al sitio                                      │
│                                                                  │
│ ℹ️  Los datos de producto aparecen cuando el SDK registra       │
│    un evento PRODUCT_VIEW en la web del concesionario.          │
└─────────────────────────────────────────────────────────────────┘
```

**Chat history — Empty state:**
```
Primera visita registrada de este visitante.
No hay conversaciones previas.
```

**Profile panel — Loading state:** Skeleton for the identity header (shimmer) + skeleton for vehicle cards. CTA button renders immediately in disabled state until data loads.

#### Interaction Patterns

- **[Iniciar Chat]** → calls `createChatWithVisitor()` → opens chat widget overlay → panel stays open showing context
- **Tab navigation** → keyboard accessible (arrow keys + enter)
- **Vehicle card** → hover shows tooltip with full URL + timestamp
- **Heat badge (header)** → click/tap scrolls to "Comportamiento" tab
- **[↗ Expand]** → opens profile as full-page view (future: `/visitors/{id}`)
- **[✕ Close]** → returns focus to visitor list

---

### 4.3 LeadCars Integration Panel

**Route:** `/integrations/leadcars`  
**User:** Supervisor  
**Purpose:** Give the supervisor complete visibility and control over the LeadCars sync pipeline — including diagnosing failures without external tools.

#### Layout

```
┌─ Admin App Shell ─────────────────────────────────────────────────┐
│ [Sidebar]  │  [LeadCars Integration Panel]                         │
│            │                                                        │
│ 📊 Dash.   │  ← Integraciones / LeadCars                          │
│ 🔗 Integr. │                                                        │
│ 👥 Users   │  ┌─ STATUS BANNER ───────────────────────────────┐   │
│ 📋 Leads   │  │ 🔴 Con errores — 14 registros fallidos         │   │
│ 🤖 AI      │  │ Último sync exitoso: hace 3 días (19 abr)      │   │
│            │  │ [Ver registros fallidos ↓]  [Probar conexión]  │   │
│            │  └────────────────────────────────────────────────┘   │
│            │                                                        │
│            │  ┌─ FAILED RECORDS ──────────────────────────────┐   │
│            │  │ 14 registros fallidos                [↻ Todos] │   │
│            │  ├─────────────────────────────────────────────── │   │
│            │  │ #abc-123 · 19 abr 16:45                        │   │
│            │  │ Error: concesionario_id inválido (sandbox)     │   │
│            │  │                              [Reintentar]      │   │
│            │  ├─────────────────────────────────────────────── │   │
│            │  │ #def-456 · 19 abr 16:47                        │   │
│            │  │ Error: concesionario_id inválido (sandbox)     │   │
│            │  │                              [Reintentar]      │   │
│            │  │  ... (12 more, paginated)                      │   │
│            │  └────────────────────────────────────────────────┘   │
│            │                                                        │
│            │  ┌─ CONFIGURATION ───────────────────────────────┐   │
│            │  │ Entorno: [⚠️ SANDBOX]  ←toggle→  [PRODUCCIÓN] │   │
│            │  │                                                 │   │
│            │  │ Token de cliente:  [••••••••••••]  [👁 ver]    │   │
│            │  │ Concesionario:     [Dropdown / Input]          │   │
│            │  │ Sede (opcional):   [Dropdown — disabled]       │   │
│            │  │ Campaña (opcional):[Dropdown — disabled]       │   │
│            │  │                                                 │   │
│            │  │ Eventos de sync:                               │   │
│            │  │  ☑ Lifecycle → LEAD                            │   │
│            │  │  ☐ Chat cerrado                                │   │
│            │  │  ☐ Datos de contacto actualizados              │   │
│            │  │                                                 │   │
│            │  │ [Probar conexión]  [Eliminar]  [Guardar →]     │   │
│            │  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Elements and Priority Hierarchy

| Priority | Element | Notes |
|---|---|---|
| 1 | **Status Banner** | Always visible at top. Color-coded: 🔴 error / 🟡 degraded / 🟢 ok |
| 2 | **Environment Toggle (Sandbox / Producción)** | Persistent amber badge when Sandbox is active |
| 3 | **Failed Records Section** | Count badge, list with error detail, individual + bulk retry |
| 4 | **Test Connection Button** | Secondary action in banner AND in form. Result shows inline. |
| 5 | **Config Form** | Token (password field), concesionario (dropdown or input), sede/campaña |
| 6 | **Save Button** | Primary, disabled until form is valid |
| 7 | **Delete Button** | Danger variant, confirmation required |

#### States

**Status Banner — Green (healthy):**
```
✅  Integración activa · Último sync: hace 2 minutos · 0 errores
```

**Status Banner — Amber (degraded, partial failures):**
```
⚠️  Integración activa con errores · 3 registros fallidos
Último sync exitoso: hace 1h  [Ver registros]
```

**Status Banner — Red (no connectivity):**
```
🔴  Integración desconectada · Último sync: hace 3 días
Error de autenticación  [Configurar →]
```

**No configuration (onboarding empty state):**
```
┌─────────────────────────────────────────────────────┐
│  🔗  Conecta LeadCars                               │
│  Sincroniza automáticamente los leads capturados    │
│  con tu CRM LeadCars en tiempo real.                │
│                                                     │
│              [Configurar integración →]             │
└─────────────────────────────────────────────────────┘
```

**Test connection — inline results:**
- Loading: button shows spinner + "Probando..."
- Success: inline green banner "✓ Conexión exitosa — LeadCars API responde correctamente"
- Error: inline red banner "✗ Error: Token inválido / concesionario_id no encontrado"

**Failed records — empty state:**
```
✓  Sin registros fallidos
Todos los leads se han sincronizado correctamente.
```

#### Interaction Patterns

- **Environment toggle** → immediate visual feedback; amber warning: "⚠️ Sandbox activo — los leads NO se enviarán a producción"
- **Token field** → password type with show/hide toggle; never pre-populated on page load (security)
- **[Cargar concesionarios]** → lazy load from LeadCars API; shows loading indicator
- **Concesionario selection** → triggers auto-load of sedes and campañas for that dealer
- **[Probar conexión]** → available after save OR on existing config; result persists 30s then clears
- **[Reintentar todos]** → bulk retry with progress indicator; success count shown

---

## 5. Component Patterns

### 5.1 Heat Index Badge

**Purpose:** Display the calculated purchase-intent score in a compact, scannable format across list rows, profile headers, and tooltips.

#### Visual Specification

```
Compact (list row):        Full (profile header):
┌──────┐                   ┌───────────────┐
│ 87🔥 │                   │  87 / 100  🔥 │
└──────┘                   │  Alta intención│
                           └───────────────┘
```

#### Color Scale

| Score | Color Token | Label | Visual Meaning |
|---|---|---|---|
| 80–100 | `color-error` (red/orange) | Alta intención | Act now |
| 60–79 | `color-warning` (amber) | Intención media | Worth checking |
| 40–59 | `color-info` (blue) | Intención baja | Monitor |
| 0–39 | `color-text-secondary` (gray) | Sin datos / baja | No action needed |
| No data | `color-border-light` (light gray) | Sin calcular | SDK not fired |

#### Interaction

- **Click/tap** on badge → shows tooltip/popover with score breakdown:
  ```
  87 puntos
  ─────────────────────────────
  ● Vistas de producto:  +75
  ● Visitas recurrentes: +36  
  ● Tiempo en ficha:     + 8
  ─────────────────────────────
  Total: 87 / 100
  ```
- **"Datos parciales"** variant: badge shows `~72` with ⚠ icon when `PRODUCT_VIEW` events are absent but other signals exist

#### States

- **Loading:** Gray skeleton pill (shimmer animation)
- **No data:** Light gray badge, score "—", tooltip "Sin eventos de comportamiento registrados"
- **Partial data:** Score shown with `~` prefix and warning icon

#### Accessibility

- `role="button"` on interactive badge
- `aria-label="Puntuación de intención: 87 de 100. Haz clic para ver el desglose."`
- Color is NOT the only differentiator — the numeric score always accompanies color

---

### 5.2 Vehicle History Card

**Purpose:** Show a single vehicle that a visitor has viewed, with visit frequency and recency signals.

#### Visual Specification

```
Current Session Card:
┌─────────────────────────────────────────────────────┐
│ 🚗  BMW X5 2024                     [ACTIVO AHORA] │
│     ████████░░  5 vistas · 8min en ficha             │
│     Última vez: ahora mismo                          │
│     /coches/bmw-x5-2024                              │
└─────────────────────────────────────────────────────┘

Historical Card (in past session):
┌─────────────────────────────────────────────────────┐
│ 🚗  Audi A4 2024                                    │
│     ████░░░░░░  4 vistas · 7min                      │
│     Última vez: vie 18 abr, 15:42                    │
└─────────────────────────────────────────────────────┘
```

#### Elements

| Element | Description |
|---|---|
| **Vehicle icon** | Generic car icon (🚗) — future: vehicle thumbnail from metadata |
| **Model name** | From `productName` metadata in `PRODUCT_VIEW` event |
| **Frequency bar** | Visual bar (max = 10 views = full bar) showing relative view intensity |
| **View count** | "N vistas" — exact count |
| **Time on page** | Cumulative time for this vehicle across events in session |
| **Last seen** | Relative timestamp ("ahora", "hace 5min", "vie 18 abr") |
| **[ACTIVO AHORA] badge** | Shown only when visitor is currently on that vehicle page |
| **URL** | Truncated `productUrl` — visible on hover |

#### States

- **Active (visitor currently on this page):** Elevated card, animated left border, "ACTIVO AHORA" badge
- **Recent (same session, different page):** Standard card
- **Historical (past session):** Slightly muted, no active indicator
- **Loading:** Skeleton with shimmer

---

### 5.3 Empty State — No Tracking Data

**Purpose:** Used in the vehicle history panel when no `PRODUCT_VIEW` events exist for a visitor session. Must not feel like a failure — it's actionable context.

#### Variants

**Variant A — No events at all (new visitor, SDK uninitialized):**
```
┌─────────────────────────────────────────────────────────┐
│  📡  Sin datos de producto                              │
│                                                         │
│  El SDK no ha registrado vehículos vistos aún.         │
│  Puede que el visitante acabe de llegar.                │
│                                                         │
│  Usa este contexto para iniciar la conversación:        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Página actual:  /coches/seat-tiguan-2024       │   │
│  │  Origen:         Google Ads                     │   │
│  │  Sesión:         12 minutos                     │   │
│  │  Lifecycle:      ENGAGED                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Variant B — SDK tracking blocked (consent not given):**
```
┌─────────────────────────────────────────────────────────┐
│  🔒  Tracking no disponible                             │
│                                                         │
│  Este visitante no ha aceptado el uso de cookies de    │
│  análisis. No se registran vistas de producto.          │
│                                                         │
│  Datos disponibles:  Página actual · Origen · Sesión   │
└─────────────────────────────────────────────────────────┘
```

**Variant C — Historical data but no current session events:**
```
┌─────────────────────────────────────────────────────────┐
│  📭  Sin actividad en esta sesión todavía               │
│  Pero tiene historial: 3 visitas previas                │
│  → [Ver historial de visitas]                           │
└─────────────────────────────────────────────────────────┘
```

#### Design Rules

1. Never show a blank white box — always include an icon, a title, and fallback data
2. Fallback data must be specific (exact URL, not "desconocido")
3. Include a CTA or next action whenever possible
4. Empty state copy is written from the agent's perspective, not as a system error

---

### 5.4 Sync Status Indicator

**Purpose:** Show the real-time health of the LeadCars integration in the admin sidebar and on the integration panel.

#### Variants

**Sidebar badge (compact):**
```
🔗 Integraciones [14]   ← amber badge with error count
```

**Panel status banner (full):**
```
┌─────────────────────────────────────────────────────────┐
│ 🟢  Activa  ·  Último sync: hace 2 min  ·  0 errores   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ⚠️  Activa con errores  ·  14 fallidos  ·  hace 3 días │
│ [Ver registros]                    [Probar conexión]    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🔴  Desconectada  ·  Error de auth  ·  hace 3 días     │
│ [Editar configuración]             [Probar conexión]    │
└─────────────────────────────────────────────────────────┘
```

#### Status States

| State | Trigger | Icon | Color |
|---|---|---|---|
| `active` | 0 failed records, last sync < 5min | 🟢 | `color-success` |
| `warning` | > 0 failed records, sync still working | ⚠️ | `color-warning` |
| `error` | Connection refused or auth failure | 🔴 | `color-error` |
| `stale` | Last sync > 1h ago, status unknown | 🕐 | `color-text-secondary` |
| `loading` | First load or after test connection | — | Spinner |

#### Sandbox Environment Warning

When `useSandbox: true`, a persistent amber badge appears:
```
⚠️ SANDBOX  ←  este texto SIEMPRE visible mientras sandbox esté activo
```
This is rendered above the configuration form section header, not only on the toggle control.

---

## 6. Accessibility Notes (WCAG 2.2 AA)

### 6.1 Visitor List

| Requirement | Implementation |
|---|---|
| Keyboard navigation | Each visitor row is focusable with `Tab`; `Enter` opens profile; `Space` triggers quick chat |
| Screen reader | Row announces: `"Visitante [nombre/anónimo], heat index [N], estado [online/offline], [N] vehículos vistos"` |
| Color contrast | Heat badge text on badge background must meet 4.5:1 contrast; score is ALSO communicated as text |
| Focus indicator | Visible focus ring on all interactive elements (`outline: 2px solid currentColor`) |
| Auto-refresh | Announced via `aria-live="polite"` region: `"Lista actualizada. N visitantes activos."` |
| Motion | Auto-refresh animation respects `prefers-reduced-motion` |

### 6.2 Visitor Profile Panel

| Requirement | Implementation |
|---|---|
| Modal behavior | Profile panel uses `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to visitor name |
| Focus management | When panel opens, focus moves to first interactive element ([Iniciar Chat]); when closed, returns to triggering row |
| Tab navigation | Tab bar uses `role="tablist"` / `role="tab"` / `role="tabpanel"` |
| Vehicle cards | `role="list"` / `role="listitem"` with descriptive `aria-label` per card |
| Empty states | Not hidden from AT — announced clearly with context |
| Heat breakdown tooltip | Accessible as a dialog triggered by button, not only on hover |

### 6.3 LeadCars Integration Panel

| Requirement | Implementation |
|---|---|
| Form labels | Every input has a `<label>` with `for` attribute; required fields use `aria-required="true"` |
| Error messages | Validation errors use `role="alert"` or `aria-describedby` linking field to error message |
| Status banner | Uses `role="status"` and `aria-live="polite"` — updates announced without interruption |
| Test result | Uses `role="alert"` for immediate announcement of test outcome |
| Password field | Show/hide toggle uses `aria-pressed` and `aria-label="Mostrar/ocultar token"` |
| Disabled fields | Sede/campaña when no concesionario selected: `aria-disabled="true"` + `aria-describedby` explaining why |
| Sandbox warning | `role="alert"` persistent region for sandbox active state |
| Confirmation dialogs | Delete confirmation uses native browser dialog or accessible modal pattern |

### 6.4 Cross-Cutting Accessibility Rules

- **No color-only information:** Every status indicator (online dot, heat badge color, sync status) has an accompanying text label or icon
- **Touch targets:** Minimum 44×44px for all interactive elements (WCAG 2.5.5)
- **Skip navigation:** Console app includes "Saltar al contenido principal" link at top of page
- **Language:** All UI text in Spanish (`lang="es"` on `<html>`)
- **Session timeout:** If session expires, announce via `role="alert"` before redirect
- **Loading states:** `aria-busy="true"` on containers during data fetch; skeleton elements marked with `aria-hidden="true"`

---

## Appendix A: UX Decisions That Extend the PRD

| Decision | PRD Reference | Rationale |
|---|---|---|
| **Vehicle preview in list row** (1–2 models visible without opening profile) | FR4 says "in profile" only | Reduces clicks to identify high-intent visitors; directly serves the "< 10 seconds" success criterion |
| **Hover-to-prefetch visitor profile** | Not specified | Reduces perceived latency (NFR5 < 200ms visual response) by starting data fetch before click |
| **[ACTIVO AHORA] badge on vehicle card** | Not specified | Communicates real-time urgency; which vehicle the visitor is on *right now* vs. historical |
| **Sandbox environment amber persistent banner** | PR mentions useSandbox toggle (FR22) | B2B users in automotive are risk-averse; visual reminder prevents accidental production/sandbox mixup |
| **Sidebar error badge for failed LeadCars records** | FR19 specifies the admin panel | Reduces MTTD (mean time to detect) by surfacing the error without requiring the supervisor to navigate to the panel |
| **Heat index "partial data" variant** (~score with ⚠) | FR6/FR7 specify empty states | When partial signals exist (session duration, visits) but no PRODUCT_VIEW, the score should still be calculable and transparently communicated |
| **Three empty state variants for vehicle history** | FR6 specifies one empty state | Differentiates between SDK-not-yet-fired, consent-blocked, and in-session-but-no-events scenarios — each requires different agent response |
| **Test connection button in status banner** (not only in form) | FR23 specifies test connection in config | When the supervisor arrives to diagnose, they need to test before editing; the banner placement reduces scroll friction |

---

*End of UX Design Specification*
