import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../src/components/Icon';
import { ManagerHeader } from '../src/components/ManagerHeader';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { MOCK_APPS } from '../src/data/mockApps';
import { colors, shadow, radius } from '../src/theme';

export default function PremiumQuota() {
  const { state, setMinDailyChallenges, setQuotaExcludeApps } = useAppState();
  const [showEdit, setShowEdit] = useState(false);
  const [val, setVal] = useState(String(state.minDailyChallenges));

  const toggleExclude = async (id: string) => {
    const cur = new Set(state.quotaExcludeApps);
    if (cur.has(id)) cur.delete(id); else cur.add(id);
    await setQuotaExcludeApps([...cur]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <ManagerHeader title="Minimum Daily Quota" subtitle="Force a minimum number of brain games before any locked app can open. Excluded apps bypass this gate." />

        <BrutalCard style={{ marginTop: 16, alignItems: 'center', backgroundColor: colors.premium }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 12, letterSpacing: 0.5 }}>QUOTA / DAY</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 60, letterSpacing: -2, lineHeight: 64, marginTop: 4 }} testID="quota-value">{state.minDailyChallenges}</Text>
          <BrutalButton title={state.minDailyChallenges === 0 ? 'Set quota' : 'Edit quota'} onPress={() => { setVal(String(state.minDailyChallenges)); setShowEdit(true); }} bg="#fff" fg={colors.premium} small testID="quota-edit-btn" style={{ marginTop: 8 }} />
        </BrutalCard>

        <Text style={s.section}>Excluded apps (always allowed)</Text>
        <Text style={s.helper}>Tap to toggle. These apps bypass the daily quota — useful for emergency calls or messaging.</Text>

        {MOCK_APPS.map((app) => {
          const isEx = state.quotaExcludeApps.includes(app.id);
          return (
            <View key={app.id} style={[s.row, shadow.card]} testID={`quota-row-${app.id}`}>
              <View style={[s.icon, { backgroundColor: app.color + '22' }]}><Text style={{ fontSize: 22 }}>{app.icon}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.name}>{app.name}</Text>
                <Text style={s.sub}>{isEx ? 'Excluded — always allowed' : 'Subject to quota'}</Text>
              </View>
              <Switch testID={`quota-toggle-${app.id}`} value={isEx} onValueChange={() => toggleExclude(app.id)} trackColor={{ false: colors.borderDark, true: colors.premium }} thumbColor={'#fff'} />
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showEdit} transparent animationType="fade" onRequestClose={() => setShowEdit(false)}>
        <TouchableWithoutFeedback onPress={() => setShowEdit(false)}>
          <View style={s.modalBg}>
            <TouchableWithoutFeedback>
              <View style={[s.modalCard, shadow.raised]}>
                <Heading level={2}>Daily quota</Heading>
                <Text style={s.label}>Number of challenges</Text>
                <BrutalInput value={val} onChangeText={setVal} keyboardType="number-pad" placeholder="e.g. 3" testID="quota-input" />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <BrutalButton title="Cancel" onPress={() => setShowEdit(false)} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="quota-cancel-btn" />
                  <BrutalButton title="Save" onPress={async () => { await setMinDailyChallenges(parseInt(val || '0', 10) || 0); setShowEdit(false); }} style={{ flex: 1 }} testID="quota-save-btn" />
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
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 22, marginBottom: 6 },
  helper: { color: colors.textMuted, fontSize: 12, marginBottom: 10, lineHeight: 17 },
  row: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '600', fontSize: 15, color: colors.text },
  sub: { fontWeight: '500', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  label: { color: colors.text, fontWeight: '600', fontSize: 13, marginTop: 12, marginBottom: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 380 },
});
