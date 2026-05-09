import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_APPS } from '../data/mockApps';
import { Difficulty } from '../data/games';

const KEY = 'thinktounlock:v2';

export type DailyConfig = { minutes: number; hour: number; minute: number; lastApplied: number };

export type AppCfg = {
  locked: boolean;
  // Time pools (deduction priority: wallet → daily → weekly)
  timeRemainingSec: number;     // wallet-derived (user-controlled)
  dailyTopupSec: number;        // premium daily allowance
  weeklyTopupSec: number;       // premium weekend bonus
  // Configs
  defaultDailyMinutes: number;  // legacy compat — no longer primary
  daily: DailyConfig | null;    // per-app daily auto top-up schedule
  weeklyMinutes: number;        // weekend bonus minutes
  isStrictFocus: boolean;       // belongs to strict-focus pool
};

export type FocusWindow = { id: string; startMin: number; endMin: number; label: string };

export type AppState = {
  parentPassword: string | null;
  timeWalletMinutes: number;
  dailyChallengesCompleted: number;
  lastChallengeResetDate: string;
  apps: Record<string, AppCfg>;
  history: HistoryEntry[];
  isPremium: boolean;
  // Settings
  smartRemindersEnabled: boolean;
  // Premium config
  passRatePercent: number;          // 60..95
  minDailyChallenges: number;
  quotaExcludeApps: string[];        // app ids exempt from quota gate
  focusWindows: FocusWindow[];
  lastWeeklyKey: string;             // 'YYYY-WW' last weekend bonus applied
};

export type HistoryEntry = {
  id: string;
  gameId: string;
  gameName: string;
  difficulty: Difficulty;
  minutesAdded: number;
  passed: boolean;
  timestamp: number;
};

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ISO week key 'YYYY-WW'
export const weekKey = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const isWeekend = (d = new Date()) => {
  const day = d.getDay();
  return day === 0 || day === 6;
};

const defaultAppCfg = (locked: boolean): AppCfg => ({
  locked,
  timeRemainingSec: 0,
  dailyTopupSec: 0,
  weeklyTopupSec: 0,
  defaultDailyMinutes: 0,
  daily: null,
  weeklyMinutes: 0,
  isStrictFocus: false,
});

export const defaultState = (): AppState => {
  const apps: AppState['apps'] = {};
  for (const a of MOCK_APPS) {
    const lockedByDefault = ['instagram', 'tiktok', 'youtube', 'pubg', 'snapchat', 'reddit', 'twitter', 'netflix'].includes(a.id);
    apps[a.id] = defaultAppCfg(lockedByDefault);
  }
  return {
    parentPassword: null,
    timeWalletMinutes: 0,
    dailyChallengesCompleted: 0,
    lastChallengeResetDate: todayStr(),
    apps,
    history: [],
    isPremium: false,
    smartRemindersEnabled: true,
    passRatePercent: 60,
    minDailyChallenges: 0,
    quotaExcludeApps: ['whatsapp', 'telegram'],
    focusWindows: [],
    lastWeeklyKey: '',
  };
};

// Apply scheduled top-ups & weekly bonus & week-end resets (mutates copy)
export function applySchedules(state: AppState): AppState {
  const now = new Date();
  const today = todayStr();
  // Daily challenges reset
  if (state.lastChallengeResetDate !== today) {
    state.dailyChallengesCompleted = 0;
    state.lastChallengeResetDate = today;
  }

  // Daily top-ups (premium): for each app with a `daily` config, if scheduled time has passed
  // today and lastApplied is older than today's scheduled time, set dailyTopupSec = minutes*60.
  if (state.isPremium) {
    for (const id of Object.keys(state.apps)) {
      const a = state.apps[id];
      if (!a.daily) continue;
      const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), a.daily.hour, a.daily.minute, 0, 0).getTime();
      if (now.getTime() >= scheduled && a.daily.lastApplied < scheduled) {
        a.dailyTopupSec = a.daily.minutes * 60;
        a.daily.lastApplied = now.getTime();
      }
    }
  }

  // Weekly top-up: on Sat/Sun, if not yet applied this weekend → set weeklyTopupSec.
  // On Mon-Fri, reset weeklyTopupSec to 0 and clear lastWeeklyKey.
  if (state.isPremium) {
    if (isWeekend(now)) {
      const wk = weekKey(now);
      if (state.lastWeeklyKey !== wk) {
        for (const id of Object.keys(state.apps)) {
          const a = state.apps[id];
          if (a.weeklyMinutes > 0) a.weeklyTopupSec = a.weeklyMinutes * 60;
        }
        state.lastWeeklyKey = wk;
      }
    } else {
      for (const id of Object.keys(state.apps)) state.apps[id].weeklyTopupSec = 0;
      state.lastWeeklyKey = '';
    }
  }

  // Migrate any new mock apps
  for (const a of MOCK_APPS) {
    if (!state.apps[a.id]) state.apps[a.id] = defaultAppCfg(false);
  }
  return state;
}

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // Merge with defaults to handle new fields
    const merged: AppState = { ...defaultState(), ...parsed } as AppState;
    // Re-merge per-app to ensure all fields exist
    if (parsed.apps) {
      for (const id of Object.keys(parsed.apps)) {
        merged.apps[id] = { ...defaultAppCfg(false), ...parsed.apps[id] };
      }
    }
    return applySchedules(merged);
  } catch {
    return defaultState();
  }
}

export async function saveState(s: AppState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export async function resetAll(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
  await AsyncStorage.removeItem('thinktounlock:v1'); // clean old key
}

// Helpers for focus mode
export const minsOfDay = (d = new Date()) => d.getHours() * 60 + d.getMinutes();
export const inFocusWindow = (state: AppState, appId: string): boolean => {
  if (!state.isPremium) return false;
  if (!state.apps[appId]?.isStrictFocus) return false;
  const m = minsOfDay();
  return state.focusWindows.some((w) => {
    if (w.startMin <= w.endMin) return m >= w.startMin && m < w.endMin;
    // wrap past midnight
    return m >= w.startMin || m < w.endMin;
  });
};
