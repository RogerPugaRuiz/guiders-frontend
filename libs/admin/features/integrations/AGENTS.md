# AGENTS.md - Admin: Integrations Feature

**Parent Documentation**: [`../../AGENTS.md` (Root)](../../../../AGENTS.md)

## Overview

The integrations feature manages third-party service connections. Includes OAuth setup, API key management, webhook configuration, and integration status monitoring.

## Feature Structure

```
libs/admin/features/integrations/
├── src/
│   ├── lib/
│   │   ├── components/          # Integration UI components
│   │   ├── services/            # Integration management
│   │   ├── state/               # Integration state
│   │   └── routes/              # Feature routing
│   └── index.ts                 # Public API
└── project.json
```

## Key Components & Services

- **IntegrationsListComponent** - List of available integrations
- **IntegrationDetailComponent** - Single integration setup
- **OAuthSetupComponent** - OAuth configuration UI
- **APIKeyManagementComponent** - API key handling
- **WebhookConfigComponent** - Webhook setup
- **IntegrationsService** - Integration API and state
- **IntegrationStatusService** - Real-time status monitoring

## Development Commands

```bash
# Serve admin with integrations
npm run serve:admin                    # Port 4201

# Test integrations feature
nx test admin-integrations             # All tests
nx test admin-integrations --testFile=integrations-list.component.spec.ts
nx test admin-integrations -- --grep "oauth"

# Lint and fix
nx lint admin-integrations
nx lint admin-integrations -- --fix
```

## Common Tasks

### Setting Up OAuth Integration

1. Navigate to Integrations
2. Find integration (Slack, Teams, etc.)
3. Click "Configure"
4. Authorize with OAuth
5. Grant necessary permissions
6. Confirm integration is active

```typescript
// Example: Initiate OAuth flow
initiateOAuthFlow(integrationId: string): void {
  this.integrationsService.getOAuthUrl(integrationId).subscribe({
    next: (response) => {
      window.open(response.authUrl, '_blank', 'width=800,height=600');
      this.pendingIntegrationId.set(integrationId);
    },
    error: (err) => this.handleError(err),
  });
}

// Example: Complete OAuth callback
completeOAuthFlow(code: string, state: string): void {
  this.integrationsService.completeOAuth(code, state).subscribe({
    next: (result) => {
      this.loadIntegrations();
      this.showSuccessMessage('Integration connected');
    },
    error: (err) => this.handleError(err),
  });
}
```

### Managing API Keys

```typescript
// Example: Generate API key
generateAPIKey(integrationId: string): void {
  this.integrationsService.generateAPIKey(integrationId).subscribe({
    next: (key) => {
      this.apiKeys.set([...this.apiKeys(), key]);
      this.showSuccessMessage('API key generated');
    },
    error: (err) => this.handleError(err),
  });
}

// Example: Revoke API key
revokeAPIKey(keyId: string): void {
  this.integrationsService.revokeAPIKey(keyId).subscribe({
    next: () => {
      this.apiKeys.set(this.apiKeys().filter(k => k.id !== keyId));
      this.showSuccessMessage('API key revoked');
    },
  });
}
```

### Configuring Webhooks

```typescript
// Example: Setup webhook
setupWebhook(integrationId: string, config: WebhookConfig): void {
  this.integrationsService.setupWebhook(integrationId, config).subscribe({
    next: () => {
      this.webhookConfig.set(config);
      this.showSuccessMessage('Webhook configured');
    },
    error: (err) => this.handleError(err),
  });
}

// Example: Test webhook
testWebhook(integrationId: string): void {
  this.integrationsService.testWebhook(integrationId).subscribe({
    next: (result) => {
      this.webhookStatus.set(result);
      this.showSuccessMessage('Webhook test successful');
    },
    error: (err) => {
      this.webhookStatus.set(null);
      this.showErrorMessage('Webhook test failed');
    },
  });
}
```

### Monitoring Integration Status

- Show real-time status of each integration
- Track last successful sync
- Display error messages if integration fails
- Show usage metrics

### Styling Integration Cards

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.guiders-integrations {
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: tokens.$spacing-lg;
    padding: tokens.$spacing-lg;
  }

  &__card {
    border: 1px solid tokens.$color-border-light;
    border-radius: tokens.$border-radius-lg;
    padding: tokens.$spacing-lg;
    background: tokens.$color-bg-primary;
    transition: all tokens.$transition-normal;

    &:hover {
      border-color: tokens.$color-border-primary;
      box-shadow: tokens.$shadow-md;
    }

    &__header {
      display: flex;
      align-items: center;
      margin-bottom: tokens.$spacing-md;
    }

    &__icon {
      width: 48px;
      height: 48px;
      margin-right: tokens.$spacing-md;
      border-radius: tokens.$border-radius-md;
      background: tokens.$color-bg-secondary;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__status {
      display: inline-flex;
      align-items: center;
      gap: tokens.$spacing-xs;
      font-size: tokens.$font-size-sm;

      &--connected {
        color: tokens.$color-success;

        &::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: tokens.$color-success;
        }
      }

      &--disconnected {
        color: tokens.$color-error;

        &::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: tokens.$color-error;
        }
      }

      &--pending {
        color: tokens.$color-warning;

        &::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: tokens.$color-warning;
        }
      }
    }

    &__actions {
      display: flex;
      gap: tokens.$spacing-sm;
      margin-top: tokens.$spacing-md;

      button {
        flex: 1;
      }
    }
  }
}
```

## Architecture Rules

Integrations (type: feature) can import from:

- ✅ `@guiders-frontend/shared/ui/*` (UI components)
- ✅ `@guiders-frontend/shared/util/*` (utilities)
- ✅ `@guiders-frontend/admin/data-access/*` (admin services)
- ✅ `@guiders-frontend/shared/types/*` (types)

Integrations CANNOT import from:

- ❌ `@guiders-frontend/chat/*`
- ❌ `@guiders-frontend/analytics/*`

## Testing Guidelines

```typescript
// Test OAuth flow
it('should initiate OAuth flow and open popup', () => {
  spyOn(window, 'open');
  const integrationId = 'slack';

  component.initiateOAuthFlow(integrationId);

  expect(integrationsService.getOAuthUrl).toHaveBeenCalledWith(integrationId);
  expect(window.open).toHaveBeenCalled();
});

// Test OAuth completion
it('should complete OAuth flow and update integrations', fakeAsync(() => {
  component.completeOAuthFlow('auth-code-123', 'state-456');
  tick();

  expect(integrationsService.completeOAuth).toHaveBeenCalled();
  expect(component.loadIntegrations).toHaveBeenCalled();
}));

// Test API key generation
it('should generate and display API key', fakeAsync(() => {
  const integrationId = 'github';
  const generatedKey = mockAPIKey();

  component.generateAPIKey(integrationId);
  tick();

  expect(component.apiKeys()).toContain(generatedKey);
}));

// Test webhook configuration
it('should setup webhook and test connection', fakeAsync(() => {
  const config: WebhookConfig = {
    url: 'https://example.com/webhook',
    events: ['message.sent', 'conversation.closed'],
  };

  component.setupWebhook('slack', config);
  tick();

  expect(integrationsService.setupWebhook).toHaveBeenCalled();
}));

// Test integration status monitoring
it('should monitor and update integration status', fakeAsync(() => {
  component.loadIntegrations();
  tick();

  expect(component.integrations()).toBeTruthy();
  expect(component.integrations().some((i) => i.status === 'connected')).toBe(true);
}));
```

## Key Files to Know

| File                                                                    | Purpose               |
| ----------------------------------------------------------------------- | --------------------- |
| `src/lib/components/integrations-list/integrations-list.component.ts`   | Integration directory |
| `src/lib/components/integration-detail/integration-detail.component.ts` | Setup interface       |
| `src/lib/components/oauth-setup/oauth-setup.component.ts`               | OAuth flow            |
| `src/lib/components/api-key-management/api-key-management.component.ts` | Key management        |
| `src/lib/components/webhook-config/webhook-config.component.ts`         | Webhook setup         |
| `src/lib/services/integrations.service.ts`                              | API and state         |
| `src/lib/services/integration-status.service.ts`                        | Status tracking       |
| `src/index.ts`                                                          | Public API exports    |

## Supported Integrations

| Integration     | Type    | Use Case             |
| --------------- | ------- | -------------------- |
| Slack           | OAuth   | Team messaging       |
| Microsoft Teams | OAuth   | Enterprise messaging |
| GitHub          | API Key | Code repository      |
| Jira            | OAuth   | Issue tracking       |
| Zendesk         | API Key | Customer support     |
| Salesforce      | OAuth   | CRM integration      |
| Stripe          | API Key | Payment processing   |

## Performance Considerations

- **Status Polling**: Poll integration status every 30 seconds
- **Caching**: Cache integration list with 5-minute TTL
- **OAuth Timeout**: Set 5-minute timeout for OAuth flows
- **API Key Security**: Never log or display full API keys

## Security Considerations

```typescript
// API Key best practices
interface APIKeyBestPractices {
  // Never store in localStorage or sessionStorage
  // Always use secure HTTP-only cookies
  // Rotate keys regularly
  // Implement key expiration
  // Audit key usage
  // Support key rotation without downtime
}

// OAuth security
interface OAuthSecurity {
  // Use PKCE flow for SPA
  // Validate state parameter
  // Implement CSRF protection
  // Store tokens securely
  // Refresh tokens regularly
  // Revoke tokens on logout
}
```

## Debugging

**OAuth Not Connecting**:

- Check OAuth credentials in environment
- Verify redirect URI matches
- Check browser console for popup blocked
- Verify state parameter matches

**Webhook Not Receiving Events**:

- Test webhook endpoint with test request
- Check network logs for failed requests
- Verify webhook URL is accessible
- Check server logs for errors

**API Key Not Working**:

- Verify key hasn't expired
- Check API rate limits
- Verify key has required permissions
- Look for API error messages

## Related Features

- **Dashboard** (`libs/admin/features/dashboard`) - System overview
- **Users** (`libs/admin/features/users`) - Team management
- **AI Config** (`libs/admin/features/ai-config`) - AI settings

## Common Workflows

### Connecting Slack to Guiders

1. Navigate to Integrations
2. Find Slack in list
3. Click "Configure"
4. Click "Connect with Slack"
5. Authorize app in Slack
6. Grant necessary permissions
7. Configure notification settings
8. Test by sending message

### Setting Up Webhook for Custom Events

1. Open integration details
2. Go to "Webhooks" tab
3. Click "Add Webhook"
4. Enter webhook URL
5. Select events to receive
6. Click "Test Webhook"
7. Verify test successful

### Rotating API Keys Safely

1. Generate new API key
2. Update external services to use new key
3. Monitor for errors
4. Revoke old key once stable

## See Also

- [Root AGENTS.md](../../../../AGENTS.md) - General guidelines
- [Dashboard Feature](../dashboard/AGENTS.md) - System monitoring
- [Admin Data Access](../../../../libs/admin/data-access/) - API documentation
- [Shared Types](../../../../libs/shared/types/) - Type definitions
- [Security Guidelines](../../../../.claude/rules/security.md) - API key handling
