export type GameMeta = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  implemented: boolean;
};

export const GAMES: GameMeta[] = [
  { id: 'memory', name: 'Memory Match', icon: '🧠', color: '#FDE047', description: 'Flip cards. Find pairs.', implemented: true },
  { id: 'math', name: 'Math Quiz', icon: '➗', color: '#A3E635', description: 'Solve equations fast.', implemented: true },
  { id: 'word', name: 'Word Scramble', icon: '🔤', color: '#60A5FA', description: 'Unscramble the word.', implemented: true },
  { id: 'pattern', name: 'Pattern Recall', icon: '🟦', color: '#F9A8D4', description: 'Repeat the sequence.', implemented: true },
  { id: 'number', name: 'Number Sequence', icon: '🔢', color: '#E04D36', description: 'What comes next?', implemented: true },
  { id: 'sudoku', name: 'Mini Sudoku', icon: '#️⃣', color: '#FDE047', description: 'Coming soon.', implemented: false },
  { id: 'chess', name: 'Chess Puzzle', icon: '♞', color: '#A3E635', description: 'Coming soon.', implemented: false },
  { id: 'logic', name: 'Logic Grid', icon: '🧩', color: '#60A5FA', description: 'Coming soon.', implemented: false },
  { id: 'spot', name: 'Spot Difference', icon: '👀', color: '#F9A8D4', description: 'Coming soon.', implemented: false },
  { id: 'trivia', name: 'Trivia', icon: '❓', color: '#E04D36', description: 'Coming soon.', implemented: false },
  { id: 'reaction', name: 'Reaction Time', icon: '⚡', color: '#FDE047', description: 'Coming soon.', implemented: false },
  { id: 'typing', name: 'Speed Typing', icon: '⌨️', color: '#A3E635', description: 'Coming soon.', implemented: false },
  { id: 'maze', name: 'Maze Runner', icon: '🌀', color: '#60A5FA', description: 'Coming soon.', implemented: false },
  { id: 'paint', name: 'Color Paint', icon: '🎨', color: '#F9A8D4', description: 'Coming soon.', implemented: false },
  { id: 'simon', name: 'Simon Says', icon: '🟢', color: '#E04D36', description: 'Coming soon.', implemented: false },
  { id: 'flag', name: 'Flag Quiz', icon: '🚩', color: '#FDE047', description: 'Coming soon.', implemented: false },
  { id: 'anagram', name: 'Anagram', icon: '🔡', color: '#A3E635', description: 'Coming soon.', implemented: false },
  { id: 'shape', name: 'Shape Match', icon: '🔺', color: '#60A5FA', description: 'Coming soon.', implemented: false },
  { id: 'tile', name: 'Slide Tile', icon: '🔳', color: '#F9A8D4', description: 'Coming soon.', implemented: false },
  { id: 'odd', name: 'Odd One Out', icon: '🎯', color: '#E04D36', description: 'Coming soon.', implemented: false },
];

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_REWARD: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

export const PASS_THRESHOLD = 60; // percent

export const QUOTES_WIN = [
  'Discipline = freedom.',
  'Mind sharp. Phone tamed.',
  'You earned this.',
  'Focus is the new flex.',
  'One brain, zero scroll.',
];

export const QUOTES_LOSS = [
  'Tough loss. Sharper next.',
  'Brains beat boredom.',
  'Try again. Beat yesterday.',
  'Almost. Stay locked in.',
  'Not over. One more rep.',
];
