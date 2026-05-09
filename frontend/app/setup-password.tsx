import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../src/components/Icon';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { colors } from '../src/theme';

export default function SetupPassword() {
  const router = useRouter();
  const { setParentPassword } = useAppState();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');

  const submit = async () => {
    if (pw.length < 4) { setErr('Min 4 characters'); return; }
    if (pw !== pw2) { setErr('Passwords do not match'); return; }
    await setParentPassword(pw);
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 36 }} keyboardShouldPersistTaps="handled">
          <View style={s.logoBox}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>
          <Heading level={1} style={{ marginTop: 18 }}>ThinkToUnlock</Heading>
          <Text style={s.sub}>Set a parent password. It controls which apps stay locked and gates the manage section.</Text>

          <BrutalCard style={{ marginTop: 22 }}>
            <Text style={s.label}>New parent password</Text>
            <BrutalInput
              testID="setup-password-input"
              value={pw}
              onChangeText={(t) => { setPw(t); setErr(''); }}
              placeholder="Min 4 characters"
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={[s.label, { marginTop: 14 }]}>Confirm password</Text>
            <BrutalInput
              testID="setup-password-confirm-input"
              value={pw2}
              onChangeText={(t) => { setPw2(t); setErr(''); }}
              placeholder="Repeat password"
              secureTextEntry
              autoCapitalize="none"
            />
            {err ? <Text style={s.err} testID="setup-password-error">{err}</Text> : null}
            <BrutalButton title="Set & Continue" onPress={submit} full style={{ marginTop: 18 }} testID="setup-password-submit-btn" />
          </BrutalCard>

          <Text style={s.note}>You can change it later in Settings.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  logoBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sub: { color: colors.textMuted, fontWeight: '500', marginTop: 10, fontSize: 15, lineHeight: 22 },
  label: { color: colors.text, fontWeight: '600', fontSize: 13, marginBottom: 8 },
  err: { color: colors.error, fontWeight: '600', marginTop: 10, fontSize: 13 },
  note: { color: colors.textLight, fontWeight: '500', marginTop: 22, textAlign: 'center', fontSize: 13 },
});
