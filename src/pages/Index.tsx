import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

// Only allow same-origin relative paths as post-auth destinations.
function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = safeNext(searchParams.get('next'));
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    dni: '',
    password: '',
    confirmPassword: '',
  });

  // If already signed in, jump straight to the destination.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) navigate(nextPath ?? '/welcome', { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(nextPath ?? '/welcome', { replace: true });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      toast.error('Por favor, completa todos los campos');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email.trim(),
      password: loginData.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('¡Bienvenido a Accoro!');
    navigate(nextPath ?? '/welcome', { replace: true });
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      toast.error('Por favor, completa nombre, email y contraseña');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    const emailRedirectTo = window.location.origin + (nextPath ?? '/welcome');
    const { error } = await supabase.auth.signUp({
      email: registerData.email.trim(),
      password: registerData.password,
      options: {
        emailRedirectTo,
        data: {
          full_name: registerData.name,
          dni: registerData.dni,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('¡Cuenta creada! Revisá tu email si se pide confirmación.');
    navigate(nextPath ?? '/welcome', { replace: true });
  };

  const handleGoogleAuth = async () => {
    // The redirect_uri must be a same-origin public URL. Send users to `/` with
    // the next param preserved so onAuthStateChange lands them on the intended
    // destination once Supabase hydrates the session.
    const redirectPath = nextPath ? `/?next=${encodeURIComponent(nextPath)}` : '/';
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin + redirectPath,
    });
    if (result.error) {
      toast.error(result.error.message ?? 'No se pudo iniciar sesión con Google');
      return;
    }
    if (result.redirected) return; // browser is redirecting
    // Popup flow: session already set, listener will navigate.
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-4">
            Accoro
          </h1>
          <p className="text-muted-foreground text-lg">Tu plataforma de eventos inteligente</p>
        </div>

        <Card className="card-gradient startup-shadow border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Bienvenido</CardTitle>
            <CardDescription>Inicia sesión o crea tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6 space-y-4">
                <Button onClick={handleGoogleAuth} variant="outline" className="w-full border-border hover:bg-secondary/50">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="tu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="bg-secondary/50 border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="bg-secondary/50 border-border" />
                </div>
                <Button onClick={handleLogin} disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {loading ? 'Ingresando…' : 'Iniciar Sesión'}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="mt-6 space-y-4">
                <Button onClick={handleGoogleAuth} variant="outline" className="w-full border-border hover:bg-secondary/50">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Registrarse con Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">O regístrate con</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input id="name" type="text" placeholder="Juan Pérez"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="bg-secondary/50 border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regEmail">Email</Label>
                  <Input id="regEmail" type="email" placeholder="tu@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="bg-secondary/50 border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI (opcional)</Label>
                  <Input id="dni" type="text" placeholder="12345678"
                    value={registerData.dni}
                    onChange={(e) => setRegisterData({ ...registerData, dni: e.target.value })}
                    className="bg-secondary/50 border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Contraseña</Label>
                  <Input id="registerPassword" type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="bg-secondary/50 border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input id="confirmPassword" type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="bg-secondary/50 border-border" />
                </div>
                <Button onClick={handleRegister} disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {loading ? 'Creando…' : 'Crear Cuenta'}
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
