import React from 'react';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { StyleProp } from 'react-native';

const ALIASES: Record<string, string> = {
  apps: 'grid-outline',
  'close-circle': 'close-circle-outline',
  'help-circle': 'help-circle-outline',
  'information-circle': 'information-circle-outline',
  key: 'key-outline',
  layers: 'layers-outline',
  search: 'search-outline',
  'stats-chart': 'bar-chart-outline',
};

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<any>;
};

export const Ionicons = ({ name, size = 22, color = '#000', style }: IconProps) => {
  const resolvedName = ALIASES[name] ?? name;
  return (
    <ExpoIonicons
      name={resolvedName as any}
      size={size}
      color={color}
      style={style}
    />
  );
};

// Mimic the static fields in case any code references them
(Ionicons as unknown as { font: object }).font = ExpoIonicons.font;
(Ionicons as unknown as { glyphMap: unknown }).glyphMap = ExpoIonicons.glyphMap;

export default Ionicons;
