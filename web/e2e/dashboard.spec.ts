import { test, expect } from '@playwright/test';
import { login, testUsers } from './fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, testUsers.admin);
  });

  test('should load dashboard page', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check for main heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('[data-testid="stats-card"]', { timeout: 10000 });

    // Check that we have multiple stats cards
    const statsCards = page.locator('[data-testid="stats-card"]');
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);

    // Each card should have a value and label
    for (let i = 0; i < count; i++) {
      const card = statsCards.nth(i);
      await expect(card).toBeVisible();
    }
  });

  test('should display recent activities', async ({ page }) => {
    // Wait for activities section
    await page.waitForSelector('[data-testid="recent-activities"]', { timeout: 10000 });

    // Check activities are visible
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
  });

  test('should navigate to agents page', async ({ page }) => {
    // Click on Agents link in sidebar
    await page.click('[data-testid="sidebar-agents"]');

    // Verify we're on agents page
    await expect(page).toHaveURL('/agents');
  });

  test('should navigate to events page', async ({ page }) => {
    // Click on Events link in sidebar
    await page.click('[data-testid="sidebar-events"]');

    // Verify we're on events page
    await expect(page).toHaveURL('/events');
  });

  test('should navigate to reports page', async ({ page }) => {
    // Click on Reports link in sidebar
    await page.click('[data-testid="sidebar-reports"]');

    // Verify we're on reports page
    await expect(page).toHaveURL('/reports');
  });

  test('should navigate to teams page', async ({ page }) => {
    // Click on Teams link in sidebar
    await page.click('[data-testid="sidebar-teams"]');

    // Verify we're on teams page
    await expect(page).toHaveURL('/teams');
  });

  test('should navigate to settings page', async ({ page }) => {
    // Click on Settings link in sidebar
    await page.click('[data-testid="sidebar-settings"]');

    // Verify we're on settings page
    await expect(page).toHaveURL('/settings');
  });

  test('should display user menu', async ({ page }) => {
    // Click user menu
    await page.click('[data-testid="user-menu"]');

    // Verify menu is visible
    await expect(page.locator('[data-testid="user-menu-dropdown"]')).toBeVisible({ timeout: 2000 });

    // Check for logout option
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
  });

  test('should display notification bell', async ({ page }) => {
    // Check for notification bell
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
  });

  test('should handle sidebar navigation', async ({ page }) => {
    // Test multiple navigation clicks
    await page.click('[data-testid="sidebar-events"]');
    await expect(page).toHaveURL('/events');

    await page.click('[data-testid="sidebar-dashboard"]');
    await expect(page).toHaveURL('/dashboard');

    await page.click('[data-testid="sidebar-reports"]');
    await expect(page).toHaveURL('/reports');
  });

  test('should display correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/DevLog Hub|Dashboard/);
  });
});
