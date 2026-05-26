import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from './Icon';
import { colors } from '../theme';

export function TabHeader() {
  return (
    <View style={s.container}>
      <View style={s.brandDot}>
        <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
      </View>
      <Text style={s.appName}>ThinkToUnlock</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  brandDot: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
});
