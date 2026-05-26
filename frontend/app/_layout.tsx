import '../src/suppressKnownErrors';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StateProvider } from '../src/store/StateContext';
import { colors } from '../src/theme';

import { checkUsagePermission, checkOverlayPermission, requestUsagePermission, requestOverlayPermission } from '../src/native/AppManager';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { View, Text } from 'react-native';
import { BrutalButton, Heading } from '../src/components/Brutal';
import { Ionicons } from '../src/components/Icon';

import { Modal } from 'react-native';

export default function RootLayout() {
  const [hasUsage, setHasUsage] = React.useState(true);
  const [hasOverlay, setHasOverlay] = React.useState(true);
  const [hasNotif, setHasNotif] = React.useState(true);

  React.useEffect(() => {
    const check = async () => {
      setHasUsage(await checkUsagePermission());
      setHasOverlay(await checkOverlayPermission());
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        setHasNotif(await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS));
      }
    };
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    check();
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StateProvider>
          <StatusBar style="dark" backgroundColor={colors.background} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}
          />
          <Modal visible={!hasUsage || !hasOverlay || !hasNotif} animationType="none" transparent={false} onRequestClose={() => {}}>
            <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' }}>
              <View style={{ alignItems: 'center', marginBottom: 40 }}>
                <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
                </View>
                <Heading level={1}>Setup ThinkToUnlock</Heading>
                <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 12, lineHeight: 22, fontSize: 15 }}>
                  To monitor app usage and protect your focus, you must grant the following permissions.
                </Text>
              </View>

              <View style={{ gap: 20 }}>
                <View style={{ padding: 16, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 2, borderColor: hasUsage ? colors.success : colors.borderDark }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Ionicons name="stats-chart" size={24} color={hasUsage ? colors.success : colors.text} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text }}>Usage Access</Text>
                      <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Allows tracking of active apps to deduct time.</Text>
                    </View>
                  </View>
                  {!hasUsage && <BrutalButton title="Grant Permission" onPress={requestUsagePermission} style={{ marginTop: 16 }} />}
                </View>

                <View style={{ padding: 16, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 2, borderColor: hasOverlay ? colors.success : colors.borderDark }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Ionicons name="layers" size={24} color={hasOverlay ? colors.success : colors.text} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text }}>Display Over Apps</Text>
                      <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Allows blocking screen when time runs out.</Text>
                    </View>
                  </View>
                  {!hasOverlay && <BrutalButton title="Grant Permission" onPress={requestOverlayPermission} style={{ marginTop: 16 }} />}
                </View>
                
                {Platform.OS === 'android' && Platform.Version >= 33 && (
                  <View style={{ padding: 16, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 2, borderColor: hasNotif ? colors.success : colors.borderDark }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Ionicons name="notifications" size={24} color={hasNotif ? colors.success : colors.text} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text }}>Notifications</Text>
                        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Used to show 30-second warnings.</Text>
                      </View>
                    </View>
                    {!hasNotif && <BrutalButton title="Grant Permission" onPress={async () => { const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS); setHasNotif(res === 'granted'); }} style={{ marginTop: 16 }} />}
                  </View>
                )}
              </View>
            </View>
          </Modal>
        </StateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
