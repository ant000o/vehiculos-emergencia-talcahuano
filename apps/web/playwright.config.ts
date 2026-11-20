import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1366, height: 768 },
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run start:dev --workspace=apps/backend',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 60000,
    },
    {
      command: 'npm run dev --workspace=apps/web',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
});
