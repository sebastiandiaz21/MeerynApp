
'use server';

import type { AdminWordDoc, DifficultyLevel } from '@/types';

// Simulación de una base de datos en memoria para las palabras del admin
let adminWordsStore: AdminWordDoc[] = [
  { id: 'admin-1', text: 'elephant', difficultyLevel: 'medium', isActive: true, source: 'admin', createdAt: Date.now(), customImageUrl: `https://placehold.co/600x400.png?text=Custom+Elephant`, customSentence: "An elephant is a very large animal.", customTranslation: "Elefante" },
  { id: 'admin-2', text: 'bicycle', difficultyLevel: 'easy', isActive: true, source: 'admin', createdAt: Date.now(), customSentence: "I like to ride my bicycle.", customTranslation: "Bicicleta" },
  { id: 'admin-3', text: 'query', difficultyLevel: 'hard', isActive: false, source: 'admin', createdAt: Date.now() },
];

export async function getAdminWords(): Promise<AdminWordDoc[]> {
  // En una aplicación real, esto interactuaría con Firestore
  console.log('[AdminAction] Fetching words from store:', adminWordsStore);
  return JSON.parse(JSON.stringify(adminWordsStore)); // Devuelve una copia para evitar mutaciones directas
}

export async function addAdminWord(wordData: { text: string; difficultyLevel: DifficultyLevel; customSentence?: string; customTranslation?: string; customImageUrl?: string }): Promise<AdminWordDoc> {
  const newWord: AdminWordDoc = {
    ...wordData,
    id: `admin-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    isActive: true,
    source: 'admin',
    createdAt: Date.now(),
    customSentence: wordData.customSentence || undefined,
    customTranslation: wordData.customTranslation || undefined,
    customImageUrl: wordData.customImageUrl || undefined,
  };
  adminWordsStore.push(newWord);
  console.log('[AdminAction] Added word:', newWord, 'Store now:', adminWordsStore);
  return newWord;
}

export async function updateAdminWord(wordId: string, updates: Partial<Pick<AdminWordDoc, 'isActive' | 'customImageUrl' | 'text' | 'difficultyLevel' | 'customSentence' | 'customTranslation'>>): Promise<AdminWordDoc | null> {
  const wordIndex = adminWordsStore.findIndex(w => w.id === wordId);
  if (wordIndex === -1) {
    console.error('[AdminAction] Word not found for update:', wordId);
    return null;
  }
  adminWordsStore[wordIndex] = { ...adminWordsStore[wordIndex], ...updates };
  console.log('[AdminAction] Updated word:', adminWordsStore[wordIndex], 'Store now:', adminWordsStore);
  return adminWordsStore[wordIndex];
}

// Ahora guarda el imageDataUri directamente.
export async function uploadWordImage(wordId: string, imageDataUri: string): Promise<{ customImageUrl: string } | null> {
  console.log(`[AdminAction] Processing image upload for word ${wordId}. Image data URI length: ${imageDataUri.length}`);
  const wordIndex = adminWordsStore.findIndex(w => w.id === wordId);
  if (wordIndex === -1) {
    console.error('[AdminAction] Word not found for image upload:', wordId);
    return null;
  }
  // Guardar el Data URI directamente.
  // En una app real, subirías a Firebase Storage y guardarías la URL.
  adminWordsStore[wordIndex].customImageUrl = imageDataUri;
  console.log('[AdminAction] Updated image for word (using data URI):', adminWordsStore[wordIndex].id);
  return { customImageUrl: imageDataUri };
}

export async function deleteAdminWord(wordId: string): Promise<boolean> {
  const initialLength = adminWordsStore.length;
  adminWordsStore = adminWordsStore.filter(w => w.id !== wordId);
  const success = adminWordsStore.length < initialLength;
  if (success) {
    console.log('[AdminAction] Deleted word:', wordId, 'Store now:', adminWordsStore);
  } else {
    console.error('[AdminAction] Word not found for deletion:', wordId);
  }
  return success;
}

