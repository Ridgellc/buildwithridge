import { chromium } from '/home/claude-user/.local/lib/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
// usage: node anon.mjs <outdir> <site> <generic name> <scrollY> [w h]
const [,, out, site, generic, scrollY, w='1200', h='1500', extraArg='', sel='', tag=''] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
await p.goto('file:///home/claude-user/client-sites/' + site + '/index.html');
await p.waitForTimeout(800);
// scroll through the page so reveal-on-scroll content shows
const H = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H; y += 400) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(60); }
await p.evaluate(y => scrollTo(0, y), +scrollY); if (sel) await p.evaluate(s => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY); }, sel);
await p.waitForTimeout(1200);
await p.evaluate(([generic, extraArg]) => {
  const name = document.title.split(' | ')[0].trim();
  const words = [name, name.replace(/&/g,'and'), ...(window.__extra || [])];
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const extra = [...extraArg.split(',').filter(Boolean),'SloDoCo','SLODOCO','SLO Donut Company','San Luis Obispo Donut Company','Pismo Vitality','PISMO VITALITY','Pismo','Wendy Weiss','Dr. Weiss','Weiss'];
  const re = new RegExp([name, ...extra].filter(Boolean).map(esc).join('|'), 'gi');
  const phone = /\(?\d{3}\)?[ .-]\d{3}-\d{4}/g;
  const addr = /\b\d{2,5} [A-Z][a-zA-Z.]+( [A-Z][a-zA-Z.]+)*,? (St|Street|Ave|Avenue|Blvd|Rd|Road|Dr|Drive|Way|Hwy|Lane|Ln)\.?\b/g;
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = tw.nextNode())) {
    n.nodeValue = n.nodeValue.replace(re, generic).replace(phone, '(805) 555-0123').replace(addr, '100 Main St');
  }
  document.querySelectorAll('img').forEach(i => { if (/logo/i.test(i.src + i.alt + i.className)) i.style.visibility = 'hidden'; });
  document.querySelectorAll('.demo-note,.preview-note,.preview-banner,[class*=preview]').forEach(e => e.remove());
}, [generic, extraArg]);
await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/${site}${tag}.jpg`, type: 'jpeg', quality: 82 });
await b.close();
