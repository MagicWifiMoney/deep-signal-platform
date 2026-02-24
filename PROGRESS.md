# Deep Signal Enhancement Progress

## Task: Security + UX Overhaul
Started: 2026-02-24

## Status: COMPLETE

### 1. Security Hardening - DONE
- [x] Crypto-random gateway tokens (crypto.randomBytes(24).toString('hex'))
- [x] API key NOT written to bootstrap log (set +x + redirect to /dev/null)
- [x] Rate limiting (Map-based, 3 deploys/IP/hour, 429 response)
- [x] Gateway token hash in Hetzner labels (not raw token)

### 2. Background Provisioning - DONE
- [x] reserve/route.ts - Creates server with free defaults at step 1
- [x] configure/route.ts - Updates config via dsconfig.jgiebz.com
- [x] Frontend fires reserve after step 1 name entry
- [x] Deploy uses configured server if available, falls back to full onboard

### 3. Landing Page Polish - DONE
- [x] How it works section (3 steps)
- [x] What can your agent do? section (8 capability cards)
- [x] FAQ section (6 collapsible Q&As)

### 4. Step Transitions - DONE
- [x] fadeSlideIn CSS animation (opacity + translateY)
- [x] key prop on step wrapper triggers re-animation on every step change

### 5. WhatsApp Channel - DONE
- [x] Added to CHANNEL_OPTIONS array

### 6. Better Deploy Error Recovery - DONE
- [x] "Try Again" button retries deploy
- [x] "Start with Free Tier" button when API key error detected
- [x] Error message shown clearly
- [x] "Need help? Contact support" link

### Build & Deploy - DONE
- [x] npm run build passed with 0 errors
- [x] git commit + push
