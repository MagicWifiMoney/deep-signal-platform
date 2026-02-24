
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
