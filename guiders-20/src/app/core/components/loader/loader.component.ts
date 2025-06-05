import { Component, input, signal, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-container" [class.fullscreen]="fullscreen()">
      <div class="loader-content">
        <div class="circular-loader" 
             [class.phase-transition]="isTransitioning()" 
             [class.phase-pills]="currentPhase() === 'pills'">
          <div class="dots-container" [class.stopped]="isTransitioning() || currentPhase() === 'pills'">
            @for (dot of dots; track $index) {
              <div class="dot" 
                   [class.dot-circle]="currentPhase() === 'circles'"
                   [class.dot-pill]="currentPhase() === 'pills'"
                   [class.expanding]="isTransitioning()"
                   [style.transform]="'rotate(' + dot.angle + 'deg) translateY(-40px) rotate(' + (-dot.angle) + 'deg)'"></div>
            }
          </div>
        </div>
        @if (message()) {
          <p class="loader-message">{{ message() }}</p>
        }
      </div>
    </div>
  `,
  styleUrl: './loader.component.scss'
})
export class LoaderComponent implements OnInit, OnDestroy {
  // Inputs usando la nueva API de signals
  message = input<string>('Cargando...');
  variant = input<'circle' | 'dots' | 'pulse'>('circle');
  fullscreen = input<boolean>(true);

  // Signals para manejar las fases
  currentPhase = signal<'circles' | 'pills'>('circles');
  isTransitioning = signal(false);

  // Array de puntos para la animación circular
  dots = Array.from({ length: 8 }, (_, i) => ({
    angle: i * 45 // 360 / 8 = 45 grados entre cada punto
  }));

  private phaseTimer?: number;
  private transitionTimer?: number;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Solo iniciar animaciones en el navegador
    if (this.isBrowser) {
      // Iniciar el ciclo de fases después de 3 segundos
      this.phaseTimer = window.setTimeout(() => {
        this.startTransition();
      }, 3000);
    }
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      if (this.phaseTimer) {
        clearTimeout(this.phaseTimer);
      }
      if (this.transitionTimer) {
        clearTimeout(this.transitionTimer);
      }
    }
  }

  private startTransition() {
    if (!this.isBrowser) return;
    
    // Iniciar transición
    this.isTransitioning.set(true);
    
    // Después de 800ms (duración de la animación de expansión), cambiar a píldoras
    this.transitionTimer = window.setTimeout(() => {
      this.currentPhase.set('pills');
      this.isTransitioning.set(false);
      
      // Después de 3 segundos como píldoras, volver a círculos
      this.phaseTimer = window.setTimeout(() => {
        this.currentPhase.set('circles');
        // Reiniciar el ciclo
        this.phaseTimer = window.setTimeout(() => {
          this.startTransition();
        }, 3000);
      }, 3000);
    }, 800);
  }
}
