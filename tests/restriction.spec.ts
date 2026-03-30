import { test, expect, BrowserContext, chromium } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '../extension');
const API_DOMAIN = process.env.API_DOMAIN ?? '';
const API_KEY = process.env.API_KEY ?? '';
const HEADLESS = process.env.HEADLESS !== 'false';

async function createContextWithExtension(): Promise<BrowserContext> {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      ...(HEADLESS ? ['--headless=new'] : []),
    ],
  });
  return context;
}

async function configureExtension(context: BrowserContext): Promise<void> {
  // Wait for the extension service worker to be ready
  let [worker] = context.serviceWorkers();
  if (!worker) {
    worker = await context.waitForEvent('serviceworker', { timeout: 10000 });
  }

  // Inject credentials into extension storage
  await worker.evaluate(
    ([domain, key]) => {
      return new Promise<void>((resolve) => {
        chrome.storage.local.set({ apiDomain: domain, apiKey: key }, resolve);
      });
    },
    [API_DOMAIN, API_KEY]
  );

  // Wait until the extension has loaded its blocking policies from the API
  await expect(async () => {
    const ready = await worker.evaluate(() =>
      new Promise<boolean>(resolve =>
        chrome.storage.local.get(['init'], result => resolve(!!result['init']))
      )
    );
    expect(ready).toBe(true);
  }).toPass({ timeout: 10000, intervals: [500] });
}

test.describe('GenAI Extension Policy', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    if (!API_DOMAIN || !API_KEY) {
      throw new Error('API_DOMAIN and API_KEY environment variables must be set');
    }
    context = await createContextWithExtension();
    await configureExtension(context);
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      for (const page of context.pages().filter(p => !p.url().startsWith('chrome-extension://'))) {
        await page.screenshot({ path: `test-results/${testInfo.title.replace(/\s+/g, '-')}-failure.png` });
      }
    }
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('allows access to chatgpt.com', async () => {
    const page = await context.newPage();

    await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Page should stay on chatgpt.com (not redirected to a block page)
    expect(page.url()).toContain('chatgpt.com');

    // No block indicator in the page content
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    expect(bodyText.toLowerCase()).not.toContain('blocked by');

    await page.close();
  });

  test('blocks access to gemini.google.com', async () => {
    const page = await context.newPage();

    await page.goto('https://gemini.google.com', { waitUntil: 'domcontentloaded', timeout: 15000 });

    const currentUrl = page.url();
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');

    const isRedirectedAway = !currentUrl.includes('gemini.google.com');
    const hasBlockMessage = bodyText.toLowerCase().includes('block') ||
                            bodyText.toLowerCase().includes('not allowed') ||
                            bodyText.toLowerCase().includes('restricted');

    expect(isRedirectedAway || hasBlockMessage).toBe(true);

    await page.close();
  });
});
