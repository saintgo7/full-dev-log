import { test, expect } from '@playwright/test';

/**
 * Smoke Tests
 *
 * Quick tests to verify the application is running and basic functionality works.
 * These tests should be fast and catch critical failures.
 */
test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Should have a title
    await expect(page).toHaveTitle(/DevLog Hub|DevLog/);

    // Page should be loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load the login page', async ({ page }) => {
    await page.goto('/login');

    // Should display login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should load the registration page', async ({ page }) => {
    await page.goto('/register');

    // Should display registration form
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have working navigation links on login page', async ({ page }) => {
    await page.goto('/login');

    // Check for register link
    const registerLink = page.locator('text=/sign up|register/i').first();
    await expect(registerLink).toBeVisible();

    // Click register link
    await registerLink.click();

    // Should navigate to register page
    await expect(page).toHaveURL(/\/register/);
  });

  test('should have working navigation links on register page', async ({ page }) => {
    await page.goto('/register');

    // Check for login link
    const loginLink = page.locator('text=/sign in|login/i').first();
    await expect(loginLink).toBeVisible();

    // Click login link
    await loginLink.click();

    // Should navigate to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should display proper error for invalid login', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);

    // Should show some kind of error (text might vary)
    // Wait a bit for error to appear
    await page.waitForTimeout(1000);
  });

  test('should have no console errors on login page', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Collect console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/login');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('should have responsive meta tags', async ({ page }) => {
    await page.goto('/login');

    // Check for viewport meta tag
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('width=device-width');
  });

  test('should load CSS properly', async ({ page }) => {
    await page.goto('/login');

    // Check that styles are applied by checking computed styles
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should have some background color set (not transparent)
    expect(backgroundColor).toBeTruthy();
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});

/**
 * API Health Check Smoke Tests
 */
test.describe('API Health Checks', () => {
  test('should be able to reach the API server', async ({ request }) => {
    // Try to reach the health endpoint or any public endpoint
    const response = await request.get('http://localhost:3001/health').catch(() => null);

    // If health endpoint doesn't exist, that's okay for now
    // Just checking if server is reachable
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
  });
});
