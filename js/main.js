/* Click Circuits — site behavior: nav toggle, video keyboard nav, photo grid */

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Mobile nav ---------- */
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');
if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  // Intentionally keep the mobile nav open until the user explicitly
  // toggles it. Removing the auto-close-on-link-click behavior ensures
  // the navigation (including the Impact tab) remains visible while
  // the menu is open.
}

/* ---------- Video player ----------
   Reused for the "Students at work" player and the Impact page player. */
function setupVideoPlayer({ videos, idPrefix }) {
  const player = document.getElementById(`${idPrefix}Player`);
  if (!player) return;

  const videoEl = document.getElementById(`${idPrefix}El`);
  const caption = document.getElementById(`${idPrefix}Caption`);
  const count = document.getElementById(`${idPrefix}Count`);
  const empty = document.getElementById(`${idPrefix}Empty`);
  const prev = document.getElementById(`${idPrefix}Prev`);
  const next = document.getElementById(`${idPrefix}Next`);
  const pauseIcon = document.getElementById(`${idPrefix}PauseIcon`);

  if (pauseIcon) {
    videoEl.addEventListener('play', () => { pauseIcon.hidden = true; });
    videoEl.addEventListener('pause', () => { pauseIcon.hidden = false; });
  }

  let index = 0;

  function load(i) {
    if (!videos.length) {
      videoEl.hidden = true;
      empty.hidden = false;
      count.textContent = '';
      return;
    }
    index = (i + videos.length) % videos.length;
    const item = videos[index];
    videoEl.src = item.src;
    caption.textContent = item.title;
    count.textContent = `${index + 1} / ${videos.length}`;
    if (pauseIcon) pauseIcon.hidden = false;
  }

  prev.addEventListener('click', () => load(index - 1));
  next.addEventListener('click', () => load(index + 1));

  // Left/right arrow keys move to the previous/next video.
  player.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); load(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); load(index + 1); }
  });

  load(0);

  // Play automatically when the player scrolls into view, pause when it leaves.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      });
    },
    { threshold: 0.6 }
  );
  observer.observe(player);
}

/* ---------- Student work videos ----------
   Add files to videos/work/ named work-1.mp4, work-2.mp4, etc.
   Update the list below to match what you add. */
setupVideoPlayer({
  idPrefix: 'video',
  videos: [
    { src: 'videos/work/work-1.mp4', title: 'Students at work' },
    { src: 'videos/work/work-2.mp4', title: 'Students at work' },
    { src: 'videos/work/work-3.mp4', title: 'Students at work' },
    { src: 'videos/work/work-4.mp4', title: 'Students at work' },
    { src: 'videos/work/work-5.mp4', title: 'Students at work' },
    { src: 'videos/work/work-6.mp4', title: 'Students at work' },
    { src: 'videos/work/work-7.mp4', title: 'Students at work' },
    { src: 'videos/work/work-8.mp4', title: 'Students at work' },
  ],
});

/* ---------- Impact videos ----------
   Add files to videos/impact/ named impact-1.mp4, impact-2.mp4, etc.
   Update the list below to match what you add. */
setupVideoPlayer({
  idPrefix: 'impactVideo',
  videos: [
    { src: 'videos/impact/impact-1.mp4', title: 'Our impact' },
    { src: 'videos/impact/impact-2.mp4', title: 'Our impact' },
  ],
});

/* ---------- Photo grid ----------
   Add files to images/work/ and list them below to show up here. */
const photos = [
  { src: 'images/work/work-1.png', alt: 'Students in class' },
  { src: 'images/work/work-2.jpeg', alt: 'Workshop activity' },
  { src: 'images/work/work-3.jpeg', alt: 'Students working' },
  { src: 'images/work/work-4.jpeg', alt: 'Building moment' },
  { src: 'images/work/work-5.jpeg', alt: 'Hands-on learning' },
];

const photoStrip = document.getElementById('photoStrip');
if (photoStrip) {
  photoStrip.innerHTML = photos
    .map((p) => `<img src="${p.src}" alt="${p.alt}" loading="lazy">`)
    .join('');
}

/* ---------- Mailto click interception: show small popup with email ---------- */
(function setupMailtoPopup() {
  function createPopup() {
    const popup = document.createElement('div');
    popup.id = 'emailPopup';
    popup.className = 'email-popup';
    popup.innerHTML = `
      <div class="email-popup-card" role="dialog" aria-modal="true" aria-labelledby="emailPopupTitle">
        <button class="email-popup-close" aria-label="Close email popup">×</button>
        <h3 id="emailPopupTitle">Contact Email</h3>
        <p class="email-popup-address"></p>
        <div class="email-popup-actions">
          <button class="btn btn-ghost email-popup-copy">Copy</button>
          <a class="btn btn-primary email-popup-open" href="#" target="_blank" rel="noopener">Open mail app</a>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    // Close handlers
    popup.querySelector('.email-popup-close').addEventListener('click', hidePopup);
    popup.addEventListener('click', (e) => { if (e.target === popup) hidePopup(); });

    // Copy handler
    popup.querySelector('.email-popup-copy').addEventListener('click', () => {
      const addr = popup.querySelector('.email-popup-address').textContent.trim();
      if (!addr) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(() => {
          const btn = popup.querySelector('.email-popup-copy');
          const old = btn.textContent;
          btn.textContent = 'Copied';
          setTimeout(() => { btn.textContent = old; }, 1400);
        }).catch(() => {});
      } else {
        const range = document.createRange();
        const sel = window.getSelection();
        const node = popup.querySelector('.email-popup-address');
        range.selectNodeContents(node);
        sel.removeAllRanges();
        sel.addRange(range);
        try { document.execCommand('copy'); } catch (e) {}
        sel.removeAllRanges();
      }
    });

    return popup;
  }

  function showPopup(email, href) {
    let popup = document.getElementById('emailPopup') || createPopup();
    popup.querySelector('.email-popup-address').textContent = email;
    const open = popup.querySelector('.email-popup-open');
    open.href = href || `mailto:${email}`;
    popup.classList.add('visible');
    popup.querySelector('.email-popup-copy').focus();
  }

  function hidePopup() {
    const popup = document.getElementById('emailPopup');
    if (popup) popup.classList.remove('visible');
  }

  // Intercept clicks on any mailto: link
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute('href');
    const email = (href || '').split(':')[1] ? (href.split(':')[1].split('?')[0]) : '';
    if (!email) return;
    showPopup(email, href);
  });
})();

