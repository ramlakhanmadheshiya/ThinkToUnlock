import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../src/components/Icon';
import { ManagerHeader } from '../src/components/ManagerHeader';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { MOCK_APPS } from '../src/data/mockApps';
import { colors, shadow, radius } from '../src/theme';

export default function PremiumWeekly() {
  const { state, setAppWeekly } = useAppState();
  const [edit, setEdit] = useState<string | null>(null);
  const [val, setVal] = useState('');

  const open = (id: string) => { setEdit(id); setVal(String(state.apps[id]?.weeklyMinutes || '')); };
  const save = async () => { if (!edit) return; await setAppWeekly(edit, parseInt(val || '0', 10) || 0); setEdit(null); };
  const remove = async () => { if (!edit) return; await setAppWeekly(edit, 0); setEdit(null); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <ManagerHeader title="Weekly Time Top-Up" subtitle="Bonus minutes auto-added every Saturday. Resets to 0 on Monday at 12 AM. Only available on weekends." />

        <BrutalCard style={{ marginTop: 16, backgroundColor: colors.premiumSoft }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="calendar-outline" size={22} color={colors.premium} />
            <Text style={{ fontWeight: '600', color: colors.text, fontSize: 13, flex: 1, lineHeight: 19 }}>
              Per-app weekend bonus. Treated as separate from wallet and daily top-up — depletes last in priority order.
            </Text>
          </View>
        </BrutalCard>

        <Text style={s.section}>All Apps</Text>

        {MOCK_APPS.map((app) => {
          const m = state.apps[app.id]?.weeklyMinutes || 0;
          return (
            <TouchableOpacity key={app.id} testID={`weekly-row-${app.id}`} activeOpacity={0.7} onPress={() => open(app.id)} style={[s.row, shadow.card]}>
              <View style={[s.icon, { backgroundColor: app.color + '22' }]}><Text style={{ fontSize: 22 }}>{app.icon}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.name}>{app.name}</Text>
                <Text style={s.sub}>{m > 0 ? `+${m} min on weekends` : 'Not set'}</Text>
              </View>
              {m > 0 ? <Ionicons name="calendar" size={20} color={colors.premium} /> : <Ionicons name="add-circle-outline" size={20} color={colors.textLight} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={!!edit} transparent animationType="fade" onRequestClose={() => setEdit(null)}>
        <TouchableWithoutFeedback onPress={() => setEdit(null)}>
          <View style={s.modalBg}>
            <TouchableWithoutFeedback>
              <View style={[s.modalCard, shadow.raised]}>
                <Heading level={2}>{edit ? MOCK_APPS.find(a => a.id === edit)?.name : ''}</Heading>
                <Text style={s.label}>Weekend minutes</Text>
                <BrutalInput value={val} onChangeText={setVal} keyboardType="number-pad" placeholder="e.g. 60" testID="weekly-input" />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <BrutalButton title="Remove" onPress={remove} variant="soft" bg={colors.errorSoft} fg={colors.error} style={{ flex: 1 }} testID="weekly-remove-btn" />
                  <BrutalButton title="Save" onPress={save} style={{ flex: 1 }} testID="weekly-save-btn" />
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
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
  row: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '600', fontSize: 15, color: colors.text },
  sub: { fontWeight: '500', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  label: { color: colors.text, fontWeight: '600', fontSize: 13, marginTop: 12, marginBottom: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 380 },
});
