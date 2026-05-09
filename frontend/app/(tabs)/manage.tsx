import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, BrutalInput, Heading, Pill } from '../../src/components/Brutal';
import { useAppState } from '../../src/store/StateContext';
import { MOCK_APPS } from '../../src/data/mockApps';
import { colors, shadow } from '../../src/theme';

export default function ManageTab() {
  const router = useRouter();
  const { state, toggleAppLock, setAppDailyDefault } = useAppState();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [premiumApp, setPremiumApp] = useState<string | null>(null);
  const [premiumMins, setPremiumMins] = useState('');

  const tryUnlock = () => {
    if (pw === state.parentPassword) {
      setUnlocked(true);
      setErr('');
      setPw('');
    } else {
      setErr('Wrong password');
    }
  };

  if (!unlocked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
            <Pill label="LOCKED" bg={colors.primary} fg="#fff" />
            <Heading level={1} style={{ marginTop: 10 }}>PARENT GATE</Heading>
            <Text style={s.sub}>Enter parent password to manage app shielding.</Text>
            <BrutalCard style={{ marginTop: 16 }}>
              <Text style={s.label}>PARENT PASSWORD</Text>
              <BrutalInput
                testID="manage-password-input"
                value={pw}
                onChangeText={(t) => { setPw(t); setErr(''); }}
                placeholder="••••"
                secureTextEntry
                autoCapitalize="none"
              />
              {err ? <Text style={s.err} testID="manage-password-error">{err}</Text> : null}
              <BrutalButton title="Unlock" onPress={tryUnlock} full style={{ marginTop: 14 }} testID="manage-unlock-btn" />
            </BrutalCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <Pill label="MANAGE" bg={colors.black} fg="#fff" />
        <Heading level={1} style={{ marginTop: 10 }}>APP SHIELDING</Heading>
        <Text style={s.sub}>Lock distracting apps. Locked apps require time from your wallet.</Text>

        <BrutalCard bg={colors.yellow} style={{ marginTop: 16 }} testID="premium-banner">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>{state.isPremium ? 'PREMIUM ACTIVE' : 'PREMIUM FEATURE'}</Text>
              <Text style={{ fontWeight: '700', color: colors.black, marginTop: 4 }}>Daily auto-add time per app</Text>
            </View>
            <BrutalButton title={state.isPremium ? 'Manage' : 'Go Pro'} onPress={() => router.push('/premium')} bg={colors.primary} small testID="manage-premium-btn" />
          </View>
        </BrutalCard>

        <Heading level={2} style={{ marginTop: 22, marginBottom: 10 }}>ALL APPS</Heading>

        {MOCK_APPS.map((app) => {
          const cfg = state.apps[app.id];
          return (
            <View key={app.id} style={[s.row, shadow.sm]} testID={`manage-row-${app.id}`}>
              <View style={[s.icon, { backgroundColor: app.color }]}><Text style={{ fontSize: 22 }}>{app.icon}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.appName}>{app.name}</Text>
                <Text style={s.appSub}>
                  {cfg.locked ? 'LOCKED' : 'UNLOCKED'}
                  {state.isPremium && cfg.defaultDailyMinutes > 0 ? `  •  +${cfg.defaultDailyMinutes}m/day` : ''}
                </Text>
              </View>
              {state.isPremium && cfg.locked && (
                <TouchableOpacity
                  testID={`manage-daily-${app.id}`}
                  onPress={() => { setPremiumApp(app.id); setPremiumMins(String(cfg.defaultDailyMinutes || '')); }}
                  style={s.clockBtn}
                >
                  <Ionicons name="time" size={20} color={colors.black} />
                </TouchableOpacity>
              )}
              <Switch
                testID={`manage-toggle-${app.id}`}
                value={cfg.locked}
                onValueChange={(v) => toggleAppLock(app.id, v)}
                trackColor={{ false: colors.disabled, true: colors.primary }}
                thumbColor={colors.black}
              />
            </View>
          );
        })}

        <View style={{ height: 20 }} />
        <BrutalButton title="Lock Manage Tab" onPress={() => setUnlocked(false)} bg={colors.surface} fg={colors.black} full testID="manage-lock-btn" />
      </ScrollView>

      {/* Premium daily-time modal */}
      <Modal visible={!!premiumApp} transparent animationType="fade" onRequestClose={() => setPremiumApp(null)}>
        <View style={s.modalBg}>
          <BrutalCard style={{ width: '88%' }} testID="daily-default-modal">
            <Heading level={2}>DAILY TIME</Heading>
            <Text style={s.sub}>How many minutes to auto-add to {premiumApp ? MOCK_APPS.find(a => a.id === premiumApp)?.name : ''} every day at midnight?</Text>
            <BrutalInput
              testID="daily-default-input"
              value={premiumMins}
              onChangeText={setPremiumMins}
              keyboardType="number-pad"
              placeholder="0"
              style={{ marginTop: 12 }}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <BrutalButton title="Cancel" onPress={() => setPremiumApp(null)} bg={colors.surface} fg={colors.black} style={{ flex: 1 }} testID="daily-cancel-btn" />
              <BrutalButton title="Save" onPress={async () => {
                if (premiumApp) await setAppDailyDefault(premiumApp, parseInt(premiumMins || '0', 10) || 0);
                setPremiumApp(null);
              }} style={{ flex: 1 }} testID="daily-save-btn" />
            </View>
          </BrutalCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  sub: { color: colors.black, fontWeight: '600', fontSize: 14, marginTop: 8, lineHeight: 20 },
  label: { color: colors.black, fontWeight: '900', fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  err: { color: colors.primary, fontWeight: '900', marginTop: 8 },
  row: {
    backgroundColor: colors.surface,
    borderWidth: 4, borderColor: colors.black,
    padding: 10, flexDirection: 'row', alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    width: 44, height: 44,
    borderWidth: 3, borderColor: colors.black,
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontWeight: '900', fontSize: 15, color: colors.black },
  appSub: { fontWeight: '700', fontSize: 11, color: colors.textMuted, marginTop: 2, letterSpacing: 0.5 },
  clockBtn: {
    width: 36, height: 36,
    borderWidth: 3, borderColor: colors.black,
    backgroundColor: colors.yellow,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 18 },
});
