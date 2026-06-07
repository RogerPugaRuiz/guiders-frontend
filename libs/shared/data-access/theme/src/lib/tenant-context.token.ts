import { InjectionToken } from '@angular/core';

/**
 * Tenant context identifier for the current session.
 *
 * When the app runs in default mode (no iframe embed), this is `null` and
 * the ThemeService falls back to the legacy global key.
 *
 * When embedded as a white-label iframe, the iframe-init flow provides a
 * non-null tenantId so localStorage entries are namespaced per tenant and
 * cannot leak across tenants in the same browser.
 *
 * Provided by the app shell (future story 8-3) — defaults to null in
 * standalone / non-embedded usage.
 */
export const TENANT_CONTEXT_TOKEN = new InjectionToken<string | null>(
  'TENANT_CONTEXT_TOKEN',
);
