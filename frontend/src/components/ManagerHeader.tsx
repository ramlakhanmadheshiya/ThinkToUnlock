// Shared header for premium-manager screens
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from './Icon';
import { Heading } from './Brutal';
import { colors } from '../theme';

export const ManagerHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const router = useRouter();
  return (
    <View>
      <TouchableOpacity onPress={() => router.back()} style={s.back} testID="manager-back-btn" activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
        <Text style={s.backTxt}>Back</Text>
      </TouchableOpacity>
      <Heading level={1} style={{ marginTop: 12 }}>{title}</Heading>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
    </View>
  );
};

const s = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backTxt: { fontWeight: '600', color: colors.text, fontSize: 14 },
  sub: { color: colors.textMuted, fontWeight: '500', fontSize: 14, marginTop: 6, lineHeight: 20 },
});
