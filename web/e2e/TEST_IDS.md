# Test IDs Reference

This document lists all `data-testid` attributes used in E2E tests. Add these to your components for reliable test selection.

## Layout Components

### Sidebar
```tsx
data-testid="sidebar"
data-testid="sidebar-dashboard"
data-testid="sidebar-agents"
data-testid="sidebar-events"
data-testid="sidebar-reports"
data-testid="sidebar-teams"
data-testid="sidebar-settings"
```

### User Menu
```tsx
data-testid="user-menu"
data-testid="user-menu-dropdown"
data-testid="logout-button"
```

### Notifications
```tsx
data-testid="notification-bell"
data-testid="notification-badge"
data-testid="notification-panel"
data-testid="notification-list"
data-testid="notification-item"
data-testid="notification-timestamp"
data-testid="notification-toast"
data-testid="mark-all-read"
data-testid="notification-filter-all"
data-testid="notification-filter-unread"
```

## Dashboard

### Stats Cards
```tsx
data-testid="stats-card"
```

### Recent Activities
```tsx
data-testid="recent-activities"
```

## Teams

### Teams List
```tsx
data-testid="teams-list"
data-testid="team-card"
data-testid="create-team-button"
data-testid="create-team-dialog"
```

### Team Detail
```tsx
data-testid="team-detail"
data-testid="team-members"
data-testid="invite-member-button"
data-testid="invite-member-dialog"
```

## Reports

### Reports List
```tsx
data-testid="reports-list"
data-testid="report-card"
data-testid="generate-report-button"
data-testid="generate-report-dialog"
data-testid="report-type-filter"
data-testid="report-sort"
data-testid="report-status"
```

### Report Detail
```tsx
data-testid="report-detail"
data-testid="report-stats"
data-testid="report-charts"
data-testid="download-report-button"
data-testid="delete-report-button"
data-testid="confirm-delete-button"
```

## Settings

### Settings Tabs
```tsx
data-testid="settings-tabs"
data-testid="tab-profile"
data-testid="tab-notifications"
data-testid="tab-security"
data-testid="tab-api-keys"
```

### Profile Settings
```tsx
data-testid="account-info"
data-testid="save-profile-button"
data-testid="avatar-upload"
```

### Notification Preferences
```tsx
data-testid="notification-preferences"
data-testid="email-notifications-toggle"
data-testid="push-notifications-toggle"
data-testid="desktop-notifications-toggle"
data-testid="save-notifications-button"
```

### Security Settings
```tsx
data-testid="security-settings"
data-testid="change-password-form"
data-testid="change-password-button"
data-testid="two-factor-auth"
data-testid="delete-account"
data-testid="delete-account-button"
```

### Other Settings
```tsx
data-testid="language-selector"
data-testid="timezone-selector"
data-testid="api-keys-section"
```

## Usage Examples

### Adding Test IDs to Components

#### React Component
```tsx
export function Sidebar() {
  return (
    <aside data-testid="sidebar">
      <nav>
        <Link href="/dashboard" data-testid="sidebar-dashboard">
          Dashboard
        </Link>
        <Link href="/agents" data-testid="sidebar-agents">
          Agents
        </Link>
        {/* ... more links */}
      </nav>
    </aside>
  );
}
```

#### Button with Test ID
```tsx
<button
  data-testid="create-team-button"
  onClick={handleCreate}
>
  Create Team
</button>
```

#### Dialog/Modal
```tsx
<Dialog open={open}>
  <DialogContent data-testid="create-team-dialog">
    <form>
      {/* form fields */}
    </form>
  </DialogContent>
</Dialog>
```

#### List Items
```tsx
<ul data-testid="teams-list">
  {teams.map(team => (
    <li key={team.id} data-testid="team-card">
      {team.name}
    </li>
  ))}
</ul>
```

## Best Practices

1. **Unique IDs**: Each test ID should be unique within its context
2. **Semantic Names**: Use descriptive, meaningful names
3. **Kebab-case**: Use kebab-case for consistency
4. **Hierarchical**: Use prefixes for related elements (e.g., `sidebar-`, `notification-`)
5. **Stable**: Don't change test IDs unless necessary
6. **Documentation**: Document all test IDs in this file

## Adding New Test IDs

When adding new features:

1. Choose appropriate test ID naming
2. Add to component
3. Document in this file
4. Update relevant test specs

## Migration Guide

If you need to update existing test IDs:

1. Add new test ID to component
2. Update test specs to use new ID
3. Remove old test ID
4. Update this documentation

Example:
```tsx
// Old (avoid)
<button id="submit-btn">Submit</button>

// New (preferred)
<button data-testid="submit-button">Submit</button>
```

## Notes

- Test IDs are only used in tests and have no impact on production
- They make tests more resilient to CSS/class changes
- They serve as documentation of testable elements
- Keep test IDs even if the styling changes
