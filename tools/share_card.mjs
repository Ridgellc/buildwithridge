// Renders tools/share_card.html into img/share.jpg (1200x630), the picture in link previews.
// Run from anywhere: node tools/share_card.mjs  (needs the network for the Geist font)
import { chromium } from '/home/claude-user/.local/lib/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
const root = '/home/claude-user/client-sites/buildwithridge';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(`file://${root}/tools/share_card.html`);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
await p.locator('#card').screenshot({ path: `${root}/img/share.jpg`, type: 'jpeg', quality: 86 });
await b.close();
