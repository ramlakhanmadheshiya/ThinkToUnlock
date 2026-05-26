import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, KeyboardAvoidingView, Platform, TouchableOpacity, TouchableWithoutFeedback, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../../src/components/Brutal';
import { TabHeader } from '../../src/components/TabHeader';
import { useAppState } from '../../src/store/StateContext';
import { checkUsagePermission, requestUsagePermission, checkOverlayPermission, requestOverlayPermission } from '../../src/native/AppManager';
import { colors, shadow, radius } from '../../src/theme';

const PREMIUM_FEATURES: { id: string; route: string; icon: string; title: string; desc: string }[] = [
  { id: 'daily', route: '/premium-daily', icon: 'time-outline', title: 'Daily Time Top-Up', desc: 'Auto-deposit time into specific apps every day at a chosen hour. Treated as a separate allowance.' },
  { id: 'quota', route: '/premium-quota', icon: 'trophy-outline', title: 'Minimum Daily Quota', desc: 'Force N challenges before any locked app can open. With per-app exclude list (e.g. WhatsApp).' },
  { id: 'focus', route: '/premium-focus', icon: 'school-outline', title: 'Strict Focus Mode', desc: 'Define no-unlock hours. Time earned during these hours stays in the wallet for later.' },
  { id: 'pass', route: '/premium-pass-rate', icon: 'speedometer-outline', title: 'Custom Pass Rates', desc: 'Raise required passing score for games from 5% up to 100%.' },
  { id: 'weekly', route: '/premium-weekly', icon: 'calendar-outline', title: 'Weekly Time Top-Up', desc: 'Bonus time on Sat/Sun, auto-resets Monday 12 AM.' },
];

export default function SettingsTab() {
  const router = useRouter();
  const { state, setParentPassword, resetAll, setSmartReminders, settingsUnlocked, setSettingsUnlocked } = useAppState();
  const [gatePw, setGatePw] = useState('');
  const [gateErr, setGateErr] = useState('');
  const [showChange, setShowChange] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [cur, setCur] = useState('');
  const [npw, setNpw] = useState('');
  const [npw2, setNpw2] = useState('');
  const [err, setErr] = useState('');
  const [resetPw, setResetPw] = useState('');
  const [hasUsageAccess, setHasUsageAccess] = useState(false);
  const [hasOverlayAccess, setHasOverlayAccess] = useState(false);

  const segments = useSegments();

  useFocusEffect(useCallback(() => {
    checkUsagePermission().then(setHasUsageAccess).catch(console.warn);
    checkOverlayPermission().then(setHasOverlayAccess).catch(console.warn);
  }, []));

  useEffect(() => {
    // Lock settings only when navigating to a different tab, not when opening premium screens
    if (segments[0] === '(tabs)' && segments[1] !== 'settings') {
      setSettingsUnlocked(false);
    }
  }, [segments, setSettingsUnlocked]);

  useFocusEffect(useCallback(() => {
    // Only cleanup modals and gate error, but DO NOT lock on blur
    return () => {
      setGatePw(''); setGateErr('');
      setShowChange(false); setShowReset(false);
    };
  }, []));

  const tryUnlock = () => {
    if (gatePw === state.parentPassword) { setSettingsUnlocked(true); setGateErr(''); setGatePw(''); }
    else setGateErr('Wrong password');
  };

  const submitChange = async () => {
    if (cur !== state.parentPassword) { setErr('Current password is wrong'); return; }
    if (npw === cur) { setErr('New password cannot be the same as current password'); return; }
    if (npw.length < 4) { setErr('New password must be at least 4 characters'); return; }
    if (npw !== npw2) { setErr('New passwords do not match'); return; }
    await setParentPassword(npw);
    setShowChange(false); setCur(''); setNpw(''); setNpw2(''); setErr('');
    Alert.alert('Done', 'Password updated.');
  };

  const submitReset = async () => {
    if (resetPw !== state.parentPassword) { Alert.alert('Wrong password'); return; }
    await resetAll();
    setShowReset(false); setResetPw('');
    router.replace('/setup-password');
  };

  if (!settingsUnlocked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 32 }} keyboardShouldPersistTaps="handled">
            <TabHeader />
            <View style={s.gateIcon}><Ionicons name="lock-closed" size={28} color={colors.primary} /></View>
            <Heading level={1} style={{ marginTop: 18 }}>Settings Locked</Heading>
            <Text style={s.sub}>Enter the parent password to access settings.</Text>
            <BrutalCard style={{ marginTop: 22 }}>
              <Text style={s.label}>Parent password</Text>
              <BrutalInput testID="settings-password-input" value={gatePw} onChangeText={(t) => { setGatePw(t); setGateErr(''); }} placeholder="••••" secureTextEntry autoCapitalize="none" error={!!gateErr} />
              {gateErr ? <Text style={s.err} testID="settings-password-error">{gateErr}</Text> : null}
              <BrutalButton title="Unlock" onPress={tryUnlock} full style={{ marginTop: 14 }} testID="settings-unlock-btn" />
            </BrutalCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <TabHeader />
        <View style={s.titleRow}>
          <View style={{ flex: 1 }}>
            <Heading level={1}>Settings</Heading>
            <Text style={s.sub}>Manage password and app preferences.</Text>
          </View>
          <TouchableOpacity onPress={() => setSettingsUnlocked(false)} style={s.lockBtn} testID="settings-lock-btn" activeOpacity={0.7}>
            <Ionicons name="lock-closed" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={s.section}>Account</Text>
        <RowAction icon="key-outline" title="Change parent password" subtitle="Update the gate password" onPress={() => setShowChange(true)} testID="settings-change-pw-btn" />

        <Text style={s.section}>App Preferences</Text>



        <View style={[s.row, shadow.card]} testID="smart-reminders-row">
          <View style={s.rowIcon}><Ionicons name="notifications-outline" size={20} color={colors.text} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.rowTitle}>Smart Reminders</Text>
            <Text style={s.rowSub}>Pre-lock notification 30 sec before any app locks</Text>
          </View>
          <Switch testID="smart-reminders-toggle" value={state.smartRemindersEnabled} onValueChange={setSmartReminders} trackColor={{ false: colors.borderDark, true: colors.primary }} thumbColor={'#fff'} />
        </View>

        <View style={s.premBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="star" size={14} color={colors.premium} />
            <Text style={s.premLabel}>Premium Features</Text>
          </View>
          <Text style={s.premHint}>{state.isPremium ? 'Premium active — all features unlocked.' : 'Tap any feature to upgrade.'}</Text>
        </View>

        {PREMIUM_FEATURES.map((f) => {
          const go = () => {
            if (!state.isPremium) { router.push('/premium' as any); return; }
            router.push(f.route as any);
          };
          return (
            <TouchableOpacity
              key={f.id}
              testID={`premium-feature-${f.id}`}
              activeOpacity={0.7}
              onPress={go}
              style={[s.row, shadow.card]}
            >
              <View style={[s.rowIcon, { backgroundColor: colors.premiumSoft }]}>
                <Ionicons name={f.icon as any} size={20} color={colors.premium} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.rowTitle}>{f.title}</Text>
                  <Ionicons name="star" size={11} color={colors.premium} />
                </View>
                <Text style={s.rowSub} numberOfLines={2}>{f.desc}</Text>
              </View>
              {state.isPremium
                ? <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                : <Ionicons name="lock-closed" size={16} color={colors.premium} />}
            </TouchableOpacity>
          );
        })}

        {!state.isPremium && (
          <BrutalButton
            title="Upgrade to Premium"
            onPress={() => router.push('/premium')}
            full
            style={{ marginTop: 12 }}
            bg={colors.premium}
            testID="upgrade-premium-btn"
            icon={<Ionicons name="star" size={16} color="#fff" />}
          />
        )}

        <Text style={s.section}>Danger zone</Text>
        <RowAction icon="trash-outline" title="Reset app" subtitle="Wipe all data, history, and settings" onPress={() => setShowReset(true)} danger testID="settings-reset-btn" />

        <Text style={s.footer}>ThinkToUnlock · v1.2</Text>
      </ScrollView>

      {/* Change password modal */}
      <Modal visible={showChange} transparent animationType="fade" onRequestClose={() => setShowChange(false)}>
        <TouchableWithoutFeedback onPress={() => { setShowChange(false); setErr(''); }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.modalBg}>
              <TouchableWithoutFeedback>
                <View style={[s.modalCard, shadow.raised]} testID="change-password-modal">
                  <Heading level={2}>Change password</Heading>
                  <Text style={s.label}>Current</Text>
                  <BrutalInput testID="change-current-input" value={cur} onChangeText={(t) => { setCur(t); setErr(''); }} secureTextEntry placeholder="Current" error={!!err} />
                  <Text style={s.label}>New</Text>
                  <BrutalInput testID="change-new-input" value={npw} onChangeText={(t) => { setNpw(t); setErr(''); }} secureTextEntry placeholder="New password" />
                  <Text style={s.label}>Confirm new</Text>
                  <BrutalInput testID="change-confirm-input" value={npw2} onChangeText={(t) => { setNpw2(t); setErr(''); }} secureTextEntry placeholder="Repeat password" />
                  {err ? <Text style={s.err} testID="change-error">{err}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <BrutalButton title="Cancel" onPress={() => { setShowChange(false); setErr(''); }} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="change-cancel-btn" />
                    <BrutalButton title="Update" onPress={submitChange} style={{ flex: 1 }} testID="change-submit-btn" />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Reset modal */}
      <Modal visible={showReset} transparent animationType="fade" onRequestClose={() => setShowReset(false)}>
        <TouchableWithoutFeedback onPress={() => { setShowReset(false); setResetPw(''); }}>
          <View style={s.modalBg}>
            <TouchableWithoutFeedback>
              <View style={[s.modalCard, shadow.raised]} testID="reset-modal">
                <View style={s.dangerIcon}><Ionicons name="alert" size={22} color={colors.error} /></View>
                <Heading level={2} style={{ marginTop: 12 }}>Reset app</Heading>
                <Text style={s.sub}>This wipes all data: wallet, history, locked apps, password. Enter parent password to confirm.</Text>
                <BrutalInput testID="reset-password-input" value={resetPw} onChangeText={setResetPw} secureTextEntry placeholder="Parent password" style={{ marginTop: 14 }} />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <BrutalButton title="Cancel" onPress={() => { setShowReset(false); setResetPw(''); }} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="reset-cancel-btn" />
                  <BrutalButton title="Reset Now" onPress={submitReset} bg={colors.error} style={{ flex: 1 }} testID="reset-confirm-btn" />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const RowAction: React.FC<{
  icon: string; title: string; subtitle: string; onPress: () => void; danger?: boolean; testID?: string;
}> = ({ icon, title, subtitle, onPress, danger, testID }) => (
  <TouchableOpacity onPress={onPress} testID={testID} activeOpacity={0.7} style={[s.row, shadow.card]}>
    <View style={[s.rowIcon, danger && { backgroundColor: colors.errorSoft }]}>
      <Ionicons name={icon} size={20} color={danger ? colors.error : colors.text} />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={[s.rowTitle, danger && { color: colors.error }]}>{title}</Text>
      <Text style={s.rowSub}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
  </TouchableOpacity>
);

const s = StyleSheet.create({
  gateIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sub: { color: colors.textMuted, fontWeight: '500', fontSize: 14, marginTop: 6, lineHeight: 20 },
  label: { color: colors.text, fontWeight: '600', fontSize: 13, marginTop: 12, marginBottom: 8 },
  err: { color: colors.error, fontWeight: '600', marginTop: 8, fontSize: 13 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  lockBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  premBanner: { marginTop: 24, marginBottom: 8 },
  premLabel: { fontSize: 11, fontWeight: '700', color: colors.premium, letterSpacing: 1, textTransform: 'uppercase' },
  premHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, marginBottom: 10 },
  rowIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontWeight: '600', color: colors.text, fontSize: 14 },
  rowSub: { fontWeight: '500', color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 380 },
  dangerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.errorSoft, alignItems: 'center', justifyContent: 'center' },
  footer: { textAlign: 'center', color: colors.textLight, fontWeight: '500', marginTop: 30, fontSize: 11 },
});
