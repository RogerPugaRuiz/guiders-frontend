# AGENTS.md - Admin: AI Config Feature

**Parent Documentation**: [`../../AGENTS.md` (Root)](../../../../AGENTS.md)

## Overview

The AI config feature manages artificial intelligence settings and configurations. Includes model selection, prompt customization, behavior tuning, and AI capability toggles.

## Feature Structure

```
libs/admin/features/ai-config/
├── src/
│   ├── lib/
│   │   ├── components/          # Configuration UI components
│   │   ├── services/            # AI configuration logic
│   │   ├── state/               # Configuration state
│   │   └── routes/              # Feature routing
│   └── index.ts                 # Public API
└── project.json
```

## Key Components & Services

- **AIConfigComponent** - Main configuration interface
- **ModelSelectionComponent** - AI model picker
- **PromptEditorComponent** - Custom prompt editing
- **BehaviorTuningComponent** - AI behavior settings
- **AIConfigService** - Configuration API and state
- **ModelValidationService** - Configuration validation

## Development Commands

```bash
# Serve admin with AI config
npm run serve:admin                    # Port 4201

# Test AI config feature
nx test admin-ai-config                # All tests
nx test admin-ai-config --testFile=ai-config.component.spec.ts
nx test admin-ai-config -- --grep "model"

# Lint and fix
nx lint admin-ai-config
nx lint admin-ai-config -- --fix
```

## Common Tasks

### Selecting AI Model

1. Navigate to AI Config
2. Choose model from dropdown (GPT-4, Claude, etc.)
3. Configure model-specific parameters
4. Test with sample prompts
5. Save configuration

```typescript
// Example: Update AI model
updateModel(modelId: string, config: ModelConfig): void {
  const update: UpdateAIModelDTO = {
    modelId,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    systemPrompt: config.systemPrompt,
  };

  this.aiConfigService.updateModel(update).subscribe({
    next: () => {
      this.currentModel.set(modelId);
      this.modelConfig.set(config);
      this.showSuccessMessage('Model updated');
    },
    error: (err) => this.handleError(err),
  });
}
```

### Customizing System Prompts

```typescript
// Example: Edit system prompt
editSystemPrompt(prompt: string): void {
  this.aiConfigService.updateSystemPrompt(prompt).subscribe({
    next: () => {
      this.systemPrompt.set(prompt);
      this.showSuccessMessage('System prompt updated');
    },
    error: (err) => this.handleError(err),
  });
}
```

### Testing AI Configuration

- Test with sample queries before deploying
- Validate response format
- Check response quality and relevance
- Measure response latency

### AI Configuration Parameters

```typescript
interface AIConfig {
  model: string; // Model identifier (gpt-4, claude-3, etc)
  temperature: number; // 0.0 - 2.0 (creativity/randomness)
  topP: number; // 0.0 - 1.0 (diversity)
  maxTokens: number; // Max response length
  frequencyPenalty: number; // -2.0 - 2.0
  presencePenalty: number; // -2.0 - 2.0
  systemPrompt: string; // Custom system prompt
  responseFormat?: 'json' | 'text';
  capabilities: {
    generateResponses: boolean;
    classifyMessages: boolean;
    extractEntities: boolean;
    generateSuggestions: boolean;
  };
}
```

### Styling Configuration Forms

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.guiders-ai-config {
  padding: tokens.$spacing-lg;
  max-width: 800px;

  &__section {
    margin-bottom: tokens.$spacing-xl;
    padding-bottom: tokens.$spacing-xl;
    border-bottom: 1px solid tokens.$color-border-light;

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    display: block;
    font-weight: 600;
    margin-bottom: tokens.$spacing-sm;
    color: tokens.$color-text-primary;
  }

  &__description {
    font-size: tokens.$font-size-sm;
    color: tokens.$color-text-secondary;
    margin-top: tokens.$spacing-xs;
  }

  &__slider {
    margin: tokens.$spacing-md 0;
  }

  &__prompt-editor {
    background: tokens.$color-bg-secondary;
    border: 1px solid tokens.$color-border-light;
    border-radius: tokens.$border-radius-md;
    padding: tokens.$spacing-md;
    font-family: 'Courier New', monospace;
    min-height: 200px;
  }

  &__test-panel {
    background: tokens.$color-bg-tertiary;
    border: 1px solid tokens.$color-border-light;
    border-radius: tokens.$border-radius-md;
    padding: tokens.$spacing-md;
    margin-top: tokens.$spacing-lg;
  }

  &__warning {
    padding: tokens.$spacing-md;
    background: tokens.$color-warning-light;
    border-left: 4px solid tokens.$color-warning;
    border-radius: tokens.$border-radius-sm;
    color: tokens.$color-warning;
    font-size: tokens.$font-size-sm;
  }
}
```

## Architecture Rules

AI Config (type: feature) can import from:

- ✅ `@guiders-frontend/shared/ui/*` (UI components)
- ✅ `@guiders-frontend/shared/util/*` (utilities)
- ✅ `@guiders-frontend/admin/data-access/*` (admin services)
- ✅ `@guiders-frontend/shared/types/*` (types)

AI Config CANNOT import from:

- ❌ `@guiders-frontend/chat/*`
- ❌ `@guiders-frontend/analytics/*`

## Testing Guidelines

```typescript
// Test model selection
it('should update AI model configuration', fakeAsync(() => {
  const config: ModelConfig = {
    modelId: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  };

  component.updateModel('gpt-4', config);
  tick();

  expect(aiConfigService.updateModel).toHaveBeenCalled();
  expect(component.currentModel()).toBe('gpt-4');
}));

// Test system prompt validation
it('should validate system prompt format', () => {
  const invalidPrompt = '';

  expect(component.validatePrompt(invalidPrompt)).toBe(false);

  const validPrompt = 'You are a helpful assistant...';
  expect(component.validatePrompt(validPrompt)).toBe(true);
}));

// Test configuration testing
it('should test AI config with sample query', fakeAsync(() => {
  const testQuery = 'Hello, what is 2+2?';

  component.testConfiguration(testQuery);
  tick();

  expect(component.testResult()).toBeTruthy();
  expect(component.testResponse()).toContain('4');
}));

// Test capability toggles
it('should toggle AI capabilities', fakeAsync(() => {
  component.toggleCapability('generateResponses');
  tick();

  expect(aiConfigService.updateCapabilities).toHaveBeenCalled();
}));

// Test parameter validation
it('should validate temperature parameter range', () => {
  expect(component.validateTemperature(0.5)).toBe(true);
  expect(component.validateTemperature(-1)).toBe(false);
  expect(component.validateTemperature(3)).toBe(false);
});
```

## Key Files to Know

| File                                                              | Purpose              |
| ----------------------------------------------------------------- | -------------------- |
| `src/lib/components/ai-config/ai-config.component.ts`             | Main config UI       |
| `src/lib/components/model-selection/model-selection.component.ts` | Model picker         |
| `src/lib/components/prompt-editor/prompt-editor.component.ts`     | Prompt editing       |
| `src/lib/components/behavior-tuning/behavior-tuning.component.ts` | Parameters           |
| `src/lib/services/ai-config.service.ts`                           | Config API and state |
| `src/lib/services/model-validation.service.ts`                    | Validation logic     |
| `src/index.ts`                                                    | Public API exports   |

## Model Configuration Examples

```typescript
// GPT-4 optimized for customer service
{
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1500,
  systemPrompt: 'You are a helpful customer service representative...',
  capabilities: {
    generateResponses: true,
    classifyMessages: true,
    extractEntities: true,
    generateSuggestions: true,
  }
}

// Claude 3 for complex analysis
{
  model: 'claude-3-opus',
  temperature: 0.5,
  maxTokens: 2000,
  systemPrompt: 'You are an expert at analyzing customer issues...',
  capabilities: {
    generateResponses: true,
    classifyMessages: true,
    extractEntities: true,
    generateSuggestions: false,
  }
}
```

## Performance Considerations

- **Configuration Caching**: Cache AI config with 10-minute TTL
- **Model Switching**: Show loading state during model change
- **Test Execution**: Set timeout for test queries
- **API Calls**: Debounce config updates

## Debugging

**Configuration Not Saving**:

- Check API endpoint is correct
- Verify authentication
- Look for validation errors

**Test Response Failing**:

- Check AI service connection
- Verify model API credentials
- Check for rate limiting

**Prompt Not Working**:

- Validate prompt syntax
- Check token count
- Verify model supports custom prompts

## Related Features

- **Dashboard** (`libs/admin/features/dashboard`) - System overview
- **Users** (`libs/admin/features/users`) - Team management
- **Integrations** (`libs/admin/features/integrations`) - Third-party AI services

## Common Workflows

### Setting Up AI for Your Organization

1. Navigate to AI Config
2. Select AI model (GPT-4, Claude, etc.)
3. Customize system prompt for your brand
4. Configure temperature and parameters
5. Test with sample queries
6. Enable AI capabilities
7. Deploy to production

### Fine-tuning AI Behavior

1. Review AI responses in production
2. Identify areas for improvement
3. Adjust system prompt or parameters
4. Test changes with sample queries
5. Gradually roll out to users
6. Monitor performance metrics

### Testing Different Models

1. Select model to test
2. Run same test queries on multiple models
3. Compare response quality and speed
4. Analyze token usage
5. Choose best model for use case

## Safety & Compliance

```typescript
// Model safety considerations
interface SafetyConfig {
  enableContentFilter: boolean;
  enableRateLimiting: boolean;
  maxTokensPerDay: number;
  blockedTopics: string[];
  requireApproval: boolean;
}
```

## See Also

- [Root AGENTS.md](../../../../AGENTS.md) - General guidelines
- [Dashboard Feature](../dashboard/AGENTS.md) - System monitoring
- [Admin Data Access](../../../../libs/admin/data-access/) - API documentation
- [Shared Types](../../../../libs/shared/types/) - Type definitions
