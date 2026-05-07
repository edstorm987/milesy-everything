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
  },

  /* ─── 1.2 — Duplicate your private hub (R015) ─────────── */
  'private-hub': {
    id: 'private-hub', track: 'Foundations', step: '1.2', icon: '🗂',
    title: 'Duplicate your private hub.',
    lead: "Your own private workspace — separate from anything we can see. Where decisions get drafted before they go to clients, and where the long thinking lives.",
    progress: { current: 2, total: 4, pct: 50 },
    phases: ['epic-intro', 'blueprint'],
    outline: [
      { id: 'why',   title: 'Why a private hub' },
      { id: 'what',  title: "What's in the template" },
      { id: 'fork',  title: 'Forking your copy' },
      { id: 'first', title: 'Your first three pages' }
    ],
    next: { href: 'module.html?id=storage-drives', label: 'Step 1.3 — Storage drives setup →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> The 60-minute version. Deeper Pro Mastery lives in the retainer cohort.</div></div>'
      + '<h2 id="why">Why a private hub</h2>'
      + '<p>The portal is your shop window — clients see surfaces, dashboards, deliverables. The private hub is the workshop behind it. Half-formed ideas, draft proposals, the messy version of every framework before it cleans up.</p>'
      + '<p>Without one, half-thoughts live in DMs and disappear when the chat scrolls. You re-think the same problem six times because the prior thinking has no home.</p>'
      + '<h2 id="what">What\'s in the template</h2>'
      + '<ul>'
      + '  <li><strong>Decision log</strong> — every meaningful "we chose X over Y because Z".</li>'
      + '  <li><strong>Drafts shelf</strong> — proposals, emails, copy, in their messy state.</li>'
      + '  <li><strong>Reading list</strong> — what to read this quarter; what you read last quarter.</li>'
      + '  <li><strong>Quarterly review</strong> — three numbers, three lessons, three changes.</li>'
      + '</ul>'
      + '<h2 id="fork">Forking your copy</h2>'
      + '<p>Open the template link in your welcome email. Click <em>Duplicate</em>. Move it to your own workspace. Don\'t rename anything yet — use the structure for two weeks before you customise.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> open the duplicated hub now, fill in <em>Decision log entry #1</em> with the most recent business decision you made.</div></div>'
      + '<h2 id="first">Your first three pages</h2>'
      + '<p>Don\'t try to populate everything. Three pages in week one:</p>'
      + '<ol>'
      + '  <li>One <em>Decision log</em> entry from the past 30 days.</li>'
      + '  <li>One <em>Draft</em> — anything you\'re writing right now.</li>'
      + '  <li>One <em>Reading list</em> entry — what you\'re reading this week.</li>'
      + '</ol>'
      + '<p>By week two it\'ll feel like home. By month three you won\'t remember how you operated without it.</p>'
  },

  /* ─── 1.3 — Storage drives setup (R015) ─────────── */
  'storage-drives': {
    id: 'storage-drives', track: 'Foundations', step: '1.3', icon: '💾',
    title: 'Storage drives setup.',
    lead: "Where your files live, how they're named, who can see what. Boring; load-bearing.",
    progress: { current: 3, total: 4, pct: 75 },
    phases: ['epic-intro', 'blueprint'],
    outline: [
      { id: 'why',     title: 'Why a folder convention' },
      { id: 'tree',    title: 'The base tree' },
      { id: 'naming',  title: 'Naming convention' },
      { id: 'access',  title: 'Access tiers' }
    ],
    next: { href: 'module.html?id=tech-stack', label: 'Step 1.4 — Tech & software list →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Covers the 80% — Pro Mastery deepens with retention policy + audit logs.</div></div>'
      + '<h2 id="why">Why a folder convention</h2>'
      + '<p>Most businesses fail at file storage the same way: someone uploads a v2-final-final-actual-FINAL.docx and the next person can\'t find it. The cost isn\'t the lost time — it\'s the trust hit when a client asks "did you send me the latest?" and you\'re not sure.</p>'
      + '<h2 id="tree">The base tree</h2>'
      + '<p>Three top-level folders, no exceptions:</p>'
      + '<ul>'
      + '  <li><code>00 Operations</code> — internal SOPs, contracts, finance, legal.</li>'
      + '  <li><code>10 Clients</code> — one folder per client, sub-foldered by year.</li>'
      + '  <li><code>20 Marketing</code> — the public-facing assets, by campaign.</li>'
      + '</ul>'
      + '<p>The numeric prefixes keep them sorted in any drive UI. Add new top-level only in 10s (30 / 40 / 50…), not arbitrary names.</p>'
      + '<h2 id="naming">Naming convention</h2>'
      + '<p>Every file: <code>YYYY-MM-DD · client · doc-type · short-description.ext</code>. Example: <code>2026-05-07 · luv-and-ker · proposal · brand-refresh.pdf</code>.</p>'
      + '<div class="bos-callout bos-callout-warn"><span>⚠️</span><div>No "v2" / "final" / "FINAL" in filenames. The date is the version. Period.</div></div>'
      + '<h2 id="access">Access tiers</h2>'
      + '<p>Three tiers: <strong>owner-only</strong> (finance, legal, employee details) · <strong>team</strong> (everything operational) · <strong>client-shared</strong> (their docs, their drafts, their finals).</p>'
      + '<p><strong>Practical prompt:</strong> spend 30 minutes today on the <em>Operations</em> folder only. Get one folder right. The rest will follow the convention naturally.</p>'
  },

  /* ─── 1.4 — Tech & software list (R015) ─────────── */
  'tech-stack': {
    id: 'tech-stack', track: 'Foundations', step: '1.4', icon: '🧪',
    title: 'Tech & software list.',
    lead: "The tools we strongly recommend. Pick what you need to start; resist the rest until you've earned the right to add complexity.",
    progress: { current: 4, total: 4, pct: 100 },
    phases: ['blueprint'],
    outline: [
      { id: 'rule',     title: 'The fewer-tools rule' },
      { id: 'core',     title: 'Core stack — non-negotiable' },
      { id: 'add',      title: 'Add-ons by stage' },
      { id: 'avoid',    title: 'What to avoid' }
    ],
    next: { href: 'module.html?id=core-principles', label: 'Step 1.5 — Core principles →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Stack picks reflect 2026 best-of; revisited each cohort.</div></div>'
      + '<h2 id="rule">The fewer-tools rule</h2>'
      + '<p>Every new tool adds a login, an integration risk, a monthly bill, a SaaS update to ignore. The right answer is almost always "later". Add a tool only when the problem is real and the workaround is worse than the bill.</p>'
      + '<h2 id="core">Core stack — non-negotiable</h2>'
      + '<ul>'
      + '  <li><strong>Aqua portal</strong> — your operating layer.</li>'
      + '  <li><strong>Email + calendar</strong> — Google Workspace or M365. Pick one.</li>'
      + '  <li><strong>Storage drive</strong> — Google Drive or OneDrive. Match your email choice.</li>'
      + '  <li><strong>Password manager</strong> — 1Password or Bitwarden. Personal-paid, not free.</li>'
      + '  <li><strong>Comms</strong> — WhatsApp Business for clients; one channel. Slack only when you have a team.</li>'
      + '</ul>'
      + '<h2 id="add">Add-ons by stage</h2>'
      + '<p><strong>Solo &lt; £5k MRR:</strong> nothing extra. Aqua + email + storage is the whole stack.</p>'
      + '<p><strong>Solo £5-15k MRR:</strong> add an inbox plugin (Aqua marketplace), a CRM if leads exceed memory.</p>'
      + '<p><strong>£15k+ MRR or first hire:</strong> add Loom for async, a real bookkeeper (not software), an SOP shelf you actually maintain.</p>'
      + '<h2 id="avoid">What to avoid</h2>'
      + '<ul>'
      + '  <li>Anything pitched as "the only tool you\'ll ever need" — they all become tools you eventually leave.</li>'
      + '  <li>Per-seat tools you can\'t afford at 5 seats.</li>'
      + '  <li>Free-tier-only tools that lock data export. Pay or stay out.</li>'
      + '</ul>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> list every paid tool you currently use. Cancel two this month. Most teams find £80-£300/mo of slack within 20 minutes.</div></div>'
  },

  /* ─── 2.1 — Domain & email (R015) ─────────── */
  'domain-email': {
    id: 'domain-email', track: 'Brand & presence', step: '2.1', icon: '📧',
    title: 'Domain & email.',
    lead: "A real address. A clean inbox. The basics done right — surprisingly fixable, surprisingly often broken.",
    progress: { current: 1, total: 5, pct: 20 },
    phases: ['blueprint', 'diagnostics'],
    outline: [
      { id: 'pick',    title: 'Picking the domain' },
      { id: 'mail',    title: 'Setting up email' },
      { id: 'spf',     title: 'SPF / DKIM / DMARC — non-negotiable' },
      { id: 'inbox',   title: 'Inbox-zero rituals' }
    ],
    next: { href: 'module.html?id=gbp', label: 'Step 2.2 — Google Business Profile →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Auth records covered at the recipe level; deeper deliverability lives in retainer.</div></div>'
      + '<h2 id="pick">Picking the domain</h2>'
      + '<p>Three rules. Short (≤16 chars). Pronounceable on the phone. Owned by you (not your designer, not your hosting account).</p>'
      + '<p>If your obvious .com is gone: take the .co or the brand+location.com. Don\'t take a hyphenated workaround — they spell badly and forward poorly.</p>'
      + '<h2 id="mail">Setting up email</h2>'
      + '<p>Two addresses minimum: <code>you@yours</code> and <code>hello@yours</code>. The first is for humans; the second is for forms / bookings / receipts. Never give clients the form-side address.</p>'
      + '<h2 id="spf">SPF / DKIM / DMARC — non-negotiable</h2>'
      + '<p>If your domain doesn\'t have these three DNS records, your invoices land in spam. Period. Aqua\'s onboarding pack ships a 10-minute walk-through; do it on day one.</p>'
      + '<div class="bos-callout bos-callout-warn"><span>⚠️</span><div>Test with mail-tester.com after setup. Anything below 9/10 means a config gap.</div></div>'
      + '<h2 id="inbox">Inbox-zero rituals</h2>'
      + '<p>Three folders: <code>Action</code> · <code>Waiting</code> · <code>Reference</code>. Everything else gets archived (one shortcut). Inbox is the conveyor belt; it doesn\'t store.</p>'
      + '<p><strong>Practical prompt:</strong> archive everything older than 30 days right now. The world won\'t end.</p>'
  },

  /* ─── 2.2 — Google Business Profile (R015) ─────────── */
  'gbp': {
    id: 'gbp', track: 'Brand & presence', step: '2.2', icon: '📍',
    title: 'Google Business Profile.',
    lead: "Claim it, optimise it, post weekly. The free local-search lever almost no one fully pulls.",
    progress: { current: 2, total: 5, pct: 40 },
    phases: ['diagnostics'],
    outline: [
      { id: 'claim',     title: 'Claim or transfer' },
      { id: 'optim',     title: 'Optimise the profile' },
      { id: 'photos',    title: 'Photos that earn the click' },
      { id: 'posts',     title: 'Weekly posts (the lever)' },
      { id: 'reviews',   title: 'Review system' }
    ],
    next: { href: 'module.html?id=core-principles', label: 'Continue → Core principles' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Google updates this surface ~quarterly; check the Aqua weekly bulletin for changes.</div></div>'
      + '<h2 id="claim">Claim or transfer</h2>'
      + '<p>Search your business name on Google Maps. If a profile exists you don\'t control: claim it (Google sends a postcard or video verification). If nothing exists: create from scratch via business.google.com.</p>'
      + '<h2 id="optim">Optimise the profile</h2>'
      + '<p>Fields that move the needle: <strong>category</strong> (primary + 1-2 secondary, exact-match), <strong>service area</strong> (postcodes/cities), <strong>hours</strong> (including holiday hours — Google demotes profiles with stale hours), <strong>services</strong> (every distinct service as its own item — drives impression diversity).</p>'
      + '<h2 id="photos">Photos that earn the click</h2>'
      + '<p>20 photos minimum. Mix: 5 exterior, 5 interior, 5 of work-in-progress / product, 5 of team / behind-the-scenes. Replace 5 every quarter — Google rewards profiles that feel alive.</p>'
      + '<h2 id="posts">Weekly posts (the lever)</h2>'
      + '<p>The single biggest under-pulled lever: GBP Posts. Once a week. 100-200 chars + photo + CTA. Keep them in a Notion table so they\'re drafted ahead.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> draft 4 posts now. Schedule one per week for the next month.</div></div>'
      + '<h2 id="reviews">Review system</h2>'
      + '<p>Ask every happy client. Use a short link (<code>g.page/r/yourID</code>). Reply to every review within 48h — both 5-star and the rare 1-star. Replies are a ranking signal.</p>'
  },

  /* ─── 3.1 — Offer architecture (R015) ─────────── */
  'offer-architecture': {
    id: 'offer-architecture', track: 'Sales & marketing', step: '3.1', icon: '🏛',
    title: 'Your offer architecture.',
    lead: "One front-door offer. One flagship. One upsell. Stop trying to sell everything to everyone.",
    progress: { current: 1, total: 8, pct: 13 },
    phases: ['diagnostics', 'brand-builder'],
    outline: [
      { id: 'why',      title: 'Why three offers' },
      { id: 'front',    title: 'Front-door offer' },
      { id: 'flag',     title: 'Flagship' },
      { id: 'upsell',   title: 'Upsell / continuity' },
      { id: 'price',    title: 'Pricing the stack' }
    ],
    next: { href: 'module.html?id=super-sales', label: 'Step 3.5 — Super Sales framework →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Pricing logic kept directional; per-niche modelling lives in Pro Mastery.</div></div>'
      + '<h2 id="why">Why three offers</h2>'
      + '<p>One is too few — no on-ramp for the curious. Five is too many — every choice multiplies the sales conversation. Three sits at the cognitive sweet-spot: a way in, a way home, a way to keep showing up.</p>'
      + '<h2 id="front">Front-door offer</h2>'
      + '<p>Cheap (or free), fast, finite. Designed to make the buyer say "this person actually knows what they\'re doing" inside 24 hours. Examples: a £49 audit · a free 12-min health check · a £10 starter kit.</p>'
      + '<h2 id="flag">Flagship</h2>'
      + '<p>Where 70% of revenue should come from. Big enough to matter; structured enough to deliver consistently. The thing you can describe in one sentence and price without negotiation.</p>'
      + '<h2 id="upsell">Upsell / continuity</h2>'
      + '<p>The "what next" after the flagship lands. Retainer, membership, advanced cohort, supply contract — anything that earns recurring revenue without re-selling.</p>'
      + '<h2 id="price">Pricing the stack</h2>'
      + '<p>Loose ratio: front-door ≤ 5% of flagship · flagship at the price you quote without flinching · upsell at 30-50% of flagship per recurring period.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> write your three offers in one sentence each. If any takes more than one sentence, it\'s not ready.</div></div>'
  },

  /* ─── 3.6 — SOPs for the sales process (R015) ─────────── */
  'sales-sops': {
    id: 'sales-sops', track: 'Sales & marketing', step: '3.6', icon: '📋',
    title: 'SOPs for the sales process.',
    lead: "Documented, repeatable, hand-off-able. The system survives without you.",
    progress: { current: 6, total: 8, pct: 75 },
    phases: ['brand-builder'],
    outline: [
      { id: 'why',     title: 'Why SOP the sales motion' },
      { id: 'core',    title: 'The five SOPs every business needs' },
      { id: 'tmpl',    title: 'SOP template' },
      { id: 'review',  title: 'Quarterly review ritual' }
    ],
    next: { href: 'module.html?id=clarity-page', label: 'Step 3.8 — Clarity, the one-page plan →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Templates included; per-niche variants in Pro Mastery.</div></div>'
      + '<h2 id="why">Why SOP the sales motion</h2>'
      + '<p>The instinct is to SOP delivery first. That\'s the wrong half. If sales is in your head, your business doesn\'t scale; it just stretches. Document sales first; delivery is downstream.</p>'
      + '<h2 id="core">The five SOPs every business needs</h2>'
      + '<ol>'
      + '  <li><strong>Discovery call</strong> — opening, agenda, framework, close.</li>'
      + '  <li><strong>Proposal</strong> — what to send, when, with what attachments.</li>'
      + '  <li><strong>Follow-up</strong> — the 7-touch sequence after a proposal.</li>'
      + '  <li><strong>Onboarding</strong> — what fires automatically once a deal closes.</li>'
      + '  <li><strong>Closed-lost retro</strong> — a 5-min written reflection on every loss.</li>'
      + '</ol>'
      + '<h2 id="tmpl">SOP template</h2>'
      + '<p>Every SOP: <em>Trigger</em> → <em>Owner</em> → <em>Steps</em> → <em>Tools</em> → <em>Definition of done</em>. One page max. If it\'s longer, it\'s a workflow, not an SOP.</p>'
      + '<h2 id="review">Quarterly review ritual</h2>'
      + '<p>Every quarter, walk each SOP. Ask: <em>did anyone not follow it? why?</em> Most edits surface from real friction, not theory. The SOP shelf evolves with your business or it dies.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> write the Discovery Call SOP this week. One page. Use it on the next call. Edit after.</div></div>'
  },

  /* ─── 3.8 — Clarity, the one-page plan (R015) ─────────── */
  'clarity-page': {
    id: 'clarity-page', track: 'Sales & marketing', step: '3.8', icon: '📄',
    title: 'Clarity — the one-page plan.',
    lead: "The quarterly page that keeps you on the right priorities. One page. Re-read every Monday.",
    progress: { current: 8, total: 8, pct: 100 },
    phases: ['brand-builder'],
    outline: [
      { id: 'why',      title: 'Why one page' },
      { id: 'shape',    title: 'The five blocks' },
      { id: 'cadence',  title: 'Cadence of review' },
      { id: 'kill',     title: 'The kill list' }
    ],
    next: { href: 'module.html?id=workflows', label: 'Step 4.1 — Workflows that don\'t break →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Template provided; quarterly facilitator session in Pro Mastery.</div></div>'
      + '<h2 id="why">Why one page</h2>'
      + '<p>Multi-page strategy decks die on shelves. One page survives because you can re-read it on a Monday morning in 90 seconds. Anything you can\'t fit on a page, you don\'t actually believe yet.</p>'
      + '<h2 id="shape">The five blocks</h2>'
      + '<ol>'
      + '  <li><strong>Why</strong> — the one sentence that justifies your business this quarter.</li>'
      + '  <li><strong>Three big bets</strong> — initiatives, not tasks. Each ships or doesn\'t.</li>'
      + '  <li><strong>Three numbers</strong> — leading indicators, not vanity. Same three all quarter.</li>'
      + '  <li><strong>Three risks</strong> — what kills the quarter if it goes wrong. Mitigations next to each.</li>'
      + '  <li><strong>Kill list</strong> — what we deliberately stopped doing.</li>'
      + '</ol>'
      + '<h2 id="cadence">Cadence of review</h2>'
      + '<p>Weekly Monday: re-read; tweak the bets if needed. Monthly: review numbers; honest Δ. Quarterly: rewrite the page.</p>'
      + '<h2 id="kill">The kill list</h2>'
      + '<p>The block most teams skip. What did you say no to this quarter? Naming it makes future no\'s easier; un-named no\'s drift back into the work.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> draft this quarter\'s page in 25 minutes. Don\'t aim for done; aim for "good enough to share with one person".</div></div>'
  },

  /* ─── 4.1 — Workflows that don't break (R015) ─────────── */
  'workflows': {
    id: 'workflows', track: 'Operations', step: '4.1', icon: '⚙️',
    title: 'Workflows that don\'t break.',
    lead: "From request to delivered, every step documented. The work runs itself.",
    progress: { current: 1, total: 5, pct: 20 },
    phases: ['brand-builder'],
    outline: [
      { id: 'shape',    title: 'Workflow vs SOP' },
      { id: 'map',      title: 'Mapping the path' },
      { id: 'auto',     title: 'What to automate first' },
      { id: 'breaks',   title: 'Designing for break-points' }
    ],
    next: { href: 'module.html?id=kpis', label: 'Step 4.2 — KPIs that actually matter →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Patterns covered; tool-specific automation walk-throughs in Pro Mastery.</div></div>'
      + '<h2 id="shape">Workflow vs SOP</h2>'
      + '<p>An SOP is a one-page how-to for a single procedure. A workflow is the chain — multiple SOPs stitched together with triggers, hand-offs, and waiting periods. SOPs document tasks; workflows document journeys.</p>'
      + '<h2 id="map">Mapping the path</h2>'
      + '<p>For each core deliverable, draw the path on paper: trigger → step → step → hand-off → step → done. Don\'t go digital until the paper version is honest.</p>'
      + '<h2 id="auto">What to automate first</h2>'
      + '<p>Three rules: (1) automate the boring, not the human; (2) automate the high-volume, not the high-stakes; (3) automate the well-understood, not the experimental. Aqua\'s automation marketplace is honest about what each plugin actually replaces.</p>'
      + '<h2 id="breaks">Designing for break-points</h2>'
      + '<p>Every workflow has a 2-3 step where it breaks under load. Find yours by asking: <em>where do client emails pile up?</em> Add an explicit "buffer" step there, not more automation.</p>'
      + '<div class="bos-callout bos-callout-warn"><span>⚠️</span><div>Most workflow failures aren\'t automation failures — they\'re hand-off failures. Document who picks up after each step.</div></div>'
      + '<p><strong>Practical prompt:</strong> map your most-frequent client deliverable on a single page this week. Show it to one team member. Ask where it\'s wrong.</p>'
  },

  /* ─── 4.2 — KPIs that actually matter (R015) ─────────── */
  'kpis': {
    id: 'kpis', track: 'Operations', step: '4.2', icon: '📊',
    title: 'KPIs that actually matter.',
    lead: "Five numbers. Reviewed weekly. The signal you steer by.",
    progress: { current: 2, total: 5, pct: 40 },
    phases: ['brand-builder'],
    outline: [
      { id: 'why',     title: 'Why five — and only five' },
      { id: 'pick',    title: 'Picking the five' },
      { id: 'leading', title: 'Leading vs lagging' },
      { id: 'ritual',  title: 'Weekly review ritual' }
    ],
    next: { href: 'module.html?id=ops-sustainability', label: 'Step 4.4 — Operations & Sustainability →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Per-niche KPI sets ship inside the niche packs (R004); Pro Mastery layers benchmarking.</div></div>'
      + '<h2 id="why">Why five — and only five</h2>'
      + '<p>Pick fifteen and you\'ll review none. Pick three and you\'ll miss leading indicators. Five is the cap that survives a busy week — small enough to remember, big enough to triangulate.</p>'
      + '<h2 id="pick">Picking the five</h2>'
      + '<p>Cover four buckets, one tie-breaker:</p>'
      + '<ol>'
      + '  <li><strong>Demand</strong> — leads / week (or impressions / discovery searches).</li>'
      + '  <li><strong>Conversion</strong> — close rate or trial-to-member.</li>'
      + '  <li><strong>Money</strong> — MRR or revenue / week.</li>'
      + '  <li><strong>Retention</strong> — churn / repeat-purchase / NPS.</li>'
      + '  <li><strong>Tie-breaker</strong> — the one number that decides where time goes <em>this</em> quarter.</li>'
      + '</ol>'
      + '<h2 id="leading">Leading vs lagging</h2>'
      + '<p>Revenue is lagging — by the time it moves, the cause is months back. Pair every lagging number with a leading one (revenue ↔ proposals sent; churn ↔ login frequency). The leading numbers tell you what\'s about to happen.</p>'
      + '<h2 id="ritual">Weekly review ritual</h2>'
      + '<p>Same time every week. 25 minutes. For each number: <em>where it is</em> · <em>where it should be</em> · <em>one action this week</em>. Write the action down. Re-read last week\'s action first.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> name your five numbers today. Write them on a post-it. Review them next Monday at the same time.</div></div>'
  },

  /* ─── 3.7 — Tasks & daily rhythm (R025) ─────── */
  'daily-rhythm': {
    id: 'daily-rhythm', track: 'Sales & marketing', step: '3.7', icon: '⏱',
    title: 'Tasks & daily rhythm.',
    lead: "What you do every day, week and month so revenue is never a surprise.",
    progress: { current: 7, total: 8, pct: 88 },
    phases: ['brand-builder'],
    outline: [
      { id: 'why',   title: 'Why rhythm beats intensity' },
      { id: 'daily', title: 'The daily 90' },
      { id: 'week',  title: 'The Monday + Friday rituals' },
      { id: 'month', title: 'Monthly: the leak audit' }
    ],
    next: { href: 'module.html?id=clarity-page', label: 'Step 3.8 — Clarity, the one-page plan →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Cadence patterns; team rituals deepen in Pro Mastery.</div></div>'
      + '<h2 id="why">Why rhythm beats intensity</h2>'
      + '<p>Spike weeks build resentment. Rhythm builds trust — with you, with your team, with your customers. The boring 90 minutes a day beats the heroic 14-hour Friday.</p>'
      + '<h2 id="daily">The daily 90</h2>'
      + '<p>Three blocks of 30: <strong>look</strong> (numbers + inbox), <strong>move</strong> (the one thing that matters today), <strong>close</strong> (loose ends, prep tomorrow). Same time daily. No exceptions.</p>'
      + '<h2 id="week">The Monday + Friday rituals</h2>'
      + '<p>Monday: re-read the one-page plan; pick the week\'s 3 priorities; tell one person what they are. Friday: review the week against those 3; honest grade A-F; one paragraph captured.</p>'
      + '<h2 id="month">Monthly: the leak audit</h2>'
      + '<p>One Sunday afternoon a month: walk every leak from the HC. What moved? What didn\'t? Re-rank. Pick a fresh top-3 for next month.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> tomorrow, do the daily 90 in 3 blocks. Same time. Don\'t skip closing. See how week feels by Friday.</div></div>'
  },

  /* ─── 4.3 — SOPs library (R025) ─────── */
  'sops-library': {
    id: 'sops-library', track: 'Operations', step: '4.3', icon: '📚',
    title: 'SOPs library.',
    lead: "Templates for every recurring process. Your business in writing.",
    progress: { current: 3, total: 5, pct: 60 },
    phases: ['brand-builder'],
    outline: [
      { id: 'why',    title: 'SOPs vs muscle memory' },
      { id: 'shape',  title: 'The 5-line SOP' },
      { id: 'index',  title: 'Indexing: the SOP shelf' },
      { id: 'review', title: 'Quarterly review' }
    ],
    next: { href: 'module.html?id=ops-sustainability', label: 'Step 4.4 — Operations & Sustainability →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> 12 starter SOP templates ship in Pro Mastery.</div></div>'
      + '<h2 id="why">SOPs vs muscle memory</h2>'
      + '<p>Every recurring task lives in one of two places: written down, or in someone\'s head. The first survives staff turnover and your holidays. The second survives until the first crisis.</p>'
      + '<h2 id="shape">The 5-line SOP</h2>'
      + '<p>Most SOPs are too long to read and too short to follow. The right shape: <em>Trigger</em> → <em>Owner</em> → <em>Steps (numbered)</em> → <em>Tools</em> → <em>Definition of done</em>. One page. Every word load-bearing.</p>'
      + '<h2 id="index">Indexing: the SOP shelf</h2>'
      + '<p>Six tags get you 80% of the index: <strong>Sales</strong> · <strong>Delivery</strong> · <strong>Onboarding</strong> · <strong>Finance</strong> · <strong>People</strong> · <strong>Standards</strong>. Anything that doesn\'t fit, you don\'t need a procedure for yet.</p>'
      + '<h2 id="review">Quarterly review</h2>'
      + '<p>Same as sales SOPs (3.6): every quarter, walk each procedure. Did anyone not follow it? Why? Edits surface from real friction.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> write SOP #1 this week — the one process you\'d miss if you got hit by a bus tomorrow. One page. Use it. Edit Friday.</div></div>'
  },

  /* ─── 5.1 — The Business OS tutorial (R025) ─────── */
  'bos-tutorial': {
    id: 'bos-tutorial', track: 'Mastery', step: '5.1', icon: '🧭',
    title: 'The Business OS tutorial.',
    lead: "How to actually use this system so it becomes second nature, not another tab.",
    progress: { current: 1, total: 4, pct: 25 },
    phases: ['blueprint'],
    outline: [
      { id: 'sidebar', title: 'The sidebar' },
      { id: 'hc',      title: 'The Health Check' },
      { id: 'lessons', title: 'Lessons + modules' },
      { id: 'rhythm',  title: 'Daily rhythm — what to open first' }
    ],
    next: { href: 'module.html?id=founders-fortune', label: 'Step 5.3 — The Founder\'s Fortune →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Self-paced walkthrough; live-call walkthrough is the Pro Mastery version.</div></div>'
      + '<h2 id="sidebar">The sidebar</h2>'
      + '<p>Sidebar reflects your tier. Free shows 6 functional links + an alt-axis "Request a feature". Customer adds the unlock shelf. Don\'t install add-ons before you need them.</p>'
      + '<h2 id="hc">The Health Check</h2>'
      + '<p>The whole portal personalises off your HC. Re-take it any time — most owners run it monthly to track movement. Honesty contract: only topics you answer surface; nothing fabricated.</p>'
      + '<h2 id="lessons">Lessons + modules</h2>'
      + '<p>22 lessons across 6 tracks. Pick the one that targets your weakest HC topic. Mark each done — phase-advance reads it.</p>'
      + '<h2 id="rhythm">Daily rhythm — what to open first</h2>'
      + '<p>Day 1: the HC. Week 1: Core Principles + Super Sales. Week 2: pick the lesson tied to your worst leak. Week 4: review HC. The portal works when the rhythm does.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> if you haven\'t run the HC, run it now. If you have, open the lesson tied to your weakest topic. The portal\'s only useful when used.</div></div>'
  },

  /* ─── 5.3 — The Founder's Fortune (R025) ─────── */
  'founders-fortune': {
    id: 'founders-fortune', track: 'Mastery', step: '5.3', icon: '🌊',
    title: "The Founder's Fortune.",
    lead: "Where time is no longer tied to income. The leverage layer.",
    progress: { current: 3, total: 4, pct: 75 },
    phases: ['brand-builder'],
    outline: [
      { id: 'trade',   title: 'Trading time vs trading systems' },
      { id: 'three',   title: 'Three forms of leverage' },
      { id: 'sequence',title: 'The leverage sequence' },
      { id: 'risk',    title: 'When leverage breaks' }
    ],
    next: { href: 'module.html?id=referral-alchemy', label: 'Step 5.2 — Referral Alchemy →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> The mythos register — for the operator who wants to outgrow time-for-money. Pro Mastery deepens with case studies.</div></div>'
      + '<h2 id="trade">Trading time vs trading systems</h2>'
      + '<p>Most businesses sell hours. The hours scale linearly — and they cap at 24 a day per person. The fortune is in trading systems, not time. Code, content, customers, capital. Each compounds.</p>'
      + '<h2 id="three">Three forms of leverage</h2>'
      + '<ul>'
      + '  <li><strong>People</strong> — the oldest leverage. Hire, delegate, lead. Caps at the team you can manage.</li>'
      + '  <li><strong>Capital</strong> — debt, equity, advance. Caps at risk tolerance.</li>'
      + '  <li><strong>Code + content</strong> — the new permissionless leverage. Build once, distribute forever. The cap is your imagination.</li>'
      + '</ul>'
      + '<h2 id="sequence">The leverage sequence</h2>'
      + '<p>Most operators get this backwards: hire too early, raise too early, build too late. Right order: <em>content</em> (audience) → <em>code</em> (systems) → <em>people</em> (team) → <em>capital</em> (acceleration). Each layer compounds the next.</p>'
      + '<h2 id="risk">When leverage breaks</h2>'
      + '<p>Leverage amplifies decisions — including bad ones. Every form fails the same way: the operator stops doing the work. The system runs without judgement; judgement was the value.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> for each of your offers, ask: "what would 10× this look like — without me being there 10× more?" The answer is your leverage roadmap.</div></div>'
  },

  /* ─── L.1 — Founder psychology (R025) ─────── */
  'founder-psychology': {
    id: 'founder-psychology', track: 'Leadership', step: 'L.1', icon: '🧠',
    title: 'Founder psychology.',
    lead: "The mental work nobody talks about. Standards, mood, attention.",
    progress: { current: 1, total: 4, pct: 25 },
    phases: ['brand-builder'],
    outline: [
      { id: 'standards', title: 'Standards = ceiling' },
      { id: 'mood',      title: 'Mood is contagious' },
      { id: 'attention', title: 'Attention is the asset' },
      { id: 'doubt',     title: 'Doubt is information' }
    ],
    next: { href: 'module.html?id=leadership-scale', label: 'Step L.2 — Leadership at small-team scale →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> Mental hygiene basics; quarterly facilitator sessions in Pro Mastery.</div></div>'
      + '<h2 id="standards">Standards = ceiling</h2>'
      + '<p>What you tolerate becomes the team\'s ceiling. The day you let a sloppy ship out the door, the next ship is sloppier. Standards aren\'t pep talks — they\'re what you actually accept.</p>'
      + '<h2 id="mood">Mood is contagious</h2>'
      + '<p>Your team mirrors your mood within 48 hours. If you arrive anxious every Monday, the standup will too. The fix isn\'t fake cheer — it\'s actually managing your inputs (sleep, exercise, friction).</p>'
      + '<h2 id="attention">Attention is the asset</h2>'
      + '<p>Money compounds. Time compounds. Attention compounds harder than both — and it\'s the one resource you can\'t buy back. Protect it like the asset it is. No notifications. No "quick checks". One thing at a time.</p>'
      + '<h2 id="doubt">Doubt is information</h2>'
      + '<p>Doubt isn\'t weakness — it\'s data. The thing you keep avoiding is usually the thing that needs facing. Run toward the thing.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> name the one thing you\'ve been quietly avoiding. Schedule 30 minutes this week to face it.</div></div>'
  },

  /* ─── L.2 — Leadership at small-team scale (R025) ─────── */
  'leadership-scale': {
    id: 'leadership-scale', track: 'Leadership', step: 'L.2', icon: '👥',
    title: 'Leadership at small-team scale.',
    lead: "How to lead 1–10 people without becoming a bottleneck.",
    progress: { current: 2, total: 4, pct: 50 },
    phases: ['brand-builder'],
    outline: [
      { id: 'why',     title: 'Why small teams fail' },
      { id: 'context', title: 'Context, not control' },
      { id: 'cadence', title: 'Three meetings, no more' },
      { id: 'feedback',title: 'Feedback that holds' }
    ],
    next: { href: 'module.html?id=building-team', label: 'Step L.3 — Building your team →' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> 1–10-person playbook; bigger-team patterns deferred to a future bonus track.</div></div>'
      + '<h2 id="why">Why small teams fail</h2>'
      + '<p>The first 10 hires are the highest-leverage decision a founder makes. The most common failure mode is a founder who keeps doing the work they hired someone to do — out of perfectionism or distrust. Both bottlenecks; both fixable.</p>'
      + '<h2 id="context">Context, not control</h2>'
      + '<p>Send the team into every meeting with the same context you have. The 1-page plan, the HC, the 3 priorities. Don\'t direct the work; surface the constraints. Good people figure it out faster than you can micromanage.</p>'
      + '<h2 id="cadence">Three meetings, no more</h2>'
      + '<ol>'
      + '  <li><strong>Monday standup</strong> — 15 min, last week / this week / blockers.</li>'
      + '  <li><strong>Friday retro</strong> — 30 min, one thing that worked, one that didn\'t, one to try.</li>'
      + '  <li><strong>Monthly 1:1</strong> — 45 min per person, no agenda from you, every agenda from them.</li>'
      + '</ol>'
      + '<h2 id="feedback">Feedback that holds</h2>'
      + '<p>Specific. Soon. Solo. Most "feedback" is a vague drive-by; useful feedback is on the work, within the week, in private. Praise in public, correct in private — universal because it actually works.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> if you haven\'t run a Friday retro this week, run one tomorrow. 30 min. Write it down. The team feels it within two cycles.</div></div>'
  },

  /* ─── L.3 — Building your team (R025) ─────── */
  'building-team': {
    id: 'building-team', track: 'Leadership', step: 'L.3', icon: '🤝',
    title: 'Building your team.',
    lead: "When to hire, who, what to pay, how to brief them.",
    progress: { current: 3, total: 4, pct: 75 },
    phases: ['brand-builder'],
    outline: [
      { id: 'when',  title: 'When to hire (not yet)' },
      { id: 'who',   title: 'Who to hire (not who you think)' },
      { id: 'pay',   title: 'What to pay' },
      { id: 'brief', title: 'The 30-day brief' }
    ],
    next: { href: 'database.html', label: '← Back to the library' },
    body: ''
      + '<div class="bos-callout"><span>📝</span><div><strong>v1 draft.</strong> First-3-hires playbook; UK-leaning specifics. Pro Mastery deepens w/ recruiter scripts + comp benchmarks per niche.</div></div>'
      + '<h2 id="when">When to hire (not yet)</h2>'
      + '<p>Most founders hire too early — to escape work they should systemise instead. The right trigger: you\'ve had the same task on your list for 4 weeks running and it\'s clearly not strategic. Document it. Hire to execute the SOP, not to invent it.</p>'
      + '<h2 id="who">Who to hire (not who you think)</h2>'
      + '<p>The first hire isn\'t a junior version of you — it\'s someone who covers your weakest function. If you\'re a salesperson founder, your first hire is operations. If you\'re a builder founder, it\'s sales. Hiring strengths feels safer; it doesn\'t actually help.</p>'
      + '<h2 id="pay">What to pay</h2>'
      + '<p>Top quartile of role-equivalent in your city, not bottom of "founder pay". Cheap hires are expensive — they cost you twice (low output + high churn). Top hires pay for themselves in 90 days.</p>'
      + '<h2 id="brief">The 30-day brief</h2>'
      + '<p>One page. Three sections: <em>What you\'ll own</em> · <em>What good looks like at day 30</em> · <em>Who you\'ll work with</em>. Send before day one. Re-read together at day 30. Adjust.</p>'
      + '<div class="bos-callout bos-callout-good"><span>✓</span><div><strong>Practical prompt:</strong> draft your next-hire 30-day brief now, even if you\'re 6 months from hiring. The act of writing it surfaces what you\'re actually solving for.</div></div>'
  }

};
