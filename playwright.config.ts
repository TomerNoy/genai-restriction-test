import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config(); // loads .env locally; no-op in CI where env vars are injected directly

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'on-failure' }]],
});
