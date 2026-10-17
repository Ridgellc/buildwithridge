// Ridge: reveals, fitted type, the work index and the "see yours" sketch.

// Reveal once when an element enters the viewport. Never leaves content hidden.
(() => {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
  addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
})();

// Fit a line of type to the width of its container (the email and the footer wordmark).
const fit = (el, max = Infinity) => {
  const box = el.parentElement;
  const cs = getComputedStyle(box);
  const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  scaleTo(el, avail * 0.995, max);
};
// Type does not scale in a straight line (optical sizes, rounding), so close in on the width in a few passes.
function scaleTo(el, target, max = Infinity) {
  let size = parseFloat(getComputedStyle(el).fontSize) || 100;
  for (let k = 0; k < 4; k++) {
    el.style.fontSize = size + 'px';
    const w = el.getBoundingClientRect().width;
    if (!w) return;
    const next = Math.min(max, size * target / w);
    if (Math.abs(next - size) < 0.5) { size = next; break; }
    size = next;
  }
  el.style.fontSize = size + 'px';
}
const fitAll = () => {
  const wide = matchMedia('(min-width: 48em)').matches;
  document.querySelectorAll('[data-fit]').forEach((el) => {
    if (el.closest('.contact-mail') && !wide) { el.style.fontSize = ''; return; }
    fit(el);
  });
  fitMini();
};

// The bar slides in once the hero has scrolled away.
(() => {
  const bar = document.getElementById('bar'), hero = document.querySelector('.hero');
  if (!bar || !hero || !('IntersectionObserver' in window)) { bar && bar.classList.add('is-on'); return; }
  new IntersectionObserver(([e]) => bar.classList.toggle('is-on', !e.isIntersecting), { threshold: 0, rootMargin: '-60px 0px 0px 0px' }).observe(hero);
})();

// The work index: the active name lights up and its picture shows in the fixed frame.
(() => {
  const list = document.getElementById('work-list');
  const frame = document.getElementById('work-frame');
  if (!list || !frame) return;
  const rows = [...list.querySelectorAll('.work-row')];
  const imgs = rows.map((row) => {
    const src = row.parentElement.querySelector('img');
    const img = new Image();
    img.src = src.getAttribute('src'); img.alt = ''; img.decoding = 'async';
    frame.appendChild(img);
    return img;
  });
  const set = (n) => {
    rows.forEach((r, i) => r.classList.toggle('is-on', i === n));
    imgs.forEach((im, i) => im.classList.toggle('is-on', i === n));
  };
  rows.forEach((row, i) => {
    row.addEventListener('mouseenter', () => set(i));
    row.addEventListener('focus', () => set(i));
    row.addEventListener('click', () => set(i));
  });
  set(0);
})();

// What's in it: pointing at a capability shows its one-line meaning in the empty columns.
(() => {
  const desc = document.getElementById('kit-desc');
  const btns = document.querySelectorAll('.kit-list button');
  const show = (b) => { btns.forEach((x) => x.classList.toggle('is-on', x === b)); desc.textContent = b.dataset.d; };
  btns.forEach((b) => { b.addEventListener('mouseenter', () => show(b)); b.addEventListener('focus', () => show(b)); b.addEventListener('click', () => show(b)); });
})();

// See yours: the visitor's name, set as the monument of a sketch site in their trade.
const TRADES = {
  bakery:  { tag: 'Bread out of the oven by six, every morning.', btn: 'Order ahead', links: 'Menu · Hours · Visit', hours: 'Open today, 6 AM to 2 PM' },
  cafe:    { tag: 'Breakfast all day and coffee all morning.', btn: 'See the menu', links: 'Menu · Hours · Visit', hours: 'Open today, 7 AM to 3 PM' },
  barber:  { tag: 'Walk-ins welcome. Fades, tapers and beard trims.', btn: 'Book a chair', links: 'Services · Book · Visit', hours: 'Open today, 9 AM to 6 PM' },
  nails:   { tag: 'Manicures, pedicures, gel and dip, done with care.', btn: 'Book now', links: 'Services · Prices · Book', hours: 'Open today, 10 AM to 7 PM' },
  auto:    { tag: 'Brakes, oil changes and diagnostics. Honest quotes.', btn: 'Call for a quote', links: 'Services · Reviews · Visit', hours: 'Open today, 8 AM to 5 PM' },
  builder: { tag: 'Remodels, additions and repairs, finished on schedule.', btn: 'Get a quote', links: 'Work · Services · Contact', hours: 'Licensed and insured' },
};
const mini = document.getElementById('mini');
const nameEl = document.getElementById('mini-name');
function fitMini() {
  if (!nameEl) return;
  const page = nameEl.closest('.mini-page');
  const pcs = getComputedStyle(page);
  const avail = page.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
  const capH = page.clientHeight * 0.42; // never taller than the middle of the page
  scaleTo(nameEl, avail * 0.98, capH);
}
(() => {
  const form = document.getElementById('yours-form');
  const input = document.getElementById('biz');
  const ask = document.getElementById('ask');
  if (!form || !mini) return;
  const $ = (id) => document.getElementById(id);
  let t;
  const build = (animate) => {
    const name = (input.value.trim() || 'Your Business').replace(/\s+/g, ' ');
    const trade = form.querySelector('input[name="trade"]:checked').value;
    const d = TRADES[trade];
    mini.dataset.trade = trade;
    nameEl.textContent = name;
    $('mini-logo').textContent = name;
    $('mini-url').textContent = (name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '') || 'yourbusiness') + '.com';
    $('mini-tag').textContent = d.tag; $('mini-btn').textContent = d.btn; $('mini-links').textContent = d.links; $('mini-hours').textContent = d.hours;
    fitMini();
    const label = form.querySelector('input[name="trade"]:checked + span').textContent;
    const body = `Hi Michael,\n\nI'd like to see a real site for ${input.value.trim() || 'my business'} (${label.toLowerCase()}).\n\nWhere we are:\nBest way to reach me:\n`;
    ask.href = 'mailto:hello@buildwithridge.com?subject=' + encodeURIComponent('Build mine: ' + (input.value.trim() || label)) + '&body=' + encodeURIComponent(body);
    if (animate) { mini.classList.remove('is-building'); void mini.offsetWidth; mini.classList.add('is-building'); }
  };
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => build(true), 260); });
  form.addEventListener('change', (e) => { if (e.target.name === 'trade') build(true); });
  form.addEventListener('submit', (e) => { e.preventDefault(); build(true); input.blur(); });
  build(false);
  // assemble once when it first comes into view
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { build(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(mini);
  }
})();

fitAll();
document.fonts.ready.then(fitAll);
document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', fitAll);
addEventListener('load', fitAll);
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fitAll, 120); });

// The Morro Rock clip: plays only when on screen and when motion is welcome.
(() => {
  const v = document.getElementById('rock');
  if (!v || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) { v.play().catch(() => {}); return; }
  new IntersectionObserver((es) => { for (const e of es) e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.2 }).observe(v);
})();
