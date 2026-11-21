/* 3D models for the Click Circuits viewer: Arduino Uno and Bluetooth module.
 * Needs viewer-kit.js. Dimensions are taken from the real boards, in millimetres. */
(function () {
  'use strict';
  var CCM = window.CCM = window.CCM || { build: {}, labels: {}, hints: {}, order: [] };
  CCM.labels.arduino = 'Arduino board';
  CCM.hints.arduino = 'Drag to rotate. Hover over a part to see what it does.';
  CCM.labels.bluetooth = 'Bluetooth module';
  CCM.hints.bluetooth = 'Drag to rotate. Hover over a part to see what it does.';

  /* ===================== Arduino Uno R3 ===================== */
  CCM.build.arduino = function (THREE, K) {
    var g = new THREE.Group();
    var parts = [];
    var W = 68.6, D = 53.4, TOP = 0.8, OX = W / 2, OZ = D / 2;

    function at(o, x, yTop, lift) { o.position.set(x - OX, TOP + (lift || 0), yTop - OZ); g.add(o); return o; }
    function bx(w, h, d, m) { var geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2, 0); return K.mesh(geo, m); }

    /* --- circuit board with real outline, mounting holes, traces and silkscreen --- */
    var outline = [[0, 0], [64.8, 0], [68.6, 3.8], [68.6, 50.8], [65.9, 53.4], [0, 53.4]];
    var shape = new THREE.Shape();
    outline.forEach(function (p, i) { var x = p[0] - OX, y = OZ - p[1]; if (i) shape.lineTo(x, y); else shape.moveTo(x, y); });
    [[14.0, 50.9], [15.3, 2.7], [66.1, 17.9], [66.1, 45.8]].forEach(function (h) {
      var hole = new THREE.Path(); hole.absarc(h[0] - OX, OZ - h[1], 1.6, 0, Math.PI * 2, true); shape.holes.push(hole);
    });
    var pcbGeo = new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: false, curveSegments: 24 });
    pcbGeo.rotateX(-Math.PI / 2);
    pcbGeo.translate(0, -0.8, 0);
    (function () {
      var p = pcbGeo.attributes.position, uv = pcbGeo.attributes.uv;
      for (var i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + OX) / W, 1 - (p.getZ(i) + OZ) / D);
    })();

    var CW = 2048, CH = Math.round(CW * D / W), S = CW / W;
    function drawBoard(x, st) {
      x.fillStyle = st.base; x.fillRect(0, 0, CW, CH);
      var r = K.rng(11);
      x.strokeStyle = st.trace; x.lineWidth = 0.3 * S; x.lineCap = 'round'; x.lineJoin = 'round';
      for (var i = 0; i < 70; i++) {
        var px = (6 + r() * 56) * S, py = (4 + r() * 44) * S;
        x.beginPath(); x.moveTo(px, py);
        var n = 2 + Math.floor(r() * 3);
        for (var k = 0; k < n; k++) {
          var dir = Math.floor(r() * 8) * Math.PI / 4, len = (2.5 + r() * 9) * S;
          px += Math.cos(dir) * len; py += Math.sin(dir) * len; x.lineTo(px, py);
        }
        x.stroke();
      }
      // power and ground pours near the edges
      x.fillStyle = st.trace;
      x.fillRect(2 * S, 4 * S, 1.2 * S, 40 * S);
      x.fillRect(0, 49.6 * S, 66 * S, 0.9 * S);
      // vias
      for (var v = 0; v < 160; v++) {
        var vx = (4 + r() * 60) * S, vy = (4 + r() * 45) * S;
        x.fillStyle = st.via; x.beginPath(); x.arc(vx, vy, 0.42 * S, 0, Math.PI * 2); x.fill();
        x.fillStyle = st.hole; x.beginPath(); x.arc(vx, vy, 0.17 * S, 0, Math.PI * 2); x.fill();
      }
      // exposed pads around the mounting holes
      [[14.0, 50.9], [15.3, 2.7], [66.1, 17.9], [66.1, 45.8]].forEach(function (h) {
        x.fillStyle = st.pad; x.beginPath(); x.arc(h[0] * S, h[1] * S, 3.4 * S, 0, Math.PI * 2); x.fill();
      });
      // header pads
      x.fillStyle = st.pad;
      function pads(n, x0, y0) { for (var i = 0; i < n; i++) { x.beginPath(); x.arc((x0 + 1.27 + i * 2.54) * S, y0 * S, 0.95 * S, 0, Math.PI * 2); x.fill(); } }
      pads(10, 16.7, 1.9); pads(8, 45.0, 1.9); pads(8, 25.7, 51.0); pads(6, 50.1, 51.0);
      // silkscreen
      x.fillStyle = st.silk; x.strokeStyle = st.silk; x.textAlign = 'center'; x.textBaseline = 'middle';
      function T(txt, mx, my, size, weight) { x.font = (weight || '700') + ' ' + size + 'px Arial, Helvetica, sans-serif'; x.fillText(txt, mx * S, my * S); }
      ['SCL', 'SDA', 'AREF', 'GND', '13', '12', '~11', '~10', '~9', '8'].forEach(function (t, i) { T(t, 16.7 + 1.27 + i * 2.54, 5.4, t.length > 3 ? 26 : 34); });
      ['7', '~6', '~5', '4', '~3', '2', '1', '0'].forEach(function (t, i) { T(t, 45.0 + 1.27 + i * 2.54, 5.4, 34); });
      T('DIGITAL (PWM~)', 36.8, 9.2, 38);
      x.fillRect(26 * S, 10.5 * S, 22 * S, 0.35 * S);
      ['', 'IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'Vin'].forEach(function (t, i) { if (t) T(t, 25.7 + 1.27 + i * 2.54, 47.3, 24); });
      ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].forEach(function (t, i) { T(t, 50.1 + 1.27 + i * 2.54, 47.3, 32); });
      T('POWER', 43.6, 44.6, 36); T('ANALOG IN', 56.2, 44.6, 36);
      x.fillRect(38 * S, 45.9 * S, 11 * S, 0.35 * S); x.fillRect(50 * S, 45.9 * S, 15 * S, 0.35 * S);
      x.lineWidth = 0.95 * S;
      x.beginPath(); x.arc(35.4 * S, 14.6 * S, 3.2 * S, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.arc(41.9 * S, 14.6 * S, 3.2 * S, 0, Math.PI * 2); x.stroke();
      x.lineWidth = 0.7 * S;
      x.beginPath(); x.moveTo(33.6 * S, 14.6 * S); x.lineTo(37.2 * S, 14.6 * S); x.stroke();
      x.beginPath(); x.moveTo(40.1 * S, 14.6 * S); x.lineTo(43.7 * S, 14.6 * S); x.moveTo(41.9 * S, 12.8 * S); x.lineTo(41.9 * S, 16.4 * S); x.stroke();
      T('ARDUINO', 38.7, 19.8, 72);
      x.lineWidth = 0.3 * S; x.strokeRect(31.7 * S, 22.6 * S, 13.5 * S, 3.6 * S);
      T('UNO R3', 38.4, 24.4, 50); T('ARDUINO.CC', 53.2, 29, 28, '600');
      T('ICSP', 64.2, 20.2, 28, '600'); T('ON', 61.9, 16.4, 28, '600');
      T('L', 24.8, 10.8, 28, '600'); T('TX', 24.6, 16.4, 26, '600'); T('RX', 24.6, 18.8, 26, '600');
    }
    var colorTex = K.tex(CW, CH, function (x) { drawBoard(x, { base: '#0b8892', trace: 'rgba(150,240,240,0.12)', via: '#d9b24a', hole: '#06444a', pad: '#cdd1d4', silk: '#f4f8f7' }); });
    var ormTex = K.tex(CW, CH, function (x) { drawBoard(x, { base: 'rgb(0,112,0)', trace: 'rgba(0,128,0,0.6)', via: 'rgb(0,60,255)', hole: 'rgb(0,200,0)', pad: 'rgb(0,60,255)', silk: 'rgb(0,175,0)' }); }, true);
    colorTex.anisotropy = 16;
    var maskMat = new THREE.MeshPhysicalMaterial({ map: colorTex, roughnessMap: ormTex, metalnessMap: ormTex, roughness: 1, metalness: 1, clearcoat: 0.55, clearcoatRoughness: 0.28 });
    var pcb = K.mesh(pcbGeo, [maskMat, K.mat('#9b8b55', { roughness: 0.8 })]);
    pcb.userData.solid = true;
    g.add(pcb);

    /* --- female header sockets --- */
    function headerTex(n) {
      return K.tex(64 * n, 64, function (x, w, h) {
        x.fillStyle = '#17181b'; x.fillRect(0, 0, w, h);
        for (var i = 0; i < n; i++) {
          var o = i * 64;
          x.fillStyle = '#2b2d31'; x.fillRect(o + 10, 10, 44, 44);
          x.fillStyle = '#020203'; x.fillRect(o + 19, 19, 26, 26);
          x.strokeStyle = '#9a8340'; x.lineWidth = 2; x.strokeRect(o + 17, 17, 30, 30);
        }
      });
    }
    function header(part, n, x0, yTop) {
      var w = n * 2.54, d = 2.54;
      var geo = K.rboxGeo(w, 8.5, d, 0.15, 0.2); K.topUV(geo, w, d); geo.translate(0, 4.25, 0);
      var body = K.mesh(geo, [new THREE.MeshPhysicalMaterial({ map: headerTex(n), roughness: 0.5, clearcoat: 0.2 }), K.black(0.5)]);
      K.tag(part, body);
      at(body, x0 + w / 2, yTop, 0);
    }
    var pDigital = K.part(parts, 'Digital pins 0 to 13', 'Connect LEDs, buttons, servos and sensors. Pins marked with a ~ can also fake an analog level with PWM.');
    header(pDigital, 10, 16.7, 1.9); header(pDigital, 8, 45.0, 1.9);
    var pPower = K.part(parts, 'Power pins', 'Supply 5 V, 3.3 V and ground to the parts you wire up, and take in power on Vin.');
    header(pPower, 8, 25.7, 51.0);
    var pAnalog = K.part(parts, 'Analog pins A0 to A5', 'Read changing voltages from sensors, like the two axes of a joystick.');
    header(pAnalog, 6, 50.1, 51.0);

    /* --- USB-B connector --- */
    var pUsb = K.part(parts, 'USB-B port', 'Plugs into a computer. It powers the board and carries the code you upload.');
    var usb = new THREE.Group();
    usb.add(K.block(16.5, 10.8, 12.2, K.steel(0.3), 0.6, 0.4));
    var usbMouth = K.block(0.5, 7.4, 9.4, K.mat('#040507', { roughness: 0.8 }), 0.4, 0.1); usbMouth.position.set(-8.25 + 0.05, 1.7, 0); usb.add(usbMouth);
    var usbTongue = K.block(0.5, 1.4, 7.4, K.plastic('#d5d8dc', 0.5), 0.1, 0.05); usbTongue.position.set(-8.25 + 0.3, 4.4, 0); usb.add(usbTongue);
    var usbRim = K.block(0.9, 0.5, 10.6, K.steel(0.2), 0.2, 0.1); usbRim.position.set(-8.25 + 0.05, 9.6, 0); usb.add(usbRim);
    K.tag(pUsb, usb); at(usb, 1.75, 14.5, 0);

    /* --- DC power jack --- */
    var pJack = K.part(parts, 'Power jack', 'Takes a 7 to 12 volt power supply when the board is not plugged into a computer.');
    var jack = new THREE.Group();
    jack.add(K.block(14.9, 10.6, 9.2, K.black(0.5), 0.6, 0.4));
    var jackFace = K.cyl(3.4, 3.4, 0.5, K.mat('#030304', { roughness: 0.9 }), 28); jackFace.rotation.z = Math.PI / 2; jackFace.position.set(-7.45 + 0.1, 5.3, 0); jack.add(jackFace);
    var jackRing = K.mesh(new THREE.TorusGeometry(3.4, 0.28, 10, 32), K.steel(0.3)); jackRing.rotation.y = Math.PI / 2; jackRing.position.set(-7.45 - 0.1, 5.3, 0); jack.add(jackRing);
    var jackPin = K.cyl(0.55, 0.55, 5, K.steel(0.25), 14); jackPin.rotation.z = -Math.PI / 2; jackPin.position.set(-7.45 - 0.3, 5.3, 0); jack.add(jackPin);
    K.tag(pJack, jack); at(jack, 4.35, 44.8, 0);

    /* --- ATmega328P in its socket --- */
    var pChip = K.part(parts, 'ATmega328P microcontroller', 'The brain of the board. It runs the program you upload and reads and controls every pin.');
    var socket = K.block(35.6, 4.4, 9.6, K.mat('#1c1d21', { roughness: 0.55, clearcoat: 0.2 }), 0.3, 0.3);
    K.tag(pChip, socket); at(socket, 46.2, 36.9, 0);
    var chipTop = K.tex(1024, 256, function (x, w, h) {
      x.fillStyle = '#1a1b1e'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#2a2c31'; x.beginPath(); x.arc(70, 128, 44, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#050506'; x.beginPath(); x.arc(70, 128, 30, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#b4b9c0'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '700 40px Arial, sans-serif'; x.fillText('ATMEL', 540, 70);
      x.font = '600 36px Arial, sans-serif'; x.fillText('ATMEGA328P-PU', 540, 128);
      x.font = '500 28px Arial, sans-serif'; x.fillText('1528   JAPAN', 540, 186);
    });
    var chipGeo = K.rboxGeo(34.6, 3.4, 7.5, 0.4, 0.3); K.topUV(chipGeo, 34.6, 7.5); chipGeo.translate(0, 1.7, 0);
    var chip = K.mesh(chipGeo, [new THREE.MeshPhysicalMaterial({ map: chipTop, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4 }), K.mat('#131417', { roughness: 0.55 })]);
    K.tag(pChip, chip); at(chip, 46.2, 36.9, 4.2);
    for (var li = 0; li < 14; li++) [-1, 1].forEach(function (s) {
      var leg = bx(0.5, 3.4, 0.28, K.tin());
      K.tag(pChip, leg);
      at(leg, 46.2 - 16.5 + li * 2.54, 36.9 + s * 4.1, 1.0);
    });

    /* --- smaller chips and parts --- */
    var pUsbChip = K.part(parts, 'ATmega16U2', 'A second small chip that lets the board talk to a computer over USB.');
    var u2 = K.block(7, 1.0, 7, K.mat('#17181b', { roughness: 0.5, clearcoat: 0.3 }), 0.4, 0.25); K.tag(pUsbChip, u2); at(u2, 19.7, 18.4, 0);
    var dot = K.cyl(0.4, 0.4, 0.05, K.mat('#3a3d42'), 12); dot.position.set(-2.2, 1.0, -2.2); u2.add(dot);

    var pReg = K.part(parts, 'Voltage regulator', 'Turns the power jack input into a steady 5 volts for the chip and your parts.');
    var reg = new THREE.Group();
    reg.add(K.block(3.6, 1.7, 6.6, K.black(0.5), 0.3, 0.2));
    var tab = bx(1.6, 0.4, 3.2, K.tin()); tab.position.set(-2.4, 0.2, 0); reg.add(tab);
    for (var rl = -1; rl <= 1; rl++) { var lg = bx(1.0, 0.3, 0.7, K.tin()); lg.position.set(2.5, 0.0, rl * 2.3); reg.add(lg); }
    K.tag(pReg, reg); at(reg, 7.4, 35.6, 0);

    var pXtal = K.part(parts, '16 MHz crystal', 'Ticks 16 million times a second so the chip keeps steady time.');
    var xtal = new THREE.Group();
    xtal.add(K.block(11.4, 3.7, 4.6, K.steel(0.3), 2.0, 0.7));
    var xlid = K.block(8.8, 0.15, 3.2, K.mat('#9aa0a8', { metalness: 1, roughness: 0.5 }), 1.4, 0.05); xlid.position.y = 3.7; xtal.add(xlid);
    K.tag(pXtal, xtal); at(xtal, 18.6, 27.0, 0);

    var pReset = K.part(parts, 'Reset button', 'Restarts the program on the board, like turning it off and on again.');
    var rst = new THREE.Group();
    rst.add(K.block(6.2, 3.0, 6.2, K.steel(0.32), 0.3, 0.3));
    var rcap = K.cyl(1.75, 1.75, 1.5, K.black(0.35), 24); rcap.position.y = 3.0; rst.add(rcap);
    K.tag(pReset, rst); at(rst, 5.9, 3.4, 0);

    /* --- electrolytic capacitors --- */
    var pCap = K.part(parts, 'Capacitors', 'Smooth out the power supply so the chip gets clean, steady voltage.');
    var capTop = K.tex(256, 256, function (x, w, h) {
      x.fillStyle = '#c9ced5'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#7b8189'; x.lineWidth = 5; x.beginPath(); x.moveTo(w * 0.28, h * 0.28); x.lineTo(w * 0.72, h * 0.72); x.moveTo(w * 0.72, h * 0.28); x.lineTo(w * 0.28, h * 0.72); x.stroke();
      x.fillStyle = '#23262c'; x.beginPath(); x.arc(w / 2, h / 2, w / 2, -Math.PI / 2 - 0.8, -Math.PI / 2 + 0.8); x.lineTo(w / 2, h / 2); x.fill();
    });
    [18.1, 25.1].forEach(function (cx) {
      var cg = new THREE.Group();
      var can = K.lathe([[0, 0], [3.0, 0], [3.2, 0.3], [3.2, 5.2], [3.0, 5.5], [0, 5.5]], K.mat('#b2b7bf', { metalness: 1, roughness: 0.32 }), 40);
      cg.add(can);
      var topDisc = K.mesh(new THREE.CircleGeometry(2.85, 40), new THREE.MeshPhysicalMaterial({ map: capTop, roughness: 0.4, metalness: 0.4, clearcoat: 0.2 }));
      topDisc.rotation.x = -Math.PI / 2; topDisc.position.y = 5.52; cg.add(topDisc);
      var stripe = K.mesh(new THREE.CylinderGeometry(3.21, 3.21, 5.0, 24, 1, true, 0.15, 1.0), K.black(0.5)); stripe.position.y = 2.75; cg.add(stripe);
      K.tag(pCap, cg); at(cg, cx, 44.3, 0);
    });

    /* --- ICSP headers --- */
    var pIcsp = K.part(parts, 'ICSP header', 'Lets you program the chip directly with an external programmer.');
    function icsp(x, yTop, cols, rows) {
      var grp = new THREE.Group();
      grp.add(K.block(cols * 2.54, 2.5, rows * 2.54, K.black(0.5), 0.2, 0.2));
      for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
        var pin = bx(0.64, 8.2, 0.64, K.gold());
        pin.position.set(-(cols - 1) * 1.27 + i * 2.54, 0.4, -(rows - 1) * 1.27 + j * 2.54);
        grp.add(pin);
      }
      K.tag(pIcsp, grp); at(grp, x, yTop, 0);
    }
    icsp(65.2, 25.9, 2, 3); icsp(18.2, 7.0, 3, 2);

    /* --- status LEDs --- */
    function smdLed(part, x, yTop, hex, glow) {
      var m = K.block(2.2, 0.8, 1.3, K.mat(hex, { roughness: 0.3, emissive: K.color(glow), emissiveIntensity: 0.9, clearcoat: 0.8 }), 0.2, 0.15);
      K.tag(part, m); at(m, x, yTop, 0);
    }
    smdLed(K.part(parts, 'Built-in LED (pin 13)', 'A tiny light wired to pin 13. The very first blink program makes it flash.'), 27.6, 10.8, '#f6e9a0', '#ffb81c');
    var pTxrx = K.part(parts, 'TX and RX lights', 'Flash when data is sent or received over USB while you upload code.');
    smdLed(pTxrx, 27.6, 16.4, '#f6e9a0', '#ffb81c'); smdLed(pTxrx, 27.6, 18.8, '#f6e9a0', '#ffb81c');
    smdLed(K.part(parts, 'Power light', 'Glows whenever the board has power.'), 58.1, 16.4, '#c6f5c4', '#2ee06a');

    /* --- surface-mount resistors and capacitors --- */
    var smdPts = [[8.5, 13], [8.5, 17], [12.5, 13.5], [13, 21], [22.5, 22], [24.5, 22], [28.5, 24.5], [36, 27], [42, 33], [32, 21], [38, 12], [30, 37], [10, 41], [33.5, 42], [46, 24.5], [52.5, 33], [56, 38], [12.5, 30], [15, 40], [60, 8], [22, 14], [29, 31], [40, 44], [55, 24]];
    smdPts.forEach(function (p, i) {
      var cap = i % 3 === 0;
      var grp = new THREE.Group();
      grp.add(bx(1.6, 0.5, 1.0, cap ? K.mat('#b69a6c', { roughness: 0.6 }) : K.mat('#18191c', { roughness: 0.5 })));
      [-0.65, 0.65].forEach(function (dx) { var e = bx(0.34, 0.54, 1.04, K.tin()); e.position.x = dx; grp.add(e); });
      grp.rotation.y = (i % 2) * Math.PI / 2;
      at(grp, p[0], p[1], 0);
    });

    return K.finish(g, parts, { hint: CCM.hints.arduino, pitch: 0.95, yaw: -0.5 });
  };

  /* ===================== Bluetooth module ===================== */
  CCM.build.bluetooth = function (THREE, K) {
    var g = new THREE.Group();
    var parts = [];
    var CWm = 37.0, CD = 16.0, T = 1.6;
    function bx(w, h, d, m) { var geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2, 0); return K.mesh(geo, m); }

    // carrier board
    var PX = 44;
    var carrierTex = K.tex(Math.round(CWm * PX), Math.round(CD * PX), function (x, w, h) {
      x.fillStyle = '#1d56ad'; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,0.06)';
      var r = K.rng(5);
      for (var i = 0; i < 28; i++) { x.fillRect(r() * w, r() * h, (3 + r() * 14) * 2, 1.2 * 2); }
      x.fillStyle = '#d6b45a';
      for (var p = 0; p < 6; p++) { x.beginPath(); x.arc(2.4 * PX, (1.9 + p * 2.54) * PX + 0.2 * PX, 0.95 * PX, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = '#ffffff'; x.font = '700 ' + (1.15 * PX) + 'px Arial, sans-serif'; x.textAlign = 'left'; x.textBaseline = 'middle';
      ['STATE', 'RXD', 'TXD', 'GND', 'VCC', 'EN'].forEach(function (t, i) { x.fillText(t, 4.2 * PX, (1.9 + i * 2.54) * PX + 0.2 * PX); });
      x.font = '700 ' + (1.6 * PX) + 'px Arial, sans-serif'; x.textAlign = 'center';
      x.fillText('BLUETOOTH', 25.5 * PX, 14.3 * PX);
    });
    var carrierGeo = K.rboxGeo(CWm, T, CD, 0.8, 0.12); K.topUV(carrierGeo, CWm, CD); carrierGeo.translate(0, T / 2, 0);
    var carrier = K.mesh(carrierGeo, [new THREE.MeshPhysicalMaterial({ map: carrierTex, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }), K.mat('#a8975e', { roughness: 0.8 })]);
    carrier.userData.solid = true;
    g.add(carrier);

    // module board with metal shield and printed antenna
    var pShield = K.part(parts, 'Bluetooth chip under a metal shield', 'The radio. It sends and receives data wirelessly so a phone or computer can talk to your board.');
    var modGeo = K.rboxGeo(27, 1.2, 13, 0.5, 0.1); modGeo.translate(0, 0.6, 0);
    var mod = K.mesh(modGeo, K.mat('#0d3b2a', { roughness: 0.45, clearcoat: 0.5 }));
    mod.position.set(4.2, T, 0); g.add(mod);
    var shieldTex = K.tex(512, 440, function (x, w, h) {
      x.fillStyle = '#c8ccd2'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(70,76,86,0.35)'; x.lineWidth = 2;
      for (var i = -h; i < w; i += 6) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); }
      x.fillStyle = '#2a2d33'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '700 62px Arial, sans-serif'; x.fillText('BLUETOOTH', w / 2, h * 0.4);
      x.font = '600 46px Arial, sans-serif'; x.fillText('2.4 GHZ', w / 2, h * 0.62);
    });
    var shGeo = K.rboxGeo(13.6, 2.4, 11.6, 0.5, 0.35); K.topUV(shGeo, 13.6, 11.6); shGeo.translate(0, 1.2, 0);
    var shield = K.mesh(shGeo, [new THREE.MeshPhysicalMaterial({ map: shieldTex, metalness: 0.9, roughness: 0.32 }), K.steel(0.3)]);
    K.tag(pShield, shield); shield.position.set(-1.2, T + 1.2, 0); g.add(shield);
    var pAnt = K.part(parts, 'Printed antenna', 'The zigzag copper trace is the antenna. It needs open space around it to get a good signal.');
    var antTex = K.tex(260, 520, function (x, w, h) {
      x.fillStyle = '#0d3b2a'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#d6b45a'; x.lineWidth = 14; x.lineJoin = 'miter';
      x.beginPath(); x.moveTo(30, h - 20); x.lineTo(30, 60);
      for (var i = 0; i < 4; i++) { x.lineTo(60 + i * 56, 60); x.lineTo(60 + i * 56, h - 120); x.lineTo(88 + i * 56, h - 120); x.lineTo(88 + i * 56, 60); }
      x.stroke();
    });
    var ant = K.decal(5.2, 13, antTex, { transparent: false, roughness: 0.4 });
    ant.rotation.z = Math.PI / 2; ant.position.set(4.2 + 10.5, T + 1.22, 0);
    K.tag(pAnt, ant); g.add(ant);

    // header
    var pHead = K.part(parts, '6-pin header', 'Five wires do the work: power, ground, and two data lines (TX and RX) to the Arduino.');
    var hd = new THREE.Group();
    hd.add(K.block(2.54, 2.4, 15.24, K.black(0.5), 0.2, 0.2));
    for (var i = 0; i < 6; i++) { var pin = bx(0.64, 11, 0.64, K.gold()); pin.position.set(0, -2.6, (i - 2.5) * 2.54); hd.add(pin); }
    K.tag(pHead, hd); hd.position.set(-CWm / 2 + 2.4, T, 0.2); g.add(hd);

    // status LED and button
    var pLed = K.part(parts, 'Status LED', 'Blinks fast while waiting to pair and slowly once it is connected.');
    var led = K.block(2.1, 0.8, 1.3, K.mat('#ff4a3a', { roughness: 0.3, emissive: K.color('#ff2a1a'), emissiveIntensity: 1.1, clearcoat: 0.8 }), 0.2, 0.15);
    K.tag(pLed, led); led.position.set(-8.6, T, -6.0); g.add(led);
    var pBtn = K.part(parts, 'Setup button', 'Hold it while powering on to change the module’s name and settings.');
    var btn = new THREE.Group();
    btn.add(K.block(3.6, 1.6, 3.6, K.steel(0.35), 0.2, 0.2));
    var bcap = K.cyl(0.95, 0.95, 0.7, K.black(0.4), 18); bcap.position.y = 1.6; btn.add(bcap);
    K.tag(pBtn, btn); btn.position.set(-8.6, T, 5.6); g.add(btn);

    // a few small parts
    [[-12.6, -5.8], [-12.6, -3.8], [-8.6, -1.5], [-9.2, 1.6], [-5, 6.2]].forEach(function (p, i) {
      var s = bx(1.6, 0.5, 1.0, i % 2 ? K.mat('#b69a6c', { roughness: 0.6 }) : K.mat('#18191c', { roughness: 0.5 }));
      s.position.set(p[0], T, p[1]); g.add(s);
    });

    return K.finish(g, parts, { hint: CCM.hints.bluetooth, pitch: 0.8, yaw: -0.55, zoom: 1.05 });
  };
})();
