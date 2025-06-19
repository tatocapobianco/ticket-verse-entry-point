
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    dni: '',
    password: '',
    name: '',
    organizationName: ''
  });

  const handleAuth = () => {
    console.log('Autenticando usuario:', { ...formData, isLogin });
    
    // Validación básica
    if (isLogin) {
      if (!formData.email && !formData.dni) {
        toast.error('Ingresa tu email o DNI');
        return;
      }
      if (!formData.password) {
        toast.error('Ingresa tu contraseña');
        return;
      }
    } else {
      if (!formData.name || !formData.email || !formData.dni || !formData.password) {
        toast.error('Completa todos los campos obligatorios');
        return;
      }
    }
    
    // Simulamos autenticación exitosa
    localStorage.setItem('userId', '1');
    localStorage.setItem('userName', formData.name || formData.email || formData.dni);
    localStorage.setItem('userEmail', formData.email);
    localStorage.setItem('userDni', formData.dni);
    
    toast.success(isLogin ? '¡Sesión iniciada!' : '¡Registro exitoso!');
    
    // Redirigir a la página de bienvenida
    navigate('/welcome');
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
              {isLogin 
                ? 'Ingresa con tu email o DNI' 
                : 'Crea tu cuenta para acceder a todos los modos'
              }
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
                  <Label htmlFor="emailOrDni">Email o DNI</Label>
                  <Input
                    id="emailOrDni"
                    type="text"
                    placeholder="usuario@email.com o 12345678"
                    value={formData.email || formData.dni}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Si contiene @ es email, sino es DNI
                      if (value.includes('@')) {
                        setFormData({...formData, email: value, dni: ''});
                      } else {
                        setFormData({...formData, dni: value, email: ''});
                      }
                    }}
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
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI *</Label>
                  <Input
                    id="dni"
                    type="text"
                    placeholder="12345678"
                    value={formData.dni}
                    onChange={(e) => setFormData({...formData, dni: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Nombre de Organización (opcional)</Label>
                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="Mi Empresa de Eventos"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                  />
                  <p className="text-xs text-gray-500">Solo si planeas organizar eventos</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
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
