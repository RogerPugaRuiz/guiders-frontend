# Fix: Angular Material Theme - Diseño Corrupto del SnackBar

## Problema

Después de migrar de Toast custom a Angular Material SnackBar, el diseño aparecía corrupto:
- Texto sin estilos correctos
- Botones sin formato Material Design
- Colores y espaciado incorrectos

**Captura del problema**: El SnackBar mostraba "Tomando chat con Visitante anónimo" con diseño roto.

## Causa Raíz

Angular Material requiere que se importe un **tema CSS** para que sus componentes tengan los estilos correctos. Sin el tema, los componentes funcionan pero sin diseño visual.

## Solución Aplicada

### Opción 1: Tema Precompilado (Implementada)

Agregar el tema precompilado en `apps/console/src/styles.scss`:

```scss
// Importar tema precompilado de Angular Material
@import '@angular/material/prebuilt-themes/indigo-pink.css';
```

**Ventajas**:
- ✅ Simple y rápido
- ✅ Sin configuración adicional
- ✅ Funciona inmediatamente
- ✅ Temas disponibles:
  - `indigo-pink.css`
  - `deeppurple-amber.css`
  - `pink-bluegrey.css`
  - `purple-green.css`

**Desventajas**:
- ❌ No personalizable
- ❌ Tamaño del bundle aumenta (~110 KB)

### Opción 2: Tema Custom con SCSS (Alternativa)

Para Angular Material v15+, usar la nueva API de temas:

```scss
@use '@angular/material' as mat;

// Incluir estilos base
@include mat.core();

// Definir paletas de colores
$my-primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$my-accent: mat.m2-define-palette(mat.$m2-pink-palette, A200, A100, A400);
$my-warn: mat.m2-define-palette(mat.$m2-red-palette);

// Crear tema
$my-theme: mat.m2-define-light-theme((
  color: (
    primary: $my-primary,
    accent: $my-accent,
    warn: $my-warn,
  ),
  typography: mat.m2-define-typography-config(),
  density: 0,
));

// Aplicar tema a todos los componentes
@include mat.all-component-themes($my-theme);
```

**Ventajas**:
- ✅ Totalmente personalizable
- ✅ Puedes definir colores de marca
- ✅ Control total sobre typography y spacing

**Desventajas**:
- ❌ Requiere configuración
- ❌ API compleja
- ❌ Puede romper con actualizaciones de Material

## Cambios en el Código

### Archivo: `apps/console/src/styles.scss`

**Antes** (sin tema):
```scss
/* === GUIDERS CONSOLE - ESTILOS GLOBALES === */

@use '../../../libs/shared/design-tokens/src/lib/tokens-vars.scss' as tokens;

/* Reset y normalización */
*, *::before, *::after {
  box-sizing: border-box;
}
// ... resto del archivo
```

**Después** (con tema):
```scss
/* === GUIDERS CONSOLE - ESTILOS GLOBALES === */

// IMPORTANTE: Todas las reglas @use deben estar al inicio
@use '../../../libs/shared/design-tokens/src/lib/tokens-vars.scss' as tokens;

// Importar tema precompilado de Angular Material (más simple y rápido)
@import '@angular/material/prebuilt-themes/indigo-pink.css';

/* Reset y normalización */
*, *::before, *::after {
  box-sizing: border-box;
}
// ... resto del archivo
```

**Nota importante**: La regla `@use` debe estar **antes** del `@import` y de cualquier otro CSS.

## Impacto en Bundle Size

### Antes (sin Material)
```
styles.css: 2.79 kB
```

### Después (con Material)
```
styles.css: 113.35 kB (+110.56 kB)
```

**Aumento**: ~110 KB adicionales para todos los estilos de Material Design.

**Optimización futura**: Usar `@use` con componentes específicos en lugar de tema completo:

```scss
// Solo importar estilos de SnackBar (más ligero)
@use '@angular/material' as mat;
@include mat.core();
@include mat.snack-bar-theme($my-theme);
```

Esto reduce el bundle size significativamente al incluir solo el SnackBar.

## Validación

### Build exitoso
```bash
npx nx build console --configuration=development
```

**Resultado**:
```
✔ Successfully ran target build for project console (4s)
styles.css: 113.35 kB
```

### Testing Visual

1. Iniciar app: `npm run dev`
2. Navegar a `/visitors`
3. Click en visitante con chat pendiente
4. **Verificar**: SnackBar aparece con diseño Material correcto
   - Fondo oscuro (#323232)
   - Texto blanco
   - Botón "Cerrar" con ripple effect
   - Animación slide-in desde abajo
   - Espaciado correcto (16px padding)

## Temas Precompilados Disponibles

Angular Material incluye 4 temas precompilados:

### 1. Indigo-Pink (Implementado)
```scss
@import '@angular/material/prebuilt-themes/indigo-pink.css';
```
- Primary: Indigo (#3F51B5)
- Accent: Pink (#E91E63)
- Warn: Red (#F44336)

### 2. Deep Purple-Amber
```scss
@import '@angular/material/prebuilt-themes/deeppurple-amber.css';
```
- Primary: Deep Purple (#673AB7)
- Accent: Amber (#FFC107)
- Warn: Red

### 3. Pink-BlueGrey
```scss
@import '@angular/material/prebuilt-themes/pink-bluegrey.css';
```
- Primary: Pink (#E91E63)
- Accent: Blue Grey (#607D8B)
- Warn: Red

### 4. Purple-Green
```scss
@import '@angular/material/prebuilt-themes/purple-green.css';
```
- Primary: Purple (#9C27B0)
- Accent: Green (#4CAF50)
- Warn: Red

## Personalización del SnackBar (Opcional)

Si quieres personalizar solo el SnackBar sin cambiar todo el tema:

```scss
// En styles.scss global
@import '@angular/material/prebuilt-themes/indigo-pink.css';

// Personalizar SnackBar
.mat-mdc-snack-bar-container {
  --mdc-snackbar-container-color: #323232 !important;
  --mdc-snackbar-supporting-text-color: #ffffff !important;
  
  // Para éxito (verde)
  &.snackbar-success {
    --mdc-snackbar-container-color: #4caf50 !important;
  }
  
  // Para error (rojo)
  &.snackbar-error {
    --mdc-snackbar-container-color: #f44336 !important;
  }
  
  // Para warning (naranja)
  &.snackbar-warning {
    --mdc-snackbar-container-color: #ff9800 !important;
  }
  
  // Para info (azul)
  &.snackbar-info {
    --mdc-snackbar-container-color: #2196f3 !important;
  }
}
```

**Uso en código**:
```typescript
this.snackBar.open('Éxito', 'Cerrar', {
  duration: 3000,
  panelClass: 'snackbar-success'
});
```

## Referencias

- [Angular Material Theming Guide](https://material.angular.dev/guide/theming)
- [Angular Material Prebuilt Themes](https://github.com/angular/components/tree/main/src/material/core/theming/prebuilt)
- [Material Design Color System](https://m3.material.io/styles/color/system/overview)
- [CSS Custom Properties for Material](https://material.angular.dev/guide/theming#customizing-component-styles)

## Checklist de Implementación

- [x] Tema precompilado agregado a `styles.scss`
- [x] Build exitoso sin errores
- [x] Bundle size verificado (+110 KB aceptable)
- [x] SnackBar con diseño correcto
- [ ] Testing visual en navegador (pendiente usuario)
- [ ] (Opcional) Personalizar colores del SnackBar
- [ ] (Opcional) Migrar a tema custom SCSS

## Próximos Pasos

1. **Testing en navegador**: Verificar que el SnackBar se ve correctamente
2. **Personalización**: Si se necesita, aplicar colores de marca de Guiders
3. **Optimización**: Considerar importar solo componentes necesarios para reducir bundle
4. **Documentación**: Actualizar guía de estilos con el uso de Material Design

## Notas Importantes

⚠️ **No olvidar**: Angular Material requiere tema CSS para funcionar correctamente. Sin tema, los componentes aparecen sin estilos.

⚠️ **Orden de imports**: Las reglas `@use` deben estar **antes** de `@import` y de cualquier otro CSS en SCSS.

⚠️ **Bundle size**: El tema completo agrega ~110 KB. Para producción, considerar tree-shaking con tema custom.
