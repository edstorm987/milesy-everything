/* Niche copy pack — coaches / consultants. */
(function () {
  window.IncubatorCopyPacks = window.IncubatorCopyPacks || {};
  window.IncubatorCopyPacks.coaching = {
    label: 'Coach / consultant',
    heroTagline: 'Your Onboarding Control Panel — the path from offering to practice.',
    aquaResourceCallout: 'A bonus shelf for the practitioner who wants leverage without losing intimacy.',
    phasePromise: [
      'Epic Intro is the orientation. Meet the team, set your practice intention, and complete a single first action that proves the doorway is open.',
      'Blueprint Setup is the two-week foundation pass. Fill in About my practice — your offer, your ideal client, your delivery rhythm — and submit your Q&A so we can prep your diagnostics.',
      'The Health Check surfaces the real leaks — visibility, conversion, retention. Together with the strategy review session, this phase produces a single page of priorities for Brand Builder.',
      'Brand Builder turns the priorities surfaced in Diagnostics into a brand kit, a positioning statement, and your launch-ready offer pages.'
    ],
    moduleHighlight: [
      { icon: '✍️', label: 'Niche down without shrinking', href: '../business-os app/module.html?id=core-principles' },
      { icon: '📝', label: 'High-ticket sales call frame',  href: '../business-os app/module.html?id=super-sales' },
      { icon: '🗓', label: 'Group + 1:1 delivery cadence',  href: '../business-os app/module.html?id=ops-sustainability' },
      { icon: '💬', label: 'Client → testimonial → referral', href: '../business-os app/module.html?id=referral-alchemy' }
    ],
    faqs: [
      { q: 'I don\'t want a "course business". Can I stay 1:1?',
        a: 'Yes. The Blueprint pass works whether you stay 1:1 or layer a group offer — we don\'t push leverage you don\'t want.' },
      { q: 'Will this make me sound like every other coach?',
        a: 'The Brand Builder phase explicitly prioritises distinctness — your language, your hooks, not a template.' }
    ],
    /* R019 — mountain-violet + dawn register. */
    assets: {
      tokens: {
        '--inc-pack-accent': '#a48ed1',
        '--inc-pack-tint':   'rgba(164, 142, 209, 0.12)',
        '--inc-pack-deep':   '#3b2c52'
      },
      emojis: { card: ['🏔','🌅','✍️','🧭','🗝','🌒'] }
    },
    /* R030 — 2 curated suggestions + 2 "Curate your own" placeholders. */
    videos: {
      'epic-intro':    { url: null, title: 'Niche down without shrinking', description: 'How specificity attracts the right buyer instead of repelling everyone.', suggestion: 'Search YouTube: "April Dunford positioning" / "Ramit Sethi finding your niche"' },
      'blueprint':     { url: null, title: 'Curate your own', description: 'No suggestion yet — pick a coaching-business or consultancy framework talk.', suggestion: 'Operator: try Alan Weiss "Million Dollar Consulting" / David C Baker talks' },
      'diagnostics':   { url: null, title: 'Reading your coaching HC', description: 'Where coaches typically over-rate retention and under-rate visibility.', suggestion: 'Search YouTube: "Justin Welsh solopreneur teardown" / "Sahil Bloom positioning"' },
      'brand-builder': { url: null, title: 'Curate your own', description: 'No suggestion yet — pick a brand-distinctness talk for solo practitioners.', suggestion: 'Operator: try Marie Forleo / Jenna Kutcher brand talks if they fit your voice' }
    }
  };
})();
