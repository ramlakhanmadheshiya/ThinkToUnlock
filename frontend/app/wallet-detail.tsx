import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { colors, shadow, radius } from '../src/theme';

export default function WalletDetail() {
  const router = useRouter();
  const { state } = useAppState();

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} testID="wallet-back-btn" activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>

        <View style={[s.walletHero, shadow.raised]}>
          <View style={s.walletGlow} />
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '500', fontSize: 13 }}>Time Wallet</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 60, letterSpacing: -2, lineHeight: 64 }}>{state.timeWalletMinutes}</Text>
            <Text style={{ color: '#fff', fontWeight: '500', fontSize: 18, marginLeft: 8, opacity: 0.85 }}>min</Text>
          </View>
        </View>

        <BrutalButton
          title="Add more time — Play Game"
          onPress={() => router.replace('/(tabs)/games')}
          full
          style={{ marginTop: 18 }}
          testID="wallet-add-time-btn"
          icon={<Ionicons name="flash" size={18} color="#fff" />}
        />

        <Text style={s.section}>History</Text>
        <Text style={s.sub}>Last 200 plays</Text>

        {state.history.length === 0 ? (
          <BrutalCard style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: '500', color: colors.textMuted }}>No history yet. Play your first brain game.</Text>
          </BrutalCard>
        ) : (
          state.history.map((h) => (
            <View key={h.id} style={[s.row, shadow.card]} testID={`history-row-${h.id}`}>
              <View style={[s.iconBox, { backgroundColor: h.passed ? colors.successSoft : colors.errorSoft }]}>
                <Ionicons name={h.passed ? 'checkmark' : 'close'} size={20} color={h.passed ? colors.success : colors.error} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>{h.gameName}</Text>
                <Text style={{ fontWeight: '500', color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {h.difficulty} · {h.passed ? `+${h.minutesAdded} min` : 'Failed'}
                </Text>
              </View>
              <Text style={{ fontWeight: '600', color: colors.textMuted, fontSize: 12 }}>{fmtTime(h.timestamp)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  walletHero: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 22, marginTop: 16, overflow: 'hidden' },
  walletGlow: { position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FF7A56', opacity: 0.6 },
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 26 },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    marginTop: 10,
  },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
