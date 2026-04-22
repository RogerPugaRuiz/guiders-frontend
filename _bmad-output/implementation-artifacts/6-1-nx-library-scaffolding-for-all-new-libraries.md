# Story 6.1: Nx Library Scaffolding for All New Libraries

Status: ready-for-dev

## Story

As a developer,
I want all five new MVP libraries properly scaffolded in the Nx monorepo with correct path aliases, tags, lint boundaries, and build targets,
so that feature development can begin immediately without import errors or boundary violations blocking other stories.

## Acceptance Criteria

1. 5 new libraries created with `nx generate @nx/angular:library` (changeDetection: OnPush, standalone: true, linter: eslint, unitTestRunner: vitest):
   - `libs/chat/data-access/visitor-products-service` — tags: `scope:chat type:data-access`
   - `libs/chat/ui/visitor-product-history` — tags: `scope:chat type:ui`
   - `libs/chat/ui/heat-index-badge` — tags: `scope:chat type:ui`
   - `libs/admin/data-access/leadcars-status-service` — tags: `scope:admin type:data-access`
   - `libs/admin/ui/leadcars-status-panel` — tags: `scope:admin type:ui`
2. All 5 path aliases added to `tsconfig.base.json` paths section
3. `nx build` passes for all 5 new libraries (empty but compilable)
4. `nx lint` passes for all 5 new libraries
5. `nx graph` correctly shows the 5 new nodes
6. ESLint boundary rules verified: `type:ui` libs cannot import `data-access` or `feature` libs

## Tasks / Subtasks

- [ ] Task 1: Scaffold 5 new libraries via Nx generator (AC: 1)
  - [ ] `nx generate @nx/angular:library visitor-products-service --directory=libs/chat/data-access --tags="scope:chat,type:data-access" --standalone --changeDetection=OnPush`
  - [ ] `nx generate @nx/angular:library visitor-product-history --directory=libs/chat/ui --tags="scope:chat,type:ui" --standalone --changeDetection=OnPush`
  - [ ] `nx generate @nx/angular:library heat-index-badge --directory=libs/chat/ui --tags="scope:chat,type:ui" --standalone --changeDetection=OnPush`
  - [ ] `nx generate @nx/angular:library leadcars-status-service --directory=libs/admin/data-access --tags="scope:admin,type:data-access" --standalone --changeDetection=OnPush`
  - [ ] `nx generate @nx/angular:library leadcars-status-panel --directory=libs/admin/ui --tags="scope:admin,type:ui" --standalone --changeDetection=OnPush`
- [ ] Task 2: Register path aliases in `tsconfig.base.json` (AC: 2)
  - [ ] Add all 5 aliases to the `paths` section (exact paths in Dev Notes)
  - [ ] Verify `nx build` picks up aliases correctly
- [ ] Task 3: Verify build, lint, and graph (AC: 3, 4, 5)
  - [ ] Run `nx build chat-data-access-visitor-products-service` (and same for each lib)
  - [ ] Run `nx lint` for all 5 new libraries
  - [ ] Run `nx graph` and confirm new nodes appear
- [ ] Task 4: Verify ESLint boundary rules (AC: 6)
  - [ ] Check `eslint.config.mjs` for existing `@nx/enforce-module-boundaries` rule
  - [ ] Confirm `type:ui` → `type:data-access` import is rejected (add test import temporarily if needed to verify, then remove)

## Dev Notes

### Exact Path Aliases to Add in `tsconfig.base.json`

Add these 5 entries inside the existing `"paths"` object in `tsconfig.base.json`. Follow the exact format of existing entries (alphabetical order is not strictly required but preferred):

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

### Project Structure Reference (existing pattern to follow)

The exact `project.json` structure of an existing `data-access` lib to mirror:

```json
{
  "name": "visitors-data-service",
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/chat/data-access/visitors-data-service/src",
  "prefix": "guiders",
  "projectType": "library",
  "tags": ["type:data-access", "scope:chat"],
  "targets": {
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "reportsDirectory": "../../../../coverage/libs/chat/data-access/visitors-data-service"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  }
}
```

Mirror this pattern in the generated `project.json` for each new library, adjusting `name`, `sourceRoot`, `tags`, and `reportsDirectory` accordingly.

### Expected Library Name Mapping (Nx project names)

Nx will derive project names from the directory path. Confirm these are the names in `project.json`:

| Library Path | Expected Nx Project Name |
|---|---|
| `libs/chat/data-access/visitor-products-service` | `visitor-products-service` |
| `libs/chat/ui/visitor-product-history` | `visitor-product-history` |
| `libs/chat/ui/heat-index-badge` | `heat-index-badge` |
| `libs/admin/data-access/leadcars-status-service` | `leadcars-status-service` |
| `libs/admin/ui/leadcars-status-panel` | `leadcars-status-panel` |

### Nx Generator Defaults (from `nx.json`)

The workspace already has these generator defaults (do not override them):
```json
"@nx/angular:library": {
  "linter": "eslint",
  "unitTestRunner": "vitest"
}
```

You can pass `--changeDetection=OnPush` and `--standalone` explicitly, or set them per generation.

### ESLint Boundary Rules Reference

The workspace uses `@nx/enforce-module-boundaries`. The relevant existing rules enforce:
- `type:ui` can only import `type:ui` and `type:util`
- `type:data-access` can import `shared/*` (any scope) and `auth/data-access/session`
- `type:feature` can import `type:ui`, `type:data-access`, `type:util` within scope

This story does NOT need to add new boundary rules — the existing rules already cover the new libraries by tag. Just verify they apply correctly.

### What NOT to do

- Do **not** add any feature code to these libraries in this story — scaffolding only (empty library shell with `index.ts` that exports nothing or exports an empty placeholder)
- Do **not** modify `eslint.config.mjs` unless a rule is genuinely missing for the new scopes (`scope:chat` and `scope:admin` rules should already exist)
- Do **not** create shared types yet — that is Story 1.2 / Story 2.2

### Project Structure Notes

- `libs/chat/data-access/` already contains: `chat-service`, `chat-widget-service`, `escalation-service`, `lead-contact-service`, `presence-service`, `unread-messages-service`, `visitors-data-service`, `websocket-service` — no folder creation needed
- `libs/chat/ui/` already contains `visitor-detail-panel`, `visitors-list`, etc. — no folder creation needed
- `libs/admin/` has `data-access/` and `features/` subdirectories. `libs/admin/ui/` may not exist yet — the generator will create it
- `libs/admin/data-access/` already contains `leads-service`, `llm-config-service` — no folder creation needed

### References

- Architecture §3 "New Libraries Required for MVP" — [Source: `_bmad-output/planning-artifacts/architecture.md#3-new-libraries-required-for-mvp`]
- Architecture Appendix A "New Path Aliases" — [Source: `_bmad-output/planning-artifacts/architecture.md#appendix-a-new-path-aliases`]
- Architecture Appendix B "Nx Project Tags Summary" — [Source: `_bmad-output/planning-artifacts/architecture.md#appendix-b-nx-project-tags-summary`]
- Existing pattern: `libs/chat/data-access/visitors-data-service/project.json`
- Existing pattern: `libs/chat/ui/visitor-detail-panel/project.json`
- Nx generator defaults: `nx.json` `generators["@nx/angular:library"]`

## Dev Agent Record

### Agent Model Used

_to be filled by dev agent_

### Debug Log References

### Completion Notes List

### File List

_Files created/modified during implementation:_
- `tsconfig.base.json` — 5 new path aliases added
- `libs/chat/data-access/visitor-products-service/` — new library scaffold
- `libs/chat/ui/visitor-product-history/` — new library scaffold
- `libs/chat/ui/heat-index-badge/` — new library scaffold
- `libs/admin/data-access/leadcars-status-service/` — new library scaffold
- `libs/admin/ui/leadcars-status-panel/` — new library scaffold
