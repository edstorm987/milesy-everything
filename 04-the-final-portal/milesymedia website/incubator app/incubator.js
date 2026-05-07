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
  var KEY_ACTIVE        = 'incubator.active';
  var KEY_PHASE         = 'incubator.phase';
  var KEY_COMPLETED     = 'incubator.completed';
  var KEY_WATCHED       = 'incubator.watched';
  var KEY_STARTED       = 'incubator.startedAt';
  var KEY_PHASE_PROG    = 'incubator.phaseProgress'; // { [phaseId]: { [stepId]: true } }

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

  /* ─── Phase-progress checklist (R002) ───────────
     Pages with `[data-inc-phase-checks]` containing
     `<label data-step="step-id"><input type="checkbox"> …</label>`
     items get their state hydrated from `incubator.phaseProgress[phaseId]`.
     When every step on a phase is ticked, `incubator.phase` advances
     to the next phase in `PHASES` (without skipping past the user's
     current phase) and a small toast announces the advance. */
  function getPhaseProgress() { return getJSON(KEY_PHASE_PROG, {}); }
  function setPhaseProgress(p) {
    try { localStorage.setItem(KEY_PHASE_PROG, JSON.stringify(p)); } catch (e) {}
  }
  function phaseComplete(phaseId, container) {
    var prog = getPhaseProgress()[phaseId] || {};
    var labels = container.querySelectorAll('[data-step]');
    if (!labels.length) return false;
    for (var i = 0; i < labels.length; i++) {
      if (!prog[labels[i].getAttribute('data-step')]) return false;
    }
    return true;
  }
  function maybeAdvancePhase(phaseId) {
    var idx = PHASES.findIndex(function (p) { return p.id === phaseId; });
    if (idx < 0 || idx >= PHASES.length - 1) return;
    var current = PHASES.findIndex(function (p) { return p.id === getPhase(); });
    // Only advance forward and only past the user's current phase.
    if (idx < current) return;
    var next = PHASES[idx + 1].id;
    set(KEY_PHASE, next);
    renderPhaseChip();
    applyCardLocks();
    showToast('Phase advanced → ' + phaseMeta(next).label);
  }
  function showToast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0F0F0F;border:1px solid #C9A76A;color:#D4B888;padding:12px 20px;border-radius:10px;z-index:9999;font-size:14px;letter-spacing:0.02em;box-shadow:0 6px 20px rgba(0,0,0,0.5);';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }
  function mountPhaseChecks() {
    var blocks = document.querySelectorAll('[data-inc-phase-checks]');
    for (var i = 0; i < blocks.length; i++) {
      (function (block) {
        var phaseId = block.getAttribute('data-inc-phase-checks');
        if (!phaseId) return;
        var prog = getPhaseProgress()[phaseId] || {};
        var labels = block.querySelectorAll('[data-step]');
        for (var j = 0; j < labels.length; j++) {
          var lbl = labels[j];
          var stepId = lbl.getAttribute('data-step');
          var input = lbl.querySelector('input[type=checkbox]');
          if (!input) continue;
          input.checked = !!prog[stepId];
          input.addEventListener('change', function (ev) {
            var all = getPhaseProgress();
            var phase = all[phaseId] || {};
            phase[ev.target.closest('[data-step]').getAttribute('data-step')] = ev.target.checked;
            all[phaseId] = phase;
            setPhaseProgress(all);
            renderPhaseProgressChip(block);
            if (phaseComplete(phaseId, block)) maybeAdvancePhase(phaseId);
          });
        }
        renderPhaseProgressChip(block);
      })(blocks[i]);
    }
  }
  function renderPhaseProgressChip(block) {
    var chip = block.querySelector('[data-inc-phase-progress-chip]');
    if (!chip) return;
    var phaseId = block.getAttribute('data-inc-phase-checks');
    var prog = getPhaseProgress()[phaseId] || {};
    var labels = block.querySelectorAll('[data-step]');
    var done = 0;
    for (var i = 0; i < labels.length; i++) {
      if (prog[labels[i].getAttribute('data-step')]) done++;
    }
    chip.textContent = done + ' / ' + labels.length + ' complete';
    chip.classList.toggle('inc-chip', true);
  }

  /* ─── Phase-card unlock (R002 root grid) ────────
     Cards inside `.inc-grid[data-inc-phase-grid]` correspond to the
     PHASES array order via `data-phase-index`. Current + completed
     phases are active; future phases get the soft-lock overlay. */
  function applyPhasePathLocks() {
    var grids = document.querySelectorAll('[data-inc-phase-grid]');
    if (!grids.length) return;
    var current = phaseN(getPhase());
    var prog = getPhaseProgress();
    for (var g = 0; g < grids.length; g++) {
      var cards = grids[g].querySelectorAll('[data-phase-index]');
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var n = parseInt(c.getAttribute('data-phase-index'), 10) || 1;
        var phaseId = PHASES[n - 1].id;
        var thisProg = prog[phaseId] || {};
        var anyDone = Object.keys(thisProg).some(function (k) { return thisProg[k]; });
        if (n > current) {
          c.classList.add('is-locked');
          if (!c.querySelector('.inc-lock-badge')) {
            var badge = document.createElement('span');
            badge.className = 'inc-lock-badge';
            badge.textContent = '🔒 Unlocks at ' + phaseMeta(phaseId).label;
            c.appendChild(badge);
          }
        } else if (anyDone || n < current) {
          if (!c.querySelector('.inc-progress-badge')) {
            var done = document.createElement('span');
            done.className = 'inc-lock-badge';
            done.style.borderColor = '#5a7a3a';
            done.style.color = '#b3d28a';
            done.textContent = n < current ? '✓ Complete' : '◐ In progress';
            c.appendChild(done);
          }
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    mountPhaseChecks();
    applyPhasePathLocks();
  });

  /* ─── Public surface for inline scripts / debug ─── */
  window.Incubator = {
    PHASES: PHASES,
    getPhase: getPhase,
    setPhase: function (p) { set(KEY_PHASE, p); renderPhaseChip(); applyCardLocks(); applyPhasePathLocks(); },
    getCompleted: function () { return getJSON(KEY_COMPLETED, {}); },
    markComplete: function (stepId) {
      var m = getJSON(KEY_COMPLETED, {}); m[stepId] = true;
      try { localStorage.setItem(KEY_COMPLETED, JSON.stringify(m)); } catch (e) {}
    },
    getPhaseProgress: getPhaseProgress,
    resetPhaseProgress: function () { setPhaseProgress({}); }
  };
})();
