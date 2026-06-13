# E2E Test Plan - DevLog Hub

## Test Coverage Overview

This document outlines the E2E test coverage for the DevLog Hub application.

## Test Suites

### 1. Authentication Tests (`auth.spec.ts`)

**Coverage**: User authentication flows

| Test Case | Description | Priority |
|-----------|-------------|----------|
| Display login page | Verify login page loads with all elements | High |
| Successful login | Test login with valid credentials | High |
| Invalid credentials | Test error handling for wrong password | High |
| Empty field validation | Test form validation | Medium |
| Logout functionality | Test logout redirects to login | High |
| Registration page | Verify registration form displays | Medium |
| Protected route redirect | Test unauthenticated access redirects | High |
| Auth persistence | Test auth state persists after reload | Medium |

**Test Data**:
- Admin user: admin@devlog.com
- Test users: user1@devlog.com, user2@devlog.com

**Expected Results**:
- All authentication flows work correctly
- Protected routes are properly secured
- Error messages display appropriately

---

### 2. Dashboard Tests (`dashboard.spec.ts`)

**Coverage**: Dashboard page and navigation

| Test Case | Description | Priority |
|-----------|-------------|----------|
| Load dashboard | Verify dashboard page loads | High |
| Display statistics | Check stats cards are visible | High |
| Recent activities | Verify activities section displays | Medium |
| Sidebar navigation | Test all sidebar links work | High |
| User menu | Test user menu opens and closes | Medium |
| Notification bell | Verify notification icon displays | Medium |
| Page title | Check correct page title | Low |

**Test Data**:
- Authenticated user session
- Dashboard statistics (dynamic)

**Expected Results**:
- Dashboard loads with all components
- Navigation works correctly
- Statistics display properly

---

### 3. Teams Tests (`teams.spec.ts`)

**Coverage**: Team management functionality

| Test Case | Description | Priority |
|-----------|-------------|----------|
| Load teams page | Verify teams page loads | High |
| Display teams list | Check teams list renders | High |
| Create team button | Verify create button exists | Medium |
| Open create dialog | Test dialog opens | Medium |
| Create new team | Test team creation flow | High |
| Validation errors | Test empty name validation | Medium |
| Team detail navigation | Test clicking team opens detail | Medium |
| Team members section | Verify members list displays | Medium |
| Invite member button | Check invite button exists | Low |
| Empty state | Test empty teams message | Low |

**Test Data**:
- Team names with timestamps for uniqueness
- Team descriptions
- Member emails

**Expected Results**:
- Team CRUD operations work
- Validation prevents invalid data
- Navigation flows correctly

---

### 4. Notifications Tests (`notifications.spec.ts`)

**Coverage**: Notification system

| Test Case | Description | Priority |
|-----------|-------------|----------|
| Display notification bell | Verify bell icon displays | High |
| Open notification panel | Test panel opens on click | High |
| Close panel | Test panel closes on outside click | Medium |
| Notification list | Verify list displays | High |
| Unread count badge | Check badge shows count | Medium |
| Mark as read | Test marking notification read | High |
| Mark all as read | Test bulk mark as read | Medium |
| Filter notifications | Test filtering by type | Low |
| Real-time toast | Test toast notifications | Medium |
| Navigate to source | Test clicking notification navigates | Medium |

**Test Data**:
- System notifications
- Real-time events (if available)

**Expected Results**:
- Notifications display correctly
- Mark as read functionality works
- Real-time updates appear

---

### 5. Reports Tests (`reports.spec.ts`)

**Coverage**: Report generation and management

| Test Case | Description | Priority |
|-----------|-------------|----------|
| Load reports page | Verify page loads | High |
| Display reports list | Check list renders | High |
| Generate report button | Verify button exists | Medium |
| Open generate dialog | Test dialog opens | Medium |
| Generate new report | Test report generation | High |
| Validation errors | Test empty field validation | Medium |
| Type filter | Test filtering by report type | Low |
| Report navigation | Test clicking opens detail | Medium |
| Report statistics | Verify stats display | Medium |
| Report charts | Check charts render | Medium |
| Download report | Test download functionality | Low |
| Delete report | Test deletion flow | Low |
| Empty state | Test empty message | Low |

**Test Data**:
- Report titles with timestamps
- Date ranges
- Report types (DAILY, WEEKLY, MONTHLY)

**Expected Results**:
- Report generation works
- Filtering functions correctly
- Download and delete work

---

### 6. Settings Tests (`settings.spec.ts`)

**Coverage**: User settings and preferences

| Test Case | Description | Priority |
|-----------|-------------|----------|
| Load settings page | Verify page loads | High |
| Display tabs | Check all tabs visible | Medium |
| Profile settings | Test profile form displays | Medium |
| Update profile | Test updating profile info | High |
| Notification preferences | Verify preferences display | Medium |
| Toggle email notifications | Test email toggle | Medium |
| Toggle push notifications | Test push toggle | Medium |
| Toggle desktop notifications | Test desktop toggle | Medium |
| Security settings | Verify security tab | Medium |
| Change password form | Check password form displays | Medium |
| Change password | Test password change | High |
| Password mismatch error | Test validation | Medium |
| Account information | Verify account info displays | Low |
| Save preferences | Test saving settings | Medium |

**Test Data**:
- User profile data
- Password combinations
- Preference toggles

**Expected Results**:
- Settings update successfully
- Validation works properly
- Changes persist after reload

---

## Test Environment Requirements

### Prerequisites

1. **Development Server**
   - Next.js dev server running on port 3020
   - Auto-started by Playwright webServer config

2. **Backend API**
   - Node.js API server running on port 3001
   - PostgreSQL database accessible
   - Redis for real-time features

3. **Test Data**
   - Test users created in global-setup
   - Clean database state (or test isolation)

### Environment Variables

```bash
BASE_URL=http://localhost:3020
API_URL=http://localhost:3001
CI=false # Set to true in CI environment
```

## Test Execution Strategy

### Local Development

```bash
# Run all tests
npm run test:e2e

# Run with UI (recommended for development)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run specific suite
npx playwright test e2e/auth.spec.ts
```

### CI/CD Pipeline

```bash
# CI mode (with retries and sequential execution)
CI=true npm run test:e2e
```

**CI Configuration**:
- Retries: 2 attempts
- Workers: 1 (sequential)
- Screenshots/videos on failure
- HTML report generated

## Test Data Management

### Test Users

Created in `global-setup.ts`:

```typescript
{
  admin: {
    email: 'admin@devlog.com',
    password: 'Admin123!',
    name: 'Admin User'
  },
  user1: {
    email: 'user1@devlog.com',
    password: 'User123!',
    name: 'Test User 1'
  },
  user2: {
    email: 'user2@devlog.com',
    password: 'User123!',
    name: 'Test User 2'
  }
}
```

### Dynamic Data

For tests that create data (teams, reports):
- Use timestamps for unique names
- Clean up after tests (optional)
- Use ephemeral test database in CI

## Success Criteria

### Test Coverage Goals

- **Authentication**: 100% of critical paths
- **Navigation**: 100% of main routes
- **CRUD Operations**: 80% coverage
- **Error Handling**: 70% coverage
- **Edge Cases**: 50% coverage

### Performance Targets

- Average test execution: < 30 seconds per suite
- Total suite time: < 5 minutes
- Flakiness rate: < 5%

### Quality Metrics

- **Pass Rate**: > 95% on first run
- **Reliability**: Tests should pass consistently
- **Maintainability**: Tests should be easy to update

## Known Limitations

1. **Real-time Features**: WebSocket testing is limited
2. **External Services**: Mocked or unavailable in tests
3. **File Uploads**: May require special handling
4. **Email Verification**: Bypassed in test environment

## Future Enhancements

1. **Visual Regression Testing**: Add screenshot comparison
2. **Performance Testing**: Add load time assertions
3. **Accessibility Testing**: Add a11y checks
4. **API Mocking**: Use MSW for API mocking
5. **Test Data Builder**: Create test data factory pattern
6. **Parallel Execution**: Optimize for faster runs

## Maintenance Guidelines

### Updating Tests

When UI changes:
1. Update affected `data-testid` attributes
2. Update test selectors
3. Update assertions

When functionality changes:
1. Add new test cases
2. Update existing tests
3. Remove obsolete tests

### Debugging Failed Tests

1. Run in UI mode: `npm run test:e2e:ui`
2. Check screenshots in `test-results/`
3. View trace files for detailed timeline
4. Check console logs in test output

### Adding New Tests

1. Choose appropriate test suite file
2. Follow existing test patterns
3. Use descriptive test names
4. Add to this test plan document
5. Ensure test is idempotent

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [DevLog Hub API Docs](../docs/API.md)
- [Component Test IDs](./TEST_IDS.md)
