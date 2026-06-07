import { Component, input, output } from '@angular/core';

@Component({
  selector: 'guiders-header-slot',
  standalone: true,
  host: {
    role: 'banner',
    'aria-label': 'Encabezado de la aplicación',
    '[class.header-slot--leadcars]': "variant() === 'leadcars'",
    '[class.header-slot--default]': "variant() === 'default'",
  },
  template: `
    @if (showBackButton()) {
      <button
        class="header-slot__back-btn"
        (click)="backClick.emit()"
        aria-label="Volver"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    }
    <ng-content select="[header-content]"></ng-content>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      height: 64px;
      padding: 0 16px;
    }

    :host(.header-slot--default) {
      background: var(--color-surface-primary);
      border-bottom: 1px solid var(--color-border);
    }

    :host(.header-slot--leadcars) {
      background: transparent;
      border-bottom: none;
    }

    .header-slot__back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-right: 8px;
      padding: 0;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .header-slot__back-btn:hover {
      background: var(--color-interactive-hover);
    }

    .header-slot__back-btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  `],
})
export class HeaderSlotComponent {
  readonly variant = input<'default' | 'leadcars'>('default');
  readonly showBackButton = input<boolean>(false);
  readonly backClick = output<void>();
}