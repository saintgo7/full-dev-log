import { chromium, FullConfig } from '@playwright/test';
import { testUsers } from './fixtures/auth.fixture';

/**
 * Global setup runs once before all tests
 * Used to prepare test environment, create test users, etc.
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  const { baseURL } = config.projects[0].use;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the dev server to be ready
    console.log('⏳ Waiting for dev server...');
    await page.goto(baseURL || 'http://localhost:3020', { waitUntil: 'networkidle' });
    console.log('✅ Dev server is ready');

    // Create test users if needed
    // Note: This depends on your backend API having a registration endpoint
    await createTestUsers(page, baseURL || 'http://localhost:3020');

    console.log('✅ Global test setup completed');
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function createTestUsers(page: any, baseURL: string) {
  console.log('👤 Setting up test users...');

  // Try to register test users
  // Skip if users already exist (registration will fail)
  for (const [name, user] of Object.entries(testUsers)) {
    try {
      console.log(`Creating test user: ${user.email}`);

      // Navigate to register page
      await page.goto(`${baseURL}/register`);

      // Try to register
      await page.fill('input[type="text"]', user.name);
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);

      await page.click('button[type="submit"]');

      // Wait for either success (redirect to dashboard) or error
      await Promise.race([
        page.waitForURL(`${baseURL}/dashboard`, { timeout: 5000 }),
        page.waitForSelector('text=/already exists|already registered/i', { timeout: 5000 })
      ]).catch(() => {
        // User might already exist, that's okay
        console.log(`User ${user.email} might already exist`);
      });

      // Logout if we're logged in
      try {
        const logoutButton = page.locator('[data-testid="user-menu"]');
        if (await logoutButton.isVisible({ timeout: 1000 })) {
          await logoutButton.click();
          await page.click('[data-testid="logout-button"]');
          await page.waitForURL(`${baseURL}/login`, { timeout: 2000 });
        }
      } catch (e) {
        // Not logged in or logout failed, continue
      }

      console.log(`✅ Test user ${user.email} ready`);
    } catch (error) {
      console.log(`⚠️  Could not create test user ${user.email}:`, error.message);
      // Continue anyway - user might already exist
    }
  }

  console.log('✅ Test users setup completed');
}

export default globalSetup;
