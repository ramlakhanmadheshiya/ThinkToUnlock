export type GameMeta = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  implemented: boolean;
  rules?: string;
  markCalculation?: string;
};

export const GAMES: GameMeta[] = [
  { 
    id: 'memory', 
    name: 'Memory Match', 
    icon: 'layers-outline', 
    color: '#FDE047', 
    description: 'Flip cards. Find pairs.', 
    implemented: true,
    rules: 'Flip cards to find matching pairs. The fewer moves you take, the higher your score. Complete before time runs out.',
    markCalculation: 'Score = 50% completion + 50% efficiency. Perfect efficiency = target moves or fewer per difficulty.'
  },
  { 
    id: 'math', 
    name: 'Math Quiz', 
    icon: 'calculator-outline', 
    color: '#A3E635', 
    description: 'Solve equations fast.', 
    implemented: true,
    rules: 'Solve as many math problems as you can in the time limit. Select the correct answer from multiple choices.',
    markCalculation: 'Score = (Correct answers / Total problems) × 100. All correct problems count equally.'
  },
  { 
    id: 'word', 
    name: 'Word Scramble', 
    icon: 'text-outline', 
    color: '#60A5FA', 
    description: 'Unscramble the word.', 
    implemented: true,
    rules: 'Rearrange scrambled letters to form correct words. Answer quickly and accurately.',
    markCalculation: 'Score = (Correct words / Total words) × 100. Time bonuses awarded for fast answers.'
  },
  { 
    id: 'pattern', 
    name: 'Pattern Recall', 
    icon: 'apps-outline', 
    color: '#F9A8D4', 
    description: 'Repeat the sequence.', 
    implemented: true,
    rules: 'Watch the color sequence and repeat it correctly. Each level adds one more color to remember.',
    markCalculation: 'Score = (Levels completed / Max levels) × 100. Points awarded for each correct sequence.'
  },
  { 
    id: 'number', 
    name: 'Number Sequence', 
    icon: 'list-outline', 
    color: '#E04D36', 
    description: 'What comes next?', 
    implemented: true,
    rules: 'Find the pattern in the sequence and predict the next number. Complete as many as possible.',
    markCalculation: 'Score = (Correct predictions / Total questions) × 100. Complex patterns earn bonus points.'
  },
  { id: 'sudoku', name: 'Mini Sudoku', icon: 'grid-outline', color: '#FDE047', description: 'Coming soon.', implemented: false },
  { id: 'chess', name: 'Chess Puzzle', icon: 'game-controller-outline', color: '#A3E635', description: 'Coming soon.', implemented: false },
  { id: 'logic', name: 'Logic Grid', icon: 'git-network-outline', color: '#60A5FA', description: 'Coming soon.', implemented: false },
  { id: 'spot', name: 'Spot Difference', icon: 'eye-outline', color: '#F9A8D4', description: 'Coming soon.', implemented: false },
  { id: 'trivia', name: 'Trivia', icon: 'help-circle-outline', color: '#E04D36', description: 'Coming soon.', implemented: false },
  { id: 'reaction', name: 'Reaction Time', icon: 'flash-outline', color: '#FDE047', description: 'Coming soon.', implemented: false },
  { id: 'typing', name: 'Speed Typing', icon: 'keyboard-outline', color: '#A3E635', description: 'Coming soon.', implemented: false },
  { id: 'maze', name: 'Maze Runner', icon: 'navigate-outline', color: '#60A5FA', description: 'Coming soon.', implemented: false },
  { id: 'paint', name: 'Color Paint', icon: 'color-palette-outline', color: '#F9A8D4', description: 'Coming soon.', implemented: false },
  { id: 'simon', name: 'Simon Says', icon: 'radio-button-on-outline', color: '#E04D36', description: 'Coming soon.', implemented: false },
  { id: 'flag', name: 'Flag Quiz', icon: 'flag-outline', color: '#FDE047', description: 'Coming soon.', implemented: false },
  { id: 'anagram', name: 'Anagram', icon: 'text-outline', color: '#A3E635', description: 'Coming soon.', implemented: false },
  { id: 'shape', name: 'Shape Match', icon: 'ellipse-outline', color: '#60A5FA', description: 'Coming soon.', implemented: false },
  { id: 'tile', name: 'Slide Tile', icon: 'grid-outline', color: '#F9A8D4', description: 'Coming soon.', implemented: false },
  { id: 'odd', name: 'Odd One Out', icon: 'ellipse-outline', color: '#E04D36', description: 'Coming soon.', implemented: false },
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
