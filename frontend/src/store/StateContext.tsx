import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import { AppState, defaultState, loadState, saveState, HistoryEntry, todayStr } from './storage';

type Ctx = {
  state: AppState;
  ready: boolean;
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
  // Ref always holds latest state — used by actions to avoid stale closures
  const stateRef = useRef<AppState>(state);
  // Serialize writes so concurrent calls don't race
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => { stateRef.current = state; }, [state]);

  const persist = useCallback(async (mutator: (cur: AppState) => AppState) => {
    // Chain writes
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

  useEffect(() => {
    (async () => {
      await reload();
      setReady(true);
    })();
  }, [reload]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') reload();
    });
    return () => sub.remove();
  }, [reload]);

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
    await persist((cur) => {
      const apps = { ...cur.apps };
      const have = Math.floor(apps[appId].timeRemainingSec / 60);
      const give = Math.min(have, mins);
      apps[appId] = { ...apps[appId], timeRemainingSec: apps[appId].timeRemainingSec - give * 60 };
      return { ...cur, timeWalletMinutes: cur.timeWalletMinutes + give, apps };
    });
  }, [persist]);

  const decrementAppSeconds = useCallback(async (appId: string, seconds: number): Promise<number> => {
    let result = 0;
    await persist((cur) => {
      const apps = { ...cur.apps };
      const cu = apps[appId].timeRemainingSec;
      const next = Math.max(0, cu - seconds);
      result = next;
      apps[appId] = { ...apps[appId], timeRemainingSec: next };
      return { ...cur, apps };
    });
    return result;
  }, [persist]);

  const toggleAppLock = useCallback(async (appId: string, locked: boolean) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
      apps[appId] = { ...apps[appId], locked };
      return { ...cur, apps };
    });
  }, [persist]);

  const setAppDailyDefault = useCallback(async (appId: string, mins: number) => {
    await persist((cur) => {
      const apps = { ...cur.apps };
      apps[appId] = { ...apps[appId], defaultDailyMinutes: mins };
      return { ...cur, apps };
    });
  }, [persist]);

  const recordHistory = useCallback(async (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    await persist((cur) => {
      const item: HistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
      };
      return { ...cur, history: [item, ...cur.history].slice(0, 200) };
    });
  }, [persist]);

  const incrementDailyChallenges = useCallback(async () => {
    await persist((cur) => {
      const today = todayStr();
      const reset = cur.lastChallengeResetDate !== today;
      return {
        ...cur,
        dailyChallengesCompleted: (reset ? 0 : cur.dailyChallengesCompleted) + 1,
        lastChallengeResetDate: today,
      };
    });
  }, [persist]);

  const setPremium = useCallback(async (premium: boolean) => {
    await persist((cur) => ({ ...cur, isPremium: premium }));
  }, [persist]);

  const setMinDailyChallenges = useCallback(async (n: number) => {
    await persist((cur) => ({ ...cur, minDailyChallenges: n }));
  }, [persist]);

  const resetAll = useCallback(async () => {
    await persist(() => defaultState());
  }, [persist]);

  return (
    <StateContext.Provider value={{
      state, ready, setParentPassword, addWalletMinutes,
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
