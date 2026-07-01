# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication & Onboarding (PR Suite) >> User can sign up and reach workspace creation
- Location: tests\auth.spec.ts:4:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication & Onboarding (PR Suite)', () => {
  4  |   test('User can sign up and reach workspace creation', async ({ page }) => {
  5  |     // We would use a mock Clerk testing token here, or bypass via a synthetic route
  6  |     // For this demonstration, we are setting up the structure.
> 7  |     await page.goto('/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  8  |     // Assert title or basic layout
  9  |     await expect(page).toHaveTitle(/NeuralFlow AI/i);
  10 |   });
  11 | });
  12 | 
```