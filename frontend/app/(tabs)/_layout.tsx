import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.black,
        tabBarLabelStyle: { fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 4,
          borderTopColor: colors.black,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, focused }) => {
          let name: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'home') name = focused ? 'home' : 'home-outline';
          if (route.name === 'games') name = focused ? 'game-controller' : 'game-controller-outline';
          if (route.name === 'manage') name = focused ? 'lock-closed' : 'lock-closed-outline';
          if (route.name === 'settings') name = focused ? 'settings' : 'settings-outline';
          return (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.yellow, borderColor: colors.black }]}>
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

const styles = StyleSheet.create({
  iconWrap: {
    width: 38,
    height: 30,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
