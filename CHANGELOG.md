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
