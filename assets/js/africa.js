/* ==========================================================================
   UJAMAA — Visualisations canvas
   1. Carte de l'Afrique en matrice de points, réseau de villes depuis Dschang
   2. Constellation de talents (section communauté)
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Contour simplifié de l'Afrique continentale [longitude, latitude]
  var AFRICA = [
    [-5.9, 35.8], [-2, 35.1], [1, 36.5], [3, 36.9], [8.6, 36.9], [10.2, 37.2], [11.1, 36.9], [10.5, 35.5],
    [10.1, 34.2], [11.2, 33.2], [13.2, 32.9], [15.4, 31.5], [19, 30.3], [20.1, 32.1], [23, 32.6], [25.1, 31.6],
    [29.9, 31.2], [32.3, 31.3], [32.6, 29.9], [33.6, 27.2], [35.5, 23.9], [37.2, 21], [38.6, 18], [39.7, 15.6],
    [41.7, 13.5], [43.3, 12.4], [43.2, 11.5], [44.5, 10.4], [48, 11.2], [51.3, 11.8], [51.1, 10.4], [49.8, 7.8],
    [48, 4.5], [46, 2], [43.2, -0.8], [41.5, -1.9], [39.7, -4], [39.3, -6.8], [39.4, -8.5], [40.4, -10.5],
    [40.6, -14.5], [39.2, -16.8], [36.8, -18], [35, -20], [35.5, -22], [35.5, -24], [32.9, -25.9], [32.6, -28.5],
    [31, -29.9], [28, -32.8], [25.6, -33.9], [22, -34.2], [20, -34.8], [18.4, -34.3], [18.2, -32], [16.5, -28.6],
    [15.2, -26.6], [14.5, -22.9], [12.5, -18.5], [11.8, -17], [12.2, -14], [13.6, -12], [13.2, -8.8], [12.3, -6],
    [11.8, -4.8], [9.5, -2], [9.3, 0.2], [9.6, 3], [9.2, 4], [8.5, 4.6], [6, 4.3], [4.5, 6.3], [3.4, 6.4],
    [1.2, 6.1], [-1, 5], [-3, 5.1], [-5, 5.2], [-7.5, 4.4], [-10.8, 6.3], [-13.2, 8.5], [-15, 10.8], [-16.8, 12.4],
    [-17.5, 14.7], [-16.5, 16.5], [-16.1, 19], [-17, 21], [-15, 24.5], [-13.5, 27], [-11, 28.5], [-9.8, 30.5],
    [-9.6, 32.5], [-6.8, 34]
  ];
  var MADAGASCAR = [
    [49.3, -12], [50.5, -15.5], [49.5, -17.5], [48, -21.5], [47, -24.8], [45.2, -25.6], [43.8, -23.5],
    [43.3, -21.5], [44.5, -19], [44, -17], [46.3, -15.8], [48, -13.5]
  ];
  var HOME = { name: 'Dschang', lon: 10.05, lat: 5.45 };
  var CITIES = [
    { name: 'Dakar', lon: -17.4, lat: 14.7 }, { name: 'Abidjan', lon: -4, lat: 5.3 },
    { name: 'Accra', lon: -0.2, lat: 5.6 }, { name: 'Lagos', lon: 3.4, lat: 6.5 },
    { name: 'Yaoundé', lon: 11.5, lat: 3.85 }, { name: 'Kinshasa', lon: 15.3, lat: -4.3 },
    { name: 'Kigali', lon: 30.1, lat: -1.95 }, { name: 'Nairobi', lon: 36.8, lat: -1.3 },
    { name: 'Addis-Abeba', lon: 38.7, lat: 9 }, { name: 'Le Caire', lon: 31.2, lat: 30 },
    { name: 'Casablanca', lon: -7.6, lat: 33.6 }, { name: 'Tunis', lon: 10.2, lat: 36.8 },
    { name: 'Johannesburg', lon: 28, lat: -26.2 }, { name: 'Luanda', lon: 13.2, lat: -8.8 }
  ];
  var LON0 = -18.5, LON1 = 52, LAT0 = -35.5, LAT1 = 37.8;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  // Dégradé de marque : vert clair -> vert -> ambre -> orange
  var STOPS = [[182, 233, 114], [84, 157, 34], [231, 150, 18], [219, 112, 0]];
  function brand(t) {
    t = clamp(t, 0, 1) * (STOPS.length - 1);
    var i = Math.min(Math.floor(t), STOPS.length - 2), f = t - i, a = STOPS[i], b = STOPS[i + 1];
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
  }

  // Couleurs selon le thème clair / sombre
  function palette() {
    var light = document.documentElement.dataset.theme === 'light';
    return light
      ? { base: [53, 46, 41], dotMin: 0.22, arcA: 'rgba(63,138,18,0.6)', arcB: 'rgba(196,95,0,0.6)', spark: '196,95,0', node: '196,95,0', home: '63,138,18', label: 'rgba(26,22,19,0.85)', line: 0.6 }
      : { base: [244, 239, 233], dotMin: 0.18, arcA: 'rgba(182,233,114,0.55)', arcB: 'rgba(255,167,22,0.55)', spark: '255,214,140', node: '255,167,22', home: '182,233,114', label: 'rgba(244,239,233,0.85)', line: 0.55 };
  }

  function setupCanvas(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: rect.width, h: rect.height };
  }

  function whenVisible(el, cb) {
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; cb(visible); }).observe(el);
    }
    return function () { return visible && !document.hidden; };
  }

  /* ---------------- 1. Carte de l'Afrique ---------------- */
  function initAfrica(canvas) {
    var S, dots = [], nodes = [], home, scale, ox, oy, start = 0, raf = 0;
    var mouse = { x: -9999, y: -9999, tx: 0, ty: 0, px: 0, py: 0 };

    function project(lon, lat) {
      return [ox + (lon - LON0) * scale, oy + (LAT1 - lat) * scale];
    }

    function build() {
      S = setupCanvas(canvas);
      var pad = 14;
      scale = Math.min((S.w - pad * 2) / (LON1 - LON0), (S.h - pad * 2) / (LAT1 - LAT0));
      ox = (S.w - (LON1 - LON0) * scale) / 2;
      oy = (S.h - (LAT1 - LAT0) * scale) / 2;

      var path = new Path2D();
      [AFRICA, MADAGASCAR].forEach(function (poly) {
        poly.forEach(function (p, i) { var q = project(p[0], p[1]); i ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1]); });
        path.closePath();
      });

      var step = Math.max(7, Math.min(13, S.w / 64));
      home = project(HOME.lon, HOME.lat);
      dots = [];
      var maxD = 0;
      // isPointInPath applique la transformation courante (dpr) : on teste en repère identité
      S.ctx.save();
      S.ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (var y = oy; y < oy + (LAT1 - LAT0) * scale; y += step) {
        for (var x = ox; x < ox + (LON1 - LON0) * scale; x += step) {
          if (S.ctx.isPointInPath(path, x, y)) {
            var d = Math.hypot(x - home[0], y - home[1]);
            maxD = Math.max(maxD, d);
            dots.push({ x: x, y: y, d: d, ph: Math.random() * Math.PI * 2, sp: 0.6 + Math.random() * 1.4, c: brand((x - ox) / ((LON1 - LON0) * scale)) });
          }
        }
      }
      S.ctx.restore();
      dots.forEach(function (p) { p.dn = p.d / maxD; });
      S.r = Math.max(1, step * 0.16);

      nodes = CITIES.map(function (c, i) {
        var p = project(c.lon, c.lat);
        var dx = p[0] - home[0], dy = p[1] - home[1], len = Math.hypot(dx, dy) || 1;
        var bend = Math.min(len * 0.22, 60) * (dx < 0 ? -1 : 1);
        return {
          name: c.name, x: p[0], y: p[1],
          cx: (home[0] + p[0]) / 2 + (dy / len) * bend,
          cy: (home[1] + p[1]) / 2 - (dx / len) * bend,
          delay: 1.1 + i * 0.12,
          speed: 0.18 + Math.random() * 0.14,
          off: Math.random()
        };
      });
    }

    function qpoint(n, t) {
      var a = 1 - t;
      return [a * a * home[0] + 2 * a * t * n.cx + t * t * n.x, a * a * home[1] + 2 * a * t * n.cy + t * t * n.y];
    }

    function draw(now) {
      var t = (now - start) / 1000;
      var c = S.ctx;
      var P = palette();
      c.clearRect(0, 0, S.w, S.h);

      mouse.px += (mouse.tx - mouse.px) * 0.06;
      mouse.py += (mouse.ty - mouse.py) * 0.06;
      c.save();
      c.translate(mouse.px * 14, mouse.py * 10);

      var wave = reduced ? 2 : t * 0.75;           // propagation depuis Dschang
      var scan = (t * 0.22) % 1.6 - 0.3;           // balayage lumineux
      var mx = mouse.x - mouse.px * 14, my = mouse.y - mouse.py * 10;

      for (var i = 0; i < dots.length; i++) {
        var p = dots[i];
        var appear = clamp((wave - p.dn) * 6, 0, 1);
        if (appear <= 0) continue;
        var tw = 0.5 + 0.5 * Math.sin(t * p.sp + p.ph);
        var sweep = Math.max(0, 1 - Math.abs((p.y - oy) / ((LAT1 - LAT0) * scale) - scan) * 7);
        var md = Math.hypot(p.x - mx, p.y - my);
        var hover = md < 110 ? 1 - md / 110 : 0;
        var ring = Math.max(0, 1 - Math.abs(p.dn - ((t * 0.18) % 1.2)) * 18) * (reduced ? 0 : 1);

        var glow = clamp(0.1 + tw * 0.12 + sweep * 0.55 + hover * 0.9 + ring * 0.6, 0, 1);
        var dx = 0, dy = 0;
        if (hover > 0) { dx = (p.x - mx) / (md || 1) * hover * 6; dy = (p.y - my) / (md || 1) * hover * 6; }
        var r = S.r * (1 + hover * 0.9 + sweep * 0.4) * (appear < 1 ? easeOut(appear) * 1.8 : 1);
        var w = 1 - glow;
        c.fillStyle = 'rgba(' + Math.round(lerp(p.c[0], P.base[0], w * 0.75)) + ',' + Math.round(lerp(p.c[1], P.base[1], w * 0.75)) + ',' + Math.round(lerp(p.c[2], P.base[2], w * 0.75)) + ',' + (P.dotMin + glow * (1 - P.dotMin)) * appear + ')';
        c.beginPath();
        c.arc(p.x + dx, p.y + dy, r, 0, 6.2832);
        c.fill();
      }

      // Arcs + impulsions
      for (var j = 0; j < nodes.length; j++) {
        var n = nodes[j];
        var prog = reduced ? 1 : clamp((t - n.delay) / 1.1, 0, 1);
        if (prog <= 0) continue;
        var e = easeOut(prog);
        var grad = c.createLinearGradient(home[0], home[1], n.x, n.y);
        grad.addColorStop(0, P.arcA);
        grad.addColorStop(1, P.arcB);
        c.strokeStyle = grad;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(home[0], home[1]);
        var steps = 28;
        for (var k = 1; k <= steps * e; k++) { var q = qpoint(n, k / steps); c.lineTo(q[0], q[1]); }
        c.stroke();

        if (prog >= 1) {
          var pt = ((t * n.speed + n.off) % 1);
          for (var s = 0; s < 6; s++) {
            var tt = pt - s * 0.012;
            if (tt < 0) continue;
            var pp = qpoint(n, tt);
            c.fillStyle = 'rgba(' + P.spark + ',' + (0.9 - s * 0.15) + ')';
            c.beginPath(); c.arc(pp[0], pp[1], 2 - s * 0.25, 0, 6.2832); c.fill();
          }
          var pulse = (t * 0.8 + n.off) % 1;
          c.strokeStyle = 'rgba(' + P.node + ',' + (1 - pulse) * 0.6 + ')';
          c.beginPath(); c.arc(n.x, n.y, 3 + pulse * 10, 0, 6.2832); c.stroke();
          c.fillStyle = 'rgb(' + P.node + ')';
          c.beginPath(); c.arc(n.x, n.y, 2.6, 0, 6.2832); c.fill();
        }
      }

      // Nœud d'origine : Dschang
      var hp = reduced ? 0.5 : (t * 0.6) % 1;
      for (var h = 0; h < 2; h++) {
        var pr = (hp + h * 0.5) % 1;
        c.strokeStyle = 'rgba(' + P.home + ',' + (1 - pr) * 0.7 + ')';
        c.lineWidth = 1.2;
        c.beginPath(); c.arc(home[0], home[1], 6 + pr * 30, 0, 6.2832); c.stroke();
      }
      c.fillStyle = 'rgb(' + P.home + ')';
      c.shadowColor = 'rgb(' + P.home + ')'; c.shadowBlur = 18;
      c.beginPath(); c.arc(home[0], home[1], 4.5, 0, 6.2832); c.fill();
      c.shadowBlur = 0;
      c.font = '500 11px "JetBrains Mono", monospace';
      c.fillStyle = P.label;
      c.fillText('DSCHANG', home[0] + 12, home[1] - 10);
      c.restore();
    }

    function loop(now) {
      if (isActive()) draw(now);
      raf = requestAnimationFrame(loop);
    }

    var isActive = whenVisible(canvas, function () {});
    build();
    window.addEventListener('resize', debounce(build, 200));
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    return {
      start: function () {
        start = performance.now();
        if (reduced) { draw(start + 6000); return; }
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    };
  }

  /* ---------------- 2. Constellation de talents ---------------- */
  function initConstellation(canvas) {
    var S, pts = [], mouse = { x: -9999, y: -9999 }, t0 = performance.now();

    function build() {
      S = setupCanvas(canvas);
      var count = Math.round(clamp(S.w * S.h / 5200, 36, 150));
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * S.w, y: Math.random() * S.h,
          vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() < 0.12 ? 3.2 : 1.2 + Math.random() * 1.2,
          c: brand(Math.random()), ph: Math.random() * 6.28
        });
      }
    }

    function draw(now) {
      var c = S.ctx, t = (now - t0) / 1000, link = Math.min(150, S.w / 7);
      var lineA = palette().line;
      c.clearRect(0, 0, S.w, S.h);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (!reduced) {
          p.x += p.vx; p.y += p.vy;
          var md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (md < 160) { p.x += (mouse.x - p.x) * 0.004; p.y += (mouse.y - p.y) * 0.004; }
          if (p.x < -10) p.x = S.w + 10; if (p.x > S.w + 10) p.x = -10;
          if (p.y < -10) p.y = S.h + 10; if (p.y > S.h + 10) p.y = -10;
        }
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < link) {
            c.strokeStyle = 'rgba(' + (p.c[0] | 0) + ',' + (p.c[1] | 0) + ',' + (p.c[2] | 0) + ',' + (1 - d / link) * lineA + ')';
            c.lineWidth = 0.8;
            c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
          }
        }
      }
      for (var k = 0; k < pts.length; k++) {
        var n = pts[k], a = 0.55 + 0.45 * Math.sin(t * 1.2 + n.ph);
        c.fillStyle = 'rgba(' + (n.c[0] | 0) + ',' + (n.c[1] | 0) + ',' + (n.c[2] | 0) + ',' + a + ')';
        if (n.r > 3) { c.shadowColor = 'rgb(' + (n.c[0] | 0) + ',' + (n.c[1] | 0) + ',' + (n.c[2] | 0) + ')'; c.shadowBlur = 14; }
        c.beginPath(); c.arc(n.x, n.y, n.r, 0, 6.2832); c.fill();
        c.shadowBlur = 0;
      }
    }

    var isActive = whenVisible(canvas, function () {});
    build();
    window.addEventListener('resize', debounce(build, 200));
    canvas.parentElement.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    canvas.parentElement.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });

    if (reduced) { draw(performance.now()); return; }
    (function loop(now) { if (isActive()) draw(now); requestAnimationFrame(loop); })(performance.now());
  }

  function debounce(fn, ms) { var id; return function () { clearTimeout(id); id = setTimeout(fn, ms); }; }

  window.UJ = window.UJ || {};
  window.UJ.initAfrica = function () { var el = document.getElementById('africa'); return el ? initAfrica(el) : null; };
  window.UJ.initConstellation = function () { var el = document.getElementById('constellation'); if (el) initConstellation(el); };
})();
