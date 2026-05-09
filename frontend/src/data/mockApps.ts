// Simulated installed-apps list. Real Android package detection requires a custom dev build
// with native modules (UsageStatsManager / PackageManager).
export type AppItem = {
  id: string;
  name: string;
  icon: string; // emoji fallback
  color: string;
  packageName: string;
};

export const MOCK_APPS: AppItem[] = [
  { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E1306C', packageName: 'com.instagram.android' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000', packageName: 'com.zhiliaoapp.musically' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000', packageName: 'com.google.android.youtube' },
  { id: 'pubg', name: 'PUBG Mobile', icon: '🎮', color: '#FFA500', packageName: 'com.tencent.ig' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', color: '#FFFC00', packageName: 'com.snapchat.android' },
  { id: 'facebook', name: 'Facebook', icon: '👤', color: '#1877F2', packageName: 'com.facebook.katana' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366', packageName: 'com.whatsapp' },
  { id: 'twitter', name: 'X / Twitter', icon: '🐦', color: '#000000', packageName: 'com.twitter.android' },
  { id: 'reddit', name: 'Reddit', icon: '🤖', color: '#FF4500', packageName: 'com.reddit.frontpage' },
  { id: 'discord', name: 'Discord', icon: '🎧', color: '#5865F2', packageName: 'com.discord' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', color: '#0088CC', packageName: 'org.telegram.messenger' },
  { id: 'netflix', name: 'Netflix', icon: '🎬', color: '#E50914', packageName: 'com.netflix.mediaclient' },
];
