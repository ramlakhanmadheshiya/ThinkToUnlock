# ThinkToUnlock — Development Checklist & Technical Documentation

**Last Updated:** May 15, 2026  
**Product Status:** v1.1 (Production)  
**Next Review:** When starting new development cycle

---

## 🎯 Quick Overview for New Developers

**ThinkToUnlock** is an Android-first mobile app that combats doom-scrolling by gamifying screen time. Users earn time to unlock distracting apps by completing brain-game challenges. The app enforces parental controls, tracks gaming history, and offers optional premium features like daily auto top-up and challenge quotas.

**Key Philosophy:** Playful, non-judgmental, minimalist UX with robust parental controls.

---

## 📋 Project Structure

```
app/
├── frontend/              # React Native (Expo) mobile app
│   ├── app/              # File-based routing (Expo Router)
│   │   ├── _layout.tsx   # Root navigator setup
│   │   ├── (tabs)/       # Main tabbed interface
│   │   │   ├── home.tsx        # Time wallet & locked apps
│   │   │   ├── games.tsx       # Brain game library
│   │   │   ├── manage.tsx      # Parent-gated app management
│   │   │   ├── settings.tsx    # Parent-gated config
│   │   ├── premium*.tsx  # Premium paywall screens
│   │   ├── game/         # Game stack navigator
│   │   │   └── [id].tsx  # Dynamic game player
│   │   ├── setup-password.tsx
│   │   ├── app-locked.tsx
│   │   └── wallet-detail.tsx
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   ├── Brutal.tsx      # Brutalist card/button components
│   │   │   ├── Icon.tsx        # Emoji-based icon mapper
│   │   │   ├── TabHeader.tsx   # Tab navigation header
│   │   │   ├── ManagerHeader.tsx
│   │   │   ├── WheelPicker.tsx # Custom picker for timers
│   │   ├── data/         # Mock & reference data
│   │   │   ├── games.ts        # Game metadata (names, difficulties)
│   │   │   ├── mockApps.ts     # 12 mock app definitions
│   │   ├── games/        # Game implementations
│   │   │   └── AllGames.tsx    # 5 implemented + 15 placeholder games
│   │   ├── native/       # Native module wrappers
│   │   │   └── AppManager.ts   # Device API access (PackageManager, etc.)
│   │   ├── store/        # State management
│   │   │   ├── StateContext.tsx # Global app state & actions
│   │   │   └── storage.ts      # AsyncStorage persistence logic
│   │   ├── theme.ts      # Color palette, spacing, shadows
│   ├── android/          # Native Android module (optional)
│   ├── scripts/          # Utility scripts
│   │   ├── reset-project.js
│   │   └── patch-keep-awake.sh
│   ├── package.json      # npm dependencies & scripts
│   ├── tsconfig.json     # TypeScript config
│   └── eslint.config.js  # Linting rules
├── backend/              # FastAPI + MongoDB
│   ├── server.py         # Main API entry point
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Environment template
├── design_guidelines.json # UI/UX theme definition
├── memory/               # Project documentation
│   ├── PRD.md           # Product Requirements Doc
│   └── test_credentials.md
└── DEVELOPMENT_CHECKLIST.md # This file
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React Native 0.81.5 with Expo (~54.0.34)
- **Routing:** Expo Router v6 (file-based navigation)
- **State Management:** React Context + AsyncStorage
- **UI Components:** React Native built-ins + custom Brutal components
- **Language:** TypeScript 5.9
- **Styling:** Inline styles (RN StyleSheet) + design tokens in `theme.ts`
- **Icons:** Custom emoji mapper (no font loading)
- **Navigation:** @react-navigation v7

### Backend
- **Framework:** FastAPI 0.110.1
- **Server:** Uvicorn
- **Database:** MongoDB 4.5.0 (async via Motor)
- **Auth:** JWT + bcrypt hashing
- **Validation:** Pydantic
- **Tooling:** Black, isort, flake8, mypy, pytest
- **Language:** Python 3.8+

### Data Storage
- **Primary:** AsyncStorage (local-only, single device)
- **Schema Key:** `thinktounlock:v1`
- **Future:** MongoDB (backend only, not yet wired to frontend)

### Deployment & DevOps
- **Mobile:** Expo Go + custom dev build (for native features)
- **Backend:** Docker-ready, needs `MONGO_URL` env var
- **CI/CD:** Not yet configured (TBD)

---

## 🎮 Feature Breakdown & Development Status

### ✅ COMPLETED FEATURES

#### Home Tab
- **Time Wallet Hero Card** — displays minutes with orange gradient/glow
- **Wallet Detail View** — tappable to see history with timestamp, game, score, minutes added
- **CTA Button** — "Earn Time → Play Brain Game" positioned between wallet and apps
- **Locked Apps List** — mock 12 apps with toggle lock/unlock switches
- **+/- Buttons** — add/remove 5-minute increments (validation: min 5 mins, empty wallet handling)
- **Dismissable Modals** — for insufficient wallet balance or locked apps

#### Games Tab (Brain Challenges)
- **Game Grid** — 5 implemented games + 15 "SOON" placeholders
- **Random Challenge Button** — selects random unlocked game

**Implemented Games:**
1. **Memory Match**
   - Pair-flipping game
   - Difficulties: Easy (4 pairs, 60s, target 6 moves) / Medium (6 pairs, 90s, 10 moves) / Hard (8 pairs, 120s, 14 moves)
   - Scoring: 50% completion + 50% efficiency
   
2. **Math Quiz**
   - 8 questions with per-question timers (25/18/12s)
   - Operations: +, −, ×
   - Number ranges: 15 / 30 / 60
   - Red/green feedback
   - Scoring: correct/total × 100

3. **Word Scramble**
   - 5 rounds with per-round timers
   - Word lengths: 3–4 / 5–6 / 7–9 letters
   - Scoring: correct/5 × 100

4. **Pattern Recall**
   - 4 rounds, sequence lengths: 3 / 5 / 7
   - Scoring: correctRounds/4 × 100

5. **Number Sequence**
   - 6 questions with per-question timers
   - Patterns: arithmetic, multiply, square, Fibonacci
   - Red/green feedback
   - Scoring: correct/total × 100

**Game UX Flow:**
- Start Screen → Difficulty Selector → Play → Win/Loss Screen (score card, quote, Play Again / Back to Home)
- Win threshold: score ≥ 60%
- Reward card displayed pre-game (shows minutes earned upon completion)

#### Manage Apps (Parent-Gated)
- **Password Lock** — requires parent password to access
- **Auto-Lock on Tab Blur** — clears UI when user switches away
- **Toggle Switches** — enable/disable app locking per app
- **Lock Icon** — visual indicator (top-right corner)
- **Premium Banner** — if not premium, routes to premium paywall

#### Settings (Parent-Gated)
- **Password Lock** — requires parent password
- **Auto-Lock on Tab Blur** — clears UI on blur
- **Change Password** — secure password update
- **Premium Features Section** — star icon header with feature list
- **Reset App** — wipes all data with password confirmation
- **Premium Feature Locks** — lock icons for non-premium features route to paywall

#### Premium Paywall
- **Feature List** — checkmarks for: daily auto top-up, challenge quotas, play history, all premium features
- **Pricing Card** — $4.99 lifetime (mock)
- **Pass/Fail Buttons** — for testing purchase flow (real Google Billing not yet wired)

#### State Management & Persistence
- **AsyncStorage Schema:**
  ```json
  {
    "parentPassword": "hashed",
    "timeWalletMinutes": 0,
    "dailyChallengesCompleted": 0,
    "lastChallengeResetDate": "YYYY-MM-DD",
    "apps": {
      "[appId]": {
        "locked": true,
        "timeRemainingSec": 0,
        "defaultDailyMinutes": 0
      }
    },
    "history": [
      {
        "id": "uuid",
        "gameId": "memory-match",
        "gameName": "Memory Match",
        "difficulty": "easy",
        "minutesAdded": 5,
        "passed": true,
        "timestamp": "2026-05-15T10:30:00Z"
      }
    ],
    "isPremium": false,
    "minDailyChallenges": 0,
    "lastDailyTopupDate": "YYYY-MM-DD"
  }
  ```

#### Theme & Design
- **Modern, Soft Aesthetic** (v1.1 replaced neo-brutalism)
- **Color Palette:**
  - Background: `#FAFAF9`, Surface: `#FFFFFF`
  - Primary (Terracotta Orange): `#FF5A36`
  - Accent Purple (Premium): `#8B5CF6`
  - Semantic: Green `#10B981` (success), Red `#EF4444` (error)
- **Typography:** Archivo Black / Cabinet Grotesk (headings), DM Sans (body)
- **Shadows:** Soft drop shadows (elevation 1–5)
- **Spacing:** Generous padding, rounded corners 14–22px
- **No borders, no thick shadows**

#### Critical Fixes Applied (v1.1)
- ✅ Preload Ionicons via `useFonts` + SplashScreen lock (fixes Expo Go iOS crash)
- ✅ Auto-lock Manage & Settings on tab blur via `useFocusEffect` cleanup
- ✅ Game scoring re-tuned (Memory Match efficiency formula)

---

### 🚧 IN-PROGRESS FEATURES

#### Backend API Wiring
- **Status:** Partially stubbed (basic endpoint structure in place)
- **Work:** 
  - [ ] Connect frontend AsyncStorage to backend MongoDB for cloud sync
  - [ ] Implement authentication (JWT) for user accounts
  - [ ] Add game history endpoint with filtering/pagination
  - [ ] Add user profile endpoints (change password via API)
- **Dependent On:** User account system design (currently mock/local-only)

#### Custom Native Module Integration
- **Status:** Stubs in place (`AppManager.ts`)
- **Work:**
  - [ ] Implement `PackageManager.getInstalledApps()` via Expo modules
  - [ ] Wire real device app list to mock list fallback
  - [ ] Return proper app icons & names from actual installed apps

---

### 📋 PENDING / DEFERRED FEATURES

#### High Priority (v1.2 Roadmap)
- [ ] **Real App Locking** — AccessibilityService to detect app foreground & redirect to ThinkToUnlock when timer expires
- [ ] **Real OS Notifications** — 30-sec pre-lock alert via expo-notifications (requires dev build)
- [ ] **Google Play Billing** — integrate Google Play Billing API for real premium purchases
- [ ] **Daily Auto Top-Up** — schedule-based wallet refill (premium feature)
- [ ] **Challenge Quotas** — require minimum daily challenges completed (premium feature)
- [ ] **Full Play History** — paginated history with filters, charts (premium feature)

#### Medium Priority (v1.3+)
- [ ] **Additional Games** — implement 15 placeholder games
  - [ ] Typing Speed
  - [ ] Sudoku Variant
  - [ ] Image Recognition
  - [ ] Reaction Time
  - [ ] Logic Puzzle
  - [ ] (10 more TBD)
- [ ] **Weekly/Monthly Challenges** — special achievements & rewards
- [ ] **Leaderboard** — compare scores with other users (backend req'd)
- [ ] **Customizable App Groups** — organize apps by category
- [ ] **Time Allocation Presets** — quick-set profiles (e.g., "Study Mode", "Break Mode")
- [ ] **Push Notifications** — for achievements, quota reminders (requires expo-notifications)
- [ ] **Web Dashboard** — parental viewing of child's game history & stats

#### Low Priority / Nice-to-Have
- [ ] **Dark Mode** — theme toggle
- [ ] **Multi-User Support** — multiple child profiles per parent
- [ ] **Multiplayer Challenges** — head-to-head game modes
- [ ] **Accessibility Improvements** — screen reader support, larger text options
- [ ] **Offline Sync** — queue actions while offline, sync when connected
- [ ] **Analytics** — track feature usage, game difficulty trends

#### Known Limitations (Not In Scope)
- ❌ Real app detection (currently 12 mock apps only)
- ❌ Real app locking (in-app simulation only; requires native module)
- ❌ iOS support (Android-first; iOS requires separate testing)
- ❌ Cloud backup (local-only storage; manual export/import TBD)

---

## 💻 Development Workflow & Standards

### Code Style & Conventions

#### TypeScript/React Native
- **Language:** TypeScript strict mode enabled
- **Naming:**
  - Components: PascalCase (`MemoryMatch`, `BrutalButton`)
  - Files: match component names or lowercase with hyphens for utilities
  - Functions/hooks: camelCase (`handleComplete`, `useGameState`)
  - Constants: UPPER_SNAKE_CASE (`DEFAULT_TIMER`, `API_TIMEOUT`)
  - Interfaces/Types: PascalCase with prefix `I` or suffix `Props`, `State` (optional but encouraged)
- **Comments:**
  - JSDoc for public functions: `/** Adds minutes to wallet. Returns true if successful. */`
  - Inline comments for complex logic, business rules, or workarounds
  - TODO/FIXME markers for incomplete work: `// TODO: add error boundary`
  - No commented-out code; use git history or delete
- **Imports:** Group by external, then local (alphabetical within groups)
  ```typescript
  import React from 'react';
  import { View, Text } from 'react-native';
  
  import { colors, spacing } from '../theme';
  import { BrutalButton } from './Brutal';
  ```
- **Error Handling:**
  - Always catch errors in async functions
  - Log errors to console in dev, send to analytics in production
  - Return sensible defaults or null; do not let errors bubble silently
- **Performance:**
  - Use `useMemo` for expensive computations
  - Use `useCallback` for event handlers passed as props
  - Avoid inline function creation in render
  - Profile with React DevTools Profiler; aim for <16ms frame time

#### Python (Backend)
- **Style:** Follow PEP 8 (enforced by Black, isort, flake8)
- **Type Hints:** Use everywhere (mypy --strict validation)
- **Naming:**
  - Classes: PascalCase (`StatusCheck`, `MongoRepository`)
  - Functions/variables: snake_case (`create_status`, `mongo_url`)
  - Constants: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- **Docstrings:** Google-style for all functions
  ```python
  def create_status(name: str) -> StatusCheck:
      """Create a new status check record.
      
      Args:
          name: Client identifier.
      
      Returns:
          StatusCheck model with generated ID and timestamp.
      
      Raises:
          ValueError: If name is empty.
      """
  ```
- **Error Handling:**
  - Use FastAPI HTTPException for API errors with proper status codes
  - Log all errors with context (user ID, timestamp, request)
  - Validate input with Pydantic; let FastAPI return 422 for invalid payloads

### Git Workflow
- **Branch Naming:** `feature/feature-name`, `bugfix/bug-name`, `hotfix/issue-num`
- **Commit Messages:**
  - Format: `[type] Description` (e.g., `[feat] Add Memory Match game`)
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
  - Capitalize first letter, no period at end
  - Keep to 50 chars; use body for details
- **Pull Requests:**
  - Link related issues
  - Describe changes, testing performed, and any breaking changes
  - Require code review before merge
  - Delete branch after merge

### Testing Requirements

#### Frontend Unit Tests (Jest + React Native Testing Library)
- **Coverage Target:** >70% statements, >50% branches
- **Test Location:** `__tests__/` folder or `.test.ts` suffix
- **What to Test:**
  - Component rendering with various props
  - Event handlers (button clicks, form submissions)
  - Hook state transitions
  - Error boundary behavior
  - Accessibility (a11y) for critical UI
- **Example:**
  ```typescript
  describe('BrutalButton', () => {
    it('calls onPress when tapped', () => {
      const mock = jest.fn();
      const { getByText } = render(<BrutalButton onPress={mock} label="Press" />);
      fireEvent.press(getByText('Press'));
      expect(mock).toHaveBeenCalled();
    });
  });
  ```

#### Frontend Integration Tests
- **Tool:** Detox (e2e testing framework for RN)
- **Focus:** Critical user flows
  - Game completion flow (start → play → win/loss)
  - App locking/unlocking with wallet
  - Parent password authentication
  - Premium feature access
- **Run:** `detox build-framework-cache && detox test` (TBD implementation)

#### Backend Unit Tests (pytest)
- **Coverage Target:** >80% statements
- **Test Location:** `tests/` folder
- **Fixtures:** Use pytest fixtures for mocked DB, app instances
- **Async Tests:** Use `pytest-asyncio` for async function testing
- **Run:** `pytest -v --cov=app`

#### Manual Testing Checklist
Before each release, manually verify:
- [ ] App loads without crashes (iOS & Android)
- [ ] Home tab: wallet displays correctly, +/- buttons work, balance updates
- [ ] Games: all 5 games play to completion, scoring accurate, reward given
- [ ] Parent gate: password prompt works, incorrect password denied, correct allowed
- [ ] Data persistence: close & reopen app, state retained
- [ ] Edge cases:
  - [ ] Empty wallet, attempt to unlock app → dismissible modal
  - [ ] Game completion with 0% score → loss screen, no reward
  - [ ] Very long app names or labels → no UI overflow
  - [ ] Rapid button mashing → debounced, no double-entry

### Linting & Code Quality

#### Frontend
- **Lint:** `npm run lint` (ESLint with expo config)
- **Auto-Fix:** `eslint --fix` to auto-correct style issues
- **Pre-Commit:** (TBD) add husky hook to run lint on staged files

#### Backend
- **Format:** `black .` and `isort .`
- **Lint:** `flake8 .` (max line 100)
- **Type Check:** `mypy . --strict`
- **Pre-Commit:** (TBD) add pre-commit hooks

---

## 🧭 Coding Ethics & Best Practices

### User Privacy & Data Security
- **No Tracking:** Do not collect user data beyond what's necessary for app function
  - ✅ Store: parent password (hashed), game history, app lock states
  - ❌ Do NOT: track individual tap sequences, session duration, diagnostic data (unless explicitly opted-in)
- **Data Minimization:** Only store what's needed for the feature
  - Game history: only game name, difficulty, score, minutes earned, timestamp
  - Don't store full game trace (every move/click) unless building advanced analytics (TBD)
- **Encryption:**
  - Parent password: bcrypt with salt (min 10 rounds)
  - Sensitive API endpoints: require JWT authentication
  - Use HTTPS only (no HTTP for backend APIs)
  - AsyncStorage encrypted at rest on device (system-dependent)
- **Deletion & Right to Forget:**
  - Implement "Reset App" button → wipes all local storage
  - Backend (TBD): add DELETE /user endpoint to remove all server-side data
  - No data retention after user deletion

### Accessibility & Inclusivity
- **Screen Reader Support:**
  - All interactive elements: add `accessibilityLabel` and `accessibilityHint`
  - Button: `accessibilityLabel="Add 5 minutes to wallet"`
  - Form field: `accessibilityLabel="Enter parent password" accessibilityHint="Required to manage apps"`
- **Color Contrast:**
  - Text on background: minimum WCAG AA (4.5:1 for body, 3:1 for large text)
  - Test with WebAIM contrast checker
- **Font Sizing:**
  - Minimum 16px for body text (system-scaling compatible)
  - Heading hierarchy: h1 > h2 > h3 (do not skip levels)
  - Avoid very small captions (<12px)
- **Touch Target Size:**
  - Minimum 44px × 44px (Apple HIG), 48dp × 48dp (Android Material)
  - Spacing: 8px min between adjacent targets

### Child Safety & Parental Controls
- **Password Protection:**
  - Parent password required to access Manage Apps, Settings, premium features
  - Password prompt on entry; auto-clears on blur (hard stop, not just visual)
  - Never auto-fill password fields
- **Content Safety:**
  - All game content must be age-appropriate (7+)
  - Games: no violence, no ads, no external links
  - Messages: playful but not condescending ("You got this!" not "You failed")
- **Transparency:**
  - Parent can always view game history, locked apps, time allocation
  - No hidden features or surprise rewards (all settings visible)
- **Parental Escape Hatch:**
  - Parent can always reset app via password (destroy all child progress if needed)
  - No way to lock out parent

### Product Ethics
- **Minimalism Over Monetization:**
  - Premium features are nice-to-have, not required for core functionality
  - Free tier is fully playable, not "freemium" with nagging
  - No dark patterns (e.g., infinite scroll, algorithmic addiction)
- **Honest Difficulty:**
  - Game difficulties (easy/medium/hard) must be calibrated to actual user ability
  - No fake high scores or false confidence (show real performance)
- **Sustainable Design:**
  - App should reduce screen time, not increase it
  - Games should be challenging but winnable (~60–70% pass rate at correct difficulty)
  - No achievement notifications or push reminders (to avoid creating compulsive behavior)

---

## 🚀 Development Setup & Getting Started

### Prerequisites
- **Node.js** v18+ (use `nvm` if managing multiple versions)
- **npm** or **yarn** v1.22+
- **Python** 3.8+ (for backend)
- **Git** 2.25+
- **Expo CLI** v0.75+ (install globally: `npm install -g expo-cli`)
- **Android SDK** (if testing on Android emulator; Expo Go not required)

### Local Frontend Setup

1. **Clone & Install**
   ```bash
   cd frontend/
   npm install  # or yarn install
   ```

2. **Start Dev Server**
   ```bash
   npm start  # Starts Expo development server
   # Options:
   # - Press 'a' to open Android emulator
   # - Press 'i' to open iOS simulator (macOS only)
   # - Scan QR code with Expo Go app on physical device
   ```

3. **Run Linter**
   ```bash
   npm run lint
   ```

4. **Build for Distribution**
   ```bash
   # Android APK (local):
   npm run android  # or: expo run:android
   
   # iOS (macOS only):
   npm run ios  # or: expo run:ios
   
   # Web (browser):
   npm run web  # Useful for testing components, not full app
   ```

5. **Reset Project** (wipes all custom code, starts fresh)
   ```bash
   npm run reset-project
   ```

### Local Backend Setup

1. **Create Virtual Environment**
   ```bash
   cd backend/
   python3 -m venv venv
   source venv/bin/activate  # on Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URL and DB name:
   MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/
   DB_NAME=thinktounlock_dev
   ```

4. **Run Server**
   ```bash
   uvicorn server:app --reload --port 8000
   # API docs: http://localhost:8000/docs
   ```

5. **Lint & Format**
   ```bash
   black .
   isort .
   flake8 .
   mypy . --strict
   ```

### Running Tests

#### Frontend
```bash
# (Jest config TBD; placeholder)
npm test  # once test suite is added
```

#### Backend
```bash
cd backend/
pytest -v  # verbose output
pytest --cov=app  # with coverage
```

---

## 🐛 Troubleshooting & Common Issues

### Frontend Issues

#### "Metro has encountered an error" or blank white screen
**Cause:** Module caching issue  
**Fix:**
```bash
npm start -- --reset-cache
# or kill Metro, delete ~/.expo/cache, restart
```

#### Ionicons not rendering (blank squares)
**Cause:** Font loading failed  
**Fix:**
- Ensure `useFonts` + `SplashScreen.preventAutoHideAsync()` in `_layout.tsx`
- For Expo Go iOS: update Expo app to latest version
- Fallback: use custom Icon component (emoji-based, no font needed)

#### AsyncStorage data not persisting
**Cause:** Storage key mismatch or wrong schema  
**Fix:**
- Verify key is exactly `thinktounlock:v1`
- Check device storage: may be cleared on app reinstall
- Use `npx expo prebuild --clean` to rebuild native layer

#### App crashes on specific game
**Cause:** Logic error or missing dependency  
**Fix:**
- Check console output: `npm start` logs details
- Add try-catch in game component, log error with stack
- Test with simpler variant (e.g., reduce game difficulty)

---

### Backend Issues

#### "Cannot connect to MongoDB"
**Cause:** Wrong connection string or network issue  
**Fix:**
```bash
# Test connection directly:
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/thinktounlock_dev"

# Check env var:
echo $MONGO_URL
```

#### "Async runtime error" in FastAPI
**Cause:** Missing async/await on database call  
**Fix:**
```python
# Wrong:
result = db.collection.find_one()

# Correct (Motor async):
result = await db.collection.find_one()
```

#### Pydantic validation errors
**Cause:** Payload doesn't match model schema  
**Fix:**
- Check API docs at `http://localhost:8000/docs`
- Validate request payload structure
- Use `pydantic==2.6.4+` (explicit version in requirements.txt)

---

## 📊 Project Metrics & Health Checks

### Code Quality Dashboard
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| TypeScript strict mode | 100% | 100% | ✅ |
| ESLint pass rate | 100% | TBD | 📋 |
| Test coverage (frontend) | >70% | 0% (no tests yet) | 🚧 |
| Test coverage (backend) | >80% | 0% | 🚧 |
| Code duplication | <3% | TBD | 📋 |
| Accessibility (axe-core) | All pass | TBD | 📋 |

### Performance Benchmarks
| Aspect | Target | Current | Status |
|--------|--------|---------|--------|
| App startup time | <3s | ~2s (Expo Go) | ✅ |
| Game load time | <1s | ~0.5s | ✅ |
| Memory usage | <150MB | ~80–120MB | ✅ |
| Frame rate | 60 fps | ~55–58 fps | ⚠️ |
| Storage usage | <50MB | ~5–10MB | ✅ |

### Release Checklist
Before publishing v1.2, verify:
- [ ] All critical bugs fixed (0 P0, <5 P1)
- [ ] Test coverage >70% (frontend), >80% (backend)
- [ ] Performance benchmarks met
- [ ] Manual testing checklist 100% pass
- [ ] Accessibility (axe-core) all pass
- [ ] Security audit (OWASP Top 10) completed
- [ ] Privacy policy updated
- [ ] Release notes written
- [ ] Version bumped (package.json, PRD)
- [ ] Tag created in git: `v1.2.0`

---

## 📚 Key Files Reference

### Critical Configuration Files
- [tsconfig.json](frontend/tsconfig.json) — TypeScript compiler options
- [package.json](frontend/package.json) — npm dependencies & scripts
- [eslint.config.js](frontend/eslint.config.js) — linting rules
- [app.json](frontend/app.json) — Expo app config (name, icon, version)
- [design_guidelines.json](design_guidelines.json) — theme colors & typography
- [requirements.txt](backend/requirements.txt) — Python dependencies

### Core Source Files
- [_layout.tsx](frontend/app/_layout.tsx) — Root navigator, font loading, splash screen
- [StateContext.tsx](frontend/src/store/StateContext.tsx) — Global state, all actions
- [storage.ts](frontend/src/store/storage.ts) — AsyncStorage schema, persist logic
- [AllGames.tsx](frontend/src/games/AllGames.tsx) — All 5 game implementations
- [theme.ts](frontend/src/theme.ts) — Colors, spacing, shadows
- [server.py](backend/server.py) — FastAPI routes

### Documentation
- [PRD.md](memory/PRD.md) — Product Requirements Doc (design, features, scoring)
- [README.md](frontend/README.md) — Expo project quickstart
- This file: [DEVELOPMENT_CHECKLIST.md](DEVELOPMENT_CHECKLIST.md) — Developer guide

---

## 🎓 Learning Resources

### React Native & Expo
- [Expo Documentation](https://docs.expo.dev) — official guide
- [React Native Docs](https://reactnative.dev) — core API reference
- [Expo Router Guide](https://docs.expo.dev/router/introduction/) — file-based routing

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) — official reference
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) — practical patterns

### FastAPI & Python
- [FastAPI Docs](https://fastapi.tiangolo.com/) — framework guide
- [Motor Documentation](https://motor.readthedocs.io/) — async MongoDB driver
- [Pydantic Docs](https://docs.pydantic.dev/) — validation & serialization

### UI/UX & Design
- [Material Design 3](https://m3.material.io/) — modern Android design system
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) — iOS best practices
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) — accessibility standards

---

## 📞 Support & Escalation

### Common Questions

**Q: How do I add a new game?**  
A: Implement in [AllGames.tsx](frontend/src/games/AllGames.tsx), export with type `GameProps { difficulty, onComplete }`. Add metadata to `games.ts`.

**Q: How do I add a new locked app?**  
A: Edit mock apps list in [mockApps.ts](frontend/src/data/mockApps.ts). For real app detection, implement native module in `AppManager.ts`.

**Q: How do I change the theme colors?**  
A: Edit [design_guidelines.json](design_guidelines.json) and [theme.ts](frontend/src/theme.ts). All components reference `colors` from theme.

**Q: How do I wire the backend?**  
A: Implement API endpoints in `server.py`, then update StateContext to call API instead of AsyncStorage for persistence. (Planned for v1.2)

**Q: What's the parent password default?**  
A: None; parent must set it on first app launch. Stored as bcrypt hash in AsyncStorage.

### When to Ask for Help
- **Bug in game logic?** Check [AllGames.tsx](frontend/src/games/AllGames.tsx), add logging, test in isolation
- **State not persisting?** Debug with React DevTools, check storage.ts persistence logic
- **API 500 error?** Check backend logs, verify MongoDB connection, check Pydantic model validation
- **UI not matching design?** Compare colors in [theme.ts](frontend/src/theme.ts) to [design_guidelines.json](design_guidelines.json)
- **TypeScript errors?** Run `tsc --noEmit` to check; check IDE for type hints

---

## 📅 Roadmap & Next Steps

### Q2 2026 (v1.2)
- [ ] Implement backend user accounts & cloud sync
- [ ] Real app locking (AccessibilityService)
- [ ] Daily auto top-up (premium)
- [ ] Challenge quotas (premium)
- [ ] Google Play Billing integration

### Q3 2026 (v1.3)
- [ ] Implement 10 additional games
- [ ] Leaderboard & multiplayer
- [ ] Web parental dashboard
- [ ] Advanced analytics

### Q4 2026+ (v2.0)
- [ ] iOS support (separate app or cross-platform)
- [ ] AI-powered game difficulty adaptation
- [ ] Social features (share achievements)
- [ ] Third-party integrations (Slack, Discord notifications)

---

## ✅ Sign-Off Checklist

**For AI Agents Reading This:**

Before starting work on this project, verify you understand:

- [ ] **Product Vision:** Why does ThinkToUnlock exist? (Answer: to help kids reduce doom-scrolling by gamifying time)
- [ ] **Tech Stack:** Frontend (React Native/Expo), Backend (FastAPI), Storage (AsyncStorage + MongoDB)
- [ ] **Project Structure:** app/ → frontend/ & backend/; frontend/app/ = routes, frontend/src/ = logic & components
- [ ] **5 Implemented Games:** Memory Match, Math Quiz, Word Scramble, Pattern Recall, Number Sequence
- [ ] **Key Features:** Time wallet, app locking, parent password, premium paywall (mock), game history
- [ ] **Data Model:** AsyncStorage schema with `thinktounlock:v1` key
- [ ] **Deferred Work:** Real app locking, Google Billing, cloud sync (all noted in "PENDING")
- [ ] **Coding Standards:** TypeScript strict, PEP 8 (backend), tests >70% coverage, accessibility required
- [ ] **Ethics:** User privacy, child safety, no dark patterns, honest difficulty
- [ ] **Where to Get Help:** Use file references in this doc (especially PRD.md, theme.ts, StateContext.tsx)

**Last Update:** May 15, 2026  
**Maintained By:** Development Team  
**Next Review Date:** When starting next feature sprint

---

*This document is the single source of truth for onboarding developers and AI agents. Keep it updated as the project evolves.*
