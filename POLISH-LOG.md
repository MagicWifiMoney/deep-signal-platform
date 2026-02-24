
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
