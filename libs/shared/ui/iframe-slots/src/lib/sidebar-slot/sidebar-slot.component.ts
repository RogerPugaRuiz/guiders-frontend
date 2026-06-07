import { Component, input } from '@angular/core';

@Component({
  selector: 'guiders-sidebar-slot',
  standalone: true,
  host: {
    role: 'complementary',
    'aria-label': 'Navegación principal',
    '[class.sidebar-slot--icon-only]': "variant() === 'icon-only'",
    '[class.sidebar-slot--default]': "variant() === 'default'",
  },
  template: `
    <ng-content select="[sidebar-content]"></ng-content>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    :host(.sidebar-slot--icon-only) {
      width: 64px;
    }

    :host(.sidebar-slot--default) {
      width: 280px;
    }
  `],
})
export class SidebarSlotComponent {
  readonly variant = input<'default' | 'icon-only'>('default');
  readonly collapsed = input<boolean>(false);
}