# Implementation Readiness Report — guiders-frontend MVP

**Date:** 2026-04-22  
**Prepared by:** BMad Implementation Readiness Checker  
**Documents reviewed:**
- PRD: `_bmad-output/planning-artifacts/prd.md`
- UX Design: `_bmad-output/planning-artifacts/ux-design.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epics & Stories: `_bmad-output/planning-artifacts/epics-and-stories.md`

---

## Verdict

> ## ✅ READY WITH CONDITIONS
>
> The planning artifacts are coherent, detailed, and well-aligned. Development can begin **immediately on a subset of stories**. Five specific conditions must be resolved — two before any full sprint planning is locked, and three within the first sprint week.

---

## 1. Coverage Completeness

### FR Coverage (FR1–FR23, FR29–FR36)

| FR | Description | Epic/Story |
|----|-------------|------------|
| FR1 | Heat index calculation | Epic 1 (backend-owned; frontend displays) |
| FR2 | Heat index on visitor card | Story 1.3 |
| FR3 | Sort by heat index | Story 1.4 |
| FR4 | Vehicle history in profile | Story 2.4 |
| FR5 | Current vs. previous session differentiation | Story 2.3, 2.4 |
| FR6 | Empty state when no product events | Story 2.3 (Variant A, B, C) |
| FR7 | Fallback context when no product history | Story 2.3, 2.4 |
| FR8 | Behavior events breakdown (heat signals) | Story 2.5 |
| FR9 | List of active visitors | Existing + Story 1.3 |
| FR10 | Filter by lifecycle | Story 6.2 / existing |
| FR11 | Open visitor profile | Story 2.4 |
| FR12 | Lifecycle, URL, source, session time per visitor | Story 1.3 / existing |
| FR13 | Periodic visitor state update | Story 6.2 |
| FR14 | Initiate proactive chat from profile | Story 3.1 |
| FR15 | Previous conversation history in profile | Story 3.3 |
| FR16 | Visitor context pre-loaded in chat | Story 3.2 |
| FR17 | Auto-sync to LeadCars on lifecycle → LEAD | Architecture §4.3 (backend-triggered; no frontend story needed) |
| FR18 | Sync conversation data on chat close | Architecture §4.3 (backend-triggered) ⚠️ |
| FR19 | LeadCars connection status panel | Story 4.3 |
| FR20 | List of failed sync records | Story 4.3 |
| FR21 | Manual retry of failed records | Story 4.4 |
| FR22 | Configure LeadCars credentials | Story 4.5 |
| FR23 | Test LeadCars connection | Story 4.5 |
| FR29 | Authentication | Story 5.1 |
| FR30 | Supervisor-only configuration access | Story 5.2 |
| FR31 | Tenant data isolation | Story 5.3 |
| FR32 | Backend endpoint for product events | Architecture §6.2 (backend task, noted as blocker) |
| FR33 | Consume PRODUCT_VIEW events for profile | Story 2.1, 2.4 |
| FR34 | Heat index multi-signal computation | Architecture §5.1 (backend-owned) |
| FR35 | SDK PRODUCT_VIEW with metadata | Out of scope for frontend (SDK read-only) |
| FR36 | Tenant data isolation in tracking | Story 5.3 + Architecture §8.1 |

**⚠️ Gap — FR18:** "Sync conversation data to LeadCars on chat close" has no dedicated story. Architecture §4.3 describes it as a backend-triggered auto-sync, but no story validates that the frontend fires the correct event (e.g., closes the chat with the right payload) or confirms the sync in the UI. If the backend handles this entirely with no frontend trigger, this is acceptable — but it must be explicitly documented, not left implied.

**Result: 98% coverage. One ambiguous FR (FR18) needs explicit confirmation.**

---

### NFR Coverage

| NFR | Description | Story/Tech Note |
|-----|-------------|-----------------|
| NFR1 | Profile load < 2s | Story 6.3 (skeleton loaders + lazy loading pattern) |
| NFR2 | Products endpoint < 500ms | Architecture §6.2 (MongoDB index requirement) |
| NFR3 | Visitor list update ≤ 30s | Story 6.2 |
| NFR4 | LeadCars panel load < 2s | Story 4.3 |
| NFR5 | Visual response < 200ms | Story 6.3 (optimistic UI, skeletons) |
| NFR6 | Bearer token required | Story 5.1 |
| NFR7 | LeadCars token never in frontend | Story 4.5, Architecture §8.2 |
| NFR8 | HTTPS | Environment/infrastructure (not a frontend story) |
| NFR9 | Session expiry | Story 5.1 (HTTP interceptor) |
| NFR10 | Backend tenant validation | Architecture §8.1 (frontend enforces no cross-tenant URLs) |
| NFR11–NFR13 | Scalability | Backend/infrastructure concerns, noted in architecture |
| NFR14–NFR16 | Accessibility WCAG 2.2 AA | Covered per-component in Stories 1.1, 2.3, 4.2, 4.5, 6.3 |
| NFR17–NFR20 | LeadCars reliability | Architecture §5.5 (isolation), Stories 4.3, 4.4 |

**Result: All NFRs addressed. No gaps.**

---

## 2. PRD ↔ Architecture Alignment

| Check | Status | Notes |
|-------|--------|-------|
| Backend computes heat index; frontend displays | ✅ | Architecture §5.1 — no frontend scoring logic |
| `GET /visitors/search` extended with `heatIndex` field | ✅ | Architecture §6.1 — field addition specified |
| `GET /visitors/:id/products` — new endpoint | ✅ | Architecture §6.2 — contracts defined, marked as MVP blocker |
| LeadCars status endpoint | ✅ | Architecture §6.3 — contract defined, marked as needing confirmation |
| Multi-tenancy enforced at API layer | ✅ | Architecture §5.4, §8.1 |
| Token never in frontend | ✅ | Architecture §8.2 |
| RBAC — Agent + Supervisor MVP simplification | ✅ | Architecture §8.3 — consistent with PRD |
| FR18 backend sync coverage | ⚠️ | No explicit architecture diagram for chat-close → sync flow from frontend perspective |

**Result: Strong alignment. One gap (FR18 sync trigger) to clarify.**

---

## 3. Architecture ↔ UX Alignment

| Check | Status | Notes |
|-------|--------|-------|
| `/visitors` screen → `libs/chat/features/visitors` | ✅ | Matched |
| `/integrations/leadcars` screen → `libs/admin/features/integrations` | ✅ | Matched |
| Visitor profile side panel → `visitor-detail-panel` | ✅ | Matched |
| `HeatIndexBadgeComponent` → `libs/chat/ui/heat-index-badge` | ✅ | Matched |
| `VisitorProductHistoryComponent` → `libs/chat/ui/visitor-product-history` | ✅ | Matched |
| `LeadCarsStatusPanelComponent` → `libs/admin/ui/leadcars-status-panel` | ✅ | Matched |
| UX skeleton loaders (< 200ms) → Architecture lazy-load pattern | ✅ | Architecture §5.3 + §7.2 |
| UX hover-to-prefetch | ⚠️ | UX spec §P5 and §4.1 mention hover-prefetch. Architecture does NOT document this pattern. |
| 3 empty state variants (A, B, C) | ✅ | Story 2.3 and Architecture §3.2 both address them |
| `[ACTIVO AHORA]` badge | ✅ | Story 2.3 AC specifies the logic |
| Sidebar error badge for LeadCars | ✅ | Story 4.6 |
| NFR1 (< 2s profile) achievable with lazy on-demand load | ✅ | Architecture §5.3 — identity header from list payload immediately |
| NFR5 (< 200ms visual response) achievable with skeleton + optimistic UI | ✅ | Documented |

**⚠️ Gap — Hover-to-prefetch:** UX spec §P5 and §4.1 explicitly state "data prefetching when the cursor hovers a visitor row." The Architecture document makes no mention of this pattern — no `mouseenter` handler, no prefetch service method. If this UX decision is to be implemented, a technical approach must be defined (likely a `prefetchVisitorProducts(id)` call that stores results in a cache map). If intentionally deferred, the UX spec should note this as a future enhancement.

**Result: Strong alignment. One missing technical approach for hover-prefetch.**

---

## 4. UX ↔ Stories Alignment

| Check | Status | Notes |
|-------|--------|-------|
| All UX screens have corresponding stories | ✅ | Visitor list (1.3), Visitor profile (2.4), LeadCars panel (4.3, 4.5) |
| 3 empty state variants for vehicle history (§5.3) | ✅ | Story 2.3 AC explicitly enumerates Variants A, B, C |
| Heat badge tappable → score breakdown | ✅ | Story 1.1 AC includes tooltip/popover with breakdown |
| Sandbox amber persistent banner | ✅ | Story 4.5 AC |
| Sidebar error badge | ✅ | Story 4.6 |
| Visitor list auto-refresh dropdown | ✅ | Story 6.2 |
| Flow 1 (proactive chat journey) | ✅ | Stories 3.1, 3.2 |
| Flow 2 (profile with fallback) | ✅ | Stories 2.3, 2.4 |
| Flow 3 (LeadCars diagnosis) | ✅ | Stories 4.3, 4.4, 4.5 |
| UX `[↗ Expand]` button (full-page profile) | ⚠️ | UX §4.2 mentions `[↗ Expand]` → `/visitors/{id}` full page view. No story covers this. UX spec says "(future)" inline — acceptable if confirmed as post-MVP. |
| Integration Hub cards page (`/integrations`) | ⚠️ | UX §2.2 shows an "Integration Hub" card list before `/integrations/leadcars`. No story covers building this hub page — stories jump directly to the LeadCars detail page. |

**⚠️ Gap — Integration Hub page:** UX §2.2 specifies `/integrations` as a hub with cards (LeadCars + future integrations). Stories 4.3–4.6 work against `/integrations/leadcars` directly. If the hub page is an existing screen, this is a non-issue. If it doesn't exist, Story 4.3 needs a sub-task to create it.

**Result: Good alignment. Two minor gaps to clarify (expand button scope, integration hub page).**

---

## 5. Story Readiness

### Size Assessment (1–2 day completion)

| Story | Points | Estimated Days | Assessment |
|-------|--------|---------------|------------|
| 1.1 HeatIndexBadge | M(5) | 1–1.5 | ✅ |
| 1.2 Shared types heat index | S(2) | 0.5 | ✅ |
| 1.3 Badge on VisitorCard | M(5) | 1 | ✅ |
| 1.4 Sort by heat index | M(5) | 1 | ✅ |
| 2.1 VisitorProductsService | M(5) | 1 | ✅ |
| 2.2 Shared types products | S(2) | 0.5 | ✅ |
| 2.3 VisitorProductHistoryComponent | L(8) | 2 | ✅ |
| 2.4 Integrate into profile panel | L(8) | 2 | ✅ |
| 2.5 Behavior breakdown tab | M(5) | 1 | ✅ |
| 2.6 Mock data | S(2) | 0.5 | ✅ |
| 3.1 Iniciar Chat CTA | M(5) | 1 | ✅ |
| 3.2 Context in chat widget | M(5) | 1 | ✅ |
| 3.3 Chat history tab | S(3) | 1 | ✅ |
| 4.1 LeadCarsStatusService | M(5) | 1 | ✅ |
| 4.2 LeadCarsStatusPanel component | M(5) | 1 | ✅ |
| 4.3 Status page in admin | M(5) | 1 | ✅ |
| 4.4 Retry failed records | M(5) | 1 | ✅ |
| 4.5 Config form hardening | M(5) | 1 | ✅ |
| 4.6 Sidebar error badge | S(2) | 0.5 | ✅ |
| 5.1 Login flow | M(5) | 1 | ✅ |
| 5.2 Supervisor guard | S(2) | 0.5 | ✅ |
| 5.3 Tenant isolation audit | S(3) | 1 | ✅ |
| 6.1 Nx scaffolding | S(2) | 0.5 | ✅ |
| 6.2 Polling validation | S(2) | 0.5 | ✅ |
| 6.3 Error boundaries + skeletons | M(5) | 1 | ✅ |
| 6.4 E2E tests | M(5) | 1–2 | ✅ |
| 6.5 Mock data audit | S(2) | 0.5 | ✅ |

**All 27 stories are appropriately sized for 1–2 day completion.**

### Dependencies Explicit?

**Yes** — the epics document includes a full dependency map and critical path tree. All `⚠️ backend dependency` flags are clearly marked with the specific endpoint and priority.

### First Story Per Epic — Can Start Immediately?

| Epic | First Story | Can Start? |
|------|-------------|------------|
| Epic 1 | 1.1 HeatIndexBadge | ✅ Yes — no dependencies |
| Epic 2 | 2.2 Shared types | ✅ Yes — no dependencies |
| Epic 3 | 3.1 Iniciar Chat CTA | ❌ Blocked by 2.4 (which needs backend) |
| Epic 4 | 4.1 LeadCarsStatusService | ✅ Yes — mock data available |
| Epic 5 | 5.1 Login flow | ✅ Yes — audit of existing |
| Epic 6 | 6.1 Nx scaffolding | ✅ Yes — **should be Sprint Day 1** |

**Result: Stories in Epics 1, 2, 4, 5, 6 can start immediately. Epic 3 is blocked by Epic 2's completion.**

---

## 6. Risk Assessment

### Risk Register

| ID | Risk | Likelihood | Impact | Rating |
|----|------|-----------|--------|--------|
| R1 | `GET /visitors/:id/products` backend endpoint not ready at sprint start | **Confirmed absent** | Blocks FR4, FR5, FR6, FR7, FR8, FR16 — entire Epic 2 + Epic 3 | 🔴 Sprint blocker |
| R2 | `heatIndex` field name conflict (`heatIndex` vs `leadScore` existing field) | Medium — open question in Architecture §Appendix C Q1 | Blocks FR2, FR3, Epic 1 integration | 🔴 Sprint blocker |
| R3 | `GET /leadcars/status` endpoint status unconfirmed | Medium — "needs confirmation/creation" | Blocks Stories 4.3, 4.6 | 🟡 Should resolve before sprint |
| R4 | Hover-to-prefetch pattern not in Architecture | Low — may be intentionally deferred | Incomplete UX implementation; potential rework if added later | 🟡 Should resolve before sprint |
| R5 | FR18 (chat-close sync) responsibility unclear | Medium — no story covers frontend's role | Silent lead loss if frontend must trigger the sync and doesn't | 🟡 Should resolve before sprint |
| R6 | Integration Hub `/integrations` page existence unclear | Low | Story 4.3 may be blocked or require sub-task | 🟢 Can resolve during sprint |
| R7 | `clienteToken` masking — backend may return real token on GET | Medium — Architecture §Appendix C Q5 | Security concern (NFR7) — token displayed in form | 🟡 Should resolve before sprint |
| R8 | `[↗ Expand]` button scope — post-MVP confirmation needed | Low | Minor UX inconsistency if not implemented | 🟢 Can resolve during sprint |
| R9 | Bulk retry endpoint (`retryAllFailed`) — may not exist | Medium — Architecture §Appendix C Q3 | Story 4.4 partial failure | 🟢 Can resolve during sprint |
| R10 | `heatIndex` MongoDB sort index — performance concern | Medium — Architecture §Appendix C Q6 | NFR2 breach under load | 🟡 Should resolve before sprint |

---

## Top 5 Things to Resolve Before Sprint Start

### 🔴 #1 — Backend must commit to `GET /visitors/:id/products` by Sprint Day 2

**Why critical:** This is the only confirmed-missing backend endpoint that blocks an entire epic (Epic 2 + Epic 3). Without it, the main value proposition of the product — the vehicle history profile — cannot be completed.

**Action:** Backend team must schedule and commit this endpoint for Sprint Week 1. Frontend can proceed with mock data (Story 2.6) but integration (Story 2.4) cannot be tested against real data without it. Establish a date by which the endpoint will be available so Stories 2.4, 2.5, and all of Epic 3 can be planned accordingly.

---

### 🔴 #2 — Confirm the `heatIndex` API field name before typing

**Why critical:** Architecture §Appendix C Q1 identifies an unresolved conflict between `heatIndex` (new) and `leadScore` (existing `VisitorActivity.leadScore`). Story 1.2 and 1.3 depend on the correct field name to define `VisitorSearchResult`. If the field name changes after types are written, it cascades through all stories in Epics 1, 2, and 3.

**Action:** One 15-minute backend/frontend sync call to confirm: what will the field be named in `GET /visitors/search` response? Decision must be made before Story 1.2 is started.

---

### 🟡 #3 — Clarify FR18 (chat-close → LeadCars sync) frontend responsibility

**Why critical:** FR18 states "the system syncs conversation data to LeadCars when a chat is closed." Architecture §4.3 shows backend auto-sync but only for lifecycle → LEAD (FR17). The frontend journey (Flow 1) mentions "Lead sincronizado en LeadCars ✓" toast — which implies a frontend-visible confirmation. If the frontend needs to trigger anything (even just catching a webhook or displaying a result), this needs a story. If the backend handles it entirely silently, this must be confirmed so the "✓ toast" expectation in the UX flow is reconciled.

**Action:** Confirm with backend: is the chat-close sync entirely backend-triggered with no frontend involvement? If yes, add a note to Architecture §4.3. If no, add a story to Epic 4.

---

### 🟡 #4 — Confirm `GET /leadcars/status` endpoint exists or schedule its creation

**Why critical:** Stories 4.3 and 4.6 (the LeadCars status panel and sidebar badge) depend on this endpoint. Architecture §6.3 marks it as "needs confirmation/creation." Unlike the products endpoint, this is a lower-risk backend task (likely aggregation of existing data), but it must be confirmed before Stories 4.3 can be completed against a real backend.

**Action:** Backend team checks if `/leadcars/status` already exists. If not, schedule its creation alongside `GET /visitors/:id/products`. Mock data (Story 4.1) unblocks frontend development regardless.

---

### 🟡 #5 — Confirm `clienteToken` masking behavior on `GET /leadcars/config`

**Why critical:** NFR7 requires the token to never appear in the frontend. Story 4.5 expects the backend to return a masked value (e.g., `"●●●●●●●●●●"`) on GET, so the form never displays the real credential. If the backend currently returns the real token, a backend fix is needed before Story 4.5 is done — otherwise the story's security acceptance criterion cannot be met as written.

**Action:** Developer checks `/leadcars/config` GET response. If token is returned unmasked, raise a backend fix as a dependency for Story 4.5. This is a 1-hour fix but must be known before the story is started.

---

## Summary

| Dimension | Status |
|-----------|--------|
| FR Coverage (MVP scope) | ✅ 98% — FR18 needs clarification |
| NFR Coverage | ✅ 100% |
| PRD ↔ Architecture | ✅ Strong — 1 gap (FR18) |
| Architecture ↔ UX | ✅ Strong — 1 gap (hover-prefetch not in arch) |
| UX ↔ Stories | ✅ Strong — 2 minor gaps (integration hub, expand button) |
| Story sizing | ✅ All 27 stories are 1–2 day sized |
| Dependencies explicit | ✅ Full dependency map present |
| Backend blockers identified | ✅ All flagged with priority |
| Can start Day 1 | ✅ Stories 6.1, 1.1, 1.2, 2.2, 5.1 have no dependencies |

**Overall: READY WITH CONDITIONS.** Resolve the 5 items above — especially #1 and #2 — and this sprint can proceed with full confidence.
