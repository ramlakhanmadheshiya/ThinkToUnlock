# ThinkToUnlock — PRD

## Overview
Android-first mobile app to stop doom-scrolling. Locks distracting apps until the user earns time by completing brain-game challenges.

## Architecture
- **Frontend**: Expo Router (file-based) + React Native + TypeScript
- **Backend**: Untouched (FastAPI scaffold remains)
- **Storage**: AsyncStorage (local-only, single device, no auth)
- **Native locking**: Simulated within the app (real Android UsageStatsManager + AccessibilityService requires custom dev build — left as a future hook)

## Theme
Neo-brutalist: off-white `#F5F1E8` background, terracotta `#E04D36` accent, black `#0A0A0A` text, thick 4px black borders, hard offset shadows (4-6px solid black drop). Headings ALL CAPS, font-weight 900, tight letter spacing.

## Features Implemented (MVP)
### Onboarding
- Force parent password setup on first launch (min 4 chars).

### Tab: Home
- Time Wallet hero card (tap → wallet detail).
- Daily challenges counter pill.
- Locked apps list with `+` (consume 5 wallet min → app) and `−` (refund 5 min) buttons.
- Tap on app → if it has time, opens simulated app screen with foreground-only countdown.
- Tap on app with no time → modal: "Play Game" or "Close".
- 30-sec pre-lock warning banner when countdown reaches 30s.
- Earn-time CTA → Games tab.

### Tab: Games
- 5 fully implemented brain games: Memory Match, Math Quiz, Word Scramble, Pattern Recall, Number Sequence.
- 15 placeholder "Coming Soon" cards.
- Random Challenge button.
- Per-game flow: Start screen (logo, "prove you're focused. Score ≥ 60% to pass and unlock your app", difficulty pills with reward, Start button) → Play → Win/Loss screen with score card, quote, Play Again / Try Again, Back to Home.
- Difficulty rewards: Easy +5, Medium +10, Hard +15 minutes.

### Tab: Manage Apps
- Parent-password gated.
- Toggle lock/unlock for 12 mock apps (Instagram, TikTok, YouTube, PUBG, Snapchat, Facebook, WhatsApp, Twitter/X, Reddit, Discord, Telegram, Netflix).
- Premium banner / clock icon (when premium) to set daily auto top-up minutes per app.

### Tab: Settings
- Change parent password (requires current password).
- Min daily challenges (premium only).
- Reset app (password-confirmed wipe + return to setup).
- Premium upgrade card.

### Premium (Mock Paywall)
- "Pass Payment" → unlocks all premium features.
- "Fail Payment" → no unlock.
- Premium features: Daily auto top-up at midnight per app, min daily challenge gate.

### Wallet Detail
- Add Time button → Games tab.
- History list: game name, difficulty, ± minutes, time-of-day (today) or date (older).

## Mocked / Simulated
- **MOCKED INSTALLED-APPS LIST**: 12 hardcoded mock apps (real Android `PackageManager` requires native module).
- **SIMULATED APP LOCKING**: Foreground countdown happens within the ThinkToUnlock app — we cannot actually lock other Android apps in Expo Go preview.
- **MOCKED PREMIUM PAYMENT**: Pass/Fail buttons (Google Billing not yet wired).
- **MOCKED 30-SEC NOTIFICATION**: In-app banner (not a real OS notification).

## Data Schema (AsyncStorage key `thinktounlock:v1`)
```
{
  parentPassword: string,
  timeWalletMinutes: number,
  dailyChallengesCompleted: number,
  lastChallengeResetDate: 'YYYY-MM-DD',
  apps: { [id]: { locked, timeRemainingSec, defaultDailyMinutes } },
  history: [{ id, gameId, gameName, difficulty, minutesAdded, passed, timestamp }],
  isPremium: boolean,
  minDailyChallenges: number,
  lastDailyTopupDate: string
}
```

## Future Native Wiring (Out of MVP scope)
1. `expo-modules-core` custom native module to read `PackageManager` apps.
2. `AccessibilityService` to detect app foreground & redirect to ThinkToUnlock when time runs out.
3. `expo-notifications` for real OS-level 30-sec pre-lock alert.
4. Google Play Billing for real premium purchase.
