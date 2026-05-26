import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, TextInput, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../src/components/Icon';
import { ManagerHeader } from '../src/components/ManagerHeader';
import { BrutalButton, BrutalCard, BrutalInput, Heading, BrutalIconButton } from '../src/components/Brutal';
import { WheelPicker } from '../src/components/WheelPicker';
import { useAppState } from '../src/store/StateContext';

import { colors, shadow, radius } from '../src/theme';

export default function PremiumDailyTopup() {
  const { state, setAppDaily, installedApps } = useAppState();
  const [selected, setSelected] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const lockedInstalledApps = installedApps.filter(a => state.apps[a.id]?.locked);
  
  // Topup amount
  const [amountH, setAmountH] = useState(0);
  const [amountM, setAmountM] = useState(30);

  // Time of day
  const [is24, setIs24] = useState(false);
  const [todH, setTodH] = useState(5);
  const [todM, setTodM] = useState(0);
  const [isPm, setIsPm] = useState(true);

  const HOURS_24 = Array.from({length: 24}).map((_,i) => ({label: String(i), value: i}));
  const HOURS_12 = Array.from({length: 12}).map((_,i) => ({label: String(i === 0 ? 12 : i), value: i === 0 ? 12 : i}));
  const MINS = Array.from({length: 60}).map((_,i) => ({label: String(i).padStart(2, '0'), value: i}));
  const AMPM = [{label: 'AM', value: false}, {label: 'PM', value: true}];

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selected.length === lockedInstalledApps.length) setSelected([]);
    else setSelected(lockedInstalledApps.map(a => a.id));
  };

  const openEdit = (ids: string[]) => {
    setSelected(ids);
    const existing = ids.length === 1 && state.apps[ids[0]]?.daily;
    if (existing) {
      const c = state.apps[ids[0]].daily;
      setAmountH(Math.floor(c.minutes / 60));
      setAmountM(c.minutes % 60);
      
      let h = c.hour;
      if (!is24) {
        setIsPm(h >= 12);
        h = h % 12 || 12;
      }
      setTodH(h);
      setTodM(c.minute);
    } else {
      setAmountH(0); setAmountM(30);
      setTodH(is24 ? 17 : 5); setTodM(0); setIsPm(true);
    }
    setShowModal(true);
  };

  const adjustValue = (setter: any, current: string, delta: number, min: number, max: number, pad = false) => {
    let v = parseInt(current || '0', 10) + delta;
    if (v > max) v = min;
    if (v < min) v = max;
    setter(pad ? String(v).padStart(2, '0') : String(v));
  };

  const save = async () => {
    const totalMins = amountH * 60 + amountM;
    
    let finalHour = todH;
    if (!is24) {
      if (isPm && finalHour < 12) finalHour += 12;
      if (!isPm && finalHour === 12) finalHour = 0;
    }
    const finalMin = todM;

    await setAppDaily(selected, { minutes: totalMins, hour: finalHour, minute: finalMin });
    setShowModal(false);
    setSelected([]);
  };

  const remove = async () => {
    await setAppDaily(selected, null);
    setShowModal(false);
    setSelected([]);
  };

  const fmt = (h: number, m: number) => {
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  };

  const hasExisting = selected.every(id => !!state.apps[id]?.daily);
  const totalMins = amountH * 60 + amountM;
  const canSave = totalMins > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <ManagerHeader title="Daily Time Top-Up" subtitle="Auto-add time to specific apps every day at a chosen hour." />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
          <Text style={s.section}>All Apps</Text>
          <TouchableOpacity onPress={selectAll}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>{selected.length === installedApps.length ? 'Deselect All' : 'Select All'}</Text>
          </TouchableOpacity>
        </View>

        {lockedInstalledApps.map((app) => {
          const cfg = state.apps[app.id]?.daily;
          const isSelected = selected.includes(app.id);
          return (
            <TouchableOpacity key={app.id} testID={`daily-row-${app.id}`} activeOpacity={0.7} onPress={() => toggleSelect(app.id)} style={[s.row, shadow.card, isSelected && { borderColor: colors.primary, borderWidth: 2 }]}>
              {app.icon.startsWith('data:image') ? (
                <Image source={{ uri: app.icon }} style={{ width: 44, height: 44, borderRadius: 12 }} />
              ) : (
                <View style={[s.icon, { backgroundColor: app.color + '22' }]}><Ionicons name={app.icon as any} size={22} color={app.color} /></View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.name}>{app.name}</Text>
                <Text style={s.sub}>{cfg ? `+${cfg.minutes} min daily at ${fmt(cfg.hour, cfg.minute)}` : 'Not set'}</Text>
              </View>
              <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={24} color={isSelected ? colors.primary : colors.textLight} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selected.length > 0 && !showModal && (
        <View style={s.floatingFooter}>
          <BrutalButton title={`Set Time for ${selected.length} App${selected.length > 1 ? 's' : ''}`} onPress={() => openEdit(selected)} full shadow />
        </View>
      )}

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalBg}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowModal(false)} />
          <View style={[s.modalCard, shadow.raised]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Heading level={2}>Configure Top-Up</Heading>
              <TouchableOpacity onPress={() => setIs24(!is24)} style={{ backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{is24 ? '24h format' : '12h AM/PM'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Amount to Add</Text>
            <View style={s.timeRow}>
              <View style={s.stepperCol}>
                <WheelPicker items={HOURS_24} selectedValue={amountH} onValueChange={setAmountH} />
                <Text style={s.timeUnit}>Hrs</Text>
              </View>
              <Text style={s.colon}>:</Text>
              <View style={s.stepperCol}>
                <WheelPicker items={MINS} selectedValue={amountM} onValueChange={setAmountM} />
                <Text style={s.timeUnit}>Mins</Text>
              </View>
            </View>

            <Text style={s.label}>Time of Day</Text>
            <View style={s.timeRow}>
              <View style={s.stepperCol}>
                <WheelPicker items={is24 ? HOURS_24 : HOURS_12} selectedValue={todH} onValueChange={setTodH} />
              </View>
              <Text style={s.colon}>:</Text>
              <View style={s.stepperCol}>
                <WheelPicker items={MINS} selectedValue={todM} onValueChange={setTodM} />
              </View>
              {!is24 && (
                <View style={[s.stepperCol, { marginLeft: 10 }]}>
                  <WheelPicker items={AMPM} selectedValue={isPm} onValueChange={setIsPm} />
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
              <BrutalButton title={hasExisting ? "Remove" : "Cancel"} onPress={hasExisting ? remove : () => setShowModal(false)} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} />
              <BrutalButton title="Save" onPress={save} disabled={!canSave} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  row: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '600', fontSize: 15, color: colors.text },
  sub: { fontWeight: '500', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  label: { color: colors.text, fontWeight: '600', fontSize: 13, marginTop: 20, marginBottom: 10 },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.65)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 400 },
  floatingFooter: { position: 'absolute', bottom: 20, left: 18, right: 18 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepperCol: { alignItems: 'center' },
  timeInput: { width: 64, height: 50, backgroundColor: colors.background, borderRadius: radius.md, textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text, borderWidth: 1, borderColor: colors.border },
  colon: { fontSize: 24, fontWeight: '700', color: colors.text, marginHorizontal: 8 },
  timeUnit: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' }
});
