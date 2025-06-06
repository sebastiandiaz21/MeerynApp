
'use client';

import { useState, useEffect } from 'react';
import AdminWordList from '@/components/AdminWordList';
import PinInputForm from '@/components/PinInputForm';
import ChangePinForm from '@/components/ChangePinForm';
import KidStatistics from '@/components/KidStatistics'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks, KeyRound, BarChart3, BookUser } from 'lucide-react'; // Added BookUser

const ADMIN_PIN = "0000"; 

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingPinState, setIsLoadingPinState] = useState(true);

  useEffect(() => {
    const sessionAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (sessionAuthenticated) {
      setIsAuthenticated(true);
    }
    setIsLoadingPinState(false);
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('adminAuthenticated', 'true');
  };

  if (isLoadingPinState) {
    return (
      <div className="container mx-auto py-10 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <BookUser className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-10 px-4">
        <PinInputForm onAuthenticated={handleAuthenticated} expectedPin={ADMIN_PIN} />
      </div>
    );
  }

  const tabItems = [
    { value: "word-management", label: "Administración de Palabras", icon: ListChecks },
    { value: "kid-stats", label: "Estadísticas del Niño", icon: BarChart3 },
    { value: "pin-change", label: "Cambio de PIN", icon: KeyRound },
  ];

  return (
    <div className="container mx-auto py-6 sm:py-10 px-2 sm:px-4">
      <Card className="w-full shadow-xl rounded-xl">
        <CardHeader className="text-center pt-8 pb-4">
          <BookUser className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3" />
          <CardTitle className="font-headline text-3xl sm:text-4xl text-shadow-playful">Panel del Tutor</CardTitle>
          <CardDescription className="text-md sm:text-lg text-muted-foreground">
            Gestiona el contenido, revisa el progreso y ajusta la configuración.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="word-management" className="w-full">
            <TabsList className="flex flex-wrap sm:grid sm:grid-cols-3 justify-start sm:justify-items-stretch mb-4 sm:mb-6 rounded-lg p-1.5 bg-muted">
              {tabItems.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5 flex-grow data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md"
                  >
                    <Icon className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <TabsContent value="word-management">
              <AdminWordList />
            </TabsContent>
            <TabsContent value="pin-change">
              <ChangePinForm />
            </TabsContent>
            <TabsContent value="kid-stats">
              <KidStatistics />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
