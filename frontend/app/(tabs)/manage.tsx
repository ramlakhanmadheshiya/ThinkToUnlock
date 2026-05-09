import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Modal, KeyboardAvoidingView, Platform, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../../src/components/Brutal';
import { useAppState } from '../../src/store/StateContext';
import { MOCK_APPS } from '../../src/data/mockApps';
import { colors, shadow, radius } from '../../src/theme';

export default function ManageTab() {
  const router = useRouter();
  const { state, toggleAppLock, setAppDailyDefault } = useAppState();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [premiumApp, setPremiumApp] = useState<string | null>(null);
  const [premiumMins, setPremiumMins] = useState('');

  // Auto-lock when navigating away
  useFocusEffect(
    useCallback(() => {
      return () => {
        setUnlocked(false);
        setPw('');
        setErr('');
      };
    }, [])
  );

  const tryUnlock = () => {
    if (pw === state.parentPassword) {
      setUnlocked(true); setErr(''); setPw('');
    } else {
      setErr('Wrong password');
    }
  };

  if (!unlocked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 32 }} keyboardShouldPersistTaps="handled">
            <View style={s.gateIcon}><Ionicons name="lock-closed" size={28} color={colors.primary} /></View>
            <Heading level={1} style={{ marginTop: 18 }}>Parent Gate</Heading>
            <Text style={s.sub}>Enter the parent password to manage app shielding.</Text>
            <BrutalCard style={{ marginTop: 22 }}>
              <Text style={s.label}>Parent password</Text>
              <BrutalInput
                testID="manage-password-input"
                value={pw}
                onChangeText={(t) => { setPw(t); setErr(''); }}
                placeholder="••••"
                secureTextEntry
                autoCapitalize="none"
                error={!!err}
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
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <View style={{ flex: 1 }}>
            <Heading level={1}>App Shielding</Heading>
            <Text style={s.sub}>Lock distracting apps. Locked apps require time from your wallet.</Text>
          </View>
          <TouchableOpacity
            onPress={() => setUnlocked(false)}
            style={s.lockBtn}
            testID="manage-lock-btn"
            activeOpacity={0.7}
          >
            <Ionicons name="lock-closed" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {!state.isPremium && (
          <BrutalCard style={{ marginTop: 16 }} testID="premium-banner">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={s.starIcon}><Ionicons name="star" size={20} color={colors.premium} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.premTitle}>Daily auto-add time</Text>
                <Text style={s.premSub}>Set per-app daily limits — premium feature</Text>
              </View>
              <BrutalButton title="Go Pro" onPress={() => router.push('/premium')} small variant="soft" testID="manage-premium-btn" />
            </View>
          </BrutalCard>
        )}

        <Text style={s.section}>All Apps</Text>

        {MOCK_APPS.map((app) => {
          const cfg = state.apps[app.id];
          return (
            <View key={app.id} style={[s.row, shadow.card]} testID={`manage-row-${app.id}`}>
              <View style={[s.icon, { backgroundColor: app.color + '22' }]}><Text style={{ fontSize: 22 }}>{app.icon}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.appName}>{app.name}</Text>
                <Text style={s.appSub}>
                  {cfg.locked ? 'Locked' : 'Unlocked'}
                  {state.isPremium && cfg.defaultDailyMinutes > 0 ? ` • +${cfg.defaultDailyMinutes}m/day` : ''}
                </Text>
              </View>
              {state.isPremium && cfg.locked && (
                <TouchableOpacity
                  testID={`manage-daily-${app.id}`}
                  onPress={() => { setPremiumApp(app.id); setPremiumMins(String(cfg.defaultDailyMinutes || '')); }}
                  style={s.clockBtn}
                >
                  <Ionicons name="time-outline" size={18} color={colors.premium} />
                </TouchableOpacity>
              )}
              <Switch
                testID={`manage-toggle-${app.id}`}
                value={cfg.locked}
                onValueChange={(v) => toggleAppLock(app.id, v)}
                trackColor={{ false: colors.borderDark, true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Premium daily-time modal */}
      <Modal visible={!!premiumApp} transparent animationType="fade" onRequestClose={() => setPremiumApp(null)}>
        <TouchableWithoutFeedback onPress={() => setPremiumApp(null)}>
          <View style={s.modalBg}>
            <TouchableWithoutFeedback>
              <View style={[s.modalCard, shadow.raised]} testID="daily-default-modal">
                <Heading level={2}>Daily auto-time</Heading>
                <Text style={s.sub}>How many minutes to auto-add to {premiumApp ? MOCK_APPS.find(a => a.id === premiumApp)?.name : ''} every day at midnight?</Text>
                <BrutalInput
                  testID="daily-default-input"
                  value={premiumMins}
                  onChangeText={setPremiumMins}
                  keyboardType="number-pad"
                  placeholder="0"
                  style={{ marginTop: 14 }}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <BrutalButton title="Cancel" onPress={() => setPremiumApp(null)} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="daily-cancel-btn" />
                  <BrutalButton title="Save" onPress={async () => {
                    if (premiumApp) await setAppDailyDefault(premiumApp, parseInt(premiumMins || '0', 10) || 0);
                    setPremiumApp(null);
                  }} style={{ flex: 1 }} testID="daily-save-btn" />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  gateIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sub: { color: colors.textMuted, fontWeight: '500', fontSize: 14, marginTop: 6, lineHeight: 20 },
  label: { color: colors.text, fontWeight: '600', fontSize: 13, marginBottom: 8 },
  err: { color: colors.error, fontWeight: '600', marginTop: 8, fontSize: 13 },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  lockBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginTop: 4 },

  starIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.premiumSoft, alignItems: 'center', justifyContent: 'center' },
  premTitle: { fontWeight: '600', color: colors.text, fontSize: 14 },
  premSub: { fontWeight: '500', color: colors.textMuted, fontSize: 12, marginTop: 2 },

  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },

  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appName: { fontWeight: '600', fontSize: 15, color: colors.text },
  appSub: { fontWeight: '500', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  clockBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.premiumSoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },

  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 380 },
});
