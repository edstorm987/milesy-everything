/* Incubator client portal — shared helpers.
   Owns the `incubator.*` localStorage namespace, lives same-origin as
   HC + BOS so they read/write the same `bos.*` user too.

   Schema (incubator.* keys):
     incubator.active       — '1' when the user is in the Incubator surface.
                              BOS reads this to render its back-to-Incubator strip.
     incubator.phase        — 'epic-intro' | 'blueprint' | 'diagnostics' | 'brand-builder'
     incubator.completed    — JSON map { stepId: true } — for step-completion ticks.
     incubator.watched      — JSON map { videoId: true } — video-watch flags.
     incubator.startedAt    — ISO string set on first visit.
*/
(function () {
  var KEY_ACTIVE    = 'incubator.active';
  var KEY_PHASE     = 'incubator.phase';
  var KEY_COMPLETED = 'incubator.completed';
  var KEY_WATCHED   = 'incubator.watched';
  var KEY_STARTED   = 'incubator.startedAt';

  var PHASES = [
    { id: 'epic-intro',    n: 1, label: 'Epic Intro' },
    { id: 'blueprint',     n: 2, label: 'Blueprint Setup' },
    { id: 'diagnostics',   n: 3, label: 'Diagnostics & Foundations' },
    { id: 'brand-builder', n: 4, label: 'Brand Builder' }
  ];

  function get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function getJSON(k, d) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch (e) { return d; } }

  /* ─── Mark surface active so BOS shows the back-to-Incubator strip ─── */
  set(KEY_ACTIVE, '1');
  if (!get(KEY_STARTED, null)) set(KEY_STARTED, new Date().toISOString());

  /* ─── ?phase= dev override (mirrors BOS ?dev=1) ─── */
  function applyQueryPhase() {
    var m = location.search.match(/[?&]phase=([a-z\-]+)/);
    if (m && PHASES.some(function (p) { return p.id === m[1]; })) {
      set(KEY_PHASE, m[1]);
    }
  }
  applyQueryPhase();

  function getPhase() {
    var p = get(KEY_PHASE, 'epic-intro');
    return PHASES.some(function (x) { return x.id === p; }) ? p : 'epic-intro';
  }
  function phaseMeta(id) {
    return PHASES.filter(function (p) { return p.id === id; })[0] || PHASES[0];
  }
  function phaseN(id) { return phaseMeta(id).n; }

  /* ─── Card lock helper — soft-lock cards behind their unlock phase ─── */
  function applyCardLocks() {
    var current = phaseN(getPhase());
    var cards = document.querySelectorAll('[data-unlock-phase]');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var need = parseInt(c.getAttribute('data-unlock-phase'), 10) || 1;
      if (need > current) {
        c.classList.add('is-locked');
        if (!c.querySelector('.inc-lock-badge')) {
          var badge = document.createElement('span');
          badge.className = 'inc-lock-badge';
          badge.textContent = '🔒 Unlocks at ' + phaseMeta(PHASES[need - 1].id).label;
          c.appendChild(badge);
        }
      }
    }
  }

  /* ─── Property-strip phase chip + Started date ─── */
  function renderPhaseChip() {
    var el = document.querySelector('[data-inc-phase-chip]');
    if (!el) return;
    var meta = phaseMeta(getPhase());
    el.textContent = 'Phase ' + meta.n + ' · ' + meta.label;
    el.className = 'inc-chip inc-phase-' + meta.n;
  }
  function renderStartedAt() {
    var el = document.querySelector('[data-inc-started]');
    if (!el) return;
    var iso = get(KEY_STARTED, '');
    if (!iso) { el.textContent = '—'; return; }
    try {
      var d = new Date(iso);
      el.textContent = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { el.textContent = iso.slice(0, 10); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderPhaseChip();
    renderStartedAt();
    applyCardLocks();
  });

  /* ─── Public surface for inline scripts / debug ─── */
  window.Incubator = {
    PHASES: PHASES,
    getPhase: getPhase,
    setPhase: function (p) { set(KEY_PHASE, p); renderPhaseChip(); applyCardLocks(); },
    getCompleted: function () { return getJSON(KEY_COMPLETED, {}); },
    markComplete: function (stepId) {
      var m = getJSON(KEY_COMPLETED, {}); m[stepId] = true;
      try { localStorage.setItem(KEY_COMPLETED, JSON.stringify(m)); } catch (e) {}
    }
  };
})();
