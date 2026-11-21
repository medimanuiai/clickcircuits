/* Click Circuits: kit part viewer.
   Shows a real photo of each kit part, cut out of its background, as a thin 3D
   object you can tilt and turn by dragging (or with the arrow keys). No 3D
   models and no libraries: the photo is stacked into a few layers with CSS 3D
   transforms so its edge shows when it turns.

   Markup (see index.html):
     <div class="viewer" data-viewer>
       <div class="viewer-stage" tabindex="0">
         <span class="viewer-floor"></span>
         <div class="viewer-obj"><div class="viewer-spin"><img ...></div></div>
         <span class="viewer-hint">Drag to turn it</span>
       </div>
       <p class="viewer-caption"></p> <p class="viewer-credit"></p>
     </div>
   Any button with data-show="<part>" inside the same [data-kit] block switches
   the part. Photos live in images/parts/<part>.webp. To use a photo of your own
   kit, replace that file (a plain white background works best) and update the
   credit below. */
(function () {
  const BY = 'https://creativecommons.org/licenses/by/2.0/';
  const BYSA = 'https://creativecommons.org/licenses/by-sa/2.0/';
  const PARTS = {
    arduino: { name: 'Arduino Uno', text: 'The small computer that runs the code students write. It reads buttons and sensors and drives lights and motors.',
      alt: 'An Arduino Uno board', by: 'SparkFun Electronics', lic: 'CC BY 2.0', licUrl: BY, src: 'https://commons.wikimedia.org/wiki/File:Arduino_Uno_-_R3.jpg' },
    bluetooth: { name: 'Bluetooth module', text: 'Lets the board talk to a phone or laptop without a cable.',
      alt: 'A Bluetooth serial module on a red circuit board', by: 'SparkFun Electronics', lic: 'CC BY 2.0', licUrl: BY, src: 'https://www.flickr.com/photos/sparkfun/12311196585' },
    led: { name: 'LED', text: 'A tiny light. Usually the first thing a student makes blink with code.',
      alt: 'A red 5 mm LED with two legs', by: 'oomlout', lic: 'CC BY-SA 2.0', licUrl: BYSA, src: 'https://commons.wikimedia.org/wiki/File:5mm_Red_LED.jpg' },
    resistor: { name: 'Resistor', text: 'Keeps the current low enough that each LED lasts.',
      alt: 'A resistor with colored stripes', by: 'oomlout', lic: 'CC BY-SA 2.0', licUrl: BYSA, src: 'https://commons.wikimedia.org/wiki/File:10_kiloohms_5%25_axial_resistor.jpg' },
    servo: { name: 'Micro servo', text: 'A small motor that turns to an exact angle, for arms, wheels, and anything that moves.',
      alt: 'A blue micro servo motor with its wires', by: 'oomlout', lic: 'CC BY-SA 2.0', licUrl: BYSA, src: 'https://commons.wikimedia.org/wiki/File:Micro_servo.jpg' },
    breadboard: { name: 'Breadboard', text: 'Push parts and wires into the holes to build a circuit. No soldering needed.',
      alt: 'A white solderless breadboard', by: 'oomlout', lic: 'CC BY-SA 2.0', licUrl: BYSA, src: 'https://commons.wikimedia.org/wiki/File:400_points_breadboard.jpg' },
    joystick: { name: 'Joystick', text: 'Two directions of control, like on a game controller.',
      alt: 'A thumb joystick', by: 'SparkFun Electronics', lic: 'CC BY 2.0', licUrl: BY, src: 'https://www.flickr.com/photos/sparkfun/50379564422' },
    button: { name: 'Push button', text: 'Press it and the board knows. The simplest way to give a project an input.',
      alt: 'A black 12 mm push button', by: 'oomlout', lic: 'CC BY-SA 2.0', licUrl: BYSA, src: 'https://commons.wikimedia.org/wiki/File:BUTA-12-X-STAN-01_(16422918065).jpg' },
    wires: { name: 'Jumper wires', text: 'Connect everything together. The kit has male and female ends.',
      alt: 'A bundle of colored jumper wires', by: 'oomlout', lic: 'CC BY-SA 2.0', licUrl: BYSA, src: 'https://commons.wikimedia.org/wiki/File:A_few_Jumper_Wires.jpg' },
  };
  const LAYERS = 7;      // copies stacked behind the photo to give it an edge
  const STEP = 1.1;      // px between copies
  const MAX_Y = 40;      // how far it turns left and right (degrees)
  const MAX_X = 26;      // how far it tips up and down
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  document.querySelectorAll('.viewer[data-viewer]').forEach(setup);

  function setup(viewer) {
    const stage = viewer.querySelector('.viewer-stage');
    const obj = viewer.querySelector('.viewer-obj');
    const spin = viewer.querySelector('.viewer-spin');
    const front = spin && spin.querySelector('img');
    const floor = viewer.querySelector('.viewer-floor');
    const caption = viewer.querySelector('.viewer-caption');
    const credit = viewer.querySelector('.viewer-credit');
    if (!stage || !spin || !front) return;
    const scope = viewer.closest('[data-kit]') || document;
    const buttons = [...scope.querySelectorAll('[data-show]')];

    // Stack copies of the photo behind it so the part has a visible edge when turned.
    const edges = [];
    for (let i = LAYERS; i >= 1; i--) {
      const e = new Image();
      e.src = front.currentSrc || front.src;
      e.alt = '';
      e.className = 'edge';
      e.setAttribute('aria-hidden', 'true');
      e.draggable = false;
      e.style.transform = 'translateZ(' + (-i * STEP) + 'px)';
      spin.insertBefore(e, front);
      edges.push(e);
    }
    front.draggable = false;

    let rx = -6, ry = 0, tx = -6, ty = 0;
    let mode = 'idle';           // idle (gentle sway), hover (follows the mouse), drag
    let lastX = 0, lastY = 0, idleAt = 0, running = false, visible = true;

    function frame(now) {
      if (mode === 'idle' && now > idleAt && !reduced()) {
        ty = Math.sin(now / 1700) * 16;
        tx = -6 + Math.sin(now / 2300) * 4;
      }
      rx += (tx - rx) * 0.12;
      ry += (ty - ry) * 0.12;
      spin.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      if (floor) floor.style.transform = 'translateX(calc(-50% + ' + (ry * 0.9).toFixed(1) + 'px)) scaleX(' + (1 - Math.abs(ry) / 160).toFixed(3) + ')';
      if (visible) requestAnimationFrame(frame); else running = false;
    }
    function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(stage);
    }
    start();

    function touched() { viewer.classList.add('is-touched'); }
    function settle(delay) { mode = 'idle'; idleAt = performance.now() + delay; }

    stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      mode = 'drag';
      lastX = e.clientX; lastY = e.clientY;
      viewer.classList.add('is-dragging');
      touched();
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', (e) => {
      if (mode === 'drag') {
        ty = clamp(ty + (e.clientX - lastX) * 0.45, -MAX_Y, MAX_Y);
        tx = clamp(tx - (e.clientY - lastY) * 0.35, -MAX_X, MAX_X);
        lastX = e.clientX; lastY = e.clientY;
      } else if (e.pointerType === 'mouse') {
        const r = stage.getBoundingClientRect();
        mode = 'hover';
        ty = ((e.clientX - r.left) / r.width - 0.5) * 2 * (MAX_Y * 0.7);
        tx = -((e.clientY - r.top) / r.height - 0.5) * 2 * (MAX_X * 0.7);
      }
    });
    const endDrag = () => { if (mode === 'drag') { viewer.classList.remove('is-dragging'); settle(1800); } };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('pointerleave', () => { if (mode === 'hover') settle(600); });
    stage.addEventListener('keydown', (e) => {
      const k = { ArrowLeft: [0, -10], ArrowRight: [0, 10], ArrowUp: [8, 0], ArrowDown: [-8, 0] }[e.key];
      if (!k) return;
      e.preventDefault();
      mode = 'hover';
      tx = clamp(tx + k[0], -MAX_X, MAX_X);
      ty = clamp(ty + k[1], -MAX_Y, MAX_Y);
      touched();
      clearTimeout(stage._t);
      stage._t = setTimeout(() => settle(0), 2500);
    });

    function show(key, fromButton) {
      const p = PARTS[key];
      if (!p) return;
      const url = 'images/parts/' + key + '.webp';
      front.src = url;
      front.alt = p.alt;
      edges.forEach((e) => { e.src = url; });
      if (caption) caption.innerHTML = '<strong>' + esc(p.name) + '.</strong> ' + esc(p.text);
      if (credit) credit.innerHTML = 'Photo: <a href="' + p.src + '" rel="noopener">' + esc(p.by) + '</a>, <a href="' + p.licUrl + '" rel="noopener">' + p.lic + '</a>, background removed.';
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.show === key)));
      stage.setAttribute('aria-label', p.name + '. Drag, or use the arrow keys, to turn it.');
      if (fromButton) {
        if (!reduced() && obj.animate) obj.animate([{ transform: 'scale(0.86)', opacity: 0.4 }, { transform: 'scale(1.03)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
        ty = ty > 0 ? -22 : 22; settle(500);
        const r = stage.getBoundingClientRect();
        if (r.bottom < 80 || r.top > window.innerHeight - 80) stage.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
      }
    }
    buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.show, true)));
    show(viewer.dataset.start || 'arduino', false);
  }
})();
