import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ManagerHeader } from '../src/components/ManagerHeader';
import { BrutalButton, BrutalCard } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { colors, shadow, radius } from '../src/theme';

const PRESETS = [60, 70, 80, 90, 95];

export default function PremiumPassRate() {
  const { state, setPassRate } = useAppState();
  const [val, setVal] = useState(state.passRatePercent);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <ManagerHeader title="Custom Pass Rates" subtitle="Raise the score required to pass any brain game. The higher the rate, the more focus is required to earn time." />

        <BrutalCard style={[s.hero, { backgroundColor: colors.premium }]}>
          <Text style={s.heroLabel}>PASS RATE</Text>
          <Text style={s.heroNum} testID="pass-rate-value">{val}%</Text>
          <Text style={s.heroSub}>{val === state.passRatePercent ? 'currently active' : 'tap save'}</Text>
        </BrutalCard>

        <Text style={s.section}>Pick a preset</Text>
        <View style={s.presets}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p}
              testID={`preset-${p}`}
              activeOpacity={0.85}
              onPress={() => setVal(p)}
              style={[s.preset, shadow.card, val === p && { backgroundColor: colors.premiumSoft, borderColor: colors.premium }]}
            >
              <Text style={[s.presetTxt, val === p && { color: colors.premium }]}>{p}%</Text>
              <Text style={s.presetSub}>{p === 60 ? 'Easy' : p === 70 ? 'Standard' : p === 80 ? 'Strict' : p === 90 ? 'Tough' : 'Iron'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <BrutalButton title="Save Pass Rate" onPress={async () => { await setPassRate(val); }} full style={{ marginTop: 20 }} bg={colors.premium} testID="pass-rate-save-btn" />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 16 },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 12, letterSpacing: 1 },
  heroNum: { color: '#fff', fontWeight: '700', fontSize: 70, letterSpacing: -2, lineHeight: 76, marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontWeight: '500', fontSize: 13 },
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 22, marginBottom: 12 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  preset: { width: '31%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  presetTxt: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  presetSub: { fontSize: 11, fontWeight: '500', color: colors.textMuted, marginTop: 2 },
});
