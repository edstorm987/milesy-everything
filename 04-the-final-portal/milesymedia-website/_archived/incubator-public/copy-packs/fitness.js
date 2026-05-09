/* Niche copy pack — fitness studios / coaches / gyms. */
(function () {
  window.IncubatorCopyPacks = window.IncubatorCopyPacks || {};
  window.IncubatorCopyPacks.fitness = {
    label: 'Fitness studio / coach',
    heroTagline: 'Your Onboarding Control Panel — the path from sessions to a practice.',
    aquaResourceCallout: 'A bonus shelf for the operator who wants the studio to run without them in the room.',
    phasePromise: [
      'Epic Intro is the orientation. Meet the team, set your studio intention, and complete a single first action that proves the doorway is open.',
      'Blueprint Setup is the two-week foundation pass. Fill in About my studio — schedule, programmes, the member you serve — and submit your Q&A so we can prep your diagnostics.',
      'The Health Check surfaces the real leaks — trial conversion, retention, attendance. Together with the strategy review session, this phase produces a single page of priorities for Brand Builder.',
      'Brand Builder turns the priorities surfaced in Diagnostics into a brand kit, a programme story, and your launch-ready membership pages.'
    ],
    moduleHighlight: [
      { icon: '💪', label: 'Programme architecture',     href: '../business-os/module.html?id=core-principles' },
      { icon: '🎟', label: 'Trial → member conversion',  href: '../business-os/module.html?id=super-sales' },
      { icon: '🔁', label: 'Retention + attendance',     href: '../business-os/module.html?id=ops-sustainability' },
      { icon: '🤝', label: 'Member → friend referral',   href: '../business-os/module.html?id=referral-alchemy' }
    ],
    faqs: [
      { q: 'I run sessions all day — when do I do this?',
        a: 'The Blueprint pass is built for short blocks (15–30 mins between sessions). Each phase is a checklist, not a course.' },
      { q: 'Does this work for online + in-person hybrid?',
        a: 'Yes. About-my-studio captures both surfaces; the recommended modules cover hybrid attendance + retention.' }
    ],
    /* R019 — energy coral + sunset register. */
    assets: {
      tokens: {
        '--inc-pack-accent': '#e0805a',
        '--inc-pack-tint':   'rgba(224, 128, 90, 0.12)',
        '--inc-pack-deep':   '#5a2a14'
      },
      emojis: { card: ['💪','🔥','🏃','🎟','🔁','🏋'] }
    },
    /* R030 — 2 curated suggestions + 2 "Curate your own" placeholders. */
    videos: {
      'epic-intro':    { url: null, title: 'From sessions to a practice', description: 'The mindset shift from selling hours to building a programme.', suggestion: 'Search YouTube: "Pat Rigsby fitness business" / "Mark Fisher Fitness culture talks"' },
      'blueprint':     { url: null, title: 'Curate your own', description: 'No suggestion yet — pick a programme-architecture talk for studio owners.', suggestion: 'Operator: try Peloton/Equinox founder talks or NSCA business sessions' },
      'diagnostics':   { url: null, title: 'Reading your fitness HC', description: 'Where studios over-rate trial conversion and under-rate week-2 retention.', suggestion: 'Search YouTube: "Chris Cooper Two-Brain Business" / "Mike Boyle business of training"' },
      'brand-builder': { url: null, title: 'Curate your own', description: 'No suggestion yet — pick a fitness-brand storytelling talk.', suggestion: 'Operator: try CorePower / SoulCycle brand talks; or pick from your favourite trainer educators' }
    }
  };
})();
