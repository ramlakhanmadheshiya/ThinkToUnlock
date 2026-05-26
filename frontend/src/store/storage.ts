import AsyncStorage from '@react-native-async-storage/async-storage';

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
  weeklyDays: number[];         // days of the week (0=Sun, 1=Mon, etc) to apply bonus
  isStrictFocus: boolean;       // legacy — use FocusWindow.lockedAppIds instead
};

export type FocusWindow = { id: string; startMin: number; endMin: number; label: string; lockedAppIds: string[] };

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
  difficulty: Difficulty | string;
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
  weeklyDays: [0, 6], // default Saturday & Sunday
  isStrictFocus: false,
});

export const defaultState = (): AppState => {
  return {
    parentPassword: null,
    timeWalletMinutes: 0,
    dailyChallengesCompleted: 0,
    lastChallengeResetDate: todayStr(),
    apps: {},
    history: [],
    isPremium: false,
    smartRemindersEnabled: true,
    passRatePercent: 60,
    minDailyChallenges: 0,
    quotaExcludeApps: [
      'com.android.phone',
      'com.android.server.telecom',
      'com.android.contacts',
      'com.android.mms',
      'com.samsung.android.dialer',
      'com.samsung.android.contacts',
      'com.samsung.android.messaging',
      'com.google.android.dialer',
      'com.google.android.contacts',
      'com.google.android.apps.messaging',
      'com.whatsapp',
      'org.telegram.messenger'
    ],
    focusWindows: [],
    lastWeeklyKey: '',
  };
};

// Apply scheduled top-ups & weekly bonus & week-end resets (mutates copy)
export function applySchedules(state: AppState): AppState {
  const now = new Date();
  const today = todayStr();
  let changed = false;
  let apps = state.apps;

  // Daily challenges reset
  if (state.lastChallengeResetDate !== today) {
    changed = true;
  }

  // Daily top-ups (premium)
  if (state.isPremium) {
    for (const id of Object.keys(apps)) {
      const a = apps[id];
      if (!a.daily) continue;
      const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), a.daily.hour, a.daily.minute, 0, 0).getTime();
      if (now.getTime() >= scheduled && a.daily.lastApplied < scheduled) {
        if (apps === state.apps) apps = { ...state.apps };
        apps[id] = { ...a, dailyTopupSec: a.daily.minutes * 60, daily: { ...a.daily, lastApplied: now.getTime() } };
        changed = true;
      }
    }
  }

  // Weekly top-up
  if (state.isPremium) {
    const todayDay = now.getDay();
    const wk = todayStr();
    if (state.lastWeeklyKey !== wk) {
      for (const id of Object.keys(apps)) {
        const a = apps[id];
        if (!a.weeklyMinutes || a.weeklyMinutes <= 0) continue; // skip apps with no weekly config
        const days = a.weeklyDays || [0, 6];
        const newVal = days.includes(todayDay) ? a.weeklyMinutes * 60 : 0;
        if (a.weeklyTopupSec !== newVal) {
          if (apps === state.apps) apps = { ...state.apps };
          apps[id] = { ...a, weeklyTopupSec: newVal };
          changed = true;
        }
      }
      changed = true; // lastWeeklyKey changes
    }
  }

  if (!changed) return state; // no changes — return same reference

  return {
    ...state,
    apps,
    dailyChallengesCompleted: state.lastChallengeResetDate !== today ? 0 : state.dailyChallengesCompleted,
    lastChallengeResetDate: today,
    lastWeeklyKey: state.isPremium ? todayStr() : state.lastWeeklyKey,
  };
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
  const m = minsOfDay();
  return state.focusWindows.some((w) => {
    // Only lock if app is in this specific window's list
    if (!w.lockedAppIds || !w.lockedAppIds.includes(appId)) return false;
    if (w.startMin <= w.endMin) return m >= w.startMin && m < w.endMin;
    // wrap past midnight
    return m >= w.startMin || m < w.endMin;
  });
};
