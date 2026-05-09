import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, Heading, Pill } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { colors } from '../src/theme';

export default function WalletDetail() {
  const router = useRouter();
  const { state } = useAppState();

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} testID="wallet-back-btn">
          <Ionicons name="arrow-back" size={20} color={colors.black} />
          <Text style={{ fontWeight: '900', letterSpacing: 1 }}>BACK</Text>
        </TouchableOpacity>

        <Pill label="TIME WALLET" bg={colors.primary} fg="#fff" style={{ marginTop: 14 }} />
        <Heading level={1} style={{ marginTop: 10 }}>{state.timeWalletMinutes} MIN</Heading>
        <Text style={{ color: colors.textMuted, fontWeight: '700', marginTop: 4 }}>available to spend</Text>

        <BrutalButton
          title="Add More Time → Play Game"
          onPress={() => router.replace('/(tabs)/games')}
          bg={colors.primary}
          full
          style={{ marginTop: 18 }}
          testID="wallet-add-time-btn"
          icon={<Ionicons name="flash" size={18} color="#fff" />}
        />

        <Heading level={2} style={{ marginTop: 26 }}>HISTORY</Heading>
        <Text style={{ color: colors.textMuted, fontWeight: '700', marginTop: 4 }}>Last 200 plays</Text>

        {state.history.length === 0 ? (
          <BrutalCard style={{ marginTop: 14 }}>
            <Text style={{ fontWeight: '700', color: colors.black }}>No history yet. Play your first brain game.</Text>
          </BrutalCard>
        ) : (
          state.history.map((h) => (
            <View key={h.id} style={s.row} testID={`history-row-${h.id}`}>
              <View style={[s.iconBox, { backgroundColor: h.passed ? colors.mint : colors.disabled }]}>
                <Ionicons name={h.passed ? 'checkmark' : 'close'} size={22} color={colors.black} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '900', color: colors.black, fontSize: 14 }}>{h.gameName}</Text>
                <Text style={{ fontWeight: '700', color: colors.textMuted, fontSize: 11, marginTop: 2, letterSpacing: 0.5 }}>
                  {h.difficulty.toUpperCase()} • {h.passed ? `+${h.minutesAdded} MIN` : 'FAILED'}
                </Text>
              </View>
              <Text style={{ fontWeight: '900', color: colors.black, fontSize: 12 }}>{fmtTime(h.timestamp)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 4, borderColor: colors.black,
    padding: 10, marginTop: 10,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  iconBox: {
    width: 42, height: 42,
    borderWidth: 3, borderColor: colors.black,
    alignItems: 'center', justifyContent: 'center',
  },
});
