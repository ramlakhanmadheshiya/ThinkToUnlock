import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ManagerHeader } from '../src/components/ManagerHeader';
import { BrutalButton, BrutalCard } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { colors, shadow, radius } from '../src/theme';

const PRESETS = [60, 70, 80, 90, 95];

export default function PremiumPassRate() {
  const { state, setPassRate } = useAppState();
  const [val, setVal] = useState(state.passRatePercent);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handlePan(evt.nativeEvent.pageX),
      onPanResponderMove: (evt) => handlePan(evt.nativeEvent.pageX),
    })
  ).current;

  const handlePan = (pageX: number) => {
    // ScrollView padding is 18, sliderContainer padding is 10. Start = 28.
    const startX = 28;
    const sliderWidth = Dimensions.get('window').width - 56;
    let percent = (pageX - startX) / sliderWidth;
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    let newValue = Math.round((percent * 95) + 5);
    newValue = Math.round(newValue / 5) * 5; // snap to 5
    if (newValue < 5) newValue = 5;
    if (newValue > 100) newValue = 100;
    setVal(newValue);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <ManagerHeader title="Custom Pass Rates" subtitle="Raise the score required to pass any brain game. The higher the rate, the more focus is required to earn time." />

        <BrutalCard style={[s.hero, { backgroundColor: colors.premium }]}>
          <Text style={s.heroLabel}>PASS RATE</Text>
          <Text style={s.heroNum} testID="pass-rate-value">{val}%</Text>
          <Text style={s.heroSub}>{val === state.passRatePercent ? 'currently active' : 'tap save'}</Text>
        </BrutalCard>

        <Text style={s.section}>Set custom rate</Text>
        <View style={s.sliderContainer} {...panResponder.panHandlers}>
          <View style={s.sliderTrack}>
            <View style={[s.sliderFill, { width: `${((val - 5) / 95) * 100}%` }]} />
          </View>
          <View style={[s.sliderThumb, { left: `${((val - 5) / 95) * 100}%` }]} />
        </View>
        <View style={s.sliderLabels}>
          <Text style={s.sliderLabel}>5%</Text>
          <Text style={s.sliderLabel}>50%</Text>
          <Text style={s.sliderLabel}>100%</Text>
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
  sliderContainer: { height: 40, justifyContent: 'center', marginTop: 10, paddingHorizontal: 10 },
  sliderTrack: { height: 8, backgroundColor: colors.borderDark, borderRadius: 4, width: '100%' },
  sliderFill: { height: '100%', backgroundColor: colors.premium, borderRadius: 4 },
  sliderThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', position: 'absolute', top: 8, marginLeft: -2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 8 },
  sliderLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
});
