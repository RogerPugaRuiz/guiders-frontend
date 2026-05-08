import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsSectionHeaderComponent } from '../components/settings-section-header';

@Component({
  selector: 'lib-notifications-settings',
  standalone: true,
  imports: [SettingsSectionHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-settings-section-header
      title="Notificaciones"
      description="Próximamente: gestiona cómo recibes alertas">
    </lib-settings-section-header>
    <div class="empty">
      <p>Esta sección estará disponible pronto</p>
    </div>
  `,
  styles: [`
    .empty {
      padding: 48px 0;
      text-align: center;
      color: var(--color-text-tertiary);
      font-size: 13px;
    }
  `],
})
export class NotificationsSettingsComponent {}
