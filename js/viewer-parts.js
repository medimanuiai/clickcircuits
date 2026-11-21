/* 3D models for the Click Circuits viewer: LEDs, resistors, servo, breadboard,
 * joystick, push button and jumper wires. Needs viewer-kit.js. Real-world sizes, in millimetres. */
(function () {
  'use strict';
  var CCM = window.CCM = window.CCM || { build: {}, labels: {}, hints: {}, order: [] };
  var L = CCM.labels, H = CCM.hints, B = CCM.build;
  L.led = 'LEDs'; H.led = 'Click an LED to turn it on and off. Drag to rotate.';
  L.resistor = 'Resistors'; H.resistor = 'Drag to rotate. Hover over a resistor to read its color code.';
  L.servo = 'Servo'; H.servo = 'Click the servo to make it sweep back and forth. Drag to rotate.';
  L.breadboard = 'Breadboard'; H.breadboard = 'Drag to rotate. Every hole in a column of five is connected underneath.';
  L.joystick = 'Joystick'; H.joystick = 'Click the joystick to make the stick move. Drag to rotate.';
  L.button = 'Push button'; H.button = 'Click the button to press it. Drag to rotate.';
  L.wires = 'Jumper wires'; H.wires = 'Drag to rotate. Hover over an end to see the difference between male and female.';

  function bx(K, THREE, w, h, d, m) { var g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return K.mesh(g, m); }

  /* ---------- one 5 mm LED (legs point down, base of the legs on y = 0) ---------- */
  function ledBody(THREE, K, hex, glow, legLong) {
    var grp = new THREE.Group();
    var mat = K.mat(hex, { roughness: 0.06, transparent: true, opacity: 0.72, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.5, emissive: K.color(glow), emissiveIntensity: 0 });
    var pts = [[0, 0], [2.95, 0], [2.95, 0.9], [2.5, 0.9], [2.5, 5.8]];
    for (var a = 1; a <= 14; a++) { var t = a / 14 * Math.PI / 2; pts.push([2.5 * Math.cos(t), 5.8 + 2.5 * Math.sin(t)]); }
    var shell = K.lathe(pts, mat, 44);
    var legs = new THREE.Group();
    var leg1 = bx(K, THREE, 0.55, legLong, 0.35, K.tin()); leg1.position.set(-1.27, -legLong, 0);
    var leg2 = bx(K, THREE, 0.55, legLong - 4, 0.35, K.tin()); leg2.position.set(1.27, -(legLong - 4), 0);
    legs.add(leg1); legs.add(leg2);
    var inner = K.steel(0.35);
    var post = bx(K, THREE, 0.5, 5.0, 0.5, inner); post.position.set(-1.27, 0.3, 0);
    var cup = K.cyl(1.3, 0.6, 1.2, inner, 20); cup.position.set(-1.27, 4.9, 0);
    var post2 = bx(K, THREE, 0.5, 3.6, 0.5, inner); post2.position.set(1.27, 0.3, 0);
    var anvil = bx(K, THREE, 2.7, 0.4, 0.8, inner); anvil.position.set(0.9, 3.9, 0);
    grp.add(shell); grp.add(post); grp.add(cup); grp.add(post2); grp.add(anvil);
    return { group: grp, shell: shell, legs: legs, inner: [post, cup, post2, anvil] };
  }

  /* ===================== LEDs ===================== */
  B.led = function (THREE, K) {
    var g = new THREE.Group(), parts = [];
    var legsPart = K.part(parts, 'LED legs', 'The longer leg is the anode (positive). The shorter leg is the cathode (negative).');
    var specs = [['Red', '#ff2a2a', '#ff1a1a'], ['Yellow', '#ffc21a', '#ffb000'], ['Green', '#25d35a', '#10ff50'], ['Blue', '#2a78ff', '#2060ff']];
    var items = [], LEG = 21;
    specs.forEach(function (s, i) {
      var l = ledBody(THREE, K, s[1], s[2], LEG);
      var p = K.part(parts, s[0] + ' LED', 'A light emitting diode. Click it to turn it on. In a circuit it needs a resistor, or it burns out.');
      p.noPaint = true;
      K.tag(p, l.group); K.tag(legsPart, l.legs); K.tag(p, l.shell);
      var u = new THREE.Group(); u.add(l.group); u.add(l.legs); l.group.position.y = 0; u.position.set((i - 1.5) * 13, LEG, 0);
      var light = new THREE.PointLight(new THREE.Color(s[2]), 0, 60); light.position.set(0, 4, 0); u.add(light);
      var glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTexture(), color: new THREE.Color(s[2]), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      glowSprite.position.set(0, 4.2, 0); u.add(glowSprite);
      g.add(u);
      items.push({ part: p, shell: l.shell, light: light, glow: glowSprite, on: false, level: 0 });
    });
    var model = K.finish(g, parts, { hint: H.led, pitch: 0.32, yaw: -0.5, zoom: 1.05 });
    model.onClick = function (p) { var hit = false; items.forEach(function (it) { if (it.part === p) { it.on = !it.on; hit = true; } }); if (!hit && !p) items.forEach(function (it) { it.on = !it.on; }); };
    model.update = function (t, dt) {
      items.forEach(function (it, i) {
        it.level += ((it.on ? 1 : 0) - it.level) * Math.min(1, dt * 9);
        var mt = it.shell.material;
        mt.emissiveIntensity = it.level * 1.5; mt.opacity = 0.72 + it.level * 0.28;
        it.light.intensity = it.level * 1.3;
        it.glow.material.opacity = it.level * 0.85;
        it.glow.scale.setScalar(20 + it.level * 9 + Math.sin(t * 6 + i) * it.level * 0.8);
      });
    };
    return model;
  };

  /* ===================== Resistors ===================== */
  B.resistor = function (THREE, K) {
    var g = new THREE.Group(), parts = [];
    var code = { red: '#c4201e', brown: '#6b3a1a', black: '#141416', orange: '#e8761b', gold: '#cda62b' };
    var list = [['220 ohms', ['red', 'red', 'brown', 'gold'], 'red, red, brown'], ['1 kilohm', ['brown', 'black', 'red', 'gold'], 'brown, black, red'], ['10 kilohms', ['brown', 'black', 'orange', 'gold'], 'brown, black, orange']];
    list.forEach(function (r, i) {
      var p = K.part(parts, 'Resistor, ' + r[0], 'Limits the current so parts like LEDs are not damaged. The bands are a color code: ' + r[2] + ' and a gold tolerance band make ' + r[0] + '.');
      var res = new THREE.Group();
      var body = K.lathe([[0, -3.2], [1.1, -3.2], [1.22, -2.75], [0.98, -2.25], [0.98, 2.25], [1.22, 2.75], [1.1, 3.2], [0, 3.2]], K.mat('#d8b98a', { roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5 }), 36);
      res.add(body);
      [-1.85, -0.95, 0, 1.95].forEach(function (y, bi) {
        var ring = K.mesh(new THREE.CylinderGeometry(0.995, 0.995, bi === 3 ? 0.4 : 0.5, 28, 1, true), K.mat(code[r[1][bi]], { roughness: 0.4 }));
        ring.position.y = y; res.add(ring);
      });
      var lead = K.mat('#c3c7cd', { metalness: 1, roughness: 0.32 });
      [-1, 1].forEach(function (s) {
        var l = K.cyl(0.27, 0.27, 17, lead, 12); l.position.y = s > 0 ? 3.1 : -3.1 - 17; res.add(l);
      });
      res.rotation.z = Math.PI / 2; res.position.set(0, 1.25, (i - 1) * 7.5);
      K.tag(p, res); g.add(res);
    });
    return K.finish(g, parts, { hint: H.resistor, pitch: 0.7, yaw: -0.6, zoom: 1.0 });
  };

  /* ===================== Micro servo ===================== */
  B.servo = function (THREE, K) {
    var g = new THREE.Group(), parts = [];
    var blue = K.mat('#1b63d4', { roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.3 });
    var pBody = K.part(parts, 'Servo motor', 'A small motor with gears and a sensor inside. It turns to the angle you tell it, then holds there.');
    var body = new THREE.Group();
    body.add(K.block(22.5, 21.5, 12.2, blue, 1.2, 0.7));
    var ears = K.block(32.4, 2.4, 12.2, blue, 1.2, 0.5); ears.position.y = 14.6; body.add(ears);
    [-14.1, 14.1].forEach(function (x) { var h = K.cyl(1.2, 1.2, 0.08, K.mat('#071a3f', { roughness: 0.7 }), 20); h.position.set(x, 17.02, 0); body.add(h); });
    var gear1 = K.cyl(5.6, 5.6, 3.4, blue, 40); gear1.position.set(-5.6, 21.2, 0); body.add(gear1);
    var gear2 = K.cyl(2.9, 2.9, 2.2, blue, 28); gear2.position.set(1.8, 21.2, 0); body.add(gear2);
    var shaft = K.cyl(2.3, 2.3, 3.2, K.mat('#e9ecf0', { roughness: 0.45 }), 28); shaft.position.set(-5.6, 24.6, 0); body.add(shaft);
    var labelTex = K.tex(512, 256, function (x, w, h) {
      x.fillStyle = '#f2f4f7'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#1c2230'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '700 78px Arial, sans-serif'; x.fillText('MICRO SERVO', w / 2, h * 0.36);
      x.font = '600 56px Arial, sans-serif'; x.fillText('9 g   4.8 V', w / 2, h * 0.7);
    });
    var lab = K.decal(15, 7.5, labelTex); lab.rotation.x = 0; lab.position.set(0, 9, 6.1 + 0.03); body.add(lab);
    K.tag(pBody, body); g.add(body);

    var pHorn = K.part(parts, 'Servo horn', 'The white arm that turns. Attach wheels, arms or levers here to make things move.');
    var horn = new THREE.Group();
    var white = K.plastic('#f3f5f8', 0.45);
    var boss = K.cyl(3.7, 3.7, 2.2, white, 36); horn.add(boss);
    var arm = K.block(24, 1.7, 4.6, white, 2.2, 0.5); arm.position.set(8, 0, 0); horn.add(arm);
    [3, 6.2, 9.4, 12.6, 15.8].forEach(function (x) { var h = K.cyl(0.55, 0.55, 0.1, K.mat('#3b4048', { roughness: 0.6 }), 12); h.position.set(x, 1.72, 0); horn.add(h); });
    var screw = K.cyl(1.1, 1.1, 0.7, K.steel(0.35), 16); screw.position.y = 2.2; horn.add(screw);
    horn.position.set(-5.6, 26.2, 0);
    K.tag(pHorn, horn); g.add(horn);

    var pWire = K.part(parts, 'Servo wires and connector', 'Three wires: brown is ground, red is power, and orange is the signal that tells the servo which angle to move to.');
    var colors = ['#6a3b1e', '#d52a2a', '#f08a1f'], z0 = [-1.7, 0, 1.7], z1 = [-2.54, 0, 2.54];
    colors.forEach(function (c, i) {
      var w = K.tube([new THREE.Vector3(11, 6, z0[i]), new THREE.Vector3(15, 4.5, z0[i] * 1.2), new THREE.Vector3(21, 1.6, z1[i] * 0.9), new THREE.Vector3(30, 0.7, z1[i]), new THREE.Vector3(40, 0.7, z1[i])], 0.62, K.plastic(c, 0.45), 40);
      K.tag(pWire, w); g.add(w);
    });
    var conn = K.block(3.0, 2.6, 8.2, K.black(0.45), 0.3, 0.3); conn.position.set(41.5, 0, 0); K.tag(pWire, conn); g.add(conn);

    var sweeping = false;
    var model = K.finish(g, parts, { hint: H.servo, pitch: 0.55, yaw: -0.6, zoom: 1.0 });
    model.onClick = function () { sweeping = !sweeping; };
    model.update = function (t) { if (sweeping) horn.rotation.y = Math.sin(t * 2.4) * (Math.PI / 2); };
    return model;
  };

  /* ===================== Breadboard ===================== */
  B.breadboard = function (THREE, K) {
    var g = new THREE.Group(), parts = [];
    var W = 82.6, D = 55, S = 24, T = 8.5;
    var cols = [], rowsA = [], rowsB = [], topRail = [3.8, 6.34], botRail = [48.66, 51.2];
    for (var i = 0; i < 30; i++) cols.push(4.47 + i * 2.54);
    for (var r = 0; r < 5; r++) { rowsA.push(13.9 + r * 2.54); rowsB.push(30.94 + r * 2.54); }
    var rail = []; for (var k = 0; k < 25; k++) rail.push(6.5 + k * 2.54 + Math.floor(k / 5) * 2.54);
    function drawTop(x, holes) {
      var w = W * S, h = D * S;
      x.fillStyle = holes ? '#808080' : '#f1f1ec'; x.fillRect(0, 0, w, h);
      function hole(px, pz) {
        var s = 0.95 * S;
        if (holes) { x.fillStyle = '#000'; x.fillRect(px * S - s / 2, pz * S - s / 2, s, s); }
        else { x.fillStyle = '#d9d9d2'; x.fillRect(px * S - s * 0.75, pz * S - s * 0.75, s * 1.5, s * 1.5); x.fillStyle = '#23262c'; x.fillRect(px * S - s / 2, pz * S - s / 2, s, s); }
      }
      cols.forEach(function (cx) { rowsA.concat(rowsB).forEach(function (cz) { hole(cx, cz); }); });
      rail.forEach(function (rx) { topRail.concat(botRail).forEach(function (rz) { hole(rx, rz); }); });
      if (holes) return;
      x.lineWidth = 0.28 * S;
      [[2.3, '#d6332f'], [8.0, '#2a62d6'], [47.0, '#2a62d6'], [52.7, '#d6332f']].forEach(function (l) { x.strokeStyle = l[1]; x.beginPath(); x.moveTo(5 * S, l[0] * S); x.lineTo(78 * S, l[0] * S); x.stroke(); });
      x.fillStyle = '#6b7280'; x.font = '600 ' + 1.5 * S + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      cols.forEach(function (cx, i) { if (i === 0 || (i + 1) % 5 === 0) x.fillText(String(i + 1), cx * S, 11.2 * S); });
      ['A', 'B', 'C', 'D', 'E'].forEach(function (t, i) { x.fillText(t, 1.6 * S, rowsA[4 - i] * S); });
      ['F', 'G', 'H', 'I', 'J'].forEach(function (t, i) { x.fillText(t, 1.6 * S, rowsB[i] * S); });
      x.fillStyle = '#d6332f'; x.fillText('+', 3.2 * S, topRail[0] * S);
      x.fillStyle = '#2a62d6'; x.fillText('−', 3.2 * S, topRail[1] * S);
      x.fillStyle = '#2a62d6'; x.fillText('−', 3.2 * S, botRail[0] * S);
      x.fillStyle = '#d6332f'; x.fillText('+', 3.2 * S, botRail[1] * S);
      x.fillStyle = '#e7e7e0'; x.fillRect(5 * S, 26.3 * S, 72 * S, 2.4 * S);
    }
    var map = K.tex(Math.round(W * S), Math.round(D * S), function (x) { drawTop(x, false); });
    var bump = K.tex(Math.round(W * S), Math.round(D * S), function (x) { drawTop(x, true); }, true);
    map.anisotropy = 16;
    var geo = K.rboxGeo(W, T, D, 1.2, 0.5); K.topUV(geo, W, D); geo.translate(0, T / 2, 0);
    var abs = K.plastic('#f1f1ec', 0.5);
    var board = K.mesh(geo, [new THREE.MeshPhysicalMaterial({ map: map, bumpMap: bump, bumpScale: 1.6, roughness: 0.48, clearcoat: 0.12, clearcoatRoughness: 0.5 }), abs]);
    var pBoard = K.part(parts, 'Solderless breadboard', 'Push parts and wires into the holes to build a circuit with no soldering. The five holes in each short column are connected underneath, and the long rails along the edges carry power and ground.');
    K.tag(pBoard, board); board.userData.solid = true; g.add(board);

    function holePos(x, z) { return new THREE.Vector3(x - W / 2, T, z - D / 2); }
    var pBuilt = K.part(parts, 'A circuit plugged in', 'An LED and two jumper wires, set into the holes to show how a circuit goes together.');
    var led = ledBody(THREE, K, '#ff2a2a', '#ff1a1a', 6);
    var lg = new THREE.Group(); lg.add(led.group); lg.add(led.legs); led.group.position.y = 5.5; led.legs.position.y = 5.5;
    lg.position.copy(holePos(cols[11] + 1.27, rowsA[2])); K.tag(pBuilt, lg); g.add(lg);
    function jumper(a, b, hex) {
      var mid = a.clone().lerp(b, 0.5); mid.y += 9;
      var w = K.tube([a.clone().setY(T + 0.5), a.clone().add(new THREE.Vector3(0, 5, 0)), mid, b.clone().add(new THREE.Vector3(0, 5, 0)), b.clone().setY(T + 0.5)], 0.7, K.plastic(hex, 0.45), 40);
      var pa = K.cyl(0.35, 0.35, 5, K.steel(0.3), 10); pa.position.copy(a).setY(T - 0.2);
      var pb = K.cyl(0.35, 0.35, 5, K.steel(0.3), 10); pb.position.copy(b).setY(T - 0.2);
      var grp = new THREE.Group(); grp.add(w); grp.add(pa); grp.add(pb); K.tag(pBuilt, grp); g.add(grp);
    }
    jumper(holePos(rail[4], topRail[0]), holePos(cols[11], rowsA[2]), '#d6332f');
    jumper(holePos(rail[5], topRail[1]), holePos(cols[12], rowsA[2]), '#1a1c20');
    return K.finish(g, parts, { hint: H.breadboard, pitch: 0.75, yaw: -0.45, zoom: 1.0 });
  };

  /* ===================== Joystick module ===================== */
  B.joystick = function (THREE, K) {
    var g = new THREE.Group(), parts = [];
    var W = 34, D = 26, T = 1.6, PX = 36;
    var tex = K.tex(W * PX, D * PX, function (x, w, h) {
      x.fillStyle = '#0f7a52'; x.fillRect(0, 0, w, h);
      var r = K.rng(21); x.strokeStyle = 'rgba(190,255,225,0.12)'; x.lineWidth = 0.3 * PX; x.lineCap = 'round';
      for (var i = 0; i < 34; i++) { var px = r() * w, py = r() * h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 8 * PX, py + (r() - 0.5) * 8 * PX); x.stroke(); }
      x.fillStyle = '#d6b45a';
      [[2.5, 2.5], [31.5, 2.5], [2.5, 23.5], [31.5, 23.5]].forEach(function (p) { x.beginPath(); x.arc(p[0] * PX, p[1] * PX, 1.7 * PX, 0, Math.PI * 2); x.fill(); });
      x.fillStyle = '#05140d'; [[2.5, 2.5], [31.5, 2.5], [2.5, 23.5], [31.5, 23.5]].forEach(function (p) { x.beginPath(); x.arc(p[0] * PX, p[1] * PX, 1.05 * PX, 0, Math.PI * 2); x.fill(); });
      for (var k = 0; k < 5; k++) { x.fillStyle = '#d6b45a'; x.beginPath(); x.arc(30.2 * PX, (6.6 + k * 2.54) * PX, 0.95 * PX, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = '#ffffff'; x.font = '700 ' + 1.2 * PX + 'px Arial, sans-serif'; x.textAlign = 'right'; x.textBaseline = 'middle';
      ['GND', '+5V', 'VRx', 'VRy', 'SW'].forEach(function (t, k) { x.fillText(t, 28.6 * PX, (6.6 + k * 2.54) * PX); });
      x.textAlign = 'left'; x.font = '700 ' + 1.5 * PX + 'px Arial, sans-serif'; x.fillText('JOYSTICK', 2.2 * PX, 12.5 * PX);
    });
    var geo = K.rboxGeo(W, T, D, 1.2, 0.15); K.topUV(geo, W, D); geo.translate(0, T / 2, 0);
    var pcb = K.mesh(geo, [new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.3 }), K.mat('#a8975e', { roughness: 0.8 })]);
    pcb.userData.solid = true; g.add(pcb);

    var pBase = K.part(parts, 'Joystick base', 'Two small potentiometers sit under the stick. One reads left and right, the other reads up and down.');
    var base = new THREE.Group();
    base.add(K.block(16.4, 3.6, 16.4, K.black(0.5), 1.2, 0.5));
    var pot1 = K.block(5.2, 5.6, 10.5, K.mat('#2d6cc2', { roughness: 0.4, clearcoat: 0.4 }), 0.4, 0.3); pot1.position.set(-10.2, 0, 0); base.add(pot1);
    var pot2 = K.block(10.5, 5.6, 5.2, K.mat('#2d6cc2', { roughness: 0.4, clearcoat: 0.4 }), 0.4, 0.3); pot2.position.set(0, 0, 10.2); base.add(pot2);
    var frame = K.block(15.2, 0.5, 15.2, K.steel(0.3), 0.8, 0.2); frame.position.y = 3.6; base.add(frame);
    base.position.set(-5, T, -0.6); K.tag(pBase, base); g.add(base);

    var pStick = K.part(parts, 'Thumb stick', 'Push it in any direction and the board reads how far. Press straight down and it also works as a button.');
    var stick = new THREE.Group();
    stick.add(K.cyl(2.6, 2.6, 6.5, K.black(0.4), 24));
    var cap = K.lathe([[0, 6.2], [3.2, 6.2], [7.6, 6.8], [8.3, 8.2], [7.5, 9.4], [5, 9.2], [2.6, 8.6], [0, 8.4]], K.mat('#15161a', { roughness: 0.5, clearcoat: 0.25 }), 44);
    stick.add(cap);
    stick.position.set(-5, T + 4.1, -0.6); K.tag(pStick, stick); g.add(stick);

    var pPins = K.part(parts, '5-pin header', 'Five pins connect the module to an Arduino: ground, 5 volts, two analog readings (VRx and VRy) and the button (SW).');
    var hd = new THREE.Group();
    hd.add(K.block(2.54, 2.4, 12.7, K.black(0.5), 0.2, 0.2));
    for (var i = 0; i < 5; i++) { var pin = bx(K, THREE, 0.64, 11, 0.64, K.gold()); pin.position.set(0, -2.6, (i - 2) * 2.54); hd.add(pin); }
    hd.position.set(W / 2 - 3.8, T, 0.7 - 0.0); K.tag(pPins, hd); g.add(hd);

    var wobble = false, tx = 0, tz = 0;
    var model = K.finish(g, parts, { hint: H.joystick, pitch: 0.7, yaw: -0.5, zoom: 1.0 });
    model.onClick = function () { wobble = !wobble; };
    model.update = function (t, dt) {
      var gx = wobble ? Math.sin(t * 2.2) * 0.38 : 0, gz = wobble ? Math.cos(t * 2.2) * 0.38 : 0;
      tx += (gx - tx) * Math.min(1, dt * 8); tz += (gz - tz) * Math.min(1, dt * 8);
      stick.rotation.x = tx; stick.rotation.z = tz;
    };
    return model;
  };

  /* ===================== Push button ===================== */
  B.button = function (THREE, K) {
    var g = new THREE.Group(), parts = [];
    var pBody = K.part(parts, 'Switch body', 'A momentary switch. It connects the circuit only while you hold it down, then springs back.');
    var body = new THREE.Group();
    body.add(K.block(12, 4.3, 12, K.black(0.45), 0.8, 0.5));
    var plate = K.block(11.4, 0.5, 11.4, K.steel(0.3), 0.9, 0.2); plate.position.y = 4.3; body.add(plate);
    [[-4.4, -4.4], [4.4, -4.4], [-4.4, 4.4], [4.4, 4.4]].forEach(function (p) { var r = K.cyl(0.65, 0.65, 0.2, K.steel(0.25), 14); r.position.set(p[0], 4.8, p[1]); body.add(r); });
    K.tag(pBody, body); g.add(body);
    var pLegs = K.part(parts, 'Legs', 'Four metal legs go into the breadboard. Opposite pairs are joined inside until the button is pressed.');
    [[-6.2, -4], [-6.2, 4], [6.2, -4], [6.2, 4]].forEach(function (p) {
      var leg = new THREE.Group();
      var top = bx(K, THREE, 1.4, 0.5, 1.6, K.tin()); top.position.set(p[0] > 0 ? -0.5 : 0.5, 2.0, 0); leg.add(top);
      var pin = bx(K, THREE, 0.7, 6.5, 0.7, K.tin()); pin.position.set(0, -4.5, 0); leg.add(pin);
      leg.position.set(p[0], 0, p[1]); K.tag(pLegs, leg); g.add(leg);
    });
    var pCap = K.part(parts, 'Button cap', 'The part your finger presses. Pushing it down closes the switch.');
    var cap = new THREE.Group();
    cap.add(K.cyl(2.3, 2.3, 4.2, K.black(0.4), 24));
    var top = K.lathe([[0, 4.2], [3.6, 4.2], [3.6, 6.4], [3.3, 6.9], [2.4, 7.2], [0, 7.2]], K.mat('#1f6fe0', { roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.15 }), 40);
    cap.add(top);
    cap.position.y = 4.3; K.tag(pCap, cap); g.add(cap);
    var press = 0, pressing = 0;
    var model = K.finish(g, parts, { hint: H.button, pitch: 0.6, yaw: -0.5, zoom: 1.0 });
    model.onClick = function () { pressing = 0.22; };
    model.update = function (t, dt) {
      if (pressing > 0) pressing -= dt;
      press += ((pressing > 0 ? 1.3 : 0) - press) * Math.min(1, dt * 22);
      cap.position.y = 4.3 - press;
    };
    return model;
  };

  /* ===================== Jumper wires ===================== */
  B.wires = function (THREE, K) {
    var g = new THREE.Group(), parts = [];
    var pM = K.part(parts, 'Male end', 'A metal pin sticks out. It plugs into a breadboard hole or a socket on the Arduino.');
    var pF = K.part(parts, 'Female end', 'A socket that slides over a pin. Use it to connect to modules that have pins sticking out.');
    var pW = K.part(parts, 'Wire', 'Flexible insulated wire. The colors do nothing electrically, but help you keep track of what goes where.');
    var cols = ['#d6332f', '#f08a1f', '#f2d024', '#2fbf4f', '#2a78ff', '#8a4fd6'];
    var kinds = [['m', 'm'], ['m', 'm'], ['m', 'f'], ['m', 'f'], ['f', 'f'], ['f', 'f']];
    function end(kind, dir) {
      var e = new THREE.Group();
      var house = K.block(12, 2.6, 2.6, K.black(0.45), 0.4, 0.3); e.add(house);
      if (kind === 'm') {
        var pin = K.block(6, 0.64, 0.64, K.tin(), 0.1, 0.05); pin.position.set(dir * 9, 1.3 - 0.32, 0); e.add(pin);
        K.tag(pM, e);
      } else {
        var hole = K.block(0.3, 1.5, 1.5, K.mat('#020203', { roughness: 0.9 }), 0.1, 0.05); hole.position.set(dir * 6.0, 0.55, 0); e.add(hole);
        var contact = K.block(0.15, 0.5, 0.5, K.gold(), 0.05, 0.02); contact.position.set(dir * 6.02, 1.05, 0); e.add(contact);
        K.tag(pF, e);
      }
      return e;
    }
    kinds.forEach(function (k, i) {
      var z = (i - 2.5) * 6.4, ph = i * 1.3;
      var pts = [];
      for (var s = 0; s <= 6; s++) { var x = -36 + s * 12; pts.push(new THREE.Vector3(x, 1.3, z + Math.sin(ph + s * 0.9) * (s > 0 && s < 6 ? 2.4 : 0))); }
      var w = K.tube(pts, 0.95, K.plastic(cols[i], 0.42), 60); K.tag(pW, w); g.add(w);
      var a = end(k[0], -1); a.position.set(-36 - 6, 0, z); g.add(a);
      var b = end(k[1], 1); b.position.set(36 + 6, 0, z); g.add(b);
    });
    return K.finish(g, parts, { hint: H.wires, pitch: 0.75, yaw: -0.5, zoom: 1.0 });
  };
})();
