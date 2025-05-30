import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-settings-placeholder',
	standalone: true,
	imports: [CommonModule],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	template: `
    <div class="settings-placeholder">
      <h2>{{ title }} (en desarrollo)</h2>
      <p>Esta sección está actualmente en desarrollo. Pronto estará disponible.</p>
      <div class="settings-placeholder__image">
			<animated-icons
				src="https://animatedicons.co/get-icon?name=Minecraft&style=minimalistic&token=e1134e0f-af6b-4a81-894b-9708d1f0d153"
				loop="true"
				autoplay="true"
				attributes='{"variationThumbColour":"#FFFFFF","variationName":"Normal","variationNumber":1,"numberOfGroups":1,"backgroundIsGroup":false,"strokeWidth":1,"defaultColours":{"group-1":"#000000","background":"#FFFFFF"}}'
				height="200"
				width="200"
			></animated-icons>
      </div>
    </div>
  `,
	styles: [`
    .settings-placeholder {
      max-width: 800px;
      padding: var(--spacing-xl);
      background-color: var(--color-hover);
      border-radius: var(--border-radius);
      
      h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--spacing-md);
      }
      
      p {
        margin-bottom: var(--spacing-xl);
      }
      
      &__image {
        display: flex;
        justify-content: center;
        margin: var(--spacing-xl) 0;
        color: var(--color-text-light);
      }
    }
  `]
})
export class SettingsPlaceholderComponent {
	title = '';

	constructor(private route: ActivatedRoute) {
		this.route.url.pipe(
			map(segments => segments[0]?.path)
		).subscribe(path => {
			switch (path) {
				case 'profile':
					this.title = 'Perfil';
					break;
				case 'account':
					this.title = 'Cuenta';
					break;
				case 'notifications':
					this.title = 'Notificaciones';
					break;
				case 'privacy':
					this.title = 'Privacidad';
					break;
				default:
					this.title = 'Configuración';
			}
		});
	}
}
