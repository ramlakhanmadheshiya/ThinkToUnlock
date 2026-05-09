import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState as RNAppState } from 'react-native';
import { AppState, defaultState, loadState, saveState, HistoryEntry, todayStr } from './storage';

type Ctx = {
  state: AppState;
  ready: boolean;
  update: (patch: Partial<AppState>) => Promise<void>;
  setParentPassword: (pw: string) => Promise<void>;
  addWalletMinutes: (mins: number) => Promise<void>;
  consumeWalletMinutesToApp: (appId: string, mins: number) => Promise<boolean>;
  refundAppMinutesToWallet: (appId: string, mins: number) => Promise<void>;
  decrementAppSeconds: (appId: string, seconds: number) => Promise<number>;
  toggleAppLock: (appId: string, locked: boolean) => Promise<void>;
  setAppDailyDefault: (appId: string, mins: number) => Promise<void>;
  recordHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => Promise<void>;
  incrementDailyChallenges: () => Promise<void>;
  setPremium: (premium: boolean) => Promise<void>;
  setMinDailyChallenges: (n: number) => Promise<void>;
  resetAll: () => Promise<void>;
  reload: () => Promise<void>;
};

const StateContext = createContext<Ctx | null>(null);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState());
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const s = await loadState();
    setState(s);
    await saveState(s); // persist any auto-updates (daily reset, top-up)
  }, []);

  useEffect(() => {
    (async () => {
      await reload();
      setReady(true);
    })();
  }, [reload]);

  // Reload on app foreground (in case midnight passed)
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') reload();
    });
    return () => sub.remove();
  }, [reload]);

  const persist = useCallback(async (next: AppState) => {
    setState(next);
    await saveState(next);
  }, []);

  const update = useCallback(async (patch: Partial<AppState>) => {
    const next = { ...state, ...patch };
    await persist(next);
  }, [state, persist]);

  const setParentPassword = useCallback(async (pw: string) => {
    await persist({ ...state, parentPassword: pw });
  }, [state, persist]);

  const addWalletMinutes = useCallback(async (mins: number) => {
    await persist({ ...state, timeWalletMinutes: state.timeWalletMinutes + mins });
  }, [state, persist]);

  const consumeWalletMinutesToApp = useCallback(async (appId: string, mins: number) => {
    if (state.timeWalletMinutes < mins) return false;
    const apps = { ...state.apps };
    apps[appId] = { ...apps[appId], timeRemainingSec: apps[appId].timeRemainingSec + mins * 60 };
    await persist({ ...state, timeWalletMinutes: state.timeWalletMinutes - mins, apps });
    return true;
  }, [state, persist]);

  const refundAppMinutesToWallet = useCallback(async (appId: string, mins: number) => {
    const apps = { ...state.apps };
    const have = Math.floor(apps[appId].timeRemainingSec / 60);
    const give = Math.min(have, mins);
    apps[appId] = { ...apps[appId], timeRemainingSec: apps[appId].timeRemainingSec - give * 60 };
    await persist({ ...state, timeWalletMinutes: state.timeWalletMinutes + give, apps });
  }, [state, persist]);

  const decrementAppSeconds = useCallback(async (appId: string, seconds: number) => {
    const apps = { ...state.apps };
    const cur = apps[appId].timeRemainingSec;
    const next = Math.max(0, cur - seconds);
    apps[appId] = { ...apps[appId], timeRemainingSec: next };
    await persist({ ...state, apps });
    return next;
  }, [state, persist]);

  const toggleAppLock = useCallback(async (appId: string, locked: boolean) => {
    const apps = { ...state.apps };
    apps[appId] = { ...apps[appId], locked };
    await persist({ ...state, apps });
  }, [state, persist]);

  const setAppDailyDefault = useCallback(async (appId: string, mins: number) => {
    const apps = { ...state.apps };
    apps[appId] = { ...apps[appId], defaultDailyMinutes: mins };
    await persist({ ...state, apps });
  }, [state, persist]);

  const recordHistory = useCallback(async (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const item: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    const history = [item, ...state.history].slice(0, 200);
    await persist({ ...state, history });
  }, [state, persist]);

  const incrementDailyChallenges = useCallback(async () => {
    const today = todayStr();
    const reset = state.lastChallengeResetDate !== today;
    await persist({
      ...state,
      dailyChallengesCompleted: (reset ? 0 : state.dailyChallengesCompleted) + 1,
      lastChallengeResetDate: today,
    });
  }, [state, persist]);

  const setPremium = useCallback(async (premium: boolean) => {
    await persist({ ...state, isPremium: premium });
  }, [state, persist]);

  const setMinDailyChallenges = useCallback(async (n: number) => {
    await persist({ ...state, minDailyChallenges: n });
  }, [state, persist]);

  const resetAll = useCallback(async () => {
    const fresh = defaultState();
    await persist(fresh);
  }, [persist]);

  return (
    <StateContext.Provider value={{
      state, ready, update, setParentPassword, addWalletMinutes,
      consumeWalletMinutesToApp, refundAppMinutesToWallet, decrementAppSeconds,
      toggleAppLock, setAppDailyDefault, recordHistory, incrementDailyChallenges,
      setPremium, setMinDailyChallenges, resetAll, reload,
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
