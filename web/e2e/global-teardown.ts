import { FullConfig } from '@playwright/test';

/**
 * Global teardown runs once after all tests
 * Used to cleanup test data, close connections, etc.
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  try {
    // Cleanup test data if needed
    // For now, we'll keep test data for debugging
    // In CI, the database should be ephemeral anyway

    // Future enhancements:
    // - Delete test users from database
    // - Clean up uploaded files
    // - Reset test database to clean state

    console.log('✅ Global test teardown completed');
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error in teardown to avoid failing the test suite
  }
}

export default globalTeardown;
