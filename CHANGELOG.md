## 0.6.0 (2026-05-27)

* feat(chat): sync unread badges via server-authoritative count and WebSocket reset ([cc35893](https://github.com/RogerPugaRuiz/guiders-frontend/commit/cc35893))

## <small>0.5.4 (2026-05-27)</small>

* fix(visitors): remove auto-refresh polling and simplify refresh flow; restore manual refresh behavio ([1ed5940](https://github.com/RogerPugaRuiz/guiders-frontend/commit/1ed5940))

## <small>0.5.3 (2026-05-27)</small>

* fix(visitors): infinite scroll observer reconnect and strip page param from URL ([b47cda0](https://github.com/RogerPugaRuiz/guiders-frontend/commit/b47cda0))

## <small>0.5.2 (2026-05-26)</small>

* fix(ci): pass --project=chromium to Playwright via -- separator ([e8c86b0](https://github.com/RogerPugaRuiz/guiders-frontend/commit/e8c86b0))

## <small>0.5.1 (2026-05-25)</small>

* test(e2e): fix full E2E suite for all browsers (chromium, firefox, webkit) ([d27075c](https://github.com/RogerPugaRuiz/guiders-frontend/commit/d27075c))
* fix(e2e): correct admin password to E2eAdmin123! in workflow and env constants ([628066a](https://github.com/RogerPugaRuiz/guiders-frontend/commit/628066a))
* ci(e2e): fix teardown step to handle missing _backend dir gracefully ([7337e1b](https://github.com/RogerPugaRuiz/guiders-frontend/commit/7337e1b))
* ci(e2e): validate backend repo secrets and verify checkout before build ([ffd2475](https://github.com/RogerPugaRuiz/guiders-frontend/commit/ffd2475))

## 0.5.0 (2026-05-23)

* ci: remove e2e from ci.yml run-many, covered by e2e.yml workflow ([7bca8f9](https://github.com/RogerPugaRuiz/guiders-frontend/commit/7bca8f9))
* ci(e2e): add GitHub Actions workflow with ephemeral backend Docker stack ([c0f92f9](https://github.com/RogerPugaRuiz/guiders-frontend/commit/c0f92f9))
* test(e2e/visitors): add infinite scroll and update complex filters tests; fix auth helper and styles ([bda7a22](https://github.com/RogerPugaRuiz/guiders-frontend/commit/bda7a22))
* chore: ignore .playwright-mcp directory ([482563c](https://github.com/RogerPugaRuiz/guiders-frontend/commit/482563c))
* chore(playwright): add playwright-mcp logs ([f1504bb](https://github.com/RogerPugaRuiz/guiders-frontend/commit/f1504bb))
* feat(integrations): add lead cars integration and icon ([c5c38a1](https://github.com/RogerPugaRuiz/guiders-frontend/commit/c5c38a1))

## 0.4.0 (2026-05-21)

* feat(leadcars): add show/hide toggle and length hint for clienteToken field ([9eb3b3b](https://github.com/RogerPugaRuiz/guiders-frontend/commit/9eb3b3b))

## <small>0.3.4 (2026-05-21)</small>

* fix(leadcars): disable password autocomplete on clienteToken input ([8935f76](https://github.com/RogerPugaRuiz/guiders-frontend/commit/8935f76))

## <small>0.3.3 (2026-05-21)</small>

* fix(leadcars): propagate HTTP errors from LeadCars API and show specific 401 message ([b928975](https://github.com/RogerPugaRuiz/guiders-frontend/commit/b928975))

## <small>0.3.2 (2026-05-21)</small>

* fix(routing): add wildcard catch-all routes to prevent NG04002 on unknown paths ([975d22e](https://github.com/RogerPugaRuiz/guiders-frontend/commit/975d22e))

## <small>0.3.1 (2026-05-20)</small>

* fix(admin): use 0.0.0-local placeholder so CI sed injects APP_VERSION ([c86a1ae](https://github.com/RogerPugaRuiz/guiders-frontend/commit/c86a1ae))

## 0.3.0 (2026-05-20)

* feat(admin/integrations): surface LeadCars data load failures and avoid console spam ([2acbdd0](https://github.com/RogerPugaRuiz/guiders-frontend/commit/2acbdd0))

## <small>0.2.1 (2026-05-20)</small>

* fix(admin/integrations): auto-load LeadCars lists when config has saved token ([3181307](https://github.com/RogerPugaRuiz/guiders-frontend/commit/3181307))

## 0.2.0 (2026-05-20)

* Merge branch 'develop' ([4c366f4](https://github.com/RogerPugaRuiz/guiders-frontend/commit/4c366f4))
* feat(admin/integrations): improve LeadCars config form state handling and admin app version display ([1f6c222](https://github.com/RogerPugaRuiz/guiders-frontend/commit/1f6c222))

## 0.1.0 (2026-05-16)

* Merge remote-tracking branch 'origin/main' ([7eda53d](https://github.com/RogerPugaRuiz/guiders-frontend/commit/7eda53d))
* feat: update admin app version display and improve leadcars config form state handling ([38653ae](https://github.com/RogerPugaRuiz/guiders-frontend/commit/38653ae))

## <small>0.0.4 (2026-05-16)</small>

* fix: revert to production environment with correct SSH secrets ([0fbe177](https://github.com/RogerPugaRuiz/guiders-frontend/commit/0fbe177))
* temp: export secrets to server .env file (revert after use) ([d0094dd](https://github.com/RogerPugaRuiz/guiders-frontend/commit/d0094dd))

## <small>0.0.3 (2026-05-16)</small>

* fix: use staging environment for SSH secrets in deploy workflow ([bb7c4fa](https://github.com/RogerPugaRuiz/guiders-frontend/commit/bb7c4fa))

## <small>0.0.2 (2026-05-16)</small>

* fix(ci): read APP_VERSION from git tag instead of package.json ([a18035f](https://github.com/RogerPugaRuiz/guiders-frontend/commit/a18035f))
* fix(ci): retrigger deploy after clearing duplicate v0.0.2 tags ([68b5760](https://github.com/RogerPugaRuiz/guiders-frontend/commit/68b5760))
* fix(version): inject APP_VERSION via sed before build to fix esbuild not reading vite define ([72d70f9](https://github.com/RogerPugaRuiz/guiders-frontend/commit/72d70f9))
* chore(ci): add conventional-changelog-conventionalcommits for semantic-release ([3a92d27](https://github.com/RogerPugaRuiz/guiders-frontend/commit/3a92d27))
* chore(ci): rename develop to main, simplify to single deploy workflow ([a7f9045](https://github.com/RogerPugaRuiz/guiders-frontend/commit/a7f9045))
* chore(opencode): update publish commands to target main branch ([8dbed0c](https://github.com/RogerPugaRuiz/guiders-frontend/commit/8dbed0c))
* chore(release): 0.0.2 [skip ci] ([f0ac8f9](https://github.com/RogerPugaRuiz/guiders-frontend/commit/f0ac8f9))
* chore(release): 0.0.2 [skip ci] ([4114f74](https://github.com/RogerPugaRuiz/guiders-frontend/commit/4114f74))
* chore(release): 0.0.2 [skip ci] ([f6971dd](https://github.com/RogerPugaRuiz/guiders-frontend/commit/f6971dd))
* chore(release): 0.0.2-staging.1 [skip ci] ([79306bb](https://github.com/RogerPugaRuiz/guiders-frontend/commit/79306bb))
* docs(opencode): update commands README to reflect main branch and CI/CD flow ([e887f3f](https://github.com/RogerPugaRuiz/guiders-frontend/commit/e887f3f))

## <small>0.0.2 (2026-05-16)</small>

* docs(opencode): update commands README to reflect main branch and CI/CD flow ([e887f3f](https://github.com/RogerPugaRuiz/guiders-frontend/commit/e887f3f))
* chore(ci): add conventional-changelog-conventionalcommits for semantic-release ([3a92d27](https://github.com/RogerPugaRuiz/guiders-frontend/commit/3a92d27))
* chore(ci): rename develop to main, simplify to single deploy workflow ([a7f9045](https://github.com/RogerPugaRuiz/guiders-frontend/commit/a7f9045))
* chore(opencode): update publish commands to target main branch ([8dbed0c](https://github.com/RogerPugaRuiz/guiders-frontend/commit/8dbed0c))
* chore(release): 0.0.2 [skip ci] ([4114f74](https://github.com/RogerPugaRuiz/guiders-frontend/commit/4114f74))
* chore(release): 0.0.2 [skip ci] ([f6971dd](https://github.com/RogerPugaRuiz/guiders-frontend/commit/f6971dd))
* chore(release): 0.0.2-staging.1 [skip ci] ([79306bb](https://github.com/RogerPugaRuiz/guiders-frontend/commit/79306bb))
* fix(ci): read APP_VERSION from git tag instead of package.json ([a18035f](https://github.com/RogerPugaRuiz/guiders-frontend/commit/a18035f))
* fix(version): inject APP_VERSION via sed before build to fix esbuild not reading vite define ([72d70f9](https://github.com/RogerPugaRuiz/guiders-frontend/commit/72d70f9))

## <small>0.0.2 (2026-05-16)</small>

* chore(ci): add conventional-changelog-conventionalcommits for semantic-release ([3a92d27](https://github.com/RogerPugaRuiz/guiders-frontend/commit/3a92d27))
* chore(ci): rename develop to main, simplify to single deploy workflow ([a7f9045](https://github.com/RogerPugaRuiz/guiders-frontend/commit/a7f9045))
* chore(opencode): update publish commands to target main branch ([8dbed0c](https://github.com/RogerPugaRuiz/guiders-frontend/commit/8dbed0c))
* chore(release): 0.0.2 [skip ci] ([f6971dd](https://github.com/RogerPugaRuiz/guiders-frontend/commit/f6971dd))
* chore(release): 0.0.2-staging.1 [skip ci] ([79306bb](https://github.com/RogerPugaRuiz/guiders-frontend/commit/79306bb))
* fix(ci): read APP_VERSION from git tag instead of package.json ([a18035f](https://github.com/RogerPugaRuiz/guiders-frontend/commit/a18035f))
* fix(version): inject APP_VERSION via sed before build to fix esbuild not reading vite define ([72d70f9](https://github.com/RogerPugaRuiz/guiders-frontend/commit/72d70f9))

## <small>0.0.2 (2026-05-16)</small>

* chore(ci): add conventional-changelog-conventionalcommits for semantic-release ([3a92d27](https://github.com/RogerPugaRuiz/guiders-frontend/commit/3a92d27))
* chore(ci): rename develop to main, simplify to single deploy workflow ([a7f9045](https://github.com/RogerPugaRuiz/guiders-frontend/commit/a7f9045))
* chore(release): 0.0.2-staging.1 [skip ci] ([79306bb](https://github.com/RogerPugaRuiz/guiders-frontend/commit/79306bb))
* fix(ci): read APP_VERSION from git tag instead of package.json ([a18035f](https://github.com/RogerPugaRuiz/guiders-frontend/commit/a18035f))
* fix(version): inject APP_VERSION via sed before build to fix esbuild not reading vite define ([72d70f9](https://github.com/RogerPugaRuiz/guiders-frontend/commit/72d70f9))

## <small>0.0.2-staging.1 (2026-05-16)</small>

* fix(version): inject APP_VERSION via sed before build to fix esbuild not reading vite define ([72d70f9](https://github.com/RogerPugaRuiz/guiders-frontend/commit/72d70f9))
* chore(ci): add conventional-changelog-conventionalcommits for semantic-release ([3a92d27](https://github.com/RogerPugaRuiz/guiders-frontend/commit/3a92d27))
