/**
 * Suppress known dev-mode errors that are harmless but noisy.
 *
 * 1. "Unable to activate keep awake" — PERMANENTLY FIXED by patching
 *    node_modules/expo-keep-awake/src/index.ts to add .catch(() => {}).
 *    This LogBox entry is a safety net in case the patch is somehow lost.
 *
 * 2. "Looks like you have configured linking in multiple places" — expo-router
 *    dev-only false positive from React double-mount. Cannot be fixed without
 *    modifying expo-router internals. Harmless — never fires in production.
 */

import { LogBox } from 'react-native';

// Filter console.error for the linking warning (it passes a string)
if (__DEV__) {
  const _origError = console.error;
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === 'string'
      ? args[0]
      : args[0] instanceof Error
        ? args[0].message
        : String(args[0] ?? '');
    if (
      msg.includes('configured linking in multiple places') ||
      msg.includes('Unable to activate keep awake')
    ) {
      return; // swallow silently
    }
    _origError.apply(console, args);
  };
}

// LogBox: hide red-screen overlays for these known issues
LogBox.ignoreLogs([
  'Unable to activate keep awake',
  'configured linking in multiple places',
]);
