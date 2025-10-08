# Ejemplo de Integración del Toast

## En app.component.ts (Console)

```typescript
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

## En un servicio HTTP (ejemplo)

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '@guiders-frontend/shared/ui/toast';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  saveData(data: any) {
    return this.http.post('/api/data', data).pipe(
      tap(() => {
        this.toastService.success('Datos guardados exitosamente');
      }),
      catchError(error => {
        this.toastService.error('Error al guardar los datos');
        return throwError(() => error);
      })
    );
  }
}
```

## En un componente de configuración

```typescript
import { Component, inject } from '@angular/core';
import { ToastService, ToastPosition } from '@guiders-frontend/shared/ui/toast';

@Component({
  selector: 'app-settings',
  template: `
    <div class="settings">
      <h2>Configuración de Notificaciones</h2>
      
      <label>
        Posición de las notificaciones:
        <select [value]="currentPosition" (change)="changePosition($event)">
          <option value="top-left">Arriba Izquierda</option>
          <option value="top-center">Arriba Centro</option>
          <option value="top-right">Arriba Derecha</option>
          <option value="bottom-left">Abajo Izquierda</option>
          <option value="bottom-center">Abajo Centro</option>
          <option value="bottom-right">Abajo Derecha</option>
        </select>
      </label>
      
      <button (click)="testToast()">Probar Notificación</button>
    </div>
  `
})
export class SettingsComponent {
  private readonly toastService = inject(ToastService);
  currentPosition: ToastPosition = 'top-right';

  changePosition(event: Event) {
    const select = event.target as HTMLSelectElement;
    const position = select.value as ToastPosition;
    this.toastService.setPosition(position);
    this.currentPosition = position;
    this.toastService.info('Posición actualizada');
  }

  testToast() {
    this.toastService.success('¡Esta es una notificación de prueba!');
  }
}
```

## Uso en un Guard (ejemplo de autenticación)

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '@guiders-frontend/shared/ui/toast';

export const authGuard = () => {
  const router = inject(Router);
  const toastService = inject(ToastService);
  const token = localStorage.getItem('access-token');

  if (!token) {
    toastService.warning('Debe iniciar sesión para acceder');
    router.navigate(['/login']);
    return false;
  }

  return true;
};
```

## Casos de uso comunes

### 1. Operación asíncrona con indicador de carga

```typescript
async uploadFile(file: File) {
  const loadingToastId = this.toastService.info('Subiendo archivo...', 0);
  
  try {
    await this.apiService.uploadFile(file);
    this.toastService.remove(loadingToastId);
    this.toastService.success('Archivo subido exitosamente');
  } catch (error) {
    this.toastService.remove(loadingToastId);
    this.toastService.error('Error al subir el archivo', 5000);
  }
}
```

### 2. Validación de formularios

```typescript
onSubmit(form: FormGroup) {
  if (!form.valid) {
    this.toastService.warning('Por favor complete todos los campos requeridos');
    return;
  }
  
  // Continuar con el envío...
}
```

### 3. Confirmación de acciones destructivas

```typescript
async deleteItem(id: string) {
  if (confirm('¿Está seguro de eliminar este elemento?')) {
    try {
      await this.apiService.delete(id);
      this.toastService.success('Elemento eliminado');
    } catch (error) {
      this.toastService.error('No se pudo eliminar el elemento');
    }
  }
}
```

### 4. WebSocket - Notificación de eventos en tiempo real

```typescript
private setupWebSocket() {
  this.wsService.onMessage$.subscribe(message => {
    if (message.type === 'new_message') {
      this.toastService.info(`Nuevo mensaje de ${message.senderName}`);
    }
  });
}
```
