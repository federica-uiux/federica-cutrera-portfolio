// Canvas: the "doppelgänger" chat, on every page. A floating avatar button opens the conversation in a panel. It is scripted, not an AI: preset questions and answers written by Federica,
// plus simple keyword matching on typed questions. Anything it does not cover falls back to LinkedIn. No server, no API.
(function () {
  const it = (document.documentElement.lang || 'it').toLowerCase().startsWith('it');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LINKEDIN = 'https://www.linkedin.com/in/federica-cutrera';
  const link = (href, label) => '<a href="' + href + '"' + (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '') + '>' + label + '</a>';

  // Every fact below comes from the copy already on the site (home, case studies, playground).
  const QA = it ? [
    { id: 'ai', q: 'Come usi l’AI nel lavoro?', keys: /\b(ai|ia|claude|cursor|mcp|intelligenza|llm|prompt|skill|artifact|figma)\b/i,
      a: 'Ho costruito una mia <strong>skill per Claude</strong> sul design system di BonusX, sul tone of voice e sulle mie direttive strategiche e di UX. Parto da lì: progetto già dentro il contesto giusto, su Figma e in Artifact, e porto subito al team qualcosa di concreto su cui discutere. La conversazione cross-team parte prima, il feedback arriva prima e <strong>si rilascia prima</strong>. Per i flussi da testare prototipo con Cursor e Claude. L’AI accorcia la strada; le decisioni restano mie.' },
    { id: 'process', q: 'Come affronti un progetto?', keys: /(process|metod|approcci|ricerca|research|discovery|lavori|workflow|brief|esperiment|a\/b|ab test)/i,
      a: 'Non aspetto sempre un brief. Tengo d’occhio i dati e la strategia di business, e quando vedo un’opportunità sono io a <strong>proporre esperimenti e A/B test</strong>. Che parta da me o da un brief, il metodo è lo stesso: inquadro il problema e il risultato da muovere, faccio ricerca (interviste, usability test, contextual inquiry), prototipo e testo presto. Poi guardo i numeri dopo il rilascio, perché è lì che si capisce se la decisione era giusta.' },
    { id: 'owner', q: 'Di cosa ti prendi la responsabilità?', keys: /(ownership|responsab|ruolo|autonom|guid|owner|decid)/i,
      a: 'Del problema, non solo delle schermate. In BonusX ho avuto in mano il ' + link('case-bonusx.html', 'redesign del profilo') + ' <strong>end-to-end</strong>: discovery con interviste e usability test, flussi dinamici, pattern pensati per scalare e handoff al team di sviluppo, su un prodotto da circa 1M di utenti. Sul ' + link('case-voip-restyle.html', 'progetto VoIP') + ' ero l’<strong>unica designer</strong>, dalla ricerca al prototipo hi-fi.' },
    { id: 'results', q: 'Un risultato concreto?', keys: /(risultat|numer|metric|impatt|kpi|convers|dati)/i,
      a: 'In BonusX gli utenti dovevano rifare intere sezioni di questionario per cambiare un solo dato. Dopo il redesign del profilo: completamento dell’onboarding al <strong>95%</strong>, conversione alle iscrizioni da circa il 5% al 10%, tempo di richiesta fino al 50% in meno sui servizi principali. E le categorie arrivate nei trimestri dopo si sono inserite senza refactor. Qui i dettagli: ' + link('case-bonusx.html', 'BonusX') + ' e ' + link('case-voip-restyle.html', 'VoIP') + '.' },
    { id: 'constraint', q: 'E quando un vincolo blocca la soluzione giusta?', keys: /(vincol|stakeholder|disaccord|conflitt|blocc|compromess|trade)/i,
      a: 'Cambio strada, non obiettivo. Sul ' + link('case-voip-restyle.html', 'progetto VoIP') + ' la ricerca indicava un problema di architettura informativa, ma toccarla non era un’opzione per vincoli tecnici. Ho portato i dati al team di sviluppo e abbiamo risolto lo stesso bisogno da un’altra direzione: una <strong>search bar</strong> e un componente “Recent Activities”, validati nei test. Time on task giù di circa il 45%, ticket di supporto per navigazione <strong>-29,5%</strong>.' },
    { id: 'experience', q: 'Che esperienza hai?', keys: /(esperienz|carriera|cv|anni|background|lavorato|aziend|percorso)/i,
      a: 'Progetto prodotti digitali <strong>dal 2016</strong>. Mobile e-commerce per Panerai in IM*MEDIA, progetti B2B e B2C in Cloudmind, prodotti bancari per UniCredit come consulente e, da giugno 2025, Product Designer + AI in <strong>BonusX</strong>.' },
    { id: 'build', q: 'Sai anche costruire?', keys: /(codice|code|vibecod|costru|svilupp|programm|github|playground|lovable)/i,
      a: 'Sì, e non solo prototipi. Questo portfolio è in produzione e l’ho costruito con <strong>Claude Code</strong>. ' + link('https://bollibelli.lovable.app/', 'Bollibelli') + ', un calcolatore di francobolli nato da un mio bisogno da Postcrossing, l’ho fatto con <strong>Lovable</strong> e condiviso con la community. Li trovi nel ' + link('playground.html', 'playground') + '.' },
  ] : [
    { id: 'ai', q: 'How do you use AI at work?', keys: /\b(ai|claude|cursor|mcp|llm|prompt|intelligence|skill|artifacts?|figma)\b/i,
      a: 'I built my own <strong>Claude skill</strong> on the BonusX design system, the tone of voice and my strategic and UX guidelines. I start from there: I design inside the right context from the first draft, in Figma and in Artifacts, and bring the team something concrete to discuss straight away. The cross-team conversation starts sooner, feedback comes sooner and <strong>we ship sooner</strong>. For flows that need testing I prototype with Cursor and Claude. AI shortens the path; the decisions stay mine.' },
    { id: 'process', q: 'How do you approach a project?', keys: /(process|method|approach|research|discovery|workflow|how do you work|brief|experiment|a\/b|ab test)/i,
      a: 'I don’t always wait for a brief. I keep an eye on the data and the business strategy, and when I see an opportunity I’m the one who <strong>proposes experiments and A/B tests</strong>. Whether it starts from me or from a brief, the method is the same: I frame the problem and the outcome to move, do the research (interviews, usability tests, contextual inquiry), prototype and test early. Then I look at the numbers after release, because that is where you learn whether the decision was right.' },
    { id: 'owner', q: 'What do you take ownership of?', keys: /(ownership|responsib|role|autonom|lead|owner|decide)/i,
      a: 'The problem, not just the screens. At BonusX I owned the ' + link('case-bonusx-en.html', 'profile redesign') + ' <strong>end-to-end</strong>: discovery with interviews and usability tests, dynamic flows, patterns built to scale and handoff to the dev team, on a product with about 1M users. On the ' + link('case-voip-restyle-en.html', 'VoIP project') + ' I was the <strong>sole designer</strong>, from research to the hi-fi prototype.' },
    { id: 'results', q: 'A concrete result?', keys: /(result|number|metric|impact|kpi|conversion|outcome|data)/i,
      a: 'At BonusX, users had to redo whole questionnaire sections to change a single detail. After the profile redesign: onboarding completion at <strong>95%</strong>, sign-up conversion from about 5% to 10%, request time down by up to 50% on the main services. And the categories that arrived in later quarters slotted in without refactors. Details here: ' + link('case-bonusx-en.html', 'BonusX') + ' and ' + link('case-voip-restyle-en.html', 'VoIP') + '.' },
    { id: 'constraint', q: 'What if a constraint blocks the right solution?', keys: /(constraint|stakeholder|disagree|conflict|block|trade|pushback)/i,
      a: 'I change the route, not the goal. On the ' + link('case-voip-restyle-en.html', 'VoIP project') + ', research pointed to an information architecture problem, but touching it was off the table for technical reasons. I took the data to the dev team and we solved the same need from another direction: a <strong>search bar</strong> and a “Recent Activities” component, both validated in testing. Time on task down by about 45%, navigation support tickets <strong>-29.5%</strong>.' },
    { id: 'experience', q: 'What is your experience?', keys: /(experience|career|cv|resume|years|background|worked|companies)/i,
      a: 'I have been designing digital products <strong>since 2016</strong>. Mobile e-commerce for Panerai at IM*MEDIA, B2B and B2C projects at Cloudmind, banking products for UniCredit as a consultant and, since June 2025, Product Designer + AI at <strong>BonusX</strong>.' },
    { id: 'build', q: 'Can you build too?', keys: /(code|vibecod|build|develop|program|github|playground|lovable|ship)/i,
      a: 'Yes, and not only prototypes. This portfolio is live and I built it with <strong>Claude Code</strong>. ' + link('https://bollibelli.lovable.app/', 'Bollibelli') + ', a stamp calculator born from my own Postcrossing habit, I made with <strong>Lovable</strong> and shared with the community. Both are in the ' + link('playground-en.html', 'playground') + '.' },
  ];
  const T = it
    ? { title: 'Chatta con la mia doppelgänger', group: 'Domande suggerite', contactChip: 'Altro? Contattami', contactQ: 'Vorrei chiederti altro', you: 'tu', close: 'Chiudi la chat', label: 'oppure scrivi la tua domanda', send: 'invia',
        hello: 'Ciao! Sono la doppelgänger di Federica. Le risposte le ha scritte lei, io le consegno solo più in fretta. Scegli una domanda qui sotto o scrivine una tua.',
        fallback: 'Questa è una domanda per la Federica vera. Scrivile su LinkedIn: risponde lei, senza copione.', cta: 'scrivimi su linkedin' }
    : { title: 'Chat with my doppelgänger', group: 'Suggested questions', contactChip: 'Something else? Contact me', contactQ: 'I’d like to ask something else', you: 'you', close: 'Close the chat', label: 'or type your own question', send: 'send',
        hello: 'Hi! I’m Federica’s doppelgänger. She wrote the answers, I just deliver them faster. Pick a question below or type your own.',
        fallback: 'That one is for the real Federica. Message her on LinkedIn: she answers herself, no script.', cta: 'message me on linkedin' };

  // ---- UI: a floating avatar button in the corner opens a panel with its own scroll, so pages never grow.
  // Any element with [data-chat-open] (the CTA in the About thread) opens the same panel.
  const avatar = 'sketch-upscaled.png';
  const title = T.title;
  const mobile = matchMedia('(max-width: 767px)');
  let busy = false, lastFocus = null;

  const panel = document.createElement('aside');
  panel.className = 'chat-panel';
  panel.id = 'chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', title);
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML =
    '<header class="chat-head"><div class="avatar twin"><img src="' + avatar + '" alt=""></div><h2></h2>' +
    '<button class="chat-close" type="button"><i class="ph ph-x" aria-hidden="true"></i></button></header>' +
    '<div class="chat-log" aria-live="polite" data-lenis-prevent></div>' +
    '<div class="chat-foot">' +
    '<form class="chat-form"><label for="chat-input"></label><div class="chat-field">' +
    '<input id="chat-input" type="text" autocomplete="off" maxlength="200">' +
    '<button class="btn btn-primary" type="submit"><span></span> <i class="ph ph-arrow-up" aria-hidden="true"></i></button></div></form></div>';
  document.body.appendChild(panel);
  panel.querySelector('h2').textContent = title;
  panel.querySelector('.chat-close').setAttribute('aria-label', T.close);
  panel.querySelector('label').textContent = T.label;
  panel.querySelector('.chat-form .btn span').textContent = T.send;
  const log = panel.querySelector('.chat-log');
  // suggested questions live inside the conversation, wrapped on as many lines as they need, always after the last message
  const chips = document.createElement('div');
  chips.className = 'chips';
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', T.group);
  let anchor = null; // the visitor's latest question: each exchange is scrolled to start from it
  const form = panel.querySelector('.chat-form');
  const input = panel.querySelector('input');
  const bottom = () => { log.appendChild(chips); log.scrollTop = anchor ? anchor.offsetTop - 12 : 0; };

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'chat-fab';
  fab.setAttribute('aria-label', title);
  fab.setAttribute('aria-controls', 'chat-panel');
  fab.innerHTML = '<span class="avatar twin"><img src="' + avatar + '" alt=""></span><i class="ph-fill ph-chat-circle-dots" aria-hidden="true"></i>';
  document.body.appendChild(fab);

  function open(from) {
    if (panel.classList.contains('open')) return;
    lastFocus = from || document.activeElement;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    fab.classList.add('away');
    if (mobile.matches) document.documentElement.classList.add('chat-lock');
    else input.focus({ preventScroll: true });
    if (!log.children.length) twin(T.hello, false, true);
  }
  function close() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    fab.classList.remove('away');
    document.documentElement.classList.remove('chat-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  panel.querySelector('.chat-close').addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });
  fab.addEventListener('click', () => open(fab));
  document.querySelectorAll('[data-chat-open]').forEach((el) => el.addEventListener('click', () => open(el)));

  // the panel can be moved around by its header, like any other layer on the canvas
  if (window.gsap && window.Draggable && !mobile.matches) {
    gsap.registerPlugin(Draggable);
    Draggable.create(panel, { trigger: panel.querySelector('.chat-head'), bounds: window, dragClickables: false });
  }

  function ask(text) {
    const row = document.createElement('div');
    row.className = 'msg msg-you';
    const bubble = document.createElement('p');
    bubble.className = 'bubble';
    bubble.textContent = text; // typed text is never parsed as HTML
    const tag = document.createElement('span');
    tag.className = 'msg-tag';
    tag.textContent = T.you;
    row.append(bubble, tag);
    log.appendChild(row);
    anchor = row;
    bottom();
  }

  function twin(html, withContact, instant) {
    const row = document.createElement('div');
    row.className = 'comment msg-twin';
    row.innerHTML = '<div class="avatar twin"><img src="' + avatar + '" alt=""></div><div class="bubble"><span class="typing" aria-hidden="true"><i></i><i></i><i></i></span></div>';
    log.appendChild(row);
    bottom();
    const fill = () => {
      row.querySelector('.bubble').innerHTML = '<p>' + html + '</p>' + (withContact
        ? '<a class="btn btn-primary" href="' + LINKEDIN + '" target="_blank" rel="noopener">' + T.cta + ' <i class="ph ph-arrow-up-right" aria-hidden="true"></i></a>' : '');
      busy = false;
      bottom();
    };
    if (reduce || instant) fill(); else { busy = true; setTimeout(fill, 850); }
  }

  function reply(item, typed) {
    if (busy) return;
    ask(typed || item.q);
    twin(item.a, false);
    document.querySelectorAll('.chip[data-id="' + item.id + '"]').forEach((c) => c.remove());
  }
  function contact(typed) {
    if (busy) return;
    ask(typed || T.contactQ);
    twin(T.fallback, true);
  }

  // quick replies inside the panel; a used question disappears
  QA.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.id = item.id; b.textContent = item.q;
    b.addEventListener('click', () => reply(item));
    chips.appendChild(b);
  });
  const more = document.createElement('button');
  more.type = 'button'; more.className = 'chip chip-contact'; more.textContent = T.contactChip;
  more.addEventListener('click', () => contact());
  chips.appendChild(more);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
    const hit = QA.find((item) => item.keys.test(text));
    if (hit) reply(hit, text); else contact(text);
  });
})();
