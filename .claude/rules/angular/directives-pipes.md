# Directives and Pipes

## Description

Patterns for creating reusable standalone directives and pipes.

## Standalone Directives

### Attribute Directive

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

// Usage
// <span guidersHighlight="blue">Highlighted text</span>
// <span guidersHighlight>Text with default color</span>
```

### Structural Directive

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

// Usage
// <div *guidersIf="isVisible">Conditional content</div>
```

### Host Listener Directive

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
    // Logic to detect click outside
    this.clickOutside.emit();
  }
}

// Usage
// <div guidersClickOutside (clickOutside)="onClose()">...</div>
```

### Directive with Host Binding

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

// Usage
// <button guidersTooltip="Help" position="bottom">?</button>
```

## Standalone Pipes

### Pure Pipe (Stateless)

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true,
  pure: true, // Default, optimized for performance
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, maxLength: number = 50, suffix: string = '...'): string {
    if (!value) return '';
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength).trim() + suffix;
  }
}

// Usage
// {{ longText | truncate:30:'...' }}
```

### Relative Time Pipe

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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US');
  }
}

// Usage
// {{ message.sentAt | relativeTime }}
```

### Number Formatting Pipe

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

// Usage
// {{ followers | compactNumber }} → "1.5K"
```

### Pipe with Injection

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

// Usage
// {{ 'common.welcome' | translate:{ name: userName } }}
```

### Impure Pipe (for changing data)

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBy',
  standalone: true,
  pure: false, // Runs on every change detection
})
export class FilterByPipe implements PipeTransform {
  transform<T>(items: T[], field: keyof T, value: unknown): T[] {
    if (!items || !field) return items;
    return items.filter(item => item[field] === value);
  }
}

// Usage (use with caution - performance impact)
// {{ items | filterBy:'status':'active' }}
```

## Usage in Components

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

## File Structure

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

## Naming Rules

| Element | Pattern | Example |
|----------|--------|---------|
| Directive | `{Name}Directive` | `HighlightDirective` |
| Directive selector | `guiders{Name}` | `guidersHighlight` |
| Pipe | `{Name}Pipe` | `TruncatePipe` |
| Pipe name | camelCase | `truncate`, `relativeTime` |
| File | `{name}.directive.ts` / `{name}.pipe.ts` | `highlight.directive.ts` |

## Checklist

### Directives

- [ ] `standalone: true`
- [ ] Selector with `guiders` prefix
- [ ] `inject()` for dependencies
- [ ] `input()` signals for properties
- [ ] Unit tests

### Pipes

- [ ] `standalone: true`
- [ ] `pure: true` by default (change only if necessary)
- [ ] Name in camelCase
- [ ] Handle null/undefined values
- [ ] Unit tests

## Anti-patterns

- Directives/pipes without standalone
- Impure pipes without necessity (affects performance)
- Business logic in pipes
- Directives with too many responsibilities
- Not handling edge cases (null, undefined)
