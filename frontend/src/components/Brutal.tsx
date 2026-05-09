import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, TextInput, TextInputProps, StyleProp } from 'react-native';
import { colors, shadow } from '../theme';

export const BrutalCard: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: string;
  testID?: string;
}> = ({ children, style, bg = colors.surface, testID }) => (
  <View testID={testID} style={[styles.card, { backgroundColor: bg }, shadow.default, style]}>
    {children}
  </View>
);

export const BrutalButton: React.FC<{
  title: string;
  onPress: () => void;
  bg?: string;
  fg?: string;
  small?: boolean;
  full?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  icon?: React.ReactNode;
}> = ({ title, onPress, bg = colors.primary, fg = '#fff', small, full, disabled, style, testID, icon }) => (
  <TouchableOpacity
    testID={testID}
    activeOpacity={0.85}
    disabled={disabled}
    onPress={onPress}
    style={[
      styles.btn,
      shadow.sm,
      {
        backgroundColor: disabled ? colors.disabled : bg,
        paddingVertical: small ? 10 : 16,
        paddingHorizontal: small ? 14 : 22,
        alignSelf: full ? 'stretch' : 'flex-start',
      },
      style,
    ]}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {icon}
      <Text style={[styles.btnText, { color: fg, fontSize: small ? 13 : 16 }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  </TouchableOpacity>
);

export const BrutalIconButton: React.FC<{
  label: string;
  onPress: () => void;
  bg?: string;
  fg?: string;
  testID?: string;
  disabled?: boolean;
}> = ({ label, onPress, bg = colors.yellow, fg = colors.black, testID, disabled }) => (
  <TouchableOpacity
    testID={testID}
    activeOpacity={0.85}
    onPress={onPress}
    disabled={disabled}
    style={[styles.iconBtn, shadow.sm, { backgroundColor: disabled ? colors.disabled : bg }]}
  >
    <Text style={{ color: fg, fontSize: 22, fontWeight: '900' }}>{label}</Text>
  </TouchableOpacity>
);

export const BrutalInput: React.FC<TextInputProps & { testID?: string }> = (props) => (
  <TextInput
    {...props}
    placeholderTextColor="#777"
    style={[styles.input, shadow.sm, props.style]}
  />
);

export const Heading: React.FC<{ children: React.ReactNode; style?: StyleProp<TextStyle>; level?: 1 | 2 | 3 }> = ({ children, style, level = 1 }) => (
  <Text
    style={[
      styles.heading,
      level === 1 && { fontSize: 36 },
      level === 2 && { fontSize: 24 },
      level === 3 && { fontSize: 18 },
      style,
    ]}
  >
    {children}
  </Text>
);

export const Pill: React.FC<{ label: string; bg?: string; fg?: string; style?: StyleProp<ViewStyle>; testID?: string }> = ({ label, bg = colors.yellow, fg = colors.black, style, testID }) => (
  <View testID={testID} style={[styles.pill, { backgroundColor: bg }, style]}>
    <Text style={{ color: fg, fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 4,
    borderColor: colors.black,
    borderRadius: 0,
    padding: 18,
  },
  btn: {
    borderWidth: 4,
    borderColor: colors.black,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  iconBtn: {
    borderWidth: 4,
    borderColor: colors.black,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 4,
    borderColor: colors.black,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  heading: {
    color: colors.black,
    fontWeight: '900',
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  pill: {
    borderWidth: 3,
    borderColor: colors.black,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
