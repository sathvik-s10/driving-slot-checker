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
await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

const hidden = await page.evaluate(() => ({
  hdnAvailableDates: document.querySelector('#hdnAvailableDates')?.value,
  hdnNotLoadedDates: document.querySelector('#hdnNotLoadedDates')?.value,
  hdnMindate: document.querySelector('#hdnMindate')?.value,
  hdnMaxdate: document.querySelector('#hdnMaxdate')?.value,
  hdnWeekStartOn: document.querySelector('#hdnWeekStartOn')?.value,
  hdnEnableCalendarSettings: document.querySelector('#hdnEnableCalendarSettings')?.value
}));
console.log(JSON.stringify(hidden, null, 2));
await browser.close();
