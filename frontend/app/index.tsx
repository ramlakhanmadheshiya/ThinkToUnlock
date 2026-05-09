import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppState } from '../src/store/StateContext';
import { colors } from '../src/theme';

export default function Index() {
  const router = useRouter();
  const { ready, state } = useAppState();

  useEffect(() => {
    if (!ready) return;
    if (!state.parentPassword) {
      router.replace('/setup-password');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [ready, state.parentPassword, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ fontWeight: '900', fontSize: 32, color: colors.black, letterSpacing: -1 }}>THINK<Text style={{ color: colors.primary }}>2</Text>UNLOCK</Text>
      <ActivityIndicator color={colors.black} style={{ marginTop: 24 }} />
    </View>
  );
}
