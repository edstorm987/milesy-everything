/* Aqua AI launcher + chat panel for the Incubator surface.
   Loads `aqua-ai.js` first (window.AquaAI). Per-tab session via
   `aqua.ai.session.<sid>` localStorage key (created on first open;
   cleared on session close — actually persists across reloads of the
   same tab/session, per prompt's "scoped per session" wording — we
   take that to mean per-localStorage-namespace, not per-tab).
   Cross-session memory NOT in scope (per prompt). */
(function () {
  if (!window.AquaAI) return; // aqua-ai.js must load first

  var SESSION_KEY = 'aqua.ai.session.incubator';

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]') || []; }
    catch (e) { return []; }
  }
  function writeHistory(arr) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(arr.slice(-40))); } catch (e) {}
  }
  function clearHistory() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  function renderActions(actions) {
    if (!actions || !actions.length) return '';
    return '<div class="inc-ai-chips">' + actions.map(function (a) {
      var href = a.href || '#';
      var ext = a.kind === 'human' ? ' target="_blank" rel="noopener"' : '';
      return '<a class="inc-ai-chip inc-ai-chip--' + (a.kind || 'open') + '" href="' + escape(href) + '"' + ext + ' data-ai-chip>' + escape(a.label) + '</a>';
    }).join('') + '</div>';
  }

  function renderEmpty() {
    /* R023 — preset prompt library replaces the static starter list
       when AquaAIPrompts is loaded; falls back to AquaAI.starters
       when not (back-compat). */
    if (window.AquaAIPrompts && window.AquaAIPrompts.CATEGORIES) {
      var cats = window.AquaAIPrompts.CATEGORIES;
      return '<div class="inc-ai-empty">' +
        '<p><strong>Hi — I\'m Aqua.</strong> ' + escape(window.AquaAI.disclaimer) + '</p>' +
        '<p class="inc-ai-empty-lead">Pick a category — or just type your question.</p>' +
        '<div class="inc-ai-cats" data-ai-cats>' +
        cats.map(function (c) {
          return '<button type="button" class="inc-ai-cat" data-ai-cat="' + escape(c.id) + '"><span>' + escape(c.icon) + '</span> ' + escape(c.label) + '</button>';
        }).join('') +
        '</div>' +
        '<div class="inc-ai-cat-prompts" data-ai-cat-prompts hidden></div>' +
      '</div>';
    }
    var s = window.AquaAI.starters || [];
    return '<div class="inc-ai-empty">' +
      '<p><strong>Hi — I\'m Aqua.</strong> ' + escape(window.AquaAI.disclaimer) + '</p>' +
      '<div class="inc-ai-starters">' +
      s.map(function (q) { return '<button type="button" class="inc-ai-starter" data-ai-starter="' + escape(q) + '">' + escape(q) + '</button>'; }).join('') +
      '</div></div>';
  }
  function renderCategoryPrompts(catId) {
    var prompts = (window.AquaAIPrompts && window.AquaAIPrompts.byCategory(catId)) || [];
    if (!prompts.length) return '';
    return '<p class="inc-ai-cat-head">Pick a question — or type your own:</p>' +
      prompts.map(function (p) {
        return '<button type="button" class="inc-ai-starter" data-ai-prompt="' + escape(p.text) + '" data-ai-prompt-kind="' + escape(p.kind) + '" data-ai-prompt-cat="' + escape(catId) + '">' + escape(p.text) + '</button>';
      }).join('');
  }

  function renderHistory(hist) {
    if (!hist.length) return renderEmpty();
    return hist.map(function (m) {
      if (m.role === 'user') {
        return '<div class="inc-ai-msg inc-ai-msg--user">' + escape(m.text) + '</div>';
      }
      return '<div class="inc-ai-msg inc-ai-msg--bot">' +
        m.text +
        renderActions(m.actions) +
      '</div>';
    }).join('');
  }

  /* R023 idle-30s tracker — after each bot reply, schedule a "Try one
     of these" chip strip injection. Cleared on user input or on each
     subsequent reply. */
  var __idleTimer = null;
  function clearIdleTimer() { if (__idleTimer) { clearTimeout(__idleTimer); __idleTimer = null; } }
  function pickIdleSuggestions() {
    var all = (window.AquaAIPrompts && window.AquaAIPrompts.all && window.AquaAIPrompts.all()) || [];
    if (!all.length) return [];
    /* Shuffle + take 3. */
    var pool = all.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool.slice(0, 3);
  }
  function injectIdleChips(panel) {
    var body = panel.querySelector('[data-ai-body]');
    if (!body) return;
    /* Only inject when last entry is a bot reply + no idle chips already there. */
    var existing = body.querySelector('[data-ai-idle-strip]');
    if (existing) existing.remove();
    var picks = pickIdleSuggestions();
    if (!picks.length) return;
    var strip = document.createElement('div');
    strip.setAttribute('data-ai-idle-strip', '');
    strip.className = 'inc-ai-idle';
    strip.innerHTML = '<p class="inc-ai-idle-head">Try one of these:</p>' +
      picks.map(function (p) {
        return '<button type="button" class="inc-ai-starter" data-ai-idle-prompt="' + escape(p.text) + '" data-ai-prompt-kind="' + escape(p.kind) + '">' + escape(p.text) + '</button>';
      }).join('');
    body.appendChild(strip);
    body.scrollTop = body.scrollHeight;
  }

  function paint(panel) {
    var body = panel.querySelector('[data-ai-body]');
    if (!body) return;
    body.innerHTML = renderHistory(readHistory());
    body.scrollTop = body.scrollHeight;
  }

  function ask(panel, message) {
    clearIdleTimer();
    var hist = readHistory();
    hist.push({ role: 'user', text: message });
    writeHistory(hist);
    paint(panel);
    setTimeout(function () {
      var res = window.AquaAI.respondTo(message);
      var hist2 = readHistory();
      hist2.push({ role: 'bot', text: res.reply, actions: res.suggestedActions });
      writeHistory(hist2);
      paint(panel);
      /* Arm the idle timer — 30s of no further interaction surfaces a
         "Try one of these" chip strip below the last bot bubble. */
      clearIdleTimer();
      __idleTimer = setTimeout(function () { injectIdleChips(panel); }, 30000);
    }, 350);
  }

  function mount() {
    if (document.querySelector('[data-inc-ai-launcher]')) return;
    var btn = document.createElement('button');
    btn.setAttribute('data-inc-ai-launcher', '');
    btn.setAttribute('aria-label', 'Open Aqua AI');
    btn.className = 'inc-ai-launcher';
    btn.innerHTML = '<span class="inc-ai-launcher-orb">✦</span><span>Aqua AI</span>';
    document.body.appendChild(btn);

    var panel = document.createElement('aside');
    panel.className = 'inc-ai-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML =
      '<header class="inc-ai-head">' +
        '<div>' +
          '<div class="inc-ai-title">Aqua AI</div>' +
          '<div class="inc-ai-sub">' + escape(window.AquaAI.disclaimer) + '</div>' +
        '</div>' +
        '<button type="button" class="inc-ai-close" aria-label="Close">✕</button>' +
      '</header>' +
      '<div class="inc-ai-body" data-ai-body></div>' +
      '<form class="inc-ai-form" data-ai-form>' +
        '<input type="text" placeholder="Ask anything about your phase, HC, lessons…" data-ai-input autocomplete="off" />' +
        '<button type="submit" class="inc-btn">Ask</button>' +
      '</form>' +
      '<div class="inc-ai-foot">' +
        '<a href="#" data-ai-clear>Clear conversation</a>' +
        '<a href="https://wa.me/" target="_blank" rel="noopener">Talk to a human ↗</a>' +
      '</div>';
    document.body.appendChild(panel);

    function open()  { panel.classList.add('is-open');    panel.setAttribute('aria-hidden', 'false'); paint(panel); panel.querySelector('[data-ai-input]').focus(); }
    function close() { panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true'); }

    btn.addEventListener('click', function () {
      panel.classList.contains('is-open') ? close() : open();
    });
    panel.querySelector('.inc-ai-close').addEventListener('click', close);

    panel.addEventListener('click', function (ev) {
      var s = ev.target.closest('[data-ai-starter]');
      if (s) {
        var promptText = s.getAttribute('data-ai-prompt') || s.getAttribute('data-ai-starter');
        var promptKind = s.getAttribute('data-ai-prompt-kind');
        var promptCat = s.getAttribute('data-ai-prompt-cat');
        if (promptKind && window.Activity && typeof window.Activity.log === 'function') {
          window.Activity.log('prompt.clicked', { kind: promptKind, category: promptCat, text: promptText });
        }
        ask(panel, promptText);
        return;
      }
      var cat = ev.target.closest('[data-ai-cat]');
      if (cat) {
        ev.preventDefault();
        var catId = cat.getAttribute('data-ai-cat');
        var host = panel.querySelector('[data-ai-cat-prompts]');
        if (!host) return;
        /* Toggle: click again to collapse. */
        if (host.getAttribute('data-current-cat') === catId && !host.hidden) {
          host.hidden = true; host.removeAttribute('data-current-cat');
          panel.querySelectorAll('[data-ai-cat]').forEach(function (b) { b.classList.remove('is-on'); });
          return;
        }
        host.innerHTML = renderCategoryPrompts(catId);
        host.setAttribute('data-current-cat', catId);
        host.hidden = false;
        panel.querySelectorAll('[data-ai-cat]').forEach(function (b) { b.classList.toggle('is-on', b === cat); });
        return;
      }
      var c = ev.target.closest('[data-ai-chip]');
      if (c) {
        var href = c.getAttribute('href');
        if (href && href.indexOf('#ai:') === 0) {
          ev.preventDefault();
          ask(panel, href.slice(4));
        }
        // else default navigation proceeds
        return;
      }
      var idleChip = ev.target.closest('[data-ai-idle-prompt]');
      if (idleChip) {
        var t = idleChip.getAttribute('data-ai-idle-prompt');
        if (window.Activity) window.Activity.log('prompt.clicked', { kind: 'idle.' + (idleChip.getAttribute('data-ai-prompt-kind') || 'suggestion'), text: t });
        ask(panel, t);
        return;
      }
      var clr = ev.target.closest('[data-ai-clear]');
      if (clr) { ev.preventDefault(); clearHistory(); paint(panel); }
    });

    panel.querySelector('[data-ai-form]').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var input = panel.querySelector('[data-ai-input]');
      var v = (input.value || '').trim();
      if (!v) return;
      input.value = '';
      ask(panel, v);
    });
    /* R023 — typing cancels the idle-suggestion timer so we don't
       interrupt the user mid-message. */
    panel.querySelector('[data-ai-input]').addEventListener('input', clearIdleTimer);

    paint(panel);
  }

  document.addEventListener('DOMContentLoaded', mount);

  window.AquaAIUI = { mount: mount, clearHistory: clearHistory };
})();
