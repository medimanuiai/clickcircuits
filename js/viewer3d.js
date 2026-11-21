/* Interactive 3D parts viewer for Click Circuits.
 *
 * Any element with [data-viewer="arduino,servo,led"] becomes a drag-to-rotate 3D
 * viewer. three.js and the model files load only when a viewer scrolls near the
 * screen, so pages stay light. Without WebGL (or if loading fails) the photo
 * inside the viewer stays visible.
 *
 *   viewer-kit.js      materials, studio lighting, helpers
 *   viewer-arduino.js  Arduino Uno, Bluetooth module
 *   viewer-parts.js    LEDs, resistors, servo, breadboard, joystick, button, wires
 *
 * Keys for data-viewer: arduino, bluetooth, led, resistor, servo, breadboard,
 * joystick, button, wires.
 */
(function () {
  'use strict';

  var hosts = document.querySelectorAll('[data-viewer]');
  if (!hosts.length) return;

  var THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var THREE_SRI = 'sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu';
  var FILES = ['viewer-kit.js', 'viewer-arduino.js', 'viewer-parts.js'];
  var BASE = (function () {
    var s = document.currentScript;
    return s && s.src ? s.src.replace(/viewer3d\.js(\?.*)?$/, '') : 'js/';
  })();
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- loading ---------- */
  function loadScript(src, integrity) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      if (integrity) { s.integrity = integrity; s.crossOrigin = 'anonymous'; }
      s.onload = resolve;
      s.onerror = function () { reject(new Error('failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }
  var assets = null;
  function loadAssets() {
    if (assets) return assets;
    assets = (window.THREE ? Promise.resolve() : loadScript(THREE_SRC, THREE_SRI)).then(function () {
      return Promise.all(FILES.map(function (f) { return loadScript(BASE + f); }));
    }).then(function () {
      if (!window.THREE || !window.CCM || !window.CCM.kit) throw new Error('viewer files missing');
      return window.THREE;
    });
    return assets;
  }

  function webglAvailable() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  /* ---------- viewer ---------- */
  function Viewer(host, THREE) {
    var CCM = window.CCM;
    var K = CCM.kit(THREE);
    var keys = (host.getAttribute('data-viewer') || 'arduino').split(',').map(function (s) { return s.trim(); }).filter(function (k) { return CCM.build[k]; });
    if (!keys.length) throw new Error('no models');
    var stage = host.querySelector('.viewer-stage');
    var caption = host.querySelector('.viewer-caption');
    var tabsEl = host.querySelector('.viewer-tabs');
    var cache = {};
    var current = null, currentKey = null;
    var hovered = null, pinned = null;
    var yaw = -0.45, pitch = 0.95, dist = 150;
    var auto = !reduced, dragging = false, moved = 0, last = { x: 0, y: 0 };
    var visible = false, running = false, lastT = 0;

    var canvas = document.createElement('canvas');
    canvas.className = 'viewer-canvas';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '3D model. Drag to rotate, or use the arrow keys.');
    stage.insertBefore(canvas, stage.firstChild);

    var tip = document.createElement('div');
    tip.className = 'viewer-tip';
    tip.hidden = true;
    stage.appendChild(tip);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    scene.environment = K.environment(renderer);
    var camera = new THREE.PerspectiveCamera(24, 4 / 3, 1, 2000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2f5fb0, 0.35));
    var key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.06;
    key.shadow.radius = 3;
    scene.add(key); scene.add(key.target);
    var rim = new THREE.DirectionalLight(0x9cc8ff, 1.0);
    scene.add(rim);
    var raycaster = new THREE.Raycaster();
    var ndc = new THREE.Vector2();

    function frameLights() {
      var r = current ? current.radius : 40;
      key.position.set(0.5 * r * 3, 1.15 * r * 3, 0.7 * r * 3);
      var c = key.shadow.camera;
      c.left = -r * 1.5; c.right = r * 1.5; c.top = r * 1.5; c.bottom = -r * 1.5; c.near = r * 0.5; c.far = r * 9;
      c.updateProjectionMatrix();
      rim.position.set(-0.8 * r * 3, 0.6 * r * 3, -0.9 * r * 3);
    }
    function fitDistance() {
      if (!current) return;
      var v = camera.fov * Math.PI / 180;
      var h = 2 * Math.atan(Math.tan(v / 2) * camera.aspect);
      dist = current.radius / Math.sin(Math.min(v, h) / 2) * 1.06 / (current.zoom || 1);
    }
    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fitDistance();
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);

    function setCaption(part) {
      if (!caption) return;
      caption.textContent = '';
      if (part) {
        var s = document.createElement('strong');
        s.textContent = part.label + '. ';
        caption.appendChild(s);
        caption.appendChild(document.createTextNode(part.text));
      } else if (current) {
        caption.textContent = current.hint;
      }
    }
    function paint(part, on) {
      if (!part || part.noPaint) return;
      part.meshes.forEach(function (m) {
        (Array.isArray(m.material) ? m.material : [m.material]).forEach(function (mm) {
          if (!mm.emissive) return;
          if (mm.userData.baseEmissive === undefined) { mm.userData.baseEmissive = mm.emissive.clone(); mm.userData.baseIntensity = mm.emissiveIntensity; }
          if (on) { mm.emissive = new THREE.Color(0x0a7cff).convertSRGBToLinear(); mm.emissiveIntensity = 0.55; }
          else { mm.emissive = mm.userData.baseEmissive.clone(); mm.emissiveIntensity = mm.userData.baseIntensity; }
        });
      });
    }
    function setHover(part) {
      if (part === hovered) return;
      if (hovered && hovered !== pinned) paint(hovered, false);
      hovered = part;
      if (hovered) paint(hovered, true);
      canvas.style.cursor = hovered || (current && current.onClick) ? 'pointer' : '';
      if (hovered) { setCaption(hovered); tip.textContent = hovered.label; tip.hidden = false; }
      else { tip.hidden = true; setCaption(pinned); }
    }

    function pick(e) {
      if (!current) return null;
      var r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      var list = [];
      current.parts.forEach(function (p) { p.meshes.forEach(function (m) { list.push(m); }); });
      (current.solids || []).forEach(function (m) { list.push(m); });
      var hit = raycaster.intersectObjects(list, false)[0];
      return hit && hit.object.userData.part ? hit.object.userData.part : null;
    }
    function touch() { host.classList.add('is-touched'); auto = false; }

    canvas.addEventListener('pointerdown', function (e) {
      dragging = true; moved = 0; last = { x: e.clientX, y: e.clientY };
      host.classList.add('is-dragging'); touch();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (dragging) {
        var dx = e.clientX - last.x, dy = e.clientY - last.y;
        moved += Math.abs(dx) + Math.abs(dy);
        last = { x: e.clientX, y: e.clientY };
        yaw -= dx * 0.008;
        pitch = Math.max(0.05, Math.min(1.5, pitch + dy * 0.006));
        tip.hidden = true;
        return;
      }
      var p = pick(e);
      setHover(p);
      if (p) {
        var r = stage.getBoundingClientRect();
        tip.style.left = (e.clientX - r.left) + 'px';
        tip.style.top = (e.clientY - r.top) + 'px';
      }
    });
    canvas.addEventListener('pointerup', function (e) {
      var wasClick = dragging && moved < 6;
      dragging = false; host.classList.remove('is-dragging');
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (!wasClick || !current) return;
      var p = pick(e);
      if (current.onClick) current.onClick(p);
      if (p) {
        if (pinned && pinned !== p) paint(pinned, false);
        pinned = p; paint(p, true); setCaption(p);
      }
    });
    canvas.addEventListener('pointerleave', function () { if (!dragging) setHover(null); });
    canvas.addEventListener('keydown', function (e) {
      var step = 0.18;
      if (e.key === 'ArrowLeft') { yaw += step; touch(); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { yaw -= step; touch(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { pitch = Math.min(1.5, pitch + step / 2); touch(); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { pitch = Math.max(0.05, pitch - step / 2); touch(); e.preventDefault(); }
      else if ((e.key === 'Enter' || e.key === ' ') && current && current.onClick) { current.onClick(null); e.preventDefault(); }
    });

    function select(k) {
      if (!CCM.build[k]) k = keys[0];
      if (k === currentKey) return;
      if (hovered) { paint(hovered, false); hovered = null; }
      if (pinned) { paint(pinned, false); pinned = null; }
      tip.hidden = true;
      if (current) scene.remove(current.group);
      if (!cache[k]) cache[k] = CCM.build[k](THREE, K);
      current = cache[k]; currentKey = k;
      scene.add(current.group);
      yaw = current.yaw; pitch = current.pitch;
      auto = !reduced && !host.classList.contains('is-touched');
      frameLights();
      fitDistance();
      setCaption(null);
      canvas.style.cursor = current.onClick ? 'pointer' : '';
      if (tabsEl) tabsEl.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-key') === k ? 'true' : 'false'); });
      var fb = stage.querySelector('.viewer-fallback');
      if (fb) fb.hidden = true;
    }
    this.select = select;

    if (tabsEl) {
      tabsEl.innerHTML = '';
      if (keys.length > 1) {
        tabsEl.setAttribute('role', 'tablist');
        keys.forEach(function (k) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'viewer-tab'; b.setAttribute('role', 'tab'); b.setAttribute('data-key', k);
          b.textContent = CCM.labels[k] || k;
          b.addEventListener('click', function () { select(k); });
          tabsEl.appendChild(b);
        });
      } else { tabsEl.hidden = true; }
    }

    function tick(now) {
      if (!visible || document.hidden) { running = false; return; }
      var dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
      lastT = now;
      if (auto && !dragging) yaw += dt * 0.3;
      if (current) {
        if (current.update) current.update(now / 1000, dt);
        var cp = Math.cos(pitch);
        camera.position.set(Math.sin(yaw) * cp * dist, Math.sin(pitch) * dist, Math.cos(yaw) * cp * dist);
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      }
      requestAnimationFrame(tick);
    }
    function start() { if (!running && visible) { running = true; lastT = performance.now(); requestAnimationFrame(tick); } }
    this.setVisible = function (v) { visible = v; if (v) start(); };
    document.addEventListener('visibilitychange', start);

    resize();
    select(host.getAttribute('data-start') || keys[0]);
    host.classList.add('is-live');
  }

  /* ---------- boot ---------- */
  function boot(host) {
    if (host.__booting) return host.__booting;
    host.__booting = loadAssets().then(function (THREE) {
      var v = new Viewer(host, THREE);
      host.__viewer = v;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { es.forEach(function (e) { v.setVisible(e.isIntersecting); }); }, { threshold: 0.05 }).observe(host);
      } else { v.setVisible(true); }
      return v;
    }).catch(function (err) {
      if (window.console && console.warn) console.warn('3D viewer unavailable:', err && err.message);
    });
    return host.__booting;
  }

  if (!webglAvailable()) return;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); boot(en.target); } });
    }, { rootMargin: '300px 0px' });
    hosts.forEach(function (h) { io.observe(h); });
  } else { hosts.forEach(boot); }

  // Buttons elsewhere on the page can switch the viewer: <button data-show="servo">.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-show]');
    if (!b) return;
    var host = document.querySelector('[data-viewer]');
    if (!host) return;
    var k = b.getAttribute('data-show');
    host.setAttribute('data-start', k);
    boot(host).then(function (v) {
      if (v) v.select(k);
      var r = host.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight) host.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  });
})();
