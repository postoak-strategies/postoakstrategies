/* Post Oak Strategies home page: nav, reveals and the animated sample visuals. All figures are made up. */
(function () {
  'use strict';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return document.getElementById(id); }
  function k(n) { return n >= 1000 ? '$' + (n / 1000).toFixed(2) + 'M' : '$' + Math.round(n) + 'K'; }
  function onVisible(el, fn, threshold) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: threshold || 0.25 });
    io.observe(el);
  }
  function countTo(el, to, fmt, ms, from) {
    from = from || 0;
    if (RM) { el.textContent = fmt(to); return; }
    var t0 = performance.now(), tok = (el._t = {});
    (function tick(now) {
      if (el._t !== tok) return;
      var p = Math.min(1, (now - t0) / (ms || 1200)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- nav ---------- */
  var nav = $('nav'), burger = document.querySelector('.burger'), menu = $('menu');
  function onScroll() { nav.classList.toggle('solid', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open)); menu.classList.toggle('open', open); nav.classList.toggle('open', open);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); nav.classList.remove('open'); }
  });

  /* ---------- slides: every scroll moves one stop. Desktop: a stop is a full-screen section.
     Phones: sections are split into screen-sized stops (elements marked data-stop). ---------- */
  var DECK = (function () {
    var root = document.documentElement, slides = [].slice.call(document.querySelectorAll('main > .slide'));
    var full = window.matchMedia('(min-width: 900px) and (min-height: 600px)');
    var on = false, cur = 0, busy = false, hooks = [], stops = [], dots = [], prog = null;
    var lastT = 0, lastAbs = 0, lockUntil = 0;
    function each(list, fn) { Array.prototype.forEach.call(list, fn); }
    function offTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
    function measure() {
      var list = [];
      slides.forEach(function (s) { var pg = full.matches ? [] : s.querySelectorAll('.pg'); if (pg.length) each(pg, function (e) { list.push(e); }); else list.push(s); });
      var was = stops;
      stops = list.map(function (el) {
        var isSec = el.classList.contains('slide'), raw = offTop(el), prev = was.filter(function (o) { return o.el === el; })[0];
        return { el: el, raw: raw, y: raw, h: el.offsetHeight, sec: slides.indexOf(isSec ? el : el.closest('.slide')), items: [], on: !!(prev && prev.on) };
      });
      each(document.querySelectorAll('main [data-r], main .viz'), function (el) {
        var t = offTop(el) + 1, k = 0;
        for (var i = 0; i < stops.length; i++) if (stops[i].raw <= t) k = i;
        stops[k].items.push(el);
      });
      stops.forEach(function (st, i) {
        var end = 0; st.items.forEach(function (el) { end = Math.max(end, offTop(el) + el.offsetHeight); });
        st.end = i === stops.length - 1 ? root.scrollHeight : full.matches ? stops[i + 1].raw : st.raw + st.h;
      });
      stops.forEach(function (st) { var j = 0; st.items.forEach(function (el) { if (el.hasAttribute('data-r')) el.style.setProperty('--d', Math.min(0.8, 0.05 + 0.08 * j++).toFixed(2) + 's'); }); });
    }
    function top(i) { return stops[i].y; }
    function bottom(i) { return stops[i].end; }
    function nearest() { var y = window.scrollY + window.innerHeight * 0.45; for (var i = stops.length - 1; i > 0; i--) if (y >= top(i)) return i; return 0; }
    function mark(i) {
      var sec = stops[i].sec;
      dots.forEach(function (d, j) { d.classList.toggle('on', j === sec); if (j === sec) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      document.body.classList.toggle('on-dark', slides[sec].hasAttribute('data-dark'));
      var id = slides[sec].id === 'numbers' ? 'see' : slides[sec].id;
      each(document.querySelectorAll('.links a:not(.btn)'), function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + id); });
      if (prog) prog.style.transform = 'scaleX(' + (stops.length > 1 ? i / (stops.length - 1) : 1) + ')';
    }
    function enter(i, dir) {
      var st = stops[i]; mark(i); if (st.on) return; st.on = true;
      st.items.forEach(function (el) { el.classList.add('snap'); el.classList.remove('out'); el.style.setProperty('--dir', dir || 1); });
      void root.offsetWidth;
      st.items.forEach(function (el) { el.classList.remove('snap'); });
      setTimeout(function () { if (st.on) st.items.forEach(function (el) { el.classList.add('in'); }); }, 20);
      setTimeout(function () {
        if (st.on) hooks.forEach(function (h) { if (st.items.some(function (it) { return it === h.el || it.contains(h.el); })) h.fn(); });
      }, RM ? 0 : 200);
    }
    function leave(i, dir) {
      var st = stops[i]; if (!st || !st.on) return; st.on = false;
      st.items.forEach(function (el) { el.style.setProperty('--dir', dir); el.classList.add('out'); el.classList.remove('in'); });
    }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function tween(to, ms, done) {
      var from = window.scrollY, t0 = performance.now();
      if (!ms || Math.abs(to - from) < 2) { window.scrollTo(0, to); done(); return; }
      var fin = false, end = function () { if (fin) return; fin = true; window.scrollTo(0, to); done(); };
      setTimeout(end, ms + 120); /* never leave the page stuck if animation frames stall */
      (function step(now) { if (fin) return; var p = Math.min(1, (now - t0) / ms); window.scrollTo(0, from + (to - from) * ease(p)); if (p < 1) requestAnimationFrame(step); else end(); })(t0);
    }
    function go(i) {
      i = Math.max(0, Math.min(stops.length - 1, i));
      if (busy) return;
      var dir = i >= cur ? 1 : -1, tall = bottom(i) - top(i) > window.innerHeight + 2;
      var target = dir < 0 && tall ? bottom(i) - window.innerHeight : top(i);
      target = Math.max(0, Math.min(root.scrollHeight - window.innerHeight, target));
      if (i === cur && Math.abs(window.scrollY - target) < 2) return;
      if (i !== cur) leave(cur, dir);
      cur = i; busy = true;
      tween(target, RM ? 0 : (full.matches ? 900 : 650), function () { busy = false; lockUntil = performance.now() + 150; });
      setTimeout(function () { enter(i, dir); }, RM ? 0 : (full.matches ? 240 : 160));
    }
    function canInner(dir) { return dir > 0 ? window.scrollY + window.innerHeight < bottom(cur) - 2 : window.scrollY > top(cur) + 2; }
    function innerBy(d) { window.scrollTo(0, Math.max(top(cur), Math.min(bottom(cur) - window.innerHeight, window.scrollY + d))); }
    function sectionStop(el) { var s = el.closest('.slide'); for (var i = 0; i < stops.length; i++) if (stops[i].el === s) return i; return -1; }

    window.addEventListener('wheel', function (e) {
      if (!on || e.ctrlKey) return;
      if (e.target.closest && e.target.closest('textarea, select')) return;
      var d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (Math.abs(d) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      /* a trackpad flick keeps sending smaller and smaller events; only a fresh push moves another stop */
      var now = performance.now(), abs = Math.abs(d), coasting = now - lastT < 140 && abs <= lastAbs + 2;
      lastT = now; lastAbs = abs;
      if (busy) return;
      var dir = d > 0 ? 1 : -1;
      if (canInner(dir)) { innerBy(d); return; }
      if (coasting || now < lockUntil || abs < 2) return;
      go(cur + dir);
    }, { passive: false });

    document.addEventListener('keydown', function (e) {
      if (!on || e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target, k = e.key, dir = 0;
      if (t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
      if (k === 'Home' || k === 'End') { e.preventDefault(); go(k === 'Home' ? 0 : stops.length - 1); return; }
      if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) dir = 1;
      else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) dir = -1;
      if (!dir || (k === ' ' && t.closest && t.closest('button, summary, a'))) return;
      e.preventDefault(); if (busy) return;
      if (canInner(dir)) { innerBy(dir * window.innerHeight * 0.6); return; }
      go(cur + dir);
    });

    /* touch: a swipe moves one stop; inside a stop taller than the screen, scroll normally until its edge */
    var ty = null, tx = 0, tFree = false;
    window.addEventListener('touchstart', function (e) { if (!on || e.touches.length > 1) { ty = null; return; } ty = e.touches[0].clientY; tx = e.touches[0].clientX; tFree = false; }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (!on || ty === null) return;
      if (e.target.closest && e.target.closest('textarea')) return;
      var dy = ty - e.touches[0].clientY, dx = tx - e.touches[0].clientX; if (Math.abs(dy) < 4 && Math.abs(dx) < 4 && !tFree) return;
      /* sideways swipe (carousels, chip row): leave it to the browser */
      if (!tFree && Math.abs(dx) > Math.abs(dy)) { ty = null; return; }
      if (!tFree) tFree = !busy && canInner(dy > 0 ? 1 : -1);
      if (!tFree && e.cancelable) e.preventDefault();
    }, { passive: false });
    window.addEventListener('touchend', function (e) {
      if (!on || ty === null) return;
      var dy = ty - e.changedTouches[0].clientY, dir = dy > 0 ? 1 : -1, free = tFree; ty = null;
      if (!free && Math.abs(dy) > 36) go(cur + dir);
    });

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!on || !a || a.classList.contains('skip')) return;
      var id = a.getAttribute('href').slice(1), el = id && document.getElementById(id);
      if (!el) return;
      var i = id === 'main' ? 0 : sectionStop(el);
      if (i < 0) return;
      e.preventDefault(); go(i);
    });
    document.addEventListener('toggle', function () { if (on) measure(); }, true);

    var st; window.addEventListener('scroll', function () {
      if (!on || busy) return;
      clearTimeout(st); st = setTimeout(function () { var n = nearest(); if (n !== cur) { var d = n > cur ? 1 : -1; leave(cur, d); cur = n; enter(n, d); } }, 120);
    }, { passive: true });
    var rt, lastW = window.innerWidth; window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () {
        if (!on || busy) return;
        setVh(); measure(); cur = Math.min(cur, stops.length - 1);
        /* phone address bars resize the window: keep position, only pull back inside the current stop */
        var lo = top(cur), hi = Math.max(lo, bottom(cur) - window.innerHeight);
        if (hi === lo) window.scrollTo(0, lo); else if (window.innerWidth !== lastW || window.scrollY < lo || window.scrollY > hi) window.scrollTo(0, Math.max(lo, Math.min(hi, window.scrollY)));
        lastW = window.innerWidth;
      }, 220);
    });

    function setVh() { root.style.setProperty('--vh', window.innerHeight + 'px'); }
    function setup() {
      root.classList.toggle('full', full.matches); setVh();
      each(document.querySelectorAll('[data-r], .viz'), function (el) { el.classList.remove('in', 'out'); });
      stops = []; measure(); cur = nearest(); window.scrollTo(0, top(cur)); enter(cur, 1);
      window.dispatchEvent(new Event('resize'));
    }
    function start() {
      var nav = document.createElement('nav'); nav.className = 'dots'; nav.setAttribute('aria-label', 'Sections');
      slides.forEach(function (s) {
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', s.dataset.name);
        b.innerHTML = '<span aria-hidden="true">' + s.dataset.name + '</span>';
        b.addEventListener('click', function () { go(sectionStop(s)); }); nav.appendChild(b); dots.push(b);
      });
      document.body.appendChild(nav);
      prog = document.createElement('div'); prog.className = 'prog'; prog.setAttribute('aria-hidden', 'true'); document.body.appendChild(prog);
      on = true; root.classList.add('deck');
      setup();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!busy) { measure(); window.scrollTo(0, top(cur)); } });
      if (full.addEventListener) full.addEventListener('change', setup); else full.addListener(setup);
    }
    return {
      hook: function (el, fn) { hooks.push({ el: el, fn: fn }); },
      start: start,
      isOn: function () { return on; },
      isFull: function () { return full.matches; }
    };
  })();

  /* ---------- hero card ---------- */
  (function hero() {
    var card = document.querySelector('.hero-card');
    var vals = [62, 66, 64, 71, 74, 70, 78, 82, 79, 86, 90, 96], W = 360, H = 120, n = vals.length;
    var bw = W / n * 0.56, max = 100, bars = '', pts = [];
    vals.forEach(function (v, i) {
      var x = i * W / n + (W / n - bw) / 2, y = H - v / max * H;
      bars += '<rect x="' + x.toFixed(1) + '" y="' + (y + 10).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (H - y - 10).toFixed(1) + '" rx="3" style="animation-delay:' + (i * 50) + 'ms"/>';
      pts.push([x + bw / 2, y - 4]);
    });
    card.querySelector('.hc-bars').innerHTML = bars;
    var d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L');
    card.querySelector('.hc-line').setAttribute('d', d);
    card.querySelector('.hc-area').setAttribute('d', d + ' L' + pts[n - 1][0].toFixed(1) + ',' + H + ' L' + pts[0][0].toFixed(1) + ',' + H + ' Z');
    var last = pts[n - 1], c = card.querySelector('.hc-pulse');
    c.setAttribute('cx', last[0].toFixed(1)); c.setAttribute('cy', last[1].toFixed(1));

    var F = {
      money: function (v) { return '$' + (v / 1e6).toFixed(2) + 'M'; },
      pct: function (v) { return v.toFixed(1) + '%'; },
      wks: function (v) { return Math.round(v) + ' wks'; }
    };
    function start() {
      Array.prototype.forEach.call(card.querySelectorAll('[data-count]'), function (el, i) {
        setTimeout(function () { countTo(el, Number(el.dataset.count), F[el.dataset.fmt], 1400); }, 250 + i * 120);
      });
    }
    DECK.hook(card, start);

    var lines = [
      'Revenue up 8.3% on last year.',
      'Materials ran $41K over budget in March.',
      'Cash dips in week 6. Collect two invoices early.',
      'HVAC keeps 19¢ of every dollar. Plumbing keeps 11¢.',
      '4 possible duplicate bills worth $18.6K.'
    ];
    var tk = $('ticker'), li = 0;
    if (RM) return;
    function type(s, i, done) { tk.textContent = s.slice(0, i); if (i < s.length) setTimeout(function () { type(s, i + 1, done); }, 28); else done(); }
    function erase(done) { var s = tk.textContent; if (!s) return done(); tk.textContent = s.slice(0, -1); setTimeout(function () { erase(done); }, 12); }
    function loop() { setTimeout(function () { erase(function () { li = (li + 1) % lines.length; type(lines[li], 0, loop); }); }, 2600); }
    tk.textContent = ''; setTimeout(function () { type(lines[0], 0, loop); }, 1600);
  })();

  /* ---------- big-company vs your version strip ---------- */
  (function swap() {
    var P = [
      ['Seven-figure AI and data-platform contracts', 'AI built on the software you already pay for'],
      ['Data engineering teams wiring every system together', 'Automated pipelines that pull, clean and connect your data'],
      ['Machine-learning checks on millions of transactions', 'Automated checks that catch duplicates and miscoded entries'],
      ['Rolling forecasts run by full FP&A teams', 'A cash forecast and what-ifs built from your own history'],
      ['Executive dashboards on enterprise BI platforms', 'Live dashboards where every number traces to its source']
    ];
    var a = $('sw-them'), b = $('sw-you'), i = 0, timer = null;
    if (!a || RM) return;
    function next() {
      i = (i + 1) % P.length;
      [a, b].forEach(function (el, k) {
        el.classList.add('out');
        setTimeout(function () {
          el.textContent = P[i][k]; el.classList.remove('out'); el.classList.add('pre');
          void el.offsetWidth; el.classList.remove('pre');
        }, 350 + k * 120);
      });
    }
    onVisible(a, function () { timer = setInterval(next, 5500); }, 0.5);
  })();

  /* ---------- phone carousels: dots that follow the swipe ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.car'), function (car) {
    var kids = [].slice.call(car.children), d = document.createElement('div'); d.className = 'car-dots'; d.setAttribute('aria-hidden', 'true'); d.setAttribute('data-r', '');
    kids.forEach(function () { d.appendChild(document.createElement('i')); });
    car.parentNode.insertBefore(d, car.nextSibling);
    function upd() {
      var x = car.scrollLeft, best = 0, bd = 1e9;
      kids.forEach(function (k, i) { var dd = Math.abs(k.offsetLeft - kids[0].offsetLeft - x); if (dd < bd) { bd = dd; best = i; } });
      Array.prototype.forEach.call(d.children, function (dot, i) { dot.classList.toggle('on', i === best); });
    }
    car.addEventListener('scroll', upd, { passive: true }); upd();
  });

  /* ---------- about: lines of noise resolving into one clean signal ---------- */
  (function signal() {
    var cv = $('sig'); if (!cv) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, vis = false, raf = 0, t = 0, last = 0;
    var L = []; for (var i = 0; i < 16; i++) L.push({ f1: 0.018 + Math.random() * 0.03, f2: 0.05 + Math.random() * 0.07, s1: 0.6 + Math.random() * 1.4, s2: 1 + Math.random() * 2.2, p: Math.random() * 6.28, a: 0.5 + Math.random() * 0.5 });
    function size() { var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
    function ss(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var mid = H * 0.58, A = H * 0.36, x, k;
      for (k = 0; k < L.length; k++) {
        var l = L[k]; ctx.beginPath();
        for (x = 0; x <= W; x += 4) {
          var calm = ss(0.3, 0.78, x / W), amp = A * l.a * (1 - calm);
          var y = mid + amp * (0.6 * Math.sin(x * l.f1 + t * l.s1 + l.p) + 0.4 * Math.sin(x * l.f2 - t * l.s2 + l.p * 2)) + 3 * calm * Math.sin(x * 0.012 + t * 0.8);
          if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.1 + 0.09 * l.a) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
      }
      var g = ctx.createLinearGradient(W * 0.35, 0, W, 0); g.addColorStop(0, 'rgba(200,169,110,0)'); g.addColorStop(1, 'rgba(200,169,110,1)');
      ctx.beginPath();
      for (x = W * 0.35; x <= W - 18; x += 3) { var yy = mid + 3 * Math.sin(x * 0.012 + t * 0.8); if (x === W * 0.35) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.strokeStyle = g; ctx.lineWidth = 2.6; ctx.stroke();
      var ex = W - 18, ey = mid + 3 * Math.sin(ex * 0.012 + t * 0.8), pr = 4 + 1.5 * Math.sin(t * 3);
      ctx.beginPath(); ctx.arc(ex, ey, pr + 6, 0, 6.2832); ctx.fillStyle = 'rgba(200,169,110,.18)'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex, ey, 4, 0, 6.2832); ctx.fillStyle = '#c8a96e'; ctx.fill();
    }
    function frame(now) { raf = 0; t += last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; draw(); if (vis) raf = requestAnimationFrame(frame); }
    size(); draw();
    if (RM) return;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !raf) { last = 0; raf = requestAnimationFrame(frame); } }).observe(cv);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); draw(); }, 200); });
  })();

  /* ---------- cash river ---------- */
  var RIVER = (function () {
    var SRC = [['hvac', 'HVAC', 1420], ['plmb', 'Plumbing', 820], ['elec', 'Electrical', 610]];
    var COST = [['labor', 'Technician labor', 860, 'v'], ['mat', 'Materials & parts', 570, 'm'], ['over', 'Rent, insurance & overhead', 520, ''],
      ['office', 'Office & dispatch', 330, ''], ['truck', 'Trucks & fuel', 160, 'v']];
    var SCEN = { base: { v: 0, p: 0, m: 0 }, price: { v: 0, p: 0.05, m: 0 }, mat: { v: 0, p: 0, m: 0.12 }, slow: { v: -0.15, p: 0, m: 0 } };
    function model(s) {
      var src = SRC.map(function (x) { return { id: x[0], name: x[1], v: x[2] * (1 + s.v) * (1 + s.p), kind: 'in' }; });
      var uses = COST.map(function (x) {
        var f = x[3] === 'v' ? 1 + s.v : x[3] === 'm' ? (1 + s.v) * (1 + s.m) : 1;
        return { id: x[0], name: x[1], v: x[2] * f, kind: 'cost' };
      });
      var rev = src.reduce(function (a, b) { return a + b.v; }, 0), cost = uses.reduce(function (a, b) { return a + b.v; }, 0);
      uses.push({ id: 'profit', name: 'Kept as profit', v: Math.max(0, rev - cost), kind: 'profit' });
      return { src: src, uses: uses, total: rev, profit: rev - cost };
    }
    var wrap = $('rv'), svg = $('rv-svg'), cv = $('rv-cv'), ctx = null, flows = [], W = 0, H = 0, t0 = 0, raf = 0, last = 0, vis = false, cur = 'base';
    var PT = 30, PB = 6, NW = 9, CW = 12;
    function wantH() { if (!DECK.isOn()) return W < 560 ? 400 : 380; return DECK.isFull() ? Math.max(230, Math.min(380, window.innerHeight - 450)) : Math.max(190, Math.min(340, window.innerHeight - 440)); }

    function layout(m) {
      var usable = H - PT - PB, cx0 = Math.round(W * (W < 560 ? 0.42 : 0.46)), kC = usable / m.total;
      var gIn = 12, gOut = 8, kIn = (usable - gIn * (m.src.length - 1)) / m.total;
      var gaps = gOut * (m.uses.length - 1), hs = m.uses.map(function (u) { return Math.max(5, u.v * (usable - gaps) / m.total); });
      var sum = hs.reduce(function (a, b) { return a + b; }, 0), sc = (usable - gaps) / sum; hs = hs.map(function (h) { return h * sc; });
      var out = [], yIn = PT, cIn = PT, cOut = PT, yOut = PT;
      m.src.forEach(function (s) {
        var h = s.v * kIn, ch = s.v * kC;
        out.push({ id: s.id, name: s.name, v: s.v, kind: 'in', side: 'in', x0: NW, x1: cx0, to: { a0: yIn, a1: yIn + h, b0: cIn, b1: cIn + ch } });
        yIn += h + gIn; cIn += ch;
      });
      m.uses.forEach(function (u, j) {
        var ch = u.v * kC;
        out.push({ id: u.id, name: u.name, v: u.v, kind: u.kind, side: 'out', x0: cx0 + CW, x1: W - NW, to: { a0: cOut, a1: cOut + ch, b0: yOut, b1: yOut + hs[j] } });
        cOut += ch; yOut += hs[j] + gOut;
      });
      ['in', 'out'].forEach(function (side) {
        var prev = -99;
        out.filter(function (f) { return f.side === side; }).forEach(function (f) {
          var mid = side === 'in' ? (f.to.a0 + f.to.a1) / 2 : (f.to.b0 + f.to.b1) / 2;
          f.to.ly = Math.max(mid + 4, prev + 15); prev = f.to.ly;
        });
      });
      return { flows: out, cx0: cx0, usable: usable };
    }

    function build() {
      W = Math.max(300, Math.floor(wrap.clientWidth)); H = wantH();
      var m = model(SCEN[cur]), L = layout(m), dpr = window.devicePixelRatio || 1;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.height = H + 'px';
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var h = '';
      L.flows.forEach(function (f) { h += '<path class="rv-flow ' + f.kind + '"><title></title></path>'; });
      L.flows.forEach(function (f) { h += '<rect class="rvn ' + f.kind + '" x="' + (f.side === 'in' ? 0 : W - NW) + '" width="' + NW + '" rx="2"/>'; });
      h += '<rect class="rvc" x="' + L.cx0 + '" y="' + PT + '" width="' + CW + '" height="' + L.usable + '" rx="2"/><text class="rvt" x="' + (L.cx0 + CW / 2) + '" y="' + (PT - 11) + '"></text>';
      L.flows.forEach(function (f) {
        var small = W < 560;
        h += '<text class="rvl" x="' + (f.side === 'in' ? NW + 8 : W - NW - 8) + '" text-anchor="' + (f.side === 'in' ? 'start' : 'end') + '">' + (small ? f.name.replace('Rent, insurance & overhead', 'Overhead').replace('Technician labor', 'Labor').replace('Materials & parts', 'Materials').replace('Office & dispatch', 'Office').replace('Kept as profit', 'Profit') : f.name) + ' <tspan class="v"></tspan></text>';
      });
      svg.innerHTML = h;
      var paths = svg.querySelectorAll('.rv-flow'), nodes = svg.querySelectorAll('.rvn'), labels = svg.querySelectorAll('.rvl');
      flows = L.flows.map(function (f, i) {
        f.el = { p: paths[i], n: nodes[i], l: labels[i] }; f.cur = Object.assign({}, f.to); f.from = f.cur;
        var want = Math.max(4, Math.min(60, Math.round(f.v / m.total * 300 * W / 1000)));
        f.parts = []; for (var j = 0; j < want; j++) f.parts.push({ t: Math.random(), sp: 0.05 + Math.random() * 0.06, u: Math.random() - 0.5, r: 0.8 + Math.random() * 1.1 });
        return f;
      });
      setText(m); t0 = 0; draw(0, true);
    }

    function setText(m) {
      svg.querySelector('.rvt').textContent = 'Cash moved ' + k(m.total);
      flows.forEach(function (f) {
        var src = f.side === 'in' ? m.src : m.uses, x = src.filter(function (s) { return s.id === f.id; })[0];
        f.v = x.v; f.el.l.querySelector('.v').textContent = k(x.v);
        f.el.p.querySelector('title').textContent = f.name + ': ' + k(x.v);
      });
    }

    function go(name) {
      if (!SCEN[name]) return;
      var prevProfit = model(SCEN[cur]).profit; cur = name;
      var m = model(SCEN[name]), L = layout(m);
      flows.forEach(function (f, i) { f.from = Object.assign({}, f.cur); f.to = L.flows[i].to; });
      setText(m);
      t0 = RM ? 0 : performance.now(); if (RM) flows.forEach(function (f) { f.cur = Object.assign({}, f.to); });
      draw(0, true); kick();
      var base = model(SCEN.base).profit, pe = $('rv-profit'), de = $('rv-delta'), d = m.profit - base;
      countTo(pe, m.profit, function (v) { return k(v); }, 700, prevProfit);
      de.className = 'delta ' + (d > 0 ? 'fav' : d < 0 ? 'unfav' : '');
      de.textContent = d === 0 ? '' : (d > 0 ? '▲ ' : '▼ ') + k(Math.abs(d)) + ' vs. today';
      Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) { c.classList.toggle('on', c.dataset.s === name); });
    }

    function draw(dt, force) {
      var p = 1, e = 1;
      if (t0) { p = Math.min(1, (performance.now() - t0) / 700); e = 1 - Math.pow(1 - p, 3); if (p >= 1) t0 = 0; }
      flows.forEach(function (f) {
        if (p < 1 || force || !f.ok) {
          var a = f.from, b = f.to, c = f.cur;
          ['a0', 'a1', 'b0', 'b1', 'ly'].forEach(function (key) { c[key] = a[key] + (b[key] - a[key]) * e; });
          var xm = (f.x0 + f.x1) / 2;
          f.el.p.setAttribute('d', 'M' + f.x0 + ',' + c.a0.toFixed(1) + ' C' + xm + ',' + c.a0.toFixed(1) + ' ' + xm + ',' + c.b0.toFixed(1) + ' ' + f.x1 + ',' + c.b0.toFixed(1) +
            ' L' + f.x1 + ',' + c.b1.toFixed(1) + ' C' + xm + ',' + c.b1.toFixed(1) + ' ' + xm + ',' + c.a1.toFixed(1) + ' ' + f.x0 + ',' + c.a1.toFixed(1) + ' Z');
          var n0 = f.side === 'in' ? c.a0 : c.b0, n1 = f.side === 'in' ? c.a1 : c.b1;
          f.el.n.setAttribute('y', n0.toFixed(1)); f.el.n.setAttribute('height', Math.max(1, n1 - n0).toFixed(1));
          f.el.l.setAttribute('y', c.ly.toFixed(1)); f.ok = p >= 1;
        }
      });
      if (!ctx || RM) return;
      ctx.clearRect(0, 0, W, H);
      flows.forEach(function (f) {
        var c = f.cur, h0 = c.a1 - c.a0, h1 = c.b1 - c.b0, m0 = (c.a0 + c.a1) / 2, m1 = (c.b0 + c.b1) / 2;
        ctx.fillStyle = f.kind === 'profit' ? 'rgba(122,94,36,.8)' : 'rgba(15,42,29,.42)';
        f.parts.forEach(function (q) {
          q.t += q.sp * dt; if (q.t > 1) { q.t -= 1; q.u = Math.random() - 0.5; }
          var s = q.t * q.t * (3 - 2 * q.t), x = f.x0 + (f.x1 - f.x0) * q.t, y = m0 + (m1 - m0) * s + q.u * (h0 + (h1 - h0) * s) * 0.84;
          ctx.beginPath(); ctx.arc(x, y, q.r, 0, 6.2832); ctx.fill();
        });
      });
    }
    function frame(now) {
      raf = 0; var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
      draw(dt); if ((vis || t0) && !RM) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && !RM && (vis || t0)) { last = 0; raf = requestAnimationFrame(frame); } }

    build();
    var auto = null, order = ['base', 'price', 'mat', 'slow'], ai = 0;
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
    document.querySelector('.chips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return; stopAuto(); go(b.dataset.s);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        vis = es[0].isIntersecting; kick();
        if (vis && !auto && !RM && ai >= 0) auto = setInterval(function () { ai = (ai + 1) % order.length; go(order[ai]); }, 3800);
        if (!vis && auto) { clearInterval(auto); auto = null; }
      }, { threshold: 0.2 }).observe(wrap);
      document.querySelector('.chips').addEventListener('click', function () { ai = -1; });
    } else { vis = true; kick(); }
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (Math.floor(wrap.clientWidth) !== W || wantH() !== H) build(); }, 200); });
    return { go: go };
  })();

  /* ---------- budget bridge ---------- */
  function bridge() {
    var el = $('bridge'), W = Math.max(300, Math.min(620, el.clientWidth || 520)), H = 290, T = 26, B = 40, L = 4, R = 4;
    var items = [['Budget', 380, 'total'], ['Sales', 62], ['Materials', -28], ['Labor', -17], ['Fuel', -9], ['Overhead', 12], ['Actual', 400, 'total']];
    var hi = 470, lo = 0, n = items.length, gw = (W - L - R) / n, bw = Math.min(46, gw * 0.62), cum = 0, g = '';
    function y(v) { return T + (hi - v) / (hi - lo) * (H - T - B); }
    items.forEach(function (it, i) {
      var a, b, cls;
      if (it[2] === 'total') { cum = it[1]; a = 0; b = it[1]; cls = i ? 'actual' : 'budget'; } else { a = cum; b = cum + it[1]; cum = b; cls = it[1] >= 0 ? 'fav' : 'unfav'; }
      var cx = L + gw * i + gw / 2, top = Math.min(y(a), y(b)), h = Math.max(3, Math.abs(y(a) - y(b)));
      g += '<rect class="wfb ' + cls + '" style="animation-delay:' + (i * 110) + 'ms" x="' + (cx - bw / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="4"/>';
      var txt = it[2] === 'total' ? '$' + it[1] + 'K' : (it[1] > 0 ? '+' : '−') + '$' + Math.abs(it[1]) + 'K';
      g += '<text class="vl ' + (it[2] === 'total' ? '' : cls) + '" style="transition-delay:' + (0.3 + i * 0.11) + 's" x="' + cx.toFixed(1) + '" y="' + (top - 7).toFixed(1) + '">' + txt + '</text>';
      if (i < n - 1) g += '<line class="conn" x1="' + (cx + bw / 2).toFixed(1) + '" x2="' + (cx + gw - bw / 2).toFixed(1) + '" y1="' + y(cum).toFixed(1) + '" y2="' + y(cum).toFixed(1) + '"/>';
      var nm = W < 440 ? ({ Materials: 'Matl.', Overhead: 'Ovhd.' }[it[0]] || it[0]) : it[0];
      g += '<text class="cl" x="' + cx.toFixed(1) + '" y="' + (H - 14) + '">' + nm + '</text>';
    });
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Sample waterfall: budgeted profit of $380K, plus $62K from sales, minus materials, labor and fuel, plus $12K on overhead, ending at $400K actual.">' + g + '</svg>';
  }

  /* ---------- Monte Carlo fan ---------- */
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var FAN = (function () {
    var r = rng(20261111), N = 1000, M = 12, start = 420, floor = 260, cols = [], paths = [], breach = 0, m, i;
    function gauss() { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    var season = [-35, -20, 5, 20, 30, 25, 10, 5, 0, 10, -15, 15];
    for (m = 0; m < M; m++) cols.push([]);
    for (i = 0; i < N; i++) {
      var c = start, s = 0, hit = false, p = [];
      for (m = 0; m < M; m++) { s = 0.55 * s + gauss(); c += season[m] + 6 + s * 26; if (c < floor) hit = true; cols[m].push(c); if (i < 40) p.push(c); }
      if (hit) breach++; if (i < 40) paths.push(p);
    }
    function pc(a, q) { var x = (a.length - 1) * q, lo = Math.floor(x), hi = Math.ceil(x); return a[lo] + (a[hi] - a[lo]) * (x - lo); }
    var pct = cols.map(function (a) { a.sort(function (x, y) { return x - y; }); return { p10: pc(a, .1), p25: pc(a, .25), p50: pc(a, .5), p75: pc(a, .75), p90: pc(a, .9) }; });
    return { paths: paths, pct: pct, floor: floor, start: start, risk: breach / N, n: N };
  })();

  function fan() {
    var el = $('fan'), W = Math.max(300, Math.min(620, el.clientWidth || 520)), H = 250, L = 44, R = W < 420 ? 8 : 52, T = 10, B = 24;
    var all = FAN.pct.map(function (x) { return x.p90; }), flat = [].concat.apply([], FAN.paths), lo = Math.min(FAN.floor - 40, Math.min.apply(null, flat) - 10), hi = Math.max(Math.max.apply(null, all), Math.max.apply(null, flat)) + 20;
    function x(i) { return L + (W - L - R) * (i + 1) / 12; }
    function y(v) { return T + (hi - v) / (hi - lo) * (H - T - B); }
    function line(arr) { return x(-1).toFixed(1) + ',' + y(FAN.start).toFixed(1) + ' ' + arr.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' '); }
    function band(a, b) {
      return 'M' + x(-1) + ',' + y(FAN.start) + ' L' + FAN.pct.map(function (p, i) { return x(i).toFixed(1) + ',' + y(p[a]).toFixed(1); }).join(' L') +
        ' L' + FAN.pct.slice().reverse().map(function (p, i) { return x(11 - i).toFixed(1) + ',' + y(p[b]).toFixed(1); }).join(' L') + ' Z';
    }
    var g = '', i, MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (i = 0; i <= 3; i++) { var v = lo + (hi - lo) * i / 3; g += '<line class="gridl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="axis" x="' + (L - 6) + '" y="' + (y(v) + 3).toFixed(1) + '" text-anchor="end">$' + Math.round(v) + 'K</text>'; }
    FAN.paths.forEach(function (p, j) { g += '<polyline class="samp" pathLength="1" style="animation-delay:' + (j * 30) + 'ms" points="' + line(p) + '"/>'; });
    g += '<path class="band b90" d="' + band('p90', 'p10') + '"/><path class="band b50" d="' + band('p75', 'p25') + '"/>';
    g += '<polyline class="band med" points="' + line(FAN.pct.map(function (p) { return p.p50; })) + '"/>';
    g += '<line class="floor" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(FAN.floor).toFixed(1) + '" y2="' + y(FAN.floor).toFixed(1) + '"/><text class="floor-l" x="' + (L + 4) + '" y="' + (y(FAN.floor) + 13).toFixed(1) + '">Cash cushion</text>';
    if (R > 20) { var e = FAN.pct[11]; [['P90', e.p90], ['P50', e.p50], ['P10', e.p10]].forEach(function (q) { g += '<text class="axis band" x="' + (W - R + 6) + '" y="' + (y(q[1]) + 3).toFixed(1) + '">' + q[0] + '</text>'; }); }
    for (i = 1; i < 12; i += 2) g += '<text class="axis" x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + MN[i] + '</text>';
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Sample fan chart of month-end cash across 1,000 simulated years.">' + g + '</svg>';
  }

  function vizIn(id, fn, after) {
    var el = $(id); fn();
    DECK.hook(el, function () { el.classList.add('in'); if (after) after(); });
    var w = el.clientWidth, rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (el.clientWidth !== w) { w = el.clientWidth; fn(); } }, 200); });
  }
  vizIn('bridge', bridge);
  vizIn('fan', fan, function () {
    countTo($('fan-n'), FAN.n, function (v) { return Math.round(v).toLocaleString('en-US'); }, 1500);
    setTimeout(function () { countTo($('fan-risk'), FAN.risk * 100, function (v) { return Math.round(v) + '%'; }, 900); }, RM ? 0 : 1300);
  });
  DECK.start();
})();
