import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    dni: '', 
    password: '',
    confirmPassword: ''
  });

  const handleLogin = () => {
    if (!loginData.identifier || !loginData.password) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    // Simular autenticación
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', loginData.identifier);
    localStorage.setItem('userName', loginData.identifier);
    
    toast.success('¡Bienvenido a Accoro!');
    navigate('/welcome');
  };

  const handleRegister = () => {
    if (!registerData.name || !registerData.email || !registerData.dni || !registerData.password) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Simular registro
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', registerData.email);
    localStorage.setItem('userName', registerData.name);
    localStorage.setItem('userDNI', registerData.dni);
    
    toast.success('¡Cuenta creada exitosamente!');
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-4">
            Accoro
          </h1>
          <p className="text-muted-foreground text-lg">
            Tu plataforma de eventos inteligente
          </p>
        </div>

        <Card className="card-gradient startup-shadow border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Bienvenido</CardTitle>
            <CardDescription>Inicia sesión o crea tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary">
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary">
                  Registrarse
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email o DNI</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="tu@email.com o 12345678"
                    value={loginData.identifier}
                    onChange={(e) => setLoginData({...loginData, identifier: e.target.value})}
                    className="bg-secondary/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    className="bg-secondary/50 border-border"
                  />
                </div>
                <Button 
                  onClick={handleLogin} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Iniciar Sesión
                </Button>
              </TabsContent>
              
              <TabsContent value="register" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    className="bg-secondary/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="bg-secondary/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    type="text"
                    placeholder="12345678"
                    value={registerData.dni}
                    onChange={(e) => setRegisterData({...registerData, dni: e.target.value})}
                    className="bg-secondary/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Contraseña</Label>
                  <Input
                    id="registerPassword"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="bg-secondary/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    className="bg-secondary/50 border-border"
                  />
                </div>
                <Button 
                  onClick={handleRegister} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Crear Cuenta
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
