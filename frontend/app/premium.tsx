import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, Heading, Pill } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { colors } from '../src/theme';

export default function PremiumScreen() {
  const router = useRouter();
  const { state, setPremium } = useAppState();

  const passPayment = async () => {
    await setPremium(true);
    router.back();
  };

  const failPayment = () => {
    router.back();
  };

  if (state.isPremium) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 18 }}>
          <BackBtn onPress={() => router.back()} />
          <Pill label="PREMIUM" bg={colors.mint} style={{ marginTop: 14 }} />
          <Heading level={1} style={{ marginTop: 10 }}>YOU'RE A <Text style={{ color: colors.primary }}>PRO.</Text></Heading>
          <Text style={s.sub}>All premium features are unlocked.</Text>

          <BrutalCard style={{ marginTop: 16 }} bg={colors.yellow}>
            <Feature title="Daily Auto Top-Up" desc="Set default minutes per app — auto-added at midnight." />
            <Feature title="Min Daily Challenges" desc="Force a minimum number of brain games before any app opens." />
            <Feature title="Full History" desc="Track every game you've played." />
          </BrutalCard>

          <BrutalButton title="Cancel Premium (Test)" onPress={async () => { await setPremium(false); }} bg={colors.surface} fg={colors.black} full style={{ marginTop: 22 }} testID="premium-cancel-btn" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <BackBtn onPress={() => router.back()} />
        <Pill label="UPGRADE" bg={colors.primary} fg="#fff" style={{ marginTop: 14 }} />
        <Heading level={1} style={{ marginTop: 10 }}>GO <Text style={{ color: colors.primary }}>PREMIUM.</Text></Heading>
        <Text style={s.sub}>Unlock automation that keeps you on track without lifting a finger.</Text>

        <BrutalCard bg={colors.yellow} style={{ marginTop: 18 }}>
          <Feature title="Daily Auto Top-Up" desc="30 min Instagram, 10 min PUBG — auto-added every midnight." />
          <Feature title="Min Daily Challenges" desc="Phone won't unlock until N brain games are passed." />
          <Feature title="Smart Reminders" desc="Pre-lock notifications and streak tracking." />
        </BrutalCard>

        <BrutalCard style={{ marginTop: 16, alignItems: 'center' }} bg={colors.black}>
          <Text style={{ color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 12 }}>ONE-TIME</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 60, letterSpacing: -2 }}>$4.99</Text>
          </View>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Lifetime — no subscription.</Text>
        </BrutalCard>

        <View style={{ marginTop: 20 }}>
          <Text style={s.testNote}>TEST MODE: Google Billing not yet wired</Text>
          <BrutalButton
            title="Pass Payment (Unlock)"
            onPress={passPayment}
            bg={colors.mint}
            fg={colors.black}
            full
            style={{ marginTop: 10 }}
            testID="premium-pass-btn"
            icon={<Ionicons name="checkmark-circle" size={18} color={colors.black} />}
          />
          <BrutalButton
            title="Fail Payment (No Unlock)"
            onPress={failPayment}
            bg={colors.surface}
            fg={colors.black}
            full
            style={{ marginTop: 10 }}
            testID="premium-fail-btn"
            icon={<Ionicons name="close-circle" size={18} color={colors.black} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Feature: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 }}>
    <View style={{ width: 22, height: 22, borderWidth: 3, borderColor: colors.black, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2 }}>
      <Ionicons name="checkmark" size={14} color={colors.black} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontWeight: '900', color: colors.black, fontSize: 15 }}>{title}</Text>
      <Text style={{ fontWeight: '600', color: colors.black, fontSize: 13, marginTop: 2 }}>{desc}</Text>
    </View>
  </View>
);

const BackBtn: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} testID="premium-back-btn">
    <Ionicons name="arrow-back" size={20} color={colors.black} />
    <Text style={{ fontWeight: '900', letterSpacing: 1 }}>BACK</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  sub: { color: colors.black, fontWeight: '600', fontSize: 14, marginTop: 8, lineHeight: 20 },
  testNote: { color: colors.textMuted, fontWeight: '900', fontSize: 11, letterSpacing: 1, textAlign: 'center', marginBottom: 4 },
});
