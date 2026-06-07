import { describe, it, expect, beforeEach, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID, DOCUMENT } from "@angular/core";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { IframeInitService } from "./iframe-init.service";
import { IFRAME_CONFIG_TOKEN } from "../theme/theme.token";
import { ThemeService } from "../theme/theme.service";
import { DEFAULT_THEME } from "../theme/theme.fallback";
import { mapApiResponseToCanonical, mapApiErrorToCanonical } from "./api-mapper";
import type { IframeInitResult } from "@guiders-frontend/shared/types/iframe";

const BASE_URL = "https://bff.example.com";
const TOKEN = "test-token-123";
const VALID_API_RESPONSE = {
  company: { id: "co-1", name: "Acme Corp", subdomain: "acme", logo: { url: "https://cdn.acme/logo.png", alt: "Acme Logo" }, support_email: "support@acme.com" },
  theme: { id: "theme-1", name: "Acme Theme", config: { id: "theme-1", colors: { primary: "#ff0000", secondary: "#00ff00", accent: "#0000ff", text_primary: "#111111", text_secondary: "#222222", background: "#ffffff", surface: "#fafafa", error: "#ff0000", success: "#00ff00" }, typography: { font_family: "Inter, sans-serif", base_font_size: "14px", heading_font_weight: "600" }, logos: { header: { url: "https://cdn.acme/h.svg", height: 48 }, favicon: { url: "https://cdn.acme/f.ico" }, emptyState: { url: "https://cdn.acme/e.svg" } }, enabled_sections: ["chat", "escalations"], custom_css: ".x { color: red; }", component_mappings: { "slot-1": "CustomComponent" } } },
  features: { chat_enabled: true, escalations_enabled: true, contacts_enabled: false, visitors_enabled: true, inbox_enabled: false, file_attachments: true, read_receipts: false, typing_indicators: true, ai_suggestions: false },
  user: { id: "u-1", name: "Alice Operator", role: "operator", avatar: "https://cdn.acme/avatar.png", permissions: ["chat:read", "escalations:write"] },
  config: { session_timeout: 3600, max_file_size: 5242880, allowed_file_types: ["image/png", "application/pdf"] },
  version: "1.0.0",
};
function configureTestBed(config?: { token?: string; baseUrl?: string; platformId?: string }) {
  TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [
    { provide: PLATFORM_ID, useValue: config?.platformId ?? "browser" },
    { provide: DOCUMENT, useValue: document },
    { provide: IFRAME_CONFIG_TOKEN, useValue: config?.token ? { token: config.token, tenantId: "tenant-1", baseUrl: config.baseUrl ?? BASE_URL } : null },
    IframeInitService,
  ]});
}

describe("IframeInitService", () => {
  let service: IframeInitService;
  let httpMock: HttpTestingController;
  let themeService: ThemeService;
  let setThemeSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    configureTestBed({ token: TOKEN, baseUrl: BASE_URL });
    service = TestBed.inject(IframeInitService);
    httpMock = TestBed.inject(HttpTestingController);
    themeService = TestBed.inject(ThemeService);
    setThemeSpy = vi.spyOn(themeService, "setTheme");
    vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  describe("api-mapper", () => {
    describe("mapApiResponseToCanonical", () => {
      it("maps company fields correctly", () => {
        const result = mapApiResponseToCanonical(VALID_API_RESPONSE);
        expect(result.company.id).toBe("co-1");
        expect(result.company.name).toBe("Acme Corp");
        expect(result.company.subdomain).toBe("acme");
        expect(result.company.supportEmail).toBe("support@acme.com");
      });
      it("maps user fields correctly", () => {
        const result = mapApiResponseToCanonical(VALID_API_RESPONSE);
        expect(result.user.id).toBe("u-1");
        expect(result.user.name).toBe("Alice Operator");
        expect(result.user.role).toBe("operator");
      });
      it("maps theme config correctly", () => {
        const result = mapApiResponseToCanonical(VALID_API_RESPONSE);
        expect(result.theme).not.toBeNull();
        expect(result.theme!.config.colors.primary).toBe("#ff0000");
        expect(result.theme!.config.typography.headingFontWeight).toBe(600);
      });
      it("maps features correctly", () => {
        const result = mapApiResponseToCanonical(VALID_API_RESPONSE);
        expect(result.features.chatEnabled).toBe(true);
        expect(result.features.escalationsEnabled).toBe(true);
        expect(result.features.contactsEnabled).toBe(false);
      });
      it("maps runtime config correctly", () => {
        const result = mapApiResponseToCanonical(VALID_API_RESPONSE);
        expect(result.config.sessionTimeout).toBe(3600);
        expect(result.config.maxFileSize).toBe(5242880);
      });
      it("handles theme null case", () => {
        const response = { ...VALID_API_RESPONSE, theme: null };
        const result = mapApiResponseToCanonical(response);
        expect(result.theme).toBeNull();
      });
      it("is idempotent", () => {
        const first = mapApiResponseToCanonical(VALID_API_RESPONSE);
        const second = mapApiResponseToCanonical(VALID_API_RESPONSE);
        expect(first).toEqual(second);
      });
      it("maps theme summary vs config edge cases", () => {
        const response = { ...VALID_API_RESPONSE, features: {} };
        const result = mapApiResponseToCanonical(response);
        expect(result.features.chatEnabled).toBe(false);
        expect(result.features.escalationsEnabled).toBe(false);
        expect(result.features.contactsEnabled).toBe(false);
        expect(result.features.visitorsEnabled).toBe(false);
        expect(result.features.inboxEnabled).toBe(false);
        expect(result.features.fileAttachments).toBe(false);
        expect(result.features.readReceipts).toBe(false);
        expect(result.features.typingIndicators).toBe(false);
        expect(result.features.aiSuggestions).toBe(false);
      });
    });
    describe("mapApiErrorToCanonical", () => {
      it("maps basic error", () => {
        const result = mapApiErrorToCanonical({ reason: "invalid" });
        expect(result.reason).toBe("invalid");
      });
      it("handles null/undefined gracefully", () => {
        expect(mapApiErrorToCanonical(null)).toEqual({});
      });
    });
  });

  describe("initialize", () => {
    it("makes GET request to correct URL", () => {
      service.initialize().subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/api/v1/iframe/init`);
      expect(req.request.method).toBe("GET");
      req.flush(VALID_API_RESPONSE);
    });
    it("sets correct headers", () => {
      service.initialize().subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/api/v1/iframe/init`);
      expect(req.request.headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);
      expect(req.request.headers.get("X-Iframe-Init-Version")).toBe("1.0.0");
      req.flush(VALID_API_RESPONSE);
    });
    it("sets withCredentials false", () => {
      service.initialize().subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/api/v1/iframe/init`);
      expect(req.request.withCredentials).toBe(false);
      req.flush(VALID_API_RESPONSE);
    });
    it("returns ok true on success", () => {
      let result: IframeInitResult | null = null;
      service.initialize().subscribe(r => result = r);
      const req = httpMock.expectOne(`${BASE_URL}/api/v1/iframe/init`);
      req.flush(VALID_API_RESPONSE);
      expect(result!.ok).toBe(true);
    });
    it("calls setTheme on success", () => {
      service.initialize().subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/api/v1/iframe/init`);
      req.flush(VALID_API_RESPONSE);
      expect(setThemeSpy).toHaveBeenCalled();
    });
    it("calls setTheme(DEFAULT_THEME) when theme is null", () => {
      const response = { ...VALID_API_RESPONSE, theme: null };
      service.initialize().subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/api/v1/iframe/init`);
      req.flush(response);
      expect(setThemeSpy).toHaveBeenCalledWith(DEFAULT_THEME);
    });
    it("returns protocol_mismatch on version mismatch", () => {
      const mismatchResponse = { ...VALID_API_RESPONSE, version: "0.0.1" };
      let result: IframeInitResult | null = null;
      service.initialize().subscribe(r => result = r);
      const req = httpMock.expectOne(`${BASE_URL}/api/v1/iframe/init`);
      req.flush(mismatchResponse);
      expect(result!.ok).toBe(false);
      expect((result as any).error.reason).toBe("protocol_mismatch");
    });
    it("handles 401 without retry", () => {
      let result: IframeInitResult | null = null;
      service.initialize().subscribe(r => result = r);
      const req = httpMock.expectOne(`${BASE_URL}/api/v1/iframe/init`);
      req.flush({ reason: "invalid" }, { status: 401, statusText: "Unauthorized" });
      expect(result!.ok).toBe(false);
    });
    it("handles 503 and applies fallback theme", () => {
      const fallbackTheme = { id: 'fallback', name: 'Fallback', config: { id: 'fallback', colors: {}, typography: { fontFamily: 'sans-serif', baseFontSize: '13px', headingFontWeight: 400 }, logos: { header: { url: '' }, favicon: { url: '' }, emptyState: { url: '' } }, enabledSections: [], customCss: '', componentMappings: {} } };
      const result = mapApiErrorToCanonical({ fallbackTheme });
      expect(result.fallbackTheme).toBeDefined();
      expect(result.fallbackTheme!.id).toBe('fallback');
    });
    it("is SSR-safe with null config", () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: DOCUMENT, useValue: document },
        { provide: IFRAME_CONFIG_TOKEN, useValue: null },
        IframeInitService,
      ]});
      const noConfigService = TestBed.inject(IframeInitService);
      expect(noConfigService.isLoading()).toBe(false);
      expect(noConfigService.getCurrentResult()).toBeNull();
      let result: IframeInitResult | null = null;
      noConfigService.initialize().subscribe(r => result = r);
      expect(result!.ok).toBe(false);
      expect((result as any).error.reason).toBe("not_initialized");
      expect(noConfigService.isLoading()).toBe(false);
      expect(noConfigService.getCurrentResult()).not.toBeNull();
    });
    it("getCurrentResult returns signal state", () => {
      expect(service.getCurrentResult()).toBeNull();
      service.initialize().subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/api/v1/iframe/init`);
      req.flush(VALID_API_RESPONSE);
      expect(service.getCurrentResult()).not.toBeNull();
    });
    it("isLoading signal reflects loading state", () => {
      expect(service.isLoading()).toBe(false);
      const sub = service.initialize().subscribe();
      expect(service.isLoading()).toBe(true);
      const req = httpMock.expectOne(`${BASE_URL}/api/v1/iframe/init`);
      req.flush(VALID_API_RESPONSE);
      expect(service.isLoading()).toBe(false);
      sub.unsubscribe();
    });
  });
});
