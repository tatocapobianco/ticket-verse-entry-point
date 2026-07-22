
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, QrCode, Users } from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Usuario';

  const handleModeSelection = (mode: string) => {
    localStorage.setItem('currentMode', mode);
    
    switch(mode) {
      case 'buyer':
        navigate('/buyer-dashboard');
        break;
      case 'organizer':
        navigate('/organizer-dashboard');
        break;
      case 'scanner':
        navigate('/scanner-access');
        break;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r brand-gradient-text mb-2">
            Bienvenido/a, {userName}
          </h1>
          <p className="text-muted-foreground text-lg">¿Cómo quieres usar Cupo hoy?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="card-gradient startup-shadow border-border/50 hover:border-primary/50 transition-all cursor-pointer group" 
            onClick={() => handleModeSelection('buyer')}
          >
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
              <CardTitle className="text-xl">Mis Eventos</CardTitle>
              <CardDescription>Descubre y compra entradas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Ir a mis eventos
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-gradient startup-shadow border-border/50 hover:border-green-500/50 transition-all cursor-pointer group" 
            onClick={() => handleModeSelection('organizer')}
          >
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-green-500 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-xl">Modo Organizador</CardTitle>
              <CardDescription>Crea y gestiona eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Modo organizador
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-gradient startup-shadow border-border/50 hover:border-purple-500/50 transition-all cursor-pointer group" 
            onClick={() => handleModeSelection('scanner')}
          >
            <CardHeader className="text-center">
              <QrCode className="h-12 w-12 mx-auto mb-4 text-purple-500 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-xl">Modo Escaneador</CardTitle>
              <CardDescription>Valida entradas en eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                Modo escaneador
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Requiere autorización del evento
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
