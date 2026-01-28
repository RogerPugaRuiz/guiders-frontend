# AGENTS.md - Chat: Escalations Feature

**Parent Documentation**: [`../../AGENTS.md` (Root)](../../../../AGENTS.md)

## Overview

The escalations feature manages ticket escalation workflows. Operators can escalate conversations to supervisors, specialists, or support teams. Includes escalation tracking, assignment, and resolution management.

## Feature Structure

```
libs/chat/features/escalations/
├── src/
│   ├── lib/
│   │   ├── components/          # Escalation UI components
│   │   ├── services/            # Escalation logic and state
│   │   ├── state/               # Escalation state management
│   │   └── routes/              # Feature routing
│   └── index.ts                 # Public API
└── project.json
```

## Key Components & Services

- **EscalationsListComponent** - List of escalated tickets
- **EscalationDetailComponent** - Single escalation view
- **CreateEscalationComponent** - Escalation creation form
- **EscalationAssignmentComponent** - Assignment to teams/users
- **EscalationsService** - Escalation API and state
- **EscalationStatusService** - Status tracking and workflow

## Development Commands

```bash
# Serve with escalations feature
npm run serve                              # Full console app

# Test escalations feature
nx test chat-escalations                   # All tests
nx test chat-escalations --testFile=escalations-list.component.spec.ts
nx test chat-escalations -- --grep "assign"

# Lint and fix
nx lint chat-escalations
nx lint chat-escalations -- --fix

# E2E tests for escalations
nx e2e console-e2e -- --grep "escalation"
```

## Common Tasks

### Creating an Escalation

1. Open conversation in Inbox
2. Click "Escalate" button
3. Select escalation type (supervisor, specialist, team)
4. Add reason/notes
5. Confirm and create ticket

```typescript
// Example: Create escalation
createEscalation(conversationId: string, reason: string): void {
  const escalation: CreateEscalationDTO = {
    conversationId,
    reason,
    priority: 'high',
    type: 'supervisor',
    createdAt: new Date(),
  };

  this.escalationsService.create(escalation).subscribe({
    next: (result) => {
      this.currentEscalation.set(result);
      this.showSuccessMessage('Escalation created');
    },
    error: (err) => this.handleError(err),
  });
}
```

### Assigning Escalations

```typescript
// Example: Assign escalation to team
assignEscalation(escalationId: string, teamId: string): void {
  this.escalationsService.assign(escalationId, teamId).subscribe({
    next: () => this.refreshEscalation(),
    error: (err) => this.handleError(err),
  });
}
```

### Tracking Escalation Status

- Status transitions: `pending` → `assigned` → `in_progress` → `resolved` → `closed`
- Show status badges with colors
- Track SLA (Service Level Agreement) timers
- Send notifications on status changes

### Resolving Escalations

```typescript
// Example: Resolve escalation
resolveEscalation(escalationId: string, resolution: string): void {
  const update: UpdateEscalationDTO = {
    status: 'resolved',
    resolutionNotes: resolution,
    resolvedAt: new Date(),
  };

  this.escalationsService.update(escalationId, update).subscribe({
    next: () => {
      this.currentEscalation.set({ ...this.currentEscalation(), ...update });
      this.showSuccessMessage('Escalation resolved');
    },
  });
}
```

### Styling Escalation Status Indicators

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.guiders-escalation {
  padding: tokens.$spacing-md;
  border-left: 4px solid tokens.$color-border-light;

  &__status {
    display: inline-flex;
    align-items: center;
    padding: tokens.$spacing-xs tokens.$spacing-sm;
    border-radius: tokens.$border-radius-sm;
    font-size: tokens.$font-size-sm;
    font-weight: 600;

    &--pending {
      background: tokens.$color-warning-light;
      color: tokens.$color-warning;
      border-left-color: tokens.$color-warning;
    }

    &--assigned {
      background: tokens.$color-info-light;
      color: tokens.$color-info;
      border-left-color: tokens.$color-info;
    }

    &--in-progress {
      background: tokens.$color-secondary-light;
      color: tokens.$color-secondary;
      border-left-color: tokens.$color-secondary;
    }

    &--resolved {
      background: tokens.$color-success-light;
      color: tokens.$color-success;
      border-left-color: tokens.$color-success;
    }

    &--closed {
      background: tokens.$color-text-secondary-light;
      color: tokens.$color-text-secondary;
      border-left-color: tokens.$color-text-secondary;
    }
  }

  &__sla {
    &--breached {
      color: tokens.$color-error;
      font-weight: 600;
    }

    &--warning {
      color: tokens.$color-warning;
    }

    &--ok {
      color: tokens.$color-success;
    }
  }
}
```

## Architecture Rules

Escalations (type: feature) can import from:

- ✅ `@guiders-frontend/shared/ui/*` (UI components)
- ✅ `@guiders-frontend/shared/util/*` (utilities)
- ✅ `@guiders-frontend/chat/data-access/*` (chat services)
- ✅ `@guiders-frontend/shared/types/*` (types)

Escalations CANNOT import from:

- ❌ `@guiders-frontend/admin/*`
- ❌ `@guiders-frontend/analytics/*`

## Testing Guidelines

```typescript
// Test escalation creation
it('should create escalation with required fields', fakeAsync(() => {
  const dto: CreateEscalationDTO = {
    conversationId: '123',
    reason: 'Complex technical issue',
    type: 'specialist',
  };

  component.createEscalation(dto);
  tick();

  expect(escalationsService.create).toHaveBeenCalledWith(dto);
  expect(component.currentEscalation()).toEqual(mockEscalation());
}));

// Test escalation assignment
it('should assign escalation to team', fakeAsync(() => {
  const escalationId = '456';
  const teamId = 'support-team';

  component.assignEscalation(escalationId, teamId);
  tick();

  expect(escalationsService.assign).toHaveBeenCalledWith(escalationId, teamId);
}));

// Test SLA tracking
it('should show SLA warning when approaching deadline', () => {
  const escalation = mockEscalation({
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    slaMinutes: 240, // 4 hour SLA
  });

  component.escalation.set(escalation);

  expect(component.slaStatus()).toBe('warning');
});

// Test status transition
it('should transition from assigned to in_progress', fakeAsync(() => {
  component.escalation.set(mockEscalation({ status: 'assigned' }));

  component.updateStatus('in_progress');
  tick();

  expect(escalationsService.update).toHaveBeenCalled();
}));
```

## Key Files to Know

| File                                                                          | Purpose                |
| ----------------------------------------------------------------------------- | ---------------------- |
| `src/lib/components/escalations-list/escalations-list.component.ts`           | List all escalations   |
| `src/lib/components/escalation-detail/escalation-detail.component.ts`         | Single escalation view |
| `src/lib/components/create-escalation/create-escalation.component.ts`         | Escalation form        |
| `src/lib/components/escalation-assignment/escalation-assignment.component.ts` | Assignment UI          |
| `src/lib/services/escalations.service.ts`                                     | API and state          |
| `src/lib/services/escalation-status.service.ts`                               | Status workflow        |
| `src/index.ts`                                                                | Public API exports     |

## Performance Considerations

- **Real-time Updates**: WebSocket for escalation status changes
- **SLA Tracking**: Use server-side SLA timers, update periodically
- **Memory**: Cache escalation list with 10-minute expiry
- **Change Detection**: `ChangeDetectionStrategy.OnPush` everywhere

## SLA Management Example

```typescript
// Track SLA with interval updates
startSLATracking(escalationId: string, slaMinutes: number): void {
  this.slaInterval = setInterval(() => {
    const elapsed = Date.now() - this.createdTime;
    const remaining = slaMinutes * 60 * 1000 - elapsed;

    if (remaining <= 0) {
      this.slaStatus.set('breached');
      clearInterval(this.slaInterval);
    } else if (remaining < slaMinutes * 60 * 1000 * 0.2) {
      this.slaStatus.set('warning');
    } else {
      this.slaStatus.set('ok');
    }
  }, 60000); // Update every minute
}
```

## Debugging

**Escalation Not Creating**:

- Check API endpoint in environment
- Verify required fields are provided
- Look for validation errors from backend

**Status Updates Not Reflecting**:

- Verify WebSocket connection is active
- Check that component is subscribed to updates
- Verify service is pushing state changes

**SLA Not Calculating Correctly**:

- Verify server time is synchronized
- Check SLA policy configuration
- Verify createdAt timestamp is set correctly

## Related Features

- **Inbox** (`libs/chat/features/inbox`) - Conversation context
- **Visitors** (`libs/chat/features/visitors`) - Visitor information
- **Contacts** (`libs/chat/features/contacts`) - Contact details
- **Admin Dashboard** (`libs/admin/features/dashboard`) - Team management

## Common Workflows

### Escalating a Conversation

1. Operator encounters complex issue in Inbox
2. Clicks "Escalate" button
3. Selects escalation type (supervisor/specialist)
4. Fills reason/notes
5. Confirms - creates escalation ticket
6. Conversation linked to escalation
7. Supervisor/specialist is notified

### Managing Escalation Workload

1. Supervisor views escalations dashboard
2. Filters by status, priority, team
3. Assigns escalations to specialists
4. Tracks SLA timers
5. Updates status as work progresses
6. Resolves and closes tickets

### Escalation Reporting

1. View escalation metrics by type
2. Track average resolution time
3. Identify bottlenecks
4. Monitor SLA compliance

## See Also

- [Root AGENTS.md](../../../../AGENTS.md) - General guidelines
- [Inbox Feature](../inbox/AGENTS.md) - Conversation management
- [Chat Data Access](../../../../libs/chat/data-access/) - API documentation
- [Shared Types](../../../../libs/shared/types/) - Type definitions
- [Admin Dashboard](../admin/features/dashboard/AGENTS.md) - Team management
