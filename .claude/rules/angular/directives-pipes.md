# Directivas y Pipes

## Descripción

Patrones para crear directivas y pipes standalone reutilizables.

## Directivas Standalone

### Directiva de Atributo

```typescript
import { Directive, ElementRef, input, effect, inject } from '@angular/core';

@Directive({
  selector: '[guidersHighlight]',
  standalone: true,
})
export class HighlightDirective {
  private readonly el = inject(ElementRef);

  readonly color = input<string>('yellow', { alias: 'guidersHighlight' });

  constructor() {
    effect(() => {
      this.el.nativeElement.style.backgroundColor = this.color();
    });
  }
}

// Uso
// <span guidersHighlight="blue">Texto resaltado</span>
// <span guidersHighlight>Texto con color por defecto</span>
```

### Directiva Estructural

```typescript
import { Directive, TemplateRef, ViewContainerRef, input, effect, inject } from '@angular/core';

@Directive({
  selector: '[guidersIf]',
  standalone: true,
})
export class IfDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly condition = input.required<boolean>({ alias: 'guidersIf' });

  constructor() {
    effect(() => {
      if (this.condition()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainer.clear();
      }
    });
  }
}

// Uso
// <div *guidersIf="isVisible">Contenido condicional</div>
```

### Directiva de Host Listener

```typescript
import { Directive, HostListener, output } from '@angular/core';

@Directive({
  selector: '[guidersClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  readonly clickOutside = output<void>();

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    // Lógica para detectar click fuera
    this.clickOutside.emit();
  }
}

// Uso
// <div guidersClickOutside (clickOutside)="onClose()">...</div>
```

### Directiva con Host Binding

```typescript
import { Directive, HostBinding, input, computed } from '@angular/core';

@Directive({
  selector: '[guidersTooltip]',
  standalone: true,
})
export class TooltipDirective {
  readonly text = input.required<string>({ alias: 'guidersTooltip' });
  readonly position = input<'top' | 'bottom'>('top');

  @HostBinding('attr.data-tooltip')
  get tooltipText(): string {
    return this.text();
  }

  @HostBinding('attr.data-tooltip-position')
  get tooltipPosition(): string {
    return this.position();
  }

  @HostBinding('class.has-tooltip')
  get hasTooltip(): boolean {
    return !!this.text();
  }
}

// Uso
// <button guidersTooltip="Ayuda" position="bottom">?</button>
```

## Pipes Standalone

### Pipe Puro (Stateless)

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true,
  pure: true, // Default, optimizado para rendimiento
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, maxLength: number = 50, suffix: string = '...'): string {
    if (!value) return '';
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength).trim() + suffix;
  }
}

// Uso
// {{ longText | truncate:30:'...' }}
```

### Pipe de Fecha Relativa

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: Date | string): string {
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES');
  }
}

// Uso
// {{ message.sentAt | relativeTime }}
```

### Pipe de Formateo de Número

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'compactNumber',
  standalone: true,
})
export class CompactNumberPipe implements PipeTransform {
  transform(value: number): string {
    if (value < 1000) return value.toString();
    if (value < 1000000) return (value / 1000).toFixed(1) + 'K';
    return (value / 1000000).toFixed(1) + 'M';
  }
}

// Uso
// {{ followers | compactNumber }} → "1.5K"
```

### Pipe con Inyección

```typescript
import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '@guiders-frontend/shared/i18n';

@Pipe({
  name: 'translate',
  standalone: true,
})
export class TranslatePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);

  transform(key: string, params?: Record<string, string>): string {
    return this.translationService.translate(key, params);
  }
}

// Uso
// {{ 'common.welcome' | translate:{ name: userName } }}
```

### Pipe Impuro (para datos cambiantes)

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBy',
  standalone: true,
  pure: false, // Se ejecuta en cada change detection
})
export class FilterByPipe implements PipeTransform {
  transform<T>(items: T[], field: keyof T, value: unknown): T[] {
    if (!items || !field) return items;
    return items.filter(item => item[field] === value);
  }
}

// Uso (con precaución - impacto en rendimiento)
// {{ items | filterBy:'status':'active' }}
```

## Uso en Componentes

```typescript
@Component({
  selector: 'lib-chat-message',
  standalone: true,
  imports: [
    CommonModule,
    TruncatePipe,
    RelativeTimePipe,
    HighlightDirective,
  ],
  template: `
    <div class="message" guidersHighlight="lightblue">
      <span class="time">{{ message.sentAt | relativeTime }}</span>
      <p>{{ message.content | truncate:200 }}</p>
    </div>
  `,
})
export class ChatMessage {
  readonly message = input.required<Message>();
}
```

## Estructura de Archivos

```
libs/shared/util/pipes/
├── src/
│   ├── lib/
│   │   ├── truncate.pipe.ts
│   │   ├── truncate.pipe.spec.ts
│   │   ├── relative-time.pipe.ts
│   │   └── relative-time.pipe.spec.ts
│   └── index.ts
└── project.json

libs/shared/util/directives/
├── src/
│   ├── lib/
│   │   ├── highlight.directive.ts
│   │   ├── click-outside.directive.ts
│   │   └── tooltip.directive.ts
│   └── index.ts
└── project.json
```

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Directiva | `{Name}Directive` | `HighlightDirective` |
| Selector directiva | `guiders{Name}` | `guidersHighlight` |
| Pipe | `{Name}Pipe` | `TruncatePipe` |
| Nombre pipe | camelCase | `truncate`, `relativeTime` |
| Archivo | `{name}.directive.ts` / `{name}.pipe.ts` | `highlight.directive.ts` |

## Checklist

### Directivas

- [ ] `standalone: true`
- [ ] Selector con prefijo `guiders`
- [ ] `inject()` para dependencias
- [ ] `input()` signals para propiedades
- [ ] Tests unitarios

### Pipes

- [ ] `standalone: true`
- [ ] `pure: true` por defecto (cambiar solo si necesario)
- [ ] Nombre en camelCase
- [ ] Manejar valores null/undefined
- [ ] Tests unitarios

## Anti-patrones

- Directivas/pipes sin standalone
- Pipes impuros sin necesidad (afecta rendimiento)
- Lógica de negocio en pipes
- Directivas con demasiadas responsabilidades
- No manejar casos edge (null, undefined)
