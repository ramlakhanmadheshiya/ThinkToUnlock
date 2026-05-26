import { NativeModules, Platform } from 'react-native';

const { AppManager } = NativeModules;

export type AppInfo = {
  id: string;      // packageName
  name: string;    // App Name
  icon: string;    // Base64 or emoji
  color: string;
};

export const getInstalledApps = async (): Promise<AppInfo[]> => {
  if (Platform.OS !== 'android') return [];
  try {
    return await AppManager.getInstalledApps();
  } catch (err) {
    console.error('Failed to get apps:', err);
    return [];
  }
};

export const checkUsagePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  return await AppManager.checkUsagePermission();
};

export const requestUsagePermission = () => {
  if (Platform.OS === 'android') {
    AppManager.requestUsagePermission();
  }
};

export const checkOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  return await AppManager.checkOverlayPermission();
};

export const requestOverlayPermission = () => {
  if (Platform.OS === 'android') {
    AppManager.requestOverlayPermission();
  }
};

export const startBlockerService = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  return await AppManager.startBlockerService();
};

export const setSmartRemindersEnabled = (enabled: boolean): void => {
  if (Platform.OS === 'android') {
    AppManager.setSmartRemindersEnabled(enabled);
  }
};

export const setLockedApps = (apps: Record<string, number>): void => {
  if (Platform.OS === 'android') {
    AppManager.setLockedApps(apps);
  }
};

export const getConsumedSeconds = async (): Promise<Record<string, number>> => {
  if (Platform.OS !== 'android') return {};
  try {
    return await AppManager.getConsumedSeconds();
  } catch (err) {
    return {};
  }
};

export const unlockAppTemporarily = async (appId: string): Promise<boolean> => {
  return await AppManager.unlockAppTemporarily(appId);
};

export const launchApp = async (appId: string): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    return await AppManager.launchApp(appId);
  } catch (err) {
    return false;
  }
};
