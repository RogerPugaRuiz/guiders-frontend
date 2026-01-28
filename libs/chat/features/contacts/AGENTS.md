# AGENTS.md - Chat: Contacts Feature

**Parent Documentation**: [`../../AGENTS.md` (Root)](../../../../AGENTS.md)

## Overview

The contacts feature manages the contact information for visitors/customers. Includes contact creation, editing, searching, and organization into contact groups.

## Feature Structure

```
libs/chat/features/contacts/
├── src/
│   ├── lib/
│   │   ├── components/          # Contact list, detail, form
│   │   ├── services/            # Contact management logic
│   │   ├── state/               # Contact state management
│   │   └── routes/              # Feature routing
│   └── index.ts                 # Public API
└── project.json
```

## Key Components & Services

- **ContactsListComponent** - Contacts directory/list view
- **ContactDetailComponent** - Contact profile with full information
- **ContactFormComponent** - Create/edit contact form
- **ContactGroupsComponent** - Manage contact groups/tags
- **ContactsService** - Contacts API and state management
- **ContactSearchService** - Search and filtering

## Development Commands

```bash
# Serve console with contacts
npm run serve                           # Full console app

# Test contacts feature
nx test chat-contacts                   # All tests
nx test chat-contacts --testFile=contacts-list.component.spec.ts
nx test chat-contacts -- --grep "search"

# Lint and fix
nx lint chat-contacts
nx lint chat-contacts -- --fix
```

## Common Tasks

### Creating a New Contact

1. Use `ContactFormComponent` with empty data
2. Service validates contact information
3. On submit, POST to `/api/contacts`
4. Update contacts list signal
5. Navigate to contact detail view

### Editing Contact Information

```typescript
// Example: Update contact details
editContact(contactId: string, updates: Partial<Contact>): void {
  this.contactsService.updateContact(contactId, updates).subscribe({
    next: (updated) => {
      this.currentContact.set(updated);
      this.showSuccessMessage('Contact updated');
    },
    error: (err) => this.handleError(err),
  });
}
```

### Searching and Filtering Contacts

- Real-time search as user types
- Filter by contact group/tag
- Filter by contact status (active, inactive, blocked)
- Combine multiple filters

### Adding Contact Tags/Groups

```typescript
// Example: Add contact to group
addContactToGroup(contactId: string, groupId: string): void {
  this.contactsService.addToGroup(contactId, groupId).subscribe({
    next: () => this.refreshContactGroups(),
    error: (err) => this.handleError(err),
  });
}
```

### Styling Contact Cards and Lists

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.guiders-contacts__card {
  display: flex;
  align-items: center;
  padding: tokens.$spacing-md;
  border: 1px solid tokens.$color-border-light;
  border-radius: tokens.$border-radius-md;

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: tokens.$spacing-md;
    background: tokens.$color-bg-secondary;
  }

  &__info {
    flex: 1;

    &-name {
      font-weight: 600;
      color: tokens.$color-text-primary;
    }

    &-email {
      font-size: tokens.$font-size-sm;
      color: tokens.$color-text-secondary;
    }
  }

  &__tags {
    display: flex;
    gap: tokens.$spacing-xs;
    flex-wrap: wrap;
  }
}
```

## Architecture Rules

Contacts (type: feature) can import from:

- ✅ `@guiders-frontend/shared/ui/*` (UI components)
- ✅ `@guiders-frontend/shared/util/*` (utilities)
- ✅ `@guiders-frontend/chat/data-access/*` (chat services)
- ✅ `@guiders-frontend/shared/types/*` (types)
- ✅ `@guiders-frontend/chat/ui/*` (chat-specific UI)

Contacts CANNOT import from:

- ❌ `@guiders-frontend/admin/*`
- ❌ `@guiders-frontend/analytics/*`

## Testing Guidelines

```typescript
// Test contact creation
it('should create new contact', fakeAsync(() => {
  const newContact: Contact = mockContact();

  component.createContact(newContact);
  tick();

  expect(contactsService.createContact).toHaveBeenCalledWith(newContact);
  expect(component.contacts()).toContain(newContact);
}));

// Test contact search
it('should filter contacts by search term', () => {
  component.contactsList.set(mockContacts());
  component.searchTerm.set('John');

  const filtered = component.filteredContacts();

  expect(filtered.every((c) => c.name.includes('John'))).toBe(true);
});

// Test adding contact to group
it('should add contact to group and emit event', () => {
  spyOn(component.contactGroupAdded, 'emit');
  const contact = mockContact();

  component.addToGroup(contact, 'premium');

  expect(component.contactGroupAdded.emit).toHaveBeenCalled();
});

// Test form validation
it('should validate email format', () => {
  component.form.patchValue({ email: 'invalid-email' });

  expect(component.form.valid).toBe(false);
  expect(component.form.get('email')?.hasError('email')).toBe(true);
});
```

## Key Files to Know

| File                                                            | Purpose                 |
| --------------------------------------------------------------- | ----------------------- |
| `src/lib/components/contacts-list/contacts-list.component.ts`   | Contacts directory view |
| `src/lib/components/contact-detail/contact-detail.component.ts` | Contact profile         |
| `src/lib/components/contact-form/contact-form.component.ts`     | Create/edit form        |
| `src/lib/components/contact-groups/contact-groups.component.ts` | Group management        |
| `src/lib/services/contacts.service.ts`                          | Contacts API and state  |
| `src/lib/services/contact-search.service.ts`                    | Search functionality    |
| `src/index.ts`                                                  | Public API exports      |

## Performance Considerations

- **Large Contact Lists**: Virtual scrolling for 5000+ contacts
- **Search Debouncing**: Debounce search input to reduce API calls
- **Caching**: Cache contact list with 5-minute expiry
- **Lazy Loading**: Load contact groups on demand
- **Change Detection**: `ChangeDetectionStrategy.OnPush` on all components

## Form Validation Examples

```typescript
// Advanced form validation for contact creation
private buildContactForm(): FormGroup {
  return new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', [Validators.pattern(/^\+?[\d\s-()]{7,}$/)]),
    company: new FormControl(''),
    tags: new FormControl([]),
  });
}
```

## Debugging

**Contacts Not Loading**:

- Check network tab for API requests
- Verify ContactsService is properly initialized
- Check browser console for errors

**Search Not Working**:

- Verify search debounce timeout
- Check API supports search parameter
- Look for filter state issues

**Form Validation Issues**:

- Check FormControl validators
- Verify form group bindings in template
- Test individual validators in unit tests

## Related Features

- **Visitors** (`libs/chat/features/visitors`) - Visitor management
- **Inbox** (`libs/chat/features/inbox`) - Messaging with contacts
- **Escalations** (`libs/chat/features/escalations`) - Escalation tracking

## Common Workflows

### Creating Contact from Visitor

1. Open visitor profile
2. Click "Save as Contact"
3. Pre-populate contact form with visitor data
4. Allow editing before saving
5. Auto-link contact to visitor

### Bulk Contact Operations

1. Select multiple contacts with checkboxes
2. Apply bulk actions (add tag, change group, archive)
3. Confirm action with dialog
4. Show success/error notification

### Contact Search and Discovery

1. Use search bar with fuzzy search
2. Filter by tags/groups
3. Sort by name, email, last contacted
4. View contact history

## See Also

- [Root AGENTS.md](../../../../AGENTS.md) - General guidelines
- [Visitors Feature](../visitors/AGENTS.md) - Visitor management
- [Inbox Feature](../inbox/AGENTS.md) - Messaging
- [Chat Data Access](../../../../libs/chat/data-access/) - API documentation
- [Form Validation](../../../../.claude/rules/forms.md) - Form patterns
