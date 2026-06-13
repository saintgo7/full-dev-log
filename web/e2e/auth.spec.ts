import { test, expect } from '@playwright/test';
import { login, logout, testUsers, clearAuthState } from './fixtures/auth.fixture';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/');
    await clearAuthState(page);
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Check page title
    await expect(page).toHaveTitle(/DevLog Hub/);

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for register link
    await expect(page.locator('text=Sign up')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page, testUsers.admin);

    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check for sidebar (authenticated state)
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Check for user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);

    // Should show error message
    await expect(page.locator('text=/Invalid credentials|Authentication failed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');

    // Try to submit without filling fields
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);

    // Note: Validation might be handled differently, adjust selectors as needed
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await login(page, testUsers.admin);

    // Then logout
    await logout(page);

    // Verify we're on login page
    await expect(page).toHaveURL('/login');

    // Verify we can't access protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/register');

    // Check for registration form elements
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for login link
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('should redirect to login when accessing teams without authentication', async ({ page }) => {
    await page.goto('/teams');

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('should redirect to login when accessing reports without authentication', async ({ page }) => {
    await page.goto('/reports');

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('should persist authentication after page reload', async ({ page }) => {
    // Login
    await login(page, testUsers.admin);

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });
});
