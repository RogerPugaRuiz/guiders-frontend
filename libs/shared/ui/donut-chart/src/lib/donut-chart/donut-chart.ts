import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DonutChartVariant = 'primary' | 'success' | 'warning' | 'info';
export type DonutChartSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'guiders-donut-chart',
  imports: [CommonModule],
  templateUrl: './donut-chart.html',
  styleUrl: './donut-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChart {
  readonly value = input.required<number>();
  readonly maxValue = input<number>(100);
  readonly variant = input<DonutChartVariant>('primary');
  readonly size = input<DonutChartSize>('medium');
  readonly showValue = input<boolean>(true);
  readonly suffix = input<string>('');

  protected readonly sizeConfig = computed(() => {
    const sizes = {
      small: { size: 60, stroke: 6 },
      medium: { size: 80, stroke: 8 },
      large: { size: 120, stroke: 10 },
    };
    return sizes[this.size()];
  });

  protected readonly center = computed(() => this.sizeConfig().size / 2);
  protected readonly radius = computed(() => (this.sizeConfig().size - this.sizeConfig().stroke) / 2);
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());
  protected readonly viewBox = computed(() => `0 0 ${this.sizeConfig().size} ${this.sizeConfig().size}`);
  protected readonly strokeWidth = computed(() => this.sizeConfig().stroke);

  protected readonly percentage = computed(() =>
    Math.min(100, Math.max(0, (this.value() / this.maxValue()) * 100))
  );

  protected readonly strokeDashoffset = computed(() =>
    this.circumference() - (this.percentage() / 100) * this.circumference()
  );

  protected readonly displayValue = computed(() =>
    this.showValue() ? `${Math.round(this.value())}${this.suffix()}` : ''
  );
}
