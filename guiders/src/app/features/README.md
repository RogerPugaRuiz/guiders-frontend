# Features Directory Structure

This directory contains application features organized in a standardized structure. Each feature follows the same directory organization:

```
features/feature-name/
    ├── feature-name.component.ts      # Main component TypeScript
    ├── feature-name.component.html    # Main component template
    ├── feature-name.component.css     # Main component styles
    ├── components/                    # Sub-components used in this feature
    │   ├── component-1/               # Each sub-component in its own folder
    │   │   ├── component-1.component.ts
    │   │   ├── component-1.component.html
    │   │   └── component-1.component.css
    │   └── component-2/
    ├── repositories/                  # Data source implementations
    │   └── feature-repository.ts
    ├── services/                      # Feature-specific services
    │   └── feature-service.ts
    └── index.ts                       # Barrel exports
```

## Structure Guidelines

1. **Main Feature Component**: The primary component that represents the feature should be at the root level of the feature directory, named after the feature.

2. **Sub-Components**: All smaller/child components used exclusively by the feature should be in the `components/` directory, with each component in its own subdirectory.

3. **Repositories**: Implementation of data access logic, often adapters for domain repositories.

4. **Services**: Feature-specific services that coordinate business logic or provide supporting functionality.

## Updating Existing Features

When modifying an existing feature:

1. Follow the established structure
2. Place any new components in the appropriate directory
3. Update imports to reflect the standardized paths

## Adding New Features

When creating a new feature:

1. Create the directory structure as shown above
2. Use the Angular CLI to generate components in the appropriate location
3. Make sure to export public APIs through the index.ts file