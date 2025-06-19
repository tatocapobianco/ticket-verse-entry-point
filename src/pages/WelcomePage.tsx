
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bienvenido/a, {userName}</h1>
          <p className="text-gray-600">Selecciona el modo en el que deseas ingresar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleModeSelection('buyer')}>
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <CardTitle>Mis Eventos</CardTitle>
              <CardDescription>Ver y comprar entradas para eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Ir a mis eventos
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleModeSelection('organizer')}>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <CardTitle>Modo Organizador</CardTitle>
              <CardDescription>Gestionar eventos, entradas y cortesías</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Modo organizador
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleModeSelection('scanner')}>
            <CardHeader className="text-center">
              <QrCode className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <CardTitle>Modo Escaneador</CardTitle>
              <CardDescription>Escanear QR en la puerta del evento</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Modo escaneador
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Requiere autorización del evento
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={handleLogout} className="text-gray-600">
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
