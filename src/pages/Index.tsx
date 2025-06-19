
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('A');
  const [formData, setFormData] = useState({
    email: '',
    dni: '',
    password: '',
    name: '',
    organizationName: ''
  });

  const handleAuth = () => {
    console.log('Autenticando usuario:', { ...formData, userType, isLogin });
    
    // Simulamos autenticación exitosa
    localStorage.setItem('userType', userType);
    localStorage.setItem('userId', '1');
    localStorage.setItem('userName', formData.name || formData.email);
    
    toast.success(isLogin ? '¡Sesión iniciada!' : '¡Registro exitoso!');
    
    // Redirigir según tipo de usuario
    switch(userType) {
      case 'A':
        navigate('/buyer-dashboard');
        break;
      case 'B':
        navigate('/scanner-dashboard');
        break;
      case 'C':
        navigate('/organizer-dashboard');
        break;
    }
  };

  const getUserTypeLabel = (type: string) => {
    switch(type) {
      case 'A': return 'Comprador de Entradas';
      case 'B': return 'Escaneador de Entradas';
      case 'C': return 'Organizador de Eventos';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TicketPro</h1>
          <p className="text-gray-600">Sistema de gestión de eventos y entradas</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </CardTitle>
            <CardDescription className="text-center">
              Accede a tu cuenta según tu tipo de usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? 'login' : 'register'} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" onClick={() => setIsLogin(true)}>
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" onClick={() => setIsLogin(false)}>
                  Registrarse
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="userType">Tipo de Usuario</Label>
                  <Select value={userType} onValueChange={setUserType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Usuario A - {getUserTypeLabel('A')}</SelectItem>
                      <SelectItem value="B">Usuario B - {getUserTypeLabel('B')}</SelectItem>
                      <SelectItem value="C">Usuario C - {getUserTypeLabel('C')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email o DNI</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="usuario@email.com o 12345678"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                
                <Button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-700">
                  Iniciar Sesión
                </Button>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="userType">Tipo de Usuario</Label>
                  <Select value={userType} onValueChange={setUserType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Usuario A - {getUserTypeLabel('A')}</SelectItem>
                      <SelectItem value="B">Usuario B - {getUserTypeLabel('B')}</SelectItem>
                      <SelectItem value="C">Usuario C - {getUserTypeLabel('C')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    type="text"
                    placeholder="12345678"
                    value={formData.dni}
                    onChange={(e) => setFormData({...formData, dni: e.target.value})}
                  />
                </div>
                
                {userType === 'C' && (
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Nombre de Organización</Label>
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="Mi Empresa de Eventos"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                
                <Button onClick={handleAuth} className="w-full bg-green-600 hover:bg-green-700">
                  Registrarse
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
