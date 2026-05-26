// Simulated installed-apps list. Real Android package detection requires a custom dev build
// with native modules (UsageStatsManager / PackageManager).
export type AppItem = {
  id: string;
  name: string;
  icon: string;
  color: string;
  packageName: string;
};

export const MOCK_APPS: AppItem[] = [
  { id: 'instagram', name: 'Instagram', icon: 'camera-outline', color: '#E1306C', packageName: 'com.instagram.android' },
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes-outline', color: '#000000', packageName: 'com.zhiliaoapp.musically' },
  { id: 'youtube', name: 'YouTube', icon: 'play-circle-outline', color: '#FF0000', packageName: 'com.google.android.youtube' },
  { id: 'pubg', name: 'PUBG Mobile', icon: 'game-controller-outline', color: '#FFA500', packageName: 'com.tencent.ig' },
  { id: 'snapchat', name: 'Snapchat', icon: 'happy-outline', color: '#FFFC00', packageName: 'com.snapchat.android' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', packageName: 'com.facebook.katana' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'chatbubble-ellipses-outline', color: '#25D366', packageName: 'com.whatsapp' },
  { id: 'twitter', name: 'X / Twitter', icon: 'logo-twitter', color: '#000000', packageName: 'com.twitter.android' },
  { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', color: '#FF4500', packageName: 'com.reddit.frontpage' },
  { id: 'discord', name: 'Discord', icon: 'logo-discord', color: '#5865F2', packageName: 'com.discord' },
  { id: 'telegram', name: 'Telegram', icon: 'paper-plane-outline', color: '#0088CC', packageName: 'org.telegram.messenger' },
  { id: 'netflix', name: 'Netflix', icon: 'film-outline', color: '#E50914', packageName: 'com.netflix.mediaclient' },
];
