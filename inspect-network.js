import 'dotenv/config';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = join(__dirname, 'session.json');
const SCHEDULE_URL = 'https://www.tds.ms/CentralizeSP/BtwScheduling/Lessons?SchedulingTypeId=1';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: SESSION_FILE });
const page = await context.newPage();

const calls = [];
page.on('response', async (res) => {
  const url = res.url();
  const ct = res.headers()['content-type'] || '';
  if (ct.includes('json') || /schedul|calendar|appnt|day|slot/i.test(url)) {
    let body = null;
    try { body = await res.text(); } catch {}
    calls.push({ url, status: res.status(), contentType: ct, bodySnippet: body ? body.slice(0, 800) : null });
  }
});

await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
// trigger month navigation to catch the AJAX call
await page.click('.ui-datepicker-next').catch(() => {});
await page.waitForTimeout(2000);

console.log(JSON.stringify(calls, null, 2));
await browser.close();
