import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrutalButton, BrutalCard, BrutalInput, Heading, Pill } from '../src/components/Brutal';
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
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 36 }} keyboardShouldPersistTaps="handled">
          <Pill label="Welcome" bg={colors.primary} fg="#fff" testID="welcome-pill" />
          <Heading level={1} style={{ marginTop: 12 }}>THINK<Text style={{ color: colors.primary }}>2</Text>UNLOCK</Heading>
          <Text style={styles.sub}>Set a parent password. Required to manage which apps stay locked.</Text>

          <BrutalCard style={{ marginTop: 18 }}>
            <Text style={styles.label}>NEW PARENT PASSWORD</Text>
            <BrutalInput
              testID="setup-password-input"
              value={pw}
              onChangeText={(t) => { setPw(t); setErr(''); }}
              placeholder="Min 4 characters"
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={[styles.label, { marginTop: 14 }]}>CONFIRM PASSWORD</Text>
            <BrutalInput
              testID="setup-password-confirm-input"
              value={pw2}
              onChangeText={(t) => { setPw2(t); setErr(''); }}
              placeholder="Repeat"
              secureTextEntry
              autoCapitalize="none"
            />
            {err ? <Text style={styles.err} testID="setup-password-error">{err}</Text> : null}
            <BrutalButton title="Set & Continue" onPress={submit} full style={{ marginTop: 18 }} testID="setup-password-submit-btn" />
          </BrutalCard>

          <Text style={styles.note}>You can change it later in Settings.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.black, fontWeight: '600', marginTop: 14, fontSize: 15, lineHeight: 22 },
  label: { color: colors.black, fontWeight: '900', fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  err: { color: colors.primary, fontWeight: '900', marginTop: 10 },
  note: { color: colors.textMuted, fontWeight: '600', marginTop: 16, textAlign: 'center' },
});
