// Takes the entry's screenshots: serves app/ locally, opens each view from
// shots.json in Chromium and saves a JPEG per shot. Run from the repo root:
//   node scripts/shoot.mjs
// The earned ticks in each shot are seeded through localStorage before the page
// loads — the app's own saved-progress feature, showing real tracker state.
// Shots are re-taken at lower JPEG quality if one comes out over 256 KiB.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire('/home/hatch/workspace/playwright-automation/package.json');
const { chromium } = require('playwright');

const repo = fileURLToPath(new URL('..', import.meta.url));
const shots = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8'));
const PORT = 8091;
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1148/chrome-linux/chrome`;

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: repo, stdio: 'pipe' });
await new Promise((resolve) => setTimeout(resolve, 1200));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
try {
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: shot.viewport });
    await page.addInitScript(({ earned, spoilers }) => {
      localStorage.setItem('leonida-trophy-earned-v1', JSON.stringify(earned ?? []));
      localStorage.setItem('leonida-trophy-spoilers-v1', spoilers ? '1' : '0');
    }, { earned: shot.earned ?? [], spoilers: !shot.path.includes('spoilers=off') });
    await page.goto(`http://localhost:${PORT}${shot.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const out = join(repo, 'screenshots', shot.file);
    let quality = 82;
    await page.screenshot({ path: out, type: 'jpeg', quality });
    while (statSync(out).size > 262144 && quality > 55) {
      quality -= 8;
      await page.screenshot({ path: out, type: 'jpeg', quality });
    }
    const bytes = statSync(out).size;
    console.log(`${shot.file}: ${bytes} bytes (quality ${quality})${bytes > 262144 ? ' — OVER 256 KiB!' : ''}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log('shots done');
