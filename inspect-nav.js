import 'dotenv/config';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = join(__dirname, 'session.json');
const SCHEDULE_URL = 'https://www.tds.ms/CentralizeSP/BtwScheduling/Lessons?SchedulingTypeId=1';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: SESSION_FILE });
const page = await context.newPage();
await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const navInfo = await page.evaluate(() => {
  const next = document.querySelector('.ui-datepicker-next');
  const prev = document.querySelector('.ui-datepicker-prev');
  const title = document.querySelector('.ui-datepicker-title');
  return {
    nextHTML: next ? next.outerHTML : 'NOT FOUND',
    prevHTML: prev ? prev.outerHTML : 'NOT FOUND',
    titleText: title ? title.textContent.trim() : 'NOT FOUND'
  };
});
console.log(JSON.stringify(navInfo, null, 2));

await browser.close();
