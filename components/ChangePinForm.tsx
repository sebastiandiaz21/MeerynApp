
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Removed CardFooter as it's not used directly by form
import { useToast } from '@/hooks/use-toast';

// This would ideally come from a config or props if the PIN was truly dynamic
const CURRENT_SIMULATED_ADMIN_PIN_DISPLAY = "0000"; 

export default function ChangePinForm() {
  const [newAdminPin, setNewAdminPin] = useState('');
  const [confirmNewAdminPin, setConfirmNewAdminPin] = useState('');
  const { toast } = useToast();

  const handlePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPin !== confirmNewAdminPin) {
      toast({ title: 'Error', description: 'Los nuevos PIN no coinciden.', variant: 'destructive' });
      return;
    }
    if (newAdminPin.length !== 4 || !/^\d{4}$/.test(newAdminPin)) {
      toast({ title: 'Error', description: 'El PIN debe ser de 4 dígitos numéricos.', variant: 'destructive' });
      return;
    }
    // In a real app, you would update the PIN here (e.g., call a server action)
    // For this simulation, we just show a toast. The actual ADMIN_PIN for login won't change.
    console.log('Simulated PIN change to:', newAdminPin);
    toast({ 
      title: 'Éxito (Simulado)', 
      description: `El PIN de Tutor se ha "actualizado" a ${newAdminPin} para esta simulación. El PIN de acceso real (${CURRENT_SIMULATED_ADMIN_PIN_DISPLAY}) no cambiará.` 
    });
    setNewAdminPin('');
    setConfirmNewAdminPin('');
  };

  return (
    // Removed outer Card to avoid double card when nested in TabsContent
    // The parent TabsContent can be styled or wrapped if a Card-like appearance is needed for the tab content as a whole
    // For now, this form will be directly in the Tab content area.
    // If individual card styling per tab is desired, wrap this form content in a <Card> here.
    // Re-adding Card for consistent tab content appearance
     <Card className="w-full shadow-md">
        <CardHeader>
            <CardTitle className="text-xl">Cambiar PIN de Acceso del Tutor</CardTitle>
            <CardDescription>
            Actualiza el PIN utilizado para acceder a esta sección de Tutor.
            El PIN de acceso actual para ingresar a este panel es <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{CURRENT_SIMULATED_ADMIN_PIN_DISPLAY}</code>.
            Este cambio es solo una simulación y no modificará el PIN de acceso real para el inicio de sesión.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handlePinChange} className="space-y-6 max-w-md">
            <div>
                <Label htmlFor="newAdminPinChange" className="block text-sm font-medium mb-1">Nuevo PIN de Tutor</Label>
                <Input
                id="newAdminPinChange"
                type="password"
                value={newAdminPin}
                onChange={(e) => setNewAdminPin(e.target.value)}
                placeholder="Ingresa el nuevo PIN de 4 dígitos"
                maxLength={4}
                className="text-base"
                />
            </div>
            <div>
                <Label htmlFor="confirmNewAdminPinChange" className="block text-sm font-medium mb-1">Confirmar Nuevo PIN</Label>
                <Input
                id="confirmNewAdminPinChange"
                type="password"
                value={confirmNewAdminPin}
                onChange={(e) => setConfirmNewAdminPin(e.target.value)}
                placeholder="Confirma el nuevo PIN"
                maxLength={4}
                className="text-base"
                />
            </div>
            <Button type="submit" className="w-full sm:w-auto">Cambiar PIN (Simulado)</Button>
            </form>
        </CardContent>
    </Card>
  );
}
