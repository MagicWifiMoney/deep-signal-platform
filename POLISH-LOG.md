
## 2026-02-24 18:00 - Capacity Waitlist Flow

**What:** When Hetzner quota is hit and server creation fails, users now see a friendly amber "We're at capacity" UI instead of a generic red error. They get an email input + "Notify me" CTA. On submit, it fires `/api/waitlist` which sends Jake an email via Resend with the signup details (email, agent name, timestamp). Success state: "You're on the list! We'll email you when a slot opens."

**Why:** The conversion cliff. Every time the Hetzner quota is hit, users who complete the full 8-step wizard bounce on an opaque error. That's a warm lead lost with zero capture. Now it's a lead capture moment instead of a dead end.

**Details:**
- Backend: `/api/onboard/route.ts` and `/api/onboard/reserve/route.ts` now detect Hetzner quota errors by error code (`resource_limit_exceeded`, `servers_limit_reached`, `project_limit_reached`) and regex pattern matching
- Both return `{ code: 'SERVER_CAPACITY' }` with HTTP 503 when capacity is hit
- Frontend: `isCapacityError` state detected in deploy handler, shows amber waitlist UI
- Waitlist UI: amber color palette (warning, not failure), email input, "Notify me" CTA, "Try again anyway" escape hatch
- Success state shows submitted email address for confirmation
- `/api/waitlist/route.ts` new endpoint - validates email, sends Resend notification to Jake
- RESEND_API_KEY added to Vercel production env

**Commit:** c9a5166

## 2026-02-24 07:00 - Save Credentials + Token Security Fix

**What:** Added "Save credentials" button on the success page. Downloads a `.txt` file with agent name, domain, IP, gateway token, and reconnect instructions. Also fixed a security issue where the "Share on X" button was embedding the gateway token in the public tweet URL.

**Why:** Two real problems:
1. Token loss - localStorage clears on deploy, users who close the tab can't find their token later. The credential file solves this permanently.
2. Token exposure - sharing "I deployed my agent at https://name.ds.jgiebz.com/#token=abc123" on Twitter gives every follower auth access to your agent. Fixed by using clean domain in the public share URL.

**Details:**
- Save button styled amber to signal "do this now" urgency
- Downloaded file has a clear "Keep this private!" header
- File includes both the access URL and step-by-step reconnect instructions
- Share on X now links to https://domain only (no token fragment)
- Copy link still gives the full auth URL (right tool for private sharing)

**Commit:** 7a1419a

## 2026-02-24 04:00 - localStorage Progress Persistence

**What:** Onboarding form data and current step now save to localStorage automatically. If a user refreshes or accidentally closes the tab, they pick up right where they left off with a friendly "Picked up where you left off" banner + option to start over.

**Why:** Highest-impact UX win - losing 5 steps of config to an accidental refresh is rage-inducing. Zero backend needed.

**Details:**
- Saves step + form state on every change
- Auto-clears on deploy start or completion (no stale state)
- Won't restore deploy/success steps
- "Start over" button clears storage and resets
- Banner auto-dismisses after 4 seconds

**Commit:** 2f4370d

## 2026-02-24 05:00 - Share to X + Copy Link Buttons

**What:** Added "Share on X" and "Copy link" buttons to the success page after deploy completes. The X button pre-fills a tweet with the agent name and link. The copy button shows a green "Copied!" confirmation for 2 seconds.

**Why:** Viral loop - the moment someone deploys is peak excitement. Making it one click to share means free distribution. Copy link covers non-Twitter users who want to share via DM or Slack.

**Details:**
- X share uses twitter intent URL with pre-filled text + agent URL
- Copy button flips to green checkmark + "Copied!" state for 2s
- Both buttons sit below the instance details card
- No external dependencies added

**Commit:** bc0856c

## 2026-02-24 06:00 - Keyboard Shortcuts

**What:** Added keyboard navigation to the onboarding wizard. Enter advances to the next step, Escape goes back. A subtle "press Enter" hint appears below the Continue button on desktop.

**Why:** Power users (and impatient people) shouldn't have to reach for the mouse between steps. Makes the whole wizard feel snappier and more polished - like a real product, not a form. The hint teaches the shortcut without being annoying, and hides on mobile where it's irrelevant.

**Details:**
- Enter fires handleNext() only when canProceed() is true and not on last step
- Escape goes back one step (only when step > 0)
- Both are suppressed when focus is on an input/textarea/select (so typing still works)
- Both are suppressed during and after deploy
- "press Enter" hint is hidden on mobile (sm:block)
- No new dependencies

**Commit:** 9e6ad09

## 2026-02-24 07:00 - Trust Badges Section

**What:** Added a trust badges row on the landing page between the stats bar and FAQ section. Five badges: "Your data stays yours", "Runs on Hetzner (EU/US)", "Powered by OpenClaw", "No vendor lock-in", "Full SSH access".

**Why:** Social proof and trust signals right before the FAQ (where people go when they're on the fence). These address the top objections - privacy, ownership, flexibility - in a scannable format. Zero friction, high signal.

**Details:**
- Emoji + label format, flex-wrap for mobile
- Sits between stats bar and FAQ for natural reading flow
- No new dependencies

**Commit:** 1a827ca

## 2026-02-24 08:00 - Animated Chat Preview on Landing Page

**What:** Added a live animated chat preview to the landing page hero section. It cycles through 3 demo conversations showing realistic agent interactions - calendar management, inbox triage, Slack catch-up. Agent messages type out character by character with a cursor, user messages pop in naturally, and there's a typing indicator between turns.

**Why:** "Show, don't tell" is the #1 conversion principle. The hero had a strong headline but nothing showing the product in action. Now visitors see exactly what chatting with their agent looks like before they even click Deploy. The conversations demonstrate real utility (not generic "how can I help you?" stuff) - killing AWS instances, forwarding leads, approving blog posts. That is the "holy shit" moment.

**Details:**
- 3 conversation scripts that rotate every ~4 seconds after completion
- Character-by-character typing at ~20ms/char with slight randomness for realism
- Bouncing dot typing indicator before agent replies
- Fake browser chrome (traffic lights + domain + green live dot)
- Auto-scrolls as messages appear
- 220px fixed height so layout doesn't jump
- Mobile responsive (max-w-lg, 85% max bubble width)
- No external dependencies - pure React state machine

**Commit:** 315122c

## 2026-02-24 09:00 - Progressive Background Glow

**What:** Background blobs now shift color as users progress through the 8 onboarding steps. Starts cyan/blue, moves through indigo/violet/purple/fuchsia, and lands on emerald/green at the deploy step. Colors transition smoothly over 1 second using inline styles (not Tailwind class swaps, which can't animate).

**Why:** Subconscious sense of journey. Users feel like they're moving through something - not just clicking "next" on a form. The shift to green at deploy reinforces "you're about to launch." It's the kind of detail nobody notices consciously but everyone feels.

**Details:**
- 8-color palette mapped to each step
- Inline `backgroundColor` with CSS `transition: background-color 1s ease`
- No new dependencies, zero layout impact
- Mobile works identically

**Commit:** e714ba2

## 2026-02-24 15:00 - Conversation Starters on Success Page

**What:** Added 3 clickable "Say something to get started" prompt cards to the post-deploy success page, between the instance details card and the share buttons.

**Why:** 5 deployed instances, 0 messages. Classic cold-start problem - users deploy successfully but face a blank chat interface and don't know what to say first. This bridges the deploy→first-chat gap with zero friction.

**Details:**
- 3 prompts: intro/capability showcase, live web search, automation offer
- Click copies text to clipboard AND opens agent in new tab simultaneously
- Cards animate to green "Copied! Paste it in your agent →" state on click
- Same UX pattern as existing copy-link button (familiar interaction)
- No new dependencies

**Commit:** 543e4dc

## 2026-02-24 10:03 - Agent Naming Easter Eggs

**What:** Type a famous AI name during onboarding and get a themed preview message + custom avatar gradient. 9 easter eggs: Jarvis (Iron Man red/gold), Friday (blue/purple), HAL (red, with the joke), Cortana (blue/indigo), Skynet (reassuring), Samantha (Her pink), GLaDOS (Portal sass), Botti (our own), and Clippy (the legend).

**Why:** Pure delight. Zero UX cost - if you don't type a famous name, nothing changes. But if you DO, you get a little moment of "oh they thought of that." It's the kind of detail that makes people screenshot and share. Also gives the naming step more personality beyond just picking from a list.

**Details:**
- Easter egg lookup is case-insensitive
- Custom gradient on the avatar circle per character
- Themed first message in the preview bubble
- Subtle "Nice reference" text appears below
- No new dependencies, no layout shifts

**Commit:** 3a25f88
