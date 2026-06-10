# 04 · T4 copy & content reference

Author: T4
Status: living. Update when copy changes.

The exhaustive list of every piece of copy / content / data that ships in T4's apps. If you need to know "what does the X say" or "what's in the Y array" — this is the page.

---

## Niches (`bos.js NICHES`)

The 8 picker tiles on signup. Each: slug · label · icon · tagline.

| slug | label | icon | tagline |
|---|---|---|---|
| therapist  | Therapist OS    | 🌿 | Built for private-practice therapists. |
| roofer     | Roofer OS       | 🏠 | Built for roofers and trades. |
| salon      | Salon OS        | 💇 | Built for salons, barbers and stylists. |
| coach      | Coach OS        | 🎯 | Built for coaches and consultants. |
| restaurant | Restaurant OS   | 🍽 | Built for restaurants and cafés. |
| retailer   | Retailer OS     | 🛍 | Built for product brands. |
| agency     | Agency OS       | 💼 | Built for agencies and studios. |
| generic    | Business OS     | ◆  | A solid generic operating system. |

Today these only set a label — Aqua AI uses the niche label in replies, the sidebar brand renames per niche, dashboard tagline shows the niche tagline. When the BOS extracts to a portal plugin, niche packs ship per-niche module sets / HC question swaps / KPI defs / SOP packs.

---

## Levels (`bos.js LEVELS`)

| n | name | from XP |
|---|---|---|
| 1 | Apprentice | 0 |
| 2 | Owner      | 250 |
| 3 | Operator   | 700 |
| 4 | Captain    | 1500 |
| 5 | Founder    | 3000 |
| 6 | Legend     | 6000 |

Level-up toast fires when threshold is crossed inside `gainXP()`.

---

## Achievements (`bos.js ACHIEVEMENTS`)

| id | icon | label | desc |
|---|---|---|---|
| first-step    | 🌟 | First step       | You created your Business OS. |
| self-aware    | 🪞 | Self-aware       | Completed your first Health Check. |
| student       | 📚 | Student          | Opened your first module. |
| builder       | 🔧 | Builder          | Installed your first add-on. |
| on-fire-3     | 🔥 | 3-day streak     | Three days in a row. Keep it up. |
| on-fire-7     | 🔥 | 7-day streak     | A whole week. Habit-forming. |
| first-call    | 📞 | Bridge built     | You booked your first strategy call. |
| niche-locked  | 🎯 | Niche-locked     | Picked a niche-specific OS. |

Locked cards: greyed + filtered to 0.45 opacity + grayscale. Unlocked: gold-tinted with full description.

How they unlock today:
- `first-step` — granted on signup.
- `niche-locked` — granted on signup if niche !== 'generic'.
- `self-aware` — granted on first HC completion (set by lead-magnet's `persistToBOS`).
- `on-fire-3` / `on-fire-7` — granted by `tickStreak()` when streak hits 3 or 7.
- `student` / `builder` / `first-call` — defined but **not yet wired** to triggers. Open follow-up.

---

## Marketplace add-ons (`bos.js ADDONS`)

The 9 plug-in tiles. Same set is rendered in marketplace.html (filter chips: All / Comms / Site / Sell / Grow / Retain / Ops) and as installed sidebar items in customer mode.

| id | name | category | £/mo | blurb |
|---|---|---|---|---|
| inbox     | All-in-One Inbox     | comms  | 49 | Email, SMS, WhatsApp, Instagram DMs — one queue, one team. |
| website   | Website Editor       | site   | 79 | Drag-and-drop pages with the conversion blocks already built. |
| ecom      | Ecommerce            | sell   | 89 | Storefront, cart, checkout, subscriptions. Stripe-ready. |
| fulfil    | Fulfilment           | sell   | 39 | Pick, pack, ship and track from the same place you sell. |
| members   | Memberships          | retain | 39 | Tiers, drip content, gated areas. No second login for customers. |
| affil     | Affiliates           | grow   | 29 | Referral links, payouts, fraud checks — turn fans into a salesforce. |
| crm       | Client CRM           | comms  | 49 | Pipelines, notes, tasks, automated follow-ups. |
| marketing | Marketing Suite      | grow   | 59 | Email, SMS, broadcast, segmentation, automation flows. |
| finance   | Finance              | ops    | 39 | Invoicing, reconciliation, tax-ready reports for your accountant. |

Each card icon (in `addon-icon` rendered with violet background): 📥 🪄 🛒 📦 🎟 🤝 🗂 📣 💷.

All "Add to my OS →" buttons today are mailto stubs. Customer mode flips to "Installed" pill + Open button (links currently `#`).

The category labels are friendlier in UI: comms → "Communications", site → "Website", sell → "Sell", retain → "Retain", grow → "Grow", ops → "Operations".

---

## Lessons (`lessons.js BOS_LESSONS`)

5 fully-written lessons keyed by id. Each: track · step · icon · title · lead · outline · body · next.

### `chrome-profile` — 1.1 · Foundations · 🧰

**Title**: Set up your Chrome profile.
**Lead**: The plumbing of a serious business. A dedicated Chrome profile keeps your work tools, bookmarks and logins separate from your personal browsing — and we ship a preloaded profile that does the boring setup for you.
**Outline**: Why a separate profile · Installing the profile · What's preloaded · Your first customisation.

**Sections**:
- *Why a separate profile* — the "personal Chrome leaks into work" pitfalls (shopping vs CRM, autofills wrong card, contractor hand-off). Plus callout: when you eventually hire someone, you hand them a profile not your laptop.
- *Installing the profile* — 3 steps, 5 minutes (open Chrome → Add → Sign in with business email → import the Milesy pack via Settings → Sync).
- *What's preloaded* — bookmarks bar, extensions (password manager, screen recorder, writing assistant, meeting transcriber), search shortcuts (`gbp`, `os`), default homepage. Warn callout: don't install everything at once.
- *Your first customisation* — 3 small rituals (pin portal tab, biometric lock on password manager, set Downloads folder to `~/Downloads/Business/`).

**Next**: 1.2 — Duplicate your private hub.

### `core-principles` — 1.5 · Psychology · 🧠

**Title**: Core Principles.
**Lead**: The non-negotiables. Read this before you build anything else. These ideas aren't a pep talk — they're the philosophical bedrock the rest of the OS sits on. If you don't have these, every system you build will eventually leak.
**Outline**: Why this exists · Subtraction beats addition · Survive then win · Behaviour, not goals · Crafting your MVB.

**Sections**:
- *Why this exists* — "build on sand" frame. Trust the structure. Good callout: "if you take these five principles seriously, every later module compounds."
- *Subtraction beats addition* — the shiny-object founder vs the remove-stupidity founder. Buffett's "I want to know where I'm going to die so I don't go there" warn callout.
- *Survive, then win* — fat-person-with-£400-running-shoes principle. Priority order each quarter: Survive → Stabilise → Win.
- *Behaviour, not goals* — goals downstream of habits. Action × Intention multiplier good callout.
- *Crafting your MVB* — Minimum Viable Business: pays you / serves customer well / repeats without you. The trap of dressing up the MVB before it works (logo before customer, website before sale, etc).

**Next**: 2.1 — Domain & email.

### `super-sales` — 3.5 · Sales · 💰

**Title**: The Super Sales framework.
**Lead**: How to take a stranger from "never heard of you" to "send invoice" in seven touches. Not a manipulative funnel — a respectful, repeatable rhythm that earns the sale by the time you ask for it.
**Outline**: The frame: earned vs extracted · The seven touches · Sequencing the touches · Templates you can steal · Tracking what works · Why most sales fail (and the fix).

**Sections**:
- *The frame: earned vs extracted* — earned sales repeat/refer/forgive; extracted sales churn/refund/1-star. Mantra callout: "Be useful before you're paid. The sale becomes a formality."
- *The seven touches* — Discovery / First impression / Useful taste / Permission / Specific value / The frame / The ask. B2C: 2-5 touches; B2B: 7-12.
- *Sequencing* — no skipping (touch 1→7 collapses close-rate); no back-tracking (don't pretend they haven't seen the price).
- *Templates you can steal* — three scripted messages: "saw this", "honest take", "stage check" (each formatted as a callout).
- *Tracking what works* — touch advancement rate (60%+ goal) + quality of "no" (good = fast specific; bad = silence).
- *Why most sales fail (and the fix)* — three failure patterns by touch number ("they went silent" = touch 2; "wanted to think about it" = touch 6; "ghosted after the call" = touch 5). Diagnose by touch, not result.

**Next**: 3.6 — Sales SOPs.

### `ops-sustainability` — 4.4 · Operations · ⚙

**Title**: Operations & Sustainability.
**Lead**: Build the engine that lets you take a holiday without revenue dropping. This module makes the difference between owning a business and owning a job.
**Outline**: The engine principle · Workflows that survive Mondays · KPIs that actually steer · SOPs nobody resents writing · The 48-hour sustainability test.

**Sections**:
- *The engine principle* — engine vs craftsperson. The test (good callout): "competent stranger could pick up the docs and run it without calling you".
- *Workflows that survive Mondays* — three workflows every service business depends on: Lead → first call · First call → signed customer · Signed customer → delivered + paid. Each step needs: who owns / what triggers / what proves.
- *KPIs that actually steer* — 5 numbers: New leads / Conversion rate / Avg revenue per customer / On-time delivery / Free-cash-flow runway months. Reviewed Monday in 15 min. 20%+ move = the meeting. Warn callout: "Don't add a sixth until you've looked at these for 8 weeks."
- *SOPs nobody resents writing* — make them recipes not legal docs. 6 fields per SOP: Title / When to use / Who owns / Steps / Done looks like / Common gotchas. One a week → 12 in a quarter.
- *The 48-hour sustainability test* — quarterly: don't respond for 48 hours. Audit what broke. Whatever broke is the next SOP / workflow / hire. First time: long list. Eighth time: 3 items. That's the engine.

**Next**: 5.2 — Referral Alchemy.

### `referral-alchemy` — 5.2 · Growth · 🤝

**Title**: Client longevity & referral alchemy.
**Lead**: A referred customer is 4× more likely to buy and stay. They cost nothing to acquire, trust you faster, complain less. Yet most businesses leave referrals to chance. This module turns hope into a system.
**Outline**: Why referrals are unfairly good · The ask script · The trigger moments · The reward system.

**Sections**:
- *Why referrals are unfairly good* — three numbers (4× more likely [Wharton], +16-25% LTV [Goethe University], £0 CAC). Why they don't have a system: asking feels awkward + "let me know" isn't a system. Principle callout: "Make it easier to refer you than to not."
- *The ask script* — 3 parts: Acknowledge (recent milestone), Ask narrowly ("who in your world is dealing with [specific problem]?"), Make it copy-pasteable (attach a one-liner). The narrow ask is the alchemy.
- *The trigger moments* — 4 best moments to ask: The breakthrough · Unprompted compliment · The renewal · The off-boarding. Calendar them; system fires the message.
- *The reward system* — two-sided > one-sided (~2× rate). Patterns: service businesses (£100-£250 invoice credit), product (% off + free shipping for both), premium/B2B (charity donation). Warn callout: track in writing — verbal "I'll sort you out" promises die.

**Next**: Bonus — The Founder's Fortune (locked).

---

## Module library — full row list (database.html)

**Foundations · Step 1**:
- 1.1 Set up your Chrome profile *(written — chrome-profile)*
- 1.2 Duplicate your private hub *(locked Pro)*
- 1.3 Storage drives setup *(locked Pro)*
- 1.4 Tech & software list *(locked Pro)*
- 1.5 Core principles *(written — core-principles)*

**Online Setup · Step 2**:
- 2.1 Domain & email *(locked)*
- 2.2 Google Business Profile *(locked)*

**Super Sales · Step 3**:
- 3.1 Your offer architecture *(locked)*
- 3.5 The Super Sales framework *(written — super-sales)*
- 3.6 SOPs for the sales process *(locked)*
- 3.7 Tasks & daily rhythm *(locked)*
- 3.8 Clarity — the one-page plan *(locked)*

**Operations & Sustainability · Step 4**:
- 4.1 Workflows that don't break *(locked)*
- 4.2 KPIs that actually matter *(locked)*
- 4.3 SOPs library *(locked)*
- 4.4 Operations & sustainability *(written — ops-sustainability)*

**Acquisition & Longevity · Step 5**:
- 5.1 The Business OS tutorial *(locked)*
- 5.2 Client longevity & referral alchemy *(written — referral-alchemy)*
- 5.3 The Founder's Fortune *(locked Mastery)*

**Leadership · Bonus**:
- L.1 Founder psychology *(locked)*
- L.2 Leadership at small-team scale *(locked)*
- L.3 Building your team *(locked)*

22 rows total. 5 written, 17 locked.

---

## Health Check — full topic + tier reference

**5 areas × 3 tiers × 4-6 steps each.**

### 1. Visibility & Search (`seo`, ⌕)

**Beginner — "Just show me" · ~3 min** (the Pub Test track):
- Step 1 (task): "Mini-experiment #1 — the pub test". Open Google. Type *"pub near me"*. Look for a few seconds.
- Step 2 (choice, scoring=false): Where did your eyes go first? — top result / map-places / 2nd-3rd / scrolled past page 1.
- Step 3 (reveal): "Now imagine your customer doing exactly that." 75% of clicks → top 3.
- Step 4 (task): "Now do the same — Google [what you sell + your town]."
- Step 5 (choice): Where did YOU appear? — Top (90) / On page (60) / Page 2+ (30) / Couldn't see (10).
- Step 6 (choice): Honest gut check — would you scroll past page 1? — Yes (80) / Probably not (35) / No way (15).
- Step 7 (choice w/ tags): Do you have a Google Business Profile? — Yes updated (90, gmb-good) / Yes neglected (50, gmb-stale) / No / not sure (15, gmb-missing).

**Intermediate — "I dabble" · ~4 min**:
- How many search terms do you actively want to rank for? · Last time you checked your Google ranking? · GBP claimed and active? · Done in last 90 days? (multi).

**Professional — "Run the audit" · ~5 min**:
- Your website URL · Sample scan output (mocked) · How many indexed pages target a specific search intent? · Search Console review cadence?

**`quickwins(slot)`**: GBP-missing → "Claim your GBP" (3 actions); GBP-stale → "Optimise your GBP" (3 actions); always → "Get found for the searches your customers actually type" (3 actions).

### 2. Your Website (`site`, ◎)

**Beginner — "Just show me" · ~3 min** (the 5-second test):
- Open your website. Look for 5 seconds. Then come back.
- Could a stranger tell what you sell?
- Was the next thing to do (call / book / buy) obvious? (cta-clear / cta-weak / cta-missing tags)
- Did the site feel trustworthy? (site-dated tag for stale)

**Intermediate — "I dabble" · ~3 min**:
- When did you last test something on your site?
- Hero benefit-led or feature-led? (hero-weak tag for features-led)
- Mobile experience rating slider (0-100).

**Professional — "Run the audit" · ~5 min**:
- Your URL · Sample Lighthouse-style read (mocked: Performance 62, Accessibility 78, SEO 71, Best practices 83, LCP 3.4s, CLS 0.18) · Conversion events instrumented?

**`quickwins(slot)`**: cta-missing/weak → "Make the next action obvious" + "5-second test guide" + "Run one for me".

### 3. Where Customers Come From (`flow`, ↗)

**Beginner — "Just show me" · ~2 min**:
- Slider: % of last month's customers who were word-of-mouth or repeat?
- Slider: % from one specific channel?
- If that biggest source stopped tomorrow, how long until it hurts? (channel-fragile tag for short answers)
- Last new enquiry that wasn't referral or repeat? (cold-pipe-empty tag)

**Intermediate — "I dabble" · ~3 min**:
- Multi: which channels currently bring customers? (Search / WoM / Paid / Social / Email / Partnerships)
- Do you know your cost per new customer?

**Professional — "Run the audit" · ~5 min**:
- Top channel concentration slider · Payback period documented? · Multi-touch or last-click attribution?

**`quickwins(slot)`**: always → "Open a second viable channel" with 3 actions.

### 4. My Business (`business`, ✪)

**Beginner — "Just show me" · ~3 min**:
- Do you have a clear best-seller or flagship offer? (hero-product-hidden / no-hero-product tags)
- URL of highest-value offer (optional)
- Do you actively encourage referrals? (referrals-passive / referrals-blind tags)
- Do you go an extraordinary mile for customers? (extra-mile-strong tag for top)
- Free-text: in one sentence, why customers pick you over a competitor?

**Intermediate — "I dabble" · ~3 min**:
- Highest-margin offer also most marketed? (wrong-front-door tag)
- Testimonials/case studies on highest-value offer? (no-social-proof tag)

**Professional — "Run the audit" · ~4 min**:
- Documented referral mechanism? (incentive / ask / tracking) — referrals-blind tag for "none"
- Do you tier customers (best vs everyone)?

**`quickwins(slot)`**: referrals-blind/passive → "Turn referrals from a hope into a system" + 3 actions; hero-product-hidden/no → "Pick one flagship offer" + 2 actions.

### 5. Keeping Them (`retain`, ✉)

**Beginner — "Just show me" · ~2 min**:
- After someone buys, what do you send them? (no-followup tag for "nothing")
- How often does a past customer hear from you? (no-lifecycle tag)

**Intermediate — "I dabble" · ~3 min**:
- Active mailing list? (no-list tag)
- Welcome flow? (no-welcome tag)

**Professional — "Run the audit" · ~4 min**:
- % revenue from email/SMS slider (0-60).
- Multi: which flows are live? (Welcome / Browse abandon / Cart abandon / Post-purchase / Win-back).

**`quickwins(slot)`**: no-followup/no-welcome → "Ship a 3-step post-purchase flow" + 3 actions.

---

## Sidebar labels (mode-aware)

### Free
```
My business
  🏠 Home
  👤 About my business
Learn
  📚 Lessons
  🔍 Health check
Get help
  👋 Need help?
  🤖 Ask Aqua AI
  📞 Book a free call
  ✨ Request a feature
More (tiny footer)
  🗺 Custom roadmap [Pro]
  🔒 Aqua agency portal
```

### Customer
```
My business
  🏠 Home
  👤 About my business
  👥 My customers
  📈 My numbers
  ✓ My to-dos
  📁 Documents & SOPs
Learn
  📚 Lessons
  🔍 Health check
Your tools
  📥 All-in-One Inbox [Installed]
  🪄 Website Editor [Installed]
  🛒 Ecommerce [Installed]
  📦 Fulfilment [Installed]
  🎟 Memberships [Installed]
  🤝 Affiliates [Installed]
  🗂 Client CRM [Installed]
  📣 Marketing Suite [Installed]
  💷 Finance [Installed]
Get help
  👋 Need help?
  🤖 Ask Aqua AI
  📞 Book a free call
  ✨ Request a feature
More (tiny footer)
  🗺 Custom roadmap [active]
  ▣ Aqua agency portal [active]
```

The "Workspace" → "Resources" group label rename also fires on customer mode (currently the label hook is `data-bos-os-label` but the new sidebar render uses literal "My business" — open follow-up: rename `data-bos-os-label` semantics or drop the rename since the new label structure is friendlier already).

---

## Marketing site copy (`milesymedia website/index.html`)

### Hero
- **Eyebrow**: Performance · Brand · Growth
- **H1**: Marketing that **actually moves** the needle.
- **Lead**: We're a tight, senior team that builds full-funnel marketing engines for ambitious brands. Strategy, creative, and paid — under one roof, accountable to one number: revenue.
- **CTAs**: Take the free health check → / Try the live demo →
- **Hero stats**: +312% Avg. ROAS lift / $48M Tracked revenue.

### Process (How we work)
- **Eyebrow**: How we work
- **H2**: Quick wins first. Trust earned. Then we scale.
- **Lead**: Most agencies want a 12-month contract on day one. We don't. We give you wins inside the first week so you know we can deliver — then we build from there.
- **5 cards**: 01 Free Health Check · 02 Free Business OS · 03 Quick wins this week · 04 Custom roadmap · 05 Full agency partnership.

### VSL
- **Eyebrow**: Founder's intro
- **H2**: Why we built Milesy.
- **Lead**: 3 minutes. The story, the way we work, and the promise: every business we touch leaves with at least one quick win — even if you never hire us.
- **Frame meta**: 3:14 · Founder's intro

### Stats strip
500+ campaigns shipped · 150+ brands served · $48M tracked revenue · 3.4× average ROAS.

### Testimonials
Two quotes from Jordan Lee (Northbeam Apparel) + Sara Reyes (Heliogen Skincare).

### Services
- **Eyebrow**: What we build
- **H2**: Bespoke solutions, big to small.
- **Lead**: Enterprise-grade software for ambitious teams. A polished website for the local trades. A 90-minute photoshoot for your Google Business Profile. We pick the right tool for what your business actually needs.
- **6 tiles** (each: tier badge + h3 + lead + 3 sub-bullets).

### Trust strip
Used by 150+ businesses · Tracked $48M+ revenue · Average 3.4× ROAS · Free tier · no card.

### Final CTA
- **Eyebrow**: Get started
- **H2**: Ready when you are.
- **Lead**: Take our free 2-minute Digital Health Check. We'll score six pillars of your marketing and surface the three highest-leverage moves you could make this quarter — even if you don't hire us.
- **CTA**: Take the free health check →

### Footer
© 2026 Milesy Media · All rights reserved · Last deployed YYYY-MM-DD · Client portal · Demo · hello@milesymedia.co.

---

## BOS home page copy

### Greeting
- **H1** (data-bos-greet): Good morning/afternoon/evening, [FirstName]. (time-of-day aware)
- **Tagline** (data-bos-niche-tagline): per niche.
- **Customise button**: ✎ Customise — make it yours.

### Your next move (adaptive)
The card swaps copy based on user state:
1. **No HC**: "Take the free Health Check." / "It takes 12 minutes and unlocks a personalised picture of your business — what's leaking customers, where the quick wins are, what to do this week." / "Start the Health Check →"
2. **HC done, no company**: "Tell us about your business." / "Two minutes. Just the basics — what you sell, who you serve. We use it to tailor everything else." / "Open my Company Profile →"
3. **HC + company, no lessons**: "Read your first quick-win lesson." / "Five lessons, 10–15 minutes each. Start with Core Principles — it's the one that holds everything else up." / "Open Core Principles →"
4. **All set, no tasks**: "Add your first to-do." / "Pick one thing the lesson made you want to do this week. Write it down. Move it forward." / "Open my To-dos →"
5. **Done**: "You're set. Keep going at your own pace." / "Pick whatever's next — another lesson, your numbers, a call with us. The OS is yours." / "Browse lessons →"

### HC leak strip
- **Eyebrow**: Based on your Health Check
- **H3**: Your biggest leak right now is **[topic]**.
- **Lead**: Your [topic] score was X/100. We'd start with the lesson that fixes it directly.
- **CTA**: Open the lesson →

### Three friendly cards
- 📚 **Read a quick lesson** — Five short lessons. 10–15 minutes each. Pick whichever bit of your business you want to fix first.
- 🤖 **Ask the AI** — It knows what's in your portal. Ask anything — "what's my biggest leak?" or "which lesson should I do first?"
- ✨ **Need something else?** — Tell us what would help. Half the time we already have it and we'll switch it on for you.

### Admin link
- ⚙ Admin (lead-magnet traffic)

### Slim upgrade foot
- You're on the free tier — see what you can add →

---

## HC end-of-flow copy

### Money headlines
- **No data**: "We don't know enough about you yet." / "Skip-to-results without answering anything is honest — but useless. Pick a topic and answer at least one question, even if just the easy one. Your numbers will be your numbers — not made-up averages."
- **With data**: "Likely upside: £X-£Y/month" / "Range based on N/5 topics answered (confidence: ~X%). These are self-reported answers, not pulled from your live data. To make this real, see 'How we got this' below."
- **High score**: "You're ahead of most of the businesses we audit."

### Transparency block — "How we got this number"
> The range above is derived from **your answers**, not from your live business data. Three inputs feed it:
> 1. **Headroom** — how far each topic score sits below 100, averaged across the topics you answered.
> 2. **Confidence** — what fraction of the 5 topics you actually answered. Less coverage → narrower claim.
> 3. **Sector benchmark multiplier** — typical revenue impact a healthy version of each topic produces in your kind of business.
>
> This is a self-report, not a measurement. The range is deliberately wide. A real audit replaces it with measured numbers.

### Transparency block — "What we'd verify against"
6 connector cards:
1. 🔍 Google Search Console — actual impressions, clicks, ranking positions, queries you appear for.
2. 📍 Google Business Profile Insights — direction requests, calls, map vs search appearances.
3. ⚡ Lighthouse / PageSpeed Insights — real performance/SEO/accessibility score, LCP, CLS, INP.
4. 📈 GA4 / server-side events — actual conversion rates, source attribution, drop-off pages.
5. 💷 Stripe / QuickBooks — real revenue, MRR, refunds, customer LTV.
6. 🗺 SERP rank tracker (DataForSEO / Ahrefs) — third-party verification of where you actually rank.

Footer: "Free tier: self-report only. Pro/audit tier: we run these connectors against your real accounts and replace every estimate with a measurement." → marketplace link.

### Gift card
- **Ribbon**: 🎁 Free gift
- **Eyebrow**: Your reward for finishing
- **H2** (default): Claim your free Business OS — on us.
- **H2** (existing user): Welcome back — your Business OS is waiting.
- **Lead**: A complete operating system for growing your business. Manage everything in one place, unlock guides as you go, install only the add-ons you need, and watch your "money leak" shrink each week. Free for life. No card needed.
- **5 bullets**: 📊 Your Health Check results, plugged in and tracked · 🎯 A built-for-you OS — pick your niche on signup · 📚 Quick-win modules & templates · 🤖 Aqua AI — context-aware, with free messages · 📞 Free strategy call any time you're stuck.
- **Primary CTA**: Claim my free Business OS → / **Existing**: ← Back to my Business OS
- **Fineprint**: Already have one? We'll spot it and just send you back in.

### Progress-save modal
- **Icon**: 💾
- **H2**: Quick one — save your progress?
- **Lead**: You're a few minutes in. We're **not trying to sell you** — we just don't want you to lose what you've answered if you close the tab. Drop a name & way to reach you and we'll keep your spot.
- **Buttons**: Skip — I'll keep going / Save my progress →

### Second sign-up grab (results)
- **H3**: One last thing — would you like us to look at your answers?
- **Lead**: If you drop your details, we'll send a few personalised pointers based on what you said. No catch, no auto-pilot drip campaign — a real reply from a real person within a working day.
- **CTA**: Send me my pointers →

### Share row
- 📧 Email me a copy / 🔗 Get a shareable link / 📄 Download as PDF

---

## Roadmap copy (`/business-os app/roadmap.html`)

### Locked (free)
- **Eyebrow**: Premium · 1-off £750 or included with retainer
- **H2**: Unlock your custom roadmap.
- **Lead**: A 90-minute deep-dive call with a senior strategist + a full written audit of your business. You walk out with a costed quarterly plan that maps every move to a number — and the time it'll save you each week.
- **5 deliverables**:
  - 📊 **Full Health Check, by us.** We re-run the assessment for you with real data, not self-report.
  - 🎯 **Niche-specific benchmark.** Compared against your peers in [niche], not "businesses in general".
  - 🛠 **3-month action plan.** Every move costed, ordered, with the time it saves you each week.
  - 📞 **Two consultation calls.** One to scope, one to walk through the plan and stress-test it.
  - ⏱ **Save at least 30 hours a week.** Or we'll keep meeting until we do.
- **CTAs**: Unlock my roadmap → / 📞 Talk to a strategist first
- **Fineprint**: Already a retainer client? This is included — your roadmap appears here automatically.

### Sneak peek (blurred)
- A look at what your roadmap will contain
- 4 phases: Stop the leak (Weeks 1-4) / Build the engine (Weeks 5-8) / Scale what works (Weeks 9-12) / Ongoing reviews + course-corrects.
- "🔒 Unlock to reveal" pill overlay.

### Active (customer)
- **Eyebrow**: Active
- **H2**: Your Q2 plan — Stop the leak.
- **Lead**: Last reviewed by Sara on 2026-04-30. Next check-in 2026-05-14.
- **Status**: 7/12 milestones complete.
- 3 phase cards with milestone checklists (✓ done / ◇ doing / ○ todo).
- **CTAs**: 📞 Book your check-in / Message your strategist.

---

## Need Some Help? page (`help.html`)

- **Hero**: 👋 / "Need some help? Get in touch."
- **H2**: We've got you covered.
- **Body**: Whether it's a quick fix or a big request — we're here to support you. Most questions can be answered instantly using your **Modules & Aqua AI assistant** — please check those first for the fastest fix. If you still need help, your **private support channel** is the quickest way to reach the team. We monitor it daily and respond as soon as possible. For deeper support, you can also book a call or submit a form below.
- **6 actions**: 📚 Modules & Resources · 🤖 Ask Aqua AI · 📞 Book a support call · 📝 Submit a support form · 💬 WhatsApp the team · 🗺 Unlock a custom roadmap.
- **FAQ**: I'm stuck on a module step · Something's broken / not loading · I want a feature added · I want to upgrade to a customer.

---

## Request a feature page (`request.html`)

- **Eyebrow**: Get help · Personal
- **H1**: Tell us what would help.
- **Lead**: Don't see the bit of the OS you actually need? Type it below. We read every one. If we already have it (a lot of the time we do), we'll switch it on for your account. If we don't, the most-asked ones get built within a few weeks.
- **Form labels**: What would help your business right now? · What kind of thing is it? · How urgent is it?
- **7 category tags**: 📈 Tracking numbers · 👥 Managing customers · ✓ Organising tasks · ✍️ Content / marketing · 💷 Finance / invoicing · 📚 Learning a skill · ✨ Something else.
- **Urgency**: Nice to have — whenever / This month would help / Pretty urgent — I'm stuck without it.
- **3 explainer cards**:
  - ⚡ **Already have it** — Half of all requests are things we've already built — we just hadn't switched it on for you. We respond within a working day.
  - 🛠 **Will build it** — If multiple people ask for the same thing, it jumps the queue. Most-requested features ship within a few weeks.
  - 🤝 **Won't build, but here's the workaround** — Sometimes the best help is pointing you at the right tool. We'll always reply with something — even if it's not "yes".

---

## Pro lockup card (`bos.js maybeProLock`)

When a free user hits leads.html / trackers.html / tasks.html / docs.html directly:

- **Eyebrow**: Pro feature
- **Per-page H1**: My customers / My numbers / My to-dos / My files
- **Per-page blurb**:
  - leads: A full sales pipeline — every lead, every stage, every quid in flight.
  - trackers: Live KPI tracking, time tracker, and connectors to QuickBooks / Stripe / Sheets.
  - tasks: Kanban tasks with assignees, due dates, recurring rules and automation triggers.
  - docs: Searchable SOPs, contracts, brand assets and the full SOP Hub library.
- **Sub-line**: This isn't in your free tier yet — but if you'd find it useful, we can switch it on for you. Most requests we already have built.
- **CTAs**: Request access → / See all add-ons.

---

## Aqua AI — replies (`bos.js askAi`)

Mocked keyword-routed responses. Free cap: 5 messages.

- "leak" / "biggest" → Reads `bos.healthCheck`. If present: "Based on your Health Check, your weakest topic is **[name]**. That's where the next 30 days will pay back fastest." Else: "I can't see a Health Check on file yet. Run it first."
- "module" / "first" → "For [niche], I'd start with **Get found on Google in 30 days**. It's the foundation everything else compounds on."
- "cheap" / "quick" → "Cheapest win: claim and optimise your Google Business Profile. Free, ~15 minutes, biggest local-search lever."
- "add-on" / "plugin" → "Given you're a [niche], the add-ons that move the needle first are usually **All-in-One Inbox** and **Client CRM**."
- Anything else → "Good question. I'm running on a limited offline preview right now — once we wire the live model it'll pull from your Health Check, your modules and your add-ons to answer this in detail. Until then: try \"What's my biggest leak?\" or \"Which module should I do first?\""

When out of free messages: "You're out of free messages for this session. [Upgrade for unlimited →]" (mailto).

Suggestion chips: "What's my biggest leak?" / "Which module should I do first?" / "What's the cheapest win for me?"

---

## Niche-specific copy

Today only the niche label and tagline apply — not deep content forks. Per-niche packs are an open follow-up.

When implemented, each pack would ship:
- Niche-specific HC question variants (1+ per topic).
- Niche-specific lesson set (e.g. Roofer OS adds `module.html?id=gmb-photoshoot-roofers`).
- Niche-specific KPI definitions (Therapist: client-hours, no-show rate, average session value, retention; Roofer: jobs/wk, ASP, callback rate, runway).
- Niche-specific SOP starter pack.
- Niche-specific Aqua AI replies.
