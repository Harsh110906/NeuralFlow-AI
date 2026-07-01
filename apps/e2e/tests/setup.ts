import { test as base } from '@playwright/test';

// Here we would configure global setup or fixture overrides for database teardown.
// Example: truncating tables and running prisma seed via execSync for PR suite.

export const test = base.extend({
  // Add custom fixtures like seeded DB context here
  seededContext: async ({}, use) => {
    // 1. Truncate DB (using raw SQL or prisma migrate reset)
    // 2. Inject seed data (Workspaces, RBAC users, etc.)
    await use({});
  }
});

export { expect } from '@playwright/test';
