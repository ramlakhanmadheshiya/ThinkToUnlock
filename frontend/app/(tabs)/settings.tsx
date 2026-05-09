import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, KeyboardAvoidingView, Platform, TouchableOpacity, TouchableWithoutFeedback, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../../src/components/Brutal';
import { useAppState } from '../../src/store/StateContext';
import { colors, shadow, radius } from '../../src/theme';

export default function SettingsTab() {
  const router = useRouter();
  const { state, setParentPassword, resetAll, setMinDailyChallenges } = useAppState();
  const [unlocked, setUnlocked] = useState(false);
  const [gatePw, setGatePw] = useState('');
  const [gateErr, setGateErr] = useState('');

  const [showChange, setShowChange] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showMin, setShowMin] = useState(false);
  const [cur, setCur] = useState('');
  const [npw, setNpw] = useState('');
  const [npw2, setNpw2] = useState('');
  const [err, setErr] = useState('');
  const [resetPw, setResetPw] = useState('');
  const [minVal, setMinVal] = useState(String(state.minDailyChallenges));

  // Auto-lock when navigating away
  useFocusEffect(
    useCallback(() => {
      return () => {
        setUnlocked(false);
        setGatePw('');
        setGateErr('');
        setShowChange(false);
        setShowReset(false);
        setShowMin(false);
      };
    }, [])
  );

  const tryUnlock = () => {
    if (gatePw === state.parentPassword) {
      setUnlocked(true); setGateErr(''); setGatePw('');
    } else {
      setGateErr('Wrong password');
    }
  };

  const submitChange = async () => {
    if (cur !== state.parentPassword) { setErr('Current password is wrong'); return; }
    if (npw.length < 4) { setErr('New password must be at least 4 characters'); return; }
    if (npw !== npw2) { setErr('New passwords do not match'); return; }
    await setParentPassword(npw);
    setShowChange(false);
    setCur(''); setNpw(''); setNpw2(''); setErr('');
    Alert.alert('Done', 'Password updated.');
  };

  const submitReset = async () => {
    if (resetPw !== state.parentPassword) { Alert.alert('Wrong password'); return; }
    await resetAll();
    setShowReset(false);
    setResetPw('');
    router.replace('/setup-password');
  };

  if (!unlocked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 32 }} keyboardShouldPersistTaps="handled">
            <View style={s.gateIcon}><Ionicons name="lock-closed" size={28} color={colors.primary} /></View>
            <Heading level={1} style={{ marginTop: 18 }}>Settings Locked</Heading>
            <Text style={s.sub}>Enter the parent password to access settings.</Text>
            <BrutalCard style={{ marginTop: 22 }}>
              <Text style={s.label}>Parent password</Text>
              <BrutalInput
                testID="settings-password-input"
                value={gatePw}
                onChangeText={(t) => { setGatePw(t); setGateErr(''); }}
                placeholder="••••"
                secureTextEntry
                autoCapitalize="none"
                error={!!gateErr}
              />
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
        <View style={s.titleRow}>
          <View style={{ flex: 1 }}>
            <Heading level={1}>Settings</Heading>
            <Text style={s.sub}>Manage password and app preferences.</Text>
          </View>
          <TouchableOpacity onPress={() => setUnlocked(false)} style={s.lockBtn} testID="settings-lock-btn" activeOpacity={0.7}>
            <Ionicons name="lock-closed" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={s.section}>Account</Text>

        <Row
          icon="key-outline"
          title="Change parent password"
          subtitle="Update the gate password"
          onPress={() => setShowChange(true)}
          testID="settings-change-pw-btn"
        />

        {/* Premium subsection */}
        <Text style={s.section}>
          <Ionicons name="star" size={11} color={colors.premium} /> Premium Features
        </Text>
        <Text style={s.premHint}>{state.isPremium ? 'Premium active — all features unlocked.' : 'Tap any feature below to upgrade.'}</Text>

        <PremiumRow
          unlocked={state.isPremium}
          icon="time-outline"
          title="Daily auto top-up"
          subtitle="Auto-add time per app at midnight"
          onPress={() => router.push('/premium')}
          testID="premium-feature-daily"
        />
        <PremiumRow
          unlocked={state.isPremium}
          icon="trophy-outline"
          title={`Min challenges per day${state.isPremium ? `: ${state.minDailyChallenges}` : ''}`}
          subtitle={state.isPremium ? 'Tap to change' : 'Force a daily brain-game minimum'}
          onPress={() => state.isPremium ? setShowMin(true) : router.push('/premium')}
          testID="settings-min-challenges-btn"
        />
        <PremiumRow
          unlocked={state.isPremium}
          icon="bar-chart-outline"
          title="Full history"
          subtitle="Unlimited play history"
          onPress={() => router.push('/premium')}
          testID="premium-feature-history"
        />

        {!state.isPremium && (
          <BrutalButton
            title="Upgrade to Premium"
            onPress={() => router.push('/premium')}
            full
            style={{ marginTop: 16 }}
            bg={colors.premium}
            testID="upgrade-premium-btn"
            icon={<Ionicons name="star" size={16} color="#fff" />}
          />
        )}

        <Text style={s.section}>Danger zone</Text>

        <Row
          icon="trash-outline"
          title="Reset app"
          subtitle="Wipe all data, history, and settings"
          onPress={() => setShowReset(true)}
          danger
          testID="settings-reset-btn"
        />

        <Text style={s.footer}>ThinkToUnlock · v1.1</Text>
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

      {/* Min challenges modal */}
      <Modal visible={showMin} transparent animationType="fade" onRequestClose={() => setShowMin(false)}>
        <TouchableWithoutFeedback onPress={() => setShowMin(false)}>
          <View style={s.modalBg}>
            <TouchableWithoutFeedback>
              <View style={[s.modalCard, shadow.raised]} testID="min-challenges-modal">
                <Heading level={2}>Min challenges</Heading>
                <Text style={s.sub}>How many brain games must be completed daily before any locked app can open?</Text>
                <BrutalInput testID="min-challenges-input" value={minVal} onChangeText={setMinVal} keyboardType="number-pad" placeholder="0" style={{ marginTop: 14 }} />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <BrutalButton title="Cancel" onPress={() => setShowMin(false)} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="min-cancel-btn" />
                  <BrutalButton title="Save" onPress={async () => { await setMinDailyChallenges(parseInt(minVal || '0', 10) || 0); setShowMin(false); }} style={{ flex: 1 }} testID="min-save-btn" />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// ---- Row Components ----
const Row: React.FC<{
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
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

const PremiumRow: React.FC<{
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  unlocked: boolean;
  testID?: string;
}> = ({ icon, title, subtitle, onPress, unlocked, testID }) => (
  <TouchableOpacity onPress={onPress} testID={testID} activeOpacity={0.7} style={[s.row, shadow.card]}>
    <View style={[s.rowIcon, { backgroundColor: colors.premiumSoft }]}>
      <Ionicons name={icon} size={20} color={colors.premium} />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Ionicons name="star" size={11} color={colors.premium} />
      </View>
      <Text style={s.rowSub}>{subtitle}</Text>
    </View>
    {unlocked ? <Ionicons name="chevron-forward" size={18} color={colors.textLight} /> : <Ionicons name="lock-closed" size={16} color={colors.premium} />}
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
  premHint: { color: colors.textMuted, fontSize: 12, marginBottom: 10, marginTop: -4 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  rowIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontWeight: '600', color: colors.text, fontSize: 14 },
  rowSub: { fontWeight: '500', color: colors.textMuted, fontSize: 12, marginTop: 2 },

  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 380 },
  dangerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.errorSoft, alignItems: 'center', justifyContent: 'center' },

  footer: { textAlign: 'center', color: colors.textLight, fontWeight: '500', marginTop: 30, fontSize: 11 },
});
