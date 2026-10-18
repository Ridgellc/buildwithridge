// Renders the four "How it goes" step pictures from tools/how_scenes.html into img/how/step-*.jpg.
// Run from the site folder: node tools/how_scenes.mjs  (needs the network for the Geist font)
import { chromium } from '/home/claude-user/.local/lib/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
const root = '/home/claude-user/client-sites/buildwithridge';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
await p.goto(`file://${root}/tools/how_scenes.html`);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
for (const s of ['build', 'send', 'launch', 'manage']) {
  await p.locator(`#step-${s}`).screenshot({ path: `${root}/img/how/step-${s}.jpg`, type: 'jpeg', quality: 82 });
}
await b.close();
