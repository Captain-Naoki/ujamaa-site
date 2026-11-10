/* ==========================================================================
   UJAMAA — Interactions & motion design
   GSAP + ScrollTrigger + SplitText, défilement doux Lenis
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var EN = (root.lang || '').indexOf('en') === 0;
  var T = EN
    ? { open: 'Open menu', close: 'Close menu', toLight: 'Switch to light theme', toDark: 'Switch to dark theme', sent: 'Your mail app is opening with a pre-filled message. Thank you, we will get back to you shortly!' }
    : { open: 'Ouvrir le menu', close: 'Fermer le menu', toLight: 'Passer au thème clair', toDark: 'Passer au thème sombre', sent: 'Votre messagerie s\'ouvre avec le message pré-rempli. Merci, nous revenons vers vous rapidement !' };

  // Année du pied de page
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------------- Thème clair / sombre ---------------- */
  var themeBtns = $$('[data-theme-toggle]');
  function syncThemeUI() {
    var light = root.dataset.theme === 'light';
    themeBtns.forEach(function (b) { b.setAttribute('aria-label', light ? T.toDark : T.toLight); b.setAttribute('aria-pressed', String(light)); });
    $$('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', light ? '#f6f2ec' : '#0c0b0a'); });
  }
  themeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.classList.add('theme-anim');
      root.dataset.theme = next;
      try { localStorage.setItem('uj-theme', next); } catch (e) {}
      syncThemeUI();
      setTimeout(function () { root.classList.remove('theme-anim'); }, 600);
    });
  });
  syncThemeUI();

  /* ---------------- Galerie Injara + visionneuse ---------------- */
  var gal = $('[data-gallery]');
  if (gal) {
    var slides = $$('.gallery__slide', gal), tabs = $$('.gallery__tab', gal);
    var title = $('[data-gallery-title]', gal), current = 0, timer = null, prog = null;
    var DELAY = 5000;
    var go = function (i, user) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === current); s.setAttribute('aria-hidden', String(k !== current)); });
      tabs.forEach(function (t, k) { t.classList.toggle('is-active', k === current); t.setAttribute('aria-selected', String(k === current)); });
      if (title) title.textContent = slides[current].dataset.name;
      var tab = tabs[current];
      if (tab && tab.parentNode.scrollWidth > tab.parentNode.clientWidth) {
        tab.parentNode.scrollTo({ left: tab.offsetLeft - 20, behavior: 'smooth' });
      }
      if (user) restart();
    };
    var restart = function () {
      clearTimeout(timer);
      if (prog) prog.cancel();
      if (reduced || gal.dataset.paused) return;
      var bar = tabs[current] && tabs[current].querySelector('i');
      if (bar && bar.animate) prog = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DELAY, easing: 'linear' });
      timer = setTimeout(function () { go(current + 1); restart(); }, DELAY);
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { go(+t.dataset.goto, true); }); });
    gal.addEventListener('pointerenter', function () { gal.dataset.paused = '1'; clearTimeout(timer); if (prog) prog.pause(); });
    gal.addEventListener('pointerleave', function () { delete gal.dataset.paused; restart(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) restart(); else { clearTimeout(timer); if (prog) prog.cancel(); }
      }, { threshold: 0.3 }).observe(gal);
    }

    var lb = $('.lightbox');
    if (lb && lb.showModal) {
      var lbImg = $('img', lb), lbCap = $('figcaption', lb), lbIdx = 0;
      var show = function (i) {
        lbIdx = (i + slides.length) % slides.length;
        var s = slides[lbIdx], theme = root.dataset.theme === 'light' ? 'light' : 'dark';
        var img = s.querySelector('.shot--' + theme);
        lbImg.src = '/assets/img/injara/' + theme + '/' + s.dataset.full + '-1600.webp';
        lbImg.alt = img ? img.alt : '';
        lbCap.textContent = s.dataset.name + ' — ' + (lbIdx + 1) + ' / ' + slides.length;
        lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
      };
      $('.gallery__stage', gal).addEventListener('click', function () {
        show(current); lb.showModal(); if (lenis) lenis.stop();
        gal.dataset.paused = '1'; clearTimeout(timer);
      });
      lb.addEventListener('close', function () { if (lenis) lenis.start(); delete gal.dataset.paused; go(lbIdx, true); });
      lb.addEventListener('click', function (e) {
        var act = e.target.closest('[data-lb]');
        if (act) { var a = act.dataset.lb; if (a === 'close') lb.close(); else show(lbIdx + (a === 'next' ? 1 : -1)); }
        else if (e.target === lb) lb.close();
      });
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') show(lbIdx + 1);
        if (e.key === 'ArrowLeft') show(lbIdx - 1);
      });
    }
  }

  // Sans GSAP : tout reste visible, le site reste pleinement utilisable
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('js');
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);
  if (reduced) root.classList.add('reduced-motion');

  /* ---------------- Défilement doux ---------------- */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -70, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------------- Menu mobile ---------------- */
  var burger = $('.burger');
  var menu = $('#menu-mobile');
  function setMenu(open) {
    if (!burger) return;
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? T.close : T.open);
    menu.setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------------- Ancres internes ---------------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      scrollToTarget(target);
      history.replaceState(null, '', id);
    });
  });

  /* ---------------- Transitions de page (rideau) ---------------- */
  var curtain = $$('.curtain span');
  function curtainOut() {
    if (!curtain.length) return;
    gsap.set(curtain, { scaleY: 1, transformOrigin: 'top' });
    gsap.to(curtain, { scaleY: 0, duration: 0.8, ease: 'expo.inOut', stagger: 0.06, delay: 0.1 });
  }
  if (root.classList.contains('is-entering')) {
    try { sessionStorage.removeItem('uj-t'); } catch (e) {}
    curtainOut();
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) gsap.set(curtain, { scaleY: 0 }); });

  $$('a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    var internalPage = a.hasAttribute('data-transition') ||
      (/^\/(?!\/)/.test(href) && !/\.(xml|txt|pdf)$/.test(href) && href.indexOf('#') === -1 && a.target !== '_blank');
    if (!internalPage || reduced || !curtain.length) return;
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var url = new URL(a.href, location.href);
      if (url.pathname === location.pathname && !url.hash) return;
      e.preventDefault();
      try { sessionStorage.setItem('uj-t', '1'); } catch (err) {}
      gsap.set(curtain, { transformOrigin: 'bottom' });
      gsap.to(curtain, { scaleY: 1, duration: 0.6, ease: 'expo.inOut', stagger: 0.05, onComplete: function () { location.href = a.href; } });
    });
  });

  /* ---------------- Navigation : état au défilement ---------------- */
  var nav = $('.nav');
  var lastY = 0;
  function onScrollNav() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    var menuOpen = document.body.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', !menuOpen && y > 400 && y > lastY + 4);
    if (y < lastY - 4 || y < 400) nav.classList.remove('is-hidden');
    lastY = y;
  }
  if (nav) {
    if (lenis) lenis.on('scroll', onScrollNav); else window.addEventListener('scroll', onScrollNav, { passive: true });
    onScrollNav();
  }

  // Lien actif (créé après les sections épinglées pour des positions justes)
  function initNavSpy() {
    var navLinks = $$('.nav__links a[href^="#"]');
    navLinks.forEach(function (link) {
      var sec = document.getElementById(link.getAttribute('href').slice(1));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: function (self) { if (self.isActive) { navLinks.forEach(function (l) { l.classList.remove('is-active'); }); link.classList.add('is-active'); } else link.classList.remove('is-active'); }
      });
    });
  }

  // Barre de progression
  var bar = $('.progress i');
  if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* ---------------- Curseur personnalisé ---------------- */
  var cursor = $('.cursor');
  if (cursor && finePointer && !reduced) {
    root.classList.add('has-cursor');
    var dot = $('.cursor__dot'), ring = $('.cursor__ring');
    var dx = gsap.quickTo(dot, 'x', { duration: 0.1 }), dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('[data-cursor="view"]');
      cursor.classList.toggle('is-view', !!t);
      cursor.classList.toggle('is-link', !t && !!e.target.closest('a, button, summary, label'));
    });
    document.addEventListener('pointerleave', function () { cursor.classList.add('is-hidden'); });
    document.addEventListener('pointerenter', function () { cursor.classList.remove('is-hidden'); });
  }

  /* ---------------- Boutons magnétiques ---------------- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });

    // Cartes inclinées + halo qui suit le pointeur
    $$('[data-tilt]').forEach(function (el) {
      var rX = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
      var rY = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
        rX((0.5 - py) * 8); rY((px - 0.5) * 10);
      });
      el.addEventListener('pointerleave', function () { rX(0); rY(0); });
    });
  }

  /* ---------------- Animations au défilement ---------------- */
  function initReveals() {
    // Titres : lignes qui montent depuis un masque
    if (window.SplitText && !reduced) {
      $$('[data-split]').forEach(function (el) {
        window.SplitText.create(el, {
          type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self.lines, {
              yPercent: 110, rotate: 2, duration: 1.1, ease: 'expo.out', stagger: 0.09,
              scrollTrigger: { trigger: el, start: 'top 85%', once: true }
            });
          }
        });
      });

      // Manifeste : mots qui s'allument au fil du défilement
      var mf = $('[data-scrub-words]');
      if (mf) {
        var split = window.SplitText.create(mf, { type: 'words', wordsClass: 'w' });
        gsap.to(split.words, {
          opacity: 1, ease: 'none', stagger: 0.1,
          scrollTrigger: { trigger: mf, start: 'top 75%', end: 'bottom 45%', scrub: 0.6 }
        });
      }
    } else {
      $$('[data-scrub-words]').forEach(function (el) { el.classList.add('is-static'); });
    }

    // Éléments génériques
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%', once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: reduced ? 0 : 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true });
      }
    });

    // Compteurs
    $$('[data-count-to]').forEach(function (el) {
      var to = +el.getAttribute('data-count-to'), obj = { v: 0 };
      if (reduced) return;
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () { gsap.to(obj, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(obj.v); } }); }
      });
    });

    if (reduced) return;

    // Parallaxe générique
    $$('[data-parallax]').forEach(function (el) {
      var amt = +el.getAttribute('data-parallax');
      gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Halos du hero
    if ($('.hero')) {
      gsap.to('.hero__glow--a', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__map canvas', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    // Bandeau défilant réactif à la vitesse de scroll
    var track = $('.marquee__track');
    if (track) {
      var group = $('.marquee__group', track);
      for (var i = 0; i < 2; i++) track.appendChild(group.cloneNode(true));
      var loop = gsap.to(track, { xPercent: -100 / 3, ease: 'none', duration: 28, repeat: -1 });
      ScrollTrigger.create({
        trigger: '.marquee', start: 'top bottom', end: 'bottom top',
        onUpdate: function (self) {
          var v = self.getVelocity() / 300;
          gsap.to(loop, { timeScale: (self.direction > 0 ? 1 : -1) * Math.min(5, 1 + Math.abs(v)), duration: 0.3, overwrite: true });
          gsap.to(loop, { timeScale: self.direction > 0 ? 1 : -1, duration: 1.2, delay: 0.3, overwrite: false });
        }
      });
    }

    var mm = gsap.matchMedia();

    // Identité : section épinglée, les 4 symboles s'activent tour à tour
    var idSec = $('.identity');
    if (idSec) {
      var symbols = $$('.symbol', idSec), spots = $$('.hotspot', idSec);
      var setActive = function (i) {
        symbols.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
        spots.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      };
      setActive(0);
      mm.add('(min-width: 1101px)', function () {
        idSec.classList.add('identity--pinned');
        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.identity__pin', start: 'top top', end: '+=260%', pin: true, scrub: 0.8, refreshPriority: 2,
            onUpdate: function (self) { setActive(Math.min(3, Math.floor(self.progress * 4))); }
          }
        });
        tl.fromTo('.identity__logo', { rotate: -4, scale: 0.94 }, { rotate: 4, scale: 1.04, ease: 'none' }, 0)
          .to('.identity__rings', { rotate: 90, ease: 'none' }, 0);
        return function () { idSec.classList.remove('identity--pinned'); };
      });
      mm.add('(max-width: 1100px)', function () {
        var i = 0, id = setInterval(function () { i = (i + 1) % 4; spots.forEach(function (s, k) { s.classList.toggle('is-active', k === i); }); }, 1800);
        return function () { clearInterval(id); };
      });
    }

    // Expertise : défilement horizontal épinglé
    var hs = $('[data-hscroll]');
    if (hs) {
      mm.add('(min-width: 761px)', function () {
        var tr = $('.hscroll__track', hs);
        var dist = function () { return Math.max(0, tr.scrollWidth - window.innerWidth); };
        var tween = gsap.to(tr, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: { trigger: '.expertise', start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1 }
        });
        gsap.to('.hscroll__bar i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.expertise', start: 'top top', end: function () { return '+=' + dist(); }, scrub: true } });
        $$('.service__icon', tr).forEach(function (icon) {
          gsap.from(icon, { scale: 0.6, rotate: -20, opacity: 0, duration: 0.8, ease: 'back.out(2)',
            scrollTrigger: { trigger: icon, containerAnimation: tween, start: 'left 90%', once: true } });
        });
      });
    }

    // Réalisations : bascule d'univers vers les couleurs d'Injara
    var tint = $('.work__tint');
    if (tint && $('#injara')) {
      gsap.timeline({ scrollTrigger: { trigger: '#injara', start: 'top 85%', end: 'bottom 15%', scrub: true } })
        .to(tint, { opacity: 1, duration: 0.3, ease: 'none' })
        .to(tint, { opacity: 1, duration: 0.4 })
        .to(tint, { opacity: 0, duration: 0.3, ease: 'none' });
      gsap.from('#injara .injara-word', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '#injara', start: 'top 75%', once: true } });
    }
    // Captures : la fenêtre se redresse en perspective à l'arrivée
    var frame = $('.gallery__frame');
    if (frame) {
      gsap.fromTo(frame, { rotateX: 14, rotateY: -10, y: 60, scale: 0.94 }, {
        rotateX: 0, rotateY: 0, y: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.gallery', start: 'top 95%', end: 'top 40%', scrub: 0.8 }
      });
      gsap.from('.gallery__tab', { y: 16, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: '.gallery__tabs', start: 'top 92%', once: true } });
    }

    // Méthode : ligne de progression
    var steps = $('[data-steps]');
    if (steps) gsap.to('.steps__line i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 75%', end: 'bottom 55%', scrub: true } });

    // Pied de page : lettres géantes
    if ($('.footer__giant')) gsap.from('.footer__giant span', { yPercent: 100, duration: 1.2, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: '.footer__giant', start: 'top 98%', once: true } });

    // Rangées de communauté
    if ($('.community__grid')) gsap.from('.pillar .ico', { scale: 0, rotate: -45, duration: 0.9, ease: 'back.out(2)', stagger: 0.1, scrollTrigger: { trigger: '.community__grid', start: 'top 70%', once: true } });
  }

  /* ---------------- Hero : intro ---------------- */
  var africa = window.UJ && window.UJ.initAfrica ? window.UJ.initAfrica() : null;
  if (window.UJ && window.UJ.initConstellation) window.UJ.initConstellation();

  function heroIntro() {
    if (africa) africa.start();
    var title = $('.hero__title');
    if (!title) return;
    if (reduced) { gsap.set('[data-hero]', { opacity: 1 }); return; }
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    var lines = $$('.line', title);
    lines.forEach(function (l) { l.style.overflow = 'hidden'; l.style.paddingBottom = '0.06em'; l.style.marginBottom = '-0.06em'; });
    var plain = lines.filter(function (l) { return !l.querySelector('.accent'); });
    var chars = [];
    if (window.SplitText) chars = window.SplitText.create(plain, { type: 'chars', charsClass: 'char' }).chars;
    tl.from(chars.length ? chars : plain, { yPercent: 115, rotate: 6, duration: 1.3, stagger: 0.022 }, 0)
      .from(title.querySelector('.accent'), { yPercent: 115, duration: 1.3 }, 0.35)
      .from('[data-hero]', { opacity: 0, y: 24, duration: 1.1, stagger: 0.12 }, 0.5)
      .from('.nav__bar', { opacity: 0, y: -20, duration: 1 }, 0.4);
    // Reflet animé sur le dégradé
    var acc = title.querySelector('.accent');
    if (acc) {
      acc.style.backgroundSize = '200% 100%';
      gsap.fromTo(acc, { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true });
    }
  }

  /* ---------------- Préchargeur ---------------- */
  function runPreloader(done) {
    var pre = $('.preloader');
    if (!pre) { done(); return; }
    var seen = false;
    try { seen = sessionStorage.getItem('uj-seen') === '1'; sessionStorage.setItem('uj-seen', '1'); } catch (e) {}
    if (reduced || root.classList.contains('is-entering')) { pre.remove(); done(); return; }
    if (lenis) lenis.stop();
    var count = $('[data-count]', pre), obj = { v: 0 };
    var dur = seen ? 0.6 : 1.3;
    var ready = Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(function (r) { gsap.delayedCall(dur, r); })
    ]);
    gsap.from('.preloader__inner', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' });
    gsap.to(obj, { v: 100, duration: dur, ease: 'power2.inOut', onUpdate: function () { count.textContent = String(Math.round(obj.v)).padStart(3, '0'); } });
    gsap.to('.preloader__bar i', { scaleX: 1, duration: dur, ease: 'power2.inOut' });
    gsap.to('.preloader__logo .fill', { clipPath: 'inset(0% 0 0 0)', duration: dur, ease: 'power2.inOut' });
    ready.then(function () {
      var tl = gsap.timeline({ onComplete: function () { pre.remove(); if (lenis) lenis.start(); } });
      tl.to('.preloader__logo', { scale: 1.12, duration: 0.5, ease: 'power2.in' })
        .to('.preloader__inner', { opacity: 0, y: -30, duration: 0.45, ease: 'power2.in' }, '-=0.25')
        .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
        .add(done, '-=0.55');
    });
  }

  function boot() {
    initReveals();
    initNavSpy();
    runPreloader(heroIntro);
    ScrollTrigger.refresh();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else boot();
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  /* ---------------- Formulaire de contact (mailto) ---------------- */
  var form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('[required]', form), ok = true;
      fields.forEach(function (f) {
        var valid = f.value.trim() && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        f.setAttribute('aria-invalid', valid ? 'false' : 'true');
        f.style.borderColor = valid ? '' : '#db7000';
        if (!valid && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;
      var data = new FormData(form);
      var subject = '[Ujamaa] ' + data.get('sujet') + ' — ' + data.get('nom');
      var L = EN ? ['Name', 'Email', 'Organisation', 'Subject'] : ['Nom', 'E-mail', 'Organisation', 'Sujet'];
      var body = [
        L[0] + ' : ' + data.get('nom'),
        L[1] + ' : ' + data.get('email'),
        data.get('organisation') ? L[2] + ' : ' + data.get('organisation') : null,
        L[3] + ' : ' + data.get('sujet'),
        '',
        data.get('message')
      ].filter(function (l) { return l !== null; }).join('\n');
      window.location.href = 'mailto:ujamaatechsolution@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      var note = $('#form-note');
      if (note) note.textContent = T.sent;
    });
  }
})();
