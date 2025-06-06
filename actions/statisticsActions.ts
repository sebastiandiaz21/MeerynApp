
'use server';

import type { SpellingAttempt, StoredSpellingAttempt, AggregatedWordStat, GameMode, DifficultyLevel, AggregatedStatsResult } from '@/types';

// Simulación de una base de datos en memoria para los intentos de juego
let gameAttemptsStore: StoredSpellingAttempt[] = [];

export interface GameSessionData {
  attempts: SpellingAttempt[];
  mode: GameMode;
  difficulty: DifficultyLevel;
  completedAt: number; // Timestamp
}

export async function recordGameSession(gameSessionData: GameSessionData): Promise<void> {
  const { attempts, mode, difficulty, completedAt } = gameSessionData;

  const newStoredAttempts: StoredSpellingAttempt[] = attempts.map((attempt, index) => ({
    id: `attempt-${completedAt}-${index}-${Math.random().toString(36).substring(7)}`,
    wordId: attempt.word.id,
    wordText: attempt.word.text,
    userRawSpelling: attempt.userSpelling, 
    isCorrect: attempt.isCorrect, 
    score: attempt.score, 
    mode: mode,
    difficulty: difficulty,
    attemptedAt: completedAt,
    isValidFormat: attempt.isValidFormat,
    parsedUserStartWord: attempt.parsedUserStartWord,
    parsedUserSpelledLetters: attempt.parsedUserSpelledLetters,
    parsedUserEndWord: attempt.parsedUserEndWord,
  }));

  gameAttemptsStore.push(...newStoredAttempts);
  console.log(`[StatisticsActions] Recorded ${newStoredAttempts.length} attempts. Total stored: ${gameAttemptsStore.length}`);
}

export async function getAggregatedWordStats(): Promise<AggregatedStatsResult> {
  const stats: Record<string, Omit<AggregatedWordStat, 'incorrectAttempts' | 'successRate' | 'averagePercentageScoreInTest'>> = {};
  
  let overallTotalTestModeScoreSum = 0;
  let overallTotalTestModeAttemptsCount = 0;

  gameAttemptsStore.forEach(attempt => {
    const normalizedWordText = attempt.wordText.trim();
    const key = `${normalizedWordText}-${attempt.difficulty}`;

    if (!stats[key]) {
      stats[key] = {
        wordText: normalizedWordText, 
        difficulty: attempt.difficulty,
        totalAttempts: 0,
        correctAttempts: 0,
        sumOfPercentageScoresInTest: 0,
        testModeAttemptsCount: 0,
      };
    }
    stats[key].totalAttempts++;
    
    // For aggregation, isCorrect (score > 0 in test, or 100 in practice) is used
    if (attempt.isCorrect) {
      stats[key].correctAttempts++;
    }

    if (attempt.mode === 'test') {
      stats[key].sumOfPercentageScoresInTest += attempt.score; // Storing the percentage score
      stats[key].testModeAttemptsCount++;
      
      overallTotalTestModeScoreSum += attempt.score;
      overallTotalTestModeAttemptsCount++;
    }
  });

  const wordStatsResult = Object.values(stats).map(s => ({
    ...s,
    incorrectAttempts: s.totalAttempts - s.correctAttempts,
    successRate: s.totalAttempts > 0 ? parseFloat(((s.correctAttempts / s.totalAttempts) * 100).toFixed(1)) : 0,
    averagePercentageScoreInTest: s.testModeAttemptsCount > 0 ? parseFloat((s.sumOfPercentageScoresInTest / s.testModeAttemptsCount).toFixed(1)) : 0,
  })).sort((a, b) => { 
    if (a.successRate !== b.successRate) {
      return a.successRate - b.successRate;
    }
    if (b.incorrectAttempts !== a.incorrectAttempts) {
        return b.incorrectAttempts - a.incorrectAttempts; 
    }
    return b.totalAttempts - a.totalAttempts; 
  });

  const overallAverageTestScore = overallTotalTestModeAttemptsCount > 0 
    ? parseFloat((overallTotalTestModeScoreSum / overallTotalTestModeAttemptsCount).toFixed(1)) 
    : null;

  return {
    wordStats: wordStatsResult,
    overallAverageTestScore: overallAverageTestScore,
  };
}

export async function clearAllGameAttempts(): Promise<void> {
  gameAttemptsStore = [];
  console.log('[StatisticsActions] All game attempts cleared from in-memory store.');
}
