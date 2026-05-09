import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton, BrutalCard, Heading, Pill } from '../../src/components/Brutal';
import { GAMES, DIFFICULTY_REWARD, PASS_THRESHOLD, Difficulty, QUOTES_WIN, QUOTES_LOSS } from '../../src/data/games';
import { useAppState } from '../../src/store/StateContext';
import { colors, shadow } from '../../src/theme';
import { MemoryMatch, MathQuiz, WordScramble, PatternRecall, NumberSequence } from '../../src/games/AllGames';

type Stage = 'start' | 'play' | 'win' | 'loss';

export default function GamePage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = GAMES.find((g) => g.id === id);
  const { addWalletMinutes, recordHistory, incrementDailyChallenges } = useAppState();

  const [stage, setStage] = useState<Stage>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState(0);

  if (!game) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 18 }}>
          <Heading>Unknown game</Heading>
          <BrutalButton title="Back" onPress={() => router.back()} style={{ marginTop: 14 }} />
        </View>
      </SafeAreaView>
    );
  }

  const handleComplete = async (s: number) => {
    setScore(s);
    if (s >= PASS_THRESHOLD) {
      const reward = DIFFICULTY_REWARD[difficulty];
      await addWalletMinutes(reward);
      await incrementDailyChallenges();
      await recordHistory({ gameId: game.id, gameName: game.name, difficulty, minutesAdded: reward, passed: true });
      setStage('win');
    } else {
      await recordHistory({ gameId: game.id, gameName: game.name, difficulty, minutesAdded: 0, passed: false });
      setStage('loss');
    }
  };

  // ----------- START SCREEN ----------- //
  if (stage === 'start') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 18 }}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} testID="game-back-btn">
            <Ionicons name="arrow-back" size={20} color={colors.black} />
            <Text style={s.backTxt}>BACK</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <View style={[s.logoBox, { backgroundColor: game.color }]}>
              <Text style={{ fontSize: 56 }}>{game.icon}</Text>
            </View>
            <Heading level={1} style={{ textAlign: 'center', marginTop: 16 }}>{game.name}</Heading>
            <Text style={s.proveText}>
              <Text style={{ fontWeight: '900' }}>Prove you're focused.</Text> Score at least <Text style={{ color: colors.primary, fontWeight: '900' }}>60%</Text> to pass and unlock your app.
            </Text>
          </View>

          <Heading level={2} style={{ marginTop: 22 }}>DIFFICULTY</Heading>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
              const active = difficulty === d;
              const bg = d === 'easy' ? colors.mint : d === 'medium' ? colors.yellow : colors.primary;
              const fg = d === 'hard' ? '#fff' : colors.black;
              return (
                <TouchableOpacity
                  key={d}
                  testID={`difficulty-${d}`}
                  activeOpacity={0.85}
                  onPress={() => setDifficulty(d)}
                  style={[s.diff, shadow.sm, { backgroundColor: active ? bg : colors.surface, transform: active ? [{ translateX: 0 }] : [{ translateX: 0 }] }]}
                >
                  <Text style={{ fontWeight: '900', color: active ? fg : colors.black, fontSize: 13, letterSpacing: 1 }}>{d.toUpperCase()}</Text>
                  <Text style={{ fontWeight: '900', color: active ? fg : colors.textMuted, fontSize: 11, marginTop: 4 }}>+{DIFFICULTY_REWARD[d]} MIN</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <BrutalCard bg={colors.black} style={{ marginTop: 18 }}>
            <Text style={{ color: '#fff', fontWeight: '900', letterSpacing: 1, fontSize: 12 }}>REWARD ON PASS</Text>
            <Text style={{ color: colors.yellow, fontWeight: '900', fontSize: 36, marginTop: 4 }}>+{DIFFICULTY_REWARD[difficulty]} MIN</Text>
            <Text style={{ color: '#fff', fontWeight: '700', marginTop: 4 }}>added to your time wallet</Text>
          </BrutalCard>

          <BrutalButton
            title="Start Challenge"
            onPress={() => setStage('play')}
            full
            style={{ marginTop: 22 }}
            bg={colors.primary}
            testID="start-challenge-btn"
            icon={<Ionicons name="play" size={18} color="#fff" />}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----------- PLAY ----------- //
  if (stage === 'play') {
    let GameComp: React.FC<any> = MemoryMatch;
    if (game.id === 'math') GameComp = MathQuiz;
    else if (game.id === 'word') GameComp = WordScramble;
    else if (game.id === 'pattern') GameComp = PatternRecall;
    else if (game.id === 'number') GameComp = NumberSequence;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 }}>
          <Pill label={game.name} bg={colors.black} fg="#fff" />
          <Pill label={difficulty} bg={difficulty === 'easy' ? colors.mint : difficulty === 'medium' ? colors.yellow : colors.primary} fg={difficulty === 'hard' ? '#fff' : colors.black} />
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => setStage('start')} testID="play-back-btn">
            <Ionicons name="close" size={26} color={colors.black} />
          </TouchableOpacity>
        </View>
        <GameComp difficulty={difficulty} onComplete={handleComplete} key={`${game.id}-${difficulty}`} />
      </SafeAreaView>
    );
  }

  // ----------- WIN / LOSS ----------- //
  const won = stage === 'win';
  const quote = won
    ? QUOTES_WIN[Math.floor(Math.random() * QUOTES_WIN.length)]
    : QUOTES_LOSS[Math.floor(Math.random() * QUOTES_LOSS.length)];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, alignItems: 'center' }}>
        <View style={[s.logoBox, { backgroundColor: won ? colors.mint : colors.primary, marginTop: 16 }]}>
          <Ionicons name={won ? 'trophy' : 'flame'} size={64} color={colors.black} />
        </View>
        <Heading level={1} style={{ textAlign: 'center', marginTop: 16 }}>
          {won ? 'CHALLENGE PASSED!' : "DON'T QUIT,"}
        </Heading>
        {!won && <Heading level={1} style={{ textAlign: 'center', color: colors.primary }}>ALMOST THERE.</Heading>}

        <BrutalCard bg={won ? colors.yellow : colors.black} style={{ marginTop: 18, alignSelf: 'stretch', alignItems: 'center' }}>
          <Text style={{ fontWeight: '900', fontSize: 14, color: won ? colors.black : '#fff', letterSpacing: 2 }}>YOUR SCORE</Text>
          <Text testID="result-score-text" style={{ fontWeight: '900', fontSize: 80, color: won ? colors.black : '#fff', letterSpacing: -3 }}>{score}%</Text>
          {won && <Text style={{ fontWeight: '900', fontSize: 14, color: colors.primary, marginTop: 4 }}>+{DIFFICULTY_REWARD[difficulty]} MIN ADDED</Text>}
        </BrutalCard>

        <BrutalCard style={{ marginTop: 14, alignSelf: 'stretch' }}>
          <Text style={{ fontStyle: 'italic', fontWeight: '700', fontSize: 16, color: colors.black, textAlign: 'center' }}>"{quote}"</Text>
        </BrutalCard>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, alignSelf: 'stretch' }}>
          <BrutalButton
            title={won ? 'Play Again' : 'Try Again'}
            onPress={() => setStage('start')}
            bg={colors.primary}
            full
            style={{ flex: 1 }}
            testID="result-again-btn"
          />
          <BrutalButton
            title="Back to Home"
            onPress={() => router.replace('/(tabs)/home')}
            bg={colors.black}
            fg="#fff"
            full
            style={{ flex: 1 }}
            testID="result-home-btn"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backTxt: { fontWeight: '900', color: colors.black, letterSpacing: 1 },
  logoBox: {
    width: 130, height: 130,
    borderWidth: 4, borderColor: colors.black,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8,
  },
  proveText: { color: colors.black, fontWeight: '600', fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  diff: { flex: 1, borderWidth: 4, borderColor: colors.black, paddingVertical: 14, alignItems: 'center' },
});
