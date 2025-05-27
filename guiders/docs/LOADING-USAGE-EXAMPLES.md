# Ejemplos de Uso del Sistema de Loading de Guiders

## 📖 Índice
1. [Loader Inicial (Gmail-style)](#loader-inicial)
2. [Loader de Componente](#loader-de-componente) 
3. [Loader con Progreso](#loader-con-progreso)
4. [Loader en Formularios](#loader-en-formularios)
5. [Loader en Navegación](#loader-en-navegación)
6. [Personalización Avanzada](#personalización-avanzada)

## 🚀 Loader Inicial (Gmail-style)

El loader inicial se ejecuta automáticamente al cargar la aplicación. Ya está configurado en:
- `src/index.html` - El HTML y CSS inline
- `src/app/app.component.ts` - La integración con Angular
- `src/app/core/services/loader.service.ts` - La lógica del servicio

### Personalización del Mensaje Inicial

```typescript
// En app.component.ts
ngOnInit() {
  // Actualizar textos del loader inicial
  this.loaderService.updateLoaderText(
    'Cargando Guiders Pro', 
    'Inicializando tu experiencia personalizada...'
  );
}
```

## 🔄 Loader de Componente

### Uso Básico

```typescript
// ejemplo.component.ts
import { Component } from '@angular/core';
import { LoaderComponent } from '@shared/components';

@Component({
  selector: 'app-ejemplo',
  standalone: true,
  imports: [LoaderComponent],
  template: `
    <div class="container">
      <h1>Mi Componente</h1>
      
      <!-- Loader básico -->
      <app-loader 
        [isVisible]="isLoading"
        [config]="{
          message: 'Cargando datos...',
          subMessage: 'Por favor espera',
          size: 'medium',
          theme: 'primary'
        }">
      </app-loader>
      
      <div *ngIf="!isLoading" class="content">
        <!-- Tu contenido aquí -->
      </div>
    </div>
  `
})
export class EjemploComponent {
  isLoading = true;
  
  constructor() {
    // Simular carga de datos
    setTimeout(() => {
      this.isLoading = false;
    }, 3000);
  }
}
```

### Loader Overlay (Pantalla Completa)

```typescript
// ejemplo-overlay.component.ts
import { Component } from '@angular/core';
import { LoaderService } from '@core/services';

@Component({
  template: `
    <div class="page-content">
      <button (click)="loadData()">Cargar Datos</button>
      
      <!-- El loader overlay se maneja automáticamente -->
      <div class="data-content">
        {{ data }}
      </div>
    </div>
  `
})
export class EjemploOverlayComponent {
  data = '';
  
  constructor(private loaderService: LoaderService) {}
  
  async loadData() {
    // Mostrar loader overlay
    this.loaderService.show('Cargando información...', 0);
    
    try {
      // Simular llamada API
      await this.simulateApiCall();
      this.data = 'Datos cargados exitosamente!';
    } finally {
      // Ocultar loader
      this.loaderService.hide();
    }
  }
  
  private simulateApiCall(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

## 📊 Loader con Progreso

### Progreso Manual

```typescript
// progreso-manual.component.ts
export class ProgresoManualComponent {
  progress = 0;
  
  constructor(private loaderService: LoaderService) {}
  
  async procesarArchivos() {
    const archivos = ['archivo1.pdf', 'archivo2.jpg', 'archivo3.doc'];
    
    this.loaderService.show('Procesando archivos...', 0);
    
    for (let i = 0; i < archivos.length; i++) {
      const progreso = ((i + 1) / archivos.length) * 100;
      
      // Actualizar progreso
      this.loaderService.updateProgress(
        progreso, 
        `Procesando ${archivos[i]}...`
      );
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.loaderService.hide();
  }
}
```

### Progreso Automático

```typescript
// progreso-automatico.component.ts
export class ProgresoAutomaticoComponent {
  
  constructor(private loaderService: LoaderService) {}
  
  async operacionLarga() {
    // Usar el progreso simulado del servicio
    await this.loaderService.simulateProgress(
      5000, // 5 segundos
      'Generando reporte...'
    );
    
    console.log('Operación completada!');
  }
}
```

## 📝 Loader en Formularios

### Botón con Loading

```typescript
// formulario.component.ts
@Component({
  template: `
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="email" placeholder="Email" required>
      <input [(ngModel)]="password" type="password" placeholder="Password" required>
      
      <button 
        type="submit" 
        [disabled]="isSubmitting"
        class="submit-btn">
        
        <span *ngIf="!isSubmitting">Iniciar Sesión</span>
        
        <!-- Loader inline para botón -->
        <span *ngIf="isSubmitting" class="btn-loading">
          <app-loader [config]="{
            size: 'small',
            theme: 'light'
          }" [isVisible]="true"></app-loader>
          Iniciando sesión...
        </span>
      </button>
    </form>
  `,
  styles: [`
    .btn-loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `]
})
export class FormularioComponent {
  email = '';
  password = '';
  isSubmitting = false;
  
  async onSubmit() {
    this.isSubmitting = true;
    
    try {
      // Simular login
      await this.authService.login(this.email, this.password);
      // Redirigir al dashboard
    } catch (error) {
      // Manejar error
    } finally {
      this.isSubmitting = false;
    }
  }
}
```

## 🧭 Loader en Navegación

### Interceptor de Rutas

```typescript
// route-loading.interceptor.ts
import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { LoaderService } from '@core/services';

@Injectable({
  providedIn: 'root'
})
export class RouteLoadingInterceptor {
  
  constructor(
    private router: Router,
    private loaderService: LoaderService
  ) {
    this.setupRouteLoading();
  }
  
  private setupRouteLoading() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loaderService.show('Navegando...', 0);
      } else if (event instanceof NavigationEnd) {
        this.loaderService.hide();
      }
    });
  }
}
```

### Uso en Rutas Específicas

```typescript
// dashboard.component.ts
export class DashboardComponent implements OnInit {
  
  constructor(private loaderService: LoaderService) {}
  
  async ngOnInit() {
    // Mostrar loader específico para el dashboard
    this.loaderService.show('Cargando dashboard...', 0);
    
    try {
      // Cargar datos del dashboard
      const [usuario, estadisticas, notificaciones] = await Promise.all([
        this.usuarioService.obtenerPerfil(),
        this.estadisticasService.obtenerDatos(),
        this.notificacionesService.obtenerRecientes()
      ]);
      
      // Procesar datos...
      
    } finally {
      this.loaderService.hide();
    }
  }
}
```

## 🎨 Personalización Avanzada

### Loader Personalizado con Tema Dinámico

```typescript
// loader-personalizado.component.ts
@Component({
  template: `
    <app-loader 
      [isVisible]="isVisible"
      [config]="loaderConfig"
      [progress]="currentProgress">
    </app-loader>
  `
})
export class LoaderPersonalizadoComponent {
  isVisible = false;
  currentProgress = 0;
  
  loaderConfig = {
    message: 'Procesando...',
    subMessage: 'Esto puede tomar unos momentos',
    size: 'large' as const,
    theme: 'primary' as const,
    showProgress: true
  };
  
  constructor(private themeService: ThemeService) {
    // Adaptar el tema del loader al tema de la app
    this.themeService.currentTheme$.subscribe(theme => {
      this.loaderConfig = {
        ...this.loaderConfig,
        theme: theme === 'dark' ? 'dark' : 'primary'
      };
    });
  }
  
  // Métodos para controlar el loader...
}
```

### Loader con Animaciones Personalizadas

```scss
// loader-custom-animations.scss
.custom-loader {
  .spinner {
    // Animación personalizada para el spinner
    animation: customSpin 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  
  .loader-logo {
    // Animación del logo
    animation: logoFadeIn 1s ease-in-out;
  }
  
  .progress-bar {
    // Gradiente animado para la barra de progreso
    background: linear-gradient(
      90deg, 
      var(--color-primary), 
      var(--color-secondary),
      var(--color-primary)
    );
    background-size: 200% 100%;
    animation: progressGradient 2s ease-in-out infinite;
  }
}

@keyframes customSpin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes logoFadeIn {
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes progressGradient {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 0%; }
  100% { background-position: 0% 0%; }
}
```

## 🔧 Configuración Global

### Configurar el Loader en app.config.ts

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers
    {
      provide: 'LOADER_CONFIG',
      useValue: {
        defaultMessage: 'Cargando Guiders...',
        defaultSubMessage: 'Preparando tu experiencia',
        defaultTheme: 'primary',
        defaultSize: 'medium',
        autoHideTimeout: 10000, // 10 segundos máximo
        showProgressByDefault: false
      }
    }
  ]
};
```

## 📱 Responsividad

El sistema de loading incluye soporte completo para dispositivos móviles:

```scss
// Responsive breakpoints incluidos
@media (max-width: 768px) {
  .guiders-loader {
    .guiders-logo {
      width: 100px;
      height: 100px;
    }
    
    .loading-text {
      font-size: 18px;
    }
  }
}

@media (max-width: 480px) {
  .guiders-loader {
    .guiders-logo {
      width: 80px;
      height: 80px;
    }
    
    .progress-container {
      width: 240px;
    }
  }
}
```

## ✅ Mejores Prácticas

1. **Usa el loader inicial solo para la carga de la app**
2. **Para operaciones rápidas (< 1s), no uses loader**
3. **Siempre proporciona mensajes descriptivos**
4. **Usa progreso para operaciones largas (> 3s)**
5. **Mantén consistencia en los temas**
6. **Testa el comportamiento en dispositivos móviles**
7. **Implementa timeouts para evitar loaders infinitos**

## 🚨 Solución de Problemas

### El loader no desaparece
```typescript
// Asegúrate de llamar hide() en finally
try {
  // operación
} finally {
  this.loaderService.hide(); // ✅ Siempre se ejecuta
}
```

### Múltiples loaders superpuestos
```typescript
// Verifica el estado antes de mostrar
if (!this.loaderService.isLoading) {
  this.loaderService.show('Cargando...');
}
```

### Loader no se adapta al tema
```typescript
// Suscríbete a los cambios de tema
this.themeService.currentTheme$.subscribe(theme => {
  this.updateLoaderTheme(theme);
});
```

---

¡El sistema de loading de Guiders está listo para usar! 🎉
