import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-settings-row',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="settings-row" [class.settings-row--stacked]="stacked()">
      <div class="settings-row__label">
        <p class="settings-row__title">{{ label() }}</p>
        @if (description()) {
          <p class="settings-row__description">{{ description() }}</p>
        }
      </div>
      <div class="settings-row__control">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: './settings-row.scss',
})
export class SettingsRowComponent {
  readonly label = input.required<string>();
  readonly description = input<string>('');
  /** Stack control under label (full width) instead of side-by-side */
  readonly stacked = input<boolean>(false);
}
