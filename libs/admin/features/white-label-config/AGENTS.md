# AGENTS.md - Admin: White Label Config Feature

**Parent Documentation**: [`../../AGENTS.md` (Root)](../../../../AGENTS.md)

## Overview

The white label config feature allows administrators to customize the application appearance and branding. Includes logo management, color scheme customization, theme configuration, and custom domain setup.

## Feature Structure

```
libs/admin/features/white-label-config/
├── src/
│   ├── lib/
│   │   ├── components/          # White label UI components
│   │   ├── services/            # Configuration logic
│   │   ├── state/               # Configuration state
│   │   └── routes/              # Feature routing
│   └── index.ts                 # Public API
└── project.json
```

## Key Components & Services

- **WhiteLabelConfigComponent** - Main configuration interface
- **BrandingComponent** - Logo and branding settings
- **ColorSchemeComponent** - Color customization
- **ThemePreviewComponent** - Live preview
- **DomainConfigComponent** - Custom domain setup
- **WhiteLabelService** - Configuration API and state
- **ThemeService** - Theme application and management

## Development Commands

```bash
# Serve admin with white label config
npm run serve:admin                    # Port 4201

# Test white label feature
nx test admin-white-label-config       # All tests
nx test admin-white-label-config --testFile=white-label-config.component.spec.ts
nx test admin-white-label-config -- --grep "color"

# Lint and fix
nx lint admin-white-label-config
nx lint admin-white-label-config -- --fix
```

## Common Tasks

### Uploading Company Logo

1. Navigate to White Label Config
2. Go to "Branding" section
3. Click "Upload Logo"
4. Select image file
5. Adjust positioning and size
6. Save changes

```typescript
// Example: Upload logo
uploadLogo(file: File): void {
  const formData = new FormData();
  formData.append('logo', file);

  this.whiteLabelService.uploadLogo(formData).subscribe({
    next: (response) => {
      this.logoUrl.set(response.url);
      this.showSuccessMessage('Logo uploaded');
    },
    error: (err) => this.handleError(err),
  });
}
```

### Customizing Color Scheme

```typescript
// Example: Update primary color
updatePrimaryColor(color: string): void {
  const config: ThemeConfig = {
    primary: color,
    secondary: this.secondaryColor(),
    accent: this.accentColor(),
  };

  this.themeService.applyTheme(config).subscribe({
    next: () => {
      this.primaryColor.set(color);
      this.previewTheme.set(config);
      this.showSuccessMessage('Color updated');
    },
    error: (err) => this.handleError(err),
  });
}
```

### Configuring Custom Domain

```typescript
// Example: Setup custom domain
setupCustomDomain(domain: string): void {
  this.whiteLabelService.setupDomain(domain).subscribe({
    next: (result) => {
      this.customDomain.set(domain);
      this.dnsRecords.set(result.dnsRecords);
      this.showSuccessMessage('Domain configured - verify DNS records');
    },
    error: (err) => this.handleError(err),
  });
}
```

### Creating Color Presets

```typescript
// Example: Save color preset
saveColorPreset(name: string, colors: ColorScheme): void {
  const preset = { name, colors, createdAt: new Date() };

  this.whiteLabelService.savePreset(preset).subscribe({
    next: () => {
      this.presets.set([...this.presets(), preset]);
      this.showSuccessMessage(`Preset "${name}" saved`);
    },
    error: (err) => this.handleError(err),
  });
}

// Example: Load color preset
loadColorPreset(presetId: string): void {
  const preset = this.presets().find(p => p.id === presetId);
  if (preset) {
    this.applyColorScheme(preset.colors);
  }
}
```

### Live Theme Preview

```typescript
// Example: Preview theme changes in real-time
previewThemeChanges(config: ThemeConfig): void {
  // Apply theme to preview area without saving
  this.themeService.previewTheme(config);
  this.currentPreview.set(config);
}
```

### Styling Configuration Interface

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.guiders-white-label {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: tokens.$spacing-lg;
  padding: tokens.$spacing-lg;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }

  &__form {
    &-section {
      margin-bottom: tokens.$spacing-lg;
      padding-bottom: tokens.$spacing-lg;
      border-bottom: 1px solid tokens.$color-border-light;

      &:last-child {
        border-bottom: none;
      }
    }

    &-group {
      margin-bottom: tokens.$spacing-md;
    }

    &-label {
      display: block;
      font-weight: 600;
      margin-bottom: tokens.$spacing-sm;
      color: tokens.$color-text-primary;
    }

    &-description {
      font-size: tokens.$font-size-sm;
      color: tokens.$color-text-secondary;
      margin-top: tokens.$spacing-xs;
    }
  }

  &__color-picker {
    display: flex;
    gap: tokens.$spacing-md;
    align-items: center;

    input[type='color'] {
      width: 60px;
      height: 60px;
      border: 2px solid tokens.$color-border-light;
      border-radius: tokens.$border-radius-md;
      cursor: pointer;

      &:hover {
        border-color: tokens.$color-border-primary;
      }
    }

    input[type='text'] {
      flex: 1;
      padding: tokens.$spacing-sm;
      border: 1px solid tokens.$color-border-light;
      border-radius: tokens.$border-radius-sm;
      font-family: monospace;
    }
  }

  &__preview {
    background: tokens.$color-bg-secondary;
    border: 1px solid tokens.$color-border-light;
    border-radius: tokens.$border-radius-lg;
    padding: tokens.$spacing-lg;
    position: sticky;
    top: tokens.$spacing-lg;

    &-header {
      padding: tokens.$spacing-md;
      background: var(--guiders-primary, tokens.$color-primary);
      color: white;
      border-radius: tokens.$border-radius-md;
      margin-bottom: tokens.$spacing-md;
    }

    &-content {
      padding: tokens.$spacing-md;
      background: white;
      border-radius: tokens.$border-radius-md;
    }
  }

  &__logo-upload {
    border: 2px dashed tokens.$color-border-light;
    border-radius: tokens.$border-radius-md;
    padding: tokens.$spacing-lg;
    text-align: center;
    cursor: pointer;
    transition: all tokens.$transition-normal;

    &:hover {
      border-color: tokens.$color-border-primary;
      background: tokens.$color-bg-hover;
    }

    &--uploading {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__presets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: tokens.$spacing-md;
  }

  &__preset-card {
    border: 2px solid tokens.$color-border-light;
    border-radius: tokens.$border-radius-md;
    padding: tokens.$spacing-md;
    text-align: center;
    cursor: pointer;
    transition: all tokens.$transition-normal;

    &:hover {
      border-color: tokens.$color-border-primary;
      box-shadow: tokens.$shadow-sm;
    }

    &__colors {
      display: flex;
      gap: tokens.$spacing-xs;
      margin-bottom: tokens.$spacing-sm;
      justify-content: center;

      div {
        width: 20px;
        height: 20px;
        border-radius: tokens.$border-radius-sm;
      }
    }

    &__name {
      font-size: tokens.$font-size-sm;
      font-weight: 600;
      color: tokens.$color-text-primary;
    }
  }
}
```

## Architecture Rules

White Label Config (type: feature) can import from:

- ✅ `@guiders-frontend/shared/ui/*` (UI components)
- ✅ `@guiders-frontend/shared/util/*` (utilities)
- ✅ `@guiders-frontend/admin/data-access/*` (admin services)
- ✅ `@guiders-frontend/shared/types/*` (types)

White Label Config CANNOT import from:

- ❌ `@guiders-frontend/chat/*`
- ❌ `@guiders-frontend/analytics/*`

## Testing Guidelines

```typescript
// Test logo upload
it('should upload logo and update UI', fakeAsync(() => {
  const file = new File(['logo'], 'logo.png', { type: 'image/png' });

  component.uploadLogo(file);
  tick();

  expect(whiteLabelService.uploadLogo).toHaveBeenCalled();
  expect(component.logoUrl()).toBeTruthy();
}));

// Test color scheme update
it('should update primary color and preview', fakeAsync(() => {
  const newColor = '#FF0000';

  component.updatePrimaryColor(newColor);
  tick();

  expect(component.primaryColor()).toBe(newColor);
  expect(themeService.applyTheme).toHaveBeenCalled();
}));

// Test color preset save and load
it('should save and load color presets', fakeAsync(() => {
  const preset: ColorPreset = {
    name: 'Ocean Blue',
    colors: { primary: '#0066CC', secondary: '#00AA99' },
  };

  component.saveColorPreset(preset.name, preset.colors);
  tick();

  expect(component.presets()).toContain(jasmine.objectContaining(preset));

  component.loadColorPreset(preset.id);
  expect(component.applyColorScheme).toHaveBeenCalledWith(preset.colors);
}));

// Test custom domain configuration
it('should setup custom domain and display DNS records', fakeAsync(() => {
  const domain = 'chat.example.com';

  component.setupCustomDomain(domain);
  tick();

  expect(component.customDomain()).toBe(domain);
  expect(component.dnsRecords()).toBeTruthy();
}));

// Test theme preview
it('should preview theme without saving', () => {
  const config: ThemeConfig = {
    primary: '#0066CC',
    secondary: '#00AA99',
  };

  component.previewThemeChanges(config);

  expect(themeService.previewTheme).toHaveBeenCalledWith(config);
  expect(component.currentPreview()).toEqual(config);
}));
```

## Key Files to Know

| File                                                                    | Purpose             |
| ----------------------------------------------------------------------- | ------------------- |
| `src/lib/components/white-label-config/white-label-config.component.ts` | Main config UI      |
| `src/lib/components/branding/branding.component.ts`                     | Logo/branding       |
| `src/lib/components/color-scheme/color-scheme.component.ts`             | Color customization |
| `src/lib/components/theme-preview/theme-preview.component.ts`           | Live preview        |
| `src/lib/components/domain-config/domain-config.component.ts`           | Domain setup        |
| `src/lib/services/white-label.service.ts`                               | Configuration API   |
| `src/lib/services/theme.service.ts`                                     | Theme application   |
| `src/index.ts`                                                          | Public API exports  |

## Theme Configuration Model

```typescript
interface WhiteLabelConfig {
  // Branding
  logo: {
    url: string;
    width: number;
    height: number;
  };
  favicon: string;

  // Colors
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
  };

  // Typography
  fonts: {
    primary: string;
    secondary: string;
  };

  // Domain
  customDomain?: string;
  dnsRecords?: DNSRecord[];

  // Metadata
  appName: string;
  description: string;
}
```

## CSS Variables for Theming

```scss
// Generated CSS variables from theme config
:root {
  --guiders-primary: #{$primary-color};
  --guiders-secondary: #{$secondary-color};
  --guiders-accent: #{$accent-color};
  --guiders-success: #{$success-color};
  --guiders-error: #{$error-color};
  --guiders-warning: #{$warning-color};

  --guiders-font-primary: #{$primary-font};
  --guiders-font-secondary: #{$secondary-font};
}

// Usage in components
.component {
  color: var(--guiders-primary);
  font-family: var(--guiders-font-primary);
}
```

## Performance Considerations

- **Logo Optimization**: Compress and optimize images before upload
- **Theme Caching**: Cache theme config with CDN
- **CSS-in-JS**: Generate CSS variables instead of inline styles
- **Preview Updates**: Debounce preview updates during editing

## Debugging

**Logo Not Showing**:

- Check image file size
- Verify image format is supported
- Check image CORS headers
- Verify upload API returned correct URL

**Colors Not Applying**:

- Check CSS variable names
- Verify component is using theme variables
- Clear browser cache
- Check theme service initialization

**Custom Domain Not Working**:

- Verify DNS records are configured correctly
- Check domain DNS propagation
- Verify SSL certificate is installed
- Check CNAME record points to correct host

## Related Features

- **Dashboard** (`libs/admin/features/dashboard`) - System overview
- **Users** (`libs/admin/features/users`) - User management
- **Integrations** (`libs/admin/features/integrations`) - Third-party setup

## Common Workflows

### Customizing Application Branding

1. Navigate to White Label Config
2. Upload company logo in "Branding" section
3. Adjust logo size and positioning
4. Go to "Colors" section
5. Customize primary, secondary colors
6. Save changes
7. Verify across all pages

### Creating Branded Color Schemes

1. Open Color Scheme section
2. Adjust colors individually
3. Preview changes in real-time
4. Once satisfied, click "Save as Preset"
5. Name the preset (e.g., "Corporate Blue")
6. Can now quickly apply this preset to other instances

### Setting Up Custom Domain

1. Go to "Domain" section
2. Enter custom domain (e.g., chat.mycompany.com)
3. System displays required DNS records
4. Configure DNS records in domain registrar
5. Verify DNS propagation
6. Application is now accessible via custom domain

## See Also

- [Root AGENTS.md](../../../../AGENTS.md) - General guidelines
- [Dashboard Feature](../dashboard/AGENTS.md) - System overview
- [Admin Data Access](../../../../libs/admin/data-access/) - API documentation
- [Design Tokens](../../../../libs/shared/design-tokens/) - Design system
- [Shared UI](../../../../libs/shared/ui/) - Component library
