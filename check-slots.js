import 'dotenv/config';
import { chromium } from 'playwright';
import twilio from 'twilio';
import { spawn } from 'node:child_process';
import { appendFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(__dirname, 'check.log');
const SESSION_FILE = join(__dirname, 'session.json');

const LOGIN_URL = 'https://www.tds.ms/CentralizeSP/Student/Login/Redmond911';
const SCHEDULE_URL = 'https://www.tds.ms/CentralizeSP/BtwScheduling/Lessons?SchedulingTypeId=1';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}


function notify() {
  if (process.platform !== 'win32') {
    log('Popup notify skipped: not running on Windows');
    return;
  }
  spawn('cmd.exe', ['/c', 'start', '""', 'notify.bat', SCHEDULE_URL], {
    cwd: __dirname,
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  }).unref();
}

async function callPhone() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, TWILIO_TO_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !TWILIO_TO_NUMBER) {
    log('Twilio call skipped: TWILIO_* env vars not set');
    return;
  }
  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.calls.create({
      from: TWILIO_FROM_NUMBER,
      to: TWILIO_TO_NUMBER,
      twiml: '<Response><Say>A slot is now open at 911 Driving School. Go book it now.</Say><Pause length="1"/><Say>A slot is now open at 911 Driving School. Go book it now.</Say></Response>'
    });
    log('Twilio call placed successfully');
  } catch (err) {
    log(`Twilio call ERROR: ${err.message}`);
  }
}

async function isLoggedOut(page) {
  // the login form's #username field is only present when we've been bounced back to the login page
  return (await page.$('#username')) !== null;
}

async function login(page, username, password) {
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('#username', username);
  await page.fill('#password', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
    page.click('button.btn.green-haze.pull-right')
  ]);
}

async function main() {
  const { TDS_USERNAME, TDS_PASSWORD } = process.env;
  if (!TDS_USERNAME || !TDS_PASSWORD) {
    log('ERROR: TDS_USERNAME / TDS_PASSWORD not set in .env');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const hasSession = existsSync(SESSION_FILE);
  const context = await browser.newContext(hasSession ? { storageState: SESSION_FILE } : {});
  const page = await context.newPage();

  try {
    if (hasSession) {
      await page.goto(SCHEDULE_URL, { waitUntil: 'domcontentloaded' });
    }

    if (!hasSession || (await isLoggedOut(page))) {
      log(hasSession ? 'Saved session expired, logging in again' : 'No saved session, logging in');
      await login(page, TDS_USERNAME, TDS_PASSWORD);
      await context.storageState({ path: SESSION_FILE });
    } else {
      log('Reused saved session, no login needed');
    }

    await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle' });
    // give the calendar widget time to render after login redirect
    await page.waitForTimeout(2000);

    const days = await page.$$eval('td[class*="ui-state-"]', (cells) => {
      return cells
        .map((td) => {
          const text = (td.textContent || '').trim();
          const match = text.match(/\d{1,2}/);
          if (!match) return null;
          return { day: match[0], available: td.className.includes('ui-state-available') };
        })
        .filter(Boolean);
    });

    await page.screenshot({ path: join(__dirname, 'screenshot.png'), fullPage: true });

    const available = days.filter((d) => d.available);

    if (days.length === 0) {
      log('WARNING: found 0 day cells - selector heuristic may not match this page, check screenshot.png');
    } else if (available.length > 0) {
      log(`SLOT AVAILABLE: days ${available.map((d) => d.day).join(', ')}`);
      notify();
      await callPhone();
    } else {
      log(`No open slots. Checked ${days.length} days, none green.`);
    }
  } catch (err) {
    log(`ERROR: ${err.message}`);
    await page.screenshot({ path: join(__dirname, 'error.png'), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
