import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-heat-index-badge',
  imports: [],
  templateUrl: './heat-index-badge.html',
  styleUrl: './heat-index-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatIndexBadge {}
