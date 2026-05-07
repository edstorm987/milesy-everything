/* Niche copy pack — skincare brands / aestheticians. */
(function () {
  window.IncubatorCopyPacks = window.IncubatorCopyPacks || {};
  window.IncubatorCopyPacks.skincare = {
    label: 'Skincare brand',
    heroTagline: 'Your Onboarding Control Panel — the path from product to ritual.',
    aquaResourceCallout: 'Resources for the brand that treats skin as a craft, not a category.',
    phasePromise: [
      'Epic Intro is the orientation. Meet the team, set your brand intention, and complete a single first action that proves the doorway is open.',
      'Blueprint Setup is the two-week foundation pass. Fill in About my brand — products, ritual, the customer you serve — and submit your Q&A so we can prep your diagnostics.',
      'The Health Check surfaces the real leaks — discovery, repeat purchase, education. Together with the strategy review session, this phase produces a single page of priorities for Brand Builder.',
      'Brand Builder turns the priorities surfaced in Diagnostics into a brand kit, a packaging story, and your launch-ready content.'
    ],
    moduleHighlight: [
      { icon: '🌿', label: 'Ingredient storytelling',    href: '../business-os app/module.html?id=core-principles' },
      { icon: '🛍', label: 'Product page that converts', href: '../business-os app/module.html?id=super-sales' },
      { icon: '🔁', label: 'Repeat-purchase ritual',     href: '../business-os app/module.html?id=ops-sustainability' },
      { icon: '📸', label: 'UGC + creator referrals',    href: '../business-os app/module.html?id=referral-alchemy' }
    ],
    faqs: [
      { q: 'I sell on Shopify already. Does anything change?',
        a: 'Shopify stays your storefront. BOS becomes the layer above it — content, customer journey, repeat-purchase rituals.' },
      { q: 'My ingredient story is technical. Can the copy carry that?',
        a: 'Yes — the Blueprint pass captures your INCI list and reframes it for the customer without losing the science.' }
    ],
    /* R019 — pure-CSS asset pack. Botanical jade + warm sand register. */
    assets: {
      tokens: {
        '--inc-pack-accent': '#9bbf8a',
        '--inc-pack-tint':   'rgba(155, 191, 138, 0.12)',
        '--inc-pack-deep':   '#2c4a36'
      },
      emojis: { card: ['🌿','🌱','🌸','💧','🍃','🪴'] }
    },
    /* R030 — 2 curated suggestions + 2 "Curate your own" placeholders. */
    videos: {
      'epic-intro':    { url: null, title: 'From product to ritual', description: 'Why skincare wins on ritual, not on ingredients alone.', suggestion: 'Search YouTube: "Tata Harper founder story" / "Drunk Elephant Tiffany Masterson"' },
      'blueprint':     { url: null, title: 'Curate your own', description: 'No suggestion yet — pick a 12-minute brand-building talk that frames your blueprint.', suggestion: 'Operator: search for a Shopify Masters / Glossy Beauty episode you trust' },
      'diagnostics':   { url: null, title: 'Reading your skincare brand HC honestly', description: 'How to interpret discovery + repeat-purchase scores without flattering yourself.', suggestion: 'Search YouTube: "Bonnie Bahl beauty brand teardown" / "Indie Beauty Media Group founder talks"' },
      'brand-builder': { url: null, title: 'Curate your own', description: 'No suggestion yet — pick a packaging-or-positioning talk that fits your phase.', suggestion: 'Operator: search Pottery, design + brand talks; Marty Neumeier or April Dunford work too' }
    }
  };
})();
