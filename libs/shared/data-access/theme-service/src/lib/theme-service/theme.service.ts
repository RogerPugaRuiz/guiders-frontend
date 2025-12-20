import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import {
  WhiteLabelConfig,
  WhiteLabelTypography,
  CustomFontFile,
  ThemeMode,
  WHITE_LABEL_DEFAULTS,
  FONT_FAMILY_OPTIONS
} from './theme.types';

export interface EnvironmentConfig {
  api: {
    baseUrl: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);
  private baseUrl = '';

  // Signals para estado reactivo
  private readonly _config = signal<WhiteLabelConfig | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _initialized = signal<boolean>(false);

  readonly config = this._config.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();

  // Computed signals
  readonly brandName = computed(() => this._config()?.branding.brandName ?? 'Guiders');
  readonly logoUrl = computed(() => this._config()?.branding.logoUrl);
  readonly theme = computed(() => this._config()?.theme ?? 'light');
  readonly primaryColor = computed(() => this._config()?.colors.primary ?? WHITE_LABEL_DEFAULTS.colors.primary);
  readonly tertiaryColor = computed(() => this._config()?.colors.tertiary ?? WHITE_LABEL_DEFAULTS.colors.tertiary);

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  loadAndApplyTheme(companyId: string): Observable<WhiteLabelConfig> {
    this._loading.set(true);

    return this.http.get<WhiteLabelConfig>(
      `${this.baseUrl}/v2/companies/${companyId}/white-label`,
      { withCredentials: true }
    ).pipe(
      tap(config => {
        this._config.set(config);
        this.applyTheme(config);
        this._initialized.set(true);
        this._loading.set(false);
      }),
      catchError(error => {
        console.warn('[ThemeService] Error cargando tema, usando defaults:', error);
        this.applyDefaults();
        this._initialized.set(true);
        this._loading.set(false);
        return of(this.getDefaultConfig());
      })
    );
  }

  applyTheme(config: WhiteLabelConfig): void {
    const root = document.documentElement;
    const surfaceColor = config.colors.surface;
    const isDark = this.isDarkColor(surfaceColor);

    // 1. Colores base
    root.style.setProperty('--wl-color-primary', config.colors.primary);
    root.style.setProperty('--wl-color-secondary', config.colors.secondary);
    root.style.setProperty('--wl-color-tertiary', config.colors.tertiary);
    root.style.setProperty('--wl-color-background', config.colors.background);
    root.style.setProperty('--wl-color-surface', surfaceColor);
    root.style.setProperty('--wl-color-text', config.colors.text);
    root.style.setProperty('--wl-color-text-muted', config.colors.textMuted);

    // 2. Variantes de surface generadas automáticamente según luminosidad
    if (isDark) {
      // Surface oscuro → variantes más claras
      root.style.setProperty('--wl-color-surface-hover', this.adjustColor(surfaceColor, 15));
      root.style.setProperty('--wl-color-surface-selected', this.adjustColor(surfaceColor, 20));
      root.style.setProperty('--wl-color-surface-active', this.adjustColor(surfaceColor, 25));
      root.style.setProperty('--wl-color-surface-text', '#ffffff');
      root.style.setProperty('--wl-color-surface-text-muted', '#b0b8c0');
    } else {
      // Surface claro → variantes más oscuras
      root.style.setProperty('--wl-color-surface-hover', this.adjustColor(surfaceColor, -10));
      root.style.setProperty('--wl-color-surface-selected', this.adjustColor(surfaceColor, -15));
      root.style.setProperty('--wl-color-surface-active', this.adjustColor(surfaceColor, -20));
      root.style.setProperty('--wl-color-surface-text', '#212529');
      root.style.setProperty('--wl-color-surface-text-muted', '#6c757d');
    }

    // 3. Colores de mensajes basados en colores de marca
    const primaryColor = config.colors.primary;
    const tertiaryColor = config.colors.tertiary;
    const isPrimaryDark = this.isDarkColor(primaryColor);
    const isTertiaryDark = this.isDarkColor(tertiaryColor);

    // Mensajes de visitantes (otros) - SIEMPRE grises fijos
    root.style.setProperty('--wl-message-visitor-bg', isDark ? '#252542' : '#f1f3f4');

    // Mensajes propios (míos) - usan color de la marca (primario)
    root.style.setProperty('--wl-message-own-bg', this.adjustColor(primaryColor, isPrimaryDark ? 70 : -70));
    root.style.setProperty('--wl-message-own-text', isPrimaryDark ? '#ffffff' : '#212529');

    // Mensajes de IA usan color terciario
    root.style.setProperty('--wl-message-ai-bg-start', this.adjustColor(tertiaryColor, isTertiaryDark ? 75 : -75));
    root.style.setProperty('--wl-message-ai-bg-end', this.adjustColor(tertiaryColor, isTertiaryDark ? 70 : -70));
    root.style.setProperty('--wl-message-ai-border', this.adjustColor(tertiaryColor, isTertiaryDark ? 50 : -50));
    root.style.setProperty('--wl-message-ai-accent', tertiaryColor);

    // Meta (timestamp) con opacidad adaptativa
    root.style.setProperty('--wl-message-meta', isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)');

    // 4. Tipografía
    this.applyTypography(config.typography);

    // 5. Tema (light/dark/auto)
    this.applyThemeMode(config.theme);

    // 6. Favicon
    if (config.branding.faviconUrl) {
      this.updateFavicon(config.branding.faviconUrl);
    }

    // 7. Título del documento
    if (config.branding.brandName) {
      document.title = config.branding.brandName;
    }
  }

  applyDefaults(): void {
    const defaults = this.getDefaultConfig();
    this._config.set(defaults);
    this.applyTheme(defaults);
  }

  private getDefaultConfig(): WhiteLabelConfig {
    return {
      siteId: '',
      companyId: '',
      ...WHITE_LABEL_DEFAULTS
    };
  }

  private applyTypography(typography: WhiteLabelTypography): void {
    const root = document.documentElement;

    if (typography.fontFamily === 'custom' && typography.customFontFiles?.length) {
      this.loadCustomFonts(typography.customFontFiles, typography.customFontName);
      root.style.setProperty('--wl-font-family', `'${typography.customFontName}', sans-serif`);
    } else {
      root.style.setProperty('--wl-font-family', `'${typography.fontFamily}', sans-serif`);
      this.loadGoogleFont(typography.fontFamily);
    }
  }

  /**
   * Aplica el modo de tema (light/dark/auto).
   *
   * El atributo [data-theme] activa automáticamente todas las variables CSS
   * definidas en styles.scss incluyendo:
   * - Superficies (--wl-color-surface-primary, secondary, tertiary, elevated, overlay)
   * - Textos (--wl-color-text-primary, secondary, tertiary, inverse, muted-2)
   * - Bordes (--wl-color-border-subtle, default, strong)
   * - Gradientes (--wl-gradient-primary, success, warning, info)
   * - Glows (--wl-glow-primary, success, warning, info)
   * - Charts (--wl-chart-track, primary, success, warning, info)
   * - Sombras (--wl-shadow-sm, md, lg, card)
   */
  private applyThemeMode(mode: ThemeMode): void {
    if (mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

      // Escuchar cambios en preferencia del sistema
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this._config()?.theme === 'auto') {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    } else {
      document.documentElement.setAttribute('data-theme', mode);
    }
  }

  private updateFavicon(url: string): void {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  private loadGoogleFont(fontFamily: string): void {
    const existingLink = document.querySelector(`link[data-font="${fontFamily}"]`);
    if (existingLink) return;

    const fontOption = FONT_FAMILY_OPTIONS.find(f => f.value === fontFamily);
    if (fontOption?.googleFontUrl) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontOption.googleFontUrl;
      link.setAttribute('data-font', fontFamily);
      document.head.appendChild(link);
    }
  }

  private loadCustomFonts(fonts: CustomFontFile[], fontName?: string): void {
    fonts.forEach(font => {
      const fontFace = new FontFace(
        fontName || 'CustomFont',
        `url(${font.url})`,
        { weight: font.weight, style: font.style }
      );

      fontFace.load().then(loadedFace => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document.fonts as any).add(loadedFace);
      }).catch(err => {
        console.warn('[ThemeService] Error cargando fuente:', font.name, err);
      });
    });
  }

  // === Funciones de utilidad para cálculo de colores ===

  /**
   * Convierte hex a RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Calcula luminosidad relativa (0-1)
   * Fórmula WCAG: https://www.w3.org/TR/WCAG20/#relativeluminancedef
   */
  private getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0.5;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
      const normalized = v / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Determina si un color es oscuro (luminosidad < 0.5)
   */
  private isDarkColor(hex: string): boolean {
    return this.getLuminance(hex) < 0.5;
  }

  /**
   * Aclara u oscurece un color por un porcentaje
   * @param hex Color en formato hexadecimal
   * @param percent Positivo para aclarar, negativo para oscurecer
   */
  private adjustColor(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const adjust = (value: number): number => {
      const adjusted = percent > 0
        ? value + (255 - value) * (percent / 100)  // Aclarar
        : value + value * (percent / 100);          // Oscurecer
      return Math.round(Math.min(255, Math.max(0, adjusted)));
    };

    const r = adjust(rgb.r);
    const g = adjust(rgb.g);
    const b = adjust(rgb.b);

    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  }
}
