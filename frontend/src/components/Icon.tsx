// Emoji/text-based icon wrapper — drop-in replacement for @expo/vector-icons Ionicons.
// Eliminates ALL font loading (no expo-font dependency). Works on any device, including Expo Go.
import React from 'react';
import { Text, StyleProp, TextStyle, View, ViewStyle } from 'react-native';

const MAP: Record<string, string> = {
  'shield-checkmark': '🛡',
  'shield': '🛡',
  'shield-outline': '🛡',
  'home': '🏠',
  'home-outline': '⌂',
  'game-controller': '🎮',
  'game-controller-outline': '🎮',
  'settings': '⚙',
  'settings-outline': '⚙',
  'lock-closed': '🔒',
  'lock-closed-outline': '🔒',
  'add': '+',
  'remove': '–',
  'arrow-back': '‹',
  'arrow-forward': '›',
  'chevron-forward': '›',
  'chevron-back': '‹',
  'flash': '⚡',
  'flash-outline': '⚡',
  'shuffle': '⇄',
  'play': '▶',
  'pause': '❚❚',
  'close': '✕',
  'close-circle-outline': '⊗',
  'checkmark': '✓',
  'checkmark-circle': '✓',
  'checkmark-circle-outline': '✓',
  'alert-circle': '!',
  'alert': '⚠',
  'star': '★',
  'star-outline': '☆',
  'time': '⏱',
  'time-outline': '⏱',
  'trophy': '🏆',
  'trophy-outline': '🏆',
  'flame': '🔥',
  'flame-outline': '🔥',
  'key-outline': '🔑',
  'trash-outline': '🗑',
  'bar-chart-outline': '📊',
  'notifications': '🔔',
  'notifications-outline': '🔔',
  'calendar': '📅',
  'calendar-outline': '📅',
  'school-outline': '🎓',
  'speedometer-outline': '⚡',
  'people-outline': '👥',
  'sunny-outline': '☀',
  'moon-outline': '☾',
  'list-outline': '≡',
  'add-circle-outline': '⊕',
  'remove-circle-outline': '⊖',
  'pricetag-outline': '🏷',
  'sparkles': '✦',
};

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle | ViewStyle>;
};

export const Ionicons = ({ name, size = 22, color = '#000', style }: IconProps) => {
  const ch = MAP[name] || '•';
  // Slightly smaller scale for visual balance with the emoji glyphs
  const fs = size * 0.95;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style as StyleProp<ViewStyle>]}>
      <Text
        allowFontScaling={false}
        style={{ fontSize: fs, color, lineHeight: size, textAlign: 'center', includeFontPadding: false }}
      >
        {ch}
      </Text>
    </View>
  );
};

// Mimic the static fields in case any code references them
(Ionicons as unknown as { font: object }).font = {};
(Ionicons as unknown as { glyphMap: Record<string, number> }).glyphMap = {};

export default Ionicons;
