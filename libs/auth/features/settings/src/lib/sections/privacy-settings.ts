import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CommercialFingerprintService } from '@guiders-frontend/commercial-fingerprint-service';
import { SessionService } from '@guiders-frontend/auth/data-access/session';
import { ToastService } from '@guiders-frontend/shared/ui/toast';
import { SettingsRowComponent } from '../components/settings-row';
import { SettingsSectionHeaderComponent } from '../components/settings-section-header';

@Component({
  selector: 'lib-privacy-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, SettingsRowComponent, SettingsSectionHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-settings.html',
  styleUrl: './privacy-settings.scss',
})
export class PrivacySettingsComponent {
  private readonly commercialFingerprintService = inject(CommercialFingerprintService);
  private readonly sessionService = inject(SessionService);
  private readonly toast = inject(ToastService);

  readonly fingerprintInput = signal<string>('');
  readonly isRegistering = signal<boolean>(false);

  async onRegister(): Promise<void> {
    if (this.isRegistering()) return; // prevent concurrent submissions

    const fp = this.fingerprintInput().trim();
    if (!fp) {
      this.toast.error('Ingresa un fingerprint válido');
      return;
    }

    this.isRegistering.set(true);
    try {
      const user = await firstValueFrom(this.sessionService.ensureSession$());
      if (!user?.sub) {
        this.toast.error('No se pudo obtener tu sesión. Recarga la página.');
        return;
      }
      await firstValueFrom(this.commercialFingerprintService.registerFingerprint(user.sub, fp));
      this.fingerprintInput.set('');
      this.toast.success('Fingerprint registrado');
    } catch (error) {
      console.error('[PrivacySettings] register fingerprint error', error);
      this.toast.error('Error al registrar el fingerprint');
    } finally {
      this.isRegistering.set(false);
    }
  }
}

