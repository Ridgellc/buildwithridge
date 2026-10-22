// Shared by the four example sites: the "Book" / "Order" buttons open a preview of online booking or ordering.
// Each page lists its own items and hours in <script type="application/json" id="flow-data"> and themes the
// window with the --fl-* colors in its own styles. Nothing is ever booked or ordered.
(() => {
  const cfg = JSON.parse(document.getElementById('flow-data').textContent);
  const KIND = cfg.kind, ITEMS = cfg.items, BOOK = KIND === 'book';
  const word = BOOK ? 'booked' : 'ordered';
  const dlg = document.createElement('dialog');
  dlg.className = 'flow';
  dlg.setAttribute('aria-labelledby', 'flow-title');
  dlg.innerHTML = `<div class="flow-head"><h2 id="flow-title"></h2><button type="button" class="flow-close" aria-label="Close">×</button></div>
    <p class="flow-note">Preview of online ${BOOK ? 'booking' : 'ordering'} on an example site. Nothing is ${word}.</p>
    <div class="flow-body" id="flow-body"></div>
    <div class="flow-foot"><button type="button" class="fl-btn fl-btn--line" id="flow-back">Back</button><button type="button" class="fl-btn" id="flow-next">Next</button></div>`;
  document.body.append(dlg);
  const body = dlg.querySelector('#flow-body'), next = dlg.querySelector('#flow-next'), back = dlg.querySelector('#flow-back');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fmt = (min) => { const h = Math.floor(min / 60), m = min % 60; return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
  const price = (it) => parseFloat(String(it.price).replace(/[^0-9.]/g, '')) || 0;

  // the next 8 days; cfg.hours is Sunday-first, each [open, close] in minutes or null for closed
  function slotsFor(day) {
    if (!day.open) return [];
    const [o, c] = day.open, out = [], now = new Date();
    const earliest = day.date.toDateString() === now.toDateString() ? now.getHours() * 60 + now.getMinutes() + 30 : 0;
    const step = BOOK ? 30 : 15;
    for (let t = BOOK ? o : o + 30; t + (BOOK ? 45 : 0) <= c; t += step) if (t >= earliest) out.push(t);
    // some times show as taken so the calendar looks real (same every time)
    return out.slice(0, 18).map((t, i) => ({ t, taken: BOOK && (i * 7 + day.date.getDate()) % 5 === 0 }));
  }
  function upcomingDays() {
    const out = [];
    for (let i = 0; out.length < 8 && i < 14; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const day = { date: d, open: cfg.hours[d.getDay()] };
      if (day.open && !slotsFor(day).length) { day.open = null; day.late = true; } // today, after the last time
      out.push(day);
    }
    return out;
  }
  const st = { step: 0, item: null, cart: {}, day: null, slot: null, name: '', phone: '' };
  const count = () => Object.values(st.cart).reduce((a, b) => a + b, 0);
  const total = () => Object.entries(st.cart).reduce((t, [i, q]) => t + q * price(ITEMS[i]), 0);

  function render() {
    back.style.visibility = st.step === 0 ? 'hidden' : 'visible';
    dlg.querySelector('.flow-foot').hidden = st.step === 3;
    if (st.step === 0) {
      body.innerHTML = `<p class="flow-step">${BOOK ? '1 · Choose a service' : "1 · Choose what you'd like"}</p>` + ITEMS.map((it, i) =>
        (it.group && it.group !== (ITEMS[i - 1] || {}).group ? `<h3 class="flow-group" data-group="${esc(it.group)}">${esc(it.group)}</h3>` : '') + (BOOK
          ? `<button type="button" class="opt" data-i="${i}" aria-pressed="${st.item === i}"><span><strong>${esc(it.name)}</strong><small>${esc(it.detail || '')}</small></span><span class="opt-price">${esc(it.price)}</span></button>`
          : `<div class="opt opt--qty"><span><strong>${esc(it.name)}</strong><small>${esc(it.detail ? it.detail + ' · ' : '')}${esc(it.price)}</small></span><span class="qty"><button type="button" data-dec="${i}" aria-label="Remove one ${esc(it.name)}">−</button><span aria-live="polite">${st.cart[i] || 0}</span><button type="button" data-inc="${i}" aria-label="Add one ${esc(it.name)}">+</button></span></div>`)
      ).join('');
      body.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { st.item = +b.dataset.i; render(); }));
      const keep = (fn) => () => { const y = body.scrollTop; fn(); render(); body.scrollTop = y; };
      body.querySelectorAll('[data-inc]').forEach((b) => (b.onclick = keep(() => { st.cart[b.dataset.inc] = (st.cart[b.dataset.inc] || 0) + 1; })));
      body.querySelectorAll('[data-dec]').forEach((b) => (b.onclick = keep(() => { st.cart[b.dataset.dec] = Math.max(0, (st.cart[b.dataset.dec] || 0) - 1); })));
      next.disabled = BOOK ? st.item === null : count() === 0;
      next.textContent = !BOOK && count() ? `Next · ${count()} item${count() > 1 ? 's' : ''} · $${total().toFixed(2)}` : 'Next';
    } else if (st.step === 1) {
      const days = upcomingDays();
      if (st.day === null) st.day = days.findIndex((d) => d.open);
      const slots = slotsFor(days[st.day]);
      body.innerHTML = `<p class="flow-step">2 · ${BOOK ? 'Pick a day and time' : 'Pick a pickup time'}</p><div class="days">` +
        days.map((d, i) => `<button type="button" class="chip" data-d="${i}" aria-pressed="${st.day === i}" ${d.open ? '' : 'disabled'}>${d.date.toLocaleDateString(undefined, { weekday: 'short' })}<small>${d.open ? d.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : d.late ? 'Done today' : 'Closed'}</small></button>`).join('') +
        `</div><div class="slots">` + slots.map((s) => `<button type="button" class="chip" data-t="${s.t}" aria-pressed="${st.slot === s.t}" ${s.taken ? 'disabled' : ''}>${fmt(s.t)}</button>`).join('') + `</div>`;
      body.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { st.day = +b.dataset.d; st.slot = null; render(); }));
      body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { st.slot = +b.dataset.t; render(); }));
      next.disabled = st.slot === null; next.textContent = 'Next';
    } else if (st.step === 2) {
      const d = upcomingDays()[st.day].date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      const what = BOOK ? esc(ITEMS[st.item].name) : Object.entries(st.cart).filter(([, q]) => q).map(([i, q]) => `${q} × ${esc(ITEMS[i].name)}`).join('<br>');
      const extra = window.flowExtra ? window.flowExtra() : ''; // e.g. Wren adds the shade they tapped
      body.innerHTML = `<p class="flow-step">3 · Your details</p><div class="summary"><strong>${what}</strong>${extra ? '<br>' + esc(extra) : ''}<br>${d} at ${fmt(st.slot)}</div>
        <div class="field"><label for="fl-name">Name</label><input id="fl-name" autocomplete="off" value="${esc(st.name)}"></div>
        <div class="field"><label for="fl-phone">Phone (for a text ${BOOK ? 'reminder' : 'when it\'s ready'})</label><input id="fl-phone" type="tel" autocomplete="off" value="${esc(st.phone)}"></div>`;
      const n = body.querySelector('#fl-name'), ph = body.querySelector('#fl-phone');
      const check = () => { st.name = n.value; st.phone = ph.value; next.disabled = !n.value.trim(); };
      n.oninput = ph.oninput = check; check();
      next.textContent = BOOK ? 'Book it' : 'Place order';
    } else {
      body.innerHTML = `<div class="done"><p class="done-mark" aria-hidden="true">✓</p><h3>${BOOK ? "You're booked" : 'Order received'}${st.name.trim() ? ', ' + esc(st.name.trim().split(' ')[0]) : ''}!</h3>
        <p>This is where customers see their confirmation and get a text ${BOOK ? 'reminder before their appointment' : 'when their order is ready'}.</p>
        <p class="done-small">Preview only. Nothing was ${word}.</p><button type="button" class="fl-btn" data-done>Done</button></div>`;
      body.querySelector('[data-done]').onclick = () => dlg.close();
    }
  }
  next.onclick = () => { st.step++; render(); body.scrollTop = 0; next.blur(); };
  back.onclick = () => { st.step = Math.max(0, st.step - 1); render(); };
  dlg.querySelector('.flow-close').onclick = () => dlg.close();
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.querySelectorAll('[data-open-flow]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    Object.assign(st, { step: 0, item: null, cart: {}, day: null, slot: null });
    // a button can start on one item (data-item) or jump to a group of the list (data-group)
    if (b.dataset.item) { const i = ITEMS.findIndex((it) => it.name === b.dataset.item); if (BOOK) st.item = i; else st.cart[i] = 1; }
    dlg.querySelector('#flow-title').textContent = b.dataset.title || cfg.title;
    render(); dlg.showModal();
    const g = b.dataset.group && body.querySelector(`[data-group="${CSS.escape(b.dataset.group)}"]`);
    body.scrollTop = g ? g.offsetTop - body.offsetTop - 8 : 0;
  }));
})();
