# AGENTS.md - Analytics: Admin Dashboard Feature

**Parent Documentation**: [`../../AGENTS.md` (Root)](../../../../AGENTS.md)

## Overview

The analytics admin dashboard provides detailed metrics, reporting, and analytics for system administrators. Includes conversation analytics, operator performance metrics, customer satisfaction scores, and trend analysis.

## Feature Structure

```
libs/analytics/features/admin-dashboard/
├── src/
│   ├── lib/
│   │   ├── components/          # Analytics UI components
│   │   ├── services/            # Analytics data and calculations
│   │   ├── state/               # Analytics state management
│   │   └── routes/              # Feature routing
│   └── index.ts                 # Public API
└── project.json
```

## Key Components & Services

- **AnalyticsDashboardComponent** - Main dashboard layout
- **ConversationMetricsComponent** - Conversation analytics
- **OperatorPerformanceComponent** - Operator metrics
- **CustomerSatisfactionComponent** - CSAT/NPS data
- **TrendAnalysisComponent** - Trend charts and forecasts
- **ReportsComponent** - Report generation and export
- **AnalyticsService** - Metrics aggregation and calculations
- **ReportService** - Report generation

## Development Commands

```bash
# Serve admin with analytics
npm run serve:admin                    # Port 4201

# Test analytics feature
nx test analytics-admin-dashboard      # All tests
nx test analytics-admin-dashboard --testFile=analytics-dashboard.component.spec.ts
nx test analytics-admin-dashboard -- --grep "metrics"

# Lint and fix
nx lint analytics-admin-dashboard
nx lint analytics-admin-dashboard -- --fix

# E2E tests for analytics
nx e2e admin-e2e -- --grep "analytics"
```

## Common Tasks

### Viewing Conversation Metrics

1. Navigate to Analytics Dashboard
2. View conversation statistics (total, active, closed)
3. See average response time
4. Check message volume trends
5. Filter by date range or team

```typescript
// Example: Load conversation metrics
loadConversationMetrics(filters: MetricsFilter): void {
  this.analyticsService.getConversationMetrics(filters).subscribe({
    next: (metrics) => {
      this.conversationMetrics.set(metrics);
      this.updateCharts(metrics);
    },
    error: (err) => this.handleError(err),
  });
}
```

### Tracking Operator Performance

```typescript
// Example: Get operator performance
loadOperatorMetrics(teamId?: string): void {
  this.analyticsService.getOperatorMetrics(teamId).subscribe({
    next: (metrics) => {
      this.operatorMetrics.set(metrics);
      this.sortOperators(metrics);
    },
    error: (err) => this.handleError(err),
  });
}

// Example: Track KPIs
interface OperatorKPI {
  operatorId: string;
  name: string;
  conversationsHandled: number;
  averageResolutionTime: number;
  firstResponseTime: number;
  customerSatisfaction: number;
  escalationRate: number;
  idleTime: number;
}
```

### Analyzing Customer Satisfaction

```typescript
// Example: Get satisfaction metrics
loadSatisfactionMetrics(period: DateRange): void {
  this.analyticsService.getSatisfactionMetrics(period).subscribe({
    next: (data) => {
      this.csat.set(data.csat);
      this.nps.set(data.nps);
      this.satisfaction.set(data.byReason);
    },
    error: (err) => this.handleError(err),
  });
}

// Example: CSAT breakdown
interface SatisfactionMetrics {
  csat: number;                  // Customer Satisfaction (0-100)
  nps: number;                   // Net Promoter Score (-100 to 100)
  totalResponses: number;
  byReason: {
    reason: string;
    count: number;
    percentage: number;
  }[];
}
```

### Generating Reports

```typescript
// Example: Generate and export report
generateReport(config: ReportConfig): void {
  this.reportService.generate(config).subscribe({
    next: (report) => {
      this.exportReport(report, config.format);
      this.showSuccessMessage('Report generated');
    },
    error: (err) => this.handleError(err),
  });
}

// Example: Export options
type ReportFormat = 'pdf' | 'csv' | 'excel' | 'json';

interface ReportConfig {
  type: 'conversation' | 'performance' | 'satisfaction';
  dateRange: DateRange;
  filters: MetricsFilter;
  format: ReportFormat;
}
```

### Creating Trend Analysis

```typescript
// Example: Analyze trends
analyzeTrends(metric: string, period: number): void {
  this.analyticsService.getTrendData(metric, period).subscribe({
    next: (data) => {
      this.chartData.set(data.points);
      this.trendDirection.set(data.trend);
      this.forecastData.set(data.forecast);
    },
    error: (err) => this.handleError(err),
  });
}
```

### Styling Analytics Charts

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.guiders-analytics {
  padding: tokens.$spacing-lg;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: tokens.$spacing-lg;

    &-actions {
      display: flex;
      gap: tokens.$spacing-md;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: tokens.$spacing-lg;
    margin-bottom: tokens.$spacing-lg;
  }

  &__card {
    background: tokens.$color-bg-primary;
    border: 1px solid tokens.$color-border-light;
    border-radius: tokens.$border-radius-lg;
    padding: tokens.$spacing-lg;

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
      margin-bottom: tokens.$spacing-sm;
    }

    &__subtitle {
      font-size: tokens.$font-size-sm;
      color: tokens.$color-text-secondary;
    }
  }

  &__chart {
    width: 100%;
    height: 300px;
    margin-top: tokens.$spacing-md;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: tokens.$color-bg-secondary;
      font-weight: 600;
    }

    th,
    td {
      padding: tokens.$spacing-md;
      text-align: left;
      border-bottom: 1px solid tokens.$color-border-light;
    }

    tbody tr {
      &:hover {
        background: tokens.$color-bg-hover;
      }
    }
  }

  &__filter {
    display: flex;
    gap: tokens.$spacing-md;
    margin-bottom: tokens.$spacing-lg;
    flex-wrap: wrap;

    &-group {
      display: flex;
      flex-direction: column;

      label {
        font-size: tokens.$font-size-sm;
        font-weight: 600;
        margin-bottom: tokens.$spacing-xs;
      }

      select,
      input {
        padding: tokens.$spacing-sm;
        border: 1px solid tokens.$color-border-light;
        border-radius: tokens.$border-radius-sm;
      }
    }
  }
}
```

## Architecture Rules

Analytics (type: feature) can import from:

- ✅ `@guiders-frontend/shared/ui/*` (UI components)
- ✅ `@guiders-frontend/shared/util/*` (utilities)
- ✅ `@guiders-frontend/analytics/data-access/*` (analytics services)
- ✅ `@guiders-frontend/chat/data-access/*` (chat metrics)
- ✅ `@guiders-frontend/shared/types/*` (types)

Analytics CANNOT import from:

- ❌ Other domain features directly
- ❌ Relative paths across boundaries

## Testing Guidelines

```typescript
// Test conversation metrics loading
it('should load conversation metrics', fakeAsync(() => {
  const filters: MetricsFilter = {
    dateRange: { start: new Date(), end: new Date() },
  };

  component.loadConversationMetrics(filters);
  tick();

  expect(analyticsService.getConversationMetrics).toHaveBeenCalledWith(filters);
  expect(component.conversationMetrics()).toBeTruthy();
}));

// Test operator performance metrics
it('should load operator performance metrics', fakeAsync(() => {
  component.loadOperatorMetrics();
  tick();

  expect(analyticsService.getOperatorMetrics).toHaveBeenCalled();
  expect(component.operatorMetrics()).toBeTruthy();
}));

// Test satisfaction metrics
it('should load satisfaction metrics by period', fakeAsync(() => {
  const period = { start: new Date(), end: new Date() };

  component.loadSatisfactionMetrics(period);
  tick();

  expect(component.csat()).toBeGreaterThanOrEqual(0);
  expect(component.nps()).toBeLessThanOrEqual(100);
}));

// Test report generation
it('should generate report in specified format', fakeAsync(() => {
  const config: ReportConfig = {
    type: 'performance',
    dateRange: { start: new Date(), end: new Date() },
    format: 'pdf',
  };

  component.generateReport(config);
  tick();

  expect(reportService.generate).toHaveBeenCalledWith(config);
}));

// Test trend analysis
it('should analyze trends and provide forecast', fakeAsync(() => {
  component.analyzeTrends('conversations', 7);
  tick();

  expect(component.chartData()).toBeTruthy();
  expect(component.forecastData()).toBeTruthy();
}));
```

## Key Files to Know

| File                                                                          | Purpose             |
| ----------------------------------------------------------------------------- | ------------------- |
| `src/lib/components/analytics-dashboard/analytics-dashboard.component.ts`     | Main dashboard      |
| `src/lib/components/conversation-metrics/conversation-metrics.component.ts`   | Conversation stats  |
| `src/lib/components/operator-performance/operator-performance.component.ts`   | Operator metrics    |
| `src/lib/components/customer-satisfaction/customer-satisfaction.component.ts` | CSAT/NPS            |
| `src/lib/components/trend-analysis/trend-analysis.component.ts`               | Trends & forecasts  |
| `src/lib/components/reports/reports.component.ts`                             | Report generation   |
| `src/lib/services/analytics.service.ts`                                       | Metrics aggregation |
| `src/lib/services/report.service.ts`                                          | Report generation   |
| `src/index.ts`                                                                | Public API exports  |

## Key Metrics to Track

```typescript
interface DashboardMetrics {
  // Conversation Metrics
  totalConversations: number;
  activeConversations: number;
  closedConversations: number;
  averageResolutionTime: Duration;
  averageResponseTime: Duration;

  // Operator Metrics
  totalOperators: number;
  activeOperators: number;
  averageConversationsPerOperator: number;
  teamUtilization: Percentage;

  // Satisfaction Metrics
  csat: Percentage;
  nps: number;
  responseRate: Percentage;

  // Business Metrics
  totalMessages: number;
  messageVolume: number; // per day/hour
  peak Hours: HourRange[];
  escalationRate: Percentage;
}
```

## Performance Considerations

- **Data Aggregation**: Aggregate metrics server-side, not client-side
- **Caching**: Cache metrics with 15-minute TTL
- **Chart Library**: Use lightweight charting (Chart.js, Recharts)
- **Virtual Scrolling**: Use for large analytics tables
- **Change Detection**: `ChangeDetectionStrategy.OnPush`

## Report Types

```typescript
type ReportType =
  | 'conversation' // Conversation volume, timing, resolution
  | 'performance' // Operator performance metrics
  | 'satisfaction' // CSAT, NPS, feedback reasons
  | 'trends' // Metric trends and forecasts
  | 'executive' // High-level summary for executives
  | 'operational'; // Detailed operational metrics
```

## Debugging

**Metrics Not Loading**:

- Check API endpoint is correct
- Verify date range is valid
- Look for filtering issues
- Check browser network tab

**Charts Not Rendering**:

- Verify charting library is loaded
- Check data format matches chart requirements
- Verify chart container has height/width
- Look for JavaScript errors

**Report Generation Failing**:

- Check report service endpoint
- Verify date range is valid
- Check available memory for large reports
- Look for timeout issues

## Related Features

- **Admin Dashboard** (`libs/admin/features/dashboard`) - System overview
- **Users** (`libs/admin/features/users`) - Team management
- **Inbox** (`libs/chat/features/inbox`) - Conversation source

## Common Workflows

### Daily Operations Review

1. Open Analytics Dashboard
2. Check conversation metrics (volume, resolution time)
3. Review operator performance
4. Identify any issues or bottlenecks
5. Take corrective action if needed

### Weekly Performance Report

1. Navigate to Reports section
2. Select "Performance Report"
3. Choose date range (last 7 days)
4. Click "Generate"
5. Download as PDF or Excel
6. Share with management

### Trend Analysis and Forecasting

1. Open Trend Analysis section
2. Select metric to analyze (conversations, satisfaction)
3. Choose analysis period
4. View historical trend
5. Review forecast predictions
6. Plan capacity/staffing based on forecast

### Satisfaction Analysis

1. View CSAT and NPS scores
2. Check feedback reasons breakdown
3. Identify trending issues
4. Create action plan
5. Monitor improvement over time

## See Also

- [Root AGENTS.md](../../../../AGENTS.md) - General guidelines
- [Admin Dashboard](../../../../libs/admin/features/dashboard/AGENTS.md) - System overview
- [Analytics Data Access](../../../../libs/analytics/data-access/) - API documentation
- [Shared Types](../../../../libs/shared/types/) - Type definitions
- [Shared UI](../../../../libs/shared/ui/) - Chart and table components
