/* IncubatorCopy — niche-pack loader + applier.
   Pages include each pack file (one <script> per niche) plus this loader.
   On DOMContentLoaded `IncubatorCopy.apply(document)` swaps text for any
   element marked `[data-niche="<key>"]` and renders the niche-driven
   blocks: `[data-niche-promise="<n>"]` (1-4) · `[data-niche-modules]` ·
   `[data-niche-faqs]` · `[data-niche-callout]` · `[data-niche-tagline]`.
   Honesty contract: copy-only swaps. No numbers / promises / claims. */
(function () {
  var DEFAULT = 'agency';

  function getNiche() {
    var brand = null, user = null;
    try { brand = JSON.parse(localStorage.getItem('bos.brand') || 'null'); } catch (e) {}
    try { user  = JSON.parse(localStorage.getItem('bos.user')  || 'null'); } catch (e) {}
    var n = (brand && brand.niche) || (user && user.niche) || DEFAULT;
    return window.IncubatorCopyPacks && window.IncubatorCopyPacks[n] ? n : DEFAULT;
  }
  function getPack(niche) {
    return (window.IncubatorCopyPacks || {})[niche || getNiche()] || (window.IncubatorCopyPacks || {})[DEFAULT] || null;
  }

  function setText(el, value) {
    if (!el || value == null) return;
    el.textContent = value;
  }
  function renderModules(host, modules) {
    if (!host || !modules) return;
    host.innerHTML = '';
    modules.forEach(function (m) {
      var a = document.createElement('a');
      a.className = 'inc-card';
      a.href = m.href || '#';
      var cover = document.createElement('div');
      cover.className = 'inc-card-cover';
      cover.setAttribute('data-variant', 'forest');
      var body = document.createElement('div');
      body.className = 'inc-card-body';
      var emoji = document.createElement('span');
      emoji.className = 'inc-card-emoji';
      emoji.textContent = m.icon || '◆';
      var label = document.createElement('span');
      label.className = 'inc-card-label';
      label.textContent = m.label || '—';
      body.appendChild(emoji); body.appendChild(label);
      a.appendChild(cover); a.appendChild(body);
      host.appendChild(a);
    });
  }
  function renderFaqs(host, faqs) {
    if (!host || !faqs) return;
    host.innerHTML = '';
    faqs.forEach(function (f) {
      var d = document.createElement('details');
      d.className = 'inc-toggle';
      var s = document.createElement('summary');
      s.textContent = f.q;
      var body = document.createElement('div');
      body.className = 'inc-toggle-body';
      var p = document.createElement('p');
      p.textContent = f.a;
      body.appendChild(p);
      d.appendChild(s); d.appendChild(body);
      host.appendChild(d);
    });
  }

  function apply(root) {
    root = root || document;
    var pack = getPack();
    if (!pack) return;

    // Generic [data-niche="<key>"] swap (top-level pack keys)
    var swaps = root.querySelectorAll('[data-niche]');
    for (var i = 0; i < swaps.length; i++) {
      var key = swaps[i].getAttribute('data-niche');
      if (key in pack && typeof pack[key] === 'string') setText(swaps[i], pack[key]);
    }
    // Specific block hooks
    setText(root.querySelector('[data-niche-tagline]'), pack.heroTagline);
    setText(root.querySelector('[data-niche-callout]'), pack.aquaResourceCallout);
    var promises = root.querySelectorAll('[data-niche-promise]');
    for (var j = 0; j < promises.length; j++) {
      var n = parseInt(promises[j].getAttribute('data-niche-promise'), 10) || 1;
      setText(promises[j], (pack.phasePromise || [])[n - 1]);
    }
    renderModules(root.querySelector('[data-niche-modules]'), pack.moduleHighlight);
    renderFaqs(root.querySelector('[data-niche-faqs]'), pack.faqs);

    // Tag <body> with the active niche so CSS can hook later if needed.
    if (document.body) document.body.setAttribute('data-incubator-niche', getNiche());

    /* R019 — apply niche asset pack tokens (CSS custom properties)
       on document.body. Honest fallback: when pack.assets.tokens is
       missing or empty, we leave existing CSS variables alone — R008
       defaults remain in force. */
    if (document.body && pack.assets && pack.assets.tokens) {
      var t = pack.assets.tokens;
      Object.keys(t).forEach(function (k) {
        document.body.style.setProperty(k, t[k]);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () { apply(document); });

  window.IncubatorCopy = {
    getNiche: getNiche,
    getPack: getPack,
    apply: apply,
    listNiches: function () { return Object.keys(window.IncubatorCopyPacks || {}); }
  };
})();
