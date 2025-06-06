
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { useSpeech } from '@/hooks/useSpeech';
import type { Word, DifficultyLevel, GameMode, SpellingAttempt } from '@/types';
import { getSpellingWords, getAIWordImage, getWordTranslation, getWordSentence, getTranslatedSentence } from '@/actions/spellingActions';
import { updateAdminWord } from '@/actions/adminActions'; 
import { recordGameSession } from '@/actions/statisticsActions';
import { Volume2, Mic, ArrowRight, ArrowLeft, RotateCcw, CheckCircle2, XCircle, Info, ImageOff, MessageSquareText, Languages, AlertCircle, Sparkles, Trophy, Lightbulb, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';


interface GameClientProps {
  mode: GameMode;
  difficulty: DifficultyLevel;
}

interface ParsedSpellingInput {
  isValidFormat: boolean;
  isStartWordCorrect: boolean;
  actualSpellingFromInput: string; 
  isEndWordCorrect: boolean;
  allCorrect: boolean; 
  startWordFromInput?: string;
  spelledLettersFromInput?: string[];
  endWordFromInput?: string;
  errorType?: 'format' | 'start_word' | 'end_word' | 'letters';
}

interface DetailedFeedbackPart {
  text: string;
  isCorrect: boolean;
  type: 'startWord' | 'letter' | 'endWord' | 'separator' | 'format_error_display';
}

function parseSpellingInput(rawInput: string, expectedWord: string): ParsedSpellingInput {
  const expectedWordUpper = expectedWord.toUpperCase();
  
  const commaSplitParts = rawInput.split(',')
    .map(part => part.trim().replace(/["']/g, '').toUpperCase());

  if (commaSplitParts.length < 3) {
    return { 
      isValidFormat: false, 
      isStartWordCorrect: false, 
      actualSpellingFromInput: '', 
      isEndWordCorrect: false, 
      allCorrect: false, 
      errorType: 'format' 
    };
  }
  
  const userStartWord = commaSplitParts[0];
  const userEndWord = commaSplitParts[commaSplitParts.length - 1];
  
  const spelledLetters = commaSplitParts.slice(1, -1);
  const actualSpellingFromInput = spelledLetters.join(''); 

  const isStartWordCorrect = userStartWord === expectedWordUpper;
  const isEndWordCorrect = userEndWord === expectedWordUpper;
  const isActualSpellingCorrect = actualSpellingFromInput === expectedWordUpper;

  let errorType: ParsedSpellingInput['errorType'] | undefined = undefined;
  if (!isStartWordCorrect) errorType = 'start_word';
  else if (!isActualSpellingCorrect) errorType = 'letters'; 
  else if (!isEndWordCorrect) errorType = 'end_word';


  return {
    isValidFormat: true,
    isStartWordCorrect,
    actualSpellingFromInput, 
    isEndWordCorrect,
    allCorrect: isStartWordCorrect && isActualSpellingCorrect && isEndWordCorrect,
    startWordFromInput: userStartWord,
    spelledLettersFromInput: spelledLetters,
    endWordFromInput: userEndWord,
    errorType: (isStartWordCorrect && isActualSpellingCorrect && isEndWordCorrect) ? undefined : errorType
  };
}


export default function GameClient({ mode, difficulty }: GameClientProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userSpelling, setUserSpelling] = useState(''); 
  const [sessionAttempts, setSessionAttempts] = useState<SpellingAttempt[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [currentDisplayImageUrl, setCurrentDisplayImageUrl] = useState<string | undefined>(undefined);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'correct' | 'incorrect' | 'format_error'; word: string; message?: string } | null>(null);
  const [detailedFeedback, setDetailedFeedback] = useState<DetailedFeedbackPart[] | null>(null);
  const [showInputFallback, setShowInputFallback] = useState(false);

  const [currentTranslation, setCurrentTranslation] = useState<string | null>(null);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  const [showPracticeTranslation, setShowPracticeTranslation] = useState(false);
  const [isGeneratingSentence, setIsGeneratingSentence] = useState(false);
  const [currentSpokenSentence, setCurrentSpokenSentence] = useState<string | null>(null); 
  
  const [wordsPerGameCount, setWordsPerGameCount] = useState<number>(5); 
  const [hasWordBeenSpoken, setHasWordBeenSpoken] = useState(false);

  const { toast } = useToast();
  const currentWord = words[currentWordIndex];
  
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userSpellingRef = useRef(userSpelling);


  useEffect(() => {
    userSpellingRef.current = userSpelling;
  }, [userSpelling]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWordsPerGame = localStorage.getItem('wordsPerGame');
      const num = savedWordsPerGame ? parseInt(savedWordsPerGame, 10) : 5; 
      setWordsPerGameCount(Math.max(3, Math.min(20, num))); 
    }
  }, []);

  const resetWordSpecificStates = useCallback(() => {
    setUserSpelling('');
    setFeedbackMessage(null);
    setDetailedFeedback(null);
    setCurrentTranslation(null);
    setShowPracticeTranslation(false); 
    setCurrentSpokenSentence(null);
    setIsLoadingTranslation(false); 
    setHasWordBeenSpoken(false);
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
  }, []);

  const fetchAndSetWordImage = useCallback(async (word: Word | undefined) => {
    if (mode === 'test') {
      setCurrentDisplayImageUrl(undefined); 
      setIsLoadingImage(false);
      return; 
    }

    if (!word || !word.text) {
        setCurrentDisplayImageUrl(undefined);
        setIsLoadingImage(false);
        return;
    }

    setIsLoadingImage(true);
    if (word.customImageUrl) {
      setCurrentDisplayImageUrl(word.customImageUrl);
      setIsLoadingImage(false);
    } else {
      setCurrentDisplayImageUrl(undefined); 
      try {
        console.log('[GameClient] No custom image for "' + word.text + '", attempting AI generation.');
        const imageResult = await getAIWordImage({ word: word.text });
        
        const isSuccessfulGeneration = imageResult.imageUrl && 
                                       !imageResult.imageUrl.includes("Error+") && 
                                       !imageResult.imageUrl.includes("Fail+");

        if (isSuccessfulGeneration) {
          console.log('[GameClient] AI image successfully generated for "' + word.text + '": ' + imageResult.imageUrl);
          setCurrentDisplayImageUrl(imageResult.imageUrl);
          
          setWords(prevWords => prevWords.map(w => 
            w.id === word.id ? { ...w, customImageUrl: imageResult.imageUrl } : w
          ));
          
          if (process.env.NEXT_PUBLIC_USE_ADMIN_WORDS === "true" && word.id.startsWith("ai-")) {
            try {
              console.log('[GameClient] Persisting AI generated image URL for admin word "' + word.text + '" (ID: ' + word.id + ')');
              await updateAdminWord(word.id, { customImageUrl: imageResult.imageUrl });
            } catch (saveError) {
              console.warn('[GameClient] Failed to save AI image URL to admin store for word "' + word.text + '":', saveError);
            }
          }
        } else {
          console.warn('[GameClient] AI image generation for "' + word.text + '" returned a placeholder or error: ' + imageResult.imageUrl + '. This will be displayed but not saved.');
          setCurrentDisplayImageUrl(imageResult.imageUrl); 
        }
      } catch (error) {
        console.error('[GameClient] Critical error during getAIWordImage for ' + word.text + ':', error);
        toast({
          title: "Error de Imagen IA",
          description: 'No se pudo generar la imagen para "' + word.text + '".',
          variant: "destructive",
        });
        
        setCurrentDisplayImageUrl('https://placehold.co/600x400.png?text=Error+' + (word.text.toUpperCase().replace(/\\s/g, '+')));
      } finally {
        setIsLoadingImage(false);
      }
    }
  }, [mode, toast, setWords, setCurrentDisplayImageUrl, setIsLoadingImage]); 

  const finishGameAndRecord = useCallback(async () => {
    setIsFinished(true);
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    if (sessionAttempts.length > 0) {
      try {
        await recordGameSession({
          attempts: sessionAttempts,
          mode,
          difficulty,
          completedAt: Date.now(),
        });
        toast({
          title: "Sesión Guardada",
          description: "Tus resultados han sido guardados para las estadísticas del tutor.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error recording game session:", error);
        toast({
          title: "Error al Guardar",
          description: "No se pudieron guardar los resultados de la sesión.",
          variant: "destructive",
        });
      }
    }
  }, [sessionAttempts, mode, difficulty, toast]);

  const nextWord = useCallback(() => {
    resetWordSpecificStates();
    if (currentWordIndex < words.length - 1) {
      const nextIdx = currentWordIndex + 1;
      setCurrentWordIndex(nextIdx);
      if (words[nextIdx]) {
        fetchAndSetWordImage(words[nextIdx]);
      }
    } else {
      finishGameAndRecord();
    }
  }, [currentWordIndex, words, fetchAndSetWordImage, finishGameAndRecord, resetWordSpecificStates]);

  const fetchWordsAndInitialImage = useCallback(async () => {
    setIsLoadingWords(true);
    setFeedbackMessage(null);
    setCurrentDisplayImageUrl(undefined);
    resetWordSpecificStates(); 
    setSessionAttempts([]); 
    try {
      const fetchedWords = await getSpellingWords({ difficultyLevel: difficulty, numberOfWords: wordsPerGameCount });
      setWords(fetchedWords);
      if (fetchedWords.length > 0) {
        fetchAndSetWordImage(fetchedWords[0]);
      } else {
        toast({
          title: "Sin Palabras",
          description: "No se encontraron palabras para esta dificultad. Prueba con otra o añade palabras en el modo Tutor.",
          variant: "default",
          duration: 7000,
        });
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las palabras. Por favor, inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingWords(false);
    }
  }, [difficulty, toast, fetchAndSetWordImage, wordsPerGameCount, resetWordSpecificStates]);

  const handlePreviousWord = useCallback(() => {
    if (mode === 'practice' && currentWordIndex > 0) {
        resetWordSpecificStates();
        const prevIdx = currentWordIndex - 1;
        setCurrentWordIndex(prevIdx);
        if (words[prevIdx]) {
            fetchAndSetWordImage(words[prevIdx]);
        }
    }
  }, [mode, currentWordIndex, words, fetchAndSetWordImage, resetWordSpecificStates]);

  const generateDisplayFeedback = useCallback((attempt: SpellingAttempt): DetailedFeedbackPart[] => {
    const feedback: DetailedFeedbackPart[] = [];
    const targetWordUpper = attempt.word.text.toUpperCase();
    const targetLetters = targetWordUpper.split('');

    if (!attempt.isValidFormat || !attempt.parsedUserStartWord || !attempt.parsedUserSpelledLetters || !attempt.parsedUserEndWord) {
        feedback.push({ text: attempt.userSpelling || "Intento vacío", isCorrect: false, type: 'format_error_display' });
        return feedback;
    }

    feedback.push({ text: attempt.parsedUserStartWord, isCorrect: attempt.parsedUserStartWord === targetWordUpper, type: 'startWord' });

    const maxLettersToCompare = Math.max(attempt.parsedUserSpelledLetters.length, targetLetters.length);
    for (let i = 0; i < maxLettersToCompare; i++) {
        feedback.push({ text: ',', isCorrect: true, type: 'separator' });
        const userLetterSegment = attempt.parsedUserSpelledLetters[i];
        const targetLetter = targetLetters[i];

        if (userLetterSegment !== undefined) {
            feedback.push({
                text: userLetterSegment,
                isCorrect: userLetterSegment.length === 1 && userLetterSegment === targetLetter,
                type: 'letter'
            });
        } else { 
            feedback.push({ text: '_', isCorrect: false, type: 'letter' });
        }
    }
    
    feedback.push({ text: ',', isCorrect: true, type: 'separator' });
    feedback.push({ text: attempt.parsedUserEndWord, isCorrect: attempt.parsedUserEndWord === targetWordUpper, type: 'endWord' });
    
    return feedback;
  }, []);


  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    supported: speechSupported,
  } = useSpeech({
    onResult: (transcript: string) => {
      userSpellingRef.current = transcript; 
      setUserSpelling(transcript);
      resetAutoSubmitTimerCallback();
    },
    onError: (error: string) => {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
      
      if (error === 'no-speech' && userSpellingRef.current.trim() !== '') {
        // Auto-submit or manual submit will handle this.
      } else if (error === 'no-speech') {
        toast({ title: "No se Detectó Voz", description: "Por favor, intenta hablar de nuevo o usa la entrada de texto.", variant: "default", });
        setShowInputFallback(true);
      } else if (error === 'not-allowed' || error === 'service-not-allowed') {
        toast({ title: "Acceso al Micrófono Denegado", description: "Por favor, permite el acceso al micrófono en la configuración de tu navegador para usar la entrada de voz.", variant: "destructive", });
        setShowInputFallback(true);
      } else {
        toast({ title: "Error de Voz", description: "No se pudo procesar el audio: " + error + ". Por favor, inténtalo de nuevo o usa la entrada de texto.", variant: "destructive", });
        setShowInputFallback(true);
      }
    },
    onStart: () => {
      resetAutoSubmitTimerCallback();
    },
    onEnd: () => {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
    },
  });


  const submitSpellingImplementationCallback = useCallback((rawSpellingInput: string) => {
    if (!currentWord || isSpeaking || isLoadingImage || isGeneratingSentence) return;

    const parsedResult = parseSpellingInput(rawSpellingInput, currentWord.text);
    let attemptScore = 0;
    let attemptIsCorrect = false;

    if (mode === 'practice') {
      const newDetailedFeedback = generateDisplayFeedback({
        word: currentWord,
        userSpelling: rawSpellingInput,
        isCorrect: parsedResult.allCorrect, 
        score: 0, 
        isValidFormat: parsedResult.isValidFormat,
        parsedUserStartWord: parsedResult.startWordFromInput,
        parsedUserSpelledLetters: parsedResult.spelledLettersFromInput,
        parsedUserEndWord: parsedResult.endWordFromInput,
      });
      setDetailedFeedback(newDetailedFeedback);
      
      attemptIsCorrect = parsedResult.allCorrect;
      attemptScore = attemptIsCorrect ? 100 : 0;

      if (!parsedResult.isValidFormat) {
        setFeedbackMessage({ type: 'format_error', word: currentWord.text.toUpperCase(), message: 'Formato incorrecto. Intenta: PALABRA, L, E, T, R, A, PALABRA.' });
      } else if (attemptIsCorrect) {
        setFeedbackMessage({ type: 'correct', word: currentWord.text.toUpperCase(), message: "¡Muy bien deletreado!" });
        if (currentWordIndex < words.length - 1) {
          setTimeout(nextWord, 2500); 
        } else {
          setTimeout(finishGameAndRecord, 2500);
        }
      } else {
        let incorrectMessage = 'Casi, pero no del todo. Palabra: ' + currentWord.text.toUpperCase() + '.';
        if (parsedResult.errorType === 'start_word') incorrectMessage += ' La primera palabra no coincide.';
        else if (parsedResult.errorType === 'letters') incorrectMessage += ' Deletreaste: ' + (parsedResult.actualSpellingFromInput || 'erróneo') + '.';
        else if (parsedResult.errorType === 'end_word') incorrectMessage += ' La última palabra no coincide.';
        setFeedbackMessage({ type: 'incorrect', word: currentWord.text.toUpperCase(), message: incorrectMessage });
      }

    } else { // Test mode
      let pointsEarned = 0;
      const expectedWordUpper = currentWord.text.toUpperCase();
      const expectedWordLetters = expectedWordUpper.split('');
      
      if (parsedResult.isValidFormat && parsedResult.startWordFromInput && parsedResult.actualSpellingFromInput && parsedResult.endWordFromInput) {
        const userSpelledLetters = parsedResult.actualSpellingFromInput.toUpperCase().split('');
        if (parsedResult.isStartWordCorrect) {
          pointsEarned += 1;
        }

        for (let i = 0; i < expectedWordLetters.length; i++) {
          if (i < userSpelledLetters.length && userSpelledLetters[i] === expectedWordLetters[i]) {
            pointsEarned += 1; 
          }
        }
        
        if (parsedResult.isEndWordCorrect) {
          pointsEarned += 1;
        }

        if (userSpelledLetters.length > expectedWordLetters.length) {
            pointsEarned -= 0.5 * (userSpelledLetters.length - expectedWordLetters.length);
        }
      } else {
        pointsEarned = 0; 
      }

      const maxPossiblePoints = 2 + expectedWordLetters.length; 
      const percentageScore = (maxPossiblePoints > 0) ? Math.max(0, (pointsEarned / maxPossiblePoints) * 100) : 0;
      
      attemptScore = parseFloat(percentageScore.toFixed(1));
      attemptIsCorrect = attemptScore > 0; 

      if (currentWordIndex < words.length - 1) {
        nextWord();
      } else {
        finishGameAndRecord();
      }
    }
    
    const newAttempt: SpellingAttempt = {
      word: currentWord,
      userSpelling: rawSpellingInput, 
      isCorrect: attemptIsCorrect, 
      score: attemptScore, 
      isValidFormat: parsedResult.isValidFormat,
      parsedUserStartWord: parsedResult.startWordFromInput,
      parsedUserSpelledLetters: parsedResult.spelledLettersFromInput,
      parsedUserEndWord: parsedResult.endWordFromInput,
    };
    setSessionAttempts(prev => [...prev, newAttempt]);
    setUserSpelling(''); 
  }, [currentWord, isSpeaking, isLoadingImage, isGeneratingSentence, mode, generateDisplayFeedback, words, currentWordIndex, nextWord, finishGameAndRecord]);


  const submitCurrentSpellingCallback = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    if (isListening) { 
      stopListening(); 
    }
    submitSpellingImplementationCallback(userSpellingRef.current);
  }, [isListening, stopListening, submitSpellingImplementationCallback]);

  const resetAutoSubmitTimerCallback = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
    }
    autoSubmitTimerRef.current = setTimeout(() => {
      if (isListening && userSpellingRef.current.trim() !== '') {
        console.log("Auto-submitting due to timeout...");
        submitCurrentSpellingCallback();
      } else if (isListening) { 
        stopListening();
      }
    }, 5000); 
  }, [isListening, submitCurrentSpellingCallback, stopListening]);
  
  useEffect(() => {
    if (wordsPerGameCount > 0) { 
        fetchWordsAndInitialImage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsPerGameCount]); // Intentionally not including fetchWordsAndInitialImage as it causes infinite loops if not careful


  useEffect(() => {
    if (!speechSupported) {
      setShowInputFallback(true);
      toast({
        title: "API de Voz No Soportada",
        description: "Tu navegador no soporta las funciones de voz. Por favor, usa la entrada de texto.",
        variant: "default",
        duration: 10000,
      });
    }
  }, [speechSupported, toast]);

  const handleSpeakWord = () => {
    if (currentWord && !isSpeaking && speechSupported && !isListening && !isGeneratingSentence) {
      speak(currentWord.text, () => {
        setHasWordBeenSpoken(true); 
      }); 
    } else if (!speechSupported) {
      toast({ title: "Reproducción de Audio No Soportada", description: "No se puede reproducir el audio de la palabra."});
    }
  };

  const handleMainSpellButton = () => {
    if (isListening) { 
      submitCurrentSpellingCallback();
    } else { 
      if (speechSupported && !isSpeaking && !isLoadingImage && !isGeneratingSentence) {
        setUserSpelling(''); 
        setFeedbackMessage(null);
        setDetailedFeedback(null);
        startListening(); 
        resetAutoSubmitTimerCallback(); 
      } else if (!speechSupported) {
        toast({ title: "Reconocimiento de Voz No Soportado", description: "No se puede escuchar el deletreo."});
      }
    }
  };
  
  const handleUserSpellingChange = (newSpelling: string) => {
    setUserSpelling(newSpelling);
    if (feedbackMessage || detailedFeedback) { 
        setFeedbackMessage(null);
        setDetailedFeedback(null);
    }
  };

  const handleTextInputSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (userSpelling.trim() !== '') {
      submitSpellingImplementationCallback(userSpelling);
    }
  };

  const handleFetchAndShowTranslation = useCallback(async () => {
    if (mode !== 'practice' || !currentWord || isLoadingTranslation || isSpeaking || isListening || isGeneratingSentence) {
      return;
    }
  
    setShowPracticeTranslation(true); 
  
    if (currentWord.customTranslation) {
      setCurrentTranslation(currentWord.customTranslation.toUpperCase());
      setIsLoadingTranslation(false); 
      return;
    }
  
    setIsLoadingTranslation(true);
    try {
      const translationResult = await getWordTranslation({ word: currentWord.text, targetLanguage: 'es' });
      setCurrentTranslation(translationResult.translatedText.toUpperCase());
    } catch (error) { 
      console.error('[GameClient] Critical error fetching translation for ' + currentWord.text + ':', error);
      toast({
        title: "Error Crítico de Traducción",
        description: 'No se pudo obtener la traducción para "' + currentWord.text + '". Intenta de nuevo.',
        variant: "destructive",
      });
      setCurrentTranslation(currentWord.text.toUpperCase() + ' (TRADUCCIÓN NO DISPONIBLE)');
    } finally {
      setIsLoadingTranslation(false);
    }
  }, [mode, currentWord, isLoadingTranslation, toast, isSpeaking, isListening, isGeneratingSentence]);


  const handleUseInSentence = async () => {
    if (!currentWord || isSpeaking || isListening || isGeneratingSentence) return;
    
    setIsGeneratingSentence(true);
    setCurrentSpokenSentence("Procesando oración...");

    let originalSentence = "";
    let sentenceToSpeak = "";

    try {
      if (currentWord.customSentence) {
        originalSentence = currentWord.customSentence;
      } else {
        const aiSentenceResult = await getWordSentence({ word: currentWord.text });
        originalSentence = aiSentenceResult.sentence;
        if (originalSentence && !originalSentence.includes("No se pudo generar") && process.env.NEXT_PUBLIC_USE_ADMIN_WORDS === "true" && currentWord.id.startsWith("ai-") && !currentWord.customSentence) {
          try {
            await updateAdminWord(currentWord.id, { customSentence: originalSentence });
            setWords(prev => prev.map(w => w.id === currentWord.id ? { ...w, customSentence: originalSentence } : w));
          } catch (saveError) {
            console.warn("Failed to save AI-generated sentence:", saveError);
          }
        }
      }
      sentenceToSpeak = originalSentence;

      if (!sentenceToSpeak || sentenceToSpeak.includes("No se pudo generar")) {
        setCurrentSpokenSentence(sentenceToSpeak || "No se pudo obtener la oración original.");
        setIsGeneratingSentence(false);
        return;
      }

      let sentenceForDisplay: string | null = null;
      
      const isLikelyEnglish = (s: string) => s.match(/[a-z]/i) && !s.match(/[ñáéíóúü¿¡]/i);

      if (isLikelyEnglish(sentenceToSpeak) || currentWord.customSentence) {
        try {
          const translatedResult = await getTranslatedSentence({ sentence: sentenceToSpeak, targetLanguage: 'es' });
          const translationFailedMarker = "(error en traducción";
          const translationNotAvailableMarker = "(traducción no disponible)"; // Check for this too

          if (translatedResult.translatedSentence.includes(translationFailedMarker) || translatedResult.translatedSentence.includes(translationNotAvailableMarker)) {
            sentenceForDisplay = "Traducción no disponible para esta oración.";
          } else if (translatedResult.translatedSentence === sentenceToSpeak && isLikelyEnglish(sentenceToSpeak) && !currentWord.customSentence) {
            sentenceForDisplay = "Traducción no disponible para esta oración.";
          } else {
            sentenceForDisplay = translatedResult.translatedSentence;
          }
        } catch (translationError) {
          console.error("Error during getTranslatedSentence call:", translationError);
          sentenceForDisplay = "Error al obtener la traducción.";
          toast({ title: "Error de Traducción", description: "No se pudo traducir la oración.", variant: "destructive" });
        }
      } else {
        sentenceForDisplay = sentenceToSpeak; // Assume it's already Spanish or non-translatable as intended
      }
      setCurrentSpokenSentence(sentenceForDisplay);

      if (sentenceToSpeak && !sentenceToSpeak.includes("No se pudo generar")) {
        speak(sentenceToSpeak);
      }

    } catch (error) {
      console.error("Error in handleUseInSentence:", error);
      setCurrentSpokenSentence("Error al procesar la oración.");
      toast({ title: "Error de Oración", description: "No se pudo procesar la oración.", variant: "destructive" });
    } finally {
      setIsGeneratingSentence(false);
    }
  };

  const restartGame = useCallback(() => {
    setWords([]);
    setCurrentWordIndex(0);
    setSessionAttempts([]);
    setIsFinished(false);
    setIsLoadingWords(true);
    resetWordSpecificStates();
    setCurrentDisplayImageUrl(undefined);
    if (wordsPerGameCount > 0) { 
        fetchWordsAndInitialImage();
    }
  }, [fetchWordsAndInitialImage, wordsPerGameCount, resetWordSpecificStates]); 

  const finalTestScoreSum = sessionAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const averageTestPercentage = sessionAttempts.length > 0 
                               ? parseFloat((finalTestScoreSum / sessionAttempts.length).toFixed(1))
                               : 0;

  const practiceCorrectCount = sessionAttempts.reduce((sum, attempt) => sum + (attempt.isCorrect ? 1 : 0), 0);

  const progressPercentage = words.length > 0 ? ((currentWordIndex + (isFinished ? 1: 0) ) / words.length) * 100 : 0;


  if (isLoadingWords) {
    return (
      <Card className="w-full max-w-md sm:max-w-2xl text-center shadow-xl rounded-xl">
        <CardHeader className="py-8">
          <CardTitle className="font-headline text-3xl sm:text-4xl text-primary">Cargando Juego...</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">¡Prepara tus oídos y tu voz!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 py-10">
          <Skeleton className="h-10 w-3/4 mx-auto rounded-md" />
          <Skeleton className="h-48 sm:h-60 w-full rounded-lg" />
          <Skeleton className="h-14 w-1/2 mx-auto rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (words.length === 0 && !isLoadingWords) {
     return (
      <Card className="w-full max-w-md text-center shadow-xl rounded-xl">
        <CardHeader className="py-8">
          <CardTitle className="font-headline text-3xl sm:text-4xl text-destructive">¡Oh no!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <p className="text-lg text-muted-foreground mb-6">No se encontraron palabras para esta dificultad. Prueba otra o pide a tu tutor que añada más.</p>
          <Button onClick={restartGame} variant="default" size="lg" className="text-lg py-3 px-6 rounded-lg">
            <RotateCcw className="mr-2 h-5 w-5" /> Intentar de Nuevo
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isFinished) {
    const isSuccess = mode === 'test' ? averageTestPercentage >= 70 : practiceCorrectCount / words.length >= 0.7; 
    return (
      <Card className="w-full max-w-lg sm:max-w-xl text-center shadow-xl rounded-xl">
        <CardHeader className="pt-8 pb-4">
          {isSuccess ? <Trophy className="mx-auto h-16 w-16 text-yellow-400 mb-3" /> : <Lightbulb className="mx-auto h-16 w-16 text-blue-400 mb-3" />}
          <CardTitle className="font-headline text-3xl sm:text-4xl">¡Juego Terminado!</CardTitle>
          {mode === 'test' ? (
            <CardDescription className="text-lg mt-1">
              Tu promedio: <span className={`font-bold text-2xl ${averageTestPercentage >= 70 ? 'text-green-500' : averageTestPercentage >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{averageTestPercentage}%</span>
            </CardDescription>
          ) : (
            <CardDescription className="text-lg mt-1">
              Palabras correctas: <span className={`font-bold text-2xl ${practiceCorrectCount / words.length >= 0.7 ? 'text-green-500' : practiceCorrectCount / words.length >= 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>{practiceCorrectCount} de {words.length}</span>
            </CardDescription>
          )}
           <Progress value={progressPercentage} className="w-full mt-4 h-3 sm:h-4 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 max-h-[250px] sm:max-h-[300px] overflow-y-auto p-4 sm:p-6 pretty-scrollbar">
          {sessionAttempts.map((attempt, index) => {
            const displayFeedbackParts = generateDisplayFeedback(attempt);
            return (
              <div key={index} className={`p-2.5 sm:p-3 rounded-lg text-left text-sm shadow-sm ${attempt.isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <p className="font-semibold text-foreground">Palabra: {attempt.word.text.toUpperCase()}
                  {mode === 'test' && <span className="ml-2 font-normal text-muted-foreground">({attempt.score.toFixed(1)}%)</span>}
                </p>
                <div className="text-md sm:text-lg break-all font-mono mt-1">
                  {displayFeedbackParts.map((part, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        part.type === 'separator' ? 'text-foreground/70 mx-0.5' : 'px-0.5',
                        part.isCorrect ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400',
                         ((part.type === 'letter' || part.type === 'startWord' || part.type === 'endWord') && !part.isCorrect && part.text !== '_') ? 'underline decoration-wavy decoration-red-500/70' : ''
                      )}
                    >
                      {part.text}
                    </span>
                  ))}
                </div>
                {!attempt.isValidFormat && <p className="text-xs text-orange-500 mt-1">Formato de respuesta incorrecto.</p>}
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="p-4 sm:p-6">
          <Button onClick={restartGame} variant="default" size="lg" className="w-full text-lg py-3 px-6 rounded-lg bg-primary hover:bg-primary/90">
            <RotateCcw className="mr-2 h-5 w-5" /> Jugar de Nuevo
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!currentWord) {
     return (
      <Card className="w-full max-w-md text-center shadow-xl rounded-xl">
         <CardHeader className="py-6"><CardTitle className="font-headline text-2xl sm:text-3xl text-destructive">Error Inesperado</CardTitle></CardHeader>
         <CardContent className="space-y-4 pb-6"><p className="text-muted-foreground">Algo salió mal. Por favor, intenta reiniciar el juego.</p>
         <Button onClick={restartGame} size="lg"><RotateCcw className="mr-2 h-4 w-4"/>Reiniciar Juego</Button></CardContent>
      </Card>
     )
  }

  const translatedMode = mode === 'practice' ? 'Práctica' : 'Examen';
  const translatedDifficulty = difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Medio' : 'Difícil';
  
  const spellButtonDisabled = isSpeaking || isLoadingImage || isGeneratingSentence || !speechSupported || 
                             (!hasWordBeenSpoken && !isListening);


  return (
    <Card className="w-full max-w-lg sm:max-w-2xl shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="font-headline text-2xl sm:text-3xl text-center text-primary text-shadow-playful">
          Modo {translatedMode}: {translatedDifficulty}
        </CardTitle>
        <CardDescription className="text-center text-sm sm:text-base text-muted-foreground mt-1">
           {`Palabra ${currentWordIndex + 1} de ${words.length}`}
        </CardDescription>
        <Progress value={progressPercentage} className="w-full mt-3 h-3 sm:h-4 rounded-full bg-primary/20 [&>div]:bg-primary" />
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 flex flex-col items-center p-3 sm:p-6">
        <Alert variant="default" className="w-full bg-primary/10 border-primary/30 text-xs sm:text-sm rounded-lg">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <AlertTitle className="text-primary font-semibold text-sm sm:text-base">Formato de Deletreo</AlertTitle>
            <AlertDescription className="text-primary/80">
              Di tu respuesta así: <strong className="font-bold">PALABRA, P, A, L, A, B, R, A, PALABRA</strong>
            </AlertDescription>
        </Alert>

        {mode === 'practice' && showPracticeTranslation && (
          <div className="w-full text-center my-2 sm:my-3 min-h-[2rem] sm:min-h-[2.5rem] flex flex-col items-center justify-center p-2 bg-secondary/30 rounded-lg">
            {isLoadingTranslation ? (
              <Skeleton className="h-6 sm:h-7 w-3/5 mx-auto rounded-md" />
            ) : currentTranslation ? (
              <p className="text-lg sm:text-xl font-semibold text-accent flex items-center justify-center gap-2">
                <Languages className="h-5 w-5 sm:h-6 sm:w-6" /> {currentTranslation}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm sm:text-base">Traducción no disponible o error.</p>
            )}
          </div>
        )}


        {currentSpokenSentence && (
            <Alert variant="default" className="w-full text-center my-2 sm:my-3 bg-secondary/30 text-secondary-foreground text-xs sm:text-sm rounded-lg">
              <MessageSquareText className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground/80" />
              <AlertDescription className="text-sm sm:text-base">
                {currentSpokenSentence}
              </AlertDescription>
            </Alert>
        )}


        <div className="w-full h-36 xs:h-40 sm:h-48 md:h-64 bg-secondary/20 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-border p-2">
          {mode === 'test' ? (
            <div className="text-muted-foreground p-3 sm:p-4 text-center flex flex-col items-center justify-center">
              <ImageOff className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-2 text-primary/50" />
              <p className="font-semibold text-md sm:text-lg text-primary">Modo Examen</p>
              <p className="text-sm sm:text-base">¡Concéntrate en deletrear!</p>
               {!hasWordBeenSpoken && <p className="text-xs text-accent mt-2">Escucha la palabra primero.</p>}
            </div>
          ) : isLoadingImage ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : currentDisplayImageUrl ? (
            <Image
                key={`${currentWord?.id || 'key-prefix'}-${currentDisplayImageUrl || 'no-img'}`}
                src={currentDisplayImageUrl}
                alt={`Imagen para ${currentWord?.text?.toUpperCase() || 'palabra actual'}`}
                data-ai-hint={currentWord.customImageUrl ? "custom illustration" : currentWord?.text?.split(' ').slice(0,2).join(' ') || 'word child drawing'}
                width={400}
                height={300}
                className="object-contain max-h-full max-w-full rounded-md"
                priority={currentWordIndex === 0}
                unoptimized={currentDisplayImageUrl ? (currentDisplayImageUrl.startsWith('data:') || currentDisplayImageUrl.startsWith('http')) : true}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const actualFailedSrc = target.src; 
                  const aiErrorPlaceholderPattern = /https:\/\/placehold\.co\/.*?(?:Error\+|AI\+Img\+Fail\+)/i;
                  const finalFallbackPlaceholder = 'https://placehold.co/600x400.png?text=Error+Loading+' + (currentWord?.text?.toUpperCase().replace(/\\s/g, '+') || 'IMAGE');

                  if (actualFailedSrc === finalFallbackPlaceholder) {
                    console.warn('[GameClient] Final fallback image itself failed to load: "' + actualFailedSrc + '" for word "' + (currentWord?.text || 'unknown') + '". No further image fallbacks will be attempted.');
                    return; 
                  }
            
                  if (aiErrorPlaceholderPattern.test(actualFailedSrc)) {
                    console.warn('[GameClient] First-level error placeholder image failed to load: "' + actualFailedSrc + '" for word "' + (currentWord?.text || 'unknown') + '". Attempting final fallback. Current state URL: "' + currentDisplayImageUrl + '"');
                  } else {
                    console.error('[GameClient] Image onError triggered. Problematic src: "' + actualFailedSrc + '" for word "' + (currentWord?.text || 'unknown') + '". CurrentDisplayImageUrl in state: "' + currentDisplayImageUrl + '"');
                    toast({ 
                      title: "Error de Imagen", 
                      description: 'No se pudo cargar la imagen para "' + (currentWord?.text || 'la palabra actual') + '". Mostrando una imagen genérica.', 
                      variant:"destructive"
                    });
                  }
                  setCurrentDisplayImageUrl(finalFallbackPlaceholder);
                }}
            />
          ) : (
            <div className="text-muted-foreground p-3 sm:p-4 text-center flex flex-col items-center justify-center">
              <Sparkles className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-2 text-primary/50" />
              <p className="text-md sm:text-lg">Palabra: <span className="font-bold text-lg sm:text-xl text-primary">{currentWord.text.toUpperCase()}</span></p>
              <p className="text-sm sm:text-base">La imagen aparecerá aquí.</p>
            </div>
          )}
        </div>

        {mode === 'practice' && feedbackMessage && (
          <Alert variant={feedbackMessage.type === 'correct' ? 'default' : feedbackMessage.type === 'format_error' ? 'default' : 'destructive'} 
                 className={`w-full text-sm sm:text-base my-2 sm:my-3 rounded-lg shadow-md ${feedbackMessage.type === 'correct' ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300' : feedbackMessage.type === 'format_error' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300' : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'}`}>
             {feedbackMessage.type === 'correct' ? <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 dark:text-green-400" /> : feedbackMessage.type === 'format_error' ? <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" /> : <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 dark:text-red-400" />}
            <AlertTitle className={`font-semibold text-md sm:text-lg ${feedbackMessage.type === 'correct' ? 'text-green-700 dark:text-green-200' : feedbackMessage.type === 'format_error' ? 'text-yellow-700 dark:text-yellow-200' : 'text-red-700 dark:text-red-200'}`}>
                {feedbackMessage.type === 'correct' ? '¡Excelente!' : feedbackMessage.type === 'format_error' ? 'Revisa el Formato' : '¡Inténtalo de Nuevo!'}
            </AlertTitle>
            <AlertDescription className={`mt-0.5 ${feedbackMessage.type === 'correct' ? 'text-green-600 dark:text-green-400' : feedbackMessage.type === 'format_error' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
              {feedbackMessage.message || 'La palabra era: ' + feedbackMessage.word + '.'}
            </AlertDescription>
          </Alert>
        )}
        
        {mode === 'practice' && detailedFeedback && (
          <div className="w-full text-center my-2 sm:my-3 p-3 rounded-lg bg-muted/40 dark:bg-muted/30 shadow-inner">
            <p className="text-sm sm:text-base text-muted-foreground mb-1 sm:mb-1.5">Tu respuesta detallada:</p>
            <div className="text-lg sm:text-xl md:text-2xl break-all font-bold">
              {detailedFeedback.map((part, index) => (
                <span
                  key={index}
                  className={cn(
                    part.type === 'separator' ? 'text-foreground/70 mx-0.5' : 'px-0.5',
                    part.isCorrect ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400',
                     (part.type === 'letter' || part.type === 'startWord' || part.type === 'endWord') && !part.isCorrect && part.text !== '_' ? 'underline decoration-wavy decoration-red-500/70' : ''
                  )}
                >
                  {part.text}
                </span>
              ))}
            </div>
          </div>
        )}


        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full mt-2 sm:mt-3">
          {[
            { label: 'Escuchar', icon: Volume2, onClick: handleSpeakWord, variant: 'outline', disabled: isSpeaking || isLoadingImage || isListening || isGeneratingSentence, pulse: isSpeaking, key: 'listenBtn' },
            { 
              label: isListening ? 'Enviar' : 'Deletrear', 
              icon: isListening ? Send : Mic, 
              onClick: handleMainSpellButton, 
              variant: 'default', 
              className: isListening ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-accent hover:bg-accent/80 text-accent-foreground', 
              disabled: spellButtonDisabled || (showInputFallback && isListening), 
              pulse: isListening, 
              key: 'spellBtn' 
            },
            { label: isGeneratingSentence ? 'Generando...' :'En Oración', icon: MessageSquareText, onClick: handleUseInSentence, variant: 'secondary', disabled: isSpeaking || isLoadingImage || isListening || isGeneratingSentence || !currentWord || !hasWordBeenSpoken, pulse: isGeneratingSentence, key: 'sentenceBtn' },
            mode === 'practice' && { label: (isLoadingTranslation && showPracticeTranslation) ? 'Traduciendo...' : (showPracticeTranslation && currentTranslation) ? 'Traducción OK' : 'Traducir', icon: Languages, onClick: handleFetchAndShowTranslation, variant: 'outline', disabled: !currentWord || (isLoadingTranslation && showPracticeTranslation) || isSpeaking || isListening || isGeneratingSentence || (showPracticeTranslation && !!currentTranslation && !isLoadingTranslation) || !hasWordBeenSpoken , pulse: isLoadingTranslation && showPracticeTranslation, key: 'translateBtn' }
          ].filter(Boolean).map(btnConfig => {
            const BtnIcon = btnConfig!.icon;
            return (
            <Button
              key={btnConfig!.key}
              onClick={btnConfig!.onClick}
              disabled={btnConfig!.disabled}
              variant={btnConfig!.variant as any}
              size="lg" 
              aria-label={btnConfig!.label}
              className={cn(
                "text-xs xxs:text-sm sm:text-base py-3 px-2 sm:px-3 h-auto min-h-[3.5rem] sm:min-h-[4rem] flex-col sm:flex-row justify-center items-center transition-transform hover:scale-105",
                btnConfig!.className
              )}
            >
              <BtnIcon className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-0 sm:mr-2 ${btnConfig!.pulse ? (btnConfig!.key === 'spellBtn' && isListening ? 'text-red-400 animate-ping' : 'animate-pulse') : ''}`} />
              <span className="leading-tight text-center">{btnConfig!.label}</span>
            </Button>
          )})}
        </div>

        {(showInputFallback || !speechSupported) && (
          <form onSubmit={handleTextInputSubmit} className="w-full max-w-md space-y-3 mt-4 sm:mt-5">
            <Label htmlFor="spelling-input" className="sr-only">Escribe tu deletreo</Label>
            <Input
              id="spelling-input"
              type="text"
              value={userSpelling}
              onChange={(e) => handleUserSpellingChange(e.target.value)}
              placeholder={`Ej: PALABRA, P, A, L, A, B, R, A, PALABRA`}
              className="text-center text-md sm:text-lg h-12 sm:h-14 rounded-lg shadow-inner"
              disabled={isSpeaking || isLoadingImage || isListening || isGeneratingSentence || (mode === 'practice' && !!feedbackMessage && feedbackMessage.type === 'correct')}
            />
            <Button type="submit" className="w-full text-md sm:text-lg py-3 rounded-lg" size="lg" disabled={isSpeaking || isLoadingImage || isListening || isGeneratingSentence || userSpelling.trim() === '' || (mode === 'practice' && !!feedbackMessage && feedbackMessage.type === 'correct')}>Enviar Deletreo Escrito</Button>
          </form>
        )}

      </CardContent>
       <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 sm:p-6 bg-background/80 border-t">
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            {mode === 'practice' && (
                <Button onClick={handlePreviousWord} 
                    variant="outline"
                    size="lg"
                    className="flex-1 sm:flex-initial text-sm sm:text-base py-3 rounded-lg transition-transform hover:scale-105"
                    disabled={currentWordIndex === 0 || isSpeaking || isLoadingImage || isListening || isGeneratingSentence}
                >
                    <ArrowLeft className="mr-2 h-5 w-5" /> Anterior
                </Button>
            )}
             <Button onClick={restartGame} variant="ghost" size="lg" className="flex-1 sm:flex-initial text-sm sm:text-base py-3 text-muted-foreground hover:text-primary rounded-lg transition-transform hover:scale-105">
                <RotateCcw className="mr-2 h-5 w-5" /> Reiniciar
            </Button>
        </div>
        { mode === 'practice' && (
            <Button
            onClick={() => {
                if (isListening) { 
                stopListening();
                }
                if (mode === 'practice' && feedbackMessage && feedbackMessage.type !== 'correct') {
                if (feedbackMessage.type !== 'format_error' || currentWordIndex < words.length -1) {
                    nextWord();
                } else if (feedbackMessage.type === 'format_error' && currentWordIndex === words.length - 1) {
                    finishGameAndRecord(); 
                }
                } else if (!feedbackMessage || feedbackMessage.type === 'correct') {
                    if (currentWordIndex < words.length - 1) {
                        nextWord();
                    } else {
                        finishGameAndRecord();
                    }
                }
            }}
            disabled={isSpeaking || isLoadingImage || (isListening && !isFinished) || isGeneratingSentence ||
                        (mode === 'practice' && !!feedbackMessage && feedbackMessage.type === 'correct' && currentWordIndex >= words.length -1 && !isFinished) || 
                        (isFinished)
                        }
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto flex-1 sm:flex-initial text-sm sm:text-base py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-transform hover:scale-105"
            >
            Siguiente <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}

