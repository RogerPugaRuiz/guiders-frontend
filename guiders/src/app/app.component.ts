import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { LoaderService } from './core/services/loader.service';
import { isPlatformBrowser } from '@angular/common';
import { TokenRefreshService } from './core/services/token-refresh.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Guiders';
  
  constructor(
    private themeService: ThemeService,
    private loaderService: LoaderService,
    private tokenRefreshService: TokenRefreshService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // LOADER DESACTIVADO - No ejecutar lógica de ocultado
    // El loader ya está desactivado por defecto
    console.log('🚀 Aplicación iniciada sin loader');
  }
  
  ngOnInit(): void {
    // Asegurar que se inicialice el tema correctamente
    // y eliminar la clase que oculta la página mientras se carga el tema
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.remove('theme-initializing');
      
      // Inicializar el servicio de renovación de token basado en actividad del usuario
      this.tokenRefreshService.initialize();
    }
  }
}
