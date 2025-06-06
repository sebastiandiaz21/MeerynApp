
import GameClient from '@/components/GameClient';
import type { DifficultyLevel, GameMode } from '@/types';
import { redirect } from 'next/navigation';

interface GamePageProps {
  params: {
    mode: string;
    difficulty: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  const mode = params.mode as GameMode;
  const difficulty = params.difficulty as DifficultyLevel;

  const validModes: GameMode[] = ['practice', 'test'];
  const validDifficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];

  if (!validModes.includes(mode) || !validDifficulties.includes(difficulty)) {
    console.warn(`Invalid mode or difficulty. Mode: ${mode}, Difficulty: ${difficulty}. Redirecting to home.`);
    redirect('/');
  }
  
  return (
    <div className="flex flex-col flex-grow"> {/* Changed min-h-screen to flex-grow */}
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <GameClient mode={mode} difficulty={difficulty} />
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm">
        Meeryn-Bee - Desafío de Deletreo
      </footer>
    </div>
  );
}
