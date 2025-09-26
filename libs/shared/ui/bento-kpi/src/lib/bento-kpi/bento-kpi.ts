import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BentoSize = '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | '1x3' | '3x2' | '2x3';
export type BentoVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'outlined';

export interface KpiTrend {
  value: number;
  direction: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'guiders-bento-kpi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bento-kpi.html',
  styleUrl: './bento-kpi.scss',
})
export class BentoKpiComponent {
  // Inputs usando la nueva API de signals
  readonly size = input<BentoSize>('1x1');
  readonly variant = input<BentoVariant>('default');
  readonly title = input.required<string>();
  readonly value = input.required<number>();
  readonly unit = input<string>('');
  readonly icon = input<string>('');
  readonly trend = input<KpiTrend | null>(null);
  readonly showChart = input<boolean>(false);

  // Computed values
  readonly formattedValue = computed(() => {
    const val = this.value();
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    } else if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toString();
  });

  readonly trendIcon = computed(() => {
    const trendData = this.trend();
    if (!trendData) return '';
    
    switch (trendData.direction) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '';
    }
  });

  readonly chartData = computed(() => {
    // Generar datos de ejemplo para el mini chart
    // En una implementación real, esto vendría de los inputs
    return [65, 45, 78, 52, 89, 67, 43, 95, 76, 88, 92, 85];
  });

  readonly cssClasses = computed(() => {
    return [
      'bento-kpi',
      `bento-kpi--${this.size()}`,
      `bento-kpi--${this.variant()}`
    ].join(' ');
  });

  // Track by function para el *ngFor
  trackByIndex(index: number): number {
    return index;
  }
}
