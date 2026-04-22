# PRD Validation Report — guiders-frontend

**PRD:** `_bmad-output/planning-artifacts/prd.md`  
**Validator:** BMad PRD Validator  
**Date:** 2026-04-22  

---

## Overall Assessment

**PASS WITH NOTES**

The PRD is well-structured, coherent, and suitable for implementation planning. It covers all required sections, contains high-quality narrative journeys, and has measurable success criteria. There are no critical blockers. Several major and minor issues are noted below that should be addressed before sprint planning to avoid ambiguity during development.

---

## Section-by-Section Findings

### 1. Executive Summary — PASS
- Clear problem framing, target personas (agent + supervisor), and positioning vs. competition.
- Differentiators (heat index, proactive chat, LeadCars integration) are specific.
- **Note:** The executive summary references "integración nativa con el CRM sectorial" but the integration is described as having known bugs. Slight overclaim in marketing language vs. current state.

### 2. Success Criteria — PASS
- User, business, and technical success dimensions are separated and measurable.
- Time-based validation window (30 days) is specified.
- **Note (Minor):** "Time-to-contact" success criterion lacks a numeric threshold (only states "while the visitor is on the site, not after"). Consider adding a specific target (e.g., contact within X minutes of heat score exceeding threshold).

### 3. User Journeys — PASS
- Four journeys cover happy path, degradation, admin recovery, and SDK actor.
- Journey 2 (graceful degradation) is a strong inclusion — rare in PRDs.
- Capability matrix at the end is concise and well-traced.
- **Note (Minor):** Journey 4 (SDK/visitor) lacks a failure path — what happens if the visitor denies consent? The SDK behavior is described in domain requirements but not reflected in a journey.

### 4. Domain Requirements — PASS WITH NOTES
- GDPR, multi-tenancy, and LeadCars environment handling are addressed.
- **Major:** The GDPR section states "no se registran eventos hasta que el visitante otorga consentimiento" but Journey 2 shows the system displaying lifecycle "ENGAGED" and time-on-site data for a visitor with no `PRODUCT_VIEW` events — implying some data is collected before or without product consent. This tension between GDPR section and Journey 2 behavior is not resolved in the PRD.
- **Minor:** There is no mention of data retention policy — how long are visitor events and conversations stored?

### 5. Functional Requirements — PASS WITH NOTES
- FR1–FR36 are logically grouped and numbered.
- FR1–FR23 + FR29–FR36 are clearly scoped to MVP.
- FR24–FR28 are phase-deferred with clear labels.
- **Major:** FR13 ("El sistema actualiza el estado de los visitantes activos de forma periódica") is too vague. The NFR3 specifies ≤30s polling interval, but FR13 does not reference it — a developer could implement any interval. These should be linked or FR13 made more specific.
- **Major:** FR17 states sync happens "cuando un visitante cambia su lifecycle a LEAD" but FR18 says sync happens "al cerrar un chat." These can be different events. It's unclear whether closing a chat always triggers a lifecycle change, or whether both events independently trigger syncs (risk of duplicate records in LeadCars).
- **Minor:** FR29 ("El usuario puede autenticarse con sus credenciales") is extremely generic. The project context mentions OAuth 2.0 / PKCE (per the login AGENTS.md reference). The FR should specify the authentication mechanism.
- **Minor:** FR8 ("El agente puede ver los eventos que componen el heat index") is valuable but has no corresponding journey — it was not revealed by any of the 4 journeys. Verify this is genuinely in MVP scope or move to Fase 2.
- **Minor:** FR10 (filter by lifecycle) is not mentioned in any journey or success criterion. Confirm this is MVP.

### 6. Non-Functional Requirements — PASS
- Performance, security, scalability, accessibility, and integration reliability are all covered.
- Numeric thresholds are present for most performance requirements.
- WCAG 2.2 AA is specified — good precision.
- **Minor:** NFR12 ("up to 500 events in a batch") and NFR13 ("up to 100 concurrent visitors per tenant") have no stated measurement methodology — how will these be validated/tested?
- **Minor:** NFR9 (session expiration after inactivity) does not specify the inactivity timeout window. This needs a value for implementation.

### 7. Scope and Roadmap — PASS
- MVP items are explicitly listed with a justification column.
- Out-of-scope items are explicitly enumerated.
- Phase 2 and Phase 3 items are clearly separated.
- Risk table with probability, impact, and mitigation is present.
- **Note:** "Endpoint PRODUCT_VIEW no existe en backend" is marked as "Confirmado" risk — this is a blocking dependency that should appear as a prerequisite in sprint planning, not just a risk.

---

## Issues by Priority

### Critical
_None._

### Major

| ID | Section | Issue | Recommendation |
|----|---------|-------|----------------|
| M1 | Domain / Journey 2 | GDPR states no events are tracked without consent, but Journey 2 shows lifecycle and time-on-site data for a visitor with zero `PRODUCT_VIEW` events — implying some data is collected regardless of consent. | Clarify which data is collected before consent (session metadata) vs. after consent (product events). Add a note distinguishing these two categories explicitly in the GDPR section. |
| M2 | FR13 / NFR3 | FR13 is vague on update frequency; NFR3 specifies ≤30s. These are not linked and a developer could implement different values. | Update FR13 to read: "El sistema actualiza el estado de los visitantes activos en intervalos de ≤ 30 segundos (ver NFR3)." |
| M3 | FR17 / FR18 | Lifecycle-to-LEAD sync (FR17) and chat-close sync (FR18) can be independent events, risking duplicate lead records in LeadCars. | Add a requirement or note specifying deduplication logic: e.g., "if a visitor's lifecycle is already LEAD at chat close, the system skips a duplicate sync or updates the existing record." |

### Minor

| ID | Section | Issue | Recommendation |
|----|---------|-------|----------------|
| m1 | Success Criteria | "Time-to-contact" success criterion has no numeric threshold. | Add: "El agente contacta al visitante en < 3 minutos desde que su heat index supera el umbral configurado." |
| m2 | Journey 4 | No failure/consent-denied path for the SDK visitor journey. | Add a brief paragraph: what the visitor sees (and what the SDK does) when consent is denied — even if it's just "SDK stops, no banner, no tracking." |
| m3 | FR29 | Authentication FR is too generic; doesn't mention OAuth 2.0 / PKCE. | Specify: "El usuario se autentica vía OAuth 2.0 con flujo PKCE." |
| m4 | FR8 | "Ver eventos que componen el heat index" is not revealed by any journey and may be MVP scope creep. | Either add to Journey 1 (agent inspects score breakdown) or move FR8 to Fase 2 with explicit label. |
| m5 | FR10 | Filter by lifecycle is not traced to any journey or success metric. | Confirm this is MVP. If yes, add to Journey 1 or Journey 2. If not, defer to Fase 2. |
| m6 | NFR9 | Session inactivity timeout has no specified value. | Specify timeout: e.g., "Las sesiones expiran tras 60 minutos de inactividad." |
| m7 | NFR12 / NFR13 | No measurement methodology for batch-processing and concurrent visitor NFRs. | Add test criteria: "Verified by load test with [tool] generating N events/visitors over T seconds with p95 response time measured." |
| m8 | Domain | No data retention policy defined. | Add a domain requirement: "Visitor events and conversations are retained for X days/months. After that period they are deleted or anonymized." |
| m9 | Executive Summary | "Integración nativa con CRM sectorial" overstates current state (integration has known bugs). | Soften to: "integración directa con LeadCars" or qualify with "en desarrollo." |

---

## Summary

| Category | Count |
|----------|-------|
| Critical issues | 0 |
| Major issues | 3 |
| Minor issues | 9 |

The PRD is ready for sprint planning with the following actions recommended before story creation:

1. **Resolve M1** (GDPR vs. Journey 2 data tension) — has compliance implications.
2. **Resolve M2** (link FR13 to NFR3) — prevents implementation ambiguity.
3. **Resolve M3** (FR17/FR18 deduplication) — prevents a data quality bug in LeadCars.
4. Address minor issues m3 (auth mechanism) and m6 (session timeout) before implementation of auth stories.

All other minor issues can be addressed during story refinement or backlog grooming without blocking development.
