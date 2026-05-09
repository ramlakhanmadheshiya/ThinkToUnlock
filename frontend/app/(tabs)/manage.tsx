import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../../src/components/Brutal';
import { useAppState } from '../../src/store/StateContext';
import { MOCK_APPS } from '../../src/data/mockApps';
import { colors, shadow, radius } from '../../src/theme';

export default function ManageTab() {
  const { state, toggleAppLock } = useAppState();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  useFocusEffect(useCallback(() => () => { setUnlocked(false); setPw(''); setErr(''); }, []));

  const tryUnlock = () => {
    if (pw === state.parentPassword) { setUnlocked(true); setErr(''); setPw(''); }
    else setErr('Wrong password');
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
              <BrutalInput testID="manage-password-input" value={pw} onChangeText={(t) => { setPw(t); setErr(''); }} placeholder="••••" secureTextEntry autoCapitalize="none" error={!!err} />
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
          <TouchableOpacity onPress={() => setUnlocked(false)} style={s.lockBtn} testID="manage-lock-btn" activeOpacity={0.7}>
            <Ionicons name="lock-closed" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={s.section}>All Apps</Text>

        {MOCK_APPS.map((app) => {
          const cfg = state.apps[app.id];
          return (
            <View key={app.id} style={[s.row, shadow.card]} testID={`manage-row-${app.id}`}>
              <View style={[s.icon, { backgroundColor: app.color + '22' }]}><Text style={{ fontSize: 22 }}>{app.icon}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.appName}>{app.name}</Text>
                <Text style={s.appSub}>{cfg.locked ? 'Locked' : 'Unlocked'}</Text>
              </View>
              <Switch testID={`manage-toggle-${app.id}`} value={cfg.locked} onValueChange={(v) => toggleAppLock(app.id, v)} trackColor={{ false: colors.borderDark, true: colors.primary }} thumbColor={'#fff'} />
            </View>
          );
        })}

        <Text style={s.tip}>💡 Premium features (daily top-up, focus mode, weekly bonus, etc.) have their own app managers in Settings → Premium.</Text>
      </ScrollView>
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
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  row: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appName: { fontWeight: '600', fontSize: 15, color: colors.text },
  appSub: { fontWeight: '500', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tip: { fontSize: 12, color: colors.textMuted, marginTop: 16, lineHeight: 18, fontStyle: 'italic', paddingHorizontal: 6 },
});
