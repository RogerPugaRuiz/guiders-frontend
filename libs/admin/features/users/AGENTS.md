# AGENTS.md - Admin: Users Feature

**Parent Documentation**: [`../../AGENTS.md` (Root)](../../../../AGENTS.md)

## Overview

The users feature manages all user accounts in the system. Includes user creation, editing, role assignment, permission management, and deactivation.

## Feature Structure

```
libs/admin/features/users/
├── src/
│   ├── lib/
│   │   ├── components/          # User list, detail, form
│   │   ├── services/            # User management logic
│   │   ├── state/               # User state management
│   │   └── routes/              # Feature routing
│   └── index.ts                 # Public API
└── project.json
```

## Key Components & Services

- **UsersListComponent** - User directory/table
- **UserDetailComponent** - User profile and settings
- **UserFormComponent** - Create/edit user form
- **UserRolesComponent** - Role assignment UI
- **UsersService** - User API and state management
- **UserPermissionsService** - Permission tracking

## Development Commands

```bash
# Serve admin with users feature
npm run serve:admin                    # Port 4201

# Test users feature
nx test admin-users                    # All tests
nx test admin-users --testFile=users-list.component.spec.ts
nx test admin-users -- --grep "permission"

# Lint and fix
nx lint admin-users
nx lint admin-users -- --fix
```

## Common Tasks

### Creating a New User

1. Open Users management
2. Click "Add User"
3. Fill in user details (email, name, role)
4. Assign permissions based on role
5. Save - user receives invitation email

```typescript
// Example: Create user
createUser(userData: CreateUserDTO): void {
  this.usersService.createUser(userData).subscribe({
    next: (user) => {
      this.users.set([...this.users(), user]);
      this.showSuccessMessage(`User ${user.email} created`);
    },
    error: (err) => this.handleError(err),
  });
}
```

### Assigning Roles and Permissions

```typescript
// Example: Update user role
updateUserRole(userId: string, roleId: string): void {
  this.usersService.updateRole(userId, roleId).subscribe({
    next: () => {
      const updated = this.users().map(u =>
        u.id === userId ? { ...u, roleId } : u
      );
      this.users.set(updated);
      this.showSuccessMessage('User role updated');
    },
  });
}

// Example: Grant permission
grantPermission(userId: string, permission: string): void {
  this.permissionsService.grant(userId, permission).subscribe({
    next: () => this.refreshPermissions(userId),
    error: (err) => this.handleError(err),
  });
}
```

### Managing User Status

- Active: User can log in
- Inactive: User cannot log in
- Pending: Waiting for email confirmation
- Suspended: Temporarily disabled
- Archived: Deactivated permanently

### Styling User Profiles

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.guiders-users {
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

  &__status {
    display: inline-flex;
    align-items: center;
    padding: tokens.$spacing-xs tokens.$spacing-sm;
    border-radius: tokens.$border-radius-sm;
    font-size: tokens.$font-size-sm;
    font-weight: 600;

    &--active {
      background: tokens.$color-success-light;
      color: tokens.$color-success;
    }

    &--inactive {
      background: tokens.$color-warning-light;
      color: tokens.$color-warning;
    }

    &--suspended {
      background: tokens.$color-error-light;
      color: tokens.$color-error;
    }

    &--pending {
      background: tokens.$color-info-light;
      color: tokens.$color-info;
    }
  }

  &__role {
    font-weight: 500;
    padding: tokens.$spacing-xs tokens.$spacing-sm;
    background: tokens.$color-bg-tertiary;
    border-radius: tokens.$border-radius-sm;
  }
}
```

## Architecture Rules

Users (type: feature) can import from:

- ✅ `@guiders-frontend/shared/ui/*` (UI components)
- ✅ `@guiders-frontend/shared/util/*` (utilities)
- ✅ `@guiders-frontend/admin/data-access/*` (admin services)
- ✅ `@guiders-frontend/shared/types/*` (types)

Users CANNOT import from:

- ❌ `@guiders-frontend/chat/*`
- ❌ `@guiders-frontend/analytics/*`

## Testing Guidelines

```typescript
// Test user creation
it('should create new user with valid data', fakeAsync(() => {
  const newUser: CreateUserDTO = {
    email: 'newuser@example.com',
    name: 'New User',
    roleId: 'operator',
  };

  component.createUser(newUser);
  tick();

  expect(usersService.createUser).toHaveBeenCalledWith(newUser);
  expect(component.users()).toContain(jasmine.objectContaining(newUser));
}));

// Test role assignment
it('should assign role to user', fakeAsync(() => {
  const userId = '123';
  const roleId = 'supervisor';

  component.updateUserRole(userId, roleId);
  tick();

  expect(usersService.updateRole).toHaveBeenCalledWith(userId, roleId);
}));

// Test permission grant
it('should grant permission to user', fakeAsync(() => {
  const userId = '123';
  const permission = 'escalations.manage';

  component.grantPermission(userId, permission);
  tick();

  expect(permissionsService.grant).toHaveBeenCalledWith(userId, permission);
}));

// Test user deactivation
it('should deactivate user', fakeAsync(() => {
  const userId = '123';

  component.deactivateUser(userId);
  tick();

  expect(usersService.deactivate).toHaveBeenCalledWith(userId);
}));

// Test form validation
it('should validate email format', () => {
  component.form.patchValue({ email: 'invalid-email' });

  expect(component.form.valid).toBe(false);
  expect(component.form.get('email')?.hasError('email')).toBe(true);
});
```

## Key Files to Know

| File                                                      | Purpose            |
| --------------------------------------------------------- | ------------------ |
| `src/lib/components/users-list/users-list.component.ts`   | User directory     |
| `src/lib/components/user-detail/user-detail.component.ts` | User profile       |
| `src/lib/components/user-form/user-form.component.ts`     | Create/edit form   |
| `src/lib/components/user-roles/user-roles.component.ts`   | Role management    |
| `src/lib/services/users.service.ts`                       | User API and state |
| `src/lib/services/user-permissions.service.ts`            | Permission logic   |
| `src/index.ts`                                            | Public API exports |

## Role & Permission Model

```typescript
// Typical role hierarchy
interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  level: number; // For hierarchy
}

// Common roles:
// - Admin (can manage all users and system)
// - Supervisor (can manage operators and assign work)
// - Operator (can chat and escalate conversations)
// - Viewer (can only view data, no actions)
```

## Performance Considerations

- **Large User Lists**: Virtual scrolling for 1000+ users
- **Search**: Debounce search input
- **Caching**: Cache user list with 5-minute expiry
- **Permissions**: Cache user permissions
- **Change Detection**: `ChangeDetectionStrategy.OnPush`

## Bulk Operations Example

```typescript
// Bulk user operations
performBulkAction(userIds: string[], action: string): void {
  const ids = userIds.join(',');
  this.usersService.bulkUpdate(ids, { action }).subscribe({
    next: () => {
      this.refreshUsers();
      this.showSuccessMessage(`${userIds.length} users updated`);
    },
    error: (err) => this.handleError(err),
  });
}
```

## Debugging

**Users Not Loading**:

- Check API endpoint
- Verify authentication token
- Look for CORS errors

**Role Assignment Not Working**:

- Verify role exists
- Check user permissions for role management
- Look for API validation errors

**Permission Changes Not Reflecting**:

- Verify permission cache is cleared
- Check API response
- Reload user permissions

## Related Features

- **Dashboard** (`libs/admin/features/dashboard`) - Team monitoring
- **AI Config** (`libs/admin/features/ai-config`) - System settings
- **Integrations** (`libs/admin/features/integrations`) - Third-party setup

## Common Workflows

### Onboarding a New Operator

1. Create user in Users management
2. Set role to "Operator"
3. Assign to team
4. Configure default permissions
5. Send invitation email
6. Operator logs in and sets password

### Promoting to Supervisor

1. Open user details
2. Click "Change Role"
3. Select "Supervisor"
4. Confirm permission changes
5. User immediately gains supervisor abilities

### Deactivating a User

1. Find user in list
2. Click "Deactivate" or "Archive"
3. Confirm action with dialog
4. User account is disabled
5. Login attempts are rejected

### Managing Permissions

1. Open user detail
2. Go to "Permissions" tab
3. Enable/disable specific permissions
4. Click "Save Changes"
5. Permissions take effect immediately

## See Also

- [Root AGENTS.md](../../../../AGENTS.md) - General guidelines
- [Dashboard Feature](../dashboard/AGENTS.md) - User monitoring
- [Admin Data Access](../../../../libs/admin/data-access/) - API documentation
- [Authentication](../../../../libs/auth/) - User authentication
- [Form Validation](../../../../.claude/rules/forms.md) - Form patterns
