import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '../src/components/Icon';
import { BrutalButton, BrutalCard, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { colors, shadow, radius } from '../src/theme';

const FEATURES = [
  { icon: 'time-outline', title: 'Daily Time Top-Up', desc: 'Auto-deposits time into specific apps every day at a chosen hour. Treated as a separate allowance — wallet time depletes first.' },
  { icon: 'trophy-outline', title: 'Minimum Daily Quota', desc: 'Force N challenges before any locked app can open. With per-app exclude list (e.g. WhatsApp, Phone).' },
  { icon: 'school-outline', title: 'Strict Focus Mode', desc: 'Define no-unlock hours for chosen apps. Time earned during these hours stays in the wallet for later.' },
  { icon: 'speedometer-outline', title: 'Custom Pass Rates', desc: 'Raise required passing score for games from 60% up to 95%.' },
  { icon: 'calendar-outline', title: 'Weekly Time Top-Up', desc: 'Bonus time on Sat/Sun, auto-resets Monday at 12 AM.' },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { state, setPremium } = useAppState();

  const passPayment = async () => { await setPremium(true); router.back(); };
  const failPayment = () => { router.back(); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} testID="premium-back-btn" activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <View style={s.starIcon}><Ionicons name="star" size={32} color={colors.premium} /></View>
          <Heading level={1} style={{ marginTop: 16, textAlign: 'center' }}>{state.isPremium ? "You're Premium" : 'Go Premium'}</Heading>
          <Text style={s.sub}>{state.isPremium ? 'All five features unlocked. Manage them from Settings.' : 'Unlock five powerful tools that keep distractions in check on autopilot.'}</Text>
        </View>

        <Text style={s.section}>Premium features</Text>
        <BrutalCard style={{ marginTop: 8 }}>
          {FEATURES.map((f, i) => (
            <React.Fragment key={f.title}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 }}>
                <View style={s.featureIcon}><Ionicons name={f.icon} size={18} color={colors.premium} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>{f.title}</Text>
                  <Text style={{ fontWeight: '500', color: colors.textMuted, fontSize: 13, marginTop: 2, lineHeight: 19 }}>{f.desc}</Text>
                </View>
              </View>
              {i < FEATURES.length - 1 && <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 8 }} />}
            </React.Fragment>
          ))}
        </BrutalCard>

        {!state.isPremium ? (
          <>
            <View style={[s.priceCard, shadow.raised]}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 12, letterSpacing: 1 }}>ONE-TIME</Text>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 44, letterSpacing: -1, marginTop: 4 }}>$4.99</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '500', fontSize: 13 }}>Lifetime — no subscription.</Text>
            </View>

            <Text style={s.testNote}>Test mode — Google Billing not yet wired</Text>
            <BrutalButton title="Pass Payment (Unlock)" onPress={passPayment} full style={{ marginTop: 8 }} bg={colors.success} testID="premium-pass-btn"
              icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />} />
            <BrutalButton title="Fail Payment" onPress={failPayment} full style={{ marginTop: 10 }} variant="soft" bg={colors.surfaceAlt} fg={colors.text} testID="premium-fail-btn"
              icon={<Ionicons name="close-circle-outline" size={18} color={colors.text} />} />
          </>
        ) : (
          <BrutalButton title="Cancel Premium (test)" onPress={async () => { await setPremium(false); }} variant="soft" bg={colors.surfaceAlt} fg={colors.text} full style={{ marginTop: 18 }} testID="premium-cancel-btn" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  starIcon: { width: 76, height: 76, borderRadius: 22, backgroundColor: colors.premiumSoft, alignItems: 'center', justifyContent: 'center' },
  sub: { color: colors.textMuted, fontWeight: '500', fontSize: 14, marginTop: 8, lineHeight: 21, textAlign: 'center', paddingHorizontal: 20 },
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 26, marginBottom: 8 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.premiumSoft, alignItems: 'center', justifyContent: 'center' },
  priceCard: { backgroundColor: colors.premium, borderRadius: radius.xl, padding: 22, alignItems: 'center', marginTop: 18 },
  testNote: { color: colors.textLight, fontWeight: '500', fontSize: 12, textAlign: 'center', marginTop: 18, marginBottom: 6 },
});
