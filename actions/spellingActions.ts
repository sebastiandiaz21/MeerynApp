
'use server';

import { generateSpellingWords as generateWordsWithAI, type GenerateSpellingWordsInput, type GenerateSpellingWordsOutput } from '@/ai/flows/generate-spelling-words';
import { generateWordImage, type GenerateWordImageInput, type GenerateWordImageOutput } from '@/ai/flows/generate-word-image';
import { translateWord, type TranslateWordInput, type TranslateWordOutput } from '@/ai/flows/translate-word-flow';
import { generateSentenceForWord, type GenerateSentenceInput, type GenerateSentenceOutput } from '@/ai/flows/generate-sentence-flow';
import { translateSentence, type TranslateSentenceInput, type TranslateSentenceOutput } from '@/ai/flows/translate-sentence-flow';
import type { DifficultyLevel, Word, AdminWordDoc } from '@/types';
import { getAdminWords as fetchAdminWords } from './adminActions';

const MOCK_WORDS: Record<DifficultyLevel, string[]> = {
  easy: ["cat", "dog", "sun", "run", "big", "egg", "cup", "hat", "pen", "joy", "sky", "fly", "try", "cry", "dry"],
  medium: ["apple", "happy", "table", "water", "earth", "dream", "smile", "magic", "music", "story", "grape", "chair", "watch", "train", "light"],
  hard: ["beautiful", "adventure", "technology", "knowledge", "environment", "communication", "delicious", "important", "experience", "opportunity", "xylophone", "question", "believe", "journey", "mystery"],
};

function mapAdminDocToWord(adminDoc: AdminWordDoc): Word {
  return {
    id: adminDoc.id,
    text: adminDoc.text,
    difficulty: adminDoc.difficultyLevel,
    customImageUrl: adminDoc.customImageUrl,
    customSentence: adminDoc.customSentence,
    customTranslation: adminDoc.customTranslation,
    isActive: adminDoc.isActive,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function getSpellingWords(input: GenerateSpellingWordsInput): Promise<Word[]> {
  const difficulty = input.difficultyLevel as DifficultyLevel;
  const numWords = input.numberOfWords;

  if (process.env.NEXT_PUBLIC_USE_ADMIN_WORDS === "true") {
    console.log('[SpellingAction] Admin words are configured. Attempting to fetch from Admin Source.');
    try {
      const adminDocs = await fetchAdminWords();
      const activeAdminWordsForDifficulty = adminDocs
        .filter(doc => doc.isActive && doc.difficultyLevel === difficulty)
        .map(mapAdminDocToWord);

      if (activeAdminWordsForDifficulty.length > 0) {
        console.log(`[SpellingAction] Fetched ${activeAdminWordsForDifficulty.length} active admin words for difficulty ${difficulty}. Requested: ${numWords}`);
        const shuffled = shuffleArray(activeAdminWordsForDifficulty);
        const wordsToReturnCount = Math.min(numWords, shuffled.length);
        return shuffled.slice(0, wordsToReturnCount);
      } else {
        console.log(`[SpellingAction] No active admin words found for difficulty ${difficulty}. Returning empty list as admin words are the configured primary source.`);
        return []; 
      }
    } catch (error) {
      console.error("[SpellingAction] Error fetching admin words. Returning empty list as admin words are the configured primary source:", error);
      return []; 
    }
  }

  console.log('[SpellingAction] Admin words not configured or flag is false. Falling back to AI/Mocks.');
  if (process.env.USE_MOCK_WORDS === "true") {
    console.log('[SpellingAction] Using MOCK words');
    const availableMockWords = MOCK_WORDS[difficulty] || MOCK_WORDS.easy;
    const uniqueMockWords = Array.from(new Set(availableMockWords));
    const shuffled = shuffleArray(uniqueMockWords);
    const wordsToReturnCount = Math.min(numWords, shuffled.length);
    const selectedWords = shuffled.slice(0, wordsToReturnCount);
    
    return selectedWords.map((w, i) => ({
      id: `mock-${difficulty}-${i}-${Date.now()}`,
      text: w.toLowerCase(),
      difficulty: difficulty,
      isActive: true,
    }));
  }

  console.log('[SpellingAction] Using AI-generated words');
  try {
    const aiResult: GenerateSpellingWordsOutput = await generateWordsWithAI(input);
    return aiResult.words.slice(0, numWords).map((w, i) => ({
      id: `ai-${difficulty}-${i}-${Date.now()}`, 
      text: w.toLowerCase(),
      difficulty: difficulty,
      isActive: true, 
    }));
  } catch (error) {
    console.error("Error generating AI spelling words, falling back to Mocks:", error);
    const availableMockWords = MOCK_WORDS[difficulty] || MOCK_WORDS.easy;
    const uniqueMockWords = Array.from(new Set(availableMockWords));
    const shuffled = shuffleArray(uniqueMockWords);
    const wordsToReturnCount = Math.min(numWords, shuffled.length);
    const selectedWords = shuffled.slice(0, wordsToReturnCount);

    return selectedWords.map((w, i) => ({
      id: `fallback-mock-${difficulty}-${i}-${Date.now()}`,
      text: w.toLowerCase(),
      difficulty: difficulty,
      isActive: true,
    }));
  }
}

export async function getAIWordImage(input: GenerateWordImageInput): Promise<GenerateWordImageOutput> {
  try {
     if (process.env.USE_MOCK_IMAGES === "true") {
      return { imageUrl: `https://placehold.co/600x400.png?text=Mock+${input.word}` };
    }
    return await generateWordImage(input);
  } catch (error) {
    console.error("Error generating word image:", error);
    return { imageUrl: `https://placehold.co/600x400.png?text=Error+${input.word}` };
  }
}

export async function getWordTranslation(input: TranslateWordInput): Promise<TranslateWordOutput> {
  try {
    return await translateWord(input);
  } catch (error) {
    console.error("Error translating word:", error);
    return { translatedText: `${input.word} (error en traducción)` };
  }
}

export async function getWordSentence(input: GenerateSentenceInput): Promise<GenerateSentenceOutput> {
  try {
    return await generateSentenceForWord(input);
  } catch (error) {
    console.error("Error generating sentence for word:", error);
    return { sentence: `No se pudo generar una oración para ${input.word}.` };
  }
}

export async function getTranslatedSentence(input: TranslateSentenceInput): Promise<TranslateSentenceOutput> {
  try {
    return await translateSentence(input);
  } catch (error) {
    console.error("Error translating sentence in action:", error);
    return { translatedSentence: `${input.sentence} (error en traducción de oración)` };
  }
}
