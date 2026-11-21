/* Shared toolkit for the Click Circuits 3D parts viewer.
 *
 * Physically based materials, beveled solids, a studio environment for realistic
 * reflections, and helpers for naming parts. The models live in
 * viewer-arduino.js and viewer-parts.js. Units are millimetres.
 */
(function () {
  'use strict';
  var CCM = window.CCM = window.CCM || { build: {}, labels: {}, hints: {}, order: [] };

  CCM.kit = function (THREE) {
    var K = {};
    var sRGB = THREE.sRGBEncoding;

    /* ---------- materials ---------- */
    K.color = function (hex) { return new THREE.Color(hex).convertSRGBToLinear(); };
    K.mat = function (hex, o) {
      var m = new THREE.MeshPhysicalMaterial(Object.assign({ roughness: 0.5, metalness: 0 }, o || {}));
      m.color = K.color(hex);
      return m;
    };
    K.steel = function (rough) { return K.mat('#d3d7de', { metalness: 1, roughness: rough == null ? 0.26 : rough }); };
    K.tin = function () { return K.mat('#bfc3c9', { metalness: 1, roughness: 0.34 }); };
    K.gold = function () { return K.mat('#e2b94f', { metalness: 1, roughness: 0.22 }); };
    K.copper = function () { return K.mat('#c8794a', { metalness: 1, roughness: 0.3 }); };
    K.black = function (rough) { return K.mat('#0f1012', { roughness: rough == null ? 0.42 : rough, clearcoat: 0.3, clearcoatRoughness: 0.35 }); };
    K.plastic = function (hex, rough) { return K.mat(hex, { roughness: rough == null ? 0.42 : rough, clearcoat: 0.25, clearcoatRoughness: 0.35 }); };

    /* ---------- textures ---------- */
    K.tex = function (w, h, draw, linear) {
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      var t = new THREE.CanvasTexture(c);
      if (!linear) t.encoding = sRGB;
      t.anisotropy = 8;
      return t;
    };
    K.glowTexture = function () {
      return K.tex(128, 128, function (x, w, h) {
        var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
      });
    };
    // Small seeded random generator so textures look the same on every visit.
    K.rng = function (seed) {
      var s = seed || 1;
      return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    };

    /* ---------- geometry ---------- */
    // Rounded, beveled box centred on the origin. r = corner radius, b = edge bevel.
    K.rboxGeo = function (w, h, d, r, b) {
      b = Math.min(b == null ? 0.25 : b, h / 2 - 0.01, Math.min(w, d) / 2 - 0.02);
      if (b < 0.02) b = 0;
      r = Math.max(Math.min(r == null ? b : r, w / 2 - 0.01, d / 2 - 0.01), b + 0.001);
      var ir = r - b, hw = w / 2 - b, hd = d / 2 - b;
      var s = new THREE.Shape();
      s.moveTo(-hw + ir, -hd);
      s.lineTo(hw - ir, -hd); s.absarc(hw - ir, -hd + ir, ir, -Math.PI / 2, 0, false);
      s.lineTo(hw, hd - ir); s.absarc(hw - ir, hd - ir, ir, 0, Math.PI / 2, false);
      s.lineTo(-hw + ir, hd); s.absarc(-hw + ir, hd - ir, ir, Math.PI / 2, Math.PI, false);
      s.lineTo(-hw, -hd + ir); s.absarc(-hw + ir, -hd + ir, ir, Math.PI, Math.PI * 1.5, false);
      var g = new THREE.ExtrudeGeometry(s, {
        depth: h - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 5
      });
      g.rotateX(-Math.PI / 2);
      g.translate(0, -(h - 2 * b) / 2, 0);
      return g;
    };
    // Maps the top face of a geometry onto a 0..1 texture (u across x, v along -z).
    K.topUV = function (geo, w, d) {
      var p = geo.attributes.position, uv = geo.attributes.uv;
      for (var i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, 0.5 - p.getZ(i) / d);
      uv.needsUpdate = true;
      return geo;
    };
    function mesh(geo, m) {
      var o = new THREE.Mesh(geo, m);
      o.castShadow = true; o.receiveShadow = true;
      return o;
    }
    // Box whose base sits on y = 0 and which is centred on x and z.
    K.block = function (w, h, d, m, r, b) {
      var g = K.rboxGeo(w, h, d, r, b);
      g.translate(0, h / 2, 0);
      return mesh(g, m);
    };
    // Cylinder whose base sits on y = 0.
    K.cyl = function (rt, rb, h, m, seg) {
      var g = new THREE.CylinderGeometry(rt, rb, h, seg || 32);
      g.translate(0, h / 2, 0);
      return mesh(g, m);
    };
    // Lathe from [radius, height] pairs.
    K.lathe = function (pts, m, seg) {
      return mesh(new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), seg || 40), m);
    };
    K.mesh = mesh;
    K.tube = function (points, radius, m, segs) {
      var curve = new THREE.CatmullRomCurve3(points);
      return mesh(new THREE.TubeGeometry(curve, segs || 40, radius, 10, false), m);
    };
    // Flat printed decal that lies on top of a surface.
    K.decal = function (w, h, tex, opts) {
      var m = new THREE.MeshStandardMaterial(Object.assign({ map: tex, transparent: true, roughness: 0.6, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, opts || {}));
      var o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      o.rotation.x = -Math.PI / 2;
      o.userData.noShadow = true;
      return o;
    };

    /* ---------- named parts ---------- */
    K.part = function (list, label, text) {
      var p = { label: label, text: text, meshes: [] };
      list.push(p);
      return p;
    };
    // Gives every mesh under obj its own materials (so hover highlights one part) and registers it.
    K.tag = function (part, obj) {
      obj.traverse(function (o) {
        if (!o.isMesh) return;
        o.material = Array.isArray(o.material) ? o.material.map(function (m) { return m.clone(); }) : o.material.clone();
        o.userData.part = part;
        part.meshes.push(o);
      });
      return obj;
    };

    /* ---------- environment, floor and framing ---------- */
    // A small studio built from bright panels. It is only used to light and reflect in the parts.
    K.environment = function (renderer) {
      var pm = new THREE.PMREMGenerator(renderer);
      var s = new THREE.Scene();
      var room = new THREE.Mesh(new THREE.BoxGeometry(80, 50, 80), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.07, 0.12, 0.26), side: THREE.BackSide }));
      s.add(room);
      function panel(w, h, v, x, y, z, tint) {
        var c = tint ? new THREE.Color(tint).multiplyScalar(v) : new THREE.Color(v, v, v);
        var p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
        p.position.set(x, y, z); p.lookAt(0, 0, 0);
        s.add(p);
      }
      panel(36, 24, 4.2, 0, 24, 4);              // overhead softbox
      panel(10, 30, 3.4, -30, 8, 14);            // left strip
      panel(10, 30, 2.4, 32, 6, -6, 0xdbe9ff); // right strip, cool
      panel(60, 8, 1.2, 0, 4, -36, 0xbcd6ff);  // back
      panel(24, 10, 1.6, 4, 3, 36);            // front fill
      var tex = pm.fromScene(s, 0.02).texture;
      pm.dispose();
      return tex;
    };
    // Soft contact shadow on the floor under a model.
    K.floor = function (radius, y) {
      var g = new THREE.Group();
      var shadow = new THREE.Mesh(new THREE.PlaneGeometry(radius * 6, radius * 6), new THREE.ShadowMaterial({ opacity: 0.34 }));
      shadow.rotation.x = -Math.PI / 2; shadow.receiveShadow = true;
      var t = K.tex(256, 256, function (x, w, h) {
        var gr = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(2,10,30,0.5)');
        gr.addColorStop(0.55, 'rgba(2,10,30,0.18)');
        gr.addColorStop(1, 'rgba(2,10,30,0)');
        x.fillStyle = gr; x.fillRect(0, 0, w, h);
      });
      var blob = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2.7, radius * 2.7), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      blob.rotation.x = -Math.PI / 2; blob.position.y = 0.01; blob.renderOrder = -1;
      g.add(blob); g.add(shadow);
      g.position.y = y;
      return g;
    };
    // Centres the model, puts its base on the floor and reports its size.
    K.finish = function (group, parts, extra) {
      group.traverse(function (o) {
        if (o.isMesh && !o.userData.noShadow) { o.castShadow = true; o.receiveShadow = true; }
        else if (o.isMesh) { o.castShadow = false; }
      });
      var b = new THREE.Box3().setFromObject(group);
      var c = b.getCenter(new THREE.Vector3());
      group.position.set(-c.x, -c.y, -c.z);
      var wrap = new THREE.Group();
      wrap.add(group);
      var size = b.getSize(new THREE.Vector3());
      var sphere = b.getBoundingSphere(new THREE.Sphere());
      wrap.add(K.floor(sphere.radius, -size.y / 2 - 0.02));
      var solids = [];
      group.traverse(function (o) { if (o.userData && o.userData.solid) solids.push(o); });
      return Object.assign({ group: wrap, parts: parts, solids: solids, radius: sphere.radius, size: size }, extra || {});
    };
    return K;
  };
})();
