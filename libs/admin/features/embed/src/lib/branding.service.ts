import { Injectable, inject, signal, computed, DOCUMENT } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Service que carga la configuración de branding del tenant y la aplica
 * al DOM runtime (DESPUÉS de Angular boot, complementando el inline CSS
 * del GET /embed/start).
 *
 * Story 4.2 — Epic 4: White-Label Branding Application.
 *
 * Flujo:
 * 1. `loadBranding(companyId)` — GET /v2/companies/:companyId/white-label
 * 2. Almacena el resultado en un `signal<WhiteLabelConfig>` (reactivo)
 * 3. Aplica CSS variables al document.documentElement via setProperty
 * 4. Setea document.title a "Guiders Admin - {brandName}"
 * 5. Crea/actualiza <link rel="icon"> con faviconUrl
 *
 * Si falla: fallback al inline CSS (ya aplicado por el HTML wrapper).
 *
 * Spec: `_bmad-output/planning-artifacts/epics.md` Story 4.2
 *      + `_bmad-output/implementation-artifacts/4-1-...md` (cross-ref)
 */

/**
 * WhiteLabelConfig shape (subset — full shape lives in backend).
 * Defined here to avoid cross-repo dependency.
 */
interface WhiteLabelConfig {
  id: string;
  companyId: string;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  typography: {
    fontFamily: string;
    customFontFiles: Array<{ name: string; url: string }>;
  };
  branding: {
    brandName: string;
    logoUrl: string | null;
    faviconUrl: string | null;
  };
  theme: 'light' | 'dark' | 'system';
  embedEnabled: boolean;
  embedAllowedOrigins: string[];
}

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  /** Reactive config signal. Null until loaded. */
  readonly brandingConfig = signal<WhiteLabelConfig | null>(null);

  /** Loading state. */
  readonly isLoading = signal<boolean>(false);

  /** Ready state — true after first successful load. */
  readonly isReady = signal<boolean>(false);

  /** Error state — true if last load failed. */
  readonly hasError = signal<boolean>(false);

  /** Computed: brand name shortcut for templates. */
  readonly brandName = computed<string>(
    () => this.brandingConfig()?.branding.brandName ?? 'Guiders',
  );

  /** In-memory cache to avoid duplicate requests for same companyId. */
  private readonly cache = new Map<string, WhiteLabelConfig>();
  private readonly inflight = new Map<string, Promise<void>>();

  /**
   * Loads the branding config for a given companyId. Cached on success.
   *
   * AC1: Calls GET /v2/companies/:companyId/white-label
   * AC2: Updates brandingConfig signal reactively
   * AC3: Falls back to inline CSS (already applied) on failure
   */
  async loadBranding(companyId: string): Promise<void> {
    if (!companyId) {
      console.warn('[BrandingService] No companyId provided');
      this.hasError.set(true);
      return;
    }

    // Return cached value if available
    const cached = this.cache.get(companyId);
    if (cached) {
      this.brandingConfig.set(cached);
      this.applyBranding(cached);
      return;
    }

    // Deduplicate concurrent requests for same companyId
    const existing = this.inflight.get(companyId);
    if (existing) {
      return existing;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    const promise = (async (): Promise<void> => {
      try {
        const config = await firstValueFrom(
          this.http.get<WhiteLabelConfig>(
            `/api/v2/companies/${companyId}/white-label`,
          ),
        );
        this.cache.set(companyId, config);
        this.brandingConfig.set(config);
        this.applyBranding(config);
        this.isReady.set(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'unknown error';
        console.warn(
          `[BrandingService] Failed to load branding for company=${companyId} (falling back to inline CSS): ${message}`,
        );
        this.hasError.set(true);
      } finally {
        this.isLoading.set(false);
        this.inflight.delete(companyId);
      }
    })();

    this.inflight.set(companyId, promise);
    return promise;
  }

  /**
   * Force re-fetch (bypasses cache). Used when admin updates branding.
   *
   * AC2: Updates the signal reactively.
   */
  async refresh(companyId?: string): Promise<void> {
    const targetCompanyId = companyId ?? this.brandingConfig()?.companyId;
    if (!targetCompanyId) {
      console.warn('[BrandingService] No companyId to refresh');
      return;
    }
    this.cache.delete(targetCompanyId);
    return this.loadBranding(targetCompanyId);
  }

  /**
   * Applies the branding config to the DOM:
   * - CSS variables on document.documentElement
   * - document.title
   * - <link rel="icon"> for favicon
   */
  private applyBranding(config: WhiteLabelConfig): void {
    const root = this.document.documentElement;
    const c = config.colors;
    const t = config.typography;
    const b = config.branding;

    // CSS variables
    root.style.setProperty('--gds-color-primary', c.primary);
    root.style.setProperty('--gds-color-secondary', c.secondary);
    root.style.setProperty('--gds-color-tertiary', c.tertiary);
    root.style.setProperty('--gds-color-background', c.background);
    root.style.setProperty('--gds-color-surface', c.surface);
    root.style.setProperty('--gds-color-text', c.text);
    root.style.setProperty('--gds-color-text-muted', c.textMuted);
    root.style.setProperty('--gds-font-family', t.fontFamily);
    root.style.setProperty('--gds-logo-url', `url("${b.logoUrl ?? ''}")`);
    root.style.setProperty('--gds-favicon-url', `url("${b.faviconUrl ?? ''}")`);

    // Document title
    this.document.title = `Guiders Admin - ${b.brandName}`;

    // Favicon (create or update <link rel="icon">)
    if (b.faviconUrl) {
      let linkEl = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!linkEl) {
        linkEl = this.document.createElement('link');
        linkEl.rel = 'icon';
        this.document.head.appendChild(linkEl);
      }
      linkEl.href = b.faviconUrl;
    }
  }
}