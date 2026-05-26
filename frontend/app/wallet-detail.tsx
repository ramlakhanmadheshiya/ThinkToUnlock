import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '../src/components/Icon';
import { BrutalButton, BrutalCard, Heading } from '../src/components/Brutal';
import { useAppState } from '../src/store/StateContext';
import { GAMES } from '../src/data/games';
import { colors, shadow, radius } from '../src/theme';

export default function WalletDetail() {
  const router = useRouter();
  const { state, installedApps } = useAppState();

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  type FilterType = 'All' | 'Wins' | 'Losses' | 'Top-Ups' | 'Refunds' | 'Easy' | 'Medium' | 'Hard';
  const [filter, setFilter] = useState<FilterType>('All');
  const FILTERS: FilterType[] = ['All', 'Wins', 'Losses', 'Top-Ups', 'Refunds', 'Easy', 'Medium', 'Hard'];

  const filteredHistory = useMemo(() => {
    return state.history.filter(h => {
      if (filter === 'All') return true;
      if (filter === 'Wins') return !h.gameId.startsWith('wallet') && h.passed;
      if (filter === 'Losses') return !h.gameId.startsWith('wallet') && !h.passed;
      if (filter === 'Top-Ups') return h.gameId === 'wallet-add';
      if (filter === 'Refunds') return h.gameId === 'wallet-sub';
      if (filter === 'Easy') return h.difficulty === 'easy';
      if (filter === 'Medium') return h.difficulty === 'medium';
      if (filter === 'Hard') return h.difficulty === 'hard';
      return true;
    });
  }, [state.history, filter]);

  const counts = useMemo(() => ({
    All: state.history.length,
    Wins: state.history.filter(h => !h.gameId.startsWith('wallet') && h.passed).length,
    Losses: state.history.filter(h => !h.gameId.startsWith('wallet') && !h.passed).length,
    'Top-Ups': state.history.filter(h => h.gameId === 'wallet-add').length,
    Refunds: state.history.filter(h => h.gameId === 'wallet-sub').length,
    Easy: state.history.filter(h => h.difficulty === 'easy').length,
    Medium: state.history.filter(h => h.difficulty === 'medium').length,
    Hard: state.history.filter(h => h.difficulty === 'hard').length,
  }), [state.history]);

  const getAppIcon = (gameName: string) => {
    const app = installedApps.find(a => a.name === gameName);
    return app;
  };

  const getGameIcon = (gameId: string) => {
    const game = GAMES.find(g => g.id === gameId);
    return game;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} testID="wallet-back-btn" activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>

        <View style={[s.walletHero, shadow.raised]}>
          <View style={s.walletGlow} />
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '500', fontSize: 13 }}>Time Wallet</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 60, letterSpacing: -2, lineHeight: 64 }}>{state.timeWalletMinutes}</Text>
            <Text style={{ color: '#fff', fontWeight: '500', fontSize: 18, marginLeft: 8, opacity: 0.85 }}>min</Text>
          </View>
        </View>

        <BrutalButton
          title="Add more time — Play Game"
          onPress={() => router.replace('/(tabs)/games')}
          full
          style={{ marginTop: 18 }}
          testID="wallet-add-time-btn"
          icon={<Ionicons name="flash" size={18} color="#fff" />}
        />

        <Text style={s.section}>History</Text>
        <Text style={s.sub}>Last 200 plays</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f} 
              onPress={() => setFilter(f)} 
              activeOpacity={0.7}
              style={[s.filterPill, filter === f && s.filterPillActive]}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f} ({counts[f]})</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredHistory.length === 0 ? (
          <BrutalCard style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: '500', color: colors.textMuted }}>No history found for this filter.</Text>
          </BrutalCard>
        ) : (
          filteredHistory.map((h) => {
            const isWalletTx = h.gameId.startsWith('wallet');
            const app = isWalletTx ? getAppIcon(h.gameName) : null;
            const game = !isWalletTx ? getGameIcon(h.gameId) : null;
            
            return (
              <View key={h.id} style={[s.row, shadow.card]} testID={`history-row-${h.id}`}>
                <View style={[s.iconBox, { backgroundColor: isWalletTx ? (h.gameId === 'wallet-add' ? colors.successSoft : colors.warnSoft) : (h.passed ? colors.successSoft : colors.errorSoft) }]}>
                  {isWalletTx ? (
                    app && app.icon.startsWith('data:image') ? (
                      <Image source={{ uri: app.icon }} style={{ width: 28, height: 28, borderRadius: 6 }} />
                    ) : app ? (
                      <Ionicons name={app.icon as any} size={18} color={app.color} />
                    ) : (
                      <Ionicons name={h.gameId === 'wallet-sub' ? 'arrow-undo' : 'arrow-redo'} size={18} color={h.gameId === 'wallet-add' ? colors.success : colors.warn} />
                    )
                  ) : game && game.icon ? (
                    <Ionicons name={game.icon as any} size={22} color={game.color} />
                  ) : (
                    <Ionicons name={h.passed ? 'checkmark' : 'close'} size={18} color={h.passed ? colors.success : colors.error} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>{h.gameName}</Text>
                  <Text style={{ fontWeight: '500', color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {h.gameId.startsWith('wallet') ? `${h.difficulty} · ${h.minutesAdded > 0 ? '+' : ''}${h.minutesAdded} min` : `${h.difficulty} · ${h.passed ? `+${h.minutesAdded} min` : 'Failed'}`}
                  </Text>
                </View>
                <Text style={{ fontWeight: '600', color: colors.textMuted, fontSize: 12 }}>{fmtTime(h.timestamp)}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  walletHero: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 22, marginTop: 16, overflow: 'hidden' },
  walletGlow: { position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FF7A56', opacity: 0.6 },
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 26 },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    marginTop: 10,
  },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: 'transparent' },
  filterPillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: colors.primary },
});
