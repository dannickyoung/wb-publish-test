// Small helpers shared by every site. No libraries. Safe to delete what you don't use.
document.documentElement.classList.add('js');

// 1. Reveal on scroll: add data-reveal to any element (and style="--i:2" to stagger).
(() => {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  els.forEach(el => io.observe(el));
})();

// 2. Current year: <span data-year></span>
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

// 3. Opening hours, in the BUSINESS's time zone (not the visitor's):
//   <ul data-hours data-tz="Asia/Singapore">
//     <li data-day="1">Monday — Closed</li>                                   (0 = Sunday ... 6 = Saturday)
//     <li data-day="2" data-open="06:30" data-close="14:00">Tuesday — 6:30am–2pm</li>
//   </ul>
//   <p data-open-status></p>   -> "Open now · until 2pm" / "Closed now · opens Tuesday at 6:30am"
(() => {
  const list = document.querySelector('[data-hours]');
  if (!list) return;
  const tz = list.dataset.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map(p => [p.type, p.value]));
  const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  const nowMin = (+parts.hour) * 60 + (+parts.minute);
  const toMin = (t) => { const [h, m] = (t || '').split(':').map(Number); return h * 60 + (m || 0); };
  const fmt = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`; };
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = (d) => list.querySelector(`[data-day="${d}"]`);

  const row = day(today);
  if (row) { row.classList.add('is-today'); row.setAttribute('aria-current', 'date'); }

  const status = document.querySelectorAll('[data-open-status]');
  if (!status.length) return;
  let text;
  if (row && row.dataset.open && nowMin >= toMin(row.dataset.open) && nowMin < toMin(row.dataset.close)) {
    text = `Open now · until ${fmt(row.dataset.close)}`;
    status.forEach(s => s.classList.add('is-open'));
  } else {
    for (let i = 0; i <= 7; i++) {
      const d = (today + i) % 7, r = day(d);
      if (!r || !r.dataset.open || (i === 0 && nowMin >= toMin(r.dataset.open))) continue;
      text = `Closed now · opens ${i === 0 ? 'today' : i === 1 ? 'tomorrow' : names[d]} at ${fmt(r.dataset.open)}`;
      break;
    }
  }
  if (text) status.forEach(s => { s.textContent = text; });
})();

// 4. Mobile menu: <button data-menu-toggle aria-controls="menu" aria-expanded="false"> + <nav id="menu">
(() => {
  const btn = document.querySelector('[data-menu-toggle]');
  if (!btn) return;
  const menu = document.getElementById(btn.getAttribute('aria-controls'));
  const set = (open) => { btn.setAttribute('aria-expanded', String(open)); menu.classList.toggle('is-open', open); };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
})();

// 5. Countdown: <span data-countdown="2027-06-14T14:00:00">  -> "231 days"
document.querySelectorAll('[data-countdown]').forEach((el) => {
  const target = new Date(el.dataset.countdown);
  const days = Math.ceil((target - new Date()) / 86400000);
  if (!Number.isNaN(days)) el.textContent = days > 1 ? `${days} days` : days === 1 ? 'tomorrow' : days === 0 ? 'today' : el.textContent;
});

// 6. Fit text to its container's width (signature move 1): <h1 data-fit>MONSOON</h1>
//    Optional data-fit-max="320" caps the size in px. Give it a sensible CSS clamp() size too (used without JS).
(() => {
  const els = [...document.querySelectorAll('[data-fit]')];
  if (!els.length) return;
  const fit = (el) => {
    el.style.whiteSpace = 'nowrap';
    el.style.fontSize = '100px';
    const range = document.createRange(); range.selectNodeContents(el);
    const textW = range.getBoundingClientRect().width;
    const cs = getComputedStyle(el);
    const boxW = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (!textW || !boxW) { el.style.fontSize = ''; return; }
    const max = parseFloat(el.dataset.fitMax) || Infinity;
    el.style.fontSize = Math.min(max, Math.floor((100 * boxW / textW) * 0.995 * 10) / 10) + 'px';
  };
  const run = () => els.forEach(fit);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(run);
  if ('ResizeObserver' in window) { let w = innerWidth; new ResizeObserver(() => { if (innerWidth !== w) { w = innerWidth; run(); } }).observe(document.documentElement); }
})();

// 7. Line-by-line mask reveal (signature move 3): <h2 class="lines" data-reveal><span>First line</span><span>second</span></h2>
document.querySelectorAll('.lines').forEach((el) => {
  [...el.children].forEach((line, i) => {
    if (line.firstElementChild?.classList.contains('line-inner')) return;
    const inner = document.createElement('span');
    inner.className = 'line-inner';
    while (line.firstChild) inner.appendChild(line.firstChild);
    line.appendChild(inner);
    line.style.setProperty('--line', i);
  });
});
