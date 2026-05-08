import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import {
  ThemeService,
  THEME_OPTIONS,
  type NamedTheme,
} from '@guiders-frontend/shared/data-access/theme';

/**
 * ThemeSwitcher component — visual picker for the 4 named dark themes.
 *
 * Usage:
 *   <guiders-theme-switcher />
 *
 * Displays a compact row of colour swatches; clicking a swatch activates
 * that theme. The active theme is highlighted. An optional dropdown mode
 * shows theme names alongside swatches for larger viewport usage.
 */
@Component({
  selector: 'guiders-theme-switcher',
  standalone: true,
  imports: [NgClass, NgFor, NgIf],
  templateUrl: './theme-switcher.html',
  styleUrl: './theme-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitcher {
  private readonly themeService = inject(ThemeService);

  readonly themes = THEME_OPTIONS;
  readonly currentTheme = this.themeService.theme;

  /** Controls expanded/collapsed dropdown mode */
  readonly isExpanded = signal(false);

  readonly containerClasses = computed(() => ({
    'theme-switcher': true,
    'theme-switcher--expanded': this.isExpanded(),
  }));

  selectTheme(theme: NamedTheme): void {
    this.themeService.setTheme(theme);
    this.isExpanded.set(false);
  }

  toggleExpanded(): void {
    this.isExpanded.update((v) => !v);
  }

  isActive(themeId: NamedTheme): boolean {
    return this.currentTheme() === themeId;
  }
}
