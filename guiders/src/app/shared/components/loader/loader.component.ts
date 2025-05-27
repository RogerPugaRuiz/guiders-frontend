import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="app-loader-overlay" 
      [class.visible]="isVisible"
      [class.transparent]="transparent"
      *ngIf="isVisible || forceShow">
      
      <div class="app-loader-container">
        
        <!-- Logo dinámico -->
        <div class="app-loader-logo" [class.pulse]="shouldPulse">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="appLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" [attr.style]="'stop-color:' + primaryColor + ';stop-opacity:1'" />
                <stop offset="100%" [attr.style]="'stop-color:' + secondaryColor + ';stop-opacity:1'" />
              </linearGradient>
            </defs>
            
            <circle cx="60" cy="60" r="55" fill="url(#appLogoGradient)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
            
            <!-- Ícono de compass/guía -->
            <g transform="translate(60,60)">
              <circle r="30" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2"/>
              <circle r="20" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>
              
              <!-- Puntos cardinales -->
              <path d="M0,-25 L6,-18 L0,-16 L-6,-18 Z" fill="rgba(255,255,255,0.9)"/>
              <path d="M25,0 L18,6 L16,0 L18,-6 Z" fill="rgba(255,255,255,0.7)"/>
              <path d="M0,25 L6,18 L0,16 L-6,18 Z" fill="rgba(255,255,255,0.7)"/>
              <path d="M-25,0 L-18,6 L-16,0 L-18,-6 Z" fill="rgba(255,255,255,0.7)"/>
              
              <!-- Centro -->
              <circle r="5" fill="rgba(255,255,255,1)"/>
              <circle r="2" [attr.fill]="primaryColor"/>
            </g>
          </svg>
        </div>

        <!-- Spinner -->
        <div class="app-loader-spinner" [style.border-top-color]="primaryColor"></div>

        <!-- Textos -->
        <div class="app-loader-text">{{ mainText }}</div>
        <div class="app-loader-subtext" *ngIf="subText">{{ subText }}</div>

        <!-- Barra de progreso opcional -->
        <div class="app-loader-progress" *ngIf="showProgress">
          <div class="app-loader-progress-bar" 
               [style.width.%]="progressValue"
               [style.background]="'linear-gradient(90deg, ' + primaryColor + ', ' + secondaryColor + ')'">
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .app-loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    }

    .app-loader-overlay.visible {
      opacity: 1;
    }

    .app-loader-overlay.transparent {
      background: rgba(0, 0, 0, 0.3);
    }

    .app-loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 2rem;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      min-width: 300px;
    }

    .app-loader-logo {
      width: 80px;
      height: 80px;
      margin-bottom: 1.5rem;
      animation: float 3s ease-in-out infinite;
      transition: transform 0.3s ease;
    }

    .app-loader-logo.pulse {
      animation: float 3s ease-in-out infinite, pulse 1s ease-in-out;
    }

    .app-loader-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1.5rem;
    }

    .app-loader-text {
      font-size: 1.125rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 0.5rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .app-loader-subtext {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 1.5rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .app-loader-progress {
      width: 200px;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      overflow: hidden;
    }

    .app-loader-progress-bar {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes float {
      0%, 100% { 
        transform: translateY(0px);
        opacity: 0.9;
      }
      50% { 
        transform: translateY(-8px);
        opacity: 1;
      }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    @media (max-width: 480px) {
      .app-loader-container {
        min-width: 280px;
        padding: 1.5rem;
      }
      
      .app-loader-logo {
        width: 60px;
        height: 60px;
        margin-bottom: 1rem;
      }
      
      .app-loader-progress {
        width: 160px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoaderComponent implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Input() forceShow = false;
  @Input() transparent = false;
  @Input() mainText = 'Cargando...';
  @Input() subText = '';
  @Input() showProgress = false;
  @Input() progressValue = 0;
  @Input() primaryColor = '#667eea';
  @Input() secondaryColor = '#764ba2';
  @Input() shouldPulse = false;

  private destroy$ = new Subject<void>();

  constructor(private loaderService: LoaderService) {}

  ngOnInit(): void {
    // Suscribirse al estado global del loader si es necesario
    this.loaderService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        // Lógica adicional si es necesario
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Activa la animación de pulso manualmente
   */
  public pulse(): void {
    this.shouldPulse = true;
    setTimeout(() => {
      this.shouldPulse = false;
    }, 1000);
  }
}
