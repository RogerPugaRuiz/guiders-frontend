# Quick Start Guide - Toast Component

## Instalación Rápida (3 pasos)

### 1️⃣ Importar en App Component

```typescript
// apps/console/src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '@guiders-frontend/shared/ui/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet />
    <guiders-toast-container />
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {}
```

### 2️⃣ Usar en Cualquier Componente

```typescript
import { Component, inject } from '@angular/core';
import { ToastService } from '@guiders-frontend/shared/ui/toast';

@Component({
  selector: 'app-example',
  template: `
    <button (click)="showSuccess()">Mostrar Toast</button>
  `
})
export class ExampleComponent {
  private readonly toastService = inject(ToastService);

  showSuccess() {
    this.toastService.success('¡Operación exitosa!');
  }
}
```

### 3️⃣ ¡Listo! 🎉

Ya puedes usar los toasts en toda tu aplicación.

---

## Métodos Disponibles

```typescript
// Toast de éxito (verde)
this.toastService.success('Guardado correctamente');

// Toast de error (rojo)
this.toastService.error('Error al guardar');

// Toast de advertencia (amarillo)
this.toastService.warning('Cuidado con esta acción');

// Toast de información (azul)
this.toastService.info('Nuevo mensaje recibido');

// Con duración personalizada (en milisegundos)
this.toastService.success('Mensaje', 5000); // 5 segundos

// Toast sin auto-dismiss (debe cerrarse manualmente)
this.toastService.error('Error crítico', 0);
```

---

## Cambiar Posición

```typescript
import { ToastService } from '@guiders-frontend/shared/ui/toast';

// Cambiar donde aparecen los toasts
this.toastService.setPosition('bottom-right');

// Posiciones disponibles:
// 'top-left', 'top-center', 'top-right'
// 'bottom-left', 'bottom-center', 'bottom-right'
```

---

## Ejemplos Comunes

### En HTTP Service

```typescript
saveData(data: any) {
  return this.http.post('/api/data', data).pipe(
    tap(() => this.toastService.success('Datos guardados')),
    catchError(error => {
      this.toastService.error('Error al guardar');
      return throwError(() => error);
    })
  );
}
```

### En Formularios

```typescript
onSubmit(form: FormGroup) {
  if (!form.valid) {
    this.toastService.warning('Complete todos los campos');
    return;
  }
  
  this.saveForm(form.value);
}
```

### Con Loading State

```typescript
async uploadFile(file: File) {
  const loadingId = this.toastService.info('Subiendo...', 0);
  
  try {
    await this.api.upload(file);
    this.toastService.remove(loadingId);
    this.toastService.success('Archivo subido');
  } catch (error) {
    this.toastService.remove(loadingId);
    this.toastService.error('Error al subir');
  }
}
```

---

## Tips

💡 **Duración recomendada**:
- Success/Info: 3000ms (default)
- Warning: 4000-5000ms
- Error: 5000ms o permanente (0)

💡 **Mensajes cortos**: Máximo 1-2 líneas

💡 **Posición por defecto**: `top-right` es la más común

💡 **No abusar**: Evita múltiples toasts simultáneos

---

Para más detalles, ver `README.md` y `USAGE-EXAMPLES.md`
