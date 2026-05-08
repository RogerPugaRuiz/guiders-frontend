import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Skeleton block component for loading states.
 * Displays a shimmering placeholder with configurable dimensions.
 * Automatically sets aria-hidden="true" to hide from screen readers.
 */
@Component({
  selector: 'guiders-skeleton-block',
  standalone: true,
  imports: [],
  template: `<div class="skeleton-block" [style.width]="width()" [style.height]="height()"></div>`,
  styleUrl: './skeleton-block.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class SkeletonBlockComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('1rem');
}
