import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrutalCard, BrutalButton, BrutalIconButton, Heading, Pill } from '../../src/components/Brutal';
import { useAppState } from '../../src/store/StateContext';
import { MOCK_APPS } from '../../src/data/mockApps';
import { colors, shadow } from '../../src/theme';

export default function HomeTab() {
  const router = useRouter();
  const { state } = useAppState();
  const [warnApp, setWarnApp] = useState<string | null>(null);

  const lockedApps = useMemo(
    () => MOCK_APPS.filter((a) => state.apps[a.id]?.locked),
    [state.apps]
  );

  const totalAppMinutes = Object.values(state.apps).reduce((s, a) => s + Math.floor(a.timeRemainingSec / 60), 0);

  const onAppOpen = (appId: string) => {
    const cfg = state.apps[appId];
    if (!cfg) return;
    if (cfg.timeRemainingSec <= 0) {
      setWarnApp(appId);
      return;
    }
    router.push({ pathname: '/app-locked', params: { appId } });
  };

  const warnAppData = warnApp ? MOCK_APPS.find((a) => a.id === warnApp) : null;
  const walletEmpty = state.timeWalletMinutes === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Pill label="Home" bg={colors.primary} fg="#fff" testID="home-pill" />
          <Pill label={`${state.dailyChallengesCompleted} done today`} bg={colors.yellow} testID="daily-challenges-pill" />
        </View>
        <Heading level={1} style={{ marginTop: 10 }}>STAY <Text style={{ color: colors.primary }}>FOCUSED.</Text></Heading>

        {/* Time Wallet hero */}
        <TouchableOpacity
          testID="time-wallet-card"
          activeOpacity={0.9}
          onPress={() => router.push('/wallet-detail')}
          style={{ marginTop: 18 }}
        >
          <BrutalCard bg={colors.primary}>
            <Text style={s.walletLabel}>TIME WALLET</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
              <Text style={s.walletNum} testID="wallet-minutes-text">{state.timeWalletMinutes}</Text>
              <Text style={s.walletUnit}>min</Text>
            </View>
            <Text style={s.walletHint}>Tap to add time or view history →</Text>
          </BrutalCard>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          <BrutalCard style={{ flex: 1 }} bg={colors.yellow}>
            <Text style={s.statLabel}>CHALLENGES</Text>
            <Text style={s.statNum}>{state.dailyChallengesCompleted}</Text>
          </BrutalCard>
          <BrutalCard style={{ flex: 1 }} bg={colors.mint}>
            <Text style={s.statLabel}>APP TIME</Text>
            <Text style={s.statNum}>{totalAppMinutes}m</Text>
          </BrutalCard>
        </View>

        {/* Locked Apps */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
          <Heading level={2}>LOCKED APPS</Heading>
          <Text style={{ fontWeight: '900', color: colors.textMuted, fontSize: 12 }}>{lockedApps.length} APPS</Text>
        </View>

        {lockedApps.length === 0 ? (
          <BrutalCard>
            <Text style={{ fontWeight: '700', color: colors.black }}>No apps locked yet. Go to MANAGE tab to lock distracting apps.</Text>
          </BrutalCard>
        ) : (
          lockedApps.map((app) => (
            <AppCard key={app.id} appId={app.id} appName={app.name} icon={app.icon} color={app.color} onOpen={() => onAppOpen(app.id)} />
          ))
        )}

        <BrutalButton
          title="Earn Time → Play Brain Game"
          onPress={() => router.push('/(tabs)/games')}
          bg={colors.black}
          fg="#fff"
          full
          style={{ marginTop: 22 }}
          testID="earn-time-cta-btn"
          icon={<Ionicons name="flash" size={18} color="#fff" />}
        />
      </ScrollView>

      {/* Warning modal when opening app with no time */}
      <Modal visible={!!warnApp} transparent animationType="fade" onRequestClose={() => setWarnApp(null)}>
        <View style={s.modalBg}>
          <BrutalCard bg={colors.background} style={{ width: '88%' }} testID="no-time-modal">
            <Pill label="NO TIME" bg={colors.primary} fg="#fff" />
            <Heading level={2} style={{ marginTop: 8 }}>{warnAppData?.name} is locked</Heading>
            <Text style={s.modalText}>
              {walletEmpty
                ? 'Time wallet is empty. Play a brain game to earn time.'
                : `You have ${state.timeWalletMinutes} min in your wallet. Add time to this app or play a game to earn more.`}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <BrutalButton title="Play Game" onPress={() => { setWarnApp(null); router.push('/(tabs)/games'); }} bg={colors.mint} fg={colors.black} testID="warn-play-game-btn" style={{ flex: 1 }} />
              <BrutalButton title="Close" onPress={() => setWarnApp(null)} bg={colors.surface} fg={colors.black} testID="warn-close-btn" style={{ flex: 1 }} />
            </View>
          </BrutalCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const AppCard: React.FC<{ appId: string; appName: string; icon: string; color: string; onOpen: () => void }> = ({ appId, appName, icon, color, onOpen }) => {
  const { state, consumeWalletMinutesToApp, refundAppMinutesToWallet } = useAppState();
  const cfg = state.apps[appId];
  const mins = Math.floor(cfg.timeRemainingSec / 60);
  const secs = cfg.timeRemainingSec % 60;

  const add = async () => {
    const ok = await consumeWalletMinutesToApp(appId, 5);
    if (!ok) Alert.alert('Wallet empty', 'Earn more time by playing a brain game.');
  };
  const sub = async () => {
    if (cfg.timeRemainingSec < 60) {
      Alert.alert('Nothing to refund', 'No time has been added to this app.');
      return;
    }
    await refundAppMinutesToWallet(appId, 5);
  };

  return (
    <View style={[s.appCard, shadow.default]} testID={`app-card-${appId}`}>
      <TouchableOpacity activeOpacity={0.8} onPress={onOpen} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} testID={`app-open-${appId}`}>
        <View style={[s.appIcon, { backgroundColor: color }]}>
          <Text style={{ fontSize: 28 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.appName}>{appName}</Text>
          <Text style={s.appTime} testID={`app-time-${appId}`}>
            {cfg.timeRemainingSec > 0 ? `${mins}m ${secs}s left` : 'No time'}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <BrutalIconButton label="−" onPress={sub} bg={colors.surface} testID={`app-minus-${appId}`} />
        <BrutalIconButton label="+" onPress={add} bg={colors.yellow} testID={`app-plus-${appId}`} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  walletLabel: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  walletNum: { color: '#fff', fontWeight: '900', fontSize: 84, letterSpacing: -4, lineHeight: 90 },
  walletUnit: { color: '#fff', fontWeight: '900', fontSize: 22, marginLeft: 8 },
  walletHint: { color: '#fff', fontWeight: '700', marginTop: 6, opacity: 0.9 },
  statLabel: { fontSize: 11, fontWeight: '900', color: colors.black, letterSpacing: 1 },
  statNum: { fontSize: 30, fontWeight: '900', color: colors.black, marginTop: 4, letterSpacing: -1 },
  appCard: {
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.black,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appIcon: {
    width: 56, height: 56,
    borderWidth: 3, borderColor: colors.black,
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontWeight: '900', color: colors.black, fontSize: 16, letterSpacing: 0.5 },
  appTime: { fontWeight: '700', color: colors.textMuted, fontSize: 13, marginTop: 2 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  modalText: { fontWeight: '600', color: colors.black, marginTop: 10, fontSize: 15, lineHeight: 22 },
});
