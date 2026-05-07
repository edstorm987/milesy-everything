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
    var s = window.AquaAI.starters || [];
    return '<div class="inc-ai-empty">' +
      '<p><strong>Hi — I\'m Aqua.</strong> ' + escape(window.AquaAI.disclaimer) + '</p>' +
      '<div class="inc-ai-starters">' +
      s.map(function (q) { return '<button type="button" class="inc-ai-starter" data-ai-starter="' + escape(q) + '">' + escape(q) + '</button>'; }).join('') +
      '</div></div>';
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

  function paint(panel) {
    var body = panel.querySelector('[data-ai-body]');
    if (!body) return;
    body.innerHTML = renderHistory(readHistory());
    body.scrollTop = body.scrollHeight;
  }

  function ask(panel, message) {
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
      if (s) { ask(panel, s.getAttribute('data-ai-starter')); return; }
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

    paint(panel);
  }

  document.addEventListener('DOMContentLoaded', mount);

  window.AquaAIUI = { mount: mount, clearHistory: clearHistory };
})();
