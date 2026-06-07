import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import type { ThemeConfig } from './theme.types';
import { buildCssVariableMap, sanitizeCss } from './theme.utils';
import { THEME_CONFIG_TOKEN } from './theme.token';

/**
 * The style-element attribute we use to identify theme-injected `<style>`
 * nodes. Used by `removeFromDom` to clean up on theme swap or teardown.
 */
const THEME_STYLE_ATTR = 'data-guiders-theme';

/**
 * White-label iframe theme service.
 *
 * Responsibilities:
 *   1. Hold the active theme as a signal so any component can react
 *      (`theme()`).
 *   2. Apply a theme to the DOM (CSS custom properties + sanitized
 *      custom CSS in a `<style>` element).
 *   3. Remove a previously-applied theme cleanly when cleared or
 *      replaced (no leaked style elements, no leftover CSS vars).
 *   4. Optionally seed from `THEME_CONFIG_TOKEN` for test harnesses,
 *      Storybook, and admin preview (story 8-12).
 *
 * Explicit non-responsibilities (out of scope for this service):
 *   - **NO localStorage persistence** — the architecture doc
 *     (§ 2.1 "Theme persistence") mandates that the iframe always
 *     reads its theme from `/api/v1/iframe/init`. The existing
 *     `ThemeService` in `libs/shared/data-access/theme/` handles
 *     persistence for the non-embedded default mode; that is a
 *     separate service, not a fallback.
 *   - **NO HTTP calls** — the `IframeInitService` (story 8-5) is
 *     responsible for fetching the theme and calling `setTheme()`.
 *   - **NO sanitization config beyond the architecture rules** —
 *     the sanitize-css style policy lives in `theme.utils`.
 *
 * The service is `providedIn: 'root'` so a single instance is shared
 * across the app. Multi-tenant safety is guaranteed by the caller's
 * lifecycle (a fresh iframe load = a fresh root injector), not by
 * internal tenant tracking.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Optional seed theme. When provided (e.g. test, Storybook, admin
   * preview), the signal is initialized from this value and the theme
   * is applied to the DOM at construction time.
   */
  private readonly seedTheme = inject(THEME_CONFIG_TOKEN, { optional: true });

  private readonly _theme = signal<ThemeConfig | null>(this.seedTheme ?? null);

  /** Read-only signal of the currently active theme, or `null`. */
  readonly theme: Signal<ThemeConfig | null> = this._theme.asReadonly();

  constructor() {
    if (this._theme() && this.isBrowser) {
      this.applyToDom(this._theme() as ThemeConfig);
    }
  }

  /**
   * Set the active theme and apply it to the DOM.
   * Replaces any previously-applied theme.
   *
   * Defensive: returns early on falsy input (null/undefined). TS types
   * are stripped at runtime, so a `(service as any).setTheme(null)`
   * call would otherwise leave the signal in an inconsistent state.
   */
  setTheme(theme: ThemeConfig): void {
    if (!theme || typeof theme !== 'object') {
      return;
    }
    this._theme.set(theme);
    this.applyToDom(theme);
  }

  /**
   * Clear the active theme and remove its DOM effects.
   * Safe to call when no theme is applied (no-op).
   */
  clearTheme(): void {
    this._theme.set(null);
    this.removeFromDom();
  }

  /**
   * Synchronous getter — equivalent to reading the signal once.
   * Provided for consumers that prefer a method over `()`.
   */
  getCurrentTheme(): ThemeConfig | null {
    return this._theme();
  }

  /**
   * Write the theme's CSS custom properties to `document.documentElement`
   * and inject the sanitized `customCss` as a `<style>` element.
   *
   * Idempotent: removes any previously-injected theme style elements
   * before re-applying, so calling twice with the same theme does not
   * produce duplicate `<style>` nodes.
   *
   * SSR-safe: returns immediately when not in a browser platform.
   * DOM-safe: returns immediately if `document.head` or
   * `document.documentElement` is null (workers, sandbox iframes).
   *
   * Atomicity: the body is wrapped in try/catch. If any DOM operation
   * throws (e.g. an exotic `setProperty` value, or `document.head`
   * being detached mid-call), the error is logged and the signal is
   * rolled back to its prior value, leaving the DOM and the signal
   * consistent.
   */
  applyToDom(theme: ThemeConfig): void {
    if (!this.isBrowser) {
      return;
    }
    if (!this.document.head || !this.document.documentElement) {
      return;
    }

    const previousTheme = this._theme();
    this._theme.set(theme);

    try {
      this.removeFromDom();
      const root = this.document.documentElement;
      const vars = buildCssVariableMap(theme);
      for (const [k, v] of Object.entries(vars)) {
        root.style.setProperty(k, v);
      }
      const sanitized = sanitizeCss(theme.customCss);
      if (sanitized) {
        const styleEl = this.document.createElement('style');
        styleEl.setAttribute(THEME_STYLE_ATTR, theme.id);
        styleEl.textContent = sanitized;
        this.document.head.appendChild(styleEl);
      }
    } catch (error) {
      // Roll back the signal and re-attempt cleanup so the DOM
      // doesn't stay in a half-applied state. The next setTheme
      // call will re-apply cleanly.
      console.warn('ThemeService: failed to apply theme to DOM', error);
      this._theme.set(previousTheme);
      try {
        this.removeFromDom();
      } catch {
        // Best-effort; ignore secondary errors.
      }
    }
  }

  /**
   * Remove all `--guiders-*` CSS custom properties from
   * `document.documentElement` and detach every
   * `<style data-guiders-theme="...">` element from `<head>`.
   *
   * Safe to call when nothing is applied (no-op).
   */
  removeFromDom(): void {
    if (!this.isBrowser) {
      return;
    }
    if (!this.document.head || !this.document.documentElement) {
      return;
    }
    const root = this.document.documentElement;
    // We always strip a fixed set of known vars (matches the 13 keys
    // produced by `buildCssVariableMap`). We do NOT iterate over the
    // current theme here, because `removeFromDom` is also called when
    // the signal is already null (clear/seed-failure paths), and we
    // want a deterministic cleanup that doesn't depend on theme state.
    const knownKeys = [
      '--guiders-color-primary',
      '--guiders-color-secondary',
      '--guiders-color-accent',
      '--guiders-color-text-primary',
      '--guiders-color-text-secondary',
      '--guiders-color-background',
      '--guiders-color-surface',
      '--guiders-color-error',
      '--guiders-color-success',
      '--guiders-font-family',
      '--guiders-font-size-base',
      '--guiders-font-weight-heading',
      '--guiders-logo-header-height',
    ];
    for (const k of knownKeys) {
      root.style.removeProperty(k);
    }
    const existing = this.document.head.querySelectorAll(
      `style[${THEME_STYLE_ATTR}]`,
    );
    existing.forEach(el => el.remove());
  }
}
