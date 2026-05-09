import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, AppState as RNAppState, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, Heading, Pill } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { MOCK_APPS } from '../src/data/mockApps';
import { colors } from '../src/theme';

export default function AppLockedScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const { state, decrementAppSeconds } = useAppState();
  const app = MOCK_APPS.find((a) => a.id === appId);
  const [secLeft, setSecLeft] = useState<number>(state.apps[appId || '']?.timeRemainingSec || 0);
  const [paused, setPaused] = useState(false);
  const [warned30, setWarned30] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Foreground-only countdown (decrement every second, persist every 5s)
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
        if (appId) decrementAppSeconds(appId, 1);
        if (next === 0 && timerRef.current) clearInterval(timerRef.current);
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, appId, warned30, decrementAppSeconds]);

  // Pause on background; persist immediately
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      setPaused(s !== 'active');
    });
    return () => sub.remove();
  }, []);

  // Block hardware back to make user explicitly close
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

  // Time over — locked overlay
  if (secLeft <= 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={['top']}>
        <View style={s.overlayWrap}>
          <View style={[s.bigIcon, { backgroundColor: colors.background }]}>
            <Ionicons name="lock-closed" size={72} color={colors.black} />
          </View>
          <Heading level={1} style={{ color: '#fff', textAlign: 'center', marginTop: 18, fontSize: 44 }}>TIME OVER</Heading>
          <Text style={s.overlayText} testID="time-over-text">
            {app.name} is locked. Earn time or use Time Wallet to keep using.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 26, alignSelf: 'stretch' }}>
            <BrutalButton title="Play Brain Game" onPress={() => router.replace('/(tabs)/games')} bg={colors.yellow} fg={colors.black} style={{ flex: 1 }} testID="locked-play-btn" />
            <BrutalButton title="Home" onPress={() => router.replace('/(tabs)/home')} bg={colors.black} fg="#fff" style={{ flex: 1 }} testID="locked-home-btn" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const m = Math.floor(secLeft / 60);
  const sc = secLeft % 60;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pill label="USING APP" bg={colors.mint} />
          {paused && <Pill label="PAUSED" bg={colors.disabled} />}
        </View>

        <BrutalCard style={{ marginTop: 16, alignItems: 'center' }} bg={colors.surface}>
          <View style={[s.bigIcon, { backgroundColor: app.color, marginTop: 8 }]}>
            <Text style={{ fontSize: 64 }}>{app.icon}</Text>
          </View>
          <Heading level={1} style={{ marginTop: 14 }}>{app.name}</Heading>
          <Text style={{ fontWeight: '700', color: colors.textMuted, marginTop: 4 }}>simulated foreground</Text>
        </BrutalCard>

        <BrutalCard bg={colors.black} style={{ marginTop: 18, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 12 }}>TIME REMAINING</Text>
          <Text testID="countdown-text" style={{ color: secLeft <= 30 ? colors.primary : colors.yellow, fontWeight: '900', fontSize: 88, letterSpacing: -3, marginTop: 4 }}>
            {String(m).padStart(2, '0')}:{String(sc).padStart(2, '0')}
          </Text>
          <Text style={{ color: '#fff', fontWeight: '700', marginTop: 4 }}>countdown only when on screen</Text>
        </BrutalCard>

        {showWarning && (
          <BrutalCard bg={colors.primary} style={{ marginTop: 14 }} testID="warning-banner-30">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="alert-circle" size={26} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, flex: 1 }}>30 SECONDS LEFT — APP WILL LOCK SOON</Text>
            </View>
          </BrutalCard>
        )}

        <BrutalButton
          title="Close App (Stop Timer)"
          onPress={() => router.replace('/(tabs)/home')}
          bg={colors.surface}
          fg={colors.black}
          full
          style={{ marginTop: 18 }}
          testID="close-app-btn"
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  overlayWrap: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  overlayText: { color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center', marginTop: 14, lineHeight: 22 },
  bigIcon: {
    width: 140, height: 140,
    borderWidth: 4, borderColor: colors.black,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8,
  },
});
