// 5 brain games — each with proper per-difficulty scoring, optional timer, and red/green answer feedback.
// Props: { difficulty, onComplete(scorePercent: number) }
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '../components/Icon';
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

const TimerReadout: React.FC<{ remaining: number; total: number }> = ({ remaining, total }) => {
  const pct = Math.max(0, Math.min(1, remaining / total));
  return (
    <View style={ui.timerWrap}>
      <View style={ui.timerRow}>
        <Text style={ui.timerLabel}>Time left</Text>
        <View style={[ui.timerChip, { backgroundColor: pct < 0.25 ? colors.errorSoft : colors.primarySoft }]}>
          <Text style={[ui.timerChipText, { color: pct < 0.25 ? colors.error : colors.primary }]}>{remaining}s</Text>
        </View>
      </View>
      <TimerBar remaining={remaining} total={total} danger={remaining < 15} />
    </View>
  );
};

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
    const symbols = ['flame', 'star', 'trophy', 'rocket', 'gift-outline', 'flash', 'heart', 'sunny'].slice(0, cfg.pairs);
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
    <ScrollView contentContainerStyle={ui.screenScroll} showsVerticalScrollIndicator={false}>
      <BrutalCard style={ui.heroCard}>
        <Text style={ui.kicker}>MEMORY MATCH</Text>
        <Text style={ui.heroTitle}>Match the pairs before the timer runs out</Text>
        <View style={ui.statRow}>
          <View style={ui.statChip}><Text style={ui.statChipText}>{matchedIds.length / 2}/{cfg.pairs} pairs</Text></View>
          <View style={ui.statChip}><Text style={ui.statChipText}>{moves} moves</Text></View>
          <View style={ui.statChip}><Text style={ui.statChipText}>target ≤{cfg.target}</Text></View>
        </View>
      </BrutalCard>
      <TimerReadout remaining={timeLeft} total={cfg.time} />
      <View style={ui.memoryGrid}>
        {cards.map((c, idx) => {
          const open = flipped.includes(idx) || matchedIds.includes(idx);
          const matched = matchedIds.includes(idx);
          return (
            <TouchableOpacity
              key={c.id}
              testID={`memory-card-${idx}`}
              onPress={() => handleFlip(idx)}
              activeOpacity={0.85}
              style={[mm.card, shadow.card, { backgroundColor: matched ? colors.successSoft : open ? colors.surface : colors.primary, borderColor: open ? colors.primarySoft : 'transparent' }]}
            >
              {open ? <Ionicons name={c.sym as any} size={24} color={colors.text} /> : <Ionicons name="grid-outline" size={22} color="#fff" />}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const mm = StyleSheet.create({
  card: { aspectRatio: 1, width: '23%', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});

// =====================================================================
// 2) MATH QUIZ — per-question timer, red/green feedback
//    Easy: 8q, 25s/q, +,- range 1-15
//    Medium: 8q, 18s/q, +,-,× range 1-30
//    Hard: 8q, 12s/q, +,-,× range 1-60
// =====================================================================
export const MathQuiz: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const questions = useMemo(() => {
    const cfg = difficulty === 'easy' ? { qs: 8, timePerQ: 25, range: 15, ops: ['+', '-'] as const }
      : difficulty === 'medium' ? { qs: 8, timePerQ: 18, range: 30, ops: ['+', '-', '×'] as const }
      : { qs: 8, timePerQ: 12, range: 60, ops: ['+', '-', '×'] as const };

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
  }, [difficulty]);

  const cfg = difficulty === 'easy' ? { qs: 8, timePerQ: 25 } : difficulty === 'medium' ? { qs: 8, timePerQ: 18 } : { qs: 8, timePerQ: 12 };

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
    <ScrollView contentContainerStyle={ui.screenScroll} showsVerticalScrollIndicator={false}>
      <BrutalCard style={ui.heroCard}>
        <Text style={ui.kicker}>MATH QUIZ</Text>
        <Text style={ui.heroTitle}>Solve fast to keep the streak alive</Text>
        <View style={ui.statRow}>
          <View style={ui.statChip}><Text style={ui.statChipText}>Q {idx + 1}/{cfg.qs}</Text></View>
          <View style={ui.statChip}><Text style={ui.statChipText}>✓ {correct}</Text></View>
        </View>
      </BrutalCard>
      <TimerReadout remaining={timeLeft} total={cfg.timePerQ} />
      <BrutalCard style={ui.questionCard}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 }}>SOLVE</Text>
        <Text style={ui.questionText}>{q.a} {q.op} {q.b}</Text>
      </BrutalCard>
      <View style={ui.choiceGrid}>
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
              <Text style={ui.choiceText}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const mq = StyleSheet.create({
  choice: { width: '48%', minHeight: 86, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
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
  const rounds = useMemo(() => {
    const cfg = difficulty === 'easy' ? { rounds: 5, time: 25, pool: WORDS_EASY }
      : difficulty === 'medium' ? { rounds: 5, time: 20, pool: WORDS_MED }
      : { rounds: 5, time: 15, pool: WORDS_HARD };

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
  }, [difficulty]);

  const cfg = difficulty === 'easy' ? { rounds: 5, time: 25 } : difficulty === 'medium' ? { rounds: 5, time: 20 } : { rounds: 5, time: 15 };

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
    <ScrollView contentContainerStyle={ui.screenScroll} showsVerticalScrollIndicator={false}>
      <BrutalCard style={ui.heroCard}>
        <Text style={ui.kicker}>WORD SCRAMBLE</Text>
        <Text style={ui.heroTitle}>Build the word before the clock ends</Text>
        <View style={ui.statRow}>
          <View style={ui.statChip}><Text style={ui.statChipText}>Round {idx + 1}/{cfg.rounds}</Text></View>
          <View style={ui.statChip}><Text style={ui.statChipText}>✓ {correct}</Text></View>
        </View>
      </BrutalCard>
      <TimerReadout remaining={timeLeft} total={cfg.time} />
      <BrutalCard style={[ui.questionCard, { backgroundColor: targetBg }]}> 
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 }}>YOUR ANSWER</Text>
        <Text style={[ui.wordAnswer, { color: targetFg }]}>{built || '—'}</Text>
        {feedback === 'wrong' && <Text style={{ color: colors.error, fontWeight: '600', marginTop: 4 }}>Answer: {rounds[idx].word}</Text>}
      </BrutalCard>
      <BrutalCard style={ui.letterBank}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 }}>LETTER BANK</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10 }}>
          {letters.map((l, i) => (
          <TouchableOpacity
            key={i}
            testID={`word-letter-${i}`}
            disabled={l === '_' || !!feedback}
            onPress={() => pickLetter(i)}
            activeOpacity={0.85}
            style={[ws.tile, shadow.soft, { backgroundColor: l === '_' ? colors.surfaceAlt : colors.surface }]}
          >
            <Text style={ui.letterText}>{l}</Text>
          </TouchableOpacity>
          ))}
        </View>
      </BrutalCard>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <BrutalButton title="Reset" onPress={reset} variant="soft" bg={colors.surfaceAlt} fg={colors.text} testID="word-reset-btn" style={{ flex: 1 }} />
        <BrutalButton title="Submit" onPress={submit} testID="word-submit-btn" style={{ flex: 1 }} />
      </View>
    </ScrollView>
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
    <ScrollView contentContainerStyle={ui.screenScroll} showsVerticalScrollIndicator={false}>
      <BrutalCard style={ui.heroCard}>
        <Text style={ui.kicker}>PATTERN RECALL</Text>
        <Text style={ui.heroTitle}>{showing ? 'Watch the sequence' : 'Repeat the pattern'}</Text>
        <View style={ui.statRow}>
          <View style={ui.statChip}><Text style={ui.statChipText}>Round {round + 1}/{cfg.rounds}</Text></View>
          <View style={ui.statChip}><Text style={ui.statChipText}>{showing ? 'WATCH' : 'REPEAT'}</Text></View>
        </View>
      </BrutalCard>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <TouchableOpacity
            key={i}
            testID={`pattern-pad-${i}`}
            onPress={() => tap(i)}
            activeOpacity={0.85}
            style={[pr.pad, shadow.card, { backgroundColor: colorsList[i], opacity: active === i ? 1 : 0.45 }]}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const pr = StyleSheet.create({
  pad: { width: '45%', aspectRatio: 1.1, borderRadius: radius.lg },
});

// =====================================================================
// 5) NUMBER SEQUENCE — pattern recognition with timer + red/green feedback
//    Easy: 6q, 20s/q, simple add patterns
//    Medium: 6q, 15s/q, add + multiply
//    Hard: 6q, 10s/q, add + multiply + squares + fib
// =====================================================================
export const NumberSequence: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const items = useMemo(() => {
    const cfg = difficulty === 'easy' ? { qs: 6, timePerQ: 20, kinds: ['add'] as const }
      : difficulty === 'medium' ? { qs: 6, timePerQ: 15, kinds: ['add', 'mul'] as const }
      : { qs: 6, timePerQ: 10, kinds: ['add', 'mul', 'sq', 'fib'] as const };

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
  }, [difficulty]);

  const cfg = difficulty === 'easy' ? { qs: 6, timePerQ: 20 } : difficulty === 'medium' ? { qs: 6, timePerQ: 15 } : { qs: 6, timePerQ: 10 };

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
    <ScrollView contentContainerStyle={ui.screenScroll} showsVerticalScrollIndicator={false}>
      <BrutalCard style={ui.heroCard}>
        <Text style={ui.kicker}>NUMBER SEQUENCE</Text>
        <Text style={ui.heroTitle}>Spot the rule and pick the next value</Text>
        <View style={ui.statRow}>
          <View style={ui.statChip}><Text style={ui.statChipText}>Q {idx + 1}/{cfg.qs}</Text></View>
          <View style={ui.statChip}><Text style={ui.statChipText}>✓ {correct}</Text></View>
        </View>
      </BrutalCard>
      <TimerReadout remaining={timeLeft} total={cfg.timePerQ} />
      <BrutalCard style={ui.questionCard}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 }}>WHAT COMES NEXT?</Text>
        <View style={ui.sequencePill}><Text style={ui.sequenceText}>{q.seq.join('   •   ')}</Text></View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary, marginTop: 10 }}>?</Text>
      </BrutalCard>
      <View style={ui.choiceGrid}>
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
              <Text style={ui.choiceText}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const ui = StyleSheet.create({
  screenScroll: { padding: 16, paddingBottom: 26, gap: 12 },
  heroCard: { padding: 16, gap: 10 },
  kicker: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3, lineHeight: 28 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statChip: { backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statChipText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  timerWrap: { gap: 8 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerLabel: { color: colors.textMuted, fontWeight: '700', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  timerChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  timerChipText: { fontWeight: '800', fontSize: 12, letterSpacing: 0.2 },
  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  questionCard: { alignItems: 'center', gap: 8, paddingVertical: 18 },
  questionText: { fontSize: 38, fontWeight: '800', color: colors.text, letterSpacing: -1, textAlign: 'center' },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 12 },
  choiceText: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', width: '100%' },
  wordAnswer: { fontSize: 32, fontWeight: '800', letterSpacing: 4, marginTop: 6, minHeight: 40, textAlign: 'center' },
  letterBank: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  letterText: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sequencePill: { backgroundColor: colors.surfaceAlt, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, alignSelf: 'stretch', marginTop: 8 },
  sequenceText: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', letterSpacing: 0.5 },
});
