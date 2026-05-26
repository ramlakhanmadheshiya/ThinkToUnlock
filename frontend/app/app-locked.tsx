import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, AppState as RNAppState, BackHandler, Modal, TouchableOpacity, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '../src/components/Icon';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';

import { getInstalledApps, unlockAppTemporarily } from '../src/native/AppManager';
import { colors, shadow, radius } from '../src/theme';

export default function AppLockedScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const { state, decrementAppPools } = useAppState();
  const [appName, setAppName] = useState(appId || 'Unknown App');
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentPw, setParentPw] = useState('');
  const [parentPwErr, setParentPwErr] = useState('');
  
  useEffect(() => {
    (async () => {
      if (appId) {
        const apps = await getInstalledApps();
        const found = apps.find(a => a.id === appId);
        if (found) setAppName(found.name);
      }
    })();
  }, [appId]);

  const handleParentUnlock = () => {
    if (parentPw === state.parentPassword) {
      setParentUnlocked(true);
      setShowParentModal(false);
      setParentPw('');
      setParentPwErr('');
      if (appId) {
        unlockAppTemporarily(appId);
      }
    } else {
      setParentPwErr('Wrong password');
    }
  };

  const initialSec =
    (state.apps[appId || '']?.timeRemainingSec || 0) +
    (state.apps[appId || '']?.dailyTopupSec || 0) +
    (state.apps[appId || '']?.weeklyTopupSec || 0);
  const [secLeft, setSecLeft] = useState<number>(initialSec);
  const [paused, setPaused] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warned30Ref = useRef(false);
  const startTimeRef = useRef<number>(Date.now());
  const startSecRef = useRef<number>(initialSec);
  const pausedAtRef = useRef<number | null>(null);
  const totalPausedRef = useRef<number>(0);

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const activeWindows = state.focusWindows.filter(w => {
     if (w.startMin <= w.endMin) return currentMin >= w.startMin && currentMin < w.endMin;
     return currentMin >= w.startMin || currentMin < w.endMin;
  });
  const fmtMin = (m: number) => {
    const h = Math.floor(m / 60), mn = m % 60;
    const ap = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12;
    return `${h12}:${String(mn).padStart(2, '0')} ${ap}`;
  };

  const activeFocusWindow = activeWindows.find(w => w.lockedAppIds.includes(appId || ''));
  const blockedByFocus = !!activeFocusWindow;

  const quotaUnmet = state.minDailyChallenges > 0 && state.dailyChallengesCompleted < state.minDailyChallenges;
  const isExcluded = state.quotaExcludeApps.includes(appId || '');
  const blockedByQuota = quotaUnmet && !isExcluded;

  const isActuallyLocked = secLeft <= 0 || blockedByFocus || blockedByQuota;

  // Timer uses wall-clock elapsed time to avoid drift from re-renders or setInterval inaccuracy.
  // The native AppBlockerService is the source of truth for actual time deduction.
  // This timer is display-only and persists consumed time only once when session ends.
  useEffect(() => {
    if (isActuallyLocked || !appId) return;

    startTimeRef.current = Date.now();
    startSecRef.current = secLeft;
    totalPausedRef.current = 0;
    pausedAtRef.current = null;

    timerRef.current = setInterval(() => {
      if (pausedAtRef.current !== null) return; // skip ticks while paused

      const activeMs = Date.now() - startTimeRef.current - totalPausedRef.current;
      const elapsed = Math.floor(activeMs / 1000);
      const next = Math.max(0, startSecRef.current - elapsed);
      setSecLeft(next);

      if (next <= 30 && next > 0 && !warned30Ref.current) {
        setShowWarning(true);
        warned30Ref.current = true;
        setTimeout(() => setShowWarning(false), 5000);
      }
      if (next === 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        // Persist total consumed time once at end of session
        decrementAppPools(appId, startSecRef.current);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Persist consumed time when leaving screen
      const activeMs = Date.now() - startTimeRef.current - totalPausedRef.current;
      const elapsed = Math.floor(activeMs / 1000);
      if (elapsed > 0 && appId) {
        decrementAppPools(appId, Math.min(elapsed, startSecRef.current));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  // Pause/resume based on AppState (background, inactive, or floating window losing focus)
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        if (pausedAtRef.current === null) {
          pausedAtRef.current = Date.now();
        }
        setPaused(true);
        setParentUnlocked(false);
      } else {
        if (pausedAtRef.current !== null) {
          totalPausedRef.current += Date.now() - pausedAtRef.current;
          pausedAtRef.current = null;
        }
        setPaused(false);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => !parentUnlocked);
    return () => sub.remove();
  }, [parentUnlocked]);

  // Early return: if parent has unlocked, don't render lock screen at all
  if (parentUnlocked) {
    return null;
  }

  if (blockedByFocus && activeFocusWindow) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#A855F7' }} edges={['top']}>
        <View style={s.overlayWrap}>
          <TouchableOpacity onPress={() => setShowParentModal(true)} style={s.parentUnlockBtn} testID="focus-parent-unlock-btn">
            <Ionicons name="key" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Parent</Text>
          </TouchableOpacity>
          <View style={s.bigIconLight}>
            <Ionicons name="school-outline" size={64} color="#fff" />
          </View>
          <Heading level={1} style={{ color: '#fff', textAlign: 'center', marginTop: 22, fontSize: 36 }}>Strict Focus</Heading>
          <Text style={s.overlayText}>
            {appName} is blocked during your {activeFocusWindow.label} time.{'\n\n'}
            This app will be allowed to open at {fmtMin(activeFocusWindow.endMin)}.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 28, alignSelf: 'stretch' }}>
            <BrutalButton title="Home" onPress={() => router.replace('/(tabs)/home')} variant="ghost" fg="#fff" style={{ flex: 1, borderColor: 'rgba(255,255,255,0.3)' }} testID="locked-home-btn" />
          </View>
        </View>
        <Modal visible={showParentModal} transparent animationType="fade" onRequestClose={() => { setShowParentModal(false); setParentPw(''); setParentPwErr(''); }}>
          <TouchableWithoutFeedback onPress={() => { setShowParentModal(false); setParentPw(''); setParentPwErr(''); }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBg}>
              <TouchableWithoutFeedback>
                <View style={[s.modalCard, shadow.raised]}>
                  <Heading level={2}>Parent Unlock</Heading>
                  <Text style={s.label}>Enter parent password</Text>
                  <BrutalInput value={parentPw} onChangeText={(t) => { setParentPw(t); setParentPwErr(''); }} placeholder="••••" secureTextEntry autoCapitalize="none" error={!!parentPwErr} testID="parent-pw-input" />
                  {parentPwErr ? <Text style={s.err} testID="parent-pw-error">{parentPwErr}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <BrutalButton title="Cancel" onPress={() => { setShowParentModal(false); setParentPw(''); setParentPwErr(''); }} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="parent-cancel-btn" />
                    <BrutalButton title="Unlock" onPress={handleParentUnlock} style={{ flex: 1 }} testID="parent-unlock-btn" />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    );
  }

  if (blockedByQuota) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#EAB308' }} edges={['top']}>
        <View style={s.overlayWrap}>
          <TouchableOpacity onPress={() => setShowParentModal(true)} style={s.parentUnlockBtn} testID="quota-parent-unlock-btn">
            <Ionicons name="key" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Parent</Text>
          </TouchableOpacity>
          <View style={s.bigIconLight}>
            <Ionicons name="trophy-outline" size={64} color="#fff" />
          </View>
          <Heading level={1} style={{ color: '#fff', textAlign: 'center', marginTop: 22, fontSize: 36 }}>Minimum Daily Quota</Heading>
          <Text style={s.overlayText}>{appName} requires {state.minDailyChallenges - state.dailyChallengesCompleted} more challenge(s) to be passed today.</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 28, alignSelf: 'stretch' }}>
            <BrutalButton title="Play Games" onPress={() => router.replace('/(tabs)/games')} bg="#fff" fg="#EAB308" style={{ flex: 1 }} testID="locked-play-btn" />
            <BrutalButton title="Home" onPress={() => router.replace('/(tabs)/home')} variant="ghost" fg="#fff" style={{ flex: 1, borderColor: 'rgba(255,255,255,0.3)' }} testID="locked-home-btn" />
          </View>
        </View>
        <Modal visible={showParentModal} transparent animationType="fade" onRequestClose={() => { setShowParentModal(false); setParentPw(''); setParentPwErr(''); }}>
          <TouchableWithoutFeedback onPress={() => { setShowParentModal(false); setParentPw(''); setParentPwErr(''); }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBg}>
              <TouchableWithoutFeedback>
                <View style={[s.modalCard, shadow.raised]}>
                  <Heading level={2}>Parent Unlock</Heading>
                  <Text style={s.label}>Enter parent password</Text>
                  <BrutalInput value={parentPw} onChangeText={(t) => { setParentPw(t); setParentPwErr(''); }} placeholder="••••" secureTextEntry autoCapitalize="none" error={!!parentPwErr} testID="parent-pw-input" />
                  {parentPwErr ? <Text style={s.err} testID="parent-pw-error">{parentPwErr}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <BrutalButton title="Cancel" onPress={() => { setShowParentModal(false); setParentPw(''); setParentPwErr(''); }} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="parent-cancel-btn" />
                    <BrutalButton title="Unlock" onPress={handleParentUnlock} style={{ flex: 1 }} testID="parent-unlock-btn" />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    );
  }

  if (secLeft <= 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={['top']}>
        <View style={s.overlayWrap}>
          <TouchableOpacity onPress={() => setShowParentModal(true)} style={s.parentUnlockBtn} testID="timeout-parent-unlock-btn">
            <Ionicons name="key" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Parent</Text>
          </TouchableOpacity>
          <View style={s.bigIconLight}>
            <Ionicons name="lock-closed" size={64} color="#fff" />
          </View>
          <Heading level={1} style={{ color: '#fff', textAlign: 'center', marginTop: 22, fontSize: 36 }}>Time's up</Heading>
          <Text style={s.overlayText} testID="time-over-text">{appName} is locked. Earn time by playing a brain game.</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 28, alignSelf: 'stretch' }}>
            <BrutalButton title="Play Brain Game" onPress={() => router.replace('/(tabs)/games')} bg="#fff" fg={colors.primary} style={{ flex: 1 }} testID="locked-play-btn" />
            <BrutalButton title="Home" onPress={() => router.replace('/(tabs)/home')} variant="ghost" fg="#fff" style={{ flex: 1, borderColor: 'rgba(255,255,255,0.3)' }} testID="locked-home-btn" />
          </View>
        </View>
        <Modal visible={showParentModal} transparent animationType="fade" onRequestClose={() => { setShowParentModal(false); setParentPw(''); setParentPwErr(''); }}>
          <TouchableWithoutFeedback onPress={() => { setShowParentModal(false); setParentPw(''); setParentPwErr(''); }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBg}>
              <TouchableWithoutFeedback>
                <View style={[s.modalCard, shadow.raised]}>
                  <Heading level={2}>Parent Unlock</Heading>
                  <Text style={s.label}>Enter parent password</Text>
                  <BrutalInput value={parentPw} onChangeText={(t) => { setParentPw(t); setParentPwErr(''); }} placeholder="••••" secureTextEntry autoCapitalize="none" error={!!parentPwErr} testID="parent-pw-input" />
                  {parentPwErr ? <Text style={s.err} testID="parent-pw-error">{parentPwErr}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <BrutalButton title="Cancel" onPress={() => { setShowParentModal(false); setParentPw(''); setParentPwErr(''); }} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="parent-cancel-btn" />
                    <BrutalButton title="Unlock" onPress={handleParentUnlock} style={{ flex: 1 }} testID="parent-unlock-btn" />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    );
  }

  const m = Math.floor(secLeft / 60);
  const sc = secLeft % 60;
  const danger = secLeft <= 30;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ padding: 18 }}>
        <View style={s.statusRow}>
          <View style={[s.statusDot, paused && { backgroundColor: colors.warn }]} />
          <Text style={s.statusText}>{paused ? 'Paused — return to resume' : 'Active session'}</Text>
        </View>

        <View style={[s.appHero, shadow.card]}>
          <View style={[s.appIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="apps" size={48} color={colors.primary} />
          </View>
          <Heading level={1} style={{ marginTop: 14 }}>{appName}</Heading>
          <Text style={{ fontWeight: '500', color: colors.textMuted, marginTop: 4, fontSize: 13 }}>simulated foreground session</Text>
        </View>

        <BrutalCard style={[{ marginTop: 16, alignItems: 'center', backgroundColor: danger ? colors.error : colors.text }]}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 12, letterSpacing: 1 }}>TIME REMAINING</Text>
          <Text testID="countdown-text" style={{ color: '#fff', fontWeight: '700', fontSize: 70, letterSpacing: -2, marginTop: 6 }}>
            {String(m).padStart(2, '0')}:{String(sc).padStart(2, '0')}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 4, fontSize: 12 }}>countdown only on screen</Text>
        </BrutalCard>

        {showWarning && (
          <BrutalCard style={[{ marginTop: 14, backgroundColor: colors.warnSoft }]} testID="warning-banner-30">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="alert-circle" size={22} color={colors.warn} />
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13, flex: 1 }}>30 seconds left — app will lock soon</Text>
            </View>
          </BrutalCard>
        )}

        <BrutalButton title="Close & stop timer" onPress={() => router.replace('/(tabs)/home')} variant="soft" bg={colors.surfaceAlt} fg={colors.text} full style={{ marginTop: 18 }} testID="close-app-btn" />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { fontWeight: '600', fontSize: 12, color: colors.textMuted, letterSpacing: 0.3 },
  appHero: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, alignItems: 'center', marginTop: 14 },
  appIcon: { width: 100, height: 100, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  overlayWrap: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  overlayText: { color: '#fff', fontWeight: '500', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22, opacity: 0.9 },
  bigIconLight: { width: 120, height: 120, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  parentUnlockBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 320 },
  label: { color: colors.text, fontWeight: '600', fontSize: 13, marginTop: 12, marginBottom: 8 },
  err: { color: colors.error, fontWeight: '600', marginTop: 8, fontSize: 13 },
});
