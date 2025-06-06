
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type GameMode = 'practice' | 'test';

export interface Word { // Usado en GameClient y componentes de juego
  id: string;
  text: string;
  difficulty: DifficultyLevel;
  customImageUrl?: string; // URL de la imagen cargada por el admin
  customSentence?: string; // Oración personalizada cargada por el admin
  customTranslation?: string; // Traducción personalizada cargada por el admin
  isActive: boolean; // Determina si la palabra se usa en el juego
}

export interface SpellingAttempt { // This is what GameClient generates per attempt in a session
  word: Word; // The word object itself
  userSpelling: string; // The raw input from the user
  isCorrect: boolean; // Based on parsing and mode. For test mode, typically score > 0
  score: number; // For practice: 0 or 100. For test: percentage score (0-100)
  isValidFormat: boolean; // Was the input format "WORD, L, E, T, T, E, R, WORD" valid?
  parsedUserStartWord?: string;
  parsedUserSpelledLetters?: string[];
  parsedUserEndWord?: string;
}

export interface GameState {
  currentWordIndex: number;
  words: Word[];
  attempts: SpellingAttempt[];
  score: number; // Overall game score, might be sum of attempt scores or average percentage
  isFinished: boolean;
  isLoading: boolean;
}

// Tipos para la gestión de palabras por el Admin (simulando lo que iría en Firestore)
export interface AdminWordDoc {
  id: string;
  text: string;
  difficultyLevel: DifficultyLevel;
  customImageUrl?: string; // URL de la imagen subida manualmente
  customSentence?: string; // Oración personalizada
  customTranslation?: string; // Traducción personalizada
  source: 'admin' | 'gemini'; // Origen de la palabra/imagen
  createdAt: number; // Unix timestamp
  isActive: boolean;
}

// --- Types for Storing and Displaying Statistics ---
export interface StoredSpellingAttempt {
  id: string; // Unique ID for this stored attempt record
  wordId: string; // ID of the word (from Word interface)
  wordText: string; // Text of the word
  userRawSpelling: string; // The raw input from the user for this attempt
  isCorrect: boolean; // Whether this specific attempt was deemed correct (e.g. score > 0 in test)
  score: number; // Score achieved for this attempt (percentage for test mode, 0/100 for practice)
  mode: GameMode;
  difficulty: DifficultyLevel;
  attemptedAt: number; // Timestamp of when the game session (and this attempt) was completed
  isValidFormat: boolean; // Was the input format "WORD, L, E, T, T, E, R, WORD" valid?
  parsedUserStartWord?: string;
  parsedUserSpelledLetters?: string[];
  parsedUserEndWord?: string;
}

export interface AggregatedWordStat {
  wordText: string;
  difficulty: DifficultyLevel;
  totalAttempts: number; // All modes for this word-difficulty
  correctAttempts: number; // Based on isCorrect (e.g. score > 0 in test, or 100 in practice)
  incorrectAttempts: number;
  successRate: number; // Percentage of correctAttempts / totalAttempts
  sumOfPercentageScoresInTest: number; // Sum of percentage scores for 'test' mode attempts only
  testModeAttemptsCount: number; // Count of 'test' mode attempts for this word-difficulty
  averagePercentageScoreInTest: number; // Average percentage score for 'test' mode (0-100)
}

export interface AggregatedStatsResult {
  wordStats: AggregatedWordStat[];
  overallAverageTestScore: number | null; // Overall average of percentage scores from all test mode attempts
}


// --- Tipos originales de Firestore --- (Mantener por si se usan en otro lado, pero AdminWordDoc es el foco ahora)
export interface UserDoc {
  email: string;
  role: 'admin' | 'user';
  createdAt: any; // Firestore Timestamp
  lastLogin: any; // Firestore Timestamp
  scores?: {
    easyTotalScore?: number;
    mediumTotalScore?: number;
    hardTotalScore?: number;
  };
}

export interface WordDoc { // Este podría ser el tipo original de Firestore que se mapearía a AdminWordDoc
  word: string;
  difficultyLevel: DifficultyLevel;
  imageUrl?: string; // Podría ser custom o AI
  sentence?: string; // Podría ser custom o AI
  source: 'gemini' | 'manual';
  createdAt: any; // Firestore Timestamp
  createdBy: string; // userId
  isActive: boolean;
}

export interface UserScoreDoc {
  wordId: string;
  level: DifficultyLevel;
  mode: GameMode;
  attemptDate: any; // Firestore Timestamp
  correctLettersCount: number;
  totalLettersCount: number;
  percentageScore: number;
  isCorrect: boolean;
}
