
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
