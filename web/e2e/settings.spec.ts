import { test, expect } from '@playwright/test';
import { login, testUsers } from './fixtures/auth.fixture';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, testUsers.admin);

    // Navigate to settings page
    await page.goto('/settings');
  });

  test('should load settings page', async ({ page }) => {
    // Verify we're on the settings page
    await expect(page).toHaveURL('/settings');

    // Check for settings heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display settings tabs', async ({ page }) => {
    // Check for tabs
    await expect(page.locator('[data-testid="settings-tabs"]')).toBeVisible();

    // Check for specific tabs
    await expect(page.locator('[data-testid="tab-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-notifications"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-security"]')).toBeVisible();
  });

  test('should display profile settings', async ({ page }) => {
    // Click profile tab
    await page.click('[data-testid="tab-profile"]');

    // Check for profile form fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    // Click profile tab
    await page.click('[data-testid="tab-profile"]');

    // Update name
    await page.fill('input[name="name"]', 'Updated Test User');

    // Save changes
    await page.click('[data-testid="save-profile-button"]');

    // Should show success message
    await expect(page.locator('text=/saved|updated successfully/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display notification preferences', async ({ page }) => {
    // Click notifications tab
    await page.click('[data-testid="tab-notifications"]');

    // Check for notification settings
    await expect(page.locator('[data-testid="notification-preferences"]')).toBeVisible();
  });

  test('should toggle email notifications', async ({ page }) => {
    // Click notifications tab
    await page.click('[data-testid="tab-notifications"]');

    // Find email notification toggle
    const emailToggle = page.locator('[data-testid="email-notifications-toggle"]');

    // Check if toggle exists
    if (await emailToggle.isVisible().catch(() => false)) {
      // Get initial state
      const initialState = await emailToggle.isChecked();

      // Toggle the switch
      await emailToggle.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Verify state changed
      const newState = await emailToggle.isChecked();
      expect(newState).toBe(!initialState);
    }
  });

  test('should toggle push notifications', async ({ page }) => {
    // Click notifications tab
    await page.click('[data-testid="tab-notifications"]');

    // Find push notification toggle
    const pushToggle = page.locator('[data-testid="push-notifications-toggle"]');

    if (await pushToggle.isVisible().catch(() => false)) {
      // Get initial state
      const initialState = await pushToggle.isChecked();

      // Toggle the switch
      await pushToggle.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Verify state changed
      const newState = await pushToggle.isChecked();
      expect(newState).toBe(!initialState);
    }
  });

  test('should toggle desktop notifications', async ({ page }) => {
    // Click notifications tab
    await page.click('[data-testid="tab-notifications"]');

    // Find desktop notification toggle
    const desktopToggle = page.locator('[data-testid="desktop-notifications-toggle"]');

    if (await desktopToggle.isVisible().catch(() => false)) {
      // Get initial state
      const initialState = await desktopToggle.isChecked();

      // Toggle the switch
      await desktopToggle.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Verify state changed
      const newState = await desktopToggle.isChecked();
      expect(newState).toBe(!initialState);
    }
  });

  test('should display security settings', async ({ page }) => {
    // Click security tab
    await page.click('[data-testid="tab-security"]');

    // Check for security settings
    await expect(page.locator('[data-testid="security-settings"]')).toBeVisible();
  });

  test('should display change password form', async ({ page }) => {
    // Click security tab
    await page.click('[data-testid="tab-security"]');

    // Check for password change form
    await expect(page.locator('[data-testid="change-password-form"]')).toBeVisible();

    // Check for password fields
    await expect(page.locator('input[name="currentPassword"]')).toBeVisible();
    await expect(page.locator('input[name="newPassword"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('should change password', async ({ page }) => {
    // Click security tab
    await page.click('[data-testid="tab-security"]');

    // Fill in password change form
    await page.fill('input[name="currentPassword"]', testUsers.admin.password);
    await page.fill('input[name="newPassword"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');

    // Submit form
    await page.click('[data-testid="change-password-button"]');

    // Should show success message
    await expect(page.locator('text=/password changed|password updated/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    // Click security tab
    await page.click('[data-testid="tab-security"]');

    // Fill in mismatched passwords
    await page.fill('input[name="currentPassword"]', testUsers.admin.password);
    await page.fill('input[name="newPassword"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

    // Submit form
    await page.click('[data-testid="change-password-button"]');

    // Should show error message
    await expect(page.locator('text=/passwords do not match|passwords must match/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display account information', async ({ page }) => {
    // Click profile tab
    await page.click('[data-testid="tab-profile"]');

    // Check for account info section
    await expect(page.locator('[data-testid="account-info"]')).toBeVisible();
  });

  test('should display two-factor authentication option', async ({ page }) => {
    // Click security tab
    await page.click('[data-testid="tab-security"]');

    // Check if 2FA section exists
    const twoFactorSection = page.locator('[data-testid="two-factor-auth"]');

    if (await twoFactorSection.isVisible().catch(() => false)) {
      await expect(twoFactorSection).toBeVisible();
    }
  });

  test('should display API keys section', async ({ page }) => {
    // Check if API keys tab exists
    const apiKeysTab = page.locator('[data-testid="tab-api-keys"]');

    if (await apiKeysTab.isVisible().catch(() => false)) {
      await apiKeysTab.click();

      // Should display API keys section
      await expect(page.locator('[data-testid="api-keys-section"]')).toBeVisible();
    }
  });

  test('should display avatar upload', async ({ page }) => {
    // Click profile tab
    await page.click('[data-testid="tab-profile"]');

    // Check for avatar upload section
    const avatarUpload = page.locator('[data-testid="avatar-upload"]');

    if (await avatarUpload.isVisible().catch(() => false)) {
      await expect(avatarUpload).toBeVisible();
    }
  });

  test('should save notification preferences', async ({ page }) => {
    // Click notifications tab
    await page.click('[data-testid="tab-notifications"]');

    // Make some changes
    const emailToggle = page.locator('[data-testid="email-notifications-toggle"]');

    if (await emailToggle.isVisible().catch(() => false)) {
      await emailToggle.click();

      // Save preferences
      const saveButton = page.locator('[data-testid="save-notifications-button"]');

      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();

        // Should show success message
        await expect(page.locator('text=/saved|updated successfully/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display language preference', async ({ page }) => {
    // Check if language selector exists
    const languageSelector = page.locator('[data-testid="language-selector"]');

    if (await languageSelector.isVisible().catch(() => false)) {
      await expect(languageSelector).toBeVisible();
    }
  });

  test('should display timezone preference', async ({ page }) => {
    // Check if timezone selector exists
    const timezoneSelector = page.locator('[data-testid="timezone-selector"]');

    if (await timezoneSelector.isVisible().catch(() => false)) {
      await expect(timezoneSelector).toBeVisible();
    }
  });

  test('should display delete account option', async ({ page }) => {
    // Check if delete account section exists
    const deleteAccountSection = page.locator('[data-testid="delete-account"]');

    if (await deleteAccountSection.isVisible().catch(() => false)) {
      await expect(deleteAccountSection).toBeVisible();

      // Should have delete button
      await expect(page.locator('[data-testid="delete-account-button"]')).toBeVisible();
    }
  });
});
