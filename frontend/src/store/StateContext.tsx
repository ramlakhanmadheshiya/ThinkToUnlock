import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import { AppState, AppCfg, FocusWindow, defaultState, loadState, saveState, HistoryEntry, todayStr, applySchedules, resetAll as wipeAll } from './storage';

import { getInstalledApps, setLockedApps, getConsumedSeconds, startBlockerService, AppInfo, setSmartRemindersEnabled } from '../native/AppManager';

type Ctx = {
  state: AppState;
  ready: boolean;
  installedApps: AppInfo[];
  settingsUnlocked: boolean;
  setSettingsUnlocked: (v: boolean) => void;
  setParentPassword: (pw: string) => Promise<void>;
  addWalletMinutes: (mins: number) => Promise<void>;
  consumeWalletMinutesToApp: (appId: string, mins: number) => Promise<boolean>;
  refundAppMinutesToWallet: (appId: string, mins: number) => Promise<void>;
  decrementAppPools: (appId: string, seconds: number) => Promise<void>;
  toggleAppLock: (appId: string, locked: boolean) => Promise<void>;
  setAppDaily: (appIds: string | string[], cfg: { minutes: number; hour: number; minute: number } | null) => Promise<void>;
  setAppWeekly: (appIds: string | string[], mins: number, days?: number[]) => Promise<void>;
  setAppStrictFocus: (appIds: string | string[], on: boolean) => Promise<void>;
  setFocusWindows: (windows: FocusWindow[]) => Promise<void>;
  setQuotaExcludeApps: (ids: string[]) => Promise<void>;
  recordHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => Promise<void>;
  incrementDailyChallenges: () => Promise<void>;
  setPremium: (premium: boolean) => Promise<void>;
  setMinDailyChallenges: (n: number) => Promise<void>;
  setPassRate: (pct: number) => Promise<void>;
  setSmartReminders: (on: boolean) => Promise<void>;
  resetAll: () => Promise<void>;
  reload: () => Promise<void>;
};

const StateContext = createContext<Ctx | null>(null);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState());
  const [ready, setReady] = useState(false);
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [settingsUnlocked, setSettingsUnlocked] = useState(false);
  const stateRef = useRef<AppState>(state);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appsRef = useRef<AppInfo[]>([]);

  useEffect(() => { stateRef.current = state; appsRef.current = installedApps; }, [state, installedApps]);

  const persist = useCallback(async (mutator: (cur: AppState) => AppState) => {
    setState((cur) => {
      const updated = mutator(cur);
      stateRef.current = updated;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveState(stateRef.current).catch(console.error);
      }, 200);
      return updated;
    });
  }, []);

  const syncTimers = useCallback(async () => {
    const consumed = await getConsumedSeconds();
    if (Object.keys(consumed).length > 0) {
      await persist((cur) => {
        const apps = { ...cur.apps };
        for (const [appId, secs] of Object.entries(consumed)) {
          if (!apps[appId]) continue;
          const a = { ...apps[appId] };
          let r = secs;
          const w1 = Math.min(a.timeRemainingSec, r); a.timeRemainingSec -= w1; r -= w1;
          if (r > 0) { const w2 = Math.min(a.dailyTopupSec, r); a.dailyTopupSec -= w2; r -= w2; }
          if (r > 0) { const w3 = Math.min(a.weeklyTopupSec, r); a.weeklyTopupSec -= w3; r -= w3; }
          apps[appId] = a;
        }
        return { ...cur, apps };
      });
    }
  }, [persist]);

  const reload = useCallback(async () => {
    const s = await loadState();
    stateRef.current = s;
    setState(s);
    await saveState(s);
    await syncTimers();
    try {
      const apps = await getInstalledApps();
      // Remove our own app from the list
      const filtered = apps.filter(a => a.id !== 'com.ramlakhan0001.frontend');
      setInstalledApps(filtered);
    } catch (err) {}
  }, [syncTimers]);

  useEffect(() => { (async () => { await reload(); setReady(true); })(); }, [reload]);

  const lastLockedRef = useRef('');
  useEffect(() => {
    if (!ready) return;

    const evaluate = () => {
      const activelyBlockedApps: Record<string, number> = {};
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      
      const quotaUnmet = state.minDailyChallenges > 0 && state.dailyChallengesCompleted < state.minDailyChallenges;
      
      const activeWindows = state.focusWindows.filter(w => {
         if (w.startMin <= w.endMin) return currentMin >= w.startMin && currentMin < w.endMin;
         return currentMin >= w.startMin || currentMin < w.endMin;
      });
      const inFocusWindow = (id: string) => activeWindows.some(w => w.lockedAppIds.includes(id));

      installedApps.forEach((app) => {
        const id = app.id;
        const cfg = state.apps[id] || { locked: false, timeRemainingSec: 0, dailyTopupSec: 0, weeklyTopupSec: 0 };
        let blockTime: number | null = null;
        
        if (inFocusWindow(id)) {
           blockTime = 0;
        } else if (quotaUnmet && !state.quotaExcludeApps.includes(id)) {
           blockTime = 0;
        } else if (cfg.locked) {
           blockTime = cfg.timeRemainingSec + cfg.dailyTopupSec + cfg.weeklyTopupSec;
        }

        if (blockTime !== null) {
           activelyBlockedApps[id] = blockTime;
        }
      });
      
      const json = JSON.stringify(activelyBlockedApps);
      if (json !== lastLockedRef.current) {
        lastLockedRef.current = json;
        setLockedApps(activelyBlockedApps);
        setSmartRemindersEnabled(state.smartRemindersEnabled);
        startBlockerService().catch(console.warn);
      }
    };

    evaluate();
    const t = setInterval(evaluate, 60000);
    return () => clearInterval(t);
  }, [state, ready]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', async (s) => {
      if (s === 'active') {
        await syncTimers();
        // Re-apply schedules on foreground
        persist((cur) => applySchedules({ ...cur }));
      } else if (s === 'background' || s === 'inactive') {
        setSettingsUnlocked(false);
      }
    });
    return () => sub.remove();
  }, [syncTimers, persist]);

  const setParentPassword = useCallback(async (pw: string) => {
    await persist((cur) => ({ ...cur, parentPassword: pw }));
  }, [persist]);

  const addWalletMinutes = useCallback(async (mins: number) => {
    await persist((cur) => ({ ...cur, timeWalletMinutes: cur.timeWalletMinutes + mins }));
  }, [persist]);

  const consumeWalletMinutesToApp = useCallback(async (appId: string, mins: number): Promise<boolean> => {
    if (stateRef.current.timeWalletMinutes < mins) return false;
    await persist((cur) => {
      if (cur.timeWalletMinutes < mins) return cur;
      const apps = { ...cur.apps };
      const existing = apps[appId] || { locked: false, timeRemainingSec: 0, dailyTopupSec: 0, weeklyTopupSec: 0, isStrictFocus: false };
      apps[appId] = { ...existing, timeRemainingSec: existing.timeRemainingSec + mins * 60 };
      
      const item: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        gameId: 'wallet-add',
        gameName: appsRef.current.find(a => a.id === appId)?.name || appId,
        difficulty: 'Top-Up',
        minutesAdded: mins,
        passed: true,
        timestamp: Date.now()
      };

      return { ...cur, timeWalletMinutes: cur.timeWalletMinutes - mins, apps, history: [item, ...cur.history].slice(0, 200) };
    });
    return true;
  }, [persist]);

  const refundAppMinutesToWallet = useCallback(async (appId: string, mins: number) => {
    // Refund only from wallet-derived pool — never from daily/weekly top-ups
    await persist((cur) => {
      const apps = { ...cur.apps };
      if (!apps[appId]) return cur;
      const have = Math.floor(apps[appId].timeRemainingSec / 60);
      const give = Math.min(have, mins);
      if (give <= 0) return cur;
      apps[appId] = { ...apps[appId], timeRemainingSec: apps[appId].timeRemainingSec - give * 60 };

      const item: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        gameId: 'wallet-sub',
        gameName: appsRef.current.find(a => a.id === appId)?.name || appId,
        difficulty: 'Refund',
        minutesAdded: -give,
        passed: true,
        timestamp: Date.now()
      };

      return { ...cur, timeWalletMinutes: cur.timeWalletMinutes + give, apps, history: [item, ...cur.history].slice(0, 200) };
    });
  }, [persist]);

  // Deduct in priority order: wallet → daily → weekly
  const decrementAppPools = useCallback(async (appId: string, seconds: number) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
      if (!apps[appId]) return cur;
      const a = { ...apps[appId] };
      let r = seconds;
      const w1 = Math.min(a.timeRemainingSec, r); a.timeRemainingSec -= w1; r -= w1;
      if (r > 0) { const w2 = Math.min(a.dailyTopupSec, r); a.dailyTopupSec -= w2; r -= w2; }
      if (r > 0) { const w3 = Math.min(a.weeklyTopupSec, r); a.weeklyTopupSec -= w3; r -= w3; }
      apps[appId] = a;
      return { ...cur, apps };
    });
  }, [persist]);

  const toggleAppLock = useCallback(async (appId: string, locked: boolean) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
      const existing = apps[appId] || { locked: false, timeRemainingSec: 0, dailyTopupSec: 0, weeklyTopupSec: 0, isStrictFocus: false };
      apps[appId] = { ...existing, locked };
      return { ...cur, apps };
    });
  }, [persist]);

  const setAppDaily = useCallback(async (appIds: string | string[], cfg: { minutes: number; hour: number; minute: number } | null) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
      const ids = Array.isArray(appIds) ? appIds : [appIds];
      ids.forEach((id) => {
        const existing = apps[id] || { locked: false, timeRemainingSec: 0, dailyTopupSec: 0, weeklyTopupSec: 0, isStrictFocus: false };
        apps[id] = { ...existing, daily: cfg ? { ...cfg, lastApplied: 0 } : null };
      });
      return { ...cur, apps };
    });
  }, [persist]);

  const setAppWeekly = useCallback(async (appIds: string | string[], mins: number, days?: number[]) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
      const ids = Array.isArray(appIds) ? appIds : [appIds];
      ids.forEach((id) => {
        const existing = apps[id] || { locked: false, timeRemainingSec: 0, dailyTopupSec: 0, weeklyTopupSec: 0, isStrictFocus: false };
        apps[id] = { ...existing, weeklyMinutes: mins, weeklyDays: days || existing.weeklyDays || [0, 6] };
      });
      return { ...cur, apps };
    });
  }, [persist]);

  const setAppStrictFocus = useCallback(async (appIds: string | string[], on: boolean) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
      const ids = Array.isArray(appIds) ? appIds : [appIds];
      ids.forEach((id) => {
        const existing = apps[id] || { locked: false, timeRemainingSec: 0, dailyTopupSec: 0, weeklyTopupSec: 0, isStrictFocus: false };
        apps[id] = { ...existing, isStrictFocus: on };
      });
      return { ...cur, apps };
    });
  }, [persist]);

  const setFocusWindows = useCallback(async (windows: FocusWindow[]) => {
    await persist((cur) => ({ ...cur, focusWindows: windows }));
  }, [persist]);

  const setQuotaExcludeApps = useCallback(async (ids: string[]) => {
    await persist((cur) => ({ ...cur, quotaExcludeApps: ids }));
  }, [persist]);

  const recordHistory = useCallback(async (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    await persist((cur) => {
      const item: HistoryEntry = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, timestamp: Date.now() };
      return { ...cur, history: [item, ...cur.history].slice(0, 200) };
    });
  }, [persist]);

  const incrementDailyChallenges = useCallback(async () => {
    await persist((cur) => {
      const today = todayStr();
      const reset = cur.lastChallengeResetDate !== today;
      return { ...cur, dailyChallengesCompleted: (reset ? 0 : cur.dailyChallengesCompleted) + 1, lastChallengeResetDate: today };
    });
  }, [persist]);

  const setPremium = useCallback(async (premium: boolean) => {
    await persist((cur) => ({ ...cur, isPremium: premium }));
  }, [persist]);

  const setMinDailyChallenges = useCallback(async (n: number) => { await persist((cur) => ({ ...cur, minDailyChallenges: n })); }, [persist]);
  const setPassRate = useCallback(async (pct: number) => { await persist((cur) => ({ ...cur, passRatePercent: Math.max(5, Math.min(100, pct)) })); }, [persist]);
  const setSmartReminders = useCallback(async (on: boolean) => { await persist((cur) => ({ ...cur, smartRemindersEnabled: on })); }, [persist]);

  const resetAll = useCallback(async () => {
    await wipeAll();
    const fresh = defaultState();
    stateRef.current = fresh;
    setState(fresh);
    await saveState(fresh);
  }, []);

  return (
    <StateContext.Provider value={{
      state, ready, installedApps, settingsUnlocked, setSettingsUnlocked, setParentPassword, addWalletMinutes,
      consumeWalletMinutesToApp, refundAppMinutesToWallet, decrementAppPools,
      toggleAppLock, setAppDaily, setAppWeekly, setAppStrictFocus,
      setFocusWindows, setQuotaExcludeApps,
      recordHistory, incrementDailyChallenges, setPremium,
      setMinDailyChallenges, setPassRate, setSmartReminders,
      resetAll, reload,
    }}>
      {children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useAppState must be used within StateProvider');
  return ctx;
}
