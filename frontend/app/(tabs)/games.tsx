import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, Heading, Pill } from '../../src/components/Brutal';
import { GAMES } from '../../src/data/games';
import { colors, shadow } from '../../src/theme';

export default function GamesTab() {
  const router = useRouter();

  const playRandom = () => {
    const playable = GAMES.filter((g) => g.implemented);
    const pick = playable[Math.floor(Math.random() * playable.length)];
    router.push({ pathname: '/game/[id]', params: { id: pick.id, random: '1' } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <Pill label="GAMES" bg={colors.black} fg="#fff" />
        <Heading level={1} style={{ marginTop: 10 }}>BRAIN <Text style={{ color: colors.primary }}>CHALLENGES</Text></Heading>
        <Text style={s.sub}>Pass with 60% to earn time. Pick a game and difficulty.</Text>

        <BrutalButton
          title="Random Challenge"
          onPress={playRandom}
          bg={colors.primary}
          full
          style={{ marginTop: 16 }}
          testID="random-challenge-btn"
          icon={<Ionicons name="shuffle" size={18} color="#fff" />}
        />

        <Heading level={2} style={{ marginTop: 22, marginBottom: 12 }}>ALL 20 GAMES</Heading>

        <View style={s.grid}>
          {GAMES.map((g) => (
            <TouchableOpacity
              key={g.id}
              testID={`game-card-${g.id}`}
              activeOpacity={g.implemented ? 0.85 : 0.6}
              onPress={() => g.implemented && router.push({ pathname: '/game/[id]', params: { id: g.id } })}
              style={[s.cardWrap, shadow.sm, { backgroundColor: g.implemented ? colors.surface : colors.disabled }]}
            >
              <View style={[s.iconBox, { backgroundColor: g.color }]}>
                <Text style={{ fontSize: 32 }}>{g.icon}</Text>
              </View>
              <Text style={s.gName} numberOfLines={1}>{g.name}</Text>
              <Text style={s.gDesc} numberOfLines={2}>{g.description}</Text>
              {!g.implemented && (
                <View style={s.soonPill}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 1 }}>SOON</Text>
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
  sub: { color: colors.black, fontWeight: '600', fontSize: 14, marginTop: 8, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardWrap: {
    width: '48%',
    borderWidth: 4,
    borderColor: colors.black,
    padding: 12,
    marginBottom: 14,
    minHeight: 150,
  },
  iconBox: {
    width: '100%', height: 60,
    borderWidth: 3, borderColor: colors.black,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  gName: { fontWeight: '900', fontSize: 14, color: colors.black, letterSpacing: 0.5 },
  gDesc: { fontWeight: '600', fontSize: 11, color: colors.textMuted, marginTop: 2 },
  soonPill: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: colors.black, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 2, borderColor: colors.black,
  },
});
