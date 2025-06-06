
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AdminWordDoc, DifficultyLevel } from '@/types';
import { getAdminWords, addAdminWord, updateAdminWord, uploadWordImage, deleteAdminWord } from '@/actions/adminActions';
import { getAIWordImage, getWordSentence, getWordTranslation } from '@/actions/spellingActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit3, UploadCloud, PlusCircle, RefreshCw, MessageSquareQuote, Sparkles, Check, X, Link as LinkIcon, VenetianMask, Filter, FileUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard'];

interface AIImagePreviewState {
  wordId: string;
  imageUrl: string;
  isLoading: boolean;
}

export default function AdminWordList() {
  const [words, setWords] = useState<AdminWordDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submissions
  const [newWordText, setNewWordText] = useState('');
  const [newWordDifficulty, setNewWordDifficulty] = useState<DifficultyLevel>('easy');
  const [newWordSentence, setNewWordSentence] = useState('');
  const [newWordTranslation, setNewWordTranslation] = useState('');
  const [editingWord, setEditingWord] = useState<AdminWordDoc | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [wordIdToDelete, setWordIdToDelete] = useState<string | null>(null);
  const [wordTextToDelete, setWordTextToDelete] = useState<string | null>(null);

  const [aiImagePreview, setAiImagePreview] = useState<AIImagePreviewState | null>(null);
  const [isGeneratingSentenceAdmin, setIsGeneratingSentenceAdmin] = useState(false);
  const [isGeneratingTranslationAdmin, setIsGeneratingTranslationAdmin] = useState<string | null>(null); 

  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  
  const [webImageUrlInputs, setWebImageUrlInputs] = useState<Record<string, string>>({});
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  const { toast } = useToast();

  const fetchWords = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedWords = await getAdminWords();
      setWords(fetchedWords);
      setSelectedWordIds(new Set()); 
    } catch (error) {
      console.error("Error fetching admin words:", error);
      toast({ title: "Error", description: "No se pudieron cargar las palabras.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const displayedWords = filterActiveOnly ? words.filter(w => w.isActive) : words;

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordText.trim()) {
      toast({ title: "Error", description: "El texto de la palabra no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await addAdminWord({ 
        text: newWordText, 
        difficultyLevel: newWordDifficulty, 
        customSentence: newWordSentence.trim() || undefined,
        customTranslation: newWordTranslation.trim() || undefined,
        customImageUrl: undefined 
      });
      setNewWordText('');
      setNewWordDifficulty('easy');
      setNewWordSentence('');
      setNewWordTranslation('');
      toast({ title: "Éxito", description: "Palabra añadida." });
      fetchWords(); 
    } catch (error) {
      console.error("Error adding word:", error);
      toast({ title: "Error", description: "No se pudo añadir la palabra.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAISentenceForNewWord = async () => {
    if (!newWordText.trim()) {
      toast({ title: "Info", description: "Escribe una palabra primero para generar su oración.", variant: "default" });
      return;
    }
    setIsGeneratingSentenceAdmin(true);
    try {
      const result = await getWordSentence({ word: newWordText.trim() });
      setNewWordSentence(result.sentence);
      toast({ title: "Oración IA Generada", description: "Oración añadida al campo." });
    } catch (error) {
      console.error("Error generating AI sentence for new word:", error);
      toast({ title: "Error de IA", description: "No se pudo generar la oración.", variant: "destructive" });
    } finally {
      setIsGeneratingSentenceAdmin(false);
    }
  };
  
  const handleGenerateAITranslationForNewWord = async () => {
    if (!newWordText.trim()) {
      toast({ title: "Info", description: "Escribe una palabra primero para generar su traducción.", variant: "default" });
      return;
    }
    setIsGeneratingTranslationAdmin("newWord");
    try {
      const result = await getWordTranslation({ word: newWordText.trim(), targetLanguage: 'es' });
      setNewWordTranslation(result.translatedText);
      toast({ title: "Traducción IA Generada", description: "Traducción añadida al campo." });
    } catch (error) {
      console.error("Error generating AI translation for new word:", error);
      toast({ title: "Error de IA", description: "No se pudo generar la traducción.", variant: "destructive" });
    } finally {
      setIsGeneratingTranslationAdmin(null);
    }
  };


  const handleGenerateAISentenceForEditingWord = async () => {
    if (!editingWord || !editingWord.text.trim()) {
      toast({ title: "Info", description: "No hay palabra seleccionada o está vacía.", variant: "default" });
      return;
    }
    setIsGeneratingSentenceAdmin(true);
    try {
      const result = await getWordSentence({ word: editingWord.text.trim() });
      setEditingWord(prev => prev ? { ...prev, customSentence: result.sentence } : null);
      toast({ title: "Oración IA Generada", description: "Oración actualizada en el campo." });
    } catch (error) {
      console.error("Error generating AI sentence for editing word:", error);
      toast({ title: "Error de IA", description: "No se pudo generar la oración.", variant: "destructive" });
    } finally {
      setIsGeneratingSentenceAdmin(false);
    }
  };

  const handleGenerateAITranslationForEditingWord = async () => {
    if (!editingWord || !editingWord.text.trim()) {
      toast({ title: "Info", description: "No hay palabra seleccionada o está vacía.", variant: "default" });
      return;
    }
    setIsGeneratingTranslationAdmin(editingWord.id);
    try {
      const result = await getWordTranslation({ word: editingWord.text.trim(), targetLanguage: 'es' });
      setEditingWord(prev => prev ? { ...prev, customTranslation: result.translatedText } : null);
      toast({ title: "Traducción IA Generada", description: "Traducción actualizada en el campo." });
    } catch (error) {
      console.error("Error generating AI translation for editing word:", error);
      toast({ title: "Error de IA", description: "No se pudo generar la traducción.", variant: "destructive" });
    } finally {
      setIsGeneratingTranslationAdmin(null);
    }
  };


  const handleToggleActive = async (wordId: string, isActive: boolean) => {
    try {
      await updateAdminWord(wordId, { isActive });
      toast({ title: "Éxito", description: `Palabra ${isActive ? 'activada' : 'desactivada'}.` });
      setWords(prevWords => prevWords.map(w => w.id === wordId ? { ...w, isActive } : w));
    } catch (error) {
      console.error("Error toggling active state:", error);
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    }
  };

  const handleImageUpload = async (wordId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { 
        toast({ title: "Error", description: "La imagen es demasiado grande (máx 2MB).", variant: "destructive" });
        return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageDataUri = reader.result as string;
      try {
        const result = await uploadWordImage(wordId, imageDataUri); 
        if (result) {
          toast({ title: "Éxito", description: "Imagen cargada." });
          fetchWords(); 
          if (aiImagePreview?.wordId === wordId) { 
            setAiImagePreview(null);
          }
          setWebImageUrlInputs(prev => ({ ...prev, [wordId]: '' })); 
        } else {
           toast({ title: "Error", description: "No se pudo procesar la imagen.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({ title: "Error", description: "No se pudo procesar la imagen.", variant: "destructive" });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = ''; 
  };

  const handleSetWebImageUrl = async (wordId: string) => {
    const url = webImageUrlInputs[wordId]?.trim();
    if (!url) {
      toast({ title: "URL Vacía", description: "Por favor, ingresa una URL de imagen.", variant: "default" });
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        toast({ title: "URL Inválida", description: "Por favor, ingresa una URL válida (http:// o https://).", variant: "destructive" });
        return;
    }

    try {
      await updateAdminWord(wordId, { customImageUrl: url });
      toast({ title: "Éxito", description: "URL de imagen web guardada." });
      fetchWords(); 
      setWebImageUrlInputs(prev => ({ ...prev, [wordId]: '' }));
      if (aiImagePreview?.wordId === wordId) { 
        setAiImagePreview(null);
      }
    } catch (error) {
      console.error("Error setting web image URL:", error);
      toast({ title: "Error", description: "No se pudo guardar la URL de la imagen.", variant: "destructive" });
    }
  };

  const handleWebImageUrlInputChange = (wordId: string, value: string) => {
    setWebImageUrlInputs(prev => ({ ...prev, [wordId]: value }));
  };


  const handleGenerateAIImage = async (wordId: string, wordText: string) => {
    if (aiImagePreview?.isLoading) {
        toast({ title: "Info", description: "Ya hay una generación de imagen en curso.", variant: "default"});
        return;
    }
    setAiImagePreview({ wordId, imageUrl: '', isLoading: true });
    try {
      const result = await getAIWordImage({ word: wordText });
      if (result.imageUrl && !result.imageUrl.includes("Error+") && !result.imageUrl.includes("Fail+")) {
        setAiImagePreview({ wordId, imageUrl: result.imageUrl, isLoading: false });
        toast({ title: "Imagen IA Generada", description: "Revisa la imagen y acéptala si te gusta." });
      } else {
        throw new Error(result.imageUrl.includes("Error+") || result.imageUrl.includes("Fail+") ? "AI generation failed" : "No image URL returned");
      }
    } catch (error) {
      console.error("Error generating AI image:", error);
      toast({ title: "Error de IA", description: "No se pudo generar la imagen con IA.", variant: "destructive" });
      setAiImagePreview(null);
    }
  };

  const handleAcceptAIImage = async (wordId: string, imageUrl: string) => {
    try {
      await updateAdminWord(wordId, { customImageUrl: imageUrl });
      toast({ title: "Éxito", description: "Imagen generada por IA guardada como personalizada." });
      fetchWords(); 
      setAiImagePreview(null);
      setWebImageUrlInputs(prev => ({ ...prev, [wordId]: '' })); 
    } catch (error) {
      console.error("Error saving AI image:", error);
      toast({ title: "Error", description: "No se pudo guardar la imagen IA.", variant: "destructive" });
    }
  };

  const handleRejectAIImage = () => {
    setAiImagePreview(null);
  };

  const requestDeleteWord = (wordId: string, wordText: string) => {
    setWordIdToDelete(wordId);
    setWordTextToDelete(wordText);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteWord = async () => {
    if (!wordIdToDelete || !wordTextToDelete) return;
    setIsSubmitting(true);
    try {
      const success = await deleteAdminWord(wordIdToDelete);
      if (success) {
        toast({ title: "Éxito", description: `Palabra "${wordTextToDelete}" eliminada.` });
        fetchWords(); 
      } else {
        toast({ title: "Error", description: "No se pudo eliminar la palabra. Puede que ya haya sido eliminada.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting word:", error);
      toast({ title: "Error", description: "Ocurrió un error al eliminar la palabra.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setWordIdToDelete(null);
      setWordTextToDelete(null);
      setIsSubmitting(false);
    }
  };
  
  const handleEditWord = (word: AdminWordDoc) => {
    setEditingWord({...word}); 
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveEdit = async () => {
    if (!editingWord || !editingWord.text.trim()) {
      toast({ title: "Error", description: "El texto de la palabra no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateAdminWord(editingWord.id, { 
        text: editingWord.text, 
        difficultyLevel: editingWord.difficultyLevel,
        customSentence: editingWord.customSentence?.trim() || undefined,
        customTranslation: editingWord.customTranslation?.trim() || undefined,
      });
      toast({ title: "Éxito", description: "Palabra actualizada." });
      fetchWords();
      setEditingWord(null);
    } catch (error) {
      console.error("Error updating word:", error);
      toast({ title: "Error", description: "No se pudo actualizar la palabra.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const originalFileInput = event.target; 
    setIsSubmitting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvContent = e.target?.result as string;
      if (!csvContent) {
        toast({ title: "Error", description: "El archivo CSV está vacío.", variant: "destructive" });
        if (originalFileInput) originalFileInput.value = '';
        setIsSubmitting(false);
        return;
      }

      const lines = csvContent.split(/\r\n|\n/);
      let wordsToAdd: Array<{ text: string; difficultyLevel: DifficultyLevel; customTranslation?: string; customSentence?: string; customImageUrl?: string }> = [];
      let formatErrors: string[] = [];
      let skippedDuplicates = 0;
      
      const currentAdminWords = await getAdminWords(); 
      const existingWordTexts = new Set(currentAdminWords.map(w => w.text.toLowerCase()));

      lines.forEach((line, lineIndex) => {
        if (line.trim() === '') return; 

        const items = line.split(',').map(item => item.trim());
        
        if (items.length === 0 || (items.length === 1 && items[0] === '')) return; 

        if (items.length < 2 || items.length > 5) { 
          formatErrors.push(`Línea ${lineIndex + 1}: Formato incorrecto. Se esperan 2 a 5 campos (palabra,dificultad[,traduccion_opcional[,oracion_opcional[,url_imagen_opcional]]]). Encontrados: ${items.length} ('${line}').`);
          return; 
        }

        const text = items[0];
        const difficultyStr = items[1]?.toLowerCase();
        const translation = items.length > 2 ? items[2] : undefined; 
        const sentence = items.length > 3 ? items[3] : undefined;
        const imageUrl = items.length > 4 ? items[4] : undefined; 

        if (!text) {
          formatErrors.push(`Línea ${lineIndex + 1}: El texto de la palabra está vacío.`);
          return;
        }

        if (!difficultyStr || !difficultyLevels.includes(difficultyStr as DifficultyLevel)) {
          formatErrors.push(`Línea ${lineIndex + 1}: Dificultad '${items[1] || ''}' inválida para '${text}'. Use easy, medium, o hard.`);
          return;
        }
        
        const wordExistsInStore = existingWordTexts.has(text.toLowerCase());
        const wordExistsInCurrentBatch = wordsToAdd.some(w => w.text.toLowerCase() === text.toLowerCase());

        if (wordExistsInStore || wordExistsInCurrentBatch) {
          skippedDuplicates++;
          return; 
        }
        wordsToAdd.push({ 
            text, 
            difficultyLevel: difficultyStr as DifficultyLevel, 
            customTranslation: translation?.trim() || undefined,
            customSentence: sentence?.trim() || undefined,
            customImageUrl: imageUrl?.trim() || undefined 
        });
      });

      if (formatErrors.length > 0) {
        const errorListItems = formatErrors.slice(0, 5).map((err, idx) => <li key={idx}>{err}</li>);
        if (formatErrors.length > 5) {
          errorListItems.push(<li key="more">Y {formatErrors.length - 5} más errores...</li>);
        }
        toast({
          title: `Errores de Formato en CSV (${formatErrors.length})`,
          description: <ul>{errorListItems}</ul>,
          variant: "destructive",
          duration: 10000,
        });
      }

      if (wordsToAdd.length === 0 && formatErrors.length === 0) {
          toast({ title: "CSV Procesado", description: `No se encontraron nuevas palabras para agregar. ${skippedDuplicates > 0 ? `${skippedDuplicates} duplicada(s) omitida(s).` : 'Revisa el archivo o los errores de formato.'}`, variant: "default", duration: 5000 });
          if (originalFileInput) originalFileInput.value = '';
          setIsSubmitting(false);
          return;
      }
      
      if (wordsToAdd.length > 0) {
          let addedCount = 0;
          try {
              for (const wordData of wordsToAdd) {
                  await addAdminWord(wordData);
                  addedCount++;
              }
              toast({
                  title: "Éxito Parcial o Total",
                  description: `${addedCount} palabra(s) añadida(s) desde el CSV. ${skippedDuplicates > 0 ? `${skippedDuplicates} duplicada(s) omitida(s).`: ''} ${formatErrors.length > 0 ? `${formatErrors.length} línea(s) con error(es) de formato no se procesaron.` : ''}`,
                  duration: 7000
              });
              fetchWords();
          } catch (error) {
              console.error("Error adding words from CSV:", error);
              toast({ title: "Error en Carga Masiva", description: "No se pudieron añadir algunas palabras del CSV. Revise la consola.", variant: "destructive" });
          }
      } else if (skippedDuplicates > 0 && formatErrors.length === 0) {
           toast({ title: "CSV Procesado", description: `No se añadieron nuevas palabras. ${skippedDuplicates} duplicada(s) omitida(s).`, variant: "default" });
      }
      if (originalFileInput) originalFileInput.value = ''; 
      setIsSubmitting(false);
    };

    reader.onerror = () => {
      toast({ title: "Error", description: "No se pudo leer el archivo.", variant: "destructive" });
      if (originalFileInput) originalFileInput.value = '';
      setIsSubmitting(false);
    };
    reader.readAsText(file);
  };

  const handleSelectAllDisplayedWords = (checked: boolean | 'indeterminate') => {
    const newSelectedIds = new Set(selectedWordIds);
    if (checked === true) {
      displayedWords.forEach(word => newSelectedIds.add(word.id));
    } else { 
      displayedWords.forEach(word => newSelectedIds.delete(word.id));
    }
    setSelectedWordIds(newSelectedIds);
  };

  const handleSelectWord = (wordId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedWordIds);
    if (checked) {
      newSelectedIds.add(wordId);
    } else {
      newSelectedIds.delete(wordId);
    }
    setSelectedWordIds(newSelectedIds);
  };

  const handleRequestBulkDelete = () => {
    if (selectedWordIds.size === 0) {
      toast({ title: "Nada Seleccionado", description: "Por favor, selecciona al menos una palabra para eliminar.", variant: "default" });
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    setIsSubmitting(true); 
    let deletedCount = 0;
    let errorCount = 0;
    const idsToDelete = Array.from(selectedWordIds);

    for (const wordId of idsToDelete) {
      try {
        const success = await deleteAdminWord(wordId);
        if (success) {
          deletedCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error deleting word ${wordId}:`, error);
        errorCount++;
      }
    }

    if (deletedCount > 0) {
      toast({ title: "Éxito Parcial o Total", description: `${deletedCount} palabra(s) eliminada(s).` });
    }
    if (errorCount > 0) {
      toast({ title: "Errores en Eliminación", description: `${errorCount} palabra(s) no pudieron ser eliminada(s).`, variant: "destructive" });
    }
    
    setSelectedWordIds(new Set());
    fetchWords(); 
    setIsBulkDeleteDialogOpen(false);
    setIsSubmitting(false);
  };

  const isAllDisplayedSelected = displayedWords.length > 0 && displayedWords.every(word => selectedWordIds.has(word.id));
  const isSomeDisplayedSelected = displayedWords.length > 0 && selectedWordIds.size > 0 && !isAllDisplayedSelected && displayedWords.some(word => selectedWordIds.has(word.id));


  const handleGenerateAITranslationForWordInTable = async (wordId: string, wordText: string) => {
    if (isGeneratingTranslationAdmin) {
      toast({ title: "Info", description: "Ya hay una generación de traducción en curso.", variant: "default"});
      return;
    }
    setIsGeneratingTranslationAdmin(wordId);
    try {
      const result = await getWordTranslation({ word: wordText, targetLanguage: 'es' });
      const updatedWord = await updateAdminWord(wordId, { customTranslation: result.translatedText });
      if (updatedWord) {
        setWords(prevWords => prevWords.map(w => w.id === wordId ? updatedWord : w));
        toast({ title: "Traducción IA Guardada", description: `Traducción para "${wordText}" actualizada.` });
      } else {
        toast({ title: "Error", description: "No se pudo actualizar la palabra con la traducción IA.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error generating or saving AI translation:", error);
      toast({ title: "Error de IA", description: "No se pudo generar o guardar la traducción.", variant: "destructive" });
    } finally {
      setIsGeneratingTranslationAdmin(null);
    }
  };

  const globalDisabled = isLoading || isSubmitting || isGeneratingSentenceAdmin || !!isGeneratingTranslationAdmin || aiImagePreview?.isLoading;


  if (isLoading && words.length === 0) { 
    return <div className="container mx-auto py-10 px-4 flex justify-center items-center min-h-[calc(100vh-20rem)]"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-headline text-primary">Añadir Nueva Palabra Manualmente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddWord} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="newWordText" className="font-medium">Palabra</Label>
                <Input
                  id="newWordText"
                  value={newWordText}
                  onChange={(e) => setNewWordText(e.target.value)}
                  placeholder="Escribe la palabra"
                  required
                  className="h-11 rounded-md text-sm sm:text-base"
                  disabled={globalDisabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newWordDifficulty" className="font-medium">Dificultad</Label>
                <Select value={newWordDifficulty} onValueChange={(val) => setNewWordDifficulty(val as DifficultyLevel)} disabled={globalDisabled}>
                  <SelectTrigger id="newWordDifficulty" className="h-11 rounded-md text-sm sm:text-base">
                    <SelectValue placeholder="Selecciona dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map(level => (
                      <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                <Label htmlFor="newWordTranslation" className="font-medium">Traducción (opcional)</Label>
                 <div className="flex items-center gap-2">
                    <Input
                    id="newWordTranslation"
                    value={newWordTranslation}
                    onChange={(e) => setNewWordTranslation(e.target.value)}
                    placeholder="Ej: Elefante"
                    className="flex-grow h-11 rounded-md text-sm sm:text-base"
                    disabled={globalDisabled}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateAITranslationForNewWord}
                        disabled={!newWordText.trim() || globalDisabled}
                        title="Generar traducción con IA"
                        className="h-11 w-11 rounded-md flex-shrink-0"
                        >
                        <VenetianMask className={`h-5 w-5 ${isGeneratingTranslationAdmin === "newWord" ? 'animate-pulse' : ''}`} />
                    </Button>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newWordSentence" className="font-medium">Oración Personalizada (opcional)</Label>
              <div className="flex items-center gap-2">
                <Textarea
                  id="newWordSentence"
                  value={newWordSentence}
                  onChange={(e) => setNewWordSentence(e.target.value)}
                  placeholder="Ej: El elefante es grande."
                  rows={2}
                  className="flex-grow rounded-md text-sm sm:text-base"
                  disabled={globalDisabled}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateAISentenceForNewWord}
                  disabled={!newWordText.trim() || globalDisabled}
                  title="Generar oración con IA"
                  className="h-full w-11 rounded-md flex-shrink-0"
                >
                  <Sparkles className={`h-5 w-5 ${isGeneratingSentenceAdmin ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto h-11 rounded-lg text-base px-6" disabled={globalDisabled}>
              {isSubmitting && !isGeneratingSentenceAdmin && !isGeneratingTranslationAdmin ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />} 
              Añadir Palabra
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-headline text-primary">Añadir Palabras desde CSV</CardTitle>
          <CardDescription className="text-sm">
            Sube un archivo CSV. Formato por línea: <strong>palabra,dificultad[,traducción_opcional[,oración_opcional[,url_imagen_opcional]]]</strong>.
            <br />Ej: apple,easy,Manzana,An apple is red.,https://placehold.co/100x100.png
            <br />Las dificultades válidas son 'easy', 'medium', 'hard'. Se omitirán duplicados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <Label htmlFor="csvFile" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-11 px-6 w-full md:w-auto">
              <FileUp className="mr-2 h-5 w-5"/> Seleccionar CSV
            </Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden" 
              disabled={globalDisabled}
            />
            <span className="text-sm text-muted-foreground italic flex-grow">{(document.getElementById('csvFile') as HTMLInputElement)?.files?.[0]?.name || "Ningún archivo seleccionado."}</span>
          </div>
        </CardContent>
      </Card>
      
      {editingWord && (
        <Card className="rounded-xl shadow-lg border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-headline text-primary">Editando Palabra: "{editingWord.text}"</CardTitle>
             <CardDescription>Modifica los detalles. La imagen se gestiona en la tabla de abajo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editingWordText" className="font-medium">Texto de Palabra</Label>
                <Input
                  id="editingWordText"
                  value={editingWord.text}
                  onChange={(e) => setEditingWord(prev => prev ? {...prev, text: e.target.value} : null)}
                  className="h-11 rounded-md text-sm sm:text-base"
                  disabled={globalDisabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editingWordDifficulty" className="font-medium">Dificultad</Label>
                <Select 
                  value={editingWord.difficultyLevel} 
                  onValueChange={(val) => setEditingWord(prev => prev ? {...prev, difficultyLevel: val as DifficultyLevel} : null)}
                  disabled={globalDisabled}
                >
                  <SelectTrigger id="editingWordDifficulty" className="h-11 rounded-md text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map(level => (
                      <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                <Label htmlFor="editingWordTranslation" className="font-medium">Traducción</Label>
                <div className="flex items-center gap-2">
                    <Input
                    id="editingWordTranslation"
                    value={editingWord.customTranslation || ''}
                    onChange={(e) => setEditingWord(prev => prev ? {...prev, customTranslation: e.target.value} : null)}
                    placeholder="Traducción al español"
                    className="flex-grow h-11 rounded-md text-sm sm:text-base"
                    disabled={globalDisabled}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateAITranslationForEditingWord}
                        disabled={!editingWord?.text.trim() || globalDisabled || isGeneratingTranslationAdmin === editingWord.id}
                        title="Generar traducción con IA"
                        className="h-11 w-11 rounded-md flex-shrink-0"
                        >
                        <VenetianMask className={`h-5 w-5 ${isGeneratingTranslationAdmin === editingWord.id ? 'animate-pulse' : ''}`} />
                    </Button>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editingWordSentence" className="font-medium">Oración Personalizada</Label>
              <div className="flex items-center gap-2">
                <Textarea
                  id="editingWordSentence"
                  value={editingWord.customSentence || ''}
                  onChange={(e) => setEditingWord(prev => prev ? {...prev, customSentence: e.target.value} : null)}
                  placeholder="Escribe una oración de ejemplo o genérala con IA"
                  rows={3}
                  className="flex-grow rounded-md text-sm sm:text-base"
                  disabled={globalDisabled}
                />
                 <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateAISentenceForEditingWord}
                  disabled={!editingWord?.text.trim() || globalDisabled || isGeneratingSentenceAdmin}
                  title="Generar oración con IA"
                  className="h-full w-11 rounded-md flex-shrink-0"
                >
                  <Sparkles className={`h-5 w-5 ${isGeneratingSentenceAdmin ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 p-4">
            <Button variant="outline" onClick={() => setEditingWord(null)} disabled={globalDisabled} className="h-11 rounded-lg text-base px-6">Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={globalDisabled} className="w-full md:w-auto h-11 rounded-lg text-base px-6 bg-primary text-primary-foreground hover:bg-primary/90">
              {isSubmitting && !isGeneratingSentenceAdmin && !isGeneratingTranslationAdmin ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
              Guardar Cambios
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card className="rounded-xl shadow-lg">
        <CardHeader className="flex flex-col lg:flex-row justify-between items-start gap-4 p-4">
          <div className="space-y-1 flex-grow">
            <CardTitle className="text-xl md:text-2xl font-headline text-primary">Lista de Palabras ({words.length} total, {displayedWords.length} mostradas)</CardTitle>
            <CardDescription className="text-sm">Gestiona las palabras. {selectedWordIds.size > 0 && `${selectedWordIds.size} seleccionada(s).`}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 w-full lg:w-auto">
            <div className="flex items-center space-x-2 order-first lg:order-none w-full sm:w-auto py-2 px-3 border rounded-md bg-background hover:bg-secondary/30 transition-colors">
              <Checkbox
                id="filterActive"
                checked={filterActiveOnly}
                onCheckedChange={(checked) => setFilterActiveOnly(Boolean(checked))}
                disabled={globalDisabled}
                className="h-5 w-5"
              />
              <Label htmlFor="filterActive" className="text-sm font-medium whitespace-nowrap cursor-pointer">
                <Filter className="inline mr-1.5 h-4 w-4" /> Mostrar solo activas
              </Label>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleRequestBulkDelete} 
              disabled={globalDisabled || selectedWordIds.size === 0}
              className="w-full sm:w-auto lg:w-full xl:w-auto h-10 rounded-md text-sm"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedWordIds.size})
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchWords} 
              disabled={globalDisabled}
              className="w-full sm:w-auto lg:w-full xl:w-auto h-10 rounded-md text-sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${(isLoading && words.length > 0) || isSubmitting ? 'animate-spin' : ''}`} /> Refrescar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-2">
          {displayedWords.length === 0 && !isLoading ? (
             <p className="text-center text-muted-foreground py-8 text-lg">
                {filterActiveOnly ? "No hay palabras activas que coincidan." : "¡Añade algunas palabras!"}
             </p>
          ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
            <TableCaption className="py-4">Haz clic en <Edit3 size={14} className="inline"/> para editar una palabra o en <Checkbox id="temp" className="h-3 w-3 inline-block align-middle"/> para seleccionar.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] p-2 text-xs sm:p-3 sm:text-sm md:p-4 md:text-base font-medium">
                    <Checkbox
                      checked={isAllDisplayedSelected ? true : (isSomeDisplayedSelected ? "indeterminate" : false)}
                      onCheckedChange={(checked) => handleSelectAllDisplayedWords(Boolean(checked))}
                      aria-label="Seleccionar todas las palabras visibles"
                      disabled={globalDisabled || displayedWords.length === 0}
                      className="h-5 w-5"
                    />
                  </TableHead>
                  <TableHead className="p-2 text-xs sm:p-3 sm:text-sm md:p-4 md:text-base font-medium">Palabra</TableHead>
                  <TableHead className="p-2 text-xs sm:p-3 sm:text-sm md:p-4 md:text-base font-medium">Dificultad</TableHead>
                  <TableHead className="p-2 text-xs sm:p-3 sm:text-sm md:p-4 md:text-base font-medium">Activa</TableHead>
                  <TableHead className="min-w-[280px] sm:min-w-[320px] p-2 text-xs sm:p-3 sm:text-sm md:p-4 md:text-base font-medium">Imagen</TableHead>
                  <TableHead className="p-2 text-xs sm:p-3 sm:text-sm md:p-4 md:text-base font-medium whitespace-pre-wrap">Traducción</TableHead>
                  <TableHead className="p-2 text-xs sm:p-3 sm:text-sm md:p-4 md:text-base font-medium whitespace-pre-wrap">Oración</TableHead>
                  <TableHead className="text-right p-2 text-xs sm:p-3 sm:text-sm md:p-4 md:text-base font-medium">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedWords.map((word) => (
                  <TableRow key={word.id} data-state={selectedWordIds.has(word.id) ? "selected" : ""} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="p-2 text-xs sm:p-3 sm:text-sm md:p-4">
                      <Checkbox
                        checked={selectedWordIds.has(word.id)}
                        onCheckedChange={(checked) => handleSelectWord(word.id, !!checked)}
                        aria-label={`Seleccionar palabra ${word.text}`}
                        disabled={globalDisabled}
                        className="h-5 w-5"
                      />
                    </TableCell>
                    <TableCell className="font-medium min-w-[120px] p-2 text-xs sm:p-3 sm:text-sm md:p-4">{word.text}</TableCell>
                    <TableCell className="min-w-[100px] p-2 text-xs sm:p-3 sm:text-sm md:p-4">{word.difficultyLevel}</TableCell>
                    <TableCell className="p-2 text-xs sm:p-3 sm:text-sm md:p-4">
                      <Checkbox
                        checked={word.isActive}
                        onCheckedChange={(checked) => handleToggleActive(word.id, !!checked)}
                        id={`active-${word.id}`}
                        aria-label={`Activar o desactivar la palabra ${word.text}`}
                        disabled={globalDisabled}
                        className="h-5 w-5"
                      />
                    </TableCell>
                    <TableCell className="space-y-2 p-2 text-xs sm:p-3 sm:text-sm md:p-4">
                      <div className="flex flex-col items-start gap-2">
                        {word.customImageUrl && (
                          <Image 
                            src={word.customImageUrl} 
                            alt={`Imagen de ${word.text}`} 
                            width={100} 
                            height={60} 
                            className="rounded-md object-cover border shadow-sm" 
                            data-ai-hint={`${word.text} custom image`}
                            unoptimized={word.customImageUrl.startsWith('data:') || word.customImageUrl.startsWith('http')}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://placehold.co/100x60.png?text=Error`; 
                                target.srcset = ""; 
                              }
                            }
                          />
                        )}
                         <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                            <Label htmlFor={`upload-${word.id}`} className={cn(`cursor-pointer text-primary hover:underline flex items-center gap-1`, globalDisabled ? 'opacity-50 cursor-not-allowed' : '')}>
                                <UploadCloud className="h-4 w-4" /> 
                                <span>{word.customImageUrl && word.customImageUrl.startsWith('data:') ? 'Cambiar' : 'Subir Local'}</span>
                            </Label>
                            <Input
                                id={`upload-${word.id}`}
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                                onChange={(e) => handleImageUpload(word.id, e)}
                                disabled={globalDisabled}
                            />
                            <Button 
                                variant="link" 
                                size="sm" 
                                className={cn(`p-0 h-auto text-accent hover:underline flex items-center gap-1 text-xs sm:text-sm`, globalDisabled || aiImagePreview?.isLoading ? 'opacity-50 cursor-not-allowed' : '')}
                                onClick={() => handleGenerateAIImage(word.id, word.text)}
                                disabled={aiImagePreview?.isLoading || globalDisabled}
                            >
                                <Sparkles className={`h-4 w-4 ${aiImagePreview?.isLoading && aiImagePreview.wordId === word.id ? 'animate-pulse' : ''}`} /> 
                                <span>{aiImagePreview?.isLoading && aiImagePreview.wordId === word.id ? 'Generando...' : 'Imagen IA'}</span>
                            </Button>
                         </div>
                        {aiImagePreview?.wordId === word.id && !aiImagePreview.isLoading && aiImagePreview.imageUrl && (
                          <div className="mt-2 p-2.5 border rounded-md bg-secondary/20 space-y-2 shadow">
                            <p className="text-xs font-medium text-center text-muted-foreground">Vista Previa Imagen IA:</p>
                            <Image 
                              src={aiImagePreview.imageUrl} 
                              alt={`AI preview for ${word.text}`} 
                              width={120} height={75} 
                              className="rounded-md object-cover mx-auto border" 
                              data-ai-hint={`${word.text} AI generated`} 
                              unoptimized={true} />
                            <div className="flex justify-around gap-1 mt-1">
                              <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-500/10 h-8 px-2 text-xs" onClick={() => handleAcceptAIImage(word.id, aiImagePreview.imageUrl)}>
                                <Check className="mr-1 h-4 w-4" /> Aceptar
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-500/10 h-8 px-2 text-xs" onClick={handleRejectAIImage}>
                                <X className="mr-1 h-4 w-4" /> Rechazar
                              </Button>
                            </div>
                          </div>
                        )}
                        {aiImagePreview?.wordId === word.id && aiImagePreview.isLoading && (
                            <div className="mt-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Cargando vista previa IA...</div>
                        )}
                         <div className="flex items-center gap-2 w-full mt-1.5">
                            <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Input
                                type="url"
                                placeholder="Pegar URL de imagen web"
                                value={webImageUrlInputs[word.id] || ''}
                                onChange={(e) => handleWebImageUrlInputChange(word.id, e.target.value)}
                                className="h-9 text-xs rounded-md flex-grow"
                                disabled={globalDisabled}
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetWebImageUrl(word.id)}
                                disabled={globalDisabled || !webImageUrlInputs[word.id]?.trim()}
                                className="text-xs h-9 rounded-md flex-shrink-0"
                            >
                                Usar URL
                            </Button>
                        </div>
                      </div>
                    </TableCell>
                     <TableCell className="min-w-[180px] sm:min-w-[220px] p-2 text-xs sm:p-3 sm:text-sm md:p-4 whitespace-pre-wrap">
                      <div className="flex flex-col gap-1.5 items-start">
                        {word.customTranslation ? (
                          <p title={word.customTranslation} className="max-w-xs text-foreground">
                            <VenetianMask className="inline mr-1.5 h-4 w-4 text-muted-foreground" />
                            {word.customTranslation.length > 50 ? `${word.customTranslation.substring(0, 50)}...` : word.customTranslation}
                          </p>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Sin traducción personalizada</span>
                        )}
                        <Button
                            variant="link"
                            size="sm"
                            className={cn("p-0 h-auto text-accent hover:underline text-xs flex items-center gap-1", globalDisabled || isGeneratingTranslationAdmin === word.id ? 'opacity-50 cursor-not-allowed' : '')}
                            onClick={() => handleGenerateAITranslationForWordInTable(word.id, word.text)}
                            disabled={globalDisabled || isGeneratingTranslationAdmin === word.id}
                            title="Generar y guardar traducción con IA"
                        >
                            <VenetianMask className={`h-3.5 w-3.5 ${isGeneratingTranslationAdmin === word.id ? 'animate-pulse' : ''}`} />
                           {isGeneratingTranslationAdmin === word.id ? 'Traduciendo...' : 'Traducir con IA'}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px] sm:min-w-[220px] p-2 text-xs sm:p-3 sm:text-sm md:p-4 whitespace-pre-wrap">
                      {word.customSentence ? (
                        <p title={word.customSentence} className="max-w-xs text-foreground">
                          <MessageSquareQuote className="inline mr-1.5 h-4 w-4 text-muted-foreground" />
                          {word.customSentence.length > 50 ? `${word.customSentence.substring(0, 50)}...` : word.customSentence}
                        </p>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Sin oración personalizada</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right min-w-[90px] sm:min-w-[110px] p-2 text-xs sm:p-3 sm:text-sm md:p-4">
                      <div className="flex flex-col sm:flex-row justify-end items-center gap-0.5">
                        <Button variant="ghost" size="icon" onClick={() => handleEditWord(word)} title="Editar Palabra" disabled={globalDisabled} className="hover:bg-primary/10 text-primary/80 hover:text-primary">
                          <Edit3 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => requestDeleteWord(word.id, word.text)} title="Eliminar Palabra" disabled={globalDisabled} className="hover:bg-destructive/10 text-destructive/80 hover:text-destructive">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-headline">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Esta acción no se puede deshacer. Se eliminará permanentemente la palabra
              <strong className="text-foreground px-1">"{wordTextToDelete || ''}"</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel onClick={() => { setWordIdToDelete(null); setWordTextToDelete(null); }} className="h-10 rounded-lg text-base">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteWord} className="bg-destructive hover:bg-destructive/90 h-10 rounded-lg text-base text-destructive-foreground">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Trash2 className="mr-2 h-5 w-5"/>}
                Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-headline">¿Confirmar Eliminación Múltiple?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Se eliminarán permanentemente <strong className="text-foreground px-1">{selectedWordIds.size}</strong> palabra(s). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={isSubmitting} className="h-10 rounded-lg text-base">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90 h-10 rounded-lg text-base text-destructive-foreground">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trash2 className="mr-2 h-5 w-5" /> }
              Eliminar Seleccionadas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
