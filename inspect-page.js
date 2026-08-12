import 'dotenv/config';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = join(__dirname, 'session.json');
const LOGIN_URL = 'https://www.tds.ms/CentralizeSP/Student/Login/Redmond911';
const SCHEDULE_URL = 'https://www.tds.ms/CentralizeSP/BtwScheduling/Lessons?SchedulingTypeId=1';

const { TDS_USERNAME, TDS_PASSWORD } = process.env;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
await page.fill('#username', TDS_USERNAME);
await page.fill('#password', TDS_PASSWORD);
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
  page.click('button.btn.green-haze.pull-right')
]);
await context.storageState({ path: SESSION_FILE });

await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

await page.screenshot({ path: join(__dirname, 'live-calendar.png'), fullPage: true });

// Dump the legend area
const legendInfo = await page.evaluate(() => {
  const results = [];
  const all = document.querySelectorAll('*');
  for (const el of all) {
    const text = (el.textContent || '').trim();
    if ((text === 'Available' || text === 'Booked' || text.includes('unavailable')) && el.children.length === 0) {
      const parent = el.closest('li, div, span') || el.parentElement;
      results.push({
        text,
        parentHTML: parent ? parent.outerHTML.slice(0, 500) : null
      });
    }
  }
  return results;
});

// Dump a sample of day cells with full computed style info
const dayInfo = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('*')).filter(
    (el) => el.children.length === 0 && /^\d{1,2}$/.test((el.textContent || '').trim())
  );
  return els.slice(0, 40).map((el) => {
    let node = el;
    const chain = [];
    for (let i = 0; i < 4 && node; i++) {
      const cs = getComputedStyle(node);
      chain.push({
        tag: node.tagName,
        className: node.className,
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        color: cs.color,
        borderColor: cs.borderColor
      });
      node = node.parentElement;
    }
    return { day: el.textContent.trim(), chain, outerHTML: el.parentElement ? el.parentElement.outerHTML.slice(0, 300) : null };
  });
});

console.log('=== LEGEND ===');
console.log(JSON.stringify(legendInfo, null, 2));
console.log('=== DAY CELLS (first 40) ===');
console.log(JSON.stringify(dayInfo, null, 2));

await browser.close();
