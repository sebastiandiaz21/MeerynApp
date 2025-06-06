
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeyRound } from 'lucide-react';

interface PinInputFormProps {
  onAuthenticated: () => void;
  expectedPin: string;
}

export default function PinInputForm({ onAuthenticated, expectedPin }: PinInputFormProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === expectedPin) {
      setError('');
      toast({ title: 'Acceso Concedido', description: 'PIN correcto.' });
      onAuthenticated();
    } else {
      setError('PIN incorrecto. Inténtalo de nuevo.');
      setPin('');
      toast({ title: 'Error de Acceso', description: 'PIN incorrecto.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="font-headline text-2xl">Acceso de Administrador</CardTitle>
          <CardDescription>Ingresa el PIN para continuar.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin" className="sr-only">PIN</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ingresa tu PIN de 4 dígitos"
                maxLength={4}
                className="text-center text-lg tracking-widest"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Ingresar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
