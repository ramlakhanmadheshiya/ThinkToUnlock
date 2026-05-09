import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_APPS } from '../data/mockApps';
import { Difficulty } from '../data/games';

const KEY = 'thinktounlock:v1';

export type AppState = {
  parentPassword: string | null;
  timeWalletMinutes: number;
  dailyChallengesCompleted: number;
  lastChallengeResetDate: string; // YYYY-MM-DD
  apps: Record<string, { locked: boolean; timeRemainingSec: number; defaultDailyMinutes: number }>;
  history: HistoryEntry[];
  isPremium: boolean;
  minDailyChallenges: number;
  lastDailyTopupDate: string;
};

export type HistoryEntry = {
  id: string;
  gameId: string;
  gameName: string;
  difficulty: Difficulty;
  minutesAdded: number;
  passed: boolean;
  timestamp: number; // ms epoch
};

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const defaultState = (): AppState => {
  const apps: AppState['apps'] = {};
  for (const a of MOCK_APPS) {
    // Default: social/distracting apps locked, others unlocked
    const lockedByDefault = ['instagram', 'tiktok', 'youtube', 'pubg', 'snapchat', 'reddit', 'twitter', 'netflix'].includes(a.id);
    apps[a.id] = { locked: lockedByDefault, timeRemainingSec: 0, defaultDailyMinutes: 0 };
  }
  return {
    parentPassword: null,
    timeWalletMinutes: 0,
    dailyChallengesCompleted: 0,
    lastChallengeResetDate: todayStr(),
    apps,
    history: [],
    isPremium: false,
    minDailyChallenges: 0,
    lastDailyTopupDate: '',
  };
};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    // Daily reset of challenges counter
    const today = todayStr();
    if (parsed.lastChallengeResetDate !== today) {
      parsed.dailyChallengesCompleted = 0;
      parsed.lastChallengeResetDate = today;
    }
    // Premium daily auto top-up at first launch of new day
    if (parsed.isPremium && parsed.lastDailyTopupDate !== today) {
      for (const id of Object.keys(parsed.apps)) {
        const cfg = parsed.apps[id];
        if (cfg.defaultDailyMinutes > 0) {
          cfg.timeRemainingSec += cfg.defaultDailyMinutes * 60;
        }
      }
      parsed.lastDailyTopupDate = today;
    }
    // Make sure all mock apps exist (in case list grows)
    for (const a of MOCK_APPS) {
      if (!parsed.apps[a.id]) {
        parsed.apps[a.id] = { locked: false, timeRemainingSec: 0, defaultDailyMinutes: 0 };
      }
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

export async function saveState(s: AppState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export async function resetAll(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
