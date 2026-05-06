/* Shared Business OS helpers — included on every in-app page.
   Single source of truth for: user info hydration, mode (free vs
   customer), sidebar adaptation, and the dev bar. */

(function () {
  var KEY_USER = 'bos.user';
  var KEY_MODE = 'bos.mode';   // 'free' | 'customer'

  function getUser() {
    try { return JSON.parse(localStorage.getItem(KEY_USER) || 'null'); } catch (e) { return null; }
  }
  function getMode() {
    try { return localStorage.getItem(KEY_MODE) || 'free'; } catch (e) { return 'free'; }
  }
  function setMode(m) {
    try { localStorage.setItem(KEY_MODE, m); } catch (e) {}
  }

  /* The 9 add-ons. Same set is used in marketplace tiles AND, if the
     user is in customer mode, rendered as installed sidebar items. */
  var ADDONS = [
    { id: 'inbox',     name: 'All-in-One Inbox',     icon: '📥', cat: 'comms',     price: 49,  blurb: 'Email, SMS, WhatsApp, Instagram DMs — one queue, one team.' },
    { id: 'website',   name: 'Website Editor',       icon: '🪄', cat: 'site',      price: 79,  blurb: 'Drag-and-drop pages with the conversion blocks already built.' },
    { id: 'ecom',      name: 'Ecommerce',            icon: '🛒', cat: 'sell',      price: 89,  blurb: 'Storefront, cart, checkout, subscriptions. Stripe-ready.' },
    { id: 'fulfil',    name: 'Fulfilment',           icon: '📦', cat: 'sell',      price: 39,  blurb: 'Pick, pack, ship and track from the same place you sell.' },
    { id: 'members',   name: 'Memberships',          icon: '🎟', cat: 'retain',    price: 39,  blurb: 'Tiers, drip content, gated areas. No second login for customers.' },
    { id: 'affil',     name: 'Affiliates',           icon: '🤝', cat: 'grow',      price: 29,  blurb: 'Referral links, payouts, fraud checks — turn fans into a salesforce.' },
    { id: 'crm',       name: 'Client CRM',           icon: '🗂', cat: 'comms',     price: 49,  blurb: 'Pipelines, notes, tasks, automated follow-ups.' },
    { id: 'marketing', name: 'Marketing Suite',      icon: '📣', cat: 'grow',      price: 59,  blurb: 'Email, SMS, broadcast, segmentation, automation flows.' },
    { id: 'finance',   name: 'Finance',              icon: '💷', cat: 'ops',       price: 39,  blurb: 'Invoicing, reconciliation, tax-ready reports for your accountant.' }
  ];

  /* Hydrate name/business/initials anywhere a [data-bos-*] hook exists */
  function hydrateUser() {
    var u = getUser() || { name: 'Friend', business: 'Your Business', email: '' };
    var first = (u.name || 'Friend').split(' ')[0];
    var initials = (u.name || 'F L').split(/\s+/).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase();
    var hr = new Date().getHours();
    var greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    document.querySelectorAll('[data-bos-name]').forEach(function (el) { el.textContent = u.name || 'Friend'; });
    document.querySelectorAll('[data-bos-business]').forEach(function (el) { el.textContent = u.business || ''; });
    document.querySelectorAll('[data-bos-initial]').forEach(function (el) { el.textContent = initials || 'YOU'; });
    document.querySelectorAll('[data-bos-greet]').forEach(function (el) { el.textContent = greet + ', ' + first + '.'; });
    document.querySelectorAll('[data-bos-greet-prefix]').forEach(function (el) { el.textContent = greet + ', ' + first; });
  }

  /* Sidebar adapts to mode. We don't rebuild it — we toggle classes
     and inject the installed-tools list when customer mode is on. */
  function applyMode() {
    var mode = getMode();
    document.body.setAttribute('data-bos-mode', mode);

    /* Rename "Business OS" sidebar group label when customer */
    document.querySelectorAll('[data-bos-os-label]').forEach(function (el) {
      el.textContent = mode === 'customer' ? 'Resources' : 'Workspace';
    });

    /* Locked Aqua portal section. Customer = unlocked + active link */
    document.querySelectorAll('[data-bos-aqua]').forEach(function (el) {
      if (mode === 'customer') {
        el.classList.remove('bos-aqua-locked');
        el.classList.add('bos-aqua-unlocked');
        var a = el.querySelector('a');
        if (a) {
          a.classList.remove('bos-locked');
          a.innerHTML = '<span class="ico">▣</span> Aqua agency portal <span class="bos-installed-tag">Active</span>';
          a.setAttribute('href', '#');
        }
        var foot = el.querySelector('p');
        if (foot) foot.textContent = 'Your full agency portal — campaigns, finance, team, the lot.';
      }
    });

    /* Inject installed tools list when customer */
    var slot = document.querySelector('[data-bos-tools-slot]');
    if (slot) {
      if (mode === 'customer') {
        slot.innerHTML = ''
          + '<div class="bos-side-label">Your tools</div>'
          + ADDONS.map(function (a) {
              return '<a href="#" class="bos-installed">'
                + '<span class="ico">' + a.icon + '</span> ' + a.name
                + '<span class="bos-installed-tag">Installed</span>'
                + '</a>';
            }).join('');
      } else {
        slot.innerHTML = ''
          + '<div class="bos-side-label">Add-ons</div>'
          + '<a href="marketplace.html"><span class="ico">✨</span> Marketplace</a>'
          + '<p class="bos-side-foot">Pick &amp; mix the tools your business needs.</p>';
      }
    }
  }

  /* Inject the dev bar onto every in-app page */
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
      + '<a href="../lead magnet app/index.html">Lead-magnet</a>'
      + '<button data-bos-mode-toggle>' + (mode === 'customer' ? 'Customer' : 'Free') + ' →</button>'
      + '<button data-bos-reset>Reset</button>';
    document.body.appendChild(bar);

    bar.querySelector('[data-bos-mode-toggle]').addEventListener('click', function () {
      setMode(getMode() === 'customer' ? 'free' : 'customer');
      window.location.reload();
    });
    bar.querySelector('[data-bos-reset]').addEventListener('click', function () {
      try { localStorage.removeItem(KEY_USER); localStorage.removeItem(KEY_MODE); } catch (e) {}
      window.location.href = 'index.html';
    });
  }

  /* Marketplace tile rendering — used by marketplace.html */
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
          +   '<div>'
          +     '<h3>' + a.name + '</h3>'
          +     '<div class="addon-cat">' + categoryLabel(a.cat) + '</div>'
          +   '</div>'
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

  /* Boot */
  document.addEventListener('DOMContentLoaded', function () {
    hydrateUser();
    applyMode();
    mountDevBar();
  });

  /* Expose for marketplace */
  window.BOS = { renderMarketplace: renderMarketplace, getMode: getMode, ADDONS: ADDONS };
})();
