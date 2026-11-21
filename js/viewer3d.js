/* Interactive 3D parts viewer for Click Circuits.
 *
 * Any element with [data-viewer="arduino,servo,led"] becomes a drag-to-rotate 3D
 * viewer. three.js is loaded from cdnjs only when a viewer scrolls into view, so
 * pages stay light. Without WebGL (or if the script cannot load) the photo inside
 * the viewer stays visible.
 *
 * Models are built from simple shapes, so there are no model files to host:
 *   arduino  Arduino Uno. Hover or tap a part to learn what it does.
 *   servo    Micro servo. Click it to make the horn sweep.
 *   led      5 mm LED. Click it to turn it on and off.
 */
(function () {
  'use strict';

  var hosts = document.querySelectorAll('[data-viewer]');
  if (!hosts.length) return;

  var THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var THREE_SRI = 'sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var LABELS = { arduino: 'Arduino board', servo: 'Servo', led: 'LED' };
  var HINTS = {
    arduino: 'Drag to rotate. Hover over a part to see what it does.',
    servo: 'Click the servo to make it sweep back and forth. Drag to rotate.',
    led: 'Click the LED to turn it on and off. Drag to rotate.'
  };

  /* ---------- loading ---------- */
  var threePromise = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threePromise) return threePromise;
    threePromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = THREE_SRC;
      s.integrity = THREE_SRI;
      s.crossOrigin = 'anonymous';
      s.onload = function () { window.THREE ? resolve(window.THREE) : reject(new Error('three.js missing')); };
      s.onerror = function () { reject(new Error('three.js failed to load')); };
      document.head.appendChild(s);
    });
    return threePromise;
  }

  function webglAvailable() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  /* ---------- models ---------- */
  function createModels(THREE) {
    var sRGB = THREE.sRGBEncoding;

    function color(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
    function mat(hex, o) {
      var m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.6, metalness: 0.05 }, o || {}));
      m.color = color(hex);
      return m;
    }
    function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
    function cyl(rt, rb, h, m, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 28), m); }
    function canvasTex(w, h, draw) {
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      var t = new THREE.CanvasTexture(c);
      t.encoding = sRGB;
      t.anisotropy = 4;
      return t;
    }
    function makePart(list, label, text) {
      var p = { label: label, text: text, meshes: [] };
      list.push(p);
      return p;
    }
    function attach(part, mesh) {
      mesh.material = mesh.material.clone();
      mesh.userData.part = part;
      part.meshes.push(mesh);
      return mesh;
    }
    function glowTexture() {
      return canvasTex(128, 128, function (x, w, h) {
        var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.25, 'rgba(255,255,255,0.5)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
      });
    }
    function shadowPlane(radius, y) {
      var t = canvasTex(256, 256, function (x, w, h) {
        var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, 'rgba(10,15,28,0.28)');
        g.addColorStop(0.6, 'rgba(10,15,28,0.1)');
        g.addColorStop(1, 'rgba(10,15,28,0)');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
      });
      var m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2.6, radius * 2.6),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = y;
      m.renderOrder = -1;
      return m;
    }
    // Centers the model on the origin and reports its size.
    function finish(group, parts, extra) {
      var b = new THREE.Box3().setFromObject(group);
      var c = b.getCenter(new THREE.Vector3());
      group.position.sub(c);
      var wrap = new THREE.Group();
      wrap.add(group);
      var sphere = b.getBoundingSphere(new THREE.Sphere());
      var size = b.getSize(new THREE.Vector3());
      wrap.add(shadowPlane(sphere.radius, -size.y / 2 - 0.6));
      var solids = [];
      group.traverse(function (o) { if (o.userData && o.userData.solid) solids.push(o); });
      return Object.assign({ group: wrap, parts: parts, solids: solids, radius: sphere.radius }, extra || {});
    }

    /* ----- Arduino Uno ----- */
    function arduino() {
      var g = new THREE.Group();
      var parts = [];
      var TOP = 0.8; // top face of the 1.6 mm board
      var meshes = [];

      // board coordinates: x from the left edge, yTop from the top edge (mm)
      function at(m, x, yTop, h, lift) {
        m.position.set(x - 34.3, TOP + (lift || 0) + h / 2, yTop - 26.7);
        g.add(m);
        meshes.push(m);
        return m;
      }

      var pcb = box(68.6, 1.6, 53.4, mat('#0a8794', { roughness: 0.45 }));
      pcb.userData.solid = true;
      g.add(pcb);

      // silkscreen
      var S = 2048 / 68.6;
      var silk = canvasTex(2048, 1594, function (x, w, h) {
        x.clearRect(0, 0, w, h);
        x.fillStyle = '#ffffff';
        x.strokeStyle = '#ffffff';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        function T(txt, mx, my, size, weight) { x.font = (weight || '700') + ' ' + size + 'px Arial, Helvetica, sans-serif'; x.fillText(txt, mx * S, my * S); }
        var digital = ['SCL', 'SDA', 'AREF', 'GND', '13', '12', '~11', '~10', '~9', '8'];
        digital.forEach(function (t, i) { T(t, 16.7 + 1.27 + i * 2.54, 5.4, t.length > 3 ? 26 : 34); });
        ['7', '~6', '~5', '4', '~3', '2', '1', '0'].forEach(function (t, i) { T(t, 45.0 + 1.27 + i * 2.54, 5.4, 34); });
        T('DIGITAL (PWM~)', 36.8, 9.2, 38);
        x.fillRect(26 * S, 10.5 * S, 22 * S, 0.35 * S);
        ['', 'IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'Vin'].forEach(function (t, i) { if (t) T(t, 25.7 + 1.27 + i * 2.54, 47.3, 24); });
        ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].forEach(function (t, i) { T(t, 50.1 + 1.27 + i * 2.54, 47.3, 32); });
        T('POWER', 43.6, 44.6, 36);
        T('ANALOG IN', 56.2, 44.6, 36);
        x.fillRect(38 * S, 45.9 * S, 11 * S, 0.35 * S);
        x.fillRect(50 * S, 45.9 * S, 15 * S, 0.35 * S);
        // logo
        x.lineWidth = 0.95 * S;
        x.beginPath(); x.arc(35.4 * S, 14.6 * S, 3.2 * S, 0, Math.PI * 2); x.stroke();
        x.beginPath(); x.arc(41.9 * S, 14.6 * S, 3.2 * S, 0, Math.PI * 2); x.stroke();
        x.lineWidth = 0.7 * S;
        x.beginPath(); x.moveTo(33.6 * S, 14.6 * S); x.lineTo(37.2 * S, 14.6 * S); x.stroke();
        x.beginPath(); x.moveTo(40.1 * S, 14.6 * S); x.lineTo(43.7 * S, 14.6 * S); x.moveTo(41.9 * S, 12.8 * S); x.lineTo(41.9 * S, 16.4 * S); x.stroke();
        T('ARDUINO', 38.7, 19.8, 72);
        x.lineWidth = 0.3 * S;
        x.strokeRect(31.7 * S, 22.6 * S, 13.5 * S, 3.6 * S);
        T('UNO R3', 38.4, 24.4, 50);
        T('ARDUINO.CC', 53.2, 29, 28, '600');
        T('ICSP', 64.2, 20.2, 28, '600');
        T('ON', 61.9, 16.4, 28, '600');
        T('L', 24.8, 10.8, 28, '600');
        T('TX', 24.6, 16.4, 26, '600');
        T('RX', 24.6, 18.8, 26, '600');
      });
      var silkMesh = new THREE.Mesh(new THREE.PlaneGeometry(68.6, 53.4),
        new THREE.MeshBasicMaterial({ map: silk, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      silkMesh.rotation.x = -Math.PI / 2;
      silkMesh.position.y = TOP + 0.02;
      g.add(silkMesh);

      // mounting holes
      [[14.8, 2.4], [13.8, 50.5], [65.8, 17.5], [65.8, 45.7]].forEach(function (p) {
        var h = cyl(1.7, 1.7, 0.1, mat('#0b2f33'), 20);
        at(h, p[0], p[1], 0.1, 0.01);
      });

      // header pin tops
      function headerTex(n, vertical) {
        return canvasTex(vertical ? 64 : 64 * n, vertical ? 64 * n : 64, function (x, w, h) {
          x.fillStyle = '#17191c'; x.fillRect(0, 0, w, h);
          for (var i = 0; i < n; i++) {
            var ox = vertical ? 0 : i * 64, oy = vertical ? i * 64 : 0;
            x.fillStyle = '#050607'; x.fillRect(ox + 20, oy + 20, 24, 24);
            x.strokeStyle = '#3a3e44'; x.lineWidth = 2; x.strokeRect(ox + 12, oy + 12, 40, 40);
          }
        });
      }
      function header(partObj, n, x0, yTop, vertical) {
        var len = n * 2.54;
        var tex = headerTex(n, vertical);
        var side = mat('#16181b', { roughness: 0.55 });
        var topM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.05 });
        var w = vertical ? 2.54 : len, d = vertical ? len : 2.54;
        var m = box(w, 8.5, d, [side, side, topM, side, side, side]);
        // materials in an array: clone each one for highlighting
        m.material = m.material.map(function (mm) { return mm.clone(); });
        m.userData.part = partObj;
        partObj.meshes.push(m);
        at(m, x0 + w / 2, yTop, 8.5);
        return m;
      }
      var pDigital = makePart(parts, 'Digital pins 0 to 13', 'Connect LEDs, buttons, servos and sensors. Pins marked with a ~ can also fake an analog level with PWM.');
      header(pDigital, 10, 16.7, 1.9);
      header(pDigital, 8, 45.0, 1.9);
      var pPower = makePart(parts, 'Power pins', 'Supply 5 V, 3.3 V and ground to the parts you wire up, and take in power on Vin.');
      header(pPower, 8, 25.7, 51.0);
      var pAnalog = makePart(parts, 'Analog pins A0 to A5', 'Read changing voltages from sensors, like the two axes of a joystick.');
      header(pAnalog, 6, 50.1, 51.0);

      // USB-B connector
      var metal = function () { return mat('#d9dde3', { roughness: 0.35, metalness: 0.35 }); };
      var pUsb = makePart(parts, 'USB-B port', 'Plugs into a computer. It powers the board and carries the code you upload.');
      var usb = attach(pUsb, box(16.5, 10.8, 12.2, metal()));
      at(usb, 1.75, 14.5, 10.8);
      var usbHole = attach(pUsb, box(0.3, 7.2, 9.2, mat('#202428')));
      usbHole.position.set(1.75 - 34.3 - 8.25 - 0.05, TOP + 5.4, 14.5 - 26.7); g.add(usbHole);

      // DC power jack
      var pJack = makePart(parts, 'Power jack', 'Takes a 7 to 12 volt power supply when the board is not plugged into a computer.');
      var jack = attach(pJack, box(14.9, 10.6, 9.2, mat('#17191c', { roughness: 0.5 })));
      at(jack, 4.35, 44.8, 10.6);
      var jackHole = attach(pJack, cyl(3.2, 3.2, 0.3, mat('#06070a'), 24));
      jackHole.rotation.z = Math.PI / 2;
      jackHole.position.set(4.35 - 34.3 - 7.45 - 0.05, TOP + 5.3, 44.8 - 26.7); g.add(jackHole);

      // ATmega328P
      var pChip = makePart(parts, 'ATmega328P microcontroller', 'The brain of the board. It runs the program you upload and reads and controls every pin.');
      var chipTop = canvasTex(1024, 256, function (x, w, h) {
        x.fillStyle = '#16181b'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#2b2f35';
        x.beginPath(); x.arc(150, 128, 52, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.arc(660, 128, 52, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#b9bec6'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.font = '700 44px Arial, sans-serif'; x.fillText('ATMEL', 512, 80);
        x.font = '600 38px Arial, sans-serif'; x.fillText('ATMEGA328P-PU', 512, 135);
        x.font = '500 30px Arial, sans-serif'; x.fillText('2009YEB', 512, 190);
      });
      var chipSide = mat('#14161a', { roughness: 0.5 });
      var chip = box(34.6, 4, 7.6, [chipSide, chipSide, new THREE.MeshStandardMaterial({ map: chipTop, roughness: 0.45 }), chipSide, chipSide, chipSide]);
      chip.material = chip.material.map(function (mm) { return mm.clone(); });
      chip.userData.part = pChip; pChip.meshes.push(chip);
      at(chip, 46.2, 36.9, 4);
      [-4.1, 4.1].forEach(function (dz) {
        var legs = attach(pChip, box(35.6, 0.6, 0.9, metal()));
        at(legs, 46.2, 36.9 + dz, 0.6, 0.0);
      });

      // USB interface chip, regulator, crystal, reset
      var pUsbChip = makePart(parts, 'ATmega16U2', 'A second small chip that lets the board talk to a computer over USB.');
      at(attach(pUsbChip, box(7, 1.1, 7, mat('#202226'))), 19.7, 18.4, 1.1);
      var pReg = makePart(parts, 'Voltage regulator', 'Turns the power jack input into a steady 5 volts for the chip and your parts.');
      at(attach(pReg, box(4.6, 1.8, 6.8, mat('#17191c'))), 7.4, 35.6, 1.8);
      at(attach(pReg, box(1.2, 0.6, 3.6, metal())), 4.6, 35.6, 0.6);
      var pXtal = makePart(parts, '16 MHz crystal', 'Ticks 16 million times a second so the chip keeps steady time.');
      var xt = attach(pXtal, box(11, 3.6, 4.4, metal()));
      at(xt, 18.6, 27.0, 3.6);
      at(attach(pXtal, box(8.6, 0.2, 3.2, mat('#8d939c', { metalness: 0.2 }))), 18.6, 27.0, 0.2, 3.6);
      var pReset = makePart(parts, 'Reset button', 'Restarts the program on the board, like turning it off and on again.');
      at(attach(pReset, box(6.2, 3.2, 6.2, metal())), 5.9, 3.4, 3.2);
      var cap = attach(pReset, cyl(1.9, 1.9, 1.2, mat('#17191c'), 20));
      at(cap, 5.9, 3.4, 1.2, 3.2);

      // capacitors
      var pCap = makePart(parts, 'Capacitors', 'Smooth out the power supply so the chip gets clean, steady voltage.');
      var capTop = canvasTex(256, 256, function (x, w, h) {
        x.fillStyle = '#c4c9d0'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#2a2d33'; x.beginPath(); x.arc(w / 2, h / 2, w / 2, -Math.PI / 2 - 0.9, -Math.PI / 2 + 0.9); x.lineTo(w / 2, h / 2); x.fill();
        x.fillStyle = '#20242b'; x.font = '700 62px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('47', w / 2 + 30, h / 2 - 10); x.font = '600 46px Arial, sans-serif'; x.fillText('25V', w / 2 + 30, h / 2 + 52);
      });
      [18.1, 25.1].forEach(function (cx) {
        var c = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 5.6, 28),
          [mat('#aeb4bc', { roughness: 0.35, metalness: 0.3 }), new THREE.MeshStandardMaterial({ map: capTop, roughness: 0.4 }), mat('#aeb4bc')]);
        c.material = c.material.map(function (mm) { return mm.clone(); });
        c.userData.part = pCap; pCap.meshes.push(c);
        at(c, cx, 44.3, 5.6);
      });

      // ICSP headers with gold pins
      var pIcsp = makePart(parts, 'ICSP header', 'Lets you program the chip directly with an external programmer.');
      function icsp(x, yTop, w, d) {
        var base = attach(pIcsp, box(w, 2.6, d, mat('#17191c')));
        at(base, x, yTop, 2.6);
        var cols = Math.round(w / 2.54), rows = Math.round(d / 2.54);
        for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
          var pin = attach(pIcsp, box(0.64, 6, 0.64, mat('#d4b04c', { roughness: 0.35, metalness: 0.5 })));
          pin.position.set(x - 34.3 - (cols - 1) * 1.27 + i * 2.54, TOP + 2.6 + 3, yTop - 26.7 - (rows - 1) * 1.27 + j * 2.54);
          g.add(pin);
        }
      }
      icsp(65.2, 25.9, 5.08, 7.62);
      icsp(18.2, 7.0, 7.62, 5.08);

      // LEDs
      function smd(partObj, x, yTop, hex, glow) {
        var m = attach(partObj, box(2.1, 0.9, 1.3, mat(hex, { emissive: color(glow), emissiveIntensity: 0.55, roughness: 0.4 })));
        at(m, x, yTop, 0.9);
      }
      var pL = makePart(parts, 'Built-in LED (pin 13)', 'A tiny light wired to pin 13. The very first blink program makes it flash.');
      smd(pL, 27.6, 10.8, '#f1e7a8', '#ffcc33');
      var pTxrx = makePart(parts, 'TX and RX lights', 'Flash when data is sent or received over USB while you upload code.');
      smd(pTxrx, 27.6, 16.4, '#f1e7a8', '#ffcc33');
      smd(pTxrx, 27.6, 18.8, '#f1e7a8', '#ffcc33');
      var pOn = makePart(parts, 'Power light', 'Glows whenever the board has power.');
      smd(pOn, 58.1, 16.4, '#c6f5c4', '#33dd55');

      // small surface-mount parts for detail
      var tiny = [[8.5, 13], [8.5, 17], [12.5, 13.5], [13, 21], [22.5, 22], [24.5, 22], [28.5, 24.5], [36, 27], [42, 33], [32, 21], [38, 12], [30, 37], [10, 41], [33.5, 42], [46, 24.5], [52.5, 33]];
      tiny.forEach(function (p, i) {
        var m = box(1.8, 0.6, 1.0, mat(i % 3 === 0 ? '#c8b58f' : '#25282d', { roughness: 0.6 }));
        at(m, p[0], p[1], 0.6);
      });

      g.rotation.y = 0;
      return finish(g, parts, { hint: HINTS.arduino, pitch: 0.95, yaw: -0.45 });
    }

    /* ----- Micro servo ----- */
    function servo() {
      var g = new THREE.Group();
      var parts = [];
      var blue = '#1f63d6';

      var pBody = makePart(parts, 'Servo motor', 'A small motor with gears and a sensor inside. It turns to the angle you tell it, then holds there.');
      var body = attach(pBody, box(22.6, 22, 12.2, mat(blue, { roughness: 0.45 })));
      g.add(body);
      var flange = attach(pBody, box(32.4, 2.4, 12.2, mat(blue, { roughness: 0.45 })));
      flange.position.y = 6; g.add(flange);
      [-14, 14].forEach(function (x) {
        var hole = cyl(1.1, 1.1, 2.5, mat('#0d2a5c'), 16);
        hole.position.set(x, 6, 0); g.add(hole);
      });
      var bump1 = attach(pBody, cyl(5.8, 5.8, 4, mat(blue, { roughness: 0.45 }), 32));
      bump1.position.set(-5.2, 13, 0); g.add(bump1);
      var bump2 = attach(pBody, cyl(3.1, 3.1, 2.4, mat(blue, { roughness: 0.45 }), 24));
      bump2.position.set(2.4, 12.2, 0); g.add(bump2);

      var pHorn = makePart(parts, 'Servo horn', 'The white arm that turns. Attach wheels, arms or levers here to make things move.');
      var horn = new THREE.Group();
      horn.position.set(-5.2, 16.6, 0);
      var white = mat('#f3f5f8', { roughness: 0.5 });
      var boss = attach(pHorn, cyl(3.6, 3.6, 2.4, white, 28)); boss.position.y = 0.6; horn.add(boss);
      var arm = attach(pHorn, box(24, 1.6, 4.4, white)); arm.position.y = 0.4; horn.add(arm);
      [-8, -5, 5, 8, 11].forEach(function (x) {
        var h = cyl(0.55, 0.55, 1.8, mat('#c4c9d1'), 12);
        h.position.set(x, 0.4, 0); horn.add(h);
      });
      var screw = attach(pHorn, cyl(1.1, 1.1, 0.7, mat('#20242b'), 16)); screw.position.y = 2; horn.add(screw);
      g.add(horn);

      var pWire = makePart(parts, 'Servo wires', 'Three wires: power, ground and a signal that tells the servo which angle to move to.');
      [['#ef8a25', -2.4], ['#d52a2a', 0], ['#6a3b1e', 2.4]].forEach(function (w, i) {
        var z = w[1];
        var curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(11.2, -1, z), new THREE.Vector3(15, -1.5, z * 1.3),
          new THREE.Vector3(20, -5, z * 2.2), new THREE.Vector3(25, -11, z * 3.4)
        ]);
        var tube = attach(pWire, new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.6, 10, false), mat(w[0], { roughness: 0.5 })));
        g.add(tube);
      });

      var sweeping = false, angle = 0;
      var model = finish(g, parts, { hint: HINTS.servo, pitch: 0.7, yaw: -0.6, zoom: 1.12 });
      model.onClick = function () { sweeping = !sweeping; };
      model.update = function (t) {
        if (sweeping) { angle = Math.sin(t * 2.4) * (Math.PI / 2); horn.rotation.y = angle; }
      };
      return model;
    }

    /* ----- 5 mm LED ----- */
    function led() {
      var g = new THREE.Group();
      var parts = [];
      var pLed = makePart(parts, 'LED', 'A light emitting diode. It needs a resistor in the circuit, and the longer leg connects to the positive side.');
      pLed.noPaint = true;
      var shellMat = mat('#ff3030', { roughness: 0.15, metalness: 0, transparent: true, opacity: 0.8, emissive: color('#ff1010'), emissiveIntensity: 0 });
      var shell = attach(pLed, cyl(2.5, 2.5, 5.8, shellMat, 40)); shell.position.y = 0; g.add(shell);
      var dome = attach(pLed, new THREE.Mesh(new THREE.SphereGeometry(2.5, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), shellMat.clone()));
      dome.position.y = 2.9; g.add(dome);
      var rim = attach(pLed, cyl(2.95, 2.95, 0.9, shellMat.clone(), 40)); rim.position.y = -2.9; g.add(rim);

      var pLegs = makePart(parts, 'LED legs', 'The longer leg is the anode (positive). The shorter leg is the cathode (negative).');
      var legMat = mat('#c9ced6', { roughness: 0.3, metalness: 0.5 });
      var anode = attach(pLegs, box(0.55, 26, 0.35, legMat)); anode.position.set(-1.27, -16.4, 0); g.add(anode);
      var cathode = attach(pLegs, box(0.55, 22, 0.35, legMat)); cathode.position.set(1.27, -14.4, 0); g.add(cathode);

      // inner anvil and cup, visible through the shell
      var inner = mat('#9aa0aa', { roughness: 0.4, metalness: 0.5 });
      var post = box(0.5, 4, 0.5, inner); post.position.set(-1.27, -0.6, 0); g.add(post);
      var cup = cyl(1.3, 0.6, 1.2, inner, 16); cup.position.set(-1.27, 1.6, 0); g.add(cup);
      var post2 = box(0.5, 3, 0.5, inner); post2.position.set(1.27, -1.2, 0); g.add(post2);
      var anvil = box(2.6, 0.4, 0.8, inner); anvil.position.set(1.0, 0.2, 0); g.add(anvil);

      var light = new THREE.PointLight(0xff3a3a, 0, 70);
      light.position.set(0, 3, 0);
      g.add(light);
      var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff3030, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      glow.scale.set(26, 26, 1);
      glow.position.set(0, 2.4, 0);
      g.add(glow);

      var on = false, level = 0;
      var model = finish(g, parts, { hint: HINTS.led, pitch: 0.35, yaw: -0.5, zoom: 1.3 });
      model.onClick = function () { on = !on; };
      model.update = function (t, dt) {
        level += ((on ? 1 : 0) - level) * Math.min(1, dt * 9);
        [shell, dome, rim].forEach(function (m) { m.material.emissiveIntensity = level * 1.3; m.material.opacity = 0.8 + level * 0.2; });
        light.intensity = level * 1.6;
        glow.material.opacity = level * 0.9;
        glow.scale.setScalar(22 + level * 10 + Math.sin(t * 6) * level * 0.8);
      };
      model.state = function () { return on; };
      return model;
    }

    return { arduino: arduino, servo: servo, led: led };
  }

  /* ---------- viewer ---------- */
  function Viewer(host, THREE) {
    var self = this;
    var keys = (host.getAttribute('data-viewer') || 'arduino').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var stage = host.querySelector('.viewer-stage');
    var caption = host.querySelector('.viewer-caption');
    var tabsEl = host.querySelector('.viewer-tabs');
    var builders = createModels(THREE);
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

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(28, 4 / 3, 1, 1000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xaab6c8, 0.95));
    var key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(50, 90, 60);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xdce8ff, 0.35);
    fill.position.set(-70, 40, -40);
    scene.add(fill);
    var raycaster = new THREE.Raycaster();
    var ndc = new THREE.Vector2();

    function fitDistance() {
      if (!current) return;
      var v = camera.fov * Math.PI / 180;
      var h = 2 * Math.atan(Math.tan(v / 2) * camera.aspect);
      dist = current.radius / Math.sin(Math.min(v, h) / 2) * 1.08 / (current.zoom || 1);
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
          if (on) { mm.emissive = new THREE.Color(0x0a7cff).convertSRGBToLinear(); mm.emissiveIntensity = 0.5; }
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
      if (!builders[k]) k = keys[0];
      if (k === currentKey) return;
      if (hovered) { paint(hovered, false); hovered = null; }
      if (pinned) { paint(pinned, false); pinned = null; }
      tip.hidden = true;
      if (current) scene.remove(current.group);
      if (!cache[k]) cache[k] = builders[k]();
      current = cache[k]; currentKey = k;
      scene.add(current.group);
      yaw = current.yaw; pitch = current.pitch;
      auto = !reduced && !host.classList.contains('is-touched');
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
          b.textContent = LABELS[k] || k;
          b.addEventListener('click', function () { select(k); });
          tabsEl.appendChild(b);
        });
      } else { tabsEl.hidden = true; }
    }

    function tick(now) {
      if (!visible || document.hidden) { running = false; return; }
      var dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
      lastT = now;
      if (auto && !dragging) yaw += dt * 0.35;
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
    host.__booting = loadThree().then(function (THREE) {
      var v = new Viewer(host, THREE);
      host.__viewer = v;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { es.forEach(function (e) { v.setVisible(e.isIntersecting); }); }, { threshold: 0.05 }).observe(host);
      } else { v.setVisible(true); }
      return v;
    }).catch(function () { /* keep the fallback photo */ });
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
