/* Click Circuits: site behavior.
   Nav menu, scroll reveal and count-up, video players, events list,
   register form, and the email popup. Plain JavaScript, no build step. */

const CONTACT_EMAIL = 'brijesh.m2026@gmail.com';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Footer year ---------- */
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---------- Header and mobile menu ---------- */
(function setupNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  const header = document.querySelector('.site-header');
  if (!toggle || !nav || !header) return;

  function setOpen(open, restoreFocus) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (!open && restoreFocus) toggle.focus();
  }
  const isOpen = () => nav.classList.contains('open');

  toggle.addEventListener('click', () => setOpen(!isOpen()));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) setOpen(false, true); });
  document.addEventListener('click', (e) => { if (isOpen() && !header.contains(e.target)) setOpen(false); });
  header.addEventListener('focusout', (e) => {
    if (isOpen() && e.relatedTarget && !header.contains(e.relatedTarget)) setOpen(false);
  });
  const desktop = window.matchMedia('(min-width: 961px)');
  const onChange = () => setOpen(false);
  if (desktop.addEventListener) desktop.addEventListener('change', onChange); else desktop.addListener(onChange);

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- Scroll reveal and count-up numbers ---------- */
(function setupMotion() {
  const reveals = document.querySelectorAll('.reveal');
  const counters = document.querySelectorAll('[data-count]');
  if (!('IntersectionObserver' in window) || reducedMotion()) {
    reveals.forEach((el) => el.classList.add('in'));
    return; // counters keep the final number written in the HTML
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  reveals.forEach((el) => revealObserver.observe(el));

  function countUp(el) {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1300;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    el.textContent = '0' + suffix;
    requestAnimationFrame(frame);
  }
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      countObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => countObserver.observe(el));
})();

/* ---------- Video players ----------
   One player per page section. Markup ids: <prefix>Player, El, Caption, Count,
   Empty, Prev, Next, PauseIcon, Thumbs. */
function setupVideoPlayer({ videos, idPrefix }) {
  const byId = (suffix) => document.getElementById(idPrefix + suffix);
  const player = byId('Player');
  if (!player) return;

  const videoEl = byId('El');
  const caption = byId('Caption');
  const count = byId('Count');
  const empty = byId('Empty');
  const prev = byId('Prev');
  const next = byId('Next');
  const pauseIcon = byId('PauseIcon');
  const thumbs = byId('Thumbs');
  let index = 0;

  if (pauseIcon) {
    videoEl.addEventListener('play', () => { pauseIcon.hidden = true; });
    videoEl.addEventListener('pause', () => { pauseIcon.hidden = false; });
  }

  function markThumbs() {
    if (!thumbs) return;
    thumbs.querySelectorAll('button').forEach((b, i) => {
      if (i === index) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }

  function load(i, andPlay) {
    if (!videos.length) {
      videoEl.hidden = true;
      empty.hidden = false;
      count.textContent = '';
      return;
    }
    index = (i + videos.length) % videos.length;
    const item = videos[index];
    videoEl.poster = item.poster || '';
    videoEl.src = item.src;
    caption.textContent = item.title;
    count.textContent = `${index + 1} of ${videos.length}`;
    if (pauseIcon) pauseIcon.hidden = false;
    markThumbs();
    if (andPlay) videoEl.play().catch(() => {});
  }

  if (thumbs) {
    thumbs.innerHTML = videos.map((v, i) =>
      `<button type="button" class="video-thumb" aria-label="Play video ${i + 1} of ${videos.length}">` +
      `<img src="${v.poster}" alt="" width="56" height="100" loading="lazy"></button>`
    ).join('');
    thumbs.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => load(i, true)));
  }

  prev.addEventListener('click', () => load(index - 1, true));
  next.addEventListener('click', () => load(index + 1, true));

  // Left and right arrow keys move between videos.
  player.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); load(index - 1, true); }
    if (e.key === 'ArrowRight') { e.preventDefault(); load(index + 1, true); }
  });

  load(0, false);

  // Play (muted) when the player scrolls into view, pause when it leaves.
  // Skipped for visitors who prefer reduced motion.
  if ('IntersectionObserver' in window) {
    const stage = player.querySelector('.video-stage') || player;
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!reducedMotion()) videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      });
    }, { threshold: 0.6 }).observe(stage);
  }
}

/* Student work videos. Files live in videos/work/, posters in images/posters/. */
setupVideoPlayer({
  idPrefix: 'video',
  videos: [
    { src: 'videos/work/work-1.mp4', poster: 'images/posters/work-1.jpg', title: 'Students at work' },
    { src: 'videos/work/work-2.mp4', poster: 'images/posters/work-2.jpg', title: 'Students at work' },
    { src: 'videos/work/work-3.mp4', poster: 'images/posters/work-3.jpg', title: 'Students at work' },
    { src: 'videos/work/work-4.mp4', poster: 'images/posters/work-4.jpg', title: 'Students at work' },
    { src: 'videos/work/work-5.mp4', poster: 'images/posters/work-5.jpg', title: 'Students at work' },
    { src: 'videos/work/work-6.mp4', poster: 'images/posters/work-6.jpg', title: 'Students at work' },
    { src: 'videos/work/work-7.mp4', poster: 'images/posters/work-7.jpg', title: 'Students at work' },
    { src: 'videos/work/work-8.mp4', poster: 'images/posters/work-8.jpg', title: 'Students at work' },
  ],
});

/* Impact videos. Files live in videos/impact/. */
setupVideoPlayer({
  idPrefix: 'impactVideo',
  videos: [
    { src: 'videos/impact/impact-1.mp4', poster: 'images/posters/impact-1.jpg', title: 'Hear from our students' },
    { src: 'videos/impact/impact-2.mp4', poster: 'images/posters/impact-2.jpg', title: 'Hear from our students' },
  ],
});

/* ---------- Email popup: shown when a mailto link is clicked ---------- */
(function setupMailtoPopup() {
  let lastFocus = null;

  function createPopup() {
    const popup = document.createElement('div');
    popup.id = 'emailPopup';
    popup.className = 'email-popup';
    popup.innerHTML = `
      <div class="email-popup-card" role="dialog" aria-modal="true" aria-labelledby="emailPopupTitle">
        <button type="button" class="email-popup-close" aria-label="Close email popup">&times;</button>
        <h3 id="emailPopupTitle">Contact email</h3>
        <p class="email-popup-address"></p>
        <div class="email-popup-actions">
          <button type="button" class="btn btn--outline btn--sm email-popup-copy">Copy</button>
          <a class="btn btn--primary btn--sm email-popup-open" href="#">Open mail app</a>
        </div>
      </div>`;
    document.body.appendChild(popup);

    popup.querySelector('.email-popup-close').addEventListener('click', hidePopup);
    popup.addEventListener('click', (e) => { if (e.target === popup) hidePopup(); });

    popup.querySelector('.email-popup-copy').addEventListener('click', () => {
      const addr = popup.querySelector('.email-popup-address').textContent.trim();
      if (!addr || !navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard.writeText(addr).then(() => {
        const btn = popup.querySelector('.email-popup-copy');
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
      }).catch(() => {});
    });

    // Keep keyboard focus inside the dialog while it is open.
    popup.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const f = popup.querySelectorAll('button, a[href]');
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    return popup;
  }

  function showPopup(email, href) {
    const popup = document.getElementById('emailPopup') || createPopup();
    popup.querySelector('.email-popup-address').textContent = email;
    popup.querySelector('.email-popup-open').href = href || `mailto:${email}`;
    lastFocus = document.activeElement;
    popup.classList.add('visible');
    popup.querySelector('.email-popup-copy').focus();
  }

  function hidePopup() {
    const popup = document.getElementById('emailPopup');
    if (!popup || !popup.classList.contains('visible')) return;
    popup.classList.remove('visible');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hidePopup(); });

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a || a.classList.contains('email-popup-open')) return;
    e.preventDefault();
    const href = a.getAttribute('href') || '';
    const email = href.slice('mailto:'.length).split('?')[0];
    if (email) showPopup(email, href);
  });
})();

/* ---------- Events: single source of truth ----------
   Edit this list to add or change events. The Home and Events pages and the
   Register form are all built from it. Dates are YYYY-MM-DD. Past events drop
   off automatically. */
const EVENTS = [
  { id: 'workshop-2026-11-28', date: '2026-11-28', type: 'Workshop', title: 'Hands-on Arduino Workshop',
    place: 'Coimbatore, Tamil Nadu', note: 'Venue shared on registration' },
  { id: 'talk-2026-12-04', date: '2026-12-04', type: 'Talk', title: 'AI Talk: Why It Matters and How to Build With It',
    place: 'Coimbatore, Tamil Nadu', note: 'Venue shared on registration' },
  { id: 'workshop-2026-12-15', date: '2026-12-15', type: 'Workshop', title: 'Hands-on Arduino Workshop',
    place: 'Coimbatore, Tamil Nadu', note: 'Venue shared on registration' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function eventDate(ev) {
  const [y, m, d] = ev.date.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function upcomingEvents() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return EVENTS.filter((ev) => eventDate(ev) >= startOfToday);
}
function longDate(ev) {
  const d = eventDate(ev);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

document.querySelectorAll('[data-events]').forEach((host) => {
  const list = upcomingEvents();
  if (!list.length) {
    host.innerHTML = '<p class="events-empty">New dates are on the way. <a href="contact.html">Contact us</a> to hear first.</p>';
    return;
  }
  host.innerHTML = list.map((ev) => {
    const d = eventDate(ev);
    const kind = ev.type.toLowerCase();
    return `
      <article class="event-row">
        <div class="event-date" aria-hidden="true">
          <span class="d">${d.getDate()}</span>
          <span class="m">${MONTHS[d.getMonth()]}</span>
        </div>
        <div class="event-main">
          <span class="event-tag event-tag--${kind}">${escapeHtml(ev.type)}</span>
          <h3>${escapeHtml(ev.title)}</h3>
          <p>${longDate(ev)} &middot; ${escapeHtml(ev.place)} &middot; ${escapeHtml(ev.note)}</p>
        </div>
        <a class="btn btn--outline btn--sm" href="register.html?event=${encodeURIComponent(ev.id)}"
           aria-label="Register for ${escapeHtml(ev.title)} on ${longDate(ev)}">Register</a>
      </article>`;
  }).join('');
});

/* ---------- Register form ----------
   There is no server. Submitting opens the visitor's email app with the
   details filled in, and shows the same details so they can copy them. */
(function setupRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  const select = document.getElementById('eventSelect');
  const list = upcomingEvents();
  const wanted = new URLSearchParams(location.search).get('event');

  if (!list.length) {
    select.innerHTML = '<option value="">No upcoming events right now</option>';
  } else {
    select.innerHTML = list.map((ev) =>
      `<option value="${ev.id}"${ev.id === wanted ? ' selected' : ''}>${escapeHtml(ev.type)}: ${longDate(ev)}, ${escapeHtml(ev.place)}</option>`
    ).join('');
  }

  const confirmBox = document.getElementById('registerConfirm');
  const summary = document.getElementById('registerSummary');
  const openLink = document.getElementById('registerOpen');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const ev = EVENTS.find((x) => x.id === data.event);
    if (!ev) return;

    const text = [
      `Event: ${ev.title} (${ev.type})`,
      `Date: ${longDate(ev)}`,
      `Location: ${ev.place}`,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone || 'not given'}`,
      `Role: ${data.role}`,
      `People attending: ${data.count}`,
      `Notes: ${data.notes || 'none'}`,
    ].join('\n');
    const subject = `Registration: ${ev.type} on ${longDate(ev)}`;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

    summary.textContent = text;
    openLink.href = href;
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    confirmBox.focus();
    window.location.href = href;
  });

  const copyBtn = document.getElementById('registerCopy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard.writeText(summary.textContent).then(() => {
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy details'; }, 1400);
      }).catch(() => {});
    });
  }
})();
