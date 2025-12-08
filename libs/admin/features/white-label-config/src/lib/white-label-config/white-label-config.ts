import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, switchMap } from 'rxjs';
import {
  WhiteLabelService,
  WhiteLabelConfig,
  UpdateWhiteLabelConfigRequest,
  WHITE_LABEL_DEFAULTS,
  FONT_FAMILY_OPTIONS,
  THEME_OPTIONS,
  FontFamilyOption,
  ThemeMode,
  CustomFontFile,
  FontWeight,
  FontStyle
} from '@guiders-frontend/white-label-service';
import { VisitorsDataService } from '@guiders-frontend/visitors-data-service';
import { ThemeService } from '@guiders-frontend/theme-service';

@Component({
  selector: 'admin-white-label-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './white-label-config.html',
  styleUrl: './white-label-config.scss',
})
export class WhiteLabelConfigComponent implements OnInit, OnDestroy {
  private readonly whiteLabelService = inject(WhiteLabelService);
  private readonly visitorsDataService = inject(VisitorsDataService);
  private readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  // companyId obtenido dinamicamente desde la empresa del usuario
  private readonly companyId = signal<string>('');

  // Estado del componente
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Configuracion
  readonly config = signal<WhiteLabelConfig | null>(null);

  // === VALORES DEL FORMULARIO ===

  // Colores
  readonly colorPrimary = signal<string>(WHITE_LABEL_DEFAULTS.colors.primary);
  readonly colorSecondary = signal<string>(WHITE_LABEL_DEFAULTS.colors.secondary);
  readonly colorTertiary = signal<string>(WHITE_LABEL_DEFAULTS.colors.tertiary);
  readonly colorBackground = signal<string>(WHITE_LABEL_DEFAULTS.colors.background);
  readonly colorSurface = signal<string>(WHITE_LABEL_DEFAULTS.colors.surface);
  readonly colorText = signal<string>(WHITE_LABEL_DEFAULTS.colors.text);
  readonly colorTextMuted = signal<string>(WHITE_LABEL_DEFAULTS.colors.textMuted);

  // Branding
  readonly brandName = signal<string>(WHITE_LABEL_DEFAULTS.branding.brandName);
  readonly logoUrl = signal<string | null>(null);
  readonly faviconUrl = signal<string | null>(null);

  // Tipografia
  readonly fontFamily = signal<FontFamilyOption>(WHITE_LABEL_DEFAULTS.typography.fontFamily);
  readonly customFontUrl = signal<string>('');
  readonly customFontName = signal<string>('');
  readonly customFontFiles = signal<CustomFontFile[]>([]);

  // Tema
  readonly theme = signal<ThemeMode>(WHITE_LABEL_DEFAULTS.theme);

  // Upload state
  readonly uploadingLogo = signal<boolean>(false);
  readonly uploadingFavicon = signal<boolean>(false);
  readonly uploadingFont = signal<boolean>(false);
  readonly logoPreview = signal<string | null>(null);
  readonly faviconPreview = signal<string | null>(null);

  // Opciones para selects
  readonly fontFamilyOptions = FONT_FAMILY_OPTIONS;
  readonly themeOptions = THEME_OPTIONS;

  // Computed
  readonly showCustomFontInput = computed(() => this.fontFamily() === 'custom');

  // Verificar si hay cambios pendientes
  readonly hasChanges = computed(() => {
    const current = this.config();
    if (!current) return false;

    const fontFilesChanged = JSON.stringify(current.typography.customFontFiles || []) !==
                             JSON.stringify(this.customFontFiles());

    return (
      current.colors.primary !== this.colorPrimary() ||
      current.colors.secondary !== this.colorSecondary() ||
      current.colors.tertiary !== this.colorTertiary() ||
      current.colors.background !== this.colorBackground() ||
      current.colors.surface !== this.colorSurface() ||
      current.colors.text !== this.colorText() ||
      current.colors.textMuted !== this.colorTextMuted() ||
      current.branding.brandName !== this.brandName() ||
      current.branding.logoUrl !== this.logoUrl() ||
      current.branding.faviconUrl !== this.faviconUrl() ||
      current.typography.fontFamily !== this.fontFamily() ||
      (current.typography.customFontUrl || '') !== this.customFontUrl() ||
      (current.typography.customFontName || '') !== this.customFontName() ||
      fontFilesChanged ||
      current.theme !== this.theme()
    );
  });

  ngOnInit(): void {
    this.loadConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadConfig(): void {
    this.loading.set(true);
    this.error.set(null);

    this.visitorsDataService.getCompanySites()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(companySites => {
          const companyId = companySites.companyId;
          this.companyId.set(companyId);
          console.log('[WhiteLabelConfig] CompanyId obtenido:', companyId);
          return this.whiteLabelService.getConfig(companyId);
        })
      )
      .subscribe({
        next: (config) => {
          this.config.set(config);
          this.syncFormWithConfig(config);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando configuracion:', err);
          this.error.set('Error al cargar la configuracion');
          this.loading.set(false);
        }
      });
  }

  private syncFormWithConfig(config: WhiteLabelConfig): void {
    // Colores
    this.colorPrimary.set(config.colors.primary);
    this.colorSecondary.set(config.colors.secondary);
    this.colorTertiary.set(config.colors.tertiary);
    this.colorBackground.set(config.colors.background);
    this.colorSurface.set(config.colors.surface);
    this.colorText.set(config.colors.text);
    this.colorTextMuted.set(config.colors.textMuted);

    // Branding
    this.brandName.set(config.branding.brandName);
    this.logoUrl.set(config.branding.logoUrl);
    this.faviconUrl.set(config.branding.faviconUrl);

    // Tipografia
    this.fontFamily.set(config.typography.fontFamily);
    this.customFontUrl.set(config.typography.customFontUrl || '');
    this.customFontName.set(config.typography.customFontName || '');
    this.customFontFiles.set(config.typography.customFontFiles || []);

    // Tema
    this.theme.set(config.theme);

    // Limpiar previews
    this.logoPreview.set(null);
    this.faviconPreview.set(null);
  }

  // === HANDLERS DE COLORES ===

  onColorPrimaryChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.colorPrimary.set(value);
  }

  onColorSecondaryChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.colorSecondary.set(value);
  }

  onColorTertiaryChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.colorTertiary.set(value);
  }

  onColorBackgroundChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.colorBackground.set(value);
  }

  onColorSurfaceChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.colorSurface.set(value);
  }

  onColorTextChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.colorText.set(value);
  }

  onColorTextMutedChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.colorTextMuted.set(value);
  }

  // === HANDLERS DE BRANDING ===

  onBrandNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.brandName.set(value);
  }

  onLogoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    this.uploadingLogo.set(true);
    this.whiteLabelService.uploadLogo(this.companyId(), file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.logoUrl.set(response.url);
          this.logoPreview.set(null);
          this.uploadingLogo.set(false);
          this.successMessage.set('Logo subido correctamente');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Error subiendo logo:', err);
          this.error.set(err.message || 'Error al subir el logo');
          this.logoPreview.set(null);
          this.uploadingLogo.set(false);
        }
      });
  }

  onFaviconFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      this.faviconPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    this.uploadingFavicon.set(true);
    this.whiteLabelService.uploadFavicon(this.companyId(), file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.faviconUrl.set(response.url);
          this.faviconPreview.set(null);
          this.uploadingFavicon.set(false);
          this.successMessage.set('Favicon subido correctamente');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Error subiendo favicon:', err);
          this.error.set(err.message || 'Error al subir el favicon');
          this.faviconPreview.set(null);
          this.uploadingFavicon.set(false);
        }
      });
  }

  onRemoveLogo(): void {
    this.whiteLabelService.deleteLogo(this.companyId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.logoUrl.set(null);
          this.logoPreview.set(null);
          this.successMessage.set('Logo eliminado');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Error eliminando logo:', err);
          this.error.set('Error al eliminar el logo');
        }
      });
  }

  onRemoveFavicon(): void {
    this.whiteLabelService.deleteFavicon(this.companyId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.faviconUrl.set(null);
          this.faviconPreview.set(null);
          this.successMessage.set('Favicon eliminado');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Error eliminando favicon:', err);
          this.error.set('Error al eliminar el favicon');
        }
      });
  }

  // === HANDLERS DE TIPOGRAFIA ===

  onFontFamilyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as FontFamilyOption;
    this.fontFamily.set(value);
    if (value !== 'custom') {
      this.customFontUrl.set('');
      this.customFontName.set('');
    }
  }

  onCustomFontUrlChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customFontUrl.set(value);
  }

  onCustomFontNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customFontName.set(value);
  }

  onFontFilesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    this.uploadingFont.set(true);
    const uploadPromises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadPromises.push(this.uploadSingleFont(file));
    }

    Promise.all(uploadPromises)
      .then(() => {
        this.uploadingFont.set(false);
        this.successMessage.set(`${files.length} fuente(s) subida(s) correctamente`);
        setTimeout(() => this.successMessage.set(null), 3000);
      })
      .catch((err) => {
        this.uploadingFont.set(false);
        this.error.set(err.message || 'Error al subir las fuentes');
      });

    // Reset input
    (event.target as HTMLInputElement).value = '';
  }

  private uploadSingleFont(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      this.whiteLabelService.uploadFont(this.companyId(), file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const fontInfo = this.parseFontInfo(file.name);
            const newFont: CustomFontFile = {
              name: response.fileName || file.name,
              url: response.url,
              weight: fontInfo.weight,
              style: fontInfo.style
            };
            this.customFontFiles.update(fonts => [...fonts, newFont]);
            resolve();
          },
          error: (err) => {
            reject(err);
          }
        });
    });
  }

  private parseFontInfo(fileName: string): { weight: FontWeight; style: FontStyle } {
    const lowerName = fileName.toLowerCase();

    // Detectar estilo
    const style: FontStyle = lowerName.includes('italic') ? 'italic' : 'normal';

    // Detectar peso
    let weight: FontWeight = '400';
    if (lowerName.includes('thin') || lowerName.includes('hairline')) weight = '100';
    else if (lowerName.includes('extralight') || lowerName.includes('ultralight')) weight = '200';
    else if (lowerName.includes('light')) weight = '300';
    else if (lowerName.includes('regular') || lowerName.includes('normal')) weight = '400';
    else if (lowerName.includes('medium')) weight = '500';
    else if (lowerName.includes('semibold') || lowerName.includes('demibold')) weight = '600';
    else if (lowerName.includes('extrabold') || lowerName.includes('ultrabold')) weight = '800';
    else if (lowerName.includes('bold')) weight = '700';
    else if (lowerName.includes('black') || lowerName.includes('heavy')) weight = '900';

    return { weight, style };
  }

  getFontWeightLabel(weight: FontWeight): string {
    const labels: Record<FontWeight, string> = {
      '100': 'Thin',
      '200': 'Extra Light',
      '300': 'Light',
      '400': 'Regular',
      '500': 'Medium',
      '600': 'Semi Bold',
      '700': 'Bold',
      '800': 'Extra Bold',
      '900': 'Black'
    };
    return labels[weight] || weight;
  }

  onRemoveFont(font: CustomFontFile): void {
    this.whiteLabelService.deleteFont(this.companyId(), font.name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.customFontFiles.update(fonts => fonts.filter(f => f.name !== font.name));
          this.successMessage.set('Fuente eliminada');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Error eliminando fuente:', err);
          this.error.set('Error al eliminar la fuente');
        }
      });
  }

  onRemoveAllFonts(): void {
    if (!confirm('¿Estas seguro de eliminar todas las fuentes personalizadas?')) {
      return;
    }

    this.whiteLabelService.deleteAllFonts(this.companyId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.customFontFiles.set([]);
          this.successMessage.set('Todas las fuentes eliminadas');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Error eliminando fuentes:', err);
          this.error.set('Error al eliminar las fuentes');
        }
      });
  }

  // === HANDLERS DE TEMA ===

  onThemeChange(theme: ThemeMode): void {
    this.theme.set(theme);
  }

  // === ACCIONES ===

  onCancel(): void {
    const current = this.config();
    if (current) {
      this.syncFormWithConfig(current);
    }
    this.successMessage.set(null);
    this.error.set(null);
  }

  onSave(): void {
    if (!this.hasChanges()) return;

    this.saving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const updates: UpdateWhiteLabelConfigRequest = {
      colors: {
        primary: this.colorPrimary(),
        secondary: this.colorSecondary(),
        tertiary: this.colorTertiary(),
        background: this.colorBackground(),
        surface: this.colorSurface(),
        text: this.colorText(),
        textMuted: this.colorTextMuted()
      },
      branding: {
        brandName: this.brandName(),
        logoUrl: this.logoUrl(),
        faviconUrl: this.faviconUrl()
      },
      typography: {
        fontFamily: this.fontFamily(),
        customFontUrl: this.customFontUrl().trim() || undefined,
        customFontName: this.customFontName().trim() || undefined,
        customFontFiles: this.customFontFiles().length > 0 ? this.customFontFiles() : undefined
      },
      theme: this.theme()
    };

    this.whiteLabelService.updateConfig(this.companyId(), updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.config.set(config);
          this.saving.set(false);
          this.successMessage.set('Configuracion guardada correctamente');
          setTimeout(() => this.successMessage.set(null), 3000);

          // Aplicar el tema inmediatamente para actualizar el branding del sidebar
          this.themeService.applyTheme(config);
        },
        error: (err) => {
          console.error('Error guardando configuracion:', err);
          this.error.set('Error al guardar la configuracion');
          this.saving.set(false);
        }
      });
  }

  onResetToDefaults(): void {
    if (!confirm('¿Estas seguro de restablecer la configuracion a los valores por defecto?')) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.whiteLabelService.deleteConfig(this.companyId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadConfig();
          this.successMessage.set('Configuracion restablecida');
          setTimeout(() => this.successMessage.set(null), 3000);

          // Aplicar defaults al tema
          this.themeService.applyDefaults();
        },
        error: (err) => {
          console.error('Error restableciendo configuracion:', err);
          this.error.set('Error al restablecer la configuracion');
          this.saving.set(false);
        }
      });
  }

  // === EXPORT / IMPORT ===

  onExportConfig(): void {
    const config = {
      colors: {
        primary: this.colorPrimary(),
        secondary: this.colorSecondary(),
        tertiary: this.colorTertiary(),
        background: this.colorBackground(),
        surface: this.colorSurface(),
        text: this.colorText(),
        textMuted: this.colorTextMuted()
      },
      branding: {
        brandName: this.brandName(),
        logoUrl: this.logoUrl(),
        faviconUrl: this.faviconUrl()
      },
      typography: {
        fontFamily: this.fontFamily(),
        customFontUrl: this.customFontUrl() || undefined
      },
      theme: this.theme()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `white-label-config-${this.companyId()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.successMessage.set('Configuracion exportada');
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  onImportConfig(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        this.applyImportedConfig(config);
        this.successMessage.set('Configuracion importada correctamente');
        setTimeout(() => this.successMessage.set(null), 3000);
      } catch (err) {
        this.error.set('Error al importar: archivo JSON invalido');
      }
    };
    reader.readAsText(file);

    // Reset input
    (event.target as HTMLInputElement).value = '';
  }

  private applyImportedConfig(config: any): void {
    if (config.colors) {
      if (config.colors.primary) this.colorPrimary.set(config.colors.primary);
      if (config.colors.secondary) this.colorSecondary.set(config.colors.secondary);
      if (config.colors.tertiary) this.colorTertiary.set(config.colors.tertiary);
      if (config.colors.background) this.colorBackground.set(config.colors.background);
      if (config.colors.surface) this.colorSurface.set(config.colors.surface);
      if (config.colors.text) this.colorText.set(config.colors.text);
      if (config.colors.textMuted) this.colorTextMuted.set(config.colors.textMuted);
    }
    if (config.branding) {
      if (config.branding.brandName) this.brandName.set(config.branding.brandName);
    }
    if (config.typography) {
      if (config.typography.fontFamily) this.fontFamily.set(config.typography.fontFamily);
      if (config.typography.customFontUrl) this.customFontUrl.set(config.typography.customFontUrl);
    }
    if (config.theme) {
      this.theme.set(config.theme);
    }
  }
}
