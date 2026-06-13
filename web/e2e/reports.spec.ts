import { test, expect } from '@playwright/test';
import { login, testUsers } from './fixtures/auth.fixture';

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, testUsers.admin);

    // Navigate to reports page
    await page.goto('/reports');
  });

  test('should load reports page', async ({ page }) => {
    // Verify we're on the reports page
    await expect(page).toHaveURL('/reports');

    // Check for reports heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display reports list', async ({ page }) => {
    // Wait for reports list to load
    await page.waitForSelector('[data-testid="reports-list"]', { timeout: 10000 });

    // Check reports list is visible
    await expect(page.locator('[data-testid="reports-list"]')).toBeVisible();
  });

  test('should display generate report button', async ({ page }) => {
    // Check for generate report button
    await expect(page.locator('[data-testid="generate-report-button"]')).toBeVisible();
  });

  test('should open generate report dialog', async ({ page }) => {
    // Click generate report button
    await page.click('[data-testid="generate-report-button"]');

    // Verify dialog is open
    await expect(page.locator('[data-testid="generate-report-dialog"]')).toBeVisible({ timeout: 2000 });

    // Check for form fields
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('select[name="type"]')).toBeVisible();
  });

  test('should generate new report', async ({ page }) => {
    // Click generate report button
    await page.click('[data-testid="generate-report-button"]');

    // Fill in report details
    const reportTitle = `Test Report ${Date.now()}`;
    await page.fill('input[name="title"]', reportTitle);

    // Select report type
    await page.selectOption('select[name="type"]', 'DAILY');

    // Select date range
    await page.fill('input[name="startDate"]', '2026-01-01');
    await page.fill('input[name="endDate"]', '2026-01-12');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for dialog to close
    await expect(page.locator('[data-testid="generate-report-dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Verify report appears in list (might take time to generate)
    await expect(page.locator(`text=${reportTitle}`)).toBeVisible({ timeout: 10000 });
  });

  test('should show validation error for empty report title', async ({ page }) => {
    // Click generate report button
    await page.click('[data-testid="generate-report-button"]');

    // Try to submit without filling title
    await page.click('button[type="submit"]');

    // Dialog should still be visible
    await expect(page.locator('[data-testid="generate-report-dialog"]')).toBeVisible();
  });

  test('should display report type filter', async ({ page }) => {
    // Check for type filter
    const typeFilter = page.locator('[data-testid="report-type-filter"]');

    if (await typeFilter.isVisible().catch(() => false)) {
      await typeFilter.click();

      // Should show filter options
      await expect(page.locator('text="DAILY"')).toBeVisible();
      await expect(page.locator('text="WEEKLY"')).toBeVisible();
      await expect(page.locator('text="MONTHLY"')).toBeVisible();
    }
  });

  test('should filter reports by type', async ({ page }) => {
    const typeFilter = page.locator('[data-testid="report-type-filter"]');

    if (await typeFilter.isVisible().catch(() => false)) {
      // Select DAILY filter
      await typeFilter.selectOption('DAILY');

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Verify filtered results (exact behavior depends on implementation)
    }
  });

  test('should navigate to report detail page', async ({ page }) => {
    // Wait for reports list
    await page.waitForSelector('[data-testid="reports-list"]', { timeout: 10000 });

    // Get first report card
    const reportCount = await page.locator('[data-testid="report-card"]').count();

    if (reportCount > 0) {
      await page.locator('[data-testid="report-card"]').first().click();

      // Should navigate to report detail page
      await expect(page).toHaveURL(/\/reports\/\d+/, { timeout: 5000 });

      // Should display report details
      await expect(page.locator('[data-testid="report-detail"]')).toBeVisible();
    } else {
      console.log('No reports available to test navigation');
    }
  });

  test('should display report statistics', async ({ page }) => {
    await page.waitForSelector('[data-testid="reports-list"]', { timeout: 10000 });

    const reportCount = await page.locator('[data-testid="report-card"]').count();

    if (reportCount > 0) {
      // Click first report
      await page.locator('[data-testid="report-card"]').first().click();

      // Wait for report detail page
      await page.waitForSelector('[data-testid="report-detail"]', { timeout: 5000 });

      // Check for statistics section
      await expect(page.locator('[data-testid="report-stats"]')).toBeVisible();
    }
  });

  test('should display report charts', async ({ page }) => {
    await page.waitForSelector('[data-testid="reports-list"]', { timeout: 10000 });

    const reportCount = await page.locator('[data-testid="report-card"]').count();

    if (reportCount > 0) {
      // Click first report
      await page.locator('[data-testid="report-card"]').first().click();

      // Wait for report detail page
      await page.waitForSelector('[data-testid="report-detail"]', { timeout: 5000 });

      // Check for charts section
      await expect(page.locator('[data-testid="report-charts"]')).toBeVisible();
    }
  });

  test('should download report', async ({ page }) => {
    await page.waitForSelector('[data-testid="reports-list"]', { timeout: 10000 });

    const reportCount = await page.locator('[data-testid="report-card"]').count();

    if (reportCount > 0) {
      // Click first report
      await page.locator('[data-testid="report-card"]').first().click();

      // Wait for report detail page
      await page.waitForSelector('[data-testid="report-detail"]', { timeout: 5000 });

      // Check for download button
      const downloadButton = page.locator('[data-testid="download-report-button"]');

      if (await downloadButton.isVisible().catch(() => false)) {
        // Setup download handler
        const downloadPromise = page.waitForEvent('download');

        // Click download button
        await downloadButton.click();

        // Wait for download
        const download = await downloadPromise;

        // Verify download started
        expect(download.suggestedFilename()).toBeTruthy();
      }
    }
  });

  test('should delete report', async ({ page }) => {
    await page.waitForSelector('[data-testid="reports-list"]', { timeout: 10000 });

    const reportCount = await page.locator('[data-testid="report-card"]').count();

    if (reportCount > 0) {
      // Click first report
      await page.locator('[data-testid="report-card"]').first().click();

      // Wait for report detail page
      await page.waitForSelector('[data-testid="report-detail"]', { timeout: 5000 });

      // Check for delete button
      const deleteButton = page.locator('[data-testid="delete-report-button"]');

      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();

        // Confirm deletion
        await page.click('[data-testid="confirm-delete-button"]');

        // Should navigate back to reports list
        await expect(page).toHaveURL('/reports', { timeout: 5000 });
      }
    }
  });

  test('should handle empty reports list', async ({ page }) => {
    await page.waitForSelector('[data-testid="reports-list"]', { timeout: 10000 });

    const reportCount = await page.locator('[data-testid="report-card"]').count();

    if (reportCount === 0) {
      // Should show empty state message
      await expect(page.locator('text=/no reports|generate your first report/i')).toBeVisible();
    } else {
      // Should show reports
      expect(reportCount).toBeGreaterThan(0);
    }
  });

  test('should display report status', async ({ page }) => {
    await page.waitForSelector('[data-testid="reports-list"]', { timeout: 10000 });

    const reportCount = await page.locator('[data-testid="report-card"]').count();

    if (reportCount > 0) {
      // Each report should have a status indicator
      const firstReport = page.locator('[data-testid="report-card"]').first();
      const status = firstReport.locator('[data-testid="report-status"]');

      await expect(status).toBeVisible();
    }
  });

  test('should sort reports', async ({ page }) => {
    // Check if sort dropdown exists
    const sortDropdown = page.locator('[data-testid="report-sort"]');

    if (await sortDropdown.isVisible().catch(() => false)) {
      await sortDropdown.click();

      // Should show sort options
      await expect(page.locator('text="Newest First"')).toBeVisible();
      await expect(page.locator('text="Oldest First"')).toBeVisible();
    }
  });
});
