import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../src/components/Icon';
import { ManagerHeader } from '../src/components/ManagerHeader';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../src/components/Brutal';
import { WheelPicker } from '../src/components/WheelPicker';
import { useAppState } from '../src/store/StateContext';

import { colors, shadow, radius } from '../src/theme';

export default function PremiumWeekly() {
  const { state, setAppWeekly, installedApps } = useAppState();
  const lockedInstalledApps = installedApps.filter(a => state.apps[a.id]?.locked);
  const [edit, setEdit] = useState<string | null>(null);
  const [amountH, setAmountH] = useState(0);
  const [amountM, setAmountM] = useState(60);
  const [days, setDays] = useState<number[]>([0, 6]); // Default Sun, Sat

  const DAYS_MAP = [{ id: 1, label: 'Mo' }, { id: 2, label: 'Tu' }, { id: 3, label: 'We' }, { id: 4, label: 'Th' }, { id: 5, label: 'Fr' }, { id: 6, label: 'Sa' }, { id: 0, label: 'Su' }];
  const HOURS = Array.from({length: 24}).map((_,i) => ({label: String(i), value: i}));
  const MINS = Array.from({length: 60}).map((_,i) => ({label: String(i).padStart(2, '0'), value: i}));

  const open = (id: string) => { 
    setEdit(id);
    const existingMins = state.apps[id]?.weeklyMinutes || 0;
    setAmountH(Math.floor(existingMins / 60));
    setAmountM(existingMins % 60);
    setDays(state.apps[id]?.weeklyDays || [0, 6]);
  };
  const save = async () => { if (!edit) return; await setAppWeekly(edit, amountH * 60 + amountM, days); setEdit(null); };
  const remove = async () => { if (!edit) return; await setAppWeekly(edit, 0, days); setEdit(null); };
  
  const hasExisting = edit ? !!(state.apps[edit]?.weeklyMinutes && state.apps[edit]?.weeklyMinutes > 0) : false;
  const canSave = (amountH * 60 + amountM > 0) && days.length > 0;

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

        {lockedInstalledApps.map((app) => {
          const m = state.apps[app.id]?.weeklyMinutes || 0;
          return (
            <TouchableOpacity key={app.id} testID={`weekly-row-${app.id}`} activeOpacity={0.7} onPress={() => open(app.id)} style={[s.row, shadow.card]}>
              {app.icon.startsWith('data:image') ? (
                <Image source={{ uri: app.icon }} style={{ width: 44, height: 44, borderRadius: 12 }} />
              ) : (
                <View style={[s.icon, { backgroundColor: app.color + '22' }]}><Ionicons name={app.icon as any} size={22} color={app.color} /></View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.name}>{app.name}</Text>
                <Text style={s.sub}>{m > 0 ? `+${m} min on selected days` : 'Not set'}</Text>
              </View>
              {m > 0 ? <Ionicons name="calendar" size={20} color={colors.premium} /> : <Ionicons name="add-circle-outline" size={20} color={colors.textLight} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={!!edit} transparent animationType="fade" onRequestClose={() => setEdit(null)}>
        <View style={s.modalBg}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEdit(null)} />
          <View style={[s.modalCard, shadow.raised]}>
            <Heading level={2}>{edit ? lockedInstalledApps.find(a => a.id === edit)?.name : ''}</Heading>
                
                <Text style={s.label}>Top-up Amount</Text>
                <View style={s.timeRow}>
                  <View style={s.stepperCol}>
                    <WheelPicker items={HOURS} selectedValue={amountH} onValueChange={setAmountH} />
                    <Text style={s.timeUnit}>Hrs</Text>
                  </View>
                  <Text style={s.colon}>:</Text>
                  <View style={s.stepperCol}>
                    <WheelPicker items={MINS} selectedValue={amountM} onValueChange={setAmountM} />
                    <Text style={s.timeUnit}>Mins</Text>
                  </View>
                </View>
                
                <Text style={s.label}>Active days</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                  {DAYS_MAP.map(d => {
                    const active = days.includes(d.id);
                    return (
                      <TouchableOpacity 
                        key={d.id} 
                        onPress={() => setDays(cur => active ? cur.filter(x => x !== d.id) : [...cur, d.id])}
                        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: active ? colors.premium : colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>{d.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
                  <BrutalButton title={hasExisting ? "Remove" : "Cancel"} onPress={hasExisting ? remove : () => setEdit(null)} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="weekly-remove-btn" />
                  <BrutalButton title="Save" onPress={save} disabled={!canSave} style={{ flex: 1 }} testID="weekly-save-btn" />
                </View>
              </View>
          </View>
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
  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.65)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 380 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepperCol: { alignItems: 'center' },
  colon: { fontSize: 24, fontWeight: '700', color: colors.text, marginHorizontal: 8 },
  timeUnit: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' }
});
