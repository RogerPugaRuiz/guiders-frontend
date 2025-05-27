# Sistema de Loading Guiders - Técnica Gmail

Este documento explica cómo funciona el sistema de loading implementado en Guiders, inspirado en la técnica utilizada por Gmail para lograr cargas ultrarrápidas.

## 🚀 Características Principales

- **Carga instantánea**: CSS y assets críticos inline en el HTML
- **Animaciones suaves**: Transiciones fluidas entre el loader y la aplicación
- **Responsive**: Adaptado para todas las pantallas
- **Accesible**: Soporte para modo oscuro y preferencias del sistema
- **Optimizado para SSR**: Compatible con Angular Universal
- **Integración inteligente**: Detección automática de cuando Angular está listo

## 📁 Estructura de Archivos

```
src/
├── index.html                     # Loader principal inline
├── app/
│   ├── core/services/
│   │   └── loader.service.ts      # Servicio para control del loader
│   └── shared/components/loader/
│       └── loader.component.ts    # Componente reutilizable
└── docs/
    └── LOADING-SYSTEM.md         # Este archivo
```

## 🎨 Componentes del Sistema

### 1. Loader Principal (index.html)

El loader principal está embebido directamente en el `index.html` para garantizar una carga instantánea:

- **Logo animado**: SVG inline con animaciones CSS
- **Spinner**: Indicador de carga con colores de marca
- **Textos dinámicos**: Mensajes de carga personalizables
- **Barra de progreso**: Feedback visual del progreso
- **Partículas**: Efectos visuales de fondo
- **Skeleton header**: Transición suave hacia la interfaz final

### 2. LoaderService

Servicio Angular que gestiona el estado del loader:

```typescript
import { LoaderService } from './core/services/loader.service';

constructor(private loaderService: LoaderService) {}

// Ocultar loader manualmente
this.loaderService.hideLoader();

// Mostrar loader para operaciones específicas
this.loaderService.showLoader();

// Actualizar textos dinámicamente
this.loaderService.updateLoaderText('Procesando...', 'Por favor espera');

// Observar estado del loading
this.loaderService.isLoading$.subscribe(isLoading => {
  console.log('Loading state:', isLoading);
});
```

### 3. LoaderComponent

Componente reutilizable para loaders internos de la aplicación:

```typescript
import { LoaderComponent } from './shared/components/loader/loader.component';

// En tu template
<app-loader 
  [isVisible]="isLoading"
  [mainText]="'Cargando datos...'"
  [subText]="'Esto puede tomar unos segundos'"
  [showProgress]="true"
  [progressValue]="progressPercent"
  [primaryColor]="'#667eea'"
  [transparent]="true">
</app-loader>
```

## ⚙️ Configuración y Personalización

### Colores de Marca

Los colores se pueden personalizar modificando las variables CSS en `index.html`:

```css
:root {
  --loader-primary: #667eea;
  --loader-secondary: #764ba2;
  --loader-text: #ffffff;
}
```

### Textos Personalizados

```typescript
// Cambiar textos durante la carga
this.loaderService.updateLoaderText(
  'Iniciando aplicación...',
  'Configurando tu espacio de trabajo'
);
```

### Duración del Loader

```typescript
// En app.component.ts - Ajustar el timeout
setTimeout(() => {
  this.loaderService.hideLoader();
}, 1500); // Cambiar duración aquí
```

## 🎭 Animaciones y Efectos

### Animaciones Disponibles

1. **logoFloat**: Animación flotante del logo
2. **guidersSpinSmooth**: Spinner suave
3. **progressLoad**: Barra de progreso animada
4. **float**: Partículas flotantes
5. **pulse**: Efecto de pulso para skeleton

### Personalizar Animaciones

```css
/* Ejemplo: Modificar velocidad del spinner */
.guiders-spinner {
  animation: guidersSpinSmooth 0.8s linear infinite; /* Más rápido */
}

/* Ejemplo: Cambiar intensidad del float del logo */
@keyframes logoFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); } /* Más movimiento */
}
```

## 🔧 Integración con Rutas

Para mostrar el loader durante navegación:

```typescript
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

constructor(
  private router: Router,
  private loaderService: LoaderService
) {
  this.router.events.subscribe(event => {
    if (event instanceof NavigationStart) {
      this.loaderService.showLoader();
    } else if (event instanceof NavigationEnd) {
      this.loaderService.hideLoader();
    }
  });
}
```

## 📱 Responsividad

El sistema está optimizado para diferentes tamaños de pantalla:

- **Desktop**: Logo 140px, textos grandes
- **Tablet**: Logo 100px, textos medianos  
- **Mobile**: Logo 80px, textos pequeños, barra de progreso ajustada

## 🌙 Soporte de Temas

El loader respeta automáticamente las preferencias del usuario:

```css
/* Tema claro */
html[data-theme="light"] .guiders-loader {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Tema oscuro */
html[data-theme="dark"] .guiders-loader {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
}
```

## 🚨 Eventos y Hooks

### Eventos Disponibles

```typescript
// Escuchar cuando el loader se oculta
window.addEventListener('app:ready', () => {
  console.log('Aplicación lista');
});

// Detectar cambios de estado
this.loaderService.isLoading$.subscribe(isLoading => {
  if (!isLoading) {
    // Ejecutar código cuando termine la carga
  }
});
```

## 🔍 Debugging y Desarrollo

### Logs de Desarrollo

El sistema incluye logs útiles para desarrollo:

```javascript
console.log('🚀 Guiders cargado exitosamente');
console.warn('⚠️ Timeout del loader alcanzado');
```

### Forzar Mostrar/Ocultar

```typescript
// Para testing o debugging
this.loaderService.hideLoader(); // Ocultar inmediatamente
this.loaderService.showLoader(); // Mostrar nuevamente
```

## 📈 Optimizaciones de Rendimiento

### Técnicas Implementadas

1. **CSS Inline**: Estilos críticos embebidos en HTML
2. **SVG Inline**: Logo como SVG para evitar requests adicionales
3. **requestIdleCallback**: Optimizaciones en tiempo de inactividad
4. **Lazy Loading**: Scripts se ejecutan solo cuando es necesario
5. **Preload Hints**: Preparación de recursos críticos

### Métricas Recomendadas

- **FCP (First Contentful Paint)**: < 1.5s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **TTI (Time to Interactive)**: < 3.5s

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Loader no se oculta**: Verificar que `LoaderService` está importado
2. **Animaciones lentas**: Revisar configuración de `transition-duration`
3. **Colores incorrectos**: Verificar variables CSS y tema activo
4. **SSR Issues**: Asegurar que el código del cliente no se ejecuta en servidor

### Debug Mode

```typescript
// Activar modo debug en desarrollo
this.loaderService.updateLoaderText('DEBUG: Cargando...', 'Modo desarrollo');
```

## 🤝 Contribuir

Para mejorar el sistema de loading:

1. Mantener compatibilidad con SSR
2. Preservar accesibilidad
3. Testear en diferentes dispositivos
4. Documentar cambios importantes

## 📚 Referencias

- [Técnica de Loading de Gmail](https://developers.google.com/gmail/design)
- [Web Performance Best Practices](https://web.dev/performance/)
- [Angular Loading Strategies](https://angular.io/guide/lazy-loading-ngmodules)
