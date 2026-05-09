// 5 brain game implementations. Each exposes (props): { difficulty, onComplete(scorePercent: number) }
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, shadow } from '../theme';
import { Difficulty } from '../data/games';
import { BrutalCard, BrutalButton } from '../components/Brutal';

type GameProps = { difficulty: Difficulty; onComplete: (scorePercent: number) => void };

// ============================================================================
// MEMORY MATCH
// ============================================================================
export const MemoryMatch: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const pairs = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const totalCards = pairs * 2;
  const maxMoves = pairs * 3; // baseline; within this you score 100%

  const cards = useMemo(() => {
    const symbols = ['🔥', '⭐', '🎯', '💎', '🚀', '🎲', '⚡', '🌈'].slice(0, pairs);
    const deck = [...symbols, ...symbols].map((s, i) => ({ id: i, sym: s, matched: false }));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }, [pairs]);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const lockRef = useRef(false);

  useEffect(() => {
    if (matchedIds.length === totalCards) {
      // Score: 100% if moves <= maxMoves, decays beyond
      const score = Math.max(0, Math.min(100, Math.round((maxMoves / Math.max(moves, 1)) * 100)));
      setTimeout(() => onComplete(score), 600);
    }
  }, [matchedIds, totalCards, moves, maxMoves, onComplete]);

  const handleFlip = (idx: number) => {
    if (lockRef.current) return;
    if (flipped.includes(idx) || matchedIds.includes(idx)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;
      const [a, b] = next;
      if (cards[a].sym === cards[b].sym) {
        setTimeout(() => {
          setMatchedIds((m) => [...m, a, b]);
          setFlipped([]);
          lockRef.current = false;
        }, 400);
      } else {
        setTimeout(() => {
          setFlipped([]);
          lockRef.current = false;
        }, 700);
      }
    }
  };

  const cols = pairs <= 4 ? 4 : 4;
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={mmStyles.info}>MOVES: {moves} / {maxMoves}  •  PAIRS: {matchedIds.length / 2}/{pairs}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        {cards.map((c, idx) => {
          const open = flipped.includes(idx) || matchedIds.includes(idx);
          return (
            <TouchableOpacity
              key={c.id}
              testID={`memory-card-${idx}`}
              onPress={() => handleFlip(idx)}
              activeOpacity={0.85}
              style={[mmStyles.card, shadow.sm, { backgroundColor: open ? colors.yellow : colors.black, width: `${100 / cols - 4}%` }]}
            >
              <Text style={{ fontSize: 32 }}>{open ? c.sym : '?'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const mmStyles = StyleSheet.create({
  info: { fontWeight: '900', fontSize: 14, color: colors.black, marginBottom: 14, textAlign: 'center', letterSpacing: 1 },
  card: { aspectRatio: 1, borderWidth: 4, borderColor: colors.black, alignItems: 'center', justifyContent: 'center' },
});

// ============================================================================
// MATH QUIZ
// ============================================================================
export const MathQuiz: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const totalQuestions = 8;
  const questions = useMemo(() => {
    const range = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 30 : 60;
    const ops: ('+' | '-' | '×')[] = difficulty === 'easy' ? ['+', '-'] : difficulty === 'medium' ? ['+', '-', '×'] : ['+', '-', '×'];
    const list = [];
    for (let i = 0; i < totalQuestions; i++) {
      const a = Math.floor(Math.random() * range) + 1;
      const b = Math.floor(Math.random() * range) + 1;
      const op = ops[Math.floor(Math.random() * ops.length)];
      let ans = 0;
      if (op === '+') ans = a + b;
      if (op === '-') ans = a - b;
      if (op === '×') ans = a * b;
      const choices = new Set<number>([ans]);
      while (choices.size < 4) {
        const delta = Math.floor(Math.random() * 10) - 5;
        const cand = ans + delta + (delta === 0 ? 1 : 0);
        choices.add(cand);
      }
      const arr = Array.from(choices);
      for (let k = arr.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [arr[k], arr[j]] = [arr[j], arr[k]];
      }
      list.push({ a, b, op, ans, choices: arr });
    }
    return list;
  }, [difficulty]);

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<null | 'right' | 'wrong'>(null);

  const q = questions[idx];

  const pick = (n: number) => {
    if (feedback) return;
    const right = n === q.ans;
    setFeedback(right ? 'right' : 'wrong');
    if (right) setCorrect((c) => c + 1);
    setTimeout(() => {
      setFeedback(null);
      if (idx + 1 >= totalQuestions) {
        const score = Math.round(((right ? correct + 1 : correct) / totalQuestions) * 100);
        onComplete(score);
      } else {
        setIdx(idx + 1);
      }
    }, 500);
  };

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <Text style={mmStyles.info}>Q {idx + 1} / {totalQuestions}  •  CORRECT: {correct}</Text>
      <BrutalCard bg={colors.yellow} style={{ alignItems: 'center', marginBottom: 18 }}>
        <Text style={{ fontSize: 48, fontWeight: '900', color: colors.black, letterSpacing: -2 }}>
          {q.a} {q.op} {q.b}
        </Text>
      </BrutalCard>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
        {q.choices.map((c, i) => {
          const isPicked = feedback && c === q.ans;
          return (
            <TouchableOpacity
              key={i}
              testID={`math-choice-${i}`}
              onPress={() => pick(c)}
              activeOpacity={0.85}
              style={[
                mqStyles.choice,
                shadow.sm,
                { backgroundColor: isPicked ? colors.mint : feedback && c !== q.ans ? '#fff' : '#fff' },
              ]}
            >
              <Text style={{ fontSize: 24, fontWeight: '900', color: colors.black }}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const mqStyles = StyleSheet.create({
  choice: { width: '47%', aspectRatio: 2, borderWidth: 4, borderColor: colors.black, alignItems: 'center', justifyContent: 'center' },
});

// ============================================================================
// WORD SCRAMBLE
// ============================================================================
const WORDS_EASY = ['CAT', 'DOG', 'SUN', 'BOOK', 'FISH', 'TREE', 'RAIN', 'LAMP'];
const WORDS_MED = ['FOCUS', 'BRAIN', 'POWER', 'LIGHT', 'EARTH', 'SMART', 'CLEAN', 'PROUD'];
const WORDS_HARD = ['DISCIPLINE', 'CHALLENGE', 'KNOWLEDGE', 'MOMENTUM', 'STRATEGY', 'MINDFUL'];

export const WordScramble: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const totalRounds = 5;
  const pool = difficulty === 'easy' ? WORDS_EASY : difficulty === 'medium' ? WORDS_MED : WORDS_HARD;

  const rounds = useMemo(() => {
    const picks: string[] = [];
    const copy = [...pool];
    for (let i = 0; i < totalRounds; i++) {
      const j = Math.floor(Math.random() * copy.length);
      picks.push(copy.splice(j, 1)[0] || pool[Math.floor(Math.random() * pool.length)]);
    }
    return picks.map((w) => ({
      word: w,
      scrambled: w.split('').sort(() => Math.random() - 0.5).join(''),
    }));
  }, [pool]);

  const [idx, setIdx] = useState(0);
  const [letters, setLetters] = useState<string[]>([]);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<null | 'right' | 'wrong'>(null);

  useEffect(() => {
    setLetters(rounds[idx].scrambled.split(''));
  }, [idx, rounds]);

  const pickLetter = (i: number) => {
    if (feedback) return;
    const next = [...letters];
    next[i] = '_';
    setLetters(next);
    setBuilt((b) => b + rounds[idx].scrambled[i]);
  };

  const [built, setBuilt] = useState('');

  const submit = () => {
    if (feedback) return;
    const right = built === rounds[idx].word;
    setFeedback(right ? 'right' : 'wrong');
    if (right) setCorrect((c) => c + 1);
    setTimeout(() => {
      setFeedback(null);
      setBuilt('');
      if (idx + 1 >= totalRounds) {
        const score = Math.round(((right ? correct + 1 : correct) / totalRounds) * 100);
        onComplete(score);
      } else {
        setIdx(idx + 1);
      }
    }, 700);
  };

  const reset = () => {
    setLetters(rounds[idx].scrambled.split(''));
    setBuilt('');
  };

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <Text style={mmStyles.info}>ROUND {idx + 1} / {totalRounds}  •  SOLVED: {correct}</Text>
      <BrutalCard bg={feedback === 'right' ? colors.mint : feedback === 'wrong' ? colors.primary : colors.yellow} style={{ alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: colors.black, letterSpacing: 2 }}>UNSCRAMBLE</Text>
        <Text style={{ fontSize: 36, fontWeight: '900', color: colors.black, letterSpacing: 4, marginTop: 8 }}>{built || '—'}</Text>
      </BrutalCard>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        {letters.map((l, i) => (
          <TouchableOpacity
            key={i}
            testID={`word-letter-${i}`}
            disabled={l === '_'}
            onPress={() => pickLetter(i)}
            activeOpacity={0.85}
            style={[wsStyles.tile, shadow.sm, { backgroundColor: l === '_' ? colors.disabled : '#fff' }]}
          >
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.black }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <BrutalButton title="Reset" onPress={reset} bg={colors.surface} fg={colors.black} testID="word-reset-btn" />
        <BrutalButton title="Submit" onPress={submit} testID="word-submit-btn" />
      </View>
    </View>
  );
};

const wsStyles = StyleSheet.create({
  tile: { width: 50, height: 56, borderWidth: 4, borderColor: colors.black, alignItems: 'center', justifyContent: 'center' },
});

// ============================================================================
// PATTERN RECALL
// ============================================================================
export const PatternRecall: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const seqLen = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const totalRounds = 4;
  const colorsList = [colors.primary, colors.mint, colors.yellow, colors.blue];

  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [showing, setShowing] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [userIdx, setUserIdx] = useState(0);
  const [correct, setCorrect] = useState(0);

  const startRound = (r: number) => {
    const newSeq: number[] = [];
    for (let i = 0; i < seqLen; i++) newSeq.push(Math.floor(Math.random() * 4));
    setSeq(newSeq);
    setShowing(true);
    setUserIdx(0);
    let i = 0;
    const tick = () => {
      if (i >= newSeq.length) {
        setActive(null);
        setShowing(false);
        return;
      }
      setActive(newSeq[i]);
      setTimeout(() => {
        setActive(null);
        setTimeout(() => {
          i++;
          tick();
        }, 200);
      }, 500);
    };
    setTimeout(tick, 600);
  };

  useEffect(() => { startRound(round); /* eslint-disable-line */ }, [round]);

  const tap = (idx: number) => {
    if (showing) return;
    setActive(idx);
    setTimeout(() => setActive(null), 150);
    if (idx === seq[userIdx]) {
      const nu = userIdx + 1;
      if (nu >= seq.length) {
        // round won
        setCorrect((c) => c + 1);
        if (round + 1 >= totalRounds) {
          setTimeout(() => onComplete(Math.round(((correct + 1) / totalRounds) * 100)), 400);
        } else {
          setTimeout(() => setRound(round + 1), 600);
        }
      } else {
        setUserIdx(nu);
      }
    } else {
      // round failed
      if (round + 1 >= totalRounds) {
        setTimeout(() => onComplete(Math.round((correct / totalRounds) * 100)), 400);
      } else {
        setTimeout(() => setRound(round + 1), 600);
      }
    }
  };

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <Text style={mmStyles.info}>ROUND {round + 1} / {totalRounds}  •  {showing ? 'WATCH' : 'REPEAT'}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <TouchableOpacity
            key={i}
            testID={`pattern-pad-${i}`}
            onPress={() => tap(i)}
            activeOpacity={0.85}
            style={[
              prStyles.pad,
              shadow.sm,
              { backgroundColor: colorsList[i], opacity: active === i ? 1 : 0.55 },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const prStyles = StyleSheet.create({
  pad: { width: '46%', aspectRatio: 1, borderWidth: 4, borderColor: colors.black },
});

// ============================================================================
// NUMBER SEQUENCE
// ============================================================================
export const NumberSequence: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const total = 6;
  const items = useMemo(() => {
    const list: { seq: number[]; ans: number; choices: number[] }[] = [];
    for (let i = 0; i < total; i++) {
      let kind = ['add', 'mul', 'sq', 'fib'][Math.floor(Math.random() * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 4))];
      let seq: number[] = [];
      let ans = 0;
      if (kind === 'add') {
        const start = Math.floor(Math.random() * 5) + 1;
        const step = Math.floor(Math.random() * (difficulty === 'easy' ? 5 : 9)) + 2;
        seq = [start, start + step, start + 2 * step, start + 3 * step];
        ans = start + 4 * step;
      } else if (kind === 'mul') {
        const start = Math.floor(Math.random() * 3) + 2;
        const f = 2;
        seq = [start, start * f, start * f * f, start * f * f * f];
        ans = start * f * f * f * f;
      } else if (kind === 'sq') {
        const s = Math.floor(Math.random() * 4) + 2;
        seq = [s * s, (s + 1) * (s + 1), (s + 2) * (s + 2), (s + 3) * (s + 3)];
        ans = (s + 4) * (s + 4);
      } else {
        seq = [1, 1, 2, 3, 5];
        ans = 8;
      }
      const choices = new Set<number>([ans]);
      while (choices.size < 4) {
        choices.add(ans + (Math.floor(Math.random() * 14) - 7) || ans + 1);
      }
      const arr = Array.from(choices).sort(() => Math.random() - 0.5);
      list.push({ seq, ans, choices: arr });
    }
    return list;
  }, [difficulty]);

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<null | 'right' | 'wrong'>(null);

  const q = items[idx];

  const pick = (n: number) => {
    if (feedback) return;
    const right = n === q.ans;
    setFeedback(right ? 'right' : 'wrong');
    if (right) setCorrect((c) => c + 1);
    setTimeout(() => {
      setFeedback(null);
      if (idx + 1 >= total) {
        onComplete(Math.round(((right ? correct + 1 : correct) / total) * 100));
      } else {
        setIdx(idx + 1);
      }
    }, 500);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={mmStyles.info}>Q {idx + 1} / {total}  •  CORRECT: {correct}</Text>
      <BrutalCard bg={colors.mint} style={{ alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: colors.black, letterSpacing: 2 }}>WHAT COMES NEXT?</Text>
        <Text style={{ fontSize: 32, fontWeight: '900', color: colors.black, marginTop: 8, letterSpacing: 1 }}>
          {q.seq.join(', ')}, ?
        </Text>
      </BrutalCard>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
        {q.choices.map((c, i) => (
          <TouchableOpacity
            key={i}
            testID={`number-choice-${i}`}
            onPress={() => pick(c)}
            activeOpacity={0.85}
            style={[mqStyles.choice, shadow.sm, { backgroundColor: '#fff' }]}
          >
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.black }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};
