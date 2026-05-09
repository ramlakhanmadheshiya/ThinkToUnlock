import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../src/components/Icon';
import { ManagerHeader } from '../src/components/ManagerHeader';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { MOCK_APPS } from '../src/data/mockApps';
import { colors, shadow, radius } from '../src/theme';

export default function PremiumDailyTopup() {
  const { state, setAppDaily } = useAppState();
  const [edit, setEdit] = useState<string | null>(null);
  const [mins, setMins] = useState('');
  const [hour, setHour] = useState('17');
  const [minute, setMinute] = useState('00');

  const fmt = (h: number, m: number) => {
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  };

  const open = (id: string) => {
    const c = state.apps[id]?.daily;
    setEdit(id);
    setMins(c ? String(c.minutes) : '');
    setHour(c ? String(c.hour) : '17');
    setMinute(c ? String(c.minute).padStart(2, '0') : '00');
  };

  const save = async () => {
    if (!edit) return;
    const m = parseInt(mins || '0', 10);
    const h = Math.max(0, Math.min(23, parseInt(hour || '0', 10)));
    const mn = Math.max(0, Math.min(59, parseInt(minute || '0', 10)));
    if (m <= 0) { await setAppDaily(edit, null); }
    else { await setAppDaily(edit, { minutes: m, hour: h, minute: mn }); }
    setEdit(null);
  };

  const remove = async () => { if (edit) { await setAppDaily(edit, null); setEdit(null); } };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <ManagerHeader title="Daily Time Top-Up" subtitle="Auto-add time to specific apps every day at a chosen hour. This is a separate allowance — wallet time depletes first, then daily, then weekly." />

        <Text style={s.section}>All Apps</Text>

        {MOCK_APPS.map((app) => {
          const cfg = state.apps[app.id]?.daily;
          return (
            <TouchableOpacity key={app.id} testID={`daily-row-${app.id}`} activeOpacity={0.7} onPress={() => open(app.id)} style={[s.row, shadow.card]}>
              <View style={[s.icon, { backgroundColor: app.color + '22' }]}><Text style={{ fontSize: 22 }}>{app.icon}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.name}>{app.name}</Text>
                <Text style={s.sub}>{cfg ? `+${cfg.minutes} min daily at ${fmt(cfg.hour, cfg.minute)}` : 'Not set'}</Text>
              </View>
              {cfg ? <Ionicons name="time" size={20} color={colors.premium} /> : <Ionicons name="add-circle-outline" size={20} color={colors.textLight} />}
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
                <Text style={s.label}>Daily minutes</Text>
                <BrutalInput value={mins} onChangeText={setMins} keyboardType="number-pad" placeholder="e.g. 30" testID="daily-mins-input" />
                <Text style={s.label}>Time of day</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <BrutalInput value={hour} onChangeText={setHour} keyboardType="number-pad" placeholder="HH" style={{ flex: 1 }} maxLength={2} />
                  <BrutalInput value={minute} onChangeText={setMinute} keyboardType="number-pad" placeholder="MM" style={{ flex: 1 }} maxLength={2} />
                </View>
                <Text style={s.helper}>24-hour clock. Hour 0-23, Minute 0-59.</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <BrutalButton title="Remove" onPress={remove} variant="soft" bg={colors.errorSoft} fg={colors.error} style={{ flex: 1 }} testID="daily-remove-btn" />
                  <BrutalButton title="Save" onPress={save} style={{ flex: 1 }} testID="daily-save-btn" />
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
  helper: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 380 },
});
