# Deferred Work

Tracks issues deliberately deferred during code review. Each entry is real but not actionable in its originating story.

## Deferred from: code review of 8-1-fix-themeservice-multitenant-localstorage-leak (2026-05-29)

- **No trimming/normalization of tenantId whitespace** — `'leadcars'` vs `'leadcars '` resolve to different localStorage keys. Depends on upstream provider hygiene; story 8-3 (which sets tenantId) should normalize before providing. [theme.service.ts:198]
- **No escaping of tenantId in key construction** — naive string interpolation `${THEME_STORAGE_KEY}-${tenantId}`. No current collision but unguarded against adjacent/future key schemes. Low risk. [theme.service.ts:198]
- **`getItem` returning `''` (empty string) treated identically to `null`** — an intentionally-empty scoped key would be clobbered by migration. Display unaffected because `normaliseTheme('')` → DEFAULT_THEME. [theme.service.ts:220]

## Deferred from: code review of 8-3-create-iframe-data-access-library-theme-service (2026-05-29)

- **No length cap on `customCss` (DoS hardening)** — 5 sequential regex passes over a 5MB string is expensive; a single huge `<style>` is also a problem. Real DoS hardening is a backend concern (cap payload size) + frontend WAF. [theme.utils.ts:53-111]
- **`removeFromDom` strips host-authored `--guiders-*` vars** — the `guiders-` prefix is supposed to namespace tenant values from the host, but all writes go to the same `documentElement`. If the host page happens to use the same prefix, the iframe will wipe those vars on theme change. Architectural fix: scope CSS vars to a child `<div>` inside the iframe shell. [theme.service.ts:145-158]

## Deferred from: code review of 8-2-create-shared-types-iframe-library (re-review 2026-05-29)

- **`AllowedParentOrigin` accepts dangerous origins** — the template literal type `\`https://${string}\`` is a compile-time hint, not a runtime guard. `https://evil.com.attacker.net`, `https://leadcars.com@attacker.com`, IDN homograph variants all pass type-check. Real validation (URL parse + allowlist) is story 8-4's (PostMessageHandler) responsibility. [post-message.types.ts:9]
- **`IframeUser` and `UserInfo` divergent user shapes** — two coexisting models for "the user" (`{id,name,role,avatar,permissions}` vs `{userId,userName,avatarUrl?,timestamp}`). Unification requires design work on which fields are core vs postMessage-only. Defer to post-MVP. [iframe-init.types.ts:31-37, post-message.types.ts:47-52]
- **`ThemeConfig.componentMappings` untyped keys** — `Readonly<Record<string, string>>` is intentionally open-ended; slot names (`VisitorCard`, `LeadCarsVisitorCard`) are added over time per tenant. JSDoc should say so. [theme.types.ts:335]
- **`MessageEnvelope.requestId` not branded as UUID** — JSDoc promises UUID v4, type is `string`. A branded `Uuid` type would be a security/observability improvement but is not blocking. Defer. [post-message.types.ts:561]
- **`ProtocolVersion` template literal allows negative numbers and weird coercions** — `\`${number}.${number}.${number}\`` permits `'-1.0.0'`, `'1.0.0e0'`, `'NaN.0.0'`. Template literals cannot enforce non-negativity; runtime validation (already in `parseVersion`) handles it. Add JSDoc warning that the type is compile-time only. [protocol-version.ts:75]
- **Multiple `timestamp: number` without brand (seconds vs ms)** — 5+ occurrences of `timestamp: number` across payloads, no `EpochMs` brand. Adding a brand everywhere is broad; defer to a centralised type in story 8-4 (PostMessageHandler) where the message format is enforced. [post-message.types.ts]

## Deferred from: code review of 8-4-create-iframe-data-access-library-postmessage-handler (2026-05-29)

- **No replay protection for inbound messages** — the service generates `requestId` for outbound but does not track or validate inbound `requestId`/`timestamp`. A malicious or replayed message from an allowlisted origin can be re-injected. Real fix: maintain a sliding window of seen `requestId`s per origin. Out of scope for story 8-4; defer to post-MVP. [post-message-handler.service.ts:230-280]
- **`window.parent` assumes single-level iframe nesting** — GuidERS embedded inside a wrapper iframe (depth 2) would post to the wrapper, not leadcars. Multi-level nesting requires `window.top` or `window.parent.parent` logic. Architectural decision deferred. [post-message-handler.service.ts:183]

## Deferred from: code review of 8-5-create-iframe-data-access-library-iframe-init-service (2026-06-05)

- **Empty `features` defaults silently to all-false** — Mapper at `api-mapper.ts:191-203` uses `?? false` for all feature flags. There is no way for the consumer to distinguish "feature intentionally disabled by tenant" from "feature field not sent by backend bug". This is a backend contract issue (should backend always return all feature keys?) and a frontend observability concern (no warning when missing). Defer to design review. [api-mapper.ts:191-203]

## Deferred from: code review of 8-6-create-iframe-bootstrap-ui-component (2026-06-06)

- **`SkeletonBlockComponent` selector `lib-` vs `guiders-`** — Pre-existing inconsistency in `libs/shared/ui/skeleton/`. A UI library using a `lib-` prefix violates the AGENTS.md convention (`guiders-` for UI, `lib-` for features). Renaming is a cross-library refactor outside the scope of story 8-6. Defer to a separate cleanup story.
- **Effect re-run `startTimer` resets `elapsed`** — The effect at `iframe-bootstrap.component.ts:143-152` re-runs `startTimer` (clearing + restarting) on every `initiating` state, even if a timer is already running. The only way this manifests is if the parent re-emits the same `{kind: 'initiating'}` object reference while a timer is mid-flight — currently no consumer does this. Edge case tied to parent contract; defer to a usage-pattern review.
- **Timer granularity 100ms** — `setInterval(..., 100)` for timing means warning fires between 5000–5099ms and timeout between 12000–12099ms (drift). The spec says "5s" and "12s" without specifying ms-level precision. Functional; defer to a stricter-timing refactor if any consumer ever depends on exact thresholds.
- **README.md minimal** — Only the default Nx generator template (7 lines). The spec does not require component-level documentation. Defer to a docs-coverage pass.
