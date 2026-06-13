# E2E Tests with Playwright

This directory contains End-to-End (E2E) tests for the DevLog Hub web application using Playwright.

## Structure

```
e2e/
├── fixtures/
│   └── auth.fixture.ts       # Authentication helpers and test users
├── auth.spec.ts              # Authentication flow tests
├── dashboard.spec.ts         # Dashboard and navigation tests
├── teams.spec.ts             # Team management tests
├── notifications.spec.ts     # Notification system tests
├── reports.spec.ts           # Report generation and management tests
├── settings.spec.ts          # User settings tests
├── global-setup.ts           # Global setup (runs once before all tests)
├── global-teardown.ts        # Global teardown (runs once after all tests)
└── README.md                 # This file
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### View test report
```bash
npm run test:e2e:report
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test --grep "login"
```

## Test Users

The following test users are available (created in global-setup):

- **Admin User**
  - Email: `admin@devlog.com`
  - Password: `Admin123!`

- **Test User 1**
  - Email: `user1@devlog.com`
  - Password: `User123!`

- **Test User 2**
  - Email: `user2@devlog.com`
  - Password: `User123!`

## Prerequisites

1. **Development server must be running**
   ```bash
   npm run dev
   ```
   The tests will automatically start the dev server if configured in `playwright.config.ts`.

2. **Database must be accessible**
   - PostgreSQL should be running (via Docker Compose)
   - Database migrations should be applied

3. **Backend API must be running**
   ```bash
   cd ../server && npm run dev
   ```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login, testUsers } from './fixtures/auth.fixture';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await login(page, testUsers.admin);
  });

  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/some-route');

    // Interact
    await page.click('[data-testid="button"]');

    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Using Test IDs

Always prefer `data-testid` attributes for selecting elements:

```typescript
// Good
await page.click('[data-testid="submit-button"]');

// Avoid
await page.click('button.submit-btn');
```

### Authentication Helper

Use the `login()` helper for authenticated tests:

```typescript
import { login, testUsers } from './fixtures/auth.fixture';

await login(page, testUsers.admin);
```

### Waiting for Elements

```typescript
// Wait for element to be visible
await page.waitForSelector('[data-testid="element"]', { state: 'visible' });

// Wait for navigation
await page.waitForURL('/dashboard');

// Wait for network idle
await page.waitForLoadState('networkidle');
```

## Test Data Strategy

1. **Use test fixtures** for consistent test data
2. **Generate unique data** for tests that create records (use timestamps)
3. **Clean up after tests** if needed (or use ephemeral test database)

## Best Practices

1. **Independent Tests**: Each test should be independent and not rely on other tests
2. **Descriptive Names**: Use clear, descriptive test names
3. **Test IDs**: Add `data-testid` attributes to important elements
4. **Wait Properly**: Always wait for elements/actions to complete
5. **Handle Async**: Use proper async/await patterns
6. **Mock External Services**: Mock external APIs when appropriate
7. **Keep Tests Fast**: Avoid unnecessary waits, use efficient selectors

## Common Issues

### Port Already in Use

If port 3020 is already in use:
```bash
# Find and kill the process
lsof -ti:3020 | xargs kill -9
```

### Tests Timing Out

Increase timeout in `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 10000,
  navigationTimeout: 30000,
}
```

### Browser Not Installed

Install Playwright browsers:
```bash
npx playwright install
```

### Flaky Tests

Use better waits instead of `waitForTimeout`:
```typescript
// Bad
await page.waitForTimeout(1000);

// Good
await page.waitForSelector('[data-testid="element"]');
await expect(page.locator('[data-testid="element"]')).toBeVisible();
```

## CI/CD Integration

Tests run automatically in CI with:
- Retries: 2 attempts on failure
- Workers: 1 (sequential execution)
- Screenshots/videos on failure
- HTML test report

## Debugging Tests

### Visual Debugging
```bash
npm run test:e2e:ui
```

### Step-through Debugging
```bash
npm run test:e2e:debug
```

### View Traces
After a test failure, traces are available in `playwright-report/`:
```bash
npx playwright show-trace trace.zip
```

### Screenshots
Screenshots on failure are saved in `test-results/`

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
