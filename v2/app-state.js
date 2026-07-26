const state = {
  citations: [],
  citationGroups: new Map(),
  includedCitations: new Map(),
  totalWords: 0,
  citationWords: 0,
  totalChars: 0,
  citationChars: 0,
  settings: {
    autoSave: true,
    warnLeave: true,
    spellCheck: true,
    focus: false,
    simplifiedMode: false,
    wordsNoCitations: true,
    charsNoCitations: true,
    wordsWithCitations: true,
    charsWithCitations: true,
    citations: true,
    fontSize: 16,
    fontFamily: 'system-ui',
    defaultCitationStyle: 'mla',
    // Counter display settings
    counters: {
      wordsNoCitations: { enabled: true, order: 0, shortName: 'Words without Citations', tooltip: 'Words without Citations' },
      wordsWithCitations: { enabled: true, order: 1, shortName: 'Total Words', tooltip: 'Total Words' },
      charsNoCitations: { enabled: true, order: 2, shortName: 'Characters without Citations', tooltip: 'Characters without Citations' },
      charsWithCitations: { enabled: true, order: 3, shortName: 'Total Characters', tooltip: 'Total Characters' },
      citations: { enabled: true, order: 4, shortName: 'Citations', tooltip: 'Citations' },
      speakingTime: { enabled: false, order: 5, shortName: 'Speaking Time', tooltip: 'Speaking Time' },
      readingTime: { enabled: false, order: 6, shortName: 'Reading Time', tooltip: 'Reading Time' },
      handwritingTime: { enabled: false, order: 7, shortName: 'Handwriting Time', tooltip: 'Handwriting Time' }
    }
  },
  currentOccurrenceIndex: new Map(),
  sortState: {
    field: 'none', // 'none', 'citation'
    direction: 'asc' // 'asc', 'desc'
  },
  wordTarget: null,
  wordTargetMode: 'goal',
  wordTargetBarHidden: false,
  wordTargetGoalWasMet: false
};

const WORD_TARGET_STORAGE_KEY = 'wordTarget';
const WORD_TARGET_MODE_STORAGE_KEY = 'wordTargetMode';
const WORD_TARGET_BAR_HIDDEN_KEY = 'wordTargetBarHidden';
const WORD_TARGET_PRESET_VALUES = [4000, 3000, 1600];
