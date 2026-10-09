// Canvas: homepage only. Resizable project frames, the cursor-driven intro, and the scroll choreography of the home sections.
(function () {
  // ---- Resizable project frames (works without the motion libraries too) ----
  // Widths are percentages of the row. A and B share a row: each can go from MIN to (row - gap - MIN),
  // and growing one pushes the other so the pair always fits. C (its own row) goes from 50% to 100%.
  const Resize = (function () {
    const wrap = document.querySelector('.boards');
    const mq = matchMedia('(min-width: 768px)');
    const els = {}; wrap.querySelectorAll('[data-board]').forEach((el) => { els[el.dataset.board] = el; });
    const def = { a: 54, b: 37, c: 100 }, s = Object.assign({}, def);
    const MIN = 30, MIN_C = 50;
    const api = { touched: false, s, els, wrap };
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const limit = () => 100 - ((parseFloat(getComputedStyle(wrap).columnGap) || 0) / wrap.clientWidth) * 100 - 0.3;
    const range = (k) => (k === 'c' ? [MIN_C, 100] : [MIN, limit() - MIN]);
    function apply() {
      Object.keys(els).forEach((k) => {
        const el = els[k];
        el.style.setProperty('--w', s[k].toFixed(3));
        const box = el.querySelector('.board-art') || el;
        const r = box.getBoundingClientRect();
        const [lo, hi] = range(k);
        const flag = s[k] <= lo + 0.05 ? ' min' : s[k] >= hi - 0.05 ? ' max' : '';
        el.querySelector('.dim').textContent = Math.round(r.width) + ' × ' + Math.round(r.height) + flag;
        const slider = el.querySelector('[role="slider"]');
        slider.setAttribute('aria-valuemin', Math.round(lo));
        slider.setAttribute('aria-valuemax', Math.round(hi));
        slider.setAttribute('aria-valuenow', Math.round(s[k]));
      });
    }
    api.set = function (k, v) {
      const [lo, hi] = range(k);
      s[k] = clamp(v, lo, hi);
      if (k !== 'c') { const o = k === 'a' ? 'b' : 'a', L = limit(); if (s[k] + s[o] > L) s[o] = L - s[k]; }
      apply();
    };
    // keep the pair inside the row when the window changes size
    api.fit = function () {
      const L = limit(), over = s.a + s.b - L;
      if (over > 0) { const ra = s.a - MIN, rb = s.b - MIN, t = ra + rb || 1; s.a -= (over * ra) / t; s.b -= (over * rb) / t; }
      apply();
    };
    api.reset = function () { Object.assign(s, def); api.fit(); };
    const settle = () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); };

    wrap.querySelectorAll('.grip').forEach((h) => {
      const el = h.closest('[data-board]'), k = el.dataset.board;
      const sx = h.classList.contains('tl') || h.classList.contains('bl') ? -1 : 1;
      const bottom = h.classList.contains('bl') || h.classList.contains('br');
      h.addEventListener('pointerdown', (e) => {
        if (!mq.matches || e.button > 0) return;
        e.preventDefault(); e.stopPropagation();
        try { h.setPointerCapture(e.pointerId); } catch (err) {}
        api.touched = true;
        const x0 = e.clientX, y0 = e.clientY, w0 = s[k], W = wrap.clientWidth;
        el.classList.add('resizing');
        const move = (ev) => {
          let d = sx * (ev.clientX - x0);
          if (bottom && k !== 'c') { const dy = (ev.clientY - y0) * 1.6; if (Math.abs(dy) > Math.abs(d)) d = dy; }
          api.set(k, w0 + (d / W) * 100);
        };
        const up = () => {
          h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
          el.classList.remove('resizing'); settle();
        };
        h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
      });
      // a handle sits inside the project link: never let it trigger navigation
      h.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
      h.addEventListener('dblclick', (e) => { e.preventDefault(); e.stopPropagation(); api.reset(); settle(); });
      h.addEventListener('keydown', (e) => {
        const step = { ArrowRight: 2, ArrowUp: 2, ArrowLeft: -2, ArrowDown: -2 }[e.key];
        if (!step || !mq.matches) return;
        e.preventDefault(); api.touched = true; api.set(k, s[k] + step); settle();
      });
    });
    addEventListener('resize', api.fit);
    addEventListener('load', api.fit);
    api.fit();
    return api;
  })();

  Kit.onReady(() => {
    const desktop = matchMedia('(min-width: 768px)').matches;
    const hero = document.getElementById('hero');
    const frame = document.getElementById('frame');
    const headline = document.getElementById('headline');
    const em = headline.querySelector('em');
    const sub = document.querySelector('.sub');
    const curF = document.getElementById('cur-f');
    const curAI = document.getElementById('cur-ai');
    // point inside an element, in hero coordinates (fx, fy are 0..1 fractions of its box)
    const at = (el, fx, fy) => {
      const r = el.getBoundingClientRect(), h = hero.getBoundingClientRect();
      return { x: r.left - h.left + r.width * fx, y: r.top - h.top + r.height * fy };
    };

    gsap.set('[data-intro]', { opacity: 1 });
    const words = window.SplitText ? SplitText.create(headline, { type: 'words' }).words : [headline];
    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });

    // 1. Intro: "federica" drags out the frame, the headline is typed in, the key phrase gets selected,
    //    then "ai" drops in the supporting copy. The page is composed in front of the visitor (storytelling).
    if (desktop) {
      // every stop is measured up front, so the sequence cannot drift if frames are dropped
      // the selected phrase can wrap: start at the beginning of its first line, end just past its last line
      const lines = em.getClientRects(), h0 = hero.getBoundingClientRect();
      const first = lines[0], last = lines[lines.length - 1];
      const e0 = { x: first.left - h0.left, y: first.top - h0.top + first.height * 0.6 };
      const e1 = { x: last.right - h0.left + 6, y: last.top - h0.top + last.height * 0.75 };
      const a = at(frame, 0, 0), b = at(frame, 1, 1), s0 = at(sub, 0.9, 0.5);
      tl.set(curF, { x: a.x - 60, y: a.y - 40 })
        .to(curF, { opacity: 1, x: a.x, y: a.y, duration: 0.5 })
        .fromTo(frame, { clipPath: 'inset(-32px 100% 100% -8px)' }, { clipPath: 'inset(-32px -8px -8px -8px)', duration: 0.9 }, 'draw')
        .to(curF, { x: b.x, y: b.y, duration: 0.9 }, 'draw')
        .from(words, { opacity: 0, duration: 0.01, stagger: 0.045, ease: 'none' }, 'draw+=0.5')
        .to(curF, { x: e0.x, y: e0.y, duration: 0.5 }, '>-0.1')
        .add('select', '+=0.05')
        .to(em, { backgroundSize: '100% 100%', duration: 0.6 }, 'select')
        .to(curF, { x: e1.x, y: e1.y, duration: 0.6 }, 'select')
        .set(curAI, { x: hero.offsetWidth * 0.55, y: s0.y + 120 }, 'select')
        .to(curAI, { opacity: 1, x: s0.x, y: s0.y, duration: 0.7 }, 'select+=0.2')
        .from(sub, { opacity: 0, y: 16, duration: 0.6, ease: 'power3.out' }, '>-0.25')
        .from('.cta .btn', { opacity: 0, scale: 0.8, duration: 0.5, stagger: 0.08, ease: 'back.out(2)' }, '>-0.3')
        .from('.pile .layer', { opacity: 0, y: 80, rotation: () => gsap.utils.random(-20, 20), duration: 0.9, stagger: 0.1, ease: 'back.out(1.4)' }, 'draw+=0.3')
        .add(() => {
          // afterwards the two cursors idle with a slow drift
          [curF, curAI].forEach((c, i) => gsap.to(c, { x: '+=' + (i ? -26 : 30), y: '+=' + (i ? 18 : -14), duration: 3 + i, ease: 'sine.inOut', repeat: -1, yoyo: true }));
        });
    } else {
      tl.from(words, { opacity: 0, duration: 0.01, stagger: 0.04, ease: 'none' })
        .to(em, { backgroundSize: '100% 100%', duration: 0.6 })
        .from('.sub, .cta .btn, .pile .layer', { opacity: 0, y: 20, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, '<');
    }

    // 2. Artboards land on the canvas one after the other, the second one drifts for depth
    gsap.utils.toArray('.board').forEach((board, i) => {
      gsap.from(board, { opacity: 0, y: 70, scale: 0.9, rotation: i ? 3 : -3, duration: 1, ease: 'back.out(1.3)', scrollTrigger: { trigger: board, start: 'top 88%', once: true } });
    });
    if (desktop) gsap.to('.board.low', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.boards', start: 'top bottom', end: 'bottom top', scrub: true } });

    // 3. A cursor shows the frames can be resized: it grabs a corner, stretches the first project, lets go.
    //    Skipped as soon as the visitor resizes something themselves.
    if (desktop) {
      ScrollTrigger.create({
        trigger: '.boards', start: 'top 50%', once: true,
        onEnter: () => {
          if (Resize.touched) return;
          const cur = document.getElementById('cur-work'), A = Resize.els.a, grip = A.querySelector('.grip.br');
          const p = () => { const r = grip.getBoundingClientRect(), w = Resize.wrap.getBoundingClientRect(); return { x: r.left - w.left + 3, y: r.top - w.top + 3 }; };
          const o = { v: Resize.s.a }, base = o.v;
          const follow = () => { Resize.set('a', o.v); gsap.set(cur, p()); };
          const demo = gsap.timeline({ delay: 1, onUpdate: () => { if (Resize.touched) { demo.kill(); A.classList.remove('resizing'); gsap.to(cur, { opacity: 0, duration: 0.2 }); } } });
          demo.set(cur, { x: p().x + 90, y: p().y + 70 })
            .to(cur, { opacity: 1, x: () => p().x, y: () => p().y, duration: 0.7, ease: 'power3.out' })
            .add(() => A.classList.add('resizing'))
            .to(o, { v: base + 4.5, duration: 0.8, ease: 'power2.inOut', onUpdate: follow }, '+=0.15')
            .to(o, { v: base, duration: 0.8, ease: 'power2.inOut', onUpdate: follow }, '+=0.2')
            .add(() => { A.classList.remove('resizing'); ScrollTrigger.refresh(); })
            .to(cur, { opacity: 0, x: '+=40', y: '+=30', duration: 0.5, ease: 'power2.in' }, '+=0.2');
        },
      });
    }

    // 4. Comments pop in like a thread being written
    gsap.from('.comment', { opacity: 0, scale: 0.6, duration: 0.6, stagger: 0.22, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.thread', start: 'top 75%', once: true } });

    // 5. Version history: the rail fills with the scroll and each version lights up when reached (progress)
    gsap.fromTo('#rail-fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#history', start: 'top 62%', end: 'bottom 62%', scrub: true } });
    gsap.utils.toArray('#history article').forEach((row) => {
      ScrollTrigger.create({ trigger: row, start: 'top 62%', onEnter: () => row.classList.add('on'), onLeaveBack: () => row.classList.remove('on') });
    });
  });
})();
