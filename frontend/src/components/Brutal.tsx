import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, TextInput, TextInputProps, StyleProp, ActivityIndicator } from 'react-native';
import { colors, shadow, radius } from '../theme';

// -----------------------------
// Card
// -----------------------------
export const BrutalCard: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: string;
  testID?: string;
  flat?: boolean;
}> = ({ children, style, bg = colors.surface, testID, flat }) => (
  <View testID={testID} style={[styles.card, { backgroundColor: bg }, flat ? null : shadow.card, style]}>
    {children}
  </View>
);

// -----------------------------
// Button (primary / secondary / ghost)
// -----------------------------
export const BrutalButton: React.FC<{
  title: string;
  onPress: () => void;
  bg?: string;
  fg?: string;
  small?: boolean;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  icon?: React.ReactNode;
  variant?: 'solid' | 'soft' | 'ghost';
}> = ({ title, onPress, bg, fg, small, full, disabled, loading, style, testID, icon, variant = 'solid' }) => {
  let backgroundColor = bg ?? colors.primary;
  let color = fg ?? '#fff';
  if (variant === 'soft' && !bg) { backgroundColor = colors.primarySoft; color = colors.primary; }
  if (variant === 'ghost') { backgroundColor = 'transparent'; color = fg ?? colors.text; }

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.btn,
        variant === 'solid' ? shadow.soft : null,
        {
          backgroundColor: disabled ? colors.surfaceAlt : backgroundColor,
          paddingVertical: small ? 10 : 14,
          paddingHorizontal: small ? 14 : 22,
          alignSelf: full ? 'stretch' : 'flex-start',
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loading ? <ActivityIndicator size="small" color={color} /> : icon}
        <Text style={[styles.btnText, { color: disabled ? colors.textLight : color, fontSize: small ? 13 : 15 }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// -----------------------------
// Round Icon Button (e.g. + - close)
// -----------------------------
export const BrutalIconButton: React.FC<{
  label?: string;
  onPress: () => void;
  bg?: string;
  fg?: string;
  testID?: string;
  disabled?: boolean;
  size?: number;
  children?: React.ReactNode;
}> = ({ label, onPress, bg = colors.surfaceAlt, fg = colors.text, testID, disabled, size = 38, children }) => (
  <TouchableOpacity
    testID={testID}
    activeOpacity={0.7}
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.iconBtn,
      { backgroundColor: disabled ? colors.surfaceAlt : bg, width: size, height: size, borderRadius: size / 2 },
    ]}
  >
    {children || <Text style={{ color: disabled ? colors.textLight : fg, fontSize: size * 0.5, fontWeight: '600', lineHeight: size * 0.5 + 2 }}>{label}</Text>}
  </TouchableOpacity>
);

// -----------------------------
// Input
// -----------------------------
export const BrutalInput: React.FC<TextInputProps & { testID?: string; error?: boolean }> = ({ error, style, ...props }) => (
  <TextInput
    {...props}
    placeholderTextColor={colors.textLight}
    style={[styles.input, error ? { borderColor: colors.error } : null, style]}
  />
);

// -----------------------------
// Heading
// -----------------------------
export const Heading: React.FC<{ children: React.ReactNode; style?: StyleProp<TextStyle>; level?: 1 | 2 | 3 | 4 }> = ({ children, style, level = 1 }) => (
  <Text
    style={[
      styles.heading,
      level === 1 && { fontSize: 28, fontWeight: '700', letterSpacing: -0.6 },
      level === 2 && { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
      level === 3 && { fontSize: 16, fontWeight: '600' },
      level === 4 && { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, color: colors.textMuted },
      style,
    ]}
  >
    {children}
  </Text>
);

// -----------------------------
// Chip / Pill
// -----------------------------
export const Pill: React.FC<{ label: string; bg?: string; fg?: string; style?: StyleProp<ViewStyle>; testID?: string; icon?: React.ReactNode }> = ({ label, bg = colors.surfaceAlt, fg = colors.text, style, testID, icon }) => (
  <View testID={testID} style={[styles.pill, { backgroundColor: bg, flexDirection: 'row', alignItems: 'center' }, style]}>
    {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
    <Text style={{ color: fg, fontWeight: '600', fontSize: 12, letterSpacing: 0.2 }}>{label}</Text>
  </View>
);

// -----------------------------
// Section divider title
// -----------------------------
export const SectionLabel: React.FC<{ children: React.ReactNode; style?: StyleProp<TextStyle> }> = ({ children, style }) => (
  <Text style={[{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' }, style]}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 18,
  },
  btn: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  heading: {
    color: colors.text,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
