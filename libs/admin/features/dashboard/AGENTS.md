# AGENTS.md - Admin: Dashboard Feature

**Parent Documentation**: [`../../AGENTS.md` (Root)](../../../../AGENTS.md)

## Overview

The admin dashboard provides comprehensive system overview, metrics, and management tools for administrators. Includes team management, activity monitoring, and configuration controls.

## Feature Structure

```
libs/admin/features/dashboard/
├── src/
│   ├── lib/
│   │   ├── components/          # Dashboard widgets and panels
│   │   ├── services/            # Dashboard data and logic
│   │   ├── state/               # Dashboard state management
│   │   └── routes/              # Feature routing
│   └── index.ts                 # Public API
└── project.json
```

## Key Components & Services

- **DashboardComponent** - Main dashboard container/layout
- **MetricsWidgetComponent** - Key metrics display
- **TeamOverviewComponent** - Team status and activity
- **ActivityFeedComponent** - System activity timeline
- **DashboardService** - Dashboard data aggregation
- **MetricsService** - Real-time metrics updates

## Development Commands

```bash
# Serve admin app with dashboard
npm run serve:admin                    # Port 4201 with admin dashboard

# Test dashboard feature
nx test admin-dashboard                # All dashboard tests
nx test admin-dashboard --testFile=dashboard.component.spec.ts
nx test admin-dashboard -- --grep "metrics"

# Lint and fix
nx lint admin-dashboard
nx lint admin-dashboard -- --fix

# Build admin app
nx build admin
```

## Common Tasks

### Adding New Metrics Widget

1. Create new component extending `MetricsWidgetComponent`
2. Add data source in `DashboardService`
3. Update main dashboard layout
4. Wire up real-time updates via WebSocket
5. Add styling and responsive behavior

```typescript
// Example: Create custom metrics widget
@Component({
  selector: 'lib-custom-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="guiders-widget">
      <h3>{{ title }}</h3>
      <div class="guiders-widget__content">
        <p class="guiders-widget__metric">{{ metric() }}</p>
        <p class="guiders-widget__trend" [class]="trendClass()">
          {{ trendText() }}
        </p>
      </div>
    </div>
  `,
})
export class CustomMetricsComponent {
  readonly title = input<string>('Metric Title');
  readonly metric = input.required<number>();
  readonly trend = input<number>(0);
  readonly trendClass = computed(() => (this.trend() >= 0 ? 'guiders-widget__trend--up' : 'guiders-widget__trend--down'));
}
```

### Implementing Real-time Metrics Updates

- Use WebSocket connection for live updates
- Subscribe to metric events
- Update signals when new data arrives
- Show loading states appropriately

### Styling Dashboard Widgets

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.guiders-dashboard {
  padding: tokens.$spacing-lg;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: tokens.$spacing-lg;

  &__widget {
    background: tokens.$color-bg-primary;
    border: 1px solid tokens.$color-border-light;
    border-radius: tokens.$border-radius-lg;
    padding: tokens.$spacing-lg;

    &:hover {
      border-color: tokens.$color-border-primary;
      box-shadow: tokens.$shadow-sm;
    }

    &__title {
      font-size: tokens.$font-size-lg;
      font-weight: 600;
      margin-bottom: tokens.$spacing-md;
      color: tokens.$color-text-primary;
    }

    &__metric {
      font-size: tokens.$font-size-xxl;
      font-weight: 700;
      color: tokens.$color-secondary;
      margin: 0;
    }

    &__trend {
      font-size: tokens.$font-size-sm;
      margin-top: tokens.$spacing-sm;

      &--up {
        color: tokens.$color-success;

        &::before {
          content: '↑ ';
        }
      }

      &--down {
        color: tokens.$color-error;

        &::before {
          content: '↓ ';
        }
      }
    }
  }
}
```

## Architecture Rules

Dashboard (type: feature) can import from:

- ✅ `@guiders-frontend/shared/ui/*` (UI components)
- ✅ `@guiders-frontend/shared/util/*` (utilities)
- ✅ `@guiders-frontend/admin/data-access/*` (admin services)
- ✅ `@guiders-frontend/analytics/data-access/*` (metrics)
- ✅ `@guiders-frontend/shared/types/*` (types)
- ✅ `@guiders-frontend/chat/data-access/*` (chat data)

Dashboard CANNOT import from:

- ❌ Other feature modules directly
- ❌ Relative paths across domain boundaries

## Testing Guidelines

```typescript
// Test metrics loading
it('should load dashboard metrics on init', fakeAsync(() => {
  component.ngOnInit();
  tick();

  expect(component.metrics()).toBeTruthy();
  expect(component.isLoading()).toBe(false);
}));

// Test real-time updates
it('should update metrics on WebSocket message', fakeAsync(() => {
  component.metrics.set({ activeOperators: 5 });

  metricsService.metricsUpdated.emit({ activeOperators: 6 });
  tick();

  expect(component.metrics()).toEqual({ activeOperators: 6 });
}));

// Test widget rendering
it('should render all metric widgets', () => {
  component.metrics.set(mockMetrics());
  fixture.detectChanges();

  const widgets = fixture.debugElement.queryAll(
    By.css('.guiders-dashboard__widget')
  );

  expect(widgets.length).toBeGreaterThan(0);
}));

// Test error handling
it('should show error message when metrics fail to load', fakeAsync(() => {
  dashboardService.getMetrics.and.returnValue(throwError('API Error'));

  component.ngOnInit();
  tick();

  expect(component.error()).toBeTruthy();
  expect(component.isLoading()).toBe(false);
}));
```

## Key Files to Know

| File                                                            | Purpose               |
| --------------------------------------------------------------- | --------------------- |
| `src/lib/components/dashboard/dashboard.component.ts`           | Main dashboard layout |
| `src/lib/components/metrics-widget/metrics-widget.component.ts` | Base widget           |
| `src/lib/components/team-overview/team-overview.component.ts`   | Team status           |
| `src/lib/components/activity-feed/activity-feed.component.ts`   | Activity timeline     |
| `src/lib/services/dashboard.service.ts`                         | Data aggregation      |
| `src/lib/services/metrics.service.ts`                           | Real-time metrics     |
| `src/index.ts`                                                  | Public API exports    |

## Performance Considerations

- **Lazy Loading**: Load widgets on demand, not all at startup
- **Caching**: Cache metrics with 2-minute expiry
- **Change Detection**: `ChangeDetectionStrategy.OnPush` on all components
- **WebSocket**: Unsubscribe from metric streams when component destroyed
- **Memory**: Clean up timers and intervals in ngOnDestroy

## Responsive Design

```scss
// Mobile-first responsive layout
.guiders-dashboard {
  // Mobile: single column
  grid-template-columns: 1fr;

  @media (min-width: 768px) {
    // Tablet: 2 columns
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    // Desktop: 3+ columns
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
```

## Debugging

**Metrics Not Loading**:

- Check browser network tab for API calls
- Verify metrics endpoint in environment
- Check service error handling

**Real-time Updates Not Working**:

- Verify WebSocket connection is active
- Check that subscription is to correct topic
- Look for memory leaks in ngOnDestroy

**Performance Issues**:

- Use Chrome Performance tab to profile
- Check for excessive change detection
- Monitor memory usage with many widgets

## Related Features

- **Users** (`libs/admin/features/users`) - User management
- **AI Config** (`libs/admin/features/ai-config`) - AI settings
- **Integrations** (`libs/admin/features/integrations`) - Third-party integrations
- **Analytics** (`libs/analytics/features/admin-dashboard`) - Detailed analytics

## Common Workflows

### Monitoring System Health

1. View dashboard on admin portal
2. Monitor key metrics (active operators, conversations)
3. Check system alerts/warnings
4. View real-time activity feed
5. Drill down into specific metrics for details

### Managing Team Performance

1. View team overview widget
2. See individual operator metrics
3. Identify bottlenecks or issues
4. Take action (reassign, escalate, etc.)

### Viewing System Activity

1. Check activity feed for recent events
2. Filter by type (escalations, errors, etc.)
3. Click event for details
4. Take necessary action

## See Also

- [Root AGENTS.md](../../../../AGENTS.md) - General guidelines
- [Users Feature](../users/AGENTS.md) - User management
- [Admin Data Access](../../../../libs/admin/data-access/) - API documentation
- [Analytics Dashboard](../../../../libs/analytics/features/admin-dashboard/AGENTS.md) - Detailed metrics
- [Shared UI](../../../../libs/shared/ui/) - Component library
