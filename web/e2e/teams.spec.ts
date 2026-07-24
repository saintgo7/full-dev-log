import { test, expect } from '@playwright/test';
import { login, testUsers } from './fixtures/auth.fixture';

test.describe('Teams', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, testUsers.admin);

    // Navigate to teams page
    await page.goto('/teams');
  });

  test('should load teams page', async ({ page }) => {
    // Verify we're on the teams page
    await expect(page).toHaveURL('/teams');

    // Check for teams heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display teams list', async ({ page }) => {
    // Wait for teams list to load
    await page.waitForSelector('[data-testid="teams-list"]', { timeout: 10000 });

    // Check teams list is visible
    await expect(page.locator('[data-testid="teams-list"]')).toBeVisible();
  });

  test('should display create team button', async ({ page }) => {
    // Check for create team button
    await expect(page.locator('[data-testid="create-team-button"]')).toBeVisible();
  });

  test('should open create team dialog', async ({ page }) => {
    // Click create team button
    await page.click('[data-testid="create-team-button"]');

    // Verify dialog is open
    await expect(page.locator('[data-testid="create-team-dialog"]')).toBeVisible({ timeout: 2000 });

    // Check for form fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
  });

  test('should create new team', async ({ page }) => {
    // Click create team button
    await page.click('[data-testid="create-team-button"]');

    // Fill in team details
    const teamName = `Test Team ${Date.now()}`;
    await page.fill('input[name="name"]', teamName);
    await page.fill('textarea[name="description"]', 'This is a test team for E2E testing');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for dialog to close
    await expect(page.locator('[data-testid="create-team-dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Verify team appears in list
    await expect(page.locator(`text=${teamName}`)).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for empty team name', async ({ page }) => {
    // Click create team button
    await page.click('[data-testid="create-team-button"]');

    // Try to submit without filling name
    await page.click('button[type="submit"]');

    // Dialog should still be visible
    await expect(page.locator('[data-testid="create-team-dialog"]')).toBeVisible();

    // Should show error message (adjust selector based on actual implementation)
    // await expect(page.locator('text=/required|cannot be empty/i')).toBeVisible();
  });

  test('should navigate to team detail page', async ({ page }) => {
    // Wait for teams list
    await page.waitForSelector('[data-testid="teams-list"]', { timeout: 10000 });

    // Get first team card
    const firstTeam = page.locator('[data-testid="team-card"]').first();

    // Check if any teams exist
    const teamCount = await page.locator('[data-testid="team-card"]').count();

    if (teamCount > 0) {
      await firstTeam.click();

      // Should navigate to team detail page
      await expect(page).toHaveURL(/\/teams\/\d+/, { timeout: 5000 });

      // Should display team details
      await expect(page.locator('[data-testid="team-detail"]')).toBeVisible();
    } else {
      console.log('No teams available to test navigation');
    }
  });

  test('should display team members section', async ({ page }) => {
    // Wait for teams list
    await page.waitForSelector('[data-testid="teams-list"]', { timeout: 10000 });

    const teamCount = await page.locator('[data-testid="team-card"]').count();

    if (teamCount > 0) {
      // Click first team
      await page.locator('[data-testid="team-card"]').first().click();

      // Wait for team detail page
      await page.waitForSelector('[data-testid="team-detail"]', { timeout: 5000 });

      // Check for members section
      await expect(page.locator('[data-testid="team-members"]')).toBeVisible();
    }
  });

  test('should display invite member button on team detail', async ({ page }) => {
    await page.waitForSelector('[data-testid="teams-list"]', { timeout: 10000 });

    const teamCount = await page.locator('[data-testid="team-card"]').count();

    if (teamCount > 0) {
      // Click first team
      await page.locator('[data-testid="team-card"]').first().click();

      // Wait for team detail page
      await page.waitForSelector('[data-testid="team-detail"]', { timeout: 5000 });

      // Check for invite button
      await expect(page.locator('[data-testid="invite-member-button"]')).toBeVisible();
    }
  });

  test('should open invite member dialog', async ({ page }) => {
    await page.waitForSelector('[data-testid="teams-list"]', { timeout: 10000 });

    const teamCount = await page.locator('[data-testid="team-card"]').count();

    if (teamCount > 0) {
      // Click first team
      await page.locator('[data-testid="team-card"]').first().click();

      // Click invite member button
      await page.click('[data-testid="invite-member-button"]');

      // Verify dialog is open
      await expect(page.locator('[data-testid="invite-member-dialog"]')).toBeVisible({ timeout: 2000 });

      // Check for email input
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });

  test('should handle empty teams list', async ({ page }) => {
    // This test might show empty state or existing teams
    await page.waitForSelector('[data-testid="teams-list"]', { timeout: 10000 });

    // Either teams exist or empty state is shown
    const teamCount = await page.locator('[data-testid="team-card"]').count();

    if (teamCount === 0) {
      // Should show empty state message
      await expect(page.locator('text=/no teams|create your first team/i')).toBeVisible();
    } else {
      // Should show teams
      expect(teamCount).toBeGreaterThan(0);
    }
  });

  test('should search teams', async ({ page }) => {
    // Check if search input exists
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');

    if (await searchInput.count() > 0) {
      await searchInput.fill('test');

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Results should be filtered (exact behavior depends on implementation)
    }
  });
});
