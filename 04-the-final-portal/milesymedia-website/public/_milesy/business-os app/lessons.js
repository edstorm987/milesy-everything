/* Business OS lesson library.
   Each lesson is a self-contained record: title, lead, outline, body
   (HTML), prev/next nav. module.html renders the one matching ?id=. */

window.BOS_LESSONS = {

  /* ─── 1.1 — Chrome profile setup ─────────── */
  'chrome-profile': {
    id: 'chrome-profile',
    track: 'Foundations',
    step:  '1.1',
    icon:  '🧰',
    title: 'Set up your Chrome profile.',
    lead:  "The plumbing of a serious business. A dedicated Chrome profile keeps your work tools, bookmarks and logins separate from your personal browsing — and we ship a preloaded profile that does the boring setup for you.",
    progress: { current: 1, total: 4, pct: 25 },
    outline: [
      { id: 'why',     title: 'Why a separate profile' },
      { id: 'install', title: 'Installing the profile' },
      { id: 'whats',   title: "What's preloaded" },
      { id: 'first',   title: 'Your first customisation' }
    ],
    next: { href: 'module.html?id=private-hub',     label: 'Step 1.2 — Duplicate your private hub →' },
    body: ''
      + '<h2 id="why">Why a separate profile</h2>'
      + '<p>Most founders run their business from their personal browser. They mix work logins with shopping, family photos with client docs, the kids\' YouTube with their CRM. It feels harmless until something breaks.</p>'
      + '<ul>'
      + '  <li>You log into a client\'s account from your personal session and forget to log out.</li>'
      + '  <li>Your password manager autofills the wrong card on a £500 supplier order.</li>'
      + '  <li>You hand the laptop to a contractor and they can see every tab you\'ve ever opened.</li>'
      + '</ul>'
      + '<p>A dedicated profile draws a clean line. <em>This is work. That is life.</em> Different bookmarks, different extensions, different defaults, different password vaults.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Bonus:</strong> when you eventually hire someone, you hand them a profile, not your laptop. The system survives staff turnover.</div></div>'

      + '<h2 id="install">Installing the profile</h2>'
      + '<p>Three steps. Five minutes.</p>'
      + '<ol>'
      + '  <li>Open Chrome. Click your profile circle (top-right).</li>'
      + '  <li>Choose <em>Add</em> → <em>Sign in</em>. Use your business email, not personal.</li>'
      + '  <li>Download the Milesy Chrome profile pack from the link in your welcome email and import it under <em>Settings → You and Google → Sync</em>.</li>'
      + '</ol>'
      + '<p>If you skip step 3 you\'ll still have a clean profile — you just won\'t get the preloaded extensions and bookmarks. You can run the import later.</p>'

      + '<h2 id="whats">What\'s preloaded</h2>'
      + '<p>Inside the pack:</p>'
      + '<ul>'
      + '  <li><strong>Bookmarks bar</strong> — your portal, your hub, your tools, your client list.</li>'
      + '  <li><strong>Extensions</strong> — password manager, screen recorder, the writing assistant we use, a meeting transcriber.</li>'
      + '  <li><strong>Search shortcuts</strong> — type <code>gbp</code> in the address bar to jump straight to your Google Business Profile, <code>os</code> for your OS, etc.</li>'
      + '  <li><strong>Default homepage</strong> — your daily dashboard, not a generic search.</li>'
      + '</ul>'
      + '<div class="bos-callout bos-callout-warn"><span>⚠️</span><div>Don\'t install everything at once. Pick the three things you\'ll use this week. The rest can wait.</div></div>'

      + '<h2 id="first">Your first customisation</h2>'
      + '<p>One small ritual the day you set this up:</p>'
      + '<ol>'
      + '  <li>Pin your portal tab. Always-on, always-first.</li>'
      + '  <li>Make your password manager require biometrics — no exceptions.</li>'
      + '  <li>Clear your default downloads folder. Set it to a sub-folder named <code>~/Downloads/Business/</code> so business files have a home.</li>'
      + '</ol>'
      + '<p>That\'s it. The rest of the OS expects this profile to exist. Now we move on.</p>'
  },

  /* ─── 1.5 — Core Principles ───────────────── */
  'core-principles': {
    id: 'core-principles',
    track: 'Psychology',
    step:  '1.5',
    icon:  '🧠',
    title: 'Core Principles.',
    lead:  "The non-negotiables. Read this before you build anything else. These ideas aren't a pep talk — they're the philosophical bedrock the rest of the OS sits on. If you don't have these, every system you build will eventually leak.",
    progress: { current: 2, total: 5, pct: 40 },
    outline: [
      { id: 'why',         title: 'Why this exists' },
      { id: 'subtraction', title: 'Subtraction beats addition' },
      { id: 'survive',     title: 'Survive, then win' },
      { id: 'behaviour',   title: 'Behaviour, not goals' },
      { id: 'mvb',         title: 'Crafting your MVB' }
    ],
    next: { href: 'module.html?id=domain-email', label: 'Step 2.1 — Domain & email →' },
    body: ''
      + '<h2 id="why">Why this exists</h2>'
      + '<p>Most frameworks fail because they ask founders to <em>build on sand</em>. Tactics, funnels, growth hacks — none of it works if the ground underneath is unstable. So before you set up tools, write SOPs or run ads, we install the principles that hold everything else up.</p>'
      + '<p>You will complete everything in this OS. But only in the correct sequence. Trust the structure.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>The promise.</strong> If you take these five principles seriously, every later module compounds. If you skip them, you\'ll build the wrong things faster.</div></div>'

      + '<h2 id="subtraction">Subtraction beats addition</h2>'
      + '<p>You don\'t need to do <em>more</em>. You need to stop doing the things quietly breaking you. Most upside in business comes from the removal of stupidity, not the addition of cleverness.</p>'
      + '<p>The shiny-object founder adds a new funnel, a new ad platform, a new tool, a new offer. Meanwhile they\'re hungover, sleep-deprived, eating badly, and ignoring their best customer. They obsess over add-ons but forget catastrophic downsides.</p>'
      + '<p>Make a list of the stupid things you currently do. Remove them first. <em>Then</em> you can look at the advanced moves. Do the masses of simples before the few advanced.</p>'
      + '<div class="bos-callout bos-callout-warn"><span>⚠️</span><div><strong>Buffett\'s rule.</strong> "I want to know where I\'m going to die so I don\'t go there." Avoiding errors is one of the best winning strategies. Pay more attention to the downside than to the upside.</div></div>'

      + '<h2 id="survive">Survive, then win</h2>'
      + '<p>Most founders focus on winning before they\'ve secured survival. That\'s a fat person buying £400 running shoes. A car with ceramic brakes that never gets serviced. Infinite complexity stacked on a broken base.</p>'
      + '<p>Priority order, every quarter:</p>'
      + '<ol>'
      + '  <li><strong>Survive.</strong> Cash, runway, contracts you can honour, sleep, family.</li>'
      + '  <li><strong>Stabilise.</strong> Same customer experience every time. The system runs without you for 48 hours.</li>'
      + '  <li><strong>Win.</strong> Now you can take aggressive bets — because the base will absorb a missed shot.</li>'
      + '</ol>'
      + '<p>If something on layer 3 threatens layer 1, kill it. Even if it\'s exciting.</p>'

      + '<h2 id="behaviour">Behaviour, not goals</h2>'
      + '<p>Goals are downstream of habits. If you continue to behave the way you behaved last year, you\'ll get what you got last year — no matter how ambitious the goal. You don\'t <em>set</em> a different result. You <em>change behaviour</em> to get a different result.</p>'
      + '<p>That\'s why this OS doesn\'t ask you to write affirmations. It asks you to install rhythms — daily, weekly, monthly — that <em>force</em> a different shape of attention. The goal is downstream of the calendar.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Action × Intention multiplier.</strong> Manifestation alone doesn\'t work. Intention without action is fantasy. Action without intention is noise. The two together compound.</div></div>'

      + '<h2 id="mvb">Crafting your MVB</h2>'
      + '<p>Your MVB — Minimum Viable Business — is the simplest possible version that meets three conditions: it pays you, it serves your customer well, it can be repeated without you in the room.</p>'
      + '<p>That\'s it. No more.</p>'
      + '<p>The trap most founders fall into is dressing up the MVB before it works:</p>'
      + '<ul>'
      + '  <li>Picking a logo before you have a customer.</li>'
      + '  <li>Building a website before you\'ve sold anything by hand.</li>'
      + '  <li>Adding a second product before the first one is repeatable.</li>'
      + '  <li>Hiring a team before you can write down what they\'ll do.</li>'
      + '</ul>'
      + '<p>Your job in the early modules of this OS is to find the MVB, then <em>protect it</em> while you fortify the surrounds. Once it survives without you, you\'ve earned the right to add complexity.</p>'
  },

  /* ─── 3.5 — Super Sales ───────────────────── */
  'super-sales': {
    id: 'super-sales',
    track: 'Sales',
    step:  '3.5',
    icon:  '💰',
    title: 'The Super Sales framework.',
    lead:  "How to take a stranger from \"never heard of you\" to \"send invoice\" in seven touches. Not a manipulative funnel — a respectful, repeatable rhythm that earns the sale by the time you ask for it.",
    progress: { current: 1, total: 6, pct: 16 },
    outline: [
      { id: 'frame',     title: 'The frame: earned vs extracted' },
      { id: 'touches',   title: 'The seven touches' },
      { id: 'sequence',  title: 'Sequencing the touches' },
      { id: 'templates', title: 'Templates you can steal' },
      { id: 'tracking',  title: 'Tracking what works' },
      { id: 'failures',  title: 'Why most sales fail (and the fix)' }
    ],
    next: { href: 'module.html?id=sales-sops', label: 'Step 3.6 — Sales SOPs →' },
    body: ''
      + '<h2 id="frame">The frame: earned vs extracted</h2>'
      + '<p>Most founders sell as if every conversation needs to end in a yes. The Super Sales frame inverts it: every conversation needs to <em>deserve</em> the yes.</p>'
      + '<p>Earned sales repeat, refer, and forgive small mistakes. Extracted sales churn, refund, and post one-star reviews. Same revenue today; very different revenue in eighteen months.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>The mantra.</strong> Be useful before you\'re paid. The sale becomes a formality.</div></div>'

      + '<h2 id="touches">The seven touches</h2>'
      + '<p>Most B2C sales close in 2-5 touches. Most B2B in 7-12. Plan for seven and you\'ll be early on the easy ones and patient on the hard ones.</p>'
      + '<ol>'
      + '  <li><strong>Discovery.</strong> They find you — content, search, recommendation. Job: be findable and clearly relevant.</li>'
      + '  <li><strong>First impression.</strong> Your homepage / profile / pitch. Job: pass the 5-second test.</li>'
      + '  <li><strong>Useful taste.</strong> A free thing that solves a real problem (the Health Check, a guide, a calculator).</li>'
      + '  <li><strong>Permission.</strong> They invite further contact (book a call, opt-in, follow).</li>'
      + '  <li><strong>Specific value.</strong> One personalised piece of help — not a template, not a deck, something for them.</li>'
      + '  <li><strong>The frame.</strong> A clear, honest description of what working together looks like, what it costs, what it doesn\'t.</li>'
      + '  <li><strong>The ask.</strong> Direct, simple, no theatrics.</li>'
      + '</ol>'

      + '<h2 id="sequence">Sequencing the touches</h2>'
      + '<p>Two rules of sequencing:</p>'
      + '<ol>'
      + '  <li><strong>No skipping.</strong> If you go from touch 1 to touch 7 — "found you / send invoice" — the close rate collapses. The middle touches build the right to ask.</li>'
      + '  <li><strong>No back-tracking.</strong> Once they\'ve seen the price, don\'t pretend they haven\'t. Once they\'ve had the discovery call, don\'t treat them like a cold lead.</li>'
      + '</ol>'
      + '<p>Map every prospect to a touch number. Your weekly review is "who\'s on touch 4 and needs 5".</p>'

      + '<h2 id="templates">Templates you can steal</h2>'
      + '<p>Three messages that earn touches without asking for the sale:</p>'
      + '<div class="bos-callout bos-callout-good"><span>✉</span><div><strong>The "saw this" message.</strong> "Hi [first], saw [specific thing about them — recent post, change, win]. Reminded me of [tiny insight]. No ask — just thought you\'d find it useful."</div></div>'
      + '<div class="bos-callout bos-callout-good"><span>✉</span><div><strong>The "honest take" message.</strong> "Spent 10 minutes on your [site / GMB / page] — here are the three things I\'d change. Would do it for free if you\'d like."</div></div>'
      + '<div class="bos-callout bos-callout-good"><span>✉</span><div><strong>The "stage check" message.</strong> "Are you currently working on [outcome]? Yes / no / not yet — happy whichever. Helps me know if anything I send is useful."</div></div>'
      + '<p>None of these ask for the sale. All of them advance the touch count.</p>'

      + '<h2 id="tracking">Tracking what works</h2>'
      + '<p>Two numbers, weekly review:</p>'
      + '<ol>'
      + '  <li><strong>Touch advancement rate.</strong> Of the prospects you spoke to last week, what % moved up at least one touch? Aim 60%+.</li>'
      + '  <li><strong>Quality of "no".</strong> The good "no" is fast and specific ("we use X already / not the right size"). The bad "no" is silence. Silence means a touch failed — usually touch 2 or 3.</li>'
      + '</ol>'

      + '<h2 id="failures">Why most sales fail (and the fix)</h2>'
      + '<p>Three failure patterns we see weekly:</p>'
      + '<ul>'
      + '  <li><strong>"They went silent."</strong> Almost always a touch-2 problem. Your first impression didn\'t pass the 5-second test. Fix the homepage.</li>'
      + '  <li><strong>"They wanted to think about it."</strong> Touch-6 problem. The frame wasn\'t clear. They didn\'t reject your offer — they didn\'t understand it.</li>'
      + '  <li><strong>"They ghosted after the call."</strong> Touch-5 problem. The call was useful in general but not personal. Specific value beats generic insight every time.</li>'
      + '</ul>'
      + '<p>Diagnose by the touch number, not by the result. The result is a symptom.</p>'
  },

  /* ─── 4.4 — Operations & Sustainability ──── */
  'ops-sustainability': {
    id: 'ops-sustainability',
    track: 'Operations',
    step:  '4.4',
    icon:  '⚙',
    title: 'Operations &amp; Sustainability.',
    lead:  "Build the engine that lets you take a holiday without revenue dropping. This module makes the difference between owning a business and owning a job.",
    progress: { current: 1, total: 5, pct: 20 },
    outline: [
      { id: 'engine',  title: 'The engine principle' },
      { id: 'flows',   title: 'Workflows that survive Mondays' },
      { id: 'kpis',    title: 'KPIs that actually steer' },
      { id: 'sops',    title: 'SOPs nobody resents writing' },
      { id: 'test',    title: 'The 48-hour sustainability test' }
    ],
    next: { href: 'module.html?id=referral-alchemy', label: 'Step 5.2 — Referral Alchemy →' },
    body: ''
      + '<h2 id="engine">The engine principle</h2>'
      + '<p>An engine produces output reliably regardless of who\'s in the room. A craftsperson produces output beautifully but only when they\'re present.</p>'
      + '<p>Most founders accidentally build a craftsperson business and then wonder why they can\'t take a week off without revenue collapsing. The fix isn\'t to work harder — it\'s to convert craft into engine, deliberately, one workflow at a time.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>The test.</strong> A workflow is "engine" if a competent stranger could pick up the documentation and run it without calling you. If they\'d need to call you, it\'s still craft. Document until they wouldn\'t.</div></div>'

      + '<h2 id="flows">Workflows that survive Mondays</h2>'
      + '<p>Pick the three workflows your business depends on. For most service businesses they\'re:</p>'
      + '<ol>'
      + '  <li><strong>Lead → first call</strong>  (intake, qualification, scheduling).</li>'
      + '  <li><strong>First call → signed customer</strong>  (proposal, contract, deposit).</li>'
      + '  <li><strong>Signed customer → delivered + paid</strong>  (kickoff, delivery, invoice, follow-up).</li>'
      + '</ol>'
      + '<p>For each, write the steps in order. Then for each step, three things: who owns it, what triggers it, what proves it\'s done. That\'s 80% of the value of "having a workflow". The remaining 20% is reviewing it monthly.</p>'

      + '<h2 id="kpis">KPIs that actually steer</h2>'
      + '<p>Five numbers, not fifty. The five we recommend for most service businesses:</p>'
      + '<ul>'
      + '  <li><strong>New leads this week.</strong> Top of funnel.</li>'
      + '  <li><strong>Conversion rate, lead → customer.</strong> Funnel health.</li>'
      + '  <li><strong>Average revenue per customer.</strong> Pricing health.</li>'
      + '  <li><strong>On-time delivery rate.</strong> Operations health.</li>'
      + '  <li><strong>Free-cash-flow runway in months.</strong> Survival health.</li>'
      + '</ul>'
      + '<p>Reviewed every Monday in 15 minutes. If a number moves more than 20% week-on-week, that\'s the conversation for the week. If they\'re flat, no meeting needed.</p>'
      + '<div class="bos-callout bos-callout-warn"><span>⚠️</span><div>Don\'t add a sixth number until you\'ve looked at these five for eight weeks straight. Most founders collect dashboards instead of using them.</div></div>'

      + '<h2 id="sops">SOPs nobody resents writing</h2>'
      + '<p>An SOP is a one-page document that says: <em>here\'s how we do this, every time, in detail enough that a new person could follow it.</em></p>'
      + '<p>The reason most SOPs fail is they\'re written like legal documents. Make them like recipes:</p>'
      + '<ul>'
      + '  <li><strong>Title</strong> — what task this covers.</li>'
      + '  <li><strong>When to use it</strong> — the trigger.</li>'
      + '  <li><strong>Who owns it</strong> — one named human.</li>'
      + '  <li><strong>The steps</strong> — numbered, with screenshots where helpful.</li>'
      + '  <li><strong>Done looks like</strong> — the proof of completion.</li>'
      + '  <li><strong>Common gotchas</strong> — written from real experience.</li>'
      + '</ul>'
      + '<p>One a week. After a quarter you\'ll have 12 — most of your business in writing.</p>'

      + '<h2 id="test">The 48-hour sustainability test</h2>'
      + '<p>Every quarter, run this test:</p>'
      + '<ol>'
      + '  <li>Pick a 48-hour window where you don\'t respond to anything.</li>'
      + '  <li>At the end, audit: what broke, what stalled, what got handled well?</li>'
      + '  <li>Whatever broke is your next SOP / workflow / hire.</li>'
      + '</ol>'
      + '<p>The first time you run this you\'ll find a list a mile long. The eighth time you run it, the list will be three items. That\'s the engine.</p>'
  },

  /* ─── 5.2 — Referral Alchemy ──────────────── */
  'referral-alchemy': {
    id: 'referral-alchemy',
    track: 'Growth',
    step:  '5.2',
    icon:  '🤝',
    title: 'Client longevity &amp; referral alchemy.',
    lead:  "A referred customer is 4× more likely to buy and stay. They cost nothing to acquire, trust you faster, complain less. Yet most businesses leave referrals to chance. This module turns hope into a system.",
    progress: { current: 1, total: 4, pct: 25 },
    outline: [
      { id: 'why-refer', title: 'Why referrals are unfairly good' },
      { id: 'ask',       title: 'The ask script' },
      { id: 'moments',   title: 'The trigger moments' },
      { id: 'reward',    title: 'The reward system' }
    ],
    next: { href: 'module.html?id=founders-fortune', label: 'Bonus — The Founder\'s Fortune (locked) →' },
    body: ''
      + '<h2 id="why-refer">Why referrals are unfairly good</h2>'
      + '<p>Three numbers nobody can argue with:</p>'
      + '<ul>'
      + '  <li>Referred customers are <strong>4× more likely to buy</strong> than cold leads (Wharton, repeated studies).</li>'
      + '  <li>Their <strong>lifetime value is 16-25% higher</strong> than non-referred customers (Goethe University).</li>'
      + '  <li>They <strong>cost zero to acquire</strong>. The whole CAC line is a different colour.</li>'
      + '</ul>'
      + '<p>So why don\'t most businesses have a referral system? Because asking for one feels awkward, and "let me know if anyone needs us" isn\'t a system, it\'s a hope. The fix is process: who you ask, when you ask, how you ask, what you offer.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>The principle.</strong> Make it easier to refer you than to not. Most happy customers <em>would</em> refer — they just don\'t know how, when, or what to say.</div></div>'

      + '<h2 id="ask">The ask script</h2>'
      + '<p>One short message. Three parts:</p>'
      + '<ol>'
      + '  <li><strong>Acknowledge.</strong> "We just hit [milestone] together — couldn\'t have done it without you."</li>'
      + '  <li><strong>Ask narrowly.</strong> Not "do you know anyone?" — that\'s too broad and gets a polite "I\'ll think about it." Ask: "Who in your world is dealing with [specific problem we solve]?"</li>'
      + '  <li><strong>Make it copy-pasteable.</strong> "If anyone comes to mind, here\'s a one-line you can forward — saves you writing it." (Then attach the one-liner.)</li>'
      + '</ol>'
      + '<p>The narrow ask is the alchemy. "Who do you know?" returns nothing. "Who in your world is dealing with X?" returns names.</p>'

      + '<h2 id="moments">The trigger moments</h2>'
      + '<p>Don\'t ask all the time. Ask at the four moments when the answer is loudest:</p>'
      + '<ol>'
      + '  <li><strong>The breakthrough.</strong> Right after a real win — first sale, first hire, first 5-star review. Their gratitude is at peak.</li>'
      + '  <li><strong>The unprompted compliment.</strong> They thanked you in writing. Reply: "Thank you. The biggest compliment is one warm intro to someone like you."</li>'
      + '  <li><strong>The renewal.</strong> They re-signed or re-ordered. They\'re voting with their wallet.</li>'
      + '  <li><strong>The off-boarding.</strong> Even when a project ends, the door isn\'t closed. "Who else should we be helping?"</li>'
      + '</ol>'
      + '<p>Calendar it. Each of these moments has a workflow trigger. The system fires the message — you just personalise it.</p>'

      + '<h2 id="reward">The reward system</h2>'
      + '<p>Two-sided rewards convert at ~2× the rate of one-sided. The referrer gets something. The referred gets something. Both get treated.</p>'
      + '<p>Common patterns that work:</p>'
      + '<ul>'
      + '  <li><strong>Service businesses</strong> — a credit on their next invoice (£100-£250 typical).</li>'
      + '  <li><strong>Product businesses</strong> — a percentage off + free-shipping for both sides.</li>'
      + '  <li><strong>Premium / B2B</strong> — donation to a charity of their choice. Cash feels grubby; donations feel grateful.</li>'
      + '</ul>'
      + '<div class="bos-callout bos-callout-warn"><span>⚠️</span><div>Track this in writing. Verbal "I\'ll sort you out" promises die a death. A simple referral CRM (or even a Notion table) keeps trust intact.</div></div>'
      + '<p>Run this for 12 months and 25-40% of new revenue will come through referrals. For free. While you sleep.</p>'
  }
};
