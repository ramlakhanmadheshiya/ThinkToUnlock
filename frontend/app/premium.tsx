import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { colors, shadow, radius } from '../src/theme';

export default function PremiumScreen() {
  const router = useRouter();
  const { state, setPremium } = useAppState();

  const passPayment = async () => { await setPremium(true); router.back(); };
  const failPayment = () => { router.back(); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <BackBtn onPress={() => router.back()} />

        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <View style={s.starIcon}><Ionicons name="star" size={32} color={colors.premium} /></View>
          <Heading level={1} style={{ marginTop: 16, textAlign: 'center' }}>{state.isPremium ? "You're Premium" : 'Go Premium'}</Heading>
          <Text style={s.sub}>{state.isPremium ? 'All features unlocked. Thanks for supporting focus.' : 'Unlock automation that keeps you on track without lifting a finger.'}</Text>
        </View>

        <Text style={s.section}>Premium features</Text>

        <BrutalCard style={{ marginTop: 8 }}>
          <Feature icon="time-outline" title="Daily auto top-up" desc="30 min Instagram, 10 min PUBG — auto-added every midnight." />
          <Divider />
          <Feature icon="trophy-outline" title="Min daily challenges" desc="Phone won't unlock until N brain games are passed." />
          <Divider />
          <Feature icon="bar-chart-outline" title="Full play history" desc="Unlimited history with insights and streaks." />
          <Divider />
          <Feature icon="notifications-outline" title="Smart reminders" desc="Pre-lock notifications and weekly recaps." />
        </BrutalCard>

        {!state.isPremium ? (
          <>
            <View style={[s.priceCard, shadow.raised]}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 12, letterSpacing: 1 }}>ONE-TIME</Text>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 44, letterSpacing: -1, marginTop: 4 }}>$4.99</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '500', fontSize: 13 }}>Lifetime — no subscription.</Text>
            </View>

            <Text style={s.testNote}>Test mode — Google Billing not yet wired</Text>

            <BrutalButton
              title="Pass Payment (Unlock)"
              onPress={passPayment}
              full
              style={{ marginTop: 8 }}
              bg={colors.success}
              testID="premium-pass-btn"
              icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
            />
            <BrutalButton
              title="Fail Payment"
              onPress={failPayment}
              full
              style={{ marginTop: 10 }}
              variant="soft"
              bg={colors.surfaceAlt}
              fg={colors.text}
              testID="premium-fail-btn"
              icon={<Ionicons name="close-circle-outline" size={18} color={colors.text} />}
            />
          </>
        ) : (
          <BrutalButton title="Cancel Premium (test)" onPress={async () => { await setPremium(false); }} variant="soft" bg={colors.surfaceAlt} fg={colors.text} full style={{ marginTop: 18 }} testID="premium-cancel-btn" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const Feature: React.FC<{ icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }> = ({ icon, title, desc }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4 }}>
    <View style={s.featureIcon}><Ionicons name={icon} size={18} color={colors.premium} /></View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>{title}</Text>
      <Text style={{ fontWeight: '500', color: colors.textMuted, fontSize: 13, marginTop: 2, lineHeight: 19 }}>{desc}</Text>
    </View>
  </View>
);

const Divider = () => <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 10 }} />;

const BackBtn: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} testID="premium-back-btn" activeOpacity={0.7}>
    <Ionicons name="arrow-back" size={20} color={colors.text} />
    <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>Back</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  starIcon: { width: 76, height: 76, borderRadius: 22, backgroundColor: colors.premiumSoft, alignItems: 'center', justifyContent: 'center' },
  sub: { color: colors.textMuted, fontWeight: '500', fontSize: 14, marginTop: 8, lineHeight: 21, textAlign: 'center', paddingHorizontal: 20 },
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 26, marginBottom: 8 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.premiumSoft, alignItems: 'center', justifyContent: 'center' },
  priceCard: { backgroundColor: colors.premium, borderRadius: radius.xl, padding: 22, alignItems: 'center', marginTop: 18 },
  testNote: { color: colors.textLight, fontWeight: '500', fontSize: 12, textAlign: 'center', marginTop: 18, marginBottom: 6 },
});
