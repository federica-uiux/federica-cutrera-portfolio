// Canvas: behaviour shared by every page. Page scripts (home.js) register extra work with Kit.onReady().
// GSAP + ScrollTrigger are required for motion; without them (or with reduced motion) pages stay static and fully readable.
window.Kit = (function () {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ok = !!(window.gsap && window.ScrollTrigger) && !reduce;
  const italian = (root.lang || 'it').toLowerCase().startsWith('it');
  const hooks = [];
  let lenis = null;

  if (window.gsap) {
    ['ScrollTrigger', 'SplitText', 'Draggable', 'InertiaPlugin'].forEach((p) => { if (window[p]) gsap.registerPlugin(window[p]); });
  }

  // ---- theme: the new theme opens as a circle from the toggle (View Transitions API), plain swap as fallback
  function theme() {
    const btn = document.getElementById('theme-switch');
    if (!btn) return;
    const sync = () => { btn.textContent = root.dataset.theme === 'dark' ? 'light' : 'dark'; };
    sync();
    btn.addEventListener('click', () => {
      const apply = () => {
        root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
        sync();
      };
      if (reduce || !document.startViewTransition) { apply(); return; }
      const r = btn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(apply).ready.then(() => {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(() => {});
    });
  }

  // ---- language: clicking the toggle is an explicit choice, so it overrides the first-visit detection
  function language() {
    document.querySelectorAll('.lang-toggle').forEach((a) => a.addEventListener('click', () => {
      try { localStorage.setItem('lang', a.getAttribute('lang') || 'it'); } catch (e) {}
    }));
  }

  // ---- mobile menu
  function menu() {
    const hamburger = document.getElementById('hamburger');
    const links = document.getElementById('nav-links');
    if (!hamburger || !links) return;
    const setOpen = (open) => {
      links.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.textContent = open ? hamburger.dataset.close || 'chiudi' : 'menu';
    };
    hamburger.addEventListener('click', () => setOpen(!links.classList.contains('open')));
    links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  // ---- simple scroll reveal for [data-reveal] (CSS does the transition)
  function reveal() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((el) => io.observe(el));
  }

  // ---- visitor cursor: same arrow + name tag as the other collaborators ("tu" / "you" by page language).
  // The arrow replaces the system cursor only over plain canvas; wherever an element asks for its own cursor
  // (links, buttons, handles, draggable layers) the system one comes back and only the tag keeps following.
  function visitorCursor() {
    const you = document.getElementById('cur-you');
    if (!you || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    you.querySelector('span').textContent = italian ? 'tu' : 'you';
    root.classList.add('has-you');
    addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      you.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      you.classList.add('live');
    }, { passive: true });
    addEventListener('pointerover', (e) => {
      if (e.target instanceof Element) you.classList.toggle('native', getComputedStyle(e.target).cursor !== 'none');
    }, { passive: true });
    root.addEventListener('pointerleave', () => you.classList.remove('live'));
    addEventListener('blur', () => you.classList.remove('live'));
  }

  // ---- resizable frames: anything with [data-resize] can be resized from its corner handles, like on a canvas.
  // Width is a percentage of the parent, clamped between data-min and 100; the content reflows inside.
  // (The three project frames on the home have their own coupled version in home.js, same gestures.)
  function resizable() {
    const mq = matchMedia('(min-width: 768px)');
    document.querySelectorAll('[data-resize]').forEach((el) => {
      const min = Number(el.dataset.min || 50), max = 100;
      const dim = el.querySelector('.dim'), slider = el.querySelector('[role="slider"]');
      const pct = () => (el.offsetWidth / el.parentElement.clientWidth) * 100;
      let v = null; // null = natural size, untouched
      const label = () => {
        const r = el.getBoundingClientRect(), cur = v === null ? pct() : v;
        const flag = cur <= min + 0.05 ? ' min' : cur >= max - 0.05 ? ' max' : '';
        if (dim) dim.textContent = Math.round(r.width) + ' × ' + Math.round(r.height) + flag;
        if (slider) { slider.setAttribute('aria-valuemin', min); slider.setAttribute('aria-valuenow', Math.round(cur)); }
      };
      const set = (n) => { v = Math.min(max, Math.max(min, n)); el.style.setProperty('--w', v.toFixed(3)); el.classList.add('sized'); label(); };
      const reset = () => { v = null; el.classList.remove('sized'); el.style.removeProperty('--w'); label(); };
      const settle = () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); };
      el.addEventListener('pointerenter', label);
      el.querySelectorAll('.grip').forEach((h) => {
        const sx = h.classList.contains('tl') || h.classList.contains('bl') ? -1 : 1;
        h.addEventListener('pointerdown', (e) => {
          if (!mq.matches || e.button > 0) return;
          e.preventDefault(); e.stopPropagation();
          try { h.setPointerCapture(e.pointerId); } catch (err) {}
          const x0 = e.clientX, w0 = pct(), W = el.parentElement.clientWidth;
          el.classList.add('resizing');
          const move = (ev) => set(w0 + ((sx * (ev.clientX - x0)) / W) * 100);
          const up = () => {
            h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
            el.classList.remove('resizing'); settle();
          };
          h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
        });
        // handles can sit inside a link or a zoom button: never let them trigger it
        h.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
        h.addEventListener('dblclick', (e) => { e.preventDefault(); e.stopPropagation(); reset(); settle(); });
        h.addEventListener('keydown', (e) => {
          const step = { ArrowRight: 2, ArrowUp: 2, ArrowLeft: -2, ArrowDown: -2 }[e.key];
          if (!step || !mq.matches) return;
          e.preventDefault(); set(pct() + step); settle();
        });
      });
    });
  }

  // ---- screenshots open in a lightbox
  function lightbox() {
    const shots = document.querySelectorAll('.shot-btn');
    if (!shots.length) return;
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('data-lenis-prevent', ''); // the overlay scrolls on its own, outside the smooth-scroll
    box.innerHTML = '<img alt=""><button class="lightbox-close" type="button" aria-label="' + (italian ? 'Chiudi' : 'Close') + '"><i class="ph ph-x" aria-hidden="true"></i></button>';
    document.body.appendChild(box);
    const img = box.querySelector('img');
    let opener = null;
    const close = () => { box.classList.remove('open'); if (lenis) lenis.start(); if (opener) opener.focus(); };
    shots.forEach((btn) => btn.addEventListener('click', () => {
      const src = btn.querySelector('img');
      img.src = src.src; img.alt = src.alt; opener = btn;
      box.classList.add('open');
      box.scrollTop = 0;
      if (lenis) lenis.stop();
    }));
    box.addEventListener('click', close);
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('open')) close(); });
  }

  // ---- smooth scroll, synced with ScrollTrigger; in-page anchors are routed through it
  function smooth() {
    if (!window.Lenis) return;
    lenis = new Lenis({ lerp: 0.11 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = id.length > 1 && document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -40 });
      });
    });
  }

  // ---- motion shared by all pages; each block only runs if its elements exist
  function common() {
    const desktop = matchMedia('(min-width: 768px)').matches;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

    // nav slides away on scroll down, returns on scroll up
    const bar = document.getElementById('nav-bar');
    if (bar) ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => bar.classList.toggle('away', self.direction === 1 && self.scroll() > 240) });

    // buttons lean toward the pointer
    if (fine) {
      gsap.utils.toArray('.magnetic').forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
        });
        el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });
    }

    // inner-page hero: the frame is drawn, the title is typed in, then the rest arrives (same gesture as the home)
    gsap.utils.toArray('.frame[data-draw]').forEach((frame) => {
      const h1 = frame.querySelector('h1');
      const words = window.SplitText ? SplitText.create(h1, { type: 'words' }).words : [h1];
      const rest = gsap.utils.toArray('#hero [data-intro]').filter((el) => el !== frame);
      gsap.set('[data-intro]', { opacity: 1 });
      gsap.timeline({ defaults: { ease: 'power3.inOut' } })
        .fromTo(frame, { clipPath: 'inset(-32px 100% 100% -8px)' }, { clipPath: 'inset(-32px -8px -8px -8px)', duration: 0.9 })
        .from(words, { opacity: 0, duration: 0.01, stagger: 0.04, ease: 'none' }, 0.4)
        .from(rest, { opacity: 0, y: 24, duration: 0.8, stagger: 0.12, ease: 'power3.out' }, 0.9);
    });

    // layers, notes and pins can be picked up and thrown inside their section
    if (window.Draggable) {
      let z = 2;
      gsap.utils.toArray('.drag').forEach((el) => {
        Draggable.create(el, {
          bounds: el.closest('[data-bounds]') || document.body, inertia: !!window.InertiaPlugin, edgeResistance: 0.75,
          onPress() { gsap.set(el, { zIndex: ++z }); gsap.to(el, { scale: 1.04, duration: 0.2 }); },
          onRelease() { gsap.to(el, { scale: 1, duration: 0.3 }); },
        });
      });
    }

    // notes and pins get tossed in from the sides
    gsap.utils.toArray('[data-toss]').forEach((group) => {
      gsap.from(group.querySelectorAll('.toss'), {
        opacity: 0, x: (i) => (i % 2 ? 1 : -1) * (desktop ? 260 : 50), rotation: (i) => (i % 2 ? 28 : -22),
        duration: 1.1, stagger: 0.12, ease: 'back.out(1.2)', scrollTrigger: { trigger: group, start: 'top 78%', once: true },
      });
    });

    // process lists: the rail fills with the scroll and each step lights up when reached
    gsap.utils.toArray('.railed').forEach((list) => {
      ScrollTrigger.create({ trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: true, onUpdate: (self) => list.style.setProperty('--p', self.progress.toFixed(4)) });
      gsap.utils.toArray(list.children).forEach((item) => {
        ScrollTrigger.create({ trigger: item, start: 'top 62%', onEnter: () => item.classList.add('on'), onLeaveBack: () => item.classList.remove('on') });
      });
    });

    // screenshots land like frames dropped on the canvas
    gsap.utils.toArray('.shot').forEach((shot) => {
      gsap.from(shot, { opacity: 0, y: 50, scale: 0.94, duration: 1, ease: 'back.out(1.2)', scrollTrigger: { trigger: shot, start: 'top 88%', once: true } });
    });

    // footer: the closing line gets framed and selected
    if (document.getElementById('footer-frame')) {
      gsap.timeline({ scrollTrigger: { trigger: '#footer-frame', start: 'top 82%', once: true } })
        .fromTo('#footer-frame', { clipPath: 'inset(-32px 100% 100% -8px)' }, { clipPath: 'inset(-32px -8px -8px -8px)', duration: 1, ease: 'power3.inOut' })
        .to('#footer-tagline em', { backgroundSize: '100% 100%', duration: 0.6, ease: 'power3.inOut' }, '-=0.2');
    }
  }

  function boot() {
    theme(); language(); menu(); reveal(); visitorCursor(); resizable(); lightbox();
    if (!ok) { root.classList.remove('intro-pending'); return; }
    smooth();
    // fonts.ready can resolve before the stylesheet has requested anything, so wait for the load event first; cap the wait at 2.5s
    const loaded = new Promise((res) => { if (document.readyState === 'complete') res(); else addEventListener('load', res, { once: true }); });
    const fonts = loaded.then(() => (document.fonts && document.fonts.ready) || null);
    Promise.race([fonts, new Promise((res) => setTimeout(res, 2500))]).then(() => {
      root.classList.remove('intro-pending');
      hooks.forEach((fn) => fn());
      common();
      ScrollTrigger.refresh();
    });
  }
  // scripts sit at the end of <body>, so page scripts loaded after this one register before boot runs
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);

  return { reduce, ok, italian, onReady: (fn) => hooks.push(fn) };
})();
