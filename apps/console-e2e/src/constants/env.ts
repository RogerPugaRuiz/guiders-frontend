/**
 * E2E test environment constants.
 *
 * In CI (GitHub Actions) these values come from environment variables set by
 * the e2e.yml workflow, which spins up an ephemeral backend Docker stack.
 *
 * Locally, the defaults point to the backend seeded by `npm run seed:e2e`
 * in guiders-backend. If the backend team resets the database, new local
 * values will be provided.
 */
export const E2E = {
  adminEmail:
    process.env['E2E_ADMIN_EMAIL'] ?? 'admin@e2e.guiders.local',
  adminPassword:
    process.env['E2E_ADMIN_PASSWORD'] ?? 'E2eAdmin123!',
  apiUrl:
    process.env['E2E_API_URL'] ?? 'http://localhost:3099',

  // Local-only values (not used in CI — the seeded data matches these shapes).
  companyId: '19896f02-febb-4e44-84b9-91e957644f20',
  siteId: '3cc4c92e-2f52-46b5-99b6-f898935f950d',
  domain: 'e2e.guiders.local',
  apiKey:
    '40c7f31e1f9b278444500e213086e0aa82865206d3d74a41926c12cc026a762f',

  /**
   * Total visitors seeded in the E2E environment.
   * - CI (Docker E2E stack): 50 (hardcoded in docker-entrypoint.e2e.sh --visitors 50)
   * - Local dev: 150 (seeded by `npm run seed:e2e` in guiders-backend)
   * Override with E2E_TOTAL_VISITORS env var if needed.
   */
  totalVisitors: Number(process.env['E2E_TOTAL_VISITORS'] ?? 50),
  /** Batch size used by the visitors component (batchSize input). */
  batchSize: 25,
};
