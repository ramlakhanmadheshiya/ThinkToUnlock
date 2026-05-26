import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { BrutalButton, BrutalCard, Heading } from '../../src/components/Brutal';
import { GAMES, DIFFICULTY_REWARD, Difficulty, QUOTES_WIN, QUOTES_LOSS } from '../../src/data/games';
import { useAppState } from '../../src/store/StateContext';
import { colors, shadow, radius } from '../../src/theme';
import { MemoryMatch, MathQuiz, WordScramble, PatternRecall, NumberSequence } from '../../src/games/AllGames';

type Stage = 'start' | 'rules' | 'play' | 'win' | 'loss';

export default function GamePage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = GAMES.find((g) => g.id === id);
  const { state, addWalletMinutes, recordHistory, incrementDailyChallenges } = useAppState();

  const [stage, setStage] = useState<Stage>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState(0);
  const [showRulesModal, setShowRulesModal] = useState(false);

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

  const handleComplete = async (sc: number) => {
    setScore(sc);
    const passThreshold = state.isPremium ? state.passRatePercent : 60;
    if (sc >= passThreshold) {
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

  // ----- START -----
  if (stage === 'start') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 18 }}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} testID="game-back-btn" activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={s.backTxt}>Back</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 18 }}>
            <View style={[s.logoBox, { backgroundColor: game.color + '22' }]}>
              <Ionicons name={game.icon as any} size={50} color={game.color} />
            </View>
            <Heading level={1} style={{ textAlign: 'center', marginTop: 18 }}>{game.name}</Heading>
            <Text style={s.proveText}>
              Prove you're focused. Score at least <Text style={{ color: colors.primary, fontWeight: '700' }}>{state.isPremium ? state.passRatePercent : 60}%</Text> to pass and unlock your app.
            </Text>
          </View>

          <Text style={s.section}>Choose difficulty</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
              const active = difficulty === d;
              return (
                <TouchableOpacity
                  key={d}
                  testID={`difficulty-${d}`}
                  activeOpacity={0.85}
                  onPress={() => setDifficulty(d)}
                  style={[s.diff, shadow.card, active && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                >
                  <Text style={[s.diffName, active && { color: colors.primary }]}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text>
                  <Text style={[s.diffMins, active && { color: colors.primary }]}>+{DIFFICULTY_REWARD[d]} min</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <BrutalCard style={{ marginTop: 16, backgroundColor: colors.text }}>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '500', fontSize: 12, letterSpacing: 0.5 }}>REWARD ON PASS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 36, letterSpacing: -1 }}>+{DIFFICULTY_REWARD[difficulty]}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginLeft: 6 }}>min added to wallet</Text>
            </View>
          </BrutalCard>

          <BrutalButton
            title="Show Rules"
            onPress={() => setStage('rules')}
            full
            style={{ marginTop: 22 }}
            testID="show-rules-btn"
            variant="soft"
            bg={colors.surfaceAlt}
            fg={colors.text}
            icon={<Ionicons name="help-circle" size={18} color={colors.text} />}
          />

          <BrutalButton
            title="Start Challenge"
            onPress={() => setStage('play')}
            full
            style={{ marginTop: 12 }}
            testID="start-challenge-btn"
            icon={<Ionicons name="play" size={18} color="#fff" />}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- RULES -----
  if (stage === 'rules') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
          <TouchableOpacity onPress={() => setStage('start')} style={s.backBtn} testID="rules-back-btn" activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={s.backTxt}>Back</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 18 }}>
            <View style={[s.logoBox, { backgroundColor: game.color + '22' }]}>
              <Ionicons name={game.icon as any} size={50} color={game.color} />
            </View>
            <Heading level={1} style={{ textAlign: 'center', marginTop: 18 }}>{game.name}</Heading>
          </View>

          <BrutalCard style={{ marginTop: 18 }}>
            <Text style={s.section}>How to Play</Text>
            <Text style={{ color: colors.text, fontWeight: '500', fontSize: 14, lineHeight: 21, marginTop: 10 }}>
              {game.rules || 'Instructions coming soon.'}
            </Text>
          </BrutalCard>

          <BrutalCard style={{ marginTop: 14 }}>
            <Text style={s.section}>Mark Calculation</Text>
            <Text style={{ color: colors.text, fontWeight: '500', fontSize: 14, lineHeight: 21, marginTop: 10 }}>
              {game.markCalculation || 'Scoring details coming soon.'}
            </Text>
          </BrutalCard>

          <BrutalCard style={{ marginTop: 14, backgroundColor: colors.infoSoft }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={{ color: colors.info, fontWeight: '600', fontSize: 13, flex: 1, lineHeight: 18 }}>
                Score at least {state.isPremium ? state.passRatePercent : 60}% to pass and earn {DIFFICULTY_REWARD[difficulty]} minutes.
              </Text>
            </View>
          </BrutalCard>

          <BrutalButton
            title="Ready to Play"
            onPress={() => setStage('play')}
            full
            style={{ marginTop: 22 }}
            testID="ready-btn"
            icon={<Ionicons name="play" size={18} color="#fff" />}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- PLAY -----
  if (stage === 'play') {
    let GameComp: React.FC<{ difficulty: Difficulty; onComplete: (n: number) => void }> = MemoryMatch;
    if (game.id === 'math') GameComp = MathQuiz;
    else if (game.id === 'word') GameComp = WordScramble;
    else if (game.id === 'pattern') GameComp = PatternRecall;
    else if (game.id === 'number') GameComp = NumberSequence;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 16 }}>{game.name}</Text>
            <View style={s.diffPill}><Text style={s.diffPillText}>{difficulty}</Text></View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setShowRulesModal(true)} testID="play-rules-btn" activeOpacity={0.7} style={s.infoBtn}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStage('start')} testID="play-back-btn" activeOpacity={0.7} style={s.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <GameComp difficulty={difficulty} onComplete={handleComplete} key={`${game.id}-${difficulty}-${stage}`} />
          </View>
        </View>

        <Modal visible={showRulesModal} transparent animationType="fade" onRequestClose={() => setShowRulesModal(false)}>
          <TouchableWithoutFeedback onPress={() => setShowRulesModal(false)}>
            <View style={s.rulesModalBg}>
              <TouchableWithoutFeedback>
                <ScrollView contentContainerStyle={[s.rulesModal, shadow.raised]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Heading level={2}>Rules & Scoring</Heading>
                    <TouchableOpacity onPress={() => setShowRulesModal(false)} activeOpacity={0.7}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15, marginBottom: 8 }}>How to Play</Text>
                      <Text style={{ color: colors.text, fontWeight: '500', fontSize: 13, lineHeight: 20 }}>
                        {game.rules || 'Instructions coming soon.'}
                      </Text>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
                      <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15, marginBottom: 8 }}>Mark Calculation</Text>
                      <Text style={{ color: colors.text, fontWeight: '500', fontSize: 13, lineHeight: 20 }}>
                        {game.markCalculation || 'Scoring details coming soon.'}
                      </Text>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
                      <Text style={{ fontWeight: '700', color: colors.primary, fontSize: 15, marginBottom: 8 }}>Your Target</Text>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                        Score at least <Text style={{ color: colors.primary }}>{state.isPremium ? state.passRatePercent : 60}%</Text> to pass and earn <Text style={{ color: colors.success }}>{DIFFICULTY_REWARD[difficulty]} minutes</Text>
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    );
  }

  // ----- WIN / LOSS -----
  const won = stage === 'win';
  const quote = won
    ? QUOTES_WIN[Math.floor(Math.random() * QUOTES_WIN.length)]
    : QUOTES_LOSS[Math.floor(Math.random() * QUOTES_LOSS.length)];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, alignItems: 'center', paddingBottom: 30 }}>
        <View style={[s.logoBox, { backgroundColor: won ? colors.successSoft : colors.errorSoft, marginTop: 18 }]}>
          <Ionicons name={won ? 'trophy' : 'flame'} size={56} color={won ? colors.success : colors.error} />
        </View>
        <Heading level={1} style={{ textAlign: 'center', marginTop: 18 }}>
          {won ? 'Challenge passed!' : "Don't quit, almost there."}
        </Heading>

        <View style={[s.scoreCard, shadow.raised, { marginTop: 20, backgroundColor: won ? colors.success : colors.text }]}>
          <Text style={{ fontWeight: '600', fontSize: 12, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 }}>YOUR SCORE</Text>
          <Text testID="result-score-text" style={{ fontWeight: '700', fontSize: 70, color: '#fff', letterSpacing: -2 }}>{score}%</Text>
          {won && <Text style={{ fontWeight: '600', fontSize: 14, color: '#fff' }}>+{DIFFICULTY_REWARD[difficulty]} minutes added</Text>}
        </View>

        <BrutalCard style={{ marginTop: 14, alignSelf: 'stretch' }}>
          <Text style={{ fontStyle: 'italic', fontWeight: '500', fontSize: 15, color: colors.text, textAlign: 'center', lineHeight: 22 }}>"{quote}"</Text>
        </BrutalCard>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, alignSelf: 'stretch' }}>
          <BrutalButton title={won ? 'Play Again' : 'Try Again'} onPress={() => setStage('start')} full style={{ flex: 1 }} testID="result-again-btn" />
          <BrutalButton title="Back to Home" onPress={() => router.replace('/(tabs)/home')} variant="soft" bg={colors.surfaceAlt} fg={colors.text} full style={{ flex: 1 }} testID="result-home-btn" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backTxt: { fontWeight: '600', color: colors.text, fontSize: 14 },
  logoBox: { width: 120, height: 120, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  proveText: { color: colors.textMuted, fontWeight: '500', fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 21, paddingHorizontal: 16 },
  section: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 26, marginBottom: 10 },
  diff: { flex: 1, borderRadius: radius.lg, padding: 14, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 2, borderColor: 'transparent' },
  diffName: { fontWeight: '600', fontSize: 14, color: colors.text },
  diffMins: { fontWeight: '500', fontSize: 12, color: colors.textMuted, marginTop: 3 },

  diffPill: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  diffPillText: { color: colors.primary, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  infoBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.infoSoft, alignItems: 'center', justifyContent: 'center' },
  rulesModalBg: { flex: 1, backgroundColor: 'rgba(15,15,15,0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  rulesModal: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 380 },

  scoreCard: { width: '100%', borderRadius: radius.xl, padding: 22, alignItems: 'center' },
});
