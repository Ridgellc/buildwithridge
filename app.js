// Ridge: reveals, fitted type, the "see yours" sketch and the how-it-goes steps.

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
  document.querySelectorAll('[data-fit]').forEach((el) => {
    fit(el);
  });
};

// How it works: one panel, flip through the steps with the arrows, the step bars, the keyboard or a swipe.
(() => {
  const root = document.getElementById('steps');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('.step')];
  const [prev, next] = root.querySelectorAll('.steps-arrow');
  const count = document.getElementById('steps-count');
  let at = 0;
  const go = (n, focus) => {
    at = Math.max(0, Math.min(panels.length - 1, n));
    panels.forEach((p, i) => { p.classList.toggle('is-on', i === at); p.classList.toggle('is-before', i < at); p.toggleAttribute('inert', i !== at); });
    tabs.forEach((t, i) => { t.setAttribute('aria-selected', i === at); t.tabIndex = i === at ? 0 : -1; t.parentElement.classList.toggle('is-done', i < at); });
    prev.disabled = at === 0; next.disabled = at === panels.length - 1;
    count.textContent = (at + 1) + ' / ' + panels.length;
    if (focus) tabs[at].focus();
  };
  tabs.forEach((t, i) => t.addEventListener('click', () => go(i)));
  root.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(at + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(at - 1, true); }
  });
  [prev, next].forEach((b) => b.addEventListener('click', () => go(at + +b.dataset.dir)));
  let x0 = null;
  const stage = root.querySelector('.steps-stage');
  stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  stage.addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) go(at + (dx < 0 ? 1 : -1)); });
  go(0);
})();

// See yours: the visitor's name on a little homepage in the style of the demo sites, one per trade.
const TRADES = {
  bakery:  { kind: 'Bakery', head: 'Pan dulce, fresh every morning', desc: (n) => `${n} bakes conchas, cuernos and bolillos every day from 6 AM. Order ahead and skip the line.`, btn: 'Order ahead', links: 'Menu · Hours · Visit', hours: 'Open today, 6 AM to 2 PM', alt: 'a concha on bakery paper' },
  cafe:    { kind: 'Breakfast & lunch', head: 'Homemade biscuits and big breakfasts', desc: (n) => `${n} serves biscuits and gravy, fluffy omelets and good coffee, every day from 7 to 2.`, btn: 'See the menu', links: 'Menu · Hours · Visit', hours: 'Open today, 7 AM to 2 PM', alt: 'biscuits and gravy in a skillet' },
  barber:  { kind: 'Barbershop', head: 'Walk in, walk out sharp', desc: (n) => `${n} does fades, tapers and beard line-ups for men and kids. Walk-ins welcome, or book your chair online.`, btn: 'Book a chair', links: 'Services · Book · Visit', hours: 'Open today, 9 AM to 6 PM', alt: 'an old-fashioned barbershop interior' },
  nails:   { kind: 'Nail salon', head: 'Simple, elegant nails', desc: (n) => `${n} offers manicures, pedicures, gel and dip in a clean, calm salon with heated massage chairs.`, btn: 'Book now', links: 'Services · Prices · Book', hours: 'Open today, 10 AM to 7 PM', alt: 'a manicure in progress' },
  auto:    { kind: 'Auto repair', head: 'Honest repairs, done right', desc: (n) => `${n} handles brakes, oil changes and diagnostics, with a clear quote before any work starts.`, btn: 'Get a quote', links: 'Services · Reviews · Visit', hours: 'Open today, 8 AM to 5 PM', alt: 'a mechanic working under the hood of a car' },
  builder: { kind: 'Contractor', head: 'Remodels built to last', desc: (n) => `${n} builds kitchens, baths and additions, with clear communication from the first visit to the final walk-through.`, btn: 'Request a quote', links: 'Work · Services · Contact', hours: 'Licensed and insured', alt: 'a finished kitchen remodel' },
  restaurant:  { kind: 'Restaurant', head: 'Fresh food, made from scratch', desc: (n) => `${n} serves seasonal plates, house cocktails and a menu that changes with what's good. Walk in or book a table.`, btn: 'Reserve a table', links: 'Menu · Reserve · Visit', hours: 'Open tonight, 5 PM to 10 PM', alt: 'a plated dish on a restaurant table' },
  salon:       { kind: 'Hair salon', head: "Cuts and color you'll love", desc: (n) => `${n} does cuts, color, balayage and blowouts, with stylists who listen first. Book your chair online.`, btn: 'Book now', links: 'Services · Prices · Book', hours: 'Open today, 9 AM to 7 PM', alt: 'a stylist blow-drying hair' },
  fitness:     { kind: 'Gym', head: 'Get stronger, every week', desc: (n) => `${n} offers open gym, group classes and personal training for every level. Your first class is free.`, btn: 'Try a free class', links: 'Classes · Pricing · Join', hours: 'Open today, 5 AM to 10 PM', alt: 'a bright gym with bikes and a squat rack' },
  dentist:     { kind: 'Dental office', head: 'Gentle care for the whole family', desc: (n) => `${n} offers cleanings, fillings, whitening and same-week emergency visits in a calm, modern office. New patients welcome.`, btn: 'Book a visit', links: 'Services · Insurance · Book', hours: 'Open today, 8 AM to 5 PM', alt: 'a dental exam room' },
  accountant:  { kind: 'Accounting & tax', head: 'Taxes done right, on time', desc: (n) => `${n} handles tax returns, bookkeeping and payroll for families and businesses, with real answers all year, not just in April.`, btn: 'Book a consult', links: 'Services · About · Contact', hours: 'Now booking tax appointments', alt: 'a laptop and calculator on a desk' },
  realestate:  { kind: 'Real estate', head: 'Find the right home', desc: (n) => `${n} helps buyers and sellers with honest advice, sharp pricing and steady communication from the first showing to closing day.`, btn: 'See listings', links: 'Listings · Sell · Contact', hours: 'Free home value estimate', alt: 'a white house with a for-sale sign' },
  plumber:     { kind: 'Plumbing', head: 'Fast, honest plumbing', desc: (n) => `${n} fixes leaks, clogs and water heaters, with upfront pricing before any work starts.`, btn: 'Call now', links: 'Services · Reviews · Contact', hours: 'Open 24/7 for emergencies', alt: 'two pipe wrenches on a fitting' },
  landscaping: { kind: 'Landscaping', head: "A yard you'll want to show off", desc: (n) => `${n} handles lawn care, planting, irrigation and full yard makeovers, with free estimates on every job.`, btn: 'Free estimate', links: 'Services · Work · Contact', hours: 'Licensed and insured', alt: 'a trimmed lawn with hedges' },
  other:       { kind: 'Your business', head: 'Good work, easy to find', desc: (n, k) => `${n} is the place for ${k ? k.toLowerCase() : 'what you do best'}. See what we offer, read the reviews, and get in touch in one tap.`, btn: 'Get in touch', links: 'About · Services · Contact', hours: 'Open today, 9 AM to 5 PM', alt: 'a "come in, we\'re open" sign' },
};
const mini = document.getElementById('mini');
(() => {
  const form = document.getElementById('yours-form');
  const input = document.getElementById('biz');
  const ask = document.getElementById('ask');
  const kindIn = document.getElementById('kind');
  const otherBox = document.getElementById('other-kind');
  if (!form || !mini) return;
  const $ = (id) => document.getElementById(id);
  let t;
  const build = (animate) => {
    const name = (input.value.trim() || 'Your Business').replace(/\s+/g, ' ');
    const trade = form.querySelector('input[name="trade"]:checked').value;
    const typed = trade === 'other' ? kindIn.value.trim().replace(/\s+/g, ' ') : '';
    // Something else: use the closest look for what they typed; words we don't know keep the general one
    const key = (typed && matchKind(typed)) || trade;
    const d = TRADES[key] || LOOKS[key];
    const kind = typed ? typed.charAt(0).toUpperCase() + typed.slice(1) : d.kind;
    otherBox.hidden = trade !== 'other';
    mini.dataset.trade = TRADES[key] ? key : 'other';
    ['--m-bg', '--m-ink', '--m-accent'].forEach((v, i) => (d.colors ? mini.style.setProperty(v, d.colors[i]) : mini.style.removeProperty(v)));
    const photo = d.photo || key;
    $('mini-logo').textContent = name;
    $('mini-kind').textContent = $('mini-eyebrow').textContent = kind;
    $('mini-head').textContent = d.head; $('mini-desc').textContent = d.desc(name, typed);
    $('mini-pill').textContent = d.btn;
    const img = $('mini-img'); if (!img.src.endsWith('/' + photo + '.jpg')) { img.src = 'img/sketch/' + photo + '.jpg'; } img.alt = 'Example photo: ' + d.alt;
    $('mini-url').textContent = (name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '') || 'yourbusiness') + '.com';
    $('mini-btn').textContent = d.btn; $('mini-links').textContent = d.links; $('mini-hours').textContent = d.hours;
    // the request form opens with what they typed here
    ask.dataset.business = input.value.trim();
    ask.dataset.kind = typed || (trade === 'other' ? '' : form.querySelector('input[name="trade"]:checked + span').textContent);
    if (animate) { mini.classList.remove('is-building'); void mini.offsetWidth; mini.classList.add('is-building'); }
  };
  [input, kindIn].forEach((el) => el.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => build(true), 260); }));
  form.addEventListener('change', (e) => { if (e.target.name === 'trade') { build(true); if (e.target.value === 'other') kindIn.focus(); } });
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


// Request my website: any [data-request] opens the form. With a Web3Forms key (data-form-key on the form)
// it is emailed to Michael; without one, Send opens a pre-written email so nothing is silently lost.
(() => {
  const dlg = document.getElementById('request');
  const f = document.getElementById('request-form');
  if (!dlg || !f) return;
  const done = document.getElementById('request-done');
  const error = f.querySelector('.rq-error');
  const el = (k) => f.elements.namedItem(k);
  // the same form, worded for a website request or (data-request="question") for a question
  const parts = { title: document.getElementById('rq-title'), intro: f.querySelector('.rq-intro'), label: f.querySelector('label[for="rq-message"]'), send: f.querySelector('.rq-send'), done: done.querySelector('.rq-title') };
  const MODES = {
    request: { title: parts.title.textContent, intro: parts.intro.textContent, label: parts.label.innerHTML, ph: el('message').placeholder, send: parts.send.textContent, done: parts.done.textContent, need: false },
    question: { title: 'Ask me a question', intro: "Whatever you'd like to know, ask away. I'll get back to you within a day.", label: 'Your question', ph: 'What would you like to know?', send: 'Send question', done: "Thanks! I'll get back to you soon.", need: true },
  };
  let mode = 'request';
  document.querySelectorAll('[data-request]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    mode = b.dataset.request === 'question' ? 'question' : 'request';
    const m = MODES[mode];
    parts.title.textContent = m.title; parts.intro.textContent = m.intro; parts.label.innerHTML = m.label;
    el('message').placeholder = m.ph; el('message').required = m.need; parts.send.textContent = m.send; parts.done.textContent = m.done;
    f.hidden = false; done.hidden = true; error.hidden = true;
    if (b.dataset.business !== undefined) el('business').value = b.dataset.business;
    if (b.dataset.kind !== undefined) el('kind').value = b.dataset.kind;
    dlg.showModal();
    setTimeout(() => el('name').focus(), 50);
  }));
  ['phone', 'email'].forEach((k) => el(k).addEventListener('input', () => el('phone').setCustomValidity('')));
  dlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dlg.close()));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = (k) => el(k).value.trim();
    // phone or email: either one is enough, but not neither
    el('phone').setCustomValidity(v('phone') || v('email') ? '' : 'Add a phone number or an email so I can reach you.');
    if (!f.reportValidity() || el('botcheck').checked) return;
    const subject = `${mode === 'question' ? 'Question' : 'Website request'}: ${v('business') || v('name')}${v('kind') ? ` (${v('kind')})` : ''}`;
    if (!f.dataset.formKey) {
      const body = `Name: ${v('name')}\nBusiness: ${v('business')}\nType of business: ${v('kind')}\nPhone: ${v('phone')}\nEmail: ${v('email')}\n\n${v('message')}`;
      location.href = 'mailto:hello@buildwithridge.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      return;
    }
    const btn = f.querySelector('button[type=submit]'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…'; error.hidden = true;
    try {
      // plain form data (no JSON content type) so the browser skips the CORS preflight
      const body = new FormData();
      Object.entries({ access_key: f.dataset.formKey, from_name: 'Ridge website', subject, name: v('name'), business: v('business'), kind: v('kind'), phone: v('phone'), email: v('email'), message: v('message') })
        .forEach(([k, val]) => body.append(k, val));
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body });
      if (!(await res.json()).success) throw new Error('not sent');
    } catch {
      error.hidden = false; return;
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
    f.hidden = true; done.hidden = false; f.reset();
  });
})();

// Why Ridge: the trail draws itself up to the flag, and the hiker climbs, as the section scrolls past.
(() => {
  const trail = document.getElementById('me-trail');
  const hiker = document.getElementById('me-hiker');
  const sec = document.getElementById('why-ridge');
  if (!trail || !hiker || !sec) return;
  const len = trail.getTotalLength();
  trail.style.strokeDasharray = len;
  const place = (p) => {
    trail.style.strokeDashoffset = len * (1 - p);
    const pt = trail.getPointAtLength(len * p);
    hiker.setAttribute('cx', pt.x); hiker.setAttribute('cy', pt.y);
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { place(1); return; }
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = sec.getBoundingClientRect();
    // starts as the section comes up and reaches the flag once all of it is on screen (it ends the page)
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 40; // zoom and some screens stop a few pixels short
    place(atEnd ? 1 : Math.min(1, Math.max(0, (innerHeight - r.top) / r.height)));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

// Top bar on the home page: the underline follows the section you're looking at.
(() => {
  const links = [...document.querySelectorAll('.bar-nav a.link[href^="#"]')];
  const spots = links.map((a) => [a, document.querySelector(a.getAttribute('href'))]).filter(([, el]) => el);
  if (!spots.length) return;
  let ticking = false;
  const mark = (on) => links.forEach((a) => (a === on ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
  const update = () => {
    ticking = false;
    // the last section whose top has passed a third of the way down the screen
    let on = spots[0][0];
    for (const [a, el] of spots) if (el.getBoundingClientRect().top <= innerHeight * 0.33) on = a;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) on = spots[spots.length - 1][0];
    mark(on);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  links.forEach((a) => a.addEventListener('click', () => mark(a)));
  update();
})();
