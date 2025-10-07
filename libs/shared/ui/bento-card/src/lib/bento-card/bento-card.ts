import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BentoSize = '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | '1x3' | '3x2' | '2x3';
export type BentoVariant = 'default' | 'elevated' | 'outlined' | 'filled';

@Component({
  selector: 'guiders-bento-card',
  imports: [CommonModule],
  templateUrl: './bento-card.html',
  styleUrl: './bento-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoCardComponent {
  // === INPUTS ===
  readonly size = input<BentoSize>('1x1');
  readonly variant = input<BentoVariant>('default');
  readonly title = input<string>();
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly padding = input<string>('default'); // 'none' | 'sm' | 'default' | 'lg'

  // === COMPUTED VALUES ===
  readonly cssClasses = computed(() => {
    const classes = {
      'guiders-bento-card': true,
      [`guiders-bento-card--${this.size()}`]: true,
      [`guiders-bento-card--${this.variant()}`]: true,
      [`guiders-bento-card--padding-${this.padding()}`]: true,
      'guiders-bento-card--loading': this.loading(),
      'guiders-bento-card--disabled': this.disabled(),
      'guiders-bento-card--error': !!this.error(),
    };
    return classes;
  });

  readonly ariaLabel = computed(() => {
    const title = this.title();
    const size = this.size();
    const loading = this.loading();
    const error = this.error();
    
    let label = title || 'Contenedor';
    
    if (loading) {
      label += ' - Cargando';
    } else if (error) {
      label += ' - Error: ' + error;
    }
    
    label += ` - Tamaño ${size}`;
    
    return label;
  });
}
