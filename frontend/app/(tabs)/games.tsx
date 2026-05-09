import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../src/components/Icon';
import { BrutalButton, Heading } from '../../src/components/Brutal';
import { GAMES } from '../../src/data/games';
import { colors, shadow, radius } from '../../src/theme';

export default function GamesTab() {
  const router = useRouter();

  const playRandom = () => {
    const playable = GAMES.filter((g) => g.implemented);
    const pick = playable[Math.floor(Math.random() * playable.length)];
    router.push({ pathname: '/game/[id]', params: { id: pick.id, random: '1' } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <View style={{ marginBottom: 16 }}>
          <Heading level={1}>Brain Challenges</Heading>
          <Text style={s.sub}>Pass with 60% to earn time. Pick a game and difficulty.</Text>
        </View>

        <BrutalButton
          title="Random Challenge"
          onPress={playRandom}
          full
          style={{ marginBottom: 22 }}
          testID="random-challenge-btn"
          icon={<Ionicons name="shuffle" size={18} color="#fff" />}
        />

        <Text style={s.section}>All Games</Text>

        <View style={s.grid}>
          {GAMES.map((g) => (
            <TouchableOpacity
              key={g.id}
              testID={`game-card-${g.id}`}
              activeOpacity={g.implemented ? 0.8 : 0.6}
              onPress={() => g.implemented && router.push({ pathname: '/game/[id]', params: { id: g.id } })}
              style={[s.cardWrap, shadow.card, !g.implemented && { opacity: 0.55 }]}
            >
              <View style={[s.iconBox, { backgroundColor: g.color + '22' }]}>
                <Text style={{ fontSize: 30 }}>{g.icon}</Text>
              </View>
              <Text style={s.gName} numberOfLines={1}>{g.name}</Text>
              <Text style={s.gDesc} numberOfLines={2}>{g.description}</Text>
              {!g.implemented && (
                <View style={s.soonPill}>
                  <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 9, letterSpacing: 0.5 }}>SOON</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  sub: { color: colors.textMuted, fontWeight: '500', fontSize: 14, marginTop: 6, lineHeight: 20 },
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardWrap: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 14,
    minHeight: 150,
  },
  iconBox: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  gName: { fontWeight: '600', fontSize: 14, color: colors.text },
  gDesc: { fontWeight: '500', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  soonPill: { position: 'absolute', top: 10, right: 10, backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
});
