import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DonutChart, DonutChartVariant, DonutChartSize } from '@guiders-frontend/donut-chart';

@Component({
  selector: 'guiders-activity-stat-card',
  imports: [CommonModule, DonutChart],
  templateUrl: './activity-stat-card.html',
  styleUrl: './activity-stat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityStatCard {
  readonly value = input.required<number>();
  readonly maxValue = input<number>(100);
  readonly label = input.required<string>();
  readonly subtitle = input<string>();
  readonly variant = input<DonutChartVariant>('primary');
  readonly size = input<DonutChartSize>('medium');
}
