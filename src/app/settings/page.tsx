
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Sun, Moon, Laptop, Settings as SettingsIcon, Palette, ListTree } from 'lucide-react'; // Added Palette, ListTree
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from 'next-themes';
import { getAdminWords } from '@/actions/adminActions';
import type { AdminWordDoc } from '@/types';

const DEFAULT_WORDS_PER_GAME_CONFIG = 5;
const MIN_WORDS_PER_GAME_CONFIG = 3;
const MAX_WORDS_SLIDER_UPPER_LIMIT = 20;

export default function SettingsPage() {
  const [wordsPerGame, setWordsPerGame] = useState<number>(DEFAULT_WORDS_PER_GAME_CONFIG);
  const [sliderMax, setSliderMax] = useState<number>(DEFAULT_WORDS_PER_GAME_CONFIG);
  const [isLoadingSliderConfig, setIsLoadingSliderConfig] = useState(true);
  
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedWordsPerGame = localStorage.getItem('wordsPerGame');
    if (savedWordsPerGame) {
      const num = parseInt(savedWordsPerGame, 10);
      setWordsPerGame(Math.max(MIN_WORDS_PER_GAME_CONFIG, Math.min(num, MAX_WORDS_SLIDER_UPPER_LIMIT)));
    } else {
      setWordsPerGame(DEFAULT_WORDS_PER_GAME_CONFIG);
    }

    async function fetchAdminWordCountAndUpdateSlider() {
      setIsLoadingSliderConfig(true);
      try {
        const adminWords: AdminWordDoc[] = await getAdminWords();
        const activeAdminWordCount = adminWords.filter(w => w.isActive).length;
        
        const calculatedMaxForSlider = Math.min(activeAdminWordCount, MAX_WORDS_SLIDER_UPPER_LIMIT);
        const finalMax = Math.max(MIN_WORDS_PER_GAME_CONFIG, calculatedMaxForSlider);
        
        setSliderMax(finalMax);
        
        setWordsPerGame(currentNumWords => 
            Math.max(MIN_WORDS_PER_GAME_CONFIG, Math.min(currentNumWords, finalMax))
        );

      } catch (error) {
        console.error("Error fetching admin words for slider config:", error);
        const fallbackMax = Math.max(MIN_WORDS_PER_GAME_CONFIG, DEFAULT_WORDS_PER_GAME_CONFIG);
        setSliderMax(fallbackMax);
        setWordsPerGame(currentNumWords => 
            Math.max(MIN_WORDS_PER_GAME_CONFIG, Math.min(currentNumWords, fallbackMax))
        );
      } finally {
        setIsLoadingSliderConfig(false);
      }
    }
    fetchAdminWordCountAndUpdateSlider();
  }, []); 

  const handleWordsPerGameChange = (value: number[]) => {
    const clampedValue = Math.max(MIN_WORDS_PER_GAME_CONFIG, Math.min(value[0], sliderMax));
    setWordsPerGame(clampedValue);
  };

  const saveWordsPerGame = () => {
    localStorage.setItem('wordsPerGame', wordsPerGame.toString());
    toast({ title: 'Ajuste Guardado', description: `Número de palabras por juego establecido en ${wordsPerGame}.` });
  };

  if (!mounted) {
    return (
      <div className="container mx-auto py-10 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SettingsIcon className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun, color: 'text-yellow-500' },
    { value: 'dark', label: 'Oscuro', icon: Moon, color: 'text-indigo-500' },
    { value: 'system', label: 'Sistema', icon: Laptop, color: 'text-muted-foreground' },
  ];

  return (
    <div className="container mx-auto py-6 sm:py-10 px-2 sm:px-4">
      <Card className="w-full max-w-lg sm:max-w-2xl mx-auto shadow-xl rounded-xl">
        <CardHeader className="pt-8 pb-4 text-center">
          <SettingsIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3" />
          <CardTitle className="font-headline text-3xl sm:text-4xl text-shadow-playful">Preferencias del Juego</CardTitle>
          <CardDescription className="text-md sm:text-lg text-muted-foreground">
            Personaliza tu experiencia en Meeryn-Bee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 sm:space-y-10 p-4 sm:p-8">
          <Card className="rounded-lg overflow-hidden shadow-md">
            <CardHeader className="p-4 sm:p-6 bg-secondary/20">
              <div className="flex items-center gap-3">
                <Palette className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                <div>
                  <CardTitle className="text-lg sm:text-xl font-headline">Apariencia Visual</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Elige cómo se ve la aplicación.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <RadioGroup
                value={theme}
                onValueChange={setTheme}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
              >
                {themeOptions.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <Label
                      key={opt.value}
                      htmlFor={`${opt.value}-theme`}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 sm:p-5 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:scale-105 ${
                        theme === opt.value ? 'border-primary ring-4 ring-primary/50 shadow-primary/30 shadow-lg bg-primary/5' : 'border-border hover:border-primary/70'
                      }`}
                    >
                      <RadioGroupItem value={opt.value} id={`${opt.value}-theme`} className="sr-only" />
                      <Icon className={`w-8 h-8 sm:w-10 sm:w-10 mb-2 ${theme === opt.value ? opt.color : 'text-muted-foreground/70 group-hover:text-primary/80'}`} />
                      <span className="font-medium text-sm sm:text-base">{opt.label}</span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="rounded-lg overflow-hidden shadow-md">
            <CardHeader className="p-4 sm:p-6 bg-secondary/20">
              <div className="flex items-center gap-3">
                <ListTree className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
                <div>
                  <CardTitle className="text-lg sm:text-xl font-headline">Palabras por Juego</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Define cuántas palabras jugarás en cada sesión.
                    {isLoadingSliderConfig && " Cargando..."}
                    {!isLoadingSliderConfig && sliderMax === MIN_WORDS_PER_GAME_CONFIG && wordsPerGame === MIN_WORDS_PER_GAME_CONFIG && (
                        <span className="block mt-1 text-accent/80"> (Mínimo de {MIN_WORDS_PER_GAME_CONFIG} por pocas palabras activas disponibles).</span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-4 sm:p-6">
              <div className="flex items-center justify-center text-center">
                <Label htmlFor="wordsPerGameSlider" className="text-2xl sm:text-3xl font-bold text-accent font-headline">
                  {wordsPerGame}
                </Label>
                <span className="ml-2 text-lg sm:text-xl text-muted-foreground">palabras</span>
              </div>
              {isLoadingSliderConfig ? (
                <div className="h-3 w-full bg-muted rounded-full animate-pulse my-2"></div>
              ) : (
                <Slider
                  id="wordsPerGameSlider"
                  min={MIN_WORDS_PER_GAME_CONFIG}
                  max={sliderMax}
                  step={1}
                  value={[wordsPerGame]}
                  onValueChange={handleWordsPerGameChange}
                  className="w-full [&>span:last-child]:h-6 [&>span:last-child]:w-6 [&>span:last-child]:border-2 [&>span:last-child]:bg-background [&>span:last-child]:border-accent [&_[role=slider]>span]:bg-accent"
                  disabled={isLoadingSliderConfig || sliderMax === MIN_WORDS_PER_GAME_CONFIG}
                />
              )}
               <Button onClick={saveWordsPerGame} disabled={isLoadingSliderConfig} size="lg" className="w-full text-md sm:text-lg py-3 rounded-lg bg-accent hover:bg-accent/80 text-accent-foreground">
                  Guardar Cantidad
               </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
