import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../src/components/Icon';
import { ManagerHeader } from '../src/components/ManagerHeader';
import { BrutalButton, BrutalCard, BrutalInput, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { MOCK_APPS } from '../src/data/mockApps';
import { FocusWindow } from '../src/store/storage';
import { colors, shadow, radius } from '../src/theme';

const fmtMin = (m: number) => {
  const h = Math.floor(m / 60), mn = m % 60;
  const ap = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12;
  return `${h12}:${String(mn).padStart(2, '0')} ${ap}`;
};

export default function PremiumFocus() {
  const { state, setAppStrictFocus, setFocusWindows } = useAppState();
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState('School');
  const [sH, setSH] = useState('9'); const [sM, setSM] = useState('00');
  const [eH, setEH] = useState('15'); const [eM, setEM] = useState('00');

  const addWindow = async () => {
    const w: FocusWindow = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: label || 'Window',
      startMin: (parseInt(sH || '0') % 24) * 60 + (parseInt(sM || '0') % 60),
      endMin: (parseInt(eH || '0') % 24) * 60 + (parseInt(eM || '0') % 60),
    };
    await setFocusWindows([...state.focusWindows, w]);
    setShowAdd(false); setLabel('School'); setSH('9'); setSM('00'); setEH('15'); setEM('00');
  };

  const removeWindow = async (id: string) => {
    await setFocusWindows(state.focusWindows.filter((w) => w.id !== id));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <ManagerHeader title="Strict Focus Mode" subtitle="During focus windows, selected apps stay locked even if you have time. Time earned during focus stays in your wallet for later." />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
          <Text style={s.section}>Focus Windows</Text>
          <BrutalButton title="+ Add" onPress={() => setShowAdd(true)} small testID="focus-add-btn" />
        </View>

        {state.focusWindows.length === 0 ? (
          <BrutalCard><Text style={{ fontWeight: '500', color: colors.textMuted }}>No windows yet. Add one (e.g. School 9–3 PM, Sleep 10 PM–5 AM).</Text></BrutalCard>
        ) : (
          state.focusWindows.map((w) => (
            <View key={w.id} style={[s.windowRow, shadow.card]} testID={`focus-window-${w.id}`}>
              <View style={s.calIcon}><Ionicons name="calendar" size={20} color={colors.premium} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.name}>{w.label}</Text>
                <Text style={s.sub}>{fmtMin(w.startMin)} – {fmtMin(w.endMin)}</Text>
              </View>
              <TouchableOpacity onPress={() => removeWindow(w.id)} testID={`focus-remove-${w.id}`} style={s.removeBtn}>
                <Ionicons name="close" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={s.section}>Apps in Focus pool</Text>
        <Text style={s.helper}>Toggle which apps the focus windows apply to. This pool is independent of the main App Shielding manager.</Text>

        {MOCK_APPS.map((app) => {
          const cfg = state.apps[app.id];
          return (
            <View key={app.id} style={[s.row, shadow.card]} testID={`focus-app-${app.id}`}>
              <View style={[s.icon, { backgroundColor: app.color + '22' }]}><Text style={{ fontSize: 22 }}>{app.icon}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.name}>{app.name}</Text>
                <Text style={s.sub}>{cfg.isStrictFocus ? 'In focus pool' : 'Not in focus pool'}</Text>
              </View>
              <Switch testID={`focus-toggle-${app.id}`} value={cfg.isStrictFocus} onValueChange={(v) => setAppStrictFocus(app.id, v)} trackColor={{ false: colors.borderDark, true: colors.premium }} thumbColor={'#fff'} />
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAdd(false)}>
          <View style={s.modalBg}>
            <TouchableWithoutFeedback>
              <View style={[s.modalCard, shadow.raised]}>
                <Heading level={2}>Add focus window</Heading>
                <Text style={s.label}>Label</Text>
                <BrutalInput value={label} onChangeText={setLabel} placeholder="e.g. School, Sleep" testID="focus-label-input" />
                <Text style={s.label}>Start (24h)</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <BrutalInput value={sH} onChangeText={setSH} keyboardType="number-pad" placeholder="HH" style={{ flex: 1 }} maxLength={2} testID="focus-startH" />
                  <BrutalInput value={sM} onChangeText={setSM} keyboardType="number-pad" placeholder="MM" style={{ flex: 1 }} maxLength={2} testID="focus-startM" />
                </View>
                <Text style={s.label}>End (24h)</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <BrutalInput value={eH} onChangeText={setEH} keyboardType="number-pad" placeholder="HH" style={{ flex: 1 }} maxLength={2} testID="focus-endH" />
                  <BrutalInput value={eM} onChangeText={setEM} keyboardType="number-pad" placeholder="MM" style={{ flex: 1 }} maxLength={2} testID="focus-endM" />
                </View>
                <Text style={s.helper}>For overnight windows like 22:00–05:00, the system handles wrap-around.</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <BrutalButton title="Cancel" onPress={() => setShowAdd(false)} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="focus-cancel-btn" />
                  <BrutalButton title="Add" onPress={addWindow} style={{ flex: 1 }} testID="focus-save-btn" />
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
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  helper: { color: colors.textMuted, fontSize: 12, marginBottom: 10, lineHeight: 17, marginTop: -4 },
  windowRow: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  calIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.premiumSoft, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.errorSoft, alignItems: 'center', justifyContent: 'center' },
  row: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 0 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '600', fontSize: 15, color: colors.text },
  sub: { fontWeight: '500', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  label: { color: colors.text, fontWeight: '600', fontSize: 13, marginTop: 12, marginBottom: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 380 },
});
