# ThinkToUnlock — PRD (v1.1)

## Overview
Android-first mobile app to stop doom-scrolling. Locks distracting apps until the user earns time by completing brain-game challenges.

## Architecture
- **Frontend**: Expo Router (file-based) + React Native + TypeScript
- **Storage**: AsyncStorage (local-only, single device)
- **Native locking**: Simulated within the app — real locking requires custom dev build (deferred)

## Theme (v1.1 — Modern, replaces neo-brutalist)
- Background `#FAFAF9`, surface `#FFFFFF`, alt `#F4F4F5`
- Primary terracotta orange `#FF5A36`, soft tint `#FFEDE6`
- Text `#18181B`, muted `#71717A`, light `#A1A1AA`
- Soft drop shadows (elevation 1-5), rounded corners 14-22px
- No yellow, no thick borders, no hard offset shadows
- Premium accent purple `#8B5CF6`
- Semantic green `#10B981` / red `#EF4444` for game feedback

## Tabs

### Home
- App-name header "ThinkToUnlock" (no tab-name pill)
- Time Wallet hero card (orange, glow effect) — tap → wallet detail (history)
- "Earn Time → Play Brain Game" CTA — placed between wallet and locked apps
- Locked apps cards with `+` (consume 5 wallet min) / `−` (refund 5 min)
- Tap on app → simulated countdown screen if has time, else dismissable modal
- **Dismissable modal** appears for: app with no time, OR `+` tap with empty wallet (Cancel button + outside-tap dismiss)

### Games
- "Brain Challenges" heading (no tab-name pill)
- Random Challenge button
- Grid of 20 game cards: 5 implemented + 15 placeholders ("SOON")
- 5 implemented games:
  - **Memory Match** — flip pairs. Easy 4 pairs/60s/target ≤6 moves; Med 6/90s/≤10; Hard 8/120s/≤14. Score = completion × (0.5 + 0.5 × efficiency).
  - **Math Quiz** — 8 questions w/ per-question timer (25/18/12s), +,-,×, range 15/30/60. Red/green feedback. Score = correct/total × 100.
  - **Word Scramble** — 5 rounds w/ per-round timer (25/20/15s). 3-4 / 5-6 / 7-9 letter words. Score = correct/5 × 100.
  - **Pattern Recall** — 4 rounds, sequence length 3/5/7. Score = correctRounds/4 × 100.
  - **Number Sequence** — 6 questions w/ per-question timer (20/15/10s), patterns: add / +mul / +sq +fib. Red/green feedback.
- Each game: Start screen (logo, "prove you're focused. Score ≥60%", difficulty tiles, reward card, Start button) → Play → Win/Loss screen (score card, quote, Play Again / Back to Home).

### Manage Apps (parent-gated, auto-locks on blur)
- 12 mock apps with toggle lock/unlock switches
- Lock icon top-right corner (no text button)
- Premium banner if not premium → routes to /premium
- When premium: clock icon per locked app to set daily auto top-up

### Settings (parent-gated, auto-locks on blur)
- Lock icon top-right corner
- Account section: Change parent password
- **Premium Features section** (star icon header):
  - Daily auto top-up
  - Min challenges per day (locked behind premium)
  - Full play history
  - All rows show lock icon when not premium → routes to /premium
- Danger zone: Reset app (password-confirmed wipe)

### Premium (Mock Paywall)
- Premium features list with checkmarks
- Price card $4.99 lifetime
- Pass Payment / Fail Payment buttons (Google Billing not yet wired)
- Pass → unlocks all premium features

## Data (AsyncStorage `thinktounlock:v1`)
```
{
  parentPassword, timeWalletMinutes, dailyChallengesCompleted, lastChallengeResetDate,
  apps: { [id]: { locked, timeRemainingSec, defaultDailyMinutes } },
  history: [{ id, gameId, gameName, difficulty, minutesAdded, passed, timestamp }],
  isPremium, minDailyChallenges, lastDailyTopupDate
}
```

## Mocked / Deferred
- **MOCKED installed-apps list** (12 apps; real PackageManager needs native module)
- **MOCKED app locking** (in-app simulation; real locking needs AccessibilityService + custom dev build)
- **MOCKED 30-sec pre-lock notification** (in-app banner; OS notification needs expo-notifications + dev build)
- **MOCKED premium payment** (Pass/Fail buttons; Google Billing not yet integrated)

## Critical Fixes (v1.1)
- Preload Ionicons font via `useFonts(Ionicons.font)` + SplashScreen lock — fixes Expo Go iOS crash
- Auto-lock Manage & Settings on tab blur via `useFocusEffect` cleanup
- Game scoring re-tuned (Memory Match efficiency formula, per-game timers)

## Future Native Wiring (Custom dev build / EAS Build required)
1. `expo-modules-core` custom native module → `PackageManager.getInstalledApplications()`
2. `AccessibilityService` to detect app foreground & redirect to ThinkToUnlock when timer hits 0
3. `expo-notifications` for real OS-level 30-sec pre-lock alert
4. Google Play Billing for real premium purchase (test via Play Console)
