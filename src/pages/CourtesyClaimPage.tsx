
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CourtesyClaimPage = () => {
  const { courtesyCode } = useParams();
  const navigate = useNavigate();
  const [claimStep, setClaimStep] = useState('claim');
  const [claimData, setClaimData] = useState({
    identifierType: 'email',
    email: '',
    dni: ''
  });

  // Mock data de la cortesía
  const courtesyData = {
    eventName: 'Concierto Rock Nacional',
    ticketType: 'Invitados VIP',
    available: 2,
    total: 4,
    isValid: true
  };

  const handleClaim = () => {
    if (claimData.identifierType === 'email' && !claimData.email) {
      toast.error('Por favor, ingresa tu email');
      return;
    }
    if (claimData.identifierType === 'dni' && !claimData.dni) {
      toast.error('Por favor, ingresa tu DNI');
      return;
    }

    // Verificar si el usuario está registrado
    const isRegistered = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isRegistered) {
      // Usuario registrado - obtiene el ticket directamente
      setClaimStep('success');
      toast.success('¡Cortesía reclamada exitosamente!');
    } else {
      // Usuario no registrado - necesita crear cuenta
      setClaimStep('register');
    }
  };

  const handleRegister = () => {
    // Simular registro
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', claimData.email);
    localStorage.setItem('userName', claimData.email);
    
    setClaimStep('success');
    toast.success('¡Cuenta creada y cortesía reclamada!');
  };

  if (!courtesyData.isValid) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center pt-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Link inválido</h2>
            <p className="text-muted-foreground mb-4">
              Este link de cortesía no es válido o ya fue utilizado.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (courtesyData.available === 0) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center pt-6">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Cortesías agotadas</h2>
            <p className="text-muted-foreground mb-4">
              Todas las cortesías disponibles para este evento ya fueron reclamadas.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Explorar eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (claimStep === 'success') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">¡Cortesía Reclamada!</h2>
            <p className="text-muted-foreground mb-4">
              Tu entrada de cortesía para <strong>{courtesyData.eventName}</strong> está lista.
            </p>
            <div className="bg-primary/5 p-4 rounded-lg mb-4 border border-primary/20">
              <div className="text-sm text-primary font-medium mb-2">🎫 Tu ticket:</div>
              <div className="text-sm text-primary">
                <strong>{courtesyData.ticketType}</strong><br/>
                Tu ticket con código QR está disponible en la sección "Mis Tickets" de la aplicación.
              </div>
            </div>
            <Button onClick={() => navigate('/buyer-dashboard')} className="w-full">
              Ver Mis Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (claimStep === 'register') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center mb-2">
              <Gift className="h-6 w-6 mr-2 text-primary" />
              Crear Cuenta
            </CardTitle>
            <CardDescription>
              Necesitas crear una cuenta para recibir tu cortesía
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                placeholder="Juan Pérez"
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="bg-secondary/50 border-border"
              />
            </div>
            <Button onClick={handleRegister} className="w-full">
              Crear cuenta y reclamar cortesía
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Al continuar, aceptas nuestros términos y condiciones
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center mb-2">
            <Gift className="h-6 w-6 mr-2 text-primary" />
            Cortesía Disponible
          </CardTitle>
          <CardDescription>
            Completá tus datos para recibir tu entrada de cortesía
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="text-sm text-primary font-medium mb-1">Evento:</div>
            <div className="text-sm text-primary font-semibold">{courtesyData.eventName}</div>
            <div className="text-sm text-primary">Tipo: {courtesyData.ticketType}</div>
            <div className="text-xs text-primary mt-2">
              Disponibles: {courtesyData.available} de {courtesyData.total}
            </div>
          </div>

          <Tabs value={claimData.identifierType} onValueChange={(value) => setClaimData({...claimData, identifierType: value})}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="dni">DNI</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Tu email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={claimData.email}
                  onChange={(e) => setClaimData({...claimData, email: e.target.value})}
                  className="bg-secondary/50 border-border"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="dni" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="dni">Tu DNI</Label>
                <Input
                  id="dni"
                  placeholder="12345678"
                  value={claimData.dni}
                  onChange={(e) => setClaimData({...claimData, dni: e.target.value})}
                  className="bg-secondary/50 border-border"
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleClaim} className="w-full">
            Reclamar Cortesía
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Esta cortesía es personal e intransferible
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourtesyClaimPage;
