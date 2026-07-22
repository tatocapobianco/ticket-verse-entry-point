
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, QrCode } from 'lucide-react';
import { toast } from 'sonner';

const ScannerAccess = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    eventNumber: '',
    accessKey: ''
  });

  const handleAccess = () => {
    console.log('Accediendo al modo escaneador:', formData);
    
    if (!formData.eventNumber || !formData.accessKey) {
      toast.error('Completa todos los campos');
      return;
    }
    
    // Simulamos validación del evento y clave
    // En una implementación real, aquí se validaría contra la base de datos
    const isValidAccess = formData.eventNumber.length > 0 && formData.accessKey.length > 0;
    
    if (isValidAccess) {
      // Guardamos los datos del evento autorizado
      localStorage.setItem('authorizedEventNumber', formData.eventNumber);
      localStorage.setItem('authorizedEventKey', formData.accessKey);
      
      toast.success('Acceso autorizado al evento');
      navigate('/scanner-dashboard');
    } else {
      toast.error('Número de evento o clave incorrectos');
    }
  };

  const handleGoBack = () => {
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="text-center">
          <QrCode className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Acceso de Escaneador</h1>
          <p className="text-muted-foreground">Ingresa los datos del evento para acceder al modo escaneador</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Autorización de Evento</CardTitle>
            <CardDescription>
              Solo podrás escanear entradas del evento autorizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventNumber">Número de Evento</Label>
              <Input
                id="eventNumber"
                type="text"
                placeholder="Ej: EVT001"
                value={formData.eventNumber}
                onChange={(e) => setFormData({...formData, eventNumber: e.target.value.toUpperCase()})}
              />
              <p className="text-xs text-muted-foreground">Proporcionado por el organizador del evento</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accessKey">Clave de Acceso</Label>
              <Input
                id="accessKey"
                type="password"
                placeholder="••••••••"
                value={formData.accessKey}
                onChange={(e) => setFormData({...formData, accessKey: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Clave secreta del evento</p>
            </div>
            
            <Button onClick={handleAccess} className="w-full bg-primary hover:bg-primary/90">
              Acceder al Modo Escaneador
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScannerAccess;
