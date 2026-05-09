import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '../src/components/Icon';
import { useAppState } from '../src/store/StateContext';
import { colors } from '../src/theme';

export default function Index() {
  const router = useRouter();
  const { ready, state } = useAppState();

  useEffect(() => {
    if (!ready) return;
    if (!state.parentPassword) router.replace('/setup-password');
    else router.replace('/(tabs)/home');
  }, [ready, state.parentPassword, router]);

  return (
    <View style={s.wrap}>
      <View style={s.logoBox}><Ionicons name="shield-checkmark" size={32} color={colors.primary} /></View>
      <Text style={s.title}>ThinkToUnlock</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  logoBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 16, letterSpacing: -0.5 },
});
