import {
  Injectable,
  signal,
  computed,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export type SidebarTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'guiders-sidebar-theme';
const DEFAULT_THEME: SidebarTheme = 'dark';

/**
 * Service for managing app-wide theme persistence in localStorage.
 * Applies theme class to document.body for global CSS inheritance.
 * Loads the saved theme before app initialization to prevent flash of wrong theme.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Internal signal for theme state
  private readonly _theme = signal<SidebarTheme>(this.loadThemeFromStorage());

  // Public readonly signal
  readonly theme = this._theme.asReadonly();

  // Computed for convenience
  readonly isDarkTheme = computed(() => this._theme() === 'dark');
  readonly isLightTheme = computed(() => this._theme() === 'light');

  constructor() {
    // Apply initial theme class to body
    this.applyThemeClass(this._theme());
  }

  /**
   * Load theme from localStorage synchronously.
   * Called during service construction to ensure theme is available immediately.
   */
  private loadThemeFromStorage(): SidebarTheme {
    if (!this.isBrowser) {
      return DEFAULT_THEME;
    }

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (error) {
      console.warn(
        'ThemeService: Failed to load theme from localStorage',
        error
      );
    }

    return DEFAULT_THEME;
  }

  /**
   * Set the theme and persist to localStorage.
   */
  setTheme(theme: SidebarTheme): void {
    this._theme.set(theme);
    this.saveThemeToStorage(theme);
    this.applyThemeClass(theme);
  }

  /**
   * Toggle between light and dark themes.
   */
  toggleTheme(): SidebarTheme {
    const newTheme = this._theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Apply theme class to document.body for global CSS inheritance.
   * Removes previous theme class and adds the new one.
   */
  private applyThemeClass(theme: SidebarTheme): void {
    if (!this.isBrowser) {
      return;
    }

    const body = this.document.body;
    if (!body) {
      return;
    }

    // Remove existing theme classes
    body.classList.remove('theme-dark', 'theme-light');
    // Add new theme class
    body.classList.add(`theme-${theme}`);
  }

  /**
   * Save theme to localStorage.
   */
  private saveThemeToStorage(theme: SidebarTheme): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('ThemeService: Failed to save theme to localStorage', error);
    }
  }
}
