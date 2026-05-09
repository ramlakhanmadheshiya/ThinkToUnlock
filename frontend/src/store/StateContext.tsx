import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import { AppState, AppCfg, FocusWindow, defaultState, loadState, saveState, HistoryEntry, todayStr, applySchedules, resetAll as wipeAll } from './storage';

type Ctx = {
  state: AppState;
  ready: boolean;
  setParentPassword: (pw: string) => Promise<void>;
  addWalletMinutes: (mins: number) => Promise<void>;
  consumeWalletMinutesToApp: (appId: string, mins: number) => Promise<boolean>;
  refundAppMinutesToWallet: (appId: string, mins: number) => Promise<void>;
  decrementAppPools: (appId: string, seconds: number) => Promise<void>;
  toggleAppLock: (appId: string, locked: boolean) => Promise<void>;
  setAppDaily: (appId: string, cfg: { minutes: number; hour: number; minute: number } | null) => Promise<void>;
  setAppWeekly: (appId: string, mins: number) => Promise<void>;
  setAppStrictFocus: (appId: string, on: boolean) => Promise<void>;
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
  const stateRef = useRef<AppState>(state);
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => { stateRef.current = state; }, [state]);

  const persist = useCallback(async (mutator: (cur: AppState) => AppState) => {
    const next = writeChainRef.current.then(async () => {
      const cur = stateRef.current;
      const updated = mutator(cur);
      stateRef.current = updated;
      setState(updated);
      await saveState(updated);
    });
    writeChainRef.current = next.catch(() => undefined);
    return next;
  }, []);

  const reload = useCallback(async () => {
    const s = await loadState();
    stateRef.current = s;
    setState(s);
    await saveState(s);
  }, []);

  useEffect(() => { (async () => { await reload(); setReady(true); })(); }, [reload]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') {
        // Re-apply schedules on foreground
        persist((cur) => applySchedules({ ...cur }));
      }
    });
    return () => sub.remove();
  }, [persist]);

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
      apps[appId] = { ...apps[appId], timeRemainingSec: apps[appId].timeRemainingSec + mins * 60 };
      return { ...cur, timeWalletMinutes: cur.timeWalletMinutes - mins, apps };
    });
    return true;
  }, [persist]);

  const refundAppMinutesToWallet = useCallback(async (appId: string, mins: number) => {
    // Refund only from wallet-derived pool — never from daily/weekly top-ups
    await persist((cur) => {
      const apps = { ...cur.apps };
      const have = Math.floor(apps[appId].timeRemainingSec / 60);
      const give = Math.min(have, mins);
      apps[appId] = { ...apps[appId], timeRemainingSec: apps[appId].timeRemainingSec - give * 60 };
      return { ...cur, timeWalletMinutes: cur.timeWalletMinutes + give, apps };
    });
  }, [persist]);

  // Deduct in priority order: wallet → daily → weekly
  const decrementAppPools = useCallback(async (appId: string, seconds: number) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
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
      apps[appId] = { ...apps[appId], locked };
      return { ...cur, apps };
    });
  }, [persist]);

  const setAppDaily = useCallback(async (appId: string, cfg: { minutes: number; hour: number; minute: number } | null) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
      apps[appId] = { ...apps[appId], daily: cfg ? { ...cfg, lastApplied: 0 } : null };
      return { ...cur, apps };
    });
  }, [persist]);

  const setAppWeekly = useCallback(async (appId: string, mins: number) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
      apps[appId] = { ...apps[appId], weeklyMinutes: mins };
      return { ...cur, apps };
    });
  }, [persist]);

  const setAppStrictFocus = useCallback(async (appId: string, on: boolean) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
      apps[appId] = { ...apps[appId], isStrictFocus: on };
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
    await persist((cur) => applySchedules({ ...cur, isPremium: premium }));
  }, [persist]);

  const setMinDailyChallenges = useCallback(async (n: number) => { await persist((cur) => ({ ...cur, minDailyChallenges: n })); }, [persist]);
  const setPassRate = useCallback(async (pct: number) => { await persist((cur) => ({ ...cur, passRatePercent: Math.max(50, Math.min(95, pct)) })); }, [persist]);
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
      state, ready, setParentPassword, addWalletMinutes,
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
