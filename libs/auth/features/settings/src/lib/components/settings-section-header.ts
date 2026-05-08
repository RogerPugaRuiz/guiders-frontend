import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'lib-settings-section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="section-header">
      <h2 class="section-header__title">{{ title() }}</h2>
      @if (description()) {
        <p class="section-header__description">{{ description() }}</p>
      }
    </header>
  `,
  styleUrl: './settings-section-header.scss',
})
export class SettingsSectionHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
