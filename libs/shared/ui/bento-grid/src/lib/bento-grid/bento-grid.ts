import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BentoGridDensity = 'compact' | 'comfortable' | 'spacious';
export type BentoGridColumns = 2 | 3 | 4 | 6;

@Component({
  selector: 'guiders-bento-grid',
  imports: [CommonModule],
  templateUrl: './bento-grid.html',
  styleUrl: './bento-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoGridComponent {
  // === INPUTS ===
  readonly columns = input<BentoGridColumns>(4);
  readonly density = input<BentoGridDensity>('comfortable');
  readonly minItemWidth = input<string>('280px');
  readonly gap = input<string>('16px');
  readonly padding = input<string>('24px');
  readonly autoRows = input<string>('minmax(200px, auto)');

  // === COMPUTED VALUES ===
  readonly gridStyles = computed(() => {
    const cols = this.columns();
    const gap = this.gap();
    const padding = this.padding();
    const minWidth = this.minItemWidth();
    const autoRows = this.autoRows();
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(${minWidth}, 1fr))`,
      gridAutoRows: autoRows,
      gap: gap,
      padding: padding,
      width: '100%',
      height: '100%'
    };
  });

  readonly cssClasses = computed(() => ({
    'guiders-bento-grid': true,
    [`guiders-bento-grid--${this.density()}`]: true,
    [`guiders-bento-grid--cols-${this.columns()}`]: true,
  }));
}
