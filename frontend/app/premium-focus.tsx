import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../src/components/Icon';
import { ManagerHeader } from '../src/components/ManagerHeader';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../src/components/Brutal';
import { WheelPicker } from '../src/components/WheelPicker';
import { useAppState } from '../src/store/StateContext';

import { FocusWindow } from '../src/store/storage';
import { colors, shadow, radius } from '../src/theme';

const fmtMin = (m: number) => {
  const h = Math.floor(m / 60), mn = m % 60;
  const ap = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12;
  return `${h12}:${String(mn).padStart(2, '0')} ${ap}`;
};

export default function PremiumFocus() {
  const { state, setFocusWindows, installedApps } = useAppState();
  const [editId, setEditId] = useState<string | null>(null);
  
  const [label, setLabel] = useState('School');
  const [labelErr, setLabelErr] = useState('');
  const [is24, setIs24] = useState(false);

  const [sH, setSH] = useState(9); const [sM, setSM] = useState(0); const [sPm, setSPm] = useState(false);
  const [eH, setEH] = useState(3); const [eM, setEM] = useState(0); const [ePm, setEPm] = useState(true);

  const HOURS_24 = Array.from({length: 24}).map((_,i) => ({label: String(i), value: i}));
  const HOURS_12 = Array.from({length: 12}).map((_,i) => ({label: String(i === 0 ? 12 : i), value: i === 0 ? 12 : i}));
  const MINS = Array.from({length: 60}).map((_,i) => ({label: String(i).padStart(2, '0'), value: i}));
  const AMPM = [{label: 'AM', value: false}, {label: 'PM', value: true}];

  const [lockedAppIds, setLockedAppIds] = useState<string[]>([]);

  const openAdd = () => {
    setEditId('new');
    setLabel(''); setLabelErr('');
    setSH(is24 ? 9 : 9); setSM(0); setSPm(false);
    setEH(is24 ? 15 : 3); setEM(0); setEPm(true);
    setLockedAppIds([]);
  };

  const openEdit = (w: FocusWindow) => {
    setEditId(w.id);
    setLabel(w.label); setLabelErr('');
    setLockedAppIds(w.lockedAppIds || []);

    const startH = Math.floor(w.startMin / 60);
    const endH = Math.floor(w.endMin / 60);

    setSM(w.startMin % 60);
    setEM(w.endMin % 60);

    if (!is24) {
      setSPm(startH >= 12);
      setSH(startH % 12 || 12);
      setEPm(endH >= 12);
      setEH(endH % 12 || 12);
    } else {
      setSH(startH);
      setEH(endH);
    }
  };

  const adjustValue = (setter: any, current: string, delta: number, min: number, max: number, pad = false) => {
    let v = parseInt(current || '0', 10) + delta;
    if (v > max) v = min;
    if (v < min) v = max;
    setter(pad ? String(v).padStart(2, '0') : String(v));
  };

  const saveWindow = async () => {
    if (!label.trim()) {
      setLabelErr('Label is required');
      return;
    }

    let finalStartH = sH;
    if (!is24) {
      if (sPm && finalStartH < 12) finalStartH += 12;
      if (!sPm && finalStartH === 12) finalStartH = 0;
    }

    let finalEndH = eH;
    if (!is24) {
      if (ePm && finalEndH < 12) finalEndH += 12;
      if (!ePm && finalEndH === 12) finalEndH = 0;
    }

    const startMin = finalStartH * 60 + sM;
    const endMin = finalEndH * 60 + eM;

    const w: FocusWindow = {
      id: editId === 'new' ? `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : editId!,
      label: label.trim(),
      startMin,
      endMin,
      lockedAppIds
    };

    let newWindows = [...state.focusWindows];
    if (editId === 'new') {
      newWindows.push(w);
    } else {
      newWindows = newWindows.map(x => x.id === editId ? w : x);
    }

    await setFocusWindows(newWindows);
    setEditId(null);
  };

  const removeWindow = async (id: string) => {
    await setFocusWindows(state.focusWindows.filter((w) => w.id !== id));
    if (editId === id) setEditId(null);
  };

  const toggleApp = (id: string) => {
    setLockedAppIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <ManagerHeader title="Strict Focus Mode" subtitle="During focus windows, selected apps stay locked even if you have time. Time earned during focus stays in your wallet for later." />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
          <Text style={s.section}>Focus Windows</Text>
          <BrutalButton title="+ Add Window" onPress={openAdd} small testID="focus-add-btn" />
        </View>

        {state.focusWindows.length === 0 ? (
          <BrutalCard><Text style={{ fontWeight: '500', color: colors.textMuted }}>No windows yet. Add one (e.g. School 9–3 PM, Sleep 10 PM–5 AM).</Text></BrutalCard>
        ) : (
          state.focusWindows.map((w) => (
            <TouchableOpacity key={w.id} activeOpacity={0.7} onPress={() => openEdit(w)} style={[s.windowRow, shadow.card]} testID={`focus-window-${w.id}`}>
              <View style={s.calIcon}><Ionicons name="calendar" size={20} color={colors.premium} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.name}>{w.label}</Text>
                <Text style={s.sub}>{fmtMin(w.startMin)} – {fmtMin(w.endMin)} • {w.lockedAppIds?.length || 0} apps</Text>
              </View>
              <TouchableOpacity onPress={() => removeWindow(w.id)} testID={`focus-remove-${w.id}`} style={s.removeBtn}>
                <Ionicons name="close" size={18} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={!!editId} transparent animationType="slide" onRequestClose={() => setEditId(null)}>
        <View style={s.fullModalBg}>
          <View style={[s.fullModalCard, shadow.raised]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Heading level={2}>{editId === 'new' ? 'Add window' : 'Edit window'}</Heading>
              <TouchableOpacity onPress={() => setIs24(!is24)} style={{ backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{is24 ? '24h format' : '12h AM/PM'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              <Text style={s.label}>Label *</Text>
              <BrutalInput value={label} onChangeText={(t) => { setLabel(t); setLabelErr(''); }} placeholder="e.g. School, Sleep" error={!!labelErr} testID="focus-label-input" />
              {labelErr ? <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{labelErr}</Text> : null}

              <Text style={[s.label, { marginTop: 20 }]}>Start Time *</Text>
              <View style={s.timeRow}>
                <View style={s.stepperCol}>
                  <WheelPicker items={is24 ? HOURS_24 : HOURS_12} selectedValue={sH} onValueChange={setSH} />
                </View>
                <Text style={s.colon}>:</Text>
                <View style={s.stepperCol}>
                  <WheelPicker items={MINS} selectedValue={sM} onValueChange={setSM} />
                </View>
                {!is24 && (
                  <View style={[s.stepperCol, { marginLeft: 10 }]}>
                    <WheelPicker items={AMPM} selectedValue={sPm} onValueChange={setSPm} />
                  </View>
                )}
              </View>

              <Text style={[s.label, { marginTop: 20 }]}>End Time *</Text>
              <View style={s.timeRow}>
                <View style={s.stepperCol}>
                  <WheelPicker items={is24 ? HOURS_24 : HOURS_12} selectedValue={eH} onValueChange={setEH} />
                </View>
                <Text style={s.colon}>:</Text>
                <View style={s.stepperCol}>
                  <WheelPicker items={MINS} selectedValue={eM} onValueChange={setEM} />
                </View>
                {!is24 && (
                  <View style={[s.stepperCol, { marginLeft: 10 }]}>
                    <WheelPicker items={AMPM} selectedValue={ePm} onValueChange={setEPm} />
                  </View>
                )}
              </View>
              
              <Text style={s.helper}>For overnight windows like 10 PM–5 AM, the system handles wrap-around automatically.</Text>

              <Text style={[s.section, { marginTop: 24 }]}>Select Apps to Lock</Text>
              {installedApps.map((app) => {
                const isSelected = lockedAppIds.includes(app.id);
                return (
                  <TouchableOpacity key={app.id} activeOpacity={0.7} onPress={() => toggleApp(app.id)} style={[s.appRow, shadow.card, isSelected && { borderColor: colors.primary, borderWidth: 2 }]}>
                    {app.icon.startsWith('data:image') ? (
                      <Image source={{ uri: app.icon }} style={{ width: 36, height: 36, borderRadius: 10 }} />
                    ) : (
                      <View style={[s.icon, { backgroundColor: app.color + '22' }]}><Ionicons name={app.icon as any} size={22} color={app.color} /></View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.name}>{app.name}</Text>
                    </View>
                    <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={24} color={isSelected ? colors.primary : colors.textLight} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: 1, borderColor: colors.border }}>
              <BrutalButton title="Cancel" onPress={() => setEditId(null)} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="focus-cancel-btn" />
              <BrutalButton title="Save Window" onPress={saveWindow} style={{ flex: 2 }} testID="focus-save-btn" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  helper: { color: colors.textMuted, fontSize: 12, marginTop: 6, lineHeight: 17 },
  windowRow: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  calIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.premiumSoft, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.errorSoft, alignItems: 'center', justifyContent: 'center' },
  appRow: { backgroundColor: colors.background, borderRadius: radius.md, padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '600', fontSize: 15, color: colors.text },
  sub: { fontWeight: '500', fontSize: 12, color: colors.textMuted, marginTop: 2, flexShrink: 1 },
  label: { color: colors.text, fontWeight: '600', fontSize: 13, marginBottom: 8 },
  fullModalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.65)', justifyContent: 'flex-end' },
  fullModalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 22, width: '100%', maxHeight: '90%' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  stepperCol: { alignItems: 'center' },
  timeInput: { width: 64, height: 50, backgroundColor: colors.background, borderRadius: radius.md, textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text, borderWidth: 1, borderColor: colors.border },
  colon: { fontSize: 24, fontWeight: '700', color: colors.text, marginHorizontal: 8 },
});
