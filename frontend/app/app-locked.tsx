import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, AppState as RNAppState, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '../src/components/Icon';
import { BrutalButton, BrutalCard, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { MOCK_APPS } from '../src/data/mockApps';
import { colors, shadow, radius } from '../src/theme';

export default function AppLockedScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const { state, decrementAppPools } = useAppState();
  const app = MOCK_APPS.find((a) => a.id === appId);
  const [secLeft, setSecLeft] = useState<number>(
    (state.apps[appId || '']?.timeRemainingSec || 0) +
    (state.apps[appId || '']?.dailyTopupSec || 0) +
    (state.apps[appId || '']?.weeklyTopupSec || 0)
  );
  const [paused, setPaused] = useState(false);
  const [warned30, setWarned30] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setSecLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 30 && !warned30) {
          setShowWarning(true);
          setWarned30(true);
          setTimeout(() => setShowWarning(false), 5000);
        }
        if (appId) decrementAppPools(appId, 1);
        if (next === 0 && timerRef.current) clearInterval(timerRef.current);
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, appId, warned30, decrementAppPools]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => setPaused(s !== 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => false);
    return () => sub.remove();
  }, []);

  if (!app) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 18 }}>
          <Text>App not found.</Text>
          <BrutalButton title="Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (secLeft <= 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={['top']}>
        <View style={s.overlayWrap}>
          <View style={s.bigIconLight}>
            <Ionicons name="lock-closed" size={64} color="#fff" />
          </View>
          <Heading level={1} style={{ color: '#fff', textAlign: 'center', marginTop: 22, fontSize: 36 }}>Time's up</Heading>
          <Text style={s.overlayText} testID="time-over-text">{app.name} is locked. Earn time by playing a brain game.</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 28, alignSelf: 'stretch' }}>
            <BrutalButton title="Play Brain Game" onPress={() => router.replace('/(tabs)/games')} bg="#fff" fg={colors.primary} style={{ flex: 1 }} testID="locked-play-btn" />
            <BrutalButton title="Home" onPress={() => router.replace('/(tabs)/home')} variant="ghost" fg="#fff" style={{ flex: 1, borderColor: 'rgba(255,255,255,0.3)' }} testID="locked-home-btn" />
          </View>
        </View>
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
          <View style={[s.appIcon, { backgroundColor: app.color + '22' }]}>
            <Text style={{ fontSize: 56 }}>{app.icon}</Text>
          </View>
          <Heading level={1} style={{ marginTop: 14 }}>{app.name}</Heading>
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
});
