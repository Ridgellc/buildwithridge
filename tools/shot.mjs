import { chromium } from '/home/claude-user/.local/lib/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
const [,, out, w, h, full, ...sites] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
for (const s of sites) {
  await p.goto('file:///home/claude-user/client-sites/' + s + '/index.html');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/${s.replace(/\//g,'_')}.png`, fullPage: full === '1' });
}
await b.close();
