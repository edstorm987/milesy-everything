/* Shared Business OS helpers — included on every in-app page.
   Single source of truth for: user info, mode (free/customer),
   niche, XP/level/streak progression, health-check ingestion,
   sidebar adaptation, dev bar, achievements, Aqua AI widget. */

(function () {
  var KEY_USER = 'bos.user';
  var KEY_MODE = 'bos.mode';        // 'free' | 'customer'
  var KEY_PROGRESS = 'bos.progress'; // XP / streak / achievements
  var KEY_HEALTH = 'bos.healthCheck';
  var KEY_AI = 'bos.ai';            // free-tier message counter

  /* ─── Niches ─────────────────────────────── */
  var NICHES = [
    { slug: 'therapist',  label: 'Therapist OS',     icon: '🌿', tagline: 'Built for private-practice therapists.' },
    { slug: 'roofer',     label: 'Roofer OS',        icon: '🏠', tagline: 'Built for roofers and trades.' },
    { slug: 'salon',      label: 'Salon OS',         icon: '💇', tagline: 'Built for salons, barbers and stylists.' },
    { slug: 'coach',      label: 'Coach OS',         icon: '🎯', tagline: 'Built for coaches and consultants.' },
    { slug: 'restaurant', label: 'Restaurant OS',    icon: '🍽',  tagline: 'Built for restaurants and cafés.' },
    { slug: 'retailer',   label: 'Retailer OS',      icon: '🛍', tagline: 'Built for product brands.' },
    { slug: 'agency',     label: 'Agency OS',        icon: '💼', tagline: 'Built for agencies and studios.' },
    { slug: 'generic',    label: 'Business OS',      icon: '◆',  tagline: 'A solid generic operating system.' }
  ];

  /* ─── Level ladder ───────────────────────── */
  var LEVELS = [
    { n: 1, name: 'Apprentice', from:    0 },
    { n: 2, name: 'Owner',      from:  250 },
    { n: 3, name: 'Operator',   from:  700 },
    { n: 4, name: 'Captain',    from: 1500 },
    { n: 5, name: 'Founder',    from: 3000 },
    { n: 6, name: 'Legend',     from: 6000 }
  ];

  /* ─── Add-ons (also rendered in marketplace + sidebar) ── */
  var ADDONS = [
    { id: 'inbox',     name: 'All-in-One Inbox',     icon: '📥', cat: 'comms',  price: 49, blurb: 'Email, SMS, WhatsApp, Instagram DMs — one queue, one team.' },
    { id: 'website',   name: 'Website Editor',       icon: '🪄', cat: 'site',   price: 79, blurb: 'Drag-and-drop pages with the conversion blocks already built.' },
    { id: 'ecom',      name: 'Ecommerce',            icon: '🛒', cat: 'sell',   price: 89, blurb: 'Storefront, cart, checkout, subscriptions. Stripe-ready.' },
    { id: 'fulfil',    name: 'Fulfilment',           icon: '📦', cat: 'sell',   price: 39, blurb: 'Pick, pack, ship and track from the same place you sell.' },
    { id: 'members',   name: 'Memberships',          icon: '🎟', cat: 'retain', price: 39, blurb: 'Tiers, drip content, gated areas. No second login for customers.' },
    { id: 'affil',     name: 'Affiliates',           icon: '🤝', cat: 'grow',   price: 29, blurb: 'Referral links, payouts, fraud checks — turn fans into a salesforce.' },
    { id: 'crm',       name: 'Client CRM',           icon: '🗂', cat: 'comms',  price: 49, blurb: 'Pipelines, notes, tasks, automated follow-ups.' },
    { id: 'marketing', name: 'Marketing Suite',      icon: '📣', cat: 'grow',   price: 59, blurb: 'Email, SMS, broadcast, segmentation, automation flows.' },
    { id: 'finance',   name: 'Finance',              icon: '💷', cat: 'ops',    price: 39, blurb: 'Invoicing, reconciliation, tax-ready reports for your accountant.' }
  ];

  /* ─── Achievements catalogue ─────────────── */
  var ACHIEVEMENTS = [
    { id: 'first-step',   icon: '🌟', label: 'First step',          desc: 'You created your Business OS.' },
    { id: 'self-aware',   icon: '🪞', label: 'Self-aware',          desc: 'Completed your first Health Check.' },
    { id: 'student',      icon: '📚', label: 'Student',             desc: 'Opened your first module.' },
    { id: 'builder',      icon: '🔧', label: 'Builder',             desc: 'Installed your first add-on.' },
    { id: 'on-fire-3',    icon: '🔥', label: '3-day streak',        desc: 'Three days in a row. Keep it up.' },
    { id: 'on-fire-7',    icon: '🔥', label: '7-day streak',        desc: 'A whole week. Habit-forming.' },
    { id: 'first-call',   icon: '📞', label: 'Bridge built',        desc: 'You booked your first strategy call.' },
    { id: 'niche-locked', icon: '🎯', label: 'Niche-locked',        desc: 'Picked a niche-specific OS.' }
  ];

  /* ─── Storage helpers ────────────────────── */
  function getJSON(k, d) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch (e) { return d; } }
  function setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function getUser() { return getJSON(KEY_USER, null); }
  function setUser(u) { setJSON(KEY_USER, u); }
  function getMode() { try { return localStorage.getItem(KEY_MODE) || 'free'; } catch (e) { return 'free'; } }
  function setMode(m) { try { localStorage.setItem(KEY_MODE, m); } catch (e) {} }

  function getProgress() {
    return getJSON(KEY_PROGRESS, {
      xp: 0, timeSavedHrs: 0, streak: 0, lastActive: null,
      completed: {}, achievements: []
    });
  }
  function setProgress(p) { setJSON(KEY_PROGRESS, p); }

  function getNiche() {
    var u = getUser();
    return (u && u.niche) || 'generic';
  }
  function nicheMeta() {
    var slug = getNiche();
    return NICHES.find(function (n) { return n.slug === slug; }) || NICHES[NICHES.length - 1];
  }

  function levelInfo(xp) {
    var cur = LEVELS[0], nxt = LEVELS[1];
    for (var i = 0; i < LEVELS.length; i++) {
      if (xp >= LEVELS[i].from) { cur = LEVELS[i]; nxt = LEVELS[i + 1] || null; }
    }
    var floor = cur.from;
    var ceil  = nxt ? nxt.from : floor;
    var pct   = nxt ? Math.min(100, Math.round(((xp - floor) / (ceil - floor)) * 100)) : 100;
    return { current: cur, next: nxt, pct: pct, into: xp - floor, span: ceil - floor };
  }

  function gainXP(amount, reason, timeSavedHrs) {
    var p = getProgress();
    var prevLevel = levelInfo(p.xp).current.n;
    p.xp += amount;
    if (timeSavedHrs) p.timeSavedHrs += timeSavedHrs;
    setProgress(p);
    var newLevel = levelInfo(p.xp).current.n;
    toast('+' + amount + ' XP · ' + reason, 'xp');
    if (newLevel > prevLevel) {
      setTimeout(function () { toast('Level up — you\'re now a ' + LEVELS[newLevel - 1].name + '.', 'level'); }, 1200);
    }
    paintProgress();
  }

  function unlockAchievement(id) {
    var p = getProgress();
    if (p.achievements.indexOf(id) !== -1) return;
    p.achievements.push(id);
    setProgress(p);
    var a = ACHIEVEMENTS.find(function (x) { return x.id === id; });
    if (a) toast(a.icon + ' ' + a.label + ' — unlocked.', 'achievement');
    paintProgress();
  }

  function tickStreak() {
    var p = getProgress();
    var today = new Date().toISOString().slice(0, 10);
    if (p.lastActive === today) return; // already counted
    var yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    if (p.lastActive === yesterday) p.streak += 1;
    else p.streak = 1;
    p.lastActive = today;
    setProgress(p);
    if (p.streak === 3) unlockAchievement('on-fire-3');
    if (p.streak === 7) unlockAchievement('on-fire-7');
  }

  /* ─── Toast ──────────────────────────────── */
  function ensureToastHost() {
    var h = document.querySelector('.bos-toast-host');
    if (h) return h;
    h = document.createElement('div');
    h.className = 'bos-toast-host';
    document.body.appendChild(h);
    return h;
  }
  function toast(text, kind) {
    var h = ensureToastHost();
    var t = document.createElement('div');
    t.className = 'bos-toast bos-toast-' + (kind || 'xp');
    t.textContent = text;
    h.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    setTimeout(function () { t.classList.remove('is-on'); setTimeout(function () { t.remove(); }, 300); }, 2800);
  }

  /* ─── Paint XP / level / streak everywhere ── */
  function paintProgress() {
    var p = getProgress();
    var lvl = levelInfo(p.xp);
    document.querySelectorAll('[data-bos-xp]').forEach(function (e) { e.textContent = p.xp.toLocaleString() + ' XP'; });
    document.querySelectorAll('[data-bos-level-num]').forEach(function (e) { e.textContent = lvl.current.n; });
    document.querySelectorAll('[data-bos-level-name]').forEach(function (e) { e.textContent = lvl.current.name; });
    document.querySelectorAll('[data-bos-level-bar]').forEach(function (e) { e.style.width = lvl.pct + '%'; });
    document.querySelectorAll('[data-bos-level-pct]').forEach(function (e) {
      e.textContent = lvl.next ? (lvl.span - lvl.into) + ' XP to ' + lvl.next.name : 'Maxed';
    });
    document.querySelectorAll('[data-bos-streak]').forEach(function (e) { e.textContent = p.streak; });
    document.querySelectorAll('[data-bos-time-saved]').forEach(function (e) { e.textContent = (p.timeSavedHrs || 0).toFixed(1) + 'h'; });
    /* Achievements grid */
    var grid = document.querySelector('[data-bos-achievements]');
    if (grid) {
      grid.innerHTML = ACHIEVEMENTS.map(function (a) {
        var got = p.achievements.indexOf(a.id) !== -1;
        return '<div class="ach-card' + (got ? ' is-on' : '') + '">'
          + '<div class="ach-icon">' + a.icon + '</div>'
          + '<div class="ach-meta"><div class="ach-label">' + a.label + '</div>'
          +   '<div class="ach-desc">' + (got ? a.desc : 'Locked — ' + a.desc.toLowerCase()) + '</div></div>'
          + '</div>';
      }).join('');
    }
  }

  /* ─── User hydration ─────────────────────── */
  function hydrateUser() {
    var u = getUser() || { name: 'Friend', business: 'Your Business', email: '', niche: 'generic' };
    var first = (u.name || 'Friend').split(' ')[0];
    var initials = (u.name || 'F L').split(/\s+/).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase();
    var hr = new Date().getHours();
    var greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    document.querySelectorAll('[data-bos-name]').forEach(function (el) { el.textContent = u.name || 'Friend'; });
    document.querySelectorAll('[data-bos-business]').forEach(function (el) { el.textContent = u.business || ''; });
    document.querySelectorAll('[data-bos-initial]').forEach(function (el) { el.textContent = initials || 'YOU'; });
    document.querySelectorAll('[data-bos-greet]').forEach(function (el) { el.textContent = greet + ', ' + first + '.'; });
    /* Niche-aware brand label */
    var nm = nicheMeta();
    document.querySelectorAll('[data-bos-niche-label]').forEach(function (el) { el.textContent = nm.label; });
    document.querySelectorAll('[data-bos-niche-icon]').forEach(function (el) { el.textContent = nm.icon; });
    document.querySelectorAll('[data-bos-niche-tagline]').forEach(function (el) { el.textContent = nm.tagline; });
  }

  /* ─── Auto sidebar nav (Run / Learn / Premium / Add-ons / Help / Aqua) ─── */
  function buildSidebarNav(activePath) {
    var page = activePath || (location.pathname.split('/').pop() || 'app.html');
    function link(href, icon, label, extra) {
      var act = href === page ? ' class="active"' : '';
      return '<a href="' + href + '"' + act + '><span class="ico">' + icon + '</span> ' + label + (extra || '') + '</a>';
    }
    var html = '';
    html += '<div class="bos-side-section">'
         +    '<div class="bos-side-label">Run</div>'
         +    link('app.html',      '◆', 'Dashboard')
         +    link('company.html',  '🏢', 'Company Profile')
         +    link('leads.html',    '⚑', 'Leads &amp; Clients HQ')
         +    link('trackers.html', '📊', 'Trackers &amp; KPIs')
         +    link('tasks.html',    '✓', 'Tasks')
         +    link('docs.html',     '📄', 'Documents &amp; SOPs')
         + '</div>';
    html += '<div class="bos-side-section">'
         +    '<div class="bos-side-label" data-bos-os-label>Learn</div>'
         +    link('database.html', '◇', 'Modules')
         +    link('module.html',   '📖', 'Guides')
         +    link('../lead magnet app/index.html?from=bos', '⌕', 'Assessments')
         + '</div>';
    html += '<div class="bos-side-section">'
         +    '<div class="bos-side-label">Premium</div>'
         +    '<a href="roadmap.html" class="bos-roadmap-link' + ('roadmap.html' === page ? ' active' : '') + '"><span class="ico">🗺</span> My Custom Roadmap <span class="bos-locked-tag bos-roadmap-tag">Pro</span></a>'
         + '</div>';
    html += '<div class="bos-side-section" data-bos-tools-slot></div>';
    html += '<div class="bos-side-section">'
         +    '<div class="bos-side-label">Get help</div>'
         +    link('help.html', '👋', 'Need Some Help?')
         +    '<a href="#" data-bos-open-ai><span class="ico">🤖</span> Aqua AI</a>'
         +    '<a href="mailto:hello@milesymedia.co"><span class="ico">✉</span> Message us</a>'
         +    '<a href="tel:+441234567890"><span class="ico">📞</span> Book a free call</a>'
         + '</div>';
    html += '<div class="bos-side-section bos-aqua-section bos-aqua-locked" data-bos-aqua>'
         +    '<div class="bos-side-label">Agency portal</div>'
         +    '<a href="#" class="bos-locked"><span class="ico">🔒</span> Aqua portal <span class="bos-locked-tag">Upgrade</span></a>'
         +    '<p class="bos-side-foot">Once you upgrade, the full agency portal layers in here.</p>'
         + '</div>';
    return html;
  }

  function mountAutoSidebar() {
    var slots = document.querySelectorAll('[data-bos-auto-nav]');
    slots.forEach(function (slot) {
      var active = slot.getAttribute('data-bos-active');
      slot.innerHTML = buildSidebarNav(active);
    });
  }

  /* ─── Sidebar adapts to mode ─────────────── */
  function applyMode() {
    var mode = getMode();
    document.body.setAttribute('data-bos-mode', mode);
    document.querySelectorAll('[data-bos-os-label]').forEach(function (el) {
      el.textContent = mode === 'customer' ? 'Resources' : 'Workspace';
    });
    document.querySelectorAll('[data-bos-aqua]').forEach(function (el) {
      if (mode === 'customer') {
        el.classList.remove('bos-aqua-locked'); el.classList.add('bos-aqua-unlocked');
        var a = el.querySelector('a');
        if (a) {
          a.classList.remove('bos-locked');
          a.innerHTML = '<span class="ico">▣</span> Aqua agency portal <span class="bos-installed-tag">Active</span>';
        }
        var foot = el.querySelector('p'); if (foot) foot.textContent = 'Your full agency portal — campaigns, finance, team, the lot.';
      }
    });
    var slot = document.querySelector('[data-bos-tools-slot]');
    if (slot) {
      if (mode === 'customer') {
        slot.innerHTML = '<div class="bos-side-label">Your tools</div>'
          + ADDONS.map(function (a) {
              return '<a href="#" class="bos-installed"><span class="ico">' + a.icon + '</span> ' + a.name
                + '<span class="bos-installed-tag">Installed</span></a>';
            }).join('');
      } else {
        slot.innerHTML = '<div class="bos-side-label">Add-ons</div>'
          + '<a href="marketplace.html"><span class="ico">✨</span> Marketplace</a>'
          + '<p class="bos-side-foot">Pick &amp; mix the tools your business needs.</p>';
      }
    }
  }

  /* ─── Health-check summary on dashboard ──── */
  function paintHealthCheck() {
    var slot = document.querySelector('[data-bos-healthcheck]');
    if (!slot) return;
    var hc = getJSON(KEY_HEALTH, null);
    if (!hc) {
      slot.innerHTML = ''
        + '<div class="hc-summary-empty">'
        +   '<div class="hc-summary-empty-icon">⌕</div>'
        +   '<div>'
        +     '<h3>You haven\'t taken your Health Check yet.</h3>'
        +     '<p class="muted">It\'s 12 minutes, free, and unlocks +250 XP plus your personalised quick wins.</p>'
        +     '<a href="../lead magnet app/index.html?from=bos" class="btn btn-primary">Take it now → +250 XP</a>'
        +   '</div>'
        + '</div>';
      return;
    }
    var leak = hc.leakEstimate ? '£' + hc.leakEstimate.toLocaleString() : '£—';
    var topics = (hc.topics || []).map(function (t) {
      return '<div class="hc-summary-pill hc-summary-pill-' + t.status + '">'
        + '<span class="hc-summary-pill-icon">' + (t.icon || '◆') + '</span>'
        + '<span>' + t.name + '</span>'
        + '<strong>' + t.score + '</strong>'
        + '</div>';
    }).join('');
    slot.innerHTML = ''
      + '<div class="hc-summary-card">'
      +   '<div class="hc-summary-card-head">'
      +     '<div><span class="eyebrow">Your Health Check</span><h3>' + (hc.headline || 'You\'re leaving money on the table.') + '</h3></div>'
      +     '<div class="hc-summary-money">' + leak + '<span>/mo</span></div>'
      +   '</div>'
      +   '<div class="hc-summary-pills">' + topics + '</div>'
      +   '<div class="hc-summary-actions">'
      +     '<a href="../lead magnet app/index.html?from=bos" class="btn btn-secondary">Refine your answers</a>'
      +     '<a href="tel:+441234567890" class="btn btn-primary">Book a strategy call →</a>'
      +   '</div>'
      + '</div>';
  }

  /* ─── Aqua AI floating widget ────────────── */
  function getAi() { return getJSON(KEY_AI, { remaining: 5, cap: 5, history: [] }); }
  function setAi(a) { setJSON(KEY_AI, a); }

  function mountAi() {
    if (document.querySelector('.bos-ai-launcher')) return;
    var btn = document.createElement('button');
    btn.className = 'bos-ai-launcher';
    btn.setAttribute('aria-label', 'Open Aqua AI');
    btn.innerHTML = '<span class="bos-ai-launcher-orb"></span><span class="bos-ai-launcher-label">Aqua AI</span>';
    document.body.appendChild(btn);

    var panel = document.createElement('div');
    panel.className = 'bos-ai-panel';
    panel.innerHTML = ''
      + '<div class="bos-ai-head">'
      +   '<div><div class="bos-ai-title">Aqua AI</div>'
      +   '<div class="bos-ai-sub">Trained on your portal · <span data-bos-ai-remaining>5</span>/<span data-bos-ai-cap>5</span> free messages</div></div>'
      +   '<button class="bos-ai-close" aria-label="Close">✕</button>'
      + '</div>'
      + '<div class="bos-ai-body" data-bos-ai-body></div>'
      + '<form class="bos-ai-form" data-bos-ai-form>'
      +   '<input type="text" placeholder="Ask anything about your business…" data-bos-ai-input />'
      +   '<button type="submit" class="btn btn-primary">Ask</button>'
      + '</form>'
      + '<div class="bos-ai-foot">Limited to your portal context. <a href="mailto:hello@milesymedia.co?subject=Aqua%20AI%20upgrade">Upgrade for unlimited →</a></div>';
    document.body.appendChild(panel);

    btn.addEventListener('click', function () { panel.classList.toggle('is-open'); paintAi(); });
    document.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-bos-open-ai]')) {
        ev.preventDefault();
        panel.classList.add('is-open'); paintAi();
      }
    });
    panel.querySelector('.bos-ai-close').addEventListener('click', function () { panel.classList.remove('is-open'); });
    panel.querySelector('[data-bos-ai-form]').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var input = panel.querySelector('[data-bos-ai-input]');
      var q = (input.value || '').trim();
      if (!q) return;
      input.value = '';
      askAi(q);
    });

    paintAi();
  }
  function paintAi() {
    var a = getAi();
    document.querySelectorAll('[data-bos-ai-remaining]').forEach(function (e) { e.textContent = a.remaining; });
    document.querySelectorAll('[data-bos-ai-cap]').forEach(function (e) { e.textContent = a.cap; });
    var body = document.querySelector('[data-bos-ai-body]');
    if (!body) return;
    if (!a.history.length) {
      body.innerHTML = '<div class="bos-ai-empty">'
        + '<p><strong>Hi — I\'m Aqua.</strong> I can see your Health Check, your modules and your add-ons. Ask me anything about your business.</p>'
        + '<div class="bos-ai-suggest">'
        +   '<button data-bos-ai-pick="What\'s my biggest leak?">What\'s my biggest leak?</button>'
        +   '<button data-bos-ai-pick="Which module should I do first?">Which module should I do first?</button>'
        +   '<button data-bos-ai-pick="What\'s the cheapest win for me?">What\'s the cheapest win for me?</button>'
        + '</div></div>';
      body.querySelectorAll('[data-bos-ai-pick]').forEach(function (b) {
        b.addEventListener('click', function () { askAi(b.getAttribute('data-bos-ai-pick')); });
      });
      return;
    }
    body.innerHTML = a.history.map(function (m) {
      return '<div class="bos-ai-msg bos-ai-msg-' + m.role + '">' + m.text + '</div>';
    }).join('');
    body.scrollTop = body.scrollHeight;
  }
  function askAi(q) {
    var a = getAi();
    if (a.remaining <= 0) {
      a.history.push({ role: 'user', text: q });
      a.history.push({ role: 'bot',  text: 'You\'re out of free messages for this session. <a href="mailto:hello@milesymedia.co?subject=Aqua%20AI%20upgrade">Upgrade for unlimited →</a>' });
      setAi(a); paintAi(); return;
    }
    a.history.push({ role: 'user', text: q });
    a.remaining -= 1;
    setAi(a); paintAi();
    setTimeout(function () {
      var hc = getJSON(KEY_HEALTH, null);
      var nm = nicheMeta();
      var reply;
      var lower = q.toLowerCase();
      if (lower.indexOf('leak') !== -1 || lower.indexOf('biggest') !== -1) {
        reply = hc
          ? "Based on your Health Check, your weakest topic is <strong>" + (hc.topics?.[0]?.name || 'Visibility') + "</strong>. That's where the next 30 days will pay back fastest."
          : "I can\'t see a Health Check on file yet. Run it first — it takes 12 minutes and lights up the rest of your portal.";
      } else if (lower.indexOf('module') !== -1 || lower.indexOf('first') !== -1) {
        reply = "For " + nm.label + ", I'd start with <strong>Get found on Google in 30 days</strong>. It's the foundation everything else compounds on.";
      } else if (lower.indexOf('cheap') !== -1 || lower.indexOf('quick') !== -1) {
        reply = "Cheapest win: claim and optimise your Google Business Profile. Free, ~15 minutes, biggest local-search lever there is.";
      } else if (lower.indexOf('add-on') !== -1 || lower.indexOf('plugin') !== -1) {
        reply = "Given you're a " + nm.label.replace(' OS', '') + ", the add-ons that move the needle first are usually <strong>All-in-One Inbox</strong> and <strong>Client CRM</strong>.";
      } else {
        reply = "Good question. I'm running on a limited offline preview right now — once we wire the live model it'll pull from your Health Check, your modules and your add-ons to answer this in detail. Until then: try \"What's my biggest leak?\" or \"Which module should I do first?\"";
      }
      a = getAi();
      a.history.push({ role: 'bot', text: reply });
      setAi(a); paintAi();
    }, 700);
  }

  /* ─── Dev bar ────────────────────────────── */
  function mountDevBar() {
    if (document.querySelector('.bos-dev-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'bos-dev-bar';
    var mode = getMode();
    bar.innerHTML = ''
      + '<span class="bos-dev-tag">DEV</span>'
      + '<a href="app.html">Dashboard</a>'
      + '<a href="database.html">Modules</a>'
      + '<a href="module.html">Module</a>'
      + '<a href="marketplace.html">Marketplace</a>'
      + '<a href="roadmap.html">Roadmap</a>'
      + '<a href="../lead magnet app/index.html?from=bos">Health check</a>'
      + '<button data-bos-mode-toggle>' + (mode === 'customer' ? 'Customer' : 'Free') + ' →</button>'
      + '<button data-bos-xp-test>+50 XP</button>'
      + '<button data-bos-reset>Reset</button>';
    document.body.appendChild(bar);
    bar.querySelector('[data-bos-mode-toggle]').addEventListener('click', function () {
      setMode(getMode() === 'customer' ? 'free' : 'customer');
      window.location.reload();
    });
    bar.querySelector('[data-bos-xp-test]').addEventListener('click', function () { gainXP(50, 'dev test'); });
    bar.querySelector('[data-bos-reset]').addEventListener('click', function () {
      [KEY_USER, KEY_MODE, KEY_PROGRESS, KEY_HEALTH, KEY_AI].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      window.location.href = 'index.html';
    });
  }

  /* ─── Marketplace tile rendering ─────────── */
  function renderMarketplace(targetSel, opts) {
    var target = document.querySelector(targetSel);
    if (!target) return;
    var mode = getMode();
    var filter = (opts && opts.filter) || 'all';
    target.innerHTML = ADDONS
      .filter(function (a) { return filter === 'all' || a.cat === filter; })
      .map(function (a) {
        var owned = mode === 'customer';
        return '<article class="addon-card' + (owned ? ' is-owned' : '') + '">'
          + '<div class="addon-head">'
          +   '<div class="addon-icon">' + a.icon + '</div>'
          +   '<div><h3>' + a.name + '</h3><div class="addon-cat">' + categoryLabel(a.cat) + '</div></div>'
          + '</div>'
          + '<p>' + a.blurb + '</p>'
          + '<div class="addon-foot">'
          +   '<div class="addon-price">' + (owned ? '<span class="bos-installed-tag">Installed</span>' : '<strong>£' + a.price + '</strong><span>/mo</span>') + '</div>'
          +   (owned
              ? '<a href="#" class="btn btn-secondary">Open</a>'
              : '<a href="mailto:hello@milesymedia.co?subject=Add-on:%20' + encodeURIComponent(a.name) + '" class="btn btn-primary">Add to my OS →</a>')
          + '</div>'
          + '</article>';
      }).join('');
  }
  function categoryLabel(c) {
    return ({ comms: 'Communications', site: 'Website', sell: 'Sell', retain: 'Retain', grow: 'Grow', ops: 'Operations' })[c] || c;
  }

  /* ─── Mobile drawer ──────────────────────── */
  function mountMobileNav() {
    var sidebar = document.querySelector('.bos-sidebar');
    if (!sidebar || document.querySelector('.bos-mobile-nav-btn')) return;
    var btn = document.createElement('button');
    btn.className = 'bos-mobile-nav-btn';
    btn.innerHTML = '☰ Menu';
    sidebar.appendChild(btn);

    var drawer = document.createElement('div');
    drawer.className = 'bos-mobile-drawer';
    var nav = sidebar.querySelector('.bos-side-nav');
    var navClone = nav ? nav.cloneNode(true) : null;
    drawer.innerHTML = '<button class="bos-mobile-drawer-close" aria-label="Close">✕</button>';
    if (navClone) drawer.appendChild(navClone);
    document.body.appendChild(drawer);

    function open()  { drawer.classList.add('is-open');  document.body.classList.add('bos-drawer-open'); }
    function close() { drawer.classList.remove('is-open'); document.body.classList.remove('bos-drawer-open'); }
    btn.addEventListener('click', open);
    drawer.querySelector('.bos-mobile-drawer-close').addEventListener('click', close);
    drawer.addEventListener('click', function (ev) { if (ev.target === drawer) close(); });
    drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
  }

  /* ─── Free-tier badge + upgrade footer ───── */
  function mountTierUI() {
    var mode = getMode();
    /* Topbar tier pill */
    var topbar = document.querySelector('.bos-topbar');
    if (topbar && !topbar.querySelector('.bos-tier-pill')) {
      var pill = document.createElement('a');
      pill.className = 'bos-tier-pill bos-tier-pill-' + mode;
      pill.href = mode === 'customer' ? 'app.html' : 'marketplace.html';
      pill.innerHTML = mode === 'customer'
        ? '<span class="bos-tier-dot"></span> Pro · all add-ons active'
        : '<span class="bos-tier-dot"></span> Free tier · upgrade →';
      topbar.appendChild(pill);
    }
    /* Page-end upgrade band (free only) */
    if (mode !== 'customer' && document.querySelector('.bos-main') && !document.querySelector('.bos-upgrade-band')) {
      var band = document.createElement('section');
      band.className = 'bos-upgrade-band';
      band.innerHTML = ''
        + '<div class="bos-upgrade-band-icon">⚡</div>'
        + '<div class="bos-upgrade-band-text">'
        +   '<strong>You\'re on the free tier of Business OS.</strong>'
        +   '<p>Unlock the full plugin — every add-on, every advanced module, the SOP Hub, unlimited Aqua AI, and the Custom Roadmap. Included with any Milesy retainer, or buy individually in the marketplace.</p>'
        + '</div>'
        + '<a href="marketplace.html" class="btn btn-primary">Browse add-ons →</a>';
      document.querySelector('.bos-main').appendChild(band);
    }
  }

  /* ─── Boot ───────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    mountAutoSidebar();
    hydrateUser();
    applyMode();
    tickStreak();
    paintProgress();
    paintHealthCheck();
    mountMobileNav();
    mountTierUI();
    mountDevBar();
    mountAi();
  });

  /* Expose */
  window.BOS = {
    NICHES: NICHES, ADDONS: ADDONS, ACHIEVEMENTS: ACHIEVEMENTS, LEVELS: LEVELS,
    getUser: getUser, setUser: setUser, getMode: getMode, setMode: setMode,
    getNiche: getNiche, nicheMeta: nicheMeta,
    getProgress: getProgress, gainXP: gainXP, unlockAchievement: unlockAchievement,
    renderMarketplace: renderMarketplace
  };
})();
