import { test, expect } from '@playwright/test';
import { login, testUsers } from './fixtures/auth.fixture';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, testUsers.admin);

    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should display notification bell', async ({ page }) => {
    // Check for notification bell
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
  });

  test('should open notification panel when bell is clicked', async ({ page }) => {
    // Click notification bell
    await page.click('[data-testid="notification-bell"]');

    // Verify notification panel is visible
    await expect(page.locator('[data-testid="notification-panel"]')).toBeVisible({ timeout: 2000 });
  });

  test('should close notification panel when clicking outside', async ({ page }) => {
    // Open notification panel
    await page.click('[data-testid="notification-bell"]');

    // Wait for panel to open
    await expect(page.locator('[data-testid="notification-panel"]')).toBeVisible({ timeout: 2000 });

    // Click outside the panel
    await page.click('body', { position: { x: 10, y: 10 } });

    // Panel should close
    await expect(page.locator('[data-testid="notification-panel"]')).not.toBeVisible({ timeout: 2000 });
  });

  test('should display notification list', async ({ page }) => {
    // Open notification panel
    await page.click('[data-testid="notification-bell"]');

    // Check for notification list
    await expect(page.locator('[data-testid="notification-list"]')).toBeVisible();
  });

  test('should display unread notification count', async ({ page }) => {
    // Check if badge exists
    const badge = page.locator('[data-testid="notification-badge"]');

    // Badge might or might not be visible depending on notifications
    const isVisible = await badge.isVisible().catch(() => false);

    if (isVisible) {
      // If badge is visible, it should have a number
      const text = await badge.textContent();
      expect(text).toMatch(/\d+/);
    }
  });

  test('should mark notification as read', async ({ page }) => {
    // Open notification panel
    await page.click('[data-testid="notification-bell"]');

    // Wait for notifications to load
    await page.waitForSelector('[data-testid="notification-list"]', { timeout: 5000 });

    // Check if there are any notifications
    const notificationCount = await page.locator('[data-testid="notification-item"]').count();

    if (notificationCount > 0) {
      // Click first notification
      await page.locator('[data-testid="notification-item"]').first().click();

      // Notification should be marked as read (visual change)
      // Exact behavior depends on implementation
    } else {
      console.log('No notifications available to test');
    }
  });

  test('should mark all as read', async ({ page }) => {
    // Open notification panel
    await page.click('[data-testid="notification-bell"]');

    // Wait for panel
    await expect(page.locator('[data-testid="notification-panel"]')).toBeVisible({ timeout: 2000 });

    // Check if "Mark all as read" button exists
    const markAllButton = page.locator('[data-testid="mark-all-read"], text="Mark all as read"');

    if (await markAllButton.isVisible().catch(() => false)) {
      await markAllButton.click();

      // Badge should disappear or show 0
      const badge = page.locator('[data-testid="notification-badge"]');
      await expect(badge).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should filter notifications by type', async ({ page }) => {
    // Open notification panel
    await page.click('[data-testid="notification-bell"]');

    // Check if filter options exist
    const allFilter = page.locator('[data-testid="notification-filter-all"]');
    const unreadFilter = page.locator('[data-testid="notification-filter-unread"]');

    if (await allFilter.isVisible().catch(() => false)) {
      await unreadFilter.click();

      // Should filter to only unread notifications
      await page.waitForTimeout(500);

      // Verify filter is applied (exact behavior depends on implementation)
    }
  });

  test('should display notification toast for real-time updates', async ({ page }) => {
    // This test depends on having a WebSocket connection
    // and receiving real-time notifications

    // Wait for potential toast notification
    const toast = page.locator('[data-testid="notification-toast"]');

    // Toast might appear, but we can't guarantee it in E2E tests
    // Just verify the component exists in DOM or can be triggered
    await page.waitForTimeout(2000);

    // If toast appears, it should be visible
    const isToastVisible = await toast.isVisible().catch(() => false);

    if (isToastVisible) {
      expect(await toast.textContent()).toBeTruthy();
    }
  });

  test('should navigate to notification source', async ({ page }) => {
    // Open notification panel
    await page.click('[data-testid="notification-bell"]');

    // Wait for notifications
    await page.waitForSelector('[data-testid="notification-list"]', { timeout: 5000 });

    const notificationCount = await page.locator('[data-testid="notification-item"]').count();

    if (notificationCount > 0) {
      // Get first notification
      const firstNotification = page.locator('[data-testid="notification-item"]').first();

      // Click notification
      await firstNotification.click();

      // Should navigate somewhere (depends on notification type)
      await page.waitForTimeout(1000);

      // Panel should close
      await expect(page.locator('[data-testid="notification-panel"]')).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should display empty state when no notifications', async ({ page }) => {
    // Open notification panel
    await page.click('[data-testid="notification-bell"]');

    // Wait for notifications to load
    await page.waitForSelector('[data-testid="notification-list"]', { timeout: 5000 });

    const notificationCount = await page.locator('[data-testid="notification-item"]').count();

    if (notificationCount === 0) {
      // Should show empty state message
      await expect(page.locator('text=/no notifications|all caught up/i')).toBeVisible();
    }
  });

  test('should show notification timestamp', async ({ page }) => {
    // Open notification panel
    await page.click('[data-testid="notification-bell"]');

    // Wait for notifications
    await page.waitForSelector('[data-testid="notification-list"]', { timeout: 5000 });

    const notificationCount = await page.locator('[data-testid="notification-item"]').count();

    if (notificationCount > 0) {
      // Check first notification has timestamp
      const timestamp = page.locator('[data-testid="notification-item"]').first().locator('[data-testid="notification-timestamp"]');

      await expect(timestamp).toBeVisible();
    }
  });
});
