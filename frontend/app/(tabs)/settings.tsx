import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, BrutalInput, Heading, Pill } from '../../src/components/Brutal';
import { useAppState } from '../../src/store/StateContext';
import { colors } from '../../src/theme';

export default function SettingsTab() {
  const router = useRouter();
  const { state, setParentPassword, resetAll, setMinDailyChallenges } = useAppState();
  const [showChange, setShowChange] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showMin, setShowMin] = useState(false);
  const [cur, setCur] = useState('');
  const [npw, setNpw] = useState('');
  const [npw2, setNpw2] = useState('');
  const [err, setErr] = useState('');
  const [resetPw, setResetPw] = useState('');
  const [minVal, setMinVal] = useState(String(state.minDailyChallenges));

  const submitChange = async () => {
    if (cur !== state.parentPassword) { setErr('Current password wrong'); return; }
    if (npw.length < 4) { setErr('Min 4 chars'); return; }
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <Pill label="SETTINGS" bg={colors.black} fg="#fff" />
        <Heading level={1} style={{ marginTop: 10 }}>CONTROL <Text style={{ color: colors.primary }}>PANEL</Text></Heading>

        <BrutalCard style={{ marginTop: 18 }} testID="settings-password-card">
          <Row icon="key" title="Change Parent Password" subtitle="Update your gate password" onPress={() => setShowChange(true)} testID="settings-change-pw-btn" />
        </BrutalCard>

        <BrutalCard style={{ marginTop: 14 }} bg={colors.yellow} testID="settings-premium-card">
          <Row
            icon="star"
            title={state.isPremium ? 'Premium Active' : 'Go Premium'}
            subtitle={state.isPremium ? 'All features unlocked' : 'Daily auto top-up + challenge minimums'}
            onPress={() => router.push('/premium')}
            testID="settings-premium-btn"
            iconBg={colors.primary}
            iconFg="#fff"
          />
        </BrutalCard>

        <BrutalCard style={{ marginTop: 14 }} testID="settings-minchal-card">
          <Row
            icon="trophy"
            title={`Min Challenges Per Day: ${state.minDailyChallenges}`}
            subtitle={state.isPremium ? 'Tap to set' : 'Premium only'}
            onPress={() => state.isPremium ? setShowMin(true) : router.push('/premium')}
            testID="settings-min-challenges-btn"
          />
        </BrutalCard>

        <BrutalCard style={{ marginTop: 14 }} bg={colors.primary} testID="settings-reset-card">
          <Row
            icon="trash"
            title="Reset App"
            subtitle="Wipe all data, history, settings"
            onPress={() => setShowReset(true)}
            color="#fff"
            subColor="#fff"
            testID="settings-reset-btn"
            iconBg="#fff"
            iconFg={colors.primary}
          />
        </BrutalCard>

        <Text style={s.footer}>THINK2UNLOCK • v1.0</Text>
      </ScrollView>

      {/* Change password modal */}
      <Modal visible={showChange} transparent animationType="fade" onRequestClose={() => setShowChange(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalBg}>
            <BrutalCard style={{ width: '90%' }} testID="change-password-modal">
              <Heading level={2}>CHANGE PASSWORD</Heading>
              <Text style={s.label}>CURRENT</Text>
              <BrutalInput testID="change-current-input" value={cur} onChangeText={setCur} secureTextEntry placeholder="Current" />
              <Text style={s.label}>NEW</Text>
              <BrutalInput testID="change-new-input" value={npw} onChangeText={setNpw} secureTextEntry placeholder="New" />
              <Text style={s.label}>CONFIRM NEW</Text>
              <BrutalInput testID="change-confirm-input" value={npw2} onChangeText={setNpw2} secureTextEntry placeholder="Repeat" />
              {err ? <Text style={{ color: colors.primary, fontWeight: '900', marginTop: 8 }} testID="change-error">{err}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <BrutalButton title="Cancel" onPress={() => { setShowChange(false); setErr(''); }} bg={colors.surface} fg={colors.black} style={{ flex: 1 }} testID="change-cancel-btn" />
                <BrutalButton title="Update" onPress={submitChange} style={{ flex: 1 }} testID="change-submit-btn" />
              </View>
            </BrutalCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reset modal */}
      <Modal visible={showReset} transparent animationType="fade" onRequestClose={() => setShowReset(false)}>
        <View style={s.modalBg}>
          <BrutalCard bg={colors.background} style={{ width: '90%' }} testID="reset-modal">
            <Pill label="DANGER" bg={colors.primary} fg="#fff" />
            <Heading level={2} style={{ marginTop: 8 }}>RESET APP</Heading>
            <Text style={{ fontWeight: '700', color: colors.black, marginTop: 8 }}>
              This wipes all data: wallet, history, locked apps, password. Enter parent password to confirm.
            </Text>
            <BrutalInput
              testID="reset-password-input"
              value={resetPw}
              onChangeText={setResetPw}
              secureTextEntry
              placeholder="Parent password"
              style={{ marginTop: 12 }}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <BrutalButton title="Cancel" onPress={() => { setShowReset(false); setResetPw(''); }} bg={colors.surface} fg={colors.black} style={{ flex: 1 }} testID="reset-cancel-btn" />
              <BrutalButton title="Reset Now" onPress={submitReset} style={{ flex: 1 }} testID="reset-confirm-btn" />
            </View>
          </BrutalCard>
        </View>
      </Modal>

      {/* Min challenges modal */}
      <Modal visible={showMin} transparent animationType="fade" onRequestClose={() => setShowMin(false)}>
        <View style={s.modalBg}>
          <BrutalCard style={{ width: '88%' }} testID="min-challenges-modal">
            <Heading level={2}>MIN CHALLENGES</Heading>
            <Text style={{ fontWeight: '700', color: colors.black, marginTop: 6 }}>How many brain games must be completed daily before any locked app can open?</Text>
            <BrutalInput testID="min-challenges-input" value={minVal} onChangeText={setMinVal} keyboardType="number-pad" placeholder="0" style={{ marginTop: 12 }} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <BrutalButton title="Cancel" onPress={() => setShowMin(false)} bg={colors.surface} fg={colors.black} style={{ flex: 1 }} testID="min-cancel-btn" />
              <BrutalButton title="Save" onPress={async () => { await setMinDailyChallenges(parseInt(minVal || '0', 10) || 0); setShowMin(false); }} style={{ flex: 1 }} testID="min-save-btn" />
            </View>
          </BrutalCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Row: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  color?: string;
  subColor?: string;
  testID?: string;
  iconBg?: string;
  iconFg?: string;
}> = ({ icon, title, subtitle, onPress, color = colors.black, subColor = colors.textMuted, testID, iconBg = colors.yellow, iconFg = colors.black }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={[s.rowIcon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={20} color={iconFg} /></View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={{ color, fontWeight: '900', fontSize: 16 }}>{title}</Text>
      <Text style={{ color: subColor, fontWeight: '700', fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
    </View>
    <BrutalButton title="Open" onPress={onPress} small bg={color === '#fff' ? '#fff' : colors.black} fg={color === '#fff' ? colors.primary : '#fff'} testID={testID} />
  </View>
);

const s = StyleSheet.create({
  label: { color: colors.black, fontWeight: '900', fontSize: 12, letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  rowIcon: {
    width: 44, height: 44,
    borderWidth: 3, borderColor: colors.black,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: { textAlign: 'center', color: colors.textMuted, fontWeight: '900', marginTop: 30, letterSpacing: 2, fontSize: 11 },
});
