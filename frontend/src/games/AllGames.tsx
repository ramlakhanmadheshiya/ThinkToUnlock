// 5 brain games — each with proper per-difficulty scoring, optional timer, and red/green answer feedback.
// Props: { difficulty, onComplete(scorePercent: number) }
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow, radius } from '../theme';
import { Difficulty } from '../data/games';
import { BrutalCard, BrutalButton } from '../components/Brutal';

type GameProps = { difficulty: Difficulty; onComplete: (scorePercent: number) => void };

// =====================================================================
// Shared: small countdown timer bar
// =====================================================================
const TimerBar: React.FC<{ remaining: number; total: number; danger?: boolean }> = ({ remaining, total, danger }) => {
  const pct = Math.max(0, Math.min(1, remaining / total));
  return (
    <View style={tbar.wrap}>
      <View style={[tbar.fill, { width: `${pct * 100}%`, backgroundColor: danger || pct < 0.25 ? colors.error : colors.primary }]} />
    </View>
  );
};
const tbar = StyleSheet.create({
  wrap: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999, overflow: 'hidden', marginVertical: 8 },
  fill: { height: '100%', borderRadius: 999 },
});

const InfoRow: React.FC<{ left: string; right: string }> = ({ left, right }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <Text style={{ fontWeight: '600', color: colors.textMuted, fontSize: 13 }}>{left}</Text>
    <Text style={{ fontWeight: '700', color: colors.text, fontSize: 13 }}>{right}</Text>
  </View>
);

// =====================================================================
// 1) MEMORY MATCH — score by efficiency + completion
//    Easy: 4 pairs, 60s, target moves = 6
//    Medium: 6 pairs, 90s, target moves = 10
//    Hard: 8 pairs, 120s, target moves = 14
//    Score = 50% completion + 50% efficiency (perfect = target moves or fewer)
// =====================================================================
export const MemoryMatch: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const cfg = difficulty === 'easy' ? { pairs: 4, time: 60, target: 6 }
    : difficulty === 'medium' ? { pairs: 6, time: 90, target: 10 }
    : { pairs: 8, time: 120, target: 14 };

  const totalCards = cfg.pairs * 2;

  const cards = useMemo(() => {
    const symbols = ['🔥', '⭐', '🎯', '💎', '🚀', '🎲', '⚡', '🌈'].slice(0, cfg.pairs);
    const deck = [...symbols, ...symbols].map((s, i) => ({ id: i, sym: s }));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }, [cfg.pairs]);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(cfg.time);
  const lockRef = useRef(false);
  const finishedRef = useRef(false);

  const finish = useCallback((matchedPairs: number, totalMoves: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const completion = matchedPairs / cfg.pairs; // 0-1
    const efficiency = totalMoves === 0 ? 0 : Math.min(1, cfg.target / Math.max(totalMoves, cfg.target * 0.5));
    const score = Math.round((completion * 0.5 + completion * efficiency * 0.5) * 100);
    setTimeout(() => onComplete(Math.max(0, Math.min(100, score))), 500);
  }, [cfg.pairs, cfg.target, onComplete]);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          finish(matchedIds.length / 2, moves);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [matchedIds, moves, finish]);

  useEffect(() => {
    if (matchedIds.length === totalCards) finish(cfg.pairs, moves);
  }, [matchedIds, totalCards, moves, cfg.pairs, finish]);

  const handleFlip = (idx: number) => {
    if (lockRef.current || finishedRef.current) return;
    if (flipped.includes(idx) || matchedIds.includes(idx)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;
      const [a, b] = next;
      if (cards[a].sym === cards[b].sym) {
        setTimeout(() => { setMatchedIds((m) => [...m, a, b]); setFlipped([]); lockRef.current = false; }, 400);
      } else {
        setTimeout(() => { setFlipped([]); lockRef.current = false; }, 700);
      }
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <InfoRow left={`${matchedIds.length / 2} / ${cfg.pairs} pairs`} right={`${moves} moves · target ≤${cfg.target}`} />
      <TimerBar remaining={timeLeft} total={cfg.time} danger={timeLeft < 15} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 6 }}>
        {cards.map((c, idx) => {
          const open = flipped.includes(idx) || matchedIds.includes(idx);
          const matched = matchedIds.includes(idx);
          return (
            <TouchableOpacity
              key={c.id}
              testID={`memory-card-${idx}`}
              onPress={() => handleFlip(idx)}
              activeOpacity={0.85}
              style={[mm.card, shadow.card, { backgroundColor: matched ? colors.successSoft : open ? colors.surface : colors.primary, width: '22%' }]}
            >
              <Text style={{ fontSize: 28 }}>{open ? c.sym : ''}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const mm = StyleSheet.create({
  card: { aspectRatio: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});

// =====================================================================
// 2) MATH QUIZ — per-question timer, red/green feedback
//    Easy: 8q, 25s/q, +,- range 1-15
//    Medium: 8q, 18s/q, +,-,× range 1-30
//    Hard: 8q, 12s/q, +,-,× range 1-60
// =====================================================================
export const MathQuiz: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const cfg = difficulty === 'easy' ? { qs: 8, timePerQ: 25, range: 15, ops: ['+', '-'] as const }
    : difficulty === 'medium' ? { qs: 8, timePerQ: 18, range: 30, ops: ['+', '-', '×'] as const }
    : { qs: 8, timePerQ: 12, range: 60, ops: ['+', '-', '×'] as const };

  const questions = useMemo(() => {
    const list: { a: number; b: number; op: '+' | '-' | '×'; ans: number; choices: number[] }[] = [];
    for (let i = 0; i < cfg.qs; i++) {
      const a = Math.floor(Math.random() * cfg.range) + 1;
      const b = Math.floor(Math.random() * cfg.range) + 1;
      const op = cfg.ops[Math.floor(Math.random() * cfg.ops.length)];
      const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
      const choices = new Set<number>([ans]);
      while (choices.size < 4) {
        const delta = Math.floor(Math.random() * 12) - 6;
        choices.add(ans + (delta === 0 ? 1 : delta));
      }
      const arr = Array.from(choices).sort(() => Math.random() - 0.5);
      list.push({ a, b, op, ans, choices: arr });
    }
    return list;
  }, [cfg.qs, cfg.range, cfg.ops]);

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(cfg.timePerQ);
  const finishedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((isCorrect: boolean) => {
    if (finishedRef.current) return;
    setPicked(null);
    if (idx + 1 >= cfg.qs) {
      finishedRef.current = true;
      onComplete(Math.round(((isCorrect ? correct + 1 : correct) / cfg.qs) * 100));
    } else {
      setIdx(idx + 1);
      setTimeLeft(cfg.timePerQ);
    }
  }, [idx, correct, cfg.qs, cfg.timePerQ, onComplete]);

  // per-question timer
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          // timeout = wrong
          setTimeout(() => advance(false), 200);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [idx, advance]);

  const q = questions[idx];

  const pick = (n: number) => {
    if (picked !== null || finishedRef.current) return;
    if (tickRef.current) clearInterval(tickRef.current);
    const isCorrect = n === q.ans;
    setPicked(n);
    if (isCorrect) setCorrect((c) => c + 1);
    setTimeout(() => advance(isCorrect), 800);
  };

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <InfoRow left={`Question ${idx + 1} / ${cfg.qs}`} right={`✓ ${correct}`} />
      <TimerBar remaining={timeLeft} total={cfg.timePerQ} />
      <BrutalCard style={{ alignItems: 'center', marginTop: 12, paddingVertical: 28 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.5 }}>SOLVE</Text>
        <Text style={{ fontSize: 44, fontWeight: '700', color: colors.text, letterSpacing: -1, marginTop: 6 }}>{q.a} {q.op} {q.b}</Text>
      </BrutalCard>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginTop: 14 }}>
        {q.choices.map((c, i) => {
          let bg = colors.surface;
          let fg = colors.text;
          if (picked !== null) {
            if (c === q.ans) { bg = colors.successSoft; fg = colors.success; }
            else if (c === picked) { bg = colors.errorSoft; fg = colors.error; }
          }
          return (
            <TouchableOpacity
              key={i}
              testID={`math-choice-${i}`}
              onPress={() => pick(c)}
              activeOpacity={0.85}
              disabled={picked !== null}
              style={[mq.choice, shadow.card, { backgroundColor: bg }]}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: fg }}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const mq = StyleSheet.create({
  choice: { width: '47%', aspectRatio: 2.1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});

// =====================================================================
// 3) WORD SCRAMBLE — timed unscramble
//    Easy: 3-4 letter words, 25s/round, 5 rounds
//    Medium: 5-6 letter words, 20s/round, 5 rounds
//    Hard: 7-9 letter words, 15s/round, 5 rounds
// =====================================================================
const WORDS_EASY = ['CAT', 'DOG', 'SUN', 'FISH', 'TREE', 'RAIN', 'LAMP', 'BOOK', 'STAR', 'BIRD'];
const WORDS_MED = ['FOCUS', 'BRAIN', 'POWER', 'LIGHT', 'EARTH', 'SMART', 'CLEAN', 'PROUD', 'SHARP', 'CALM'];
const WORDS_HARD = ['DISCIPLINE', 'CHALLENGE', 'KNOWLEDGE', 'MOMENTUM', 'STRATEGY', 'MINDFUL', 'DETERMINED'];

export const WordScramble: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const cfg = difficulty === 'easy' ? { rounds: 5, time: 25, pool: WORDS_EASY }
    : difficulty === 'medium' ? { rounds: 5, time: 20, pool: WORDS_MED }
    : { rounds: 5, time: 15, pool: WORDS_HARD };

  const rounds = useMemo(() => {
    const copy = [...cfg.pool];
    const picks: string[] = [];
    for (let i = 0; i < cfg.rounds; i++) {
      const j = Math.floor(Math.random() * copy.length);
      picks.push(copy.splice(j, 1)[0] || cfg.pool[i % cfg.pool.length]);
    }
    return picks.map((w) => {
      let scrambled = w;
      while (scrambled === w) scrambled = w.split('').sort(() => Math.random() - 0.5).join('');
      return { word: w, scrambled };
    });
  }, [cfg.pool, cfg.rounds]);

  const [idx, setIdx] = useState(0);
  const [letters, setLetters] = useState<string[]>([]);
  const [built, setBuilt] = useState('');
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<null | 'right' | 'wrong'>(null);
  const [timeLeft, setTimeLeft] = useState(cfg.time);
  const finishedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLetters(rounds[idx].scrambled.split(''));
    setBuilt('');
    setFeedback(null);
    setTimeLeft(cfg.time);
  }, [idx, rounds, cfg.time]);

  const advance = useCallback((didWin: boolean) => {
    if (finishedRef.current) return;
    if (idx + 1 >= cfg.rounds) {
      finishedRef.current = true;
      onComplete(Math.round(((didWin ? correct + 1 : correct) / cfg.rounds) * 100));
    } else {
      setIdx(idx + 1);
    }
  }, [idx, correct, cfg.rounds, onComplete]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (feedback) return; // pause when feedback
    tickRef.current = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          setFeedback('wrong');
          setTimeout(() => advance(false), 700);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [idx, feedback, advance]);

  const pickLetter = (i: number) => {
    if (feedback) return;
    const next = [...letters];
    const l = next[i];
    if (l === '_') return;
    next[i] = '_';
    setLetters(next);
    setBuilt((b) => b + l);
  };

  const submit = () => {
    if (feedback) return;
    const right = built === rounds[idx].word;
    setFeedback(right ? 'right' : 'wrong');
    if (right) setCorrect((c) => c + 1);
    setTimeout(() => advance(right), 800);
  };

  const reset = () => {
    if (feedback) return;
    setLetters(rounds[idx].scrambled.split(''));
    setBuilt('');
  };

  const targetBg = feedback === 'right' ? colors.successSoft : feedback === 'wrong' ? colors.errorSoft : colors.surface;
  const targetFg = feedback === 'right' ? colors.success : feedback === 'wrong' ? colors.error : colors.text;

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <InfoRow left={`Round ${idx + 1} / ${cfg.rounds}`} right={`✓ ${correct}`} />
      <TimerBar remaining={timeLeft} total={cfg.time} />
      <BrutalCard style={{ alignItems: 'center', marginTop: 8, backgroundColor: targetBg }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 }}>UNSCRAMBLE</Text>
        <Text style={{ fontSize: 30, fontWeight: '700', color: targetFg, letterSpacing: 4, marginTop: 6, minHeight: 38 }}>{built || '—'}</Text>
        {feedback === 'wrong' && <Text style={{ color: colors.error, fontWeight: '600', marginTop: 4 }}>Answer: {rounds[idx].word}</Text>}
      </BrutalCard>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        {letters.map((l, i) => (
          <TouchableOpacity
            key={i}
            testID={`word-letter-${i}`}
            disabled={l === '_' || !!feedback}
            onPress={() => pickLetter(i)}
            activeOpacity={0.85}
            style={[ws.tile, shadow.soft, { backgroundColor: l === '_' ? colors.surfaceAlt : colors.surface }]}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: l === '_' ? colors.textLight : colors.text }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <BrutalButton title="Reset" onPress={reset} variant="soft" bg={colors.surfaceAlt} fg={colors.text} testID="word-reset-btn" style={{ flex: 1 }} />
        <BrutalButton title="Submit" onPress={submit} testID="word-submit-btn" style={{ flex: 1 }} />
      </View>
    </View>
  );
};

const ws = StyleSheet.create({
  tile: { width: 48, height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});

// =====================================================================
// 4) PATTERN RECALL — repeat the flashed sequence
//    Easy: length 3, 4 rounds
//    Medium: length 5, 4 rounds
//    Hard: length 7, 4 rounds
//    Score = correctRounds / totalRounds
// =====================================================================
export const PatternRecall: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const cfg = difficulty === 'easy' ? { length: 3, rounds: 4, flashMs: 600 }
    : difficulty === 'medium' ? { length: 5, rounds: 4, flashMs: 500 }
    : { length: 7, rounds: 4, flashMs: 400 };

  const colorsList = [colors.primary, colors.success, colors.info, '#A855F7'];

  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [showing, setShowing] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [userIdx, setUserIdx] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const finishedRef = useRef(false);

  const finish = useCallback((score: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onComplete(score);
  }, [onComplete]);

  const startRound = useCallback((r: number) => {
    const newSeq: number[] = [];
    for (let i = 0; i < cfg.length; i++) newSeq.push(Math.floor(Math.random() * 4));
    setSeq(newSeq);
    setShowing(true);
    setUserIdx(0);
    let i = 0;
    const tick = () => {
      if (i >= newSeq.length) { setActive(null); setShowing(false); return; }
      setActive(newSeq[i]);
      setTimeout(() => {
        setActive(null);
        setTimeout(() => { i++; tick(); }, 200);
      }, cfg.flashMs);
    };
    setTimeout(tick, 600);
  }, [cfg.length, cfg.flashMs]);

  useEffect(() => { startRound(round); }, [round, startRound]);

  const tap = (idx: number) => {
    if (showing || finishedRef.current) return;
    setActive(idx);
    setTimeout(() => setActive(null), 120);
    if (idx === seq[userIdx]) {
      const nu = userIdx + 1;
      if (nu >= seq.length) {
        const total = correctRounds + 1;
        setCorrectRounds(total);
        if (round + 1 >= cfg.rounds) {
          setTimeout(() => finish(Math.round((total / cfg.rounds) * 100)), 400);
        } else {
          setTimeout(() => setRound(round + 1), 700);
        }
      } else {
        setUserIdx(nu);
      }
    } else {
      // round failed
      if (round + 1 >= cfg.rounds) {
        setTimeout(() => finish(Math.round((correctRounds / cfg.rounds) * 100)), 400);
      } else {
        setTimeout(() => setRound(round + 1), 700);
      }
    }
  };

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <InfoRow left={`Round ${round + 1} / ${cfg.rounds}`} right={showing ? 'WATCH' : 'REPEAT'} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <TouchableOpacity
            key={i}
            testID={`pattern-pad-${i}`}
            onPress={() => tap(i)}
            activeOpacity={0.85}
            style={[pr.pad, shadow.card, { backgroundColor: colorsList[i], opacity: active === i ? 1 : 0.4 }]}
          />
        ))}
      </View>
    </View>
  );
};

const pr = StyleSheet.create({
  pad: { width: '46%', aspectRatio: 1, borderRadius: radius.lg },
});

// =====================================================================
// 5) NUMBER SEQUENCE — pattern recognition with timer + red/green feedback
//    Easy: 6q, 20s/q, simple add patterns
//    Medium: 6q, 15s/q, add + multiply
//    Hard: 6q, 10s/q, add + multiply + squares + fib
// =====================================================================
export const NumberSequence: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const cfg = difficulty === 'easy' ? { qs: 6, timePerQ: 20, kinds: ['add'] as const }
    : difficulty === 'medium' ? { qs: 6, timePerQ: 15, kinds: ['add', 'mul'] as const }
    : { qs: 6, timePerQ: 10, kinds: ['add', 'mul', 'sq', 'fib'] as const };

  const items = useMemo(() => {
    const list: { seq: number[]; ans: number; choices: number[] }[] = [];
    for (let i = 0; i < cfg.qs; i++) {
      const kind = cfg.kinds[Math.floor(Math.random() * cfg.kinds.length)];
      let seq: number[] = [];
      let ans = 0;
      if (kind === 'add') {
        const start = Math.floor(Math.random() * 5) + 1;
        const step = Math.floor(Math.random() * 6) + 2;
        seq = [start, start + step, start + 2 * step, start + 3 * step];
        ans = start + 4 * step;
      } else if (kind === 'mul') {
        const start = Math.floor(Math.random() * 3) + 2;
        seq = [start, start * 2, start * 4, start * 8];
        ans = start * 16;
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
        const cand = ans + (Math.floor(Math.random() * 14) - 7);
        if (cand !== ans) choices.add(cand);
      }
      const arr = Array.from(choices).sort(() => Math.random() - 0.5);
      list.push({ seq, ans, choices: arr });
    }
    return list;
  }, [cfg.qs, cfg.kinds]);

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(cfg.timePerQ);
  const finishedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((isCorrect: boolean) => {
    if (finishedRef.current) return;
    setPicked(null);
    if (idx + 1 >= cfg.qs) {
      finishedRef.current = true;
      onComplete(Math.round(((isCorrect ? correct + 1 : correct) / cfg.qs) * 100));
    } else {
      setIdx(idx + 1);
      setTimeLeft(cfg.timePerQ);
    }
  }, [idx, correct, cfg.qs, cfg.timePerQ, onComplete]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          setTimeout(() => advance(false), 200);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [idx, advance]);

  const q = items[idx];
  const pick = (n: number) => {
    if (picked !== null || finishedRef.current) return;
    if (tickRef.current) clearInterval(tickRef.current);
    const isCorrect = n === q.ans;
    setPicked(n);
    if (isCorrect) setCorrect((c) => c + 1);
    setTimeout(() => advance(isCorrect), 800);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <InfoRow left={`Question ${idx + 1} / ${cfg.qs}`} right={`✓ ${correct}`} />
      <TimerBar remaining={timeLeft} total={cfg.timePerQ} />
      <BrutalCard style={{ alignItems: 'center', marginTop: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 }}>WHAT COMES NEXT?</Text>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 8, letterSpacing: 0.5 }}>{q.seq.join(', ')}, ?</Text>
      </BrutalCard>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginTop: 14 }}>
        {q.choices.map((c, i) => {
          let bg = colors.surface;
          let fg = colors.text;
          if (picked !== null) {
            if (c === q.ans) { bg = colors.successSoft; fg = colors.success; }
            else if (c === picked) { bg = colors.errorSoft; fg = colors.error; }
          }
          return (
            <TouchableOpacity
              key={i}
              testID={`number-choice-${i}`}
              onPress={() => pick(c)}
              activeOpacity={0.85}
              disabled={picked !== null}
              style={[mq.choice, shadow.card, { backgroundColor: bg }]}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: fg }}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};
