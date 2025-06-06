
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AggregatedWordStat, AggregatedStatsResult } from '@/types';
import { getAggregatedWordStats, clearAllGameAttempts } from '@/actions/statisticsActions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertTriangle, ListChecks, Trash2, Percent, BarChartHorizontalBig, Activity, Loader2 } from 'lucide-react'; // Added icons
import { useToast } from '@/hooks/use-toast';
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


export default function KidStatistics() {
  const [stats, setStats] = useState<AggregatedWordStat[]>([]);
  const [overallAverageTestScore, setOverallAverageTestScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result: AggregatedStatsResult = await getAggregatedWordStats();
      setStats(result.wordStats);
      setOverallAverageTestScore(result.overallAverageTestScore);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("No se pudieron cargar las estadísticas. Intenta de nuevo más tarde.");
      toast({ title: "Error de Carga", description: "No se pudieron cargar las estadísticas.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleClearAttempts = async () => {
    setIsClearing(true);
    try {
      await clearAllGameAttempts();
      toast({ title: "Estadísticas Borradas", description: "Todos los intentos de juego han sido eliminados." });
      fetchStats(); 
    } catch (err) {
      console.error("Error clearing stats:", err);
      toast({ title: "Error al Borrar", description: "No se pudieron borrar las estadísticas.", variant: "destructive" });
    } finally {
      setIsClearing(false);
      setIsClearConfirmOpen(false);
    }
  };


  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-lg">
        <CardHeader className="text-center py-6">
          <BarChartHorizontalBig className="mx-auto h-10 w-10 text-primary mb-3" />
          <CardTitle className="text-xl md:text-2xl font-headline text-primary">Estadísticas del Niño</CardTitle>
          <CardDescription className="text-base">Cargando datos de progreso...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-lg border-2 border-destructive/50">
        <CardHeader className="text-center py-6">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-xl md:text-2xl font-headline text-destructive">Error en Estadísticas</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 space-y-4">
          <p className="text-destructive-foreground/80 text-lg">{error}</p>
          <Button onClick={fetchStats} variant="destructive" size="lg" className="text-base rounded-lg">
            <RefreshCw className="mr-2 h-5 w-5" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const overallTotalAttemptsAllModes = stats.reduce((sum, s) => sum + s.totalAttempts, 0);
  const overallCorrectAttemptsAllModes = stats.reduce((sum, s) => sum + s.correctAttempts, 0);
  const overallSuccessRateAllModes = overallTotalAttemptsAllModes > 0 
    ? parseFloat(((overallCorrectAttemptsAllModes / overallTotalAttemptsAllModes) * 100).toFixed(1)) 
    : 0;


  return (
    <Card className="rounded-xl shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4 p-5 sm:p-6">
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-1">
            <Activity className="h-7 w-7 text-primary"/>
            <CardTitle className="text-xl md:text-2xl font-headline text-primary">Progreso del Deletreador</CardTitle>
          </div>
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            Analiza el desempeño para identificar áreas de mejora.
            {stats.length > 0 && (
                <>
                <br />
                <span className="font-semibold">Global (todos los modos):</span> {overallCorrectAttemptsAllModes} de {overallTotalAttemptsAllModes} correctas ({overallSuccessRateAllModes}%).
                </>
            )}
            {overallAverageTestScore !== null && (
                <>
                <br />
                <span className="font-semibold">Promedio Global (Modo Examen):</span> {overallAverageTestScore}%.
                </>
            )}
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
          <Button onClick={fetchStats} variant="outline" size="sm" disabled={isLoading || isClearing} className="w-full sm:w-auto h-10 rounded-md text-sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
           <Button onClick={() => setIsClearConfirmOpen(true)} variant="destructive" size="sm" disabled={isLoading || isClearing || stats.length === 0} className="w-full sm:w-auto h-10 rounded-md text-sm">
            <Trash2 className="mr-2 h-4 w-4" /> Borrar Todo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-2">
        {stats.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ListChecks className="h-20 w-20 text-muted-foreground/50 mx-auto mb-5" />
            <p className="text-xl sm:text-2xl font-semibold text-muted-foreground mb-2">Aún no hay estadísticas.</p>
            <p className="text-sm sm:text-base text-muted-foreground">Completa algunas sesiones de juego para ver el progreso aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption className="py-4 text-xs">
                Las palabras se ordenan por menor tasa de éxito. La "corrección" considera un puntaje &ge;60% en Modo Examen.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] sm:min-w-[150px] p-3 md:p-4 text-base">Palabra</TableHead>
                  <TableHead className="p-3 md:p-4 text-base">Dificultad</TableHead>
                  <TableHead className="text-center p-3 md:p-4 text-base">Intentos</TableHead>
                  <TableHead className="text-center p-3 md:p-4 text-base">Correctos</TableHead>
                  <TableHead className="text-center p-3 md:p-4 text-base">Incorrectos</TableHead>
                  <TableHead className="text-right p-3 md:p-4 text-base">Tasa Éxito</TableHead>
                  <TableHead className="text-right p-3 md:p-4 text-base whitespace-nowrap">Prom. Score Examen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={`${stat.wordText}-${stat.difficulty}`} 
                    className={
                      stat.successRate < 50 ? 'bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20' : 
                      stat.successRate < 75 ? 'bg-yellow-500/10 hover:bg-yellow-500/20 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/20' : 
                      'hover:bg-muted/20 dark:hover:bg-muted/10'
                    }
                  >
                    <TableCell className="font-medium p-3 md:p-4 text-sm">{stat.wordText}</TableCell>
                    <TableCell className="p-3 md:p-4 text-sm">{stat.difficulty.charAt(0).toUpperCase() + stat.difficulty.slice(1)}</TableCell>
                    <TableCell className="text-center p-3 md:p-4 text-sm">{stat.totalAttempts}</TableCell>
                    <TableCell className="text-center text-green-600 dark:text-green-400 p-3 md:p-4 text-sm">{stat.correctAttempts}</TableCell>
                    <TableCell className="text-center text-red-600 dark:text-red-400 p-3 md:p-4 text-sm">{stat.incorrectAttempts}</TableCell>
                    <TableCell className="text-right font-semibold p-3 md:p-4 text-sm">{stat.successRate}%</TableCell>
                    <TableCell className="text-right font-semibold p-3 md:p-4 text-sm">
                      {stat.testModeAttemptsCount > 0 ? `${stat.averagePercentageScoreInTest}%` : <span className="text-muted-foreground/70">N/A</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
       {stats.length > 0 && (
         <CardFooter className="p-4 border-t">
            <p className="text-xs text-muted-foreground">
              Las estadísticas se guardan en memoria y se reiniciarán si el servidor de la aplicación se reinicia.
            </p>
         </CardFooter>
       )}

      <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
        <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-headline">¿Confirmar Borrado?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Se eliminarán permanentemente todos los registros de intentos de juego. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={isClearing} className="h-10 rounded-lg text-base">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAttempts} disabled={isClearing} className="bg-destructive hover:bg-destructive/90 h-10 rounded-lg text-base text-destructive-foreground">
              {isClearing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trash2 className="mr-2 h-5 w-5" />}
              Borrar Todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
