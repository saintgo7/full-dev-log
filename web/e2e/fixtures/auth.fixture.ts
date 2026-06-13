import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export const testUsers = {
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
};

/**
 * Login helper function
 * Navigates to login page, fills credentials and submits
 */
export async function login(page: Page, user: TestUser) {
  await page.goto('/login');

  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"]', { state: 'visible' });

  // Fill in credentials
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });

  // Verify we're logged in by checking for sidebar
  await page.waitForSelector('[data-testid="sidebar"]', { timeout: 5000 });
}

/**
 * Register helper function
 * Navigates to register page, fills form and submits
 */
export async function register(page: Page, user: TestUser) {
  await page.goto('/register');

  // Wait for register form to be visible
  await page.waitForSelector('input[type="text"]', { state: 'visible' });

  // Fill in registration form
  await page.fill('input[type="text"]', user.name);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout button
  await page.click('[data-testid="logout-button"]');

  // Wait for navigation to login page
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Get auth token from localStorage
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('accessToken');
  });
}

/**
 * Set auth token in localStorage
 */
export async function setAuthToken(page: Page, token: string) {
  await page.evaluate((token) => {
    localStorage.setItem('accessToken', token);
  }, token);
}

/**
 * Clear auth state
 */
export async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('accessToken');
  });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await getAuthToken(page);
  return token !== null;
}
