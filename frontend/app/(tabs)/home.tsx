import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../src/components/Icon';
import { BrutalCard, BrutalButton, BrutalIconButton, Heading } from '../../src/components/Brutal';
import { useAppState } from '../../src/store/StateContext';
import { MOCK_APPS } from '../../src/data/mockApps';
import { inFocusWindow } from '../../src/store/storage';
import { colors, shadow, radius } from '../../src/theme';

type WarnKind = 'open-no-time' | 'plus-no-wallet' | 'quota' | 'focus' | null;

export default function HomeTab() {
  const router = useRouter();
  const { state } = useAppState();
  const [warn, setWarn] = useState<{ kind: WarnKind; appId?: string }>({ kind: null });

  const lockedApps = useMemo(() => MOCK_APPS.filter((a) => state.apps[a.id]?.locked), [state.apps]);
  const closeWarn = () => setWarn({ kind: null });

  const quotaBlocks = (appId: string) =>
    state.isPremium &&
    state.minDailyChallenges > 0 &&
    state.dailyChallengesCompleted < state.minDailyChallenges &&
    !state.quotaExcludeApps.includes(appId);

  const onAppOpen = (appId: string) => {
    const cfg = state.apps[appId];
    if (!cfg) return;
    if (quotaBlocks(appId)) { setWarn({ kind: 'quota', appId }); return; }
    const total = cfg.timeRemainingSec + cfg.dailyTopupSec + cfg.weeklyTopupSec;
    if (total <= 0) { setWarn({ kind: 'open-no-time', appId }); return; }
    router.push({ pathname: '/app-locked', params: { appId } });
  };

  const onTryAdd = (appId: string) => {
    if (state.isPremium && inFocusWindow(state, appId)) { setWarn({ kind: 'focus', appId }); return false; }
    if (state.timeWalletMinutes <= 0) { setWarn({ kind: 'plus-no-wallet', appId }); return false; }
    return true;
  };

  const warnApp = warn.appId ? MOCK_APPS.find((a) => a.id === warn.appId) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <View style={s.appBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={s.brandDot}><Ionicons name="shield-checkmark" size={18} color={colors.primary} /></View>
            <Text style={s.appName}>ThinkToUnlock</Text>
          </View>
          <Text style={s.greeting}>Stay focused.</Text>
        </View>

        <TouchableOpacity testID="time-wallet-card" activeOpacity={0.92} onPress={() => router.push('/wallet-detail')} style={[s.walletCard, shadow.raised]}>
          <View style={s.walletGlow} />
          <Text style={s.walletLabel}>Time Wallet</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
            <Text style={s.walletNum} testID="wallet-minutes-text">{state.timeWalletMinutes}</Text>
            <Text style={s.walletUnit}>min</Text>
          </View>
          <View style={s.walletFooter}>
            <Text style={s.walletHint}>Tap to add time or view history</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {state.isPremium && state.minDailyChallenges > 0 && (
          <BrutalCard style={{ marginTop: 14, backgroundColor: state.dailyChallengesCompleted >= state.minDailyChallenges ? colors.successSoft : colors.warnSoft }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="trophy-outline" size={20} color={state.dailyChallengesCompleted >= state.minDailyChallenges ? colors.success : colors.warn} />
              <Text style={{ fontWeight: '600', color: colors.text, fontSize: 13, flex: 1 }}>
                Daily quota: {state.dailyChallengesCompleted} / {state.minDailyChallenges} challenges
              </Text>
            </View>
          </BrutalCard>
        )}

        <BrutalButton
          title="Earn Time — Play Brain Game"
          onPress={() => router.push('/(tabs)/games')}
          full
          style={{ marginTop: 16 }}
          testID="earn-time-cta-btn"
          icon={<Ionicons name="flash" size={18} color="#fff" />}
        />

        <View style={s.sectionHeader}>
          <Heading level={2}>Locked Apps</Heading>
          <Text style={s.sectionMeta}>{lockedApps.length} apps</Text>
        </View>

        {lockedApps.length === 0 ? (
          <BrutalCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={s.emptyIcon}><Ionicons name="shield-outline" size={20} color={colors.textMuted} /></View>
              <Text style={{ flex: 1, fontWeight: '500', color: colors.textMuted, fontSize: 14 }}>
                No apps locked yet. Open the Manage tab to choose which apps to lock.
              </Text>
            </View>
          </BrutalCard>
        ) : (
          lockedApps.map((app) => (
            <AppCard
              key={app.id}
              appId={app.id}
              appName={app.name}
              icon={app.icon}
              color={app.color}
              onOpen={() => onAppOpen(app.id)}
              guardAdd={() => onTryAdd(app.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Universal warn modal */}
      <Modal visible={warn.kind !== null} transparent animationType="fade" onRequestClose={closeWarn}>
        <TouchableWithoutFeedback onPress={closeWarn}>
          <View style={s.modalBg}>
            <TouchableWithoutFeedback>
              <View style={[s.modalCard, shadow.raised]} testID="wallet-warn-modal">
                <View style={s.modalIcon}>
                  <Ionicons name={warn.kind === 'focus' ? 'school-outline' : warn.kind === 'quota' ? 'trophy-outline' : 'alert-circle'} size={26} color={colors.primary} />
                </View>
                <Heading level={2} style={{ marginTop: 12 }}>
                  {warn.kind === 'plus-no-wallet' ? 'Time wallet is empty'
                    : warn.kind === 'quota' ? 'Complete your daily challenges'
                    : warn.kind === 'focus' ? 'Strict Focus Mode active'
                    : `${warnApp?.name ?? 'App'} is locked`}
                </Heading>
                <Text style={s.modalText}>
                  {warn.kind === 'plus-no-wallet' ? 'Your time wallet is at 0. Play a brain game to earn more time before adding it to apps.'
                    : warn.kind === 'quota' ? `Pass ${state.minDailyChallenges - state.dailyChallengesCompleted} more challenge(s) before opening ${warnApp?.name ?? 'this app'}.`
                    : warn.kind === 'focus' ? `${warnApp?.name ?? 'This app'} is in Strict Focus Mode. Time you earn now stays in your wallet — usable when focus hours end.`
                    : `You don't have any time on ${warnApp?.name ?? 'this app'}. Play a brain game to earn time, or add minutes from your wallet.`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                  <BrutalButton title="Cancel" onPress={closeWarn} variant="soft" bg={colors.surfaceAlt} fg={colors.text} style={{ flex: 1 }} testID="warn-cancel-btn" />
                  <BrutalButton title="Play Game" onPress={() => { closeWarn(); router.push('/(tabs)/games'); }} style={{ flex: 1 }} testID="warn-play-game-btn" />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const AppCard: React.FC<{
  appId: string; appName: string; icon: string; color: string;
  onOpen: () => void; guardAdd: () => boolean;
}> = ({ appId, appName, icon, color, onOpen, guardAdd }) => {
  const { state, consumeWalletMinutesToApp, refundAppMinutesToWallet } = useAppState();
  const cfg = state.apps[appId];
  const totalSec = cfg.timeRemainingSec + cfg.dailyTopupSec + cfg.weeklyTopupSec;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;

  const add = async () => { if (!guardAdd()) return; await consumeWalletMinutesToApp(appId, 5); };
  const sub = async () => { if (cfg.timeRemainingSec < 60) return; await refundAppMinutesToWallet(appId, 5); };

  const breakdown = (cfg.dailyTopupSec > 0 || cfg.weeklyTopupSec > 0) ? [
    cfg.timeRemainingSec > 0 ? `${Math.floor(cfg.timeRemainingSec / 60)}m wallet` : null,
    cfg.dailyTopupSec > 0 ? `${Math.floor(cfg.dailyTopupSec / 60)}m daily` : null,
    cfg.weeklyTopupSec > 0 ? `${Math.floor(cfg.weeklyTopupSec / 60)}m weekly` : null,
  ].filter(Boolean).join(' · ') : null;

  return (
    <View style={[s.appCard, shadow.card]} testID={`app-card-${appId}`}>
      <TouchableOpacity activeOpacity={0.7} onPress={onOpen} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} testID={`app-open-${appId}`}>
        <View style={[s.appIcon, { backgroundColor: color + '22' }]}><Text style={{ fontSize: 26 }}>{icon}</Text></View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.appNameTxt}>{appName}</Text>
          <Text style={[s.appTime, totalSec > 0 ? { color: colors.success } : null]} testID={`app-time-${appId}`}>
            {totalSec > 0 ? `${mins}m ${secs}s remaining` : 'No time'}
          </Text>
          {breakdown && <Text style={s.breakdown}>{breakdown}</Text>}
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <BrutalIconButton onPress={sub} bg={colors.surfaceAlt} testID={`app-minus-${appId}`} disabled={cfg.timeRemainingSec < 60}>
          <Ionicons name="remove" size={20} color={cfg.timeRemainingSec < 60 ? colors.textLight : colors.text} />
        </BrutalIconButton>
        <BrutalIconButton onPress={add} bg={colors.primary} testID={`app-plus-${appId}`}>
          <Ionicons name="add" size={20} color="#fff" />
        </BrutalIconButton>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  appBar: { marginBottom: 18 },
  brandDot: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  greeting: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.6, marginTop: 14 },
  walletCard: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 22, overflow: 'hidden' },
  walletGlow: { position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FF7A56', opacity: 0.6 },
  walletLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: '500', fontSize: 13, letterSpacing: 0.3 },
  walletNum: { color: '#fff', fontWeight: '700', fontSize: 64, letterSpacing: -2, lineHeight: 70 },
  walletUnit: { color: '#fff', fontWeight: '500', fontSize: 18, marginLeft: 8, opacity: 0.85 },
  walletFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  walletHint: { color: '#fff', fontWeight: '500', opacity: 0.9, fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionMeta: { fontWeight: '500', color: colors.textMuted, fontSize: 13 },
  emptyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  appCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  appIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  appNameTxt: { fontWeight: '600', fontSize: 15, color: colors.text },
  appTime: { fontWeight: '500', color: colors.textMuted, fontSize: 13, marginTop: 2 },
  breakdown: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 380 },
  modalIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  modalText: { fontWeight: '500', color: colors.textMuted, marginTop: 8, fontSize: 14, lineHeight: 21 },
});
