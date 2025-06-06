
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BookOpenText, Target, Zap, Sparkles, Play } from 'lucide-react'; // Added Sparkles, Play

type Mode = 'practice' | 'test';
type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyLabels: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
};

const modeIcons: Record<Mode, React.ElementType> = {
  practice: BookOpenText,
  test: Target,
};

const difficultyIcons: Record<Difficulty, React.ElementType> = {
  easy: Sparkles, // Using Sparkles for a more playful feel
  medium: Zap,
  hard: Target, // Re-using Target, or another icon can be chosen
};

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('practice');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const router = useRouter();

  const startGame = () => {
    router.push(`/play/${mode}/${difficulty}`);
  };

  return (
    <div className="flex flex-col flex-grow">
      <main className="flex-grow flex items-center justify-center p-2 sm:p-4 bg-gradient-to-br from-background to-secondary/40">
        <Card className="w-full max-w-lg sm:max-w-xl shadow-2xl rounded-xl">
          <CardHeader className="text-center pt-8 pb-4 sm:pt-10 sm:pb-6">
            <div className="flex justify-center items-center mb-3 sm:mb-4">
              <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-accent" />
            </div>
            <CardTitle className="font-headline text-4xl sm:text-5xl md:text-6xl mb-2 text-shadow-playful">Meeryn-Bee</CardTitle>
            <CardDescription className="text-md sm:text-lg text-muted-foreground">¡Practica y conviértete en un campeón de deletreo!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-8">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-center font-headline text-primary">Elige Tu Modo de Juego</h3>
              <RadioGroup
                value={mode}
                onValueChange={(value: string) => setMode(value as Mode)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
              >
                {(Object.keys(modeIcons) as Mode[]).map((modeKey) => {
                  const Icon = modeIcons[modeKey];
                  return (
                    <Label
                      key={modeKey}
                      htmlFor={`${modeKey}-mode`}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 sm:p-6 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:scale-105 ${
                        mode === modeKey ? 'border-primary ring-4 ring-primary/50 shadow-primary/30 shadow-lg bg-primary/5' : 'border-border hover:border-primary/70'
                      }`}
                    >
                      <RadioGroupItem value={modeKey} id={`${modeKey}-mode`} className="sr-only" />
                      <Icon className={`w-10 h-10 sm:w-12 sm:w-12 mb-2 sm:mb-3 ${mode === modeKey ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'}`} />
                      <span className="font-medium text-md sm:text-lg text-center">{modeKey === 'practice' ? 'Modo Práctica' : 'Modo Examen'}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground text-center mt-1">
                        {modeKey === 'practice' ? 'Aprende con imágenes y ayudas' : 'Pon a prueba tus habilidades'}
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-center font-headline text-primary">Selecciona la Dificultad</h3>
              <RadioGroup
                value={difficulty}
                onValueChange={(value: string) => setDifficulty(value as Difficulty)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
              >
                {(Object.keys(difficultyLabels) as Difficulty[]).map((level) => {
                  const Icon = difficultyIcons[level];
                  return (
                  <Label
                    key={level}
                    htmlFor={`${level}-difficulty`}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 sm:p-4 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:scale-105 ${
                      difficulty === level ? 'border-accent ring-4 ring-accent/50 shadow-accent/30 shadow-lg bg-accent/5' : 'border-border hover:border-accent/70'
                    }`}
                  >
                    <RadioGroupItem value={level} id={`${level}-difficulty`} className="sr-only" />
                     <Icon className={`w-8 h-8 sm:w-10 sm:w-10 mb-1 sm:mb-2 ${difficulty === level ? 'text-accent' : 'text-muted-foreground group-hover:text-accent/80'}`} />
                    <span className="font-medium text-md sm:text-lg">{difficultyLabels[level]}</span>
                  </Label>
                );
                })}
              </RadioGroup>
            </div>

            <Button
              onClick={startGame}
              className="w-full text-lg sm:text-xl py-4 sm:py-5 rounded-lg bg-accent hover:bg-accent/80 text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105"
              size="lg" // Shadcn 'lg' size
            >
              <Play className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Comenzar a Deletrear
            </Button>
          </CardContent>
        </Card>
      </main>
       <footer className="text-center p-4 sm:p-6 text-muted-foreground text-sm sm:text-base">
        🐝 Creado con amor por tu papá 🐝
      </footer>
    </div>
  );
}
