import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TrendDirection = 'up' | 'down' | 'neutral';

@Component({
  selector: 'guiders-activity-stat-card',
  imports: [CommonModule],
  templateUrl: './activity-stat-card.html',
  styleUrl: './activity-stat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityStatCard {
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  readonly subtitle = input<string>();
  readonly trendChange = input<number>(0);
  readonly trendPercentage = input<number>(0);
  readonly trendDirection = input<TrendDirection>('neutral');

  readonly trendIcon = computed(() => {
    const direction = this.trendDirection();
    if (direction === 'up') return '↑';
    if (direction === 'down') return '↓';
    return '→';
  });

  readonly trendClasses = computed(() => ({
    'activity-stat-card__trend': true,
    'activity-stat-card__trend--up': this.trendDirection() === 'up',
    'activity-stat-card__trend--down': this.trendDirection() === 'down',
    'activity-stat-card__trend--neutral': this.trendDirection() === 'neutral',
  }));
}
