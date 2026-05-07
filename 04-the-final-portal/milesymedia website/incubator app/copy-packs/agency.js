/* Niche copy pack — agency. Default pack.
   Honesty contract: copy-only. No numbers, no promises, no fabricated outcomes. */
(function () {
  window.IncubatorCopyPacks = window.IncubatorCopyPacks || {};
  window.IncubatorCopyPacks.agency = {
    label: 'Agency',
    heroTagline: 'Your Onboarding Control Panel — Please Follow Each Step in Order.',
    aquaResourceCallout: 'A bonus shelf for the operator who wants to systemise the practice.',
    phasePromise: [
      'Epic Intro is the orientation. Meet the team, set your intention, and complete a single first action that proves the doorway is open.',
      'Blueprint Setup is the two-week foundation pass. Fill in About my business, walk through the strategy worksheets, and submit your Q&A so we can prep your diagnostics.',
      'The Health Check surfaces the real leaks — visibility, conversion, retention. Together with the strategy review session, this phase produces a single page of priorities for Brand Builder.',
      'Brand Builder turns the priorities surfaced in Diagnostics into a brand kit, a story, and your launch-ready assets.'
    ],
    moduleHighlight: [
      { icon: '🎯', label: 'Positioning the agency', href: '../business-os app/module.html?id=core-principles' },
      { icon: '📞', label: 'Discovery call structure', href: '../business-os app/module.html?id=super-sales' },
      { icon: '🛠', label: 'Service productisation',  href: '../business-os app/module.html?id=ops-sustainability' },
      { icon: '🤝', label: 'Referral system',         href: '../business-os app/module.html?id=referral-alchemy' }
    ],
    faqs: [
      { q: 'Will this work for a 1-person agency?',
        a: 'Yes — the protocols compress when there\'s only one operator. The Blueprint pass surfaces what to delegate first when you do hire.' },
      { q: 'I already have a CRM. Do I need BOS?',
        a: 'BOS is your operating layer; the CRM is a tool inside it. Most clients wire the existing CRM to BOS rather than replacing it.' }
    ],
    /* R019 — default pack: keep R008 marble + gold defaults. The
       loader treats absence-of-tokens as "use defaults" so every
       Incubator surface stays exactly as today when niche=agency. */
    assets: {
      tokens: {},
      emojis: { card: ['💼','🎯','📞','🛠','📋','🤝'] }
    }
  };
})();
