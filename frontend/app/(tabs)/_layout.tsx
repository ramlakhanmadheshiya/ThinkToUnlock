import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { Platform, StyleSheet, View } from 'react-native';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11, marginTop: -2 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 66,
          paddingBottom: Platform.OS === 'ios' ? 22 : 10,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, focused }) => {
          let name: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'home') name = focused ? 'home' : 'home-outline';
          if (route.name === 'games') name = focused ? 'game-controller' : 'game-controller-outline';
          if (route.name === 'manage') name = focused ? 'shield' : 'shield-outline';
          if (route.name === 'settings') name = focused ? 'settings' : 'settings-outline';
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={name} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="games" options={{ title: 'Games' }} />
      <Tabs.Screen name="manage" options={{ title: 'Manage' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
